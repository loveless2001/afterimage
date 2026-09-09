'use strict';
// Physical navigation audit. Run with --plan-only for fast layout coverage;
// default also walks to every object through real Playwright keyboard events.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const M = require('../state-3d.js');
const Story = require('../chapters-3d.js');
const { chromium } = require('@playwright/test');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const R=.285, STEP=.30, REACH=2.65;
const artifactDir=process.env.AFTERIMAGE_3D_ARTIFACTS || path.join(os.tmpdir(),'afterimage-engine-3d');
const BODY_CACHE=new WeakMap();
function bodies(scene){if(!BODY_CACHE.has(scene))BODY_CACHE.set(scene,[...scene.solids,...scene.objects.filter(o=>o.solid!==false),...scene.decor.filter(o=>o.solid===true)].filter(o=>o.solid!==false));return BODY_CACHE.get(scene);}
function dimensions(o){const c=Math.abs(Math.cos(o.yaw||0)),sn=Math.abs(Math.sin(o.yaw||0));return {w:c*o.w+sn*o.d,d:sn*o.w+c*o.d};}
function blocked(scene,x,z){
 const b=scene.bounds;if(x<b.minX+R||x>b.maxX-R||z<b.minZ+R||z>b.maxZ-R)return true;
 return bodies(scene).some(o=>{if(o.y-o.h/2>1.75||o.y+o.h/2<.15)return false;const {w,d}=dimensions(o),dx=x-clamp(x,o.x-w/2,o.x+w/2),dz=z-clamp(z,o.z-d/2,o.z+d/2);return dx*dx+dz*dz<R*R;});
}
function rayBox(origin,dir,o,expand=0){let lo=0,hi=Infinity;const {w,d}=dimensions(o),center=[o.x,o.y,o.z],size=[w,o.h,d];for(let i=0;i<3;i++){const min=center[i]-size[i]/2-expand,max=center[i]+size[i]/2+expand;if(Math.abs(dir[i])<1e-5){if(origin[i]<min||origin[i]>max)return Infinity;}else{let a=(min-origin[i])/dir[i],b=(max-origin[i])/dir[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;}}return lo;}
function aim(p,o){const dy=clamp(1.35,o.y-o.h/2+.10,o.y+o.h/2-.10)-1.6,dx=o.x-p.x,dz=o.z-p.z;return {yaw:Math.atan2(dx,-dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))};}
function visible(scene,p,o){
 const a=aim(p,o),cp=Math.cos(a.pitch),dir=[Math.sin(a.yaw)*cp,Math.sin(a.pitch),-Math.cos(a.yaw)*cp],origin=[p.x,1.6,p.z],hit=rayBox(origin,dir,o,.11);
 if(hit>REACH)return false;
 return !bodies(scene).some(s=>s!==o&&rayBox(origin,dir,s)<hit+.04) && !scene.objects.some(other=>other!==o&&other.interactive!==false&&rayBox(origin,dir,other,.11)<hit+.18);
}
function lineClear(scene,a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.07);for(let i=1;i<=n;i++)if(blocked(scene,a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
function route(scene,start,target){
 const bounds=scene.bounds,cols=Math.floor((bounds.maxX-bounds.minX)/STEP)+1,rows=Math.floor((bounds.maxZ-bounds.minZ)/STEP)+1;
 const point=n=>({x:bounds.minX+(n%cols)*STEP,z:bounds.minZ+Math.floor(n/cols)*STEP});
 let nearest=-1,best=Infinity;
 for(let n=0;n<cols*rows;n++){const p=point(n),d=Math.hypot(p.x-start.x,p.z-start.z);if(d<best&&!blocked(scene,p.x,p.z)&&lineClear(scene,start,p)){nearest=n;best=d;}}
 assert(nearest>=0,'No walkable grid start');
 const visited=new Set([nearest]),parents=new Map(),queue=[nearest];let found=-1;
 for(let i=0;i<queue.length;i++){
  const n=queue[i],p=point(n);if(target.physical ? Math.hypot(p.x-target.x,p.z-target.z)<.18 : visible(scene,p,target)){found=n;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=n%cols+dx,z=Math.floor(n/cols)+dz;if(x<0||x>=cols||z<0||z>=rows)continue;const next=z*cols+x;if(visited.has(next))continue;const np=point(next);if(blocked(scene,np.x,np.z)||!lineClear(scene,p,np))continue;visited.add(next);parents.set(next,n);queue.push(next);
  }
 }
 assert(found>=0,`No physically reachable line of sight to ${target.id} (${target.x},${target.z})`);
 const raw=[];for(let n=found;n!==undefined;n=parents.get(n))raw.push(point(n));raw.reverse();
 const result=[start];let from=0;const nodes=[start,...raw];while(from<nodes.length-1){let to=from+1;while(to+1<nodes.length&&lineClear(scene,nodes[from],nodes[to+1]))to++;result.push(nodes[to]);from=to;}
 return result.slice(1);
}
function variants(){
 const cases=M.chapters.map(chapter=>({name:chapter,state:chapter==='prologue'?M.fresh():M.preview(chapter)}));
 cases.find(c=>c.name==='transit').state.flags.bridge=true;
 const closed=M.preview('transit');cases.push({name:'transit-closed-bridge',state:closed,planOnly:true});
 for(const chapter of M.chapters){const s=chapter==='prologue'?M.fresh():M.preview(chapter);s.world.siltReturned=true;s.world.bridgeCrossed=true;if(chapter==='transit'){s.flags.bridge=true;}if(chapter==='garden'){s.flags.seat=true;s.flags.shade=true;s.flags.receiver=true;}cases.push({name:chapter+'-returned',state:s,planOnly:true});}
 const archive=M.fresh();archive.world.mothPresent=false;archive.world.flowerPresent=false;cases.push({name:'archive-cleared',state:archive,planOnly:true});
 const flower=M.fresh();flower.world.flowerPlaced=true;cases.push({name:'archive-flower-placed',state:flower,planOnly:true});
 const release=M.preview('release');release.ending='closeall';release.world.residentsErased=true;cases.push({name:'release-empty',state:release,planOnly:true});return cases;
}
async function run(){
 const cases=variants();for(const item of cases){item.scene=Story.world(item.state);let at=item.scene.spawn;for(const o of item.scene.objects.filter(o=>o.interactive!==false)){const points=route(item.scene,at,o);at=points.at(-1)||at;}console.log('LAYOUT PASS '+item.name+' '+item.scene.objects.filter(o=>o.interactive!==false).length+' interactive objects');}
 const closedScene=cases.find(c=>c.name==='transit-closed-bridge').scene;
 assert.equal(closedScene.objects.find(o=>o.id==='seat').interactive,false,'Closed bridge must disable platform sitting');
 assert.throws(()=>route(closedScene,closedScene.spawn,{id:'closed platform',x:4.3,z:-3.6,physical:true}),/No physically reachable/,'Closed gate has a walkable bypass');
 route(cases.find(c=>c.name==='transit').scene,closedScene.spawn,{id:'open platform',x:4.3,z:-3.6,physical:true});
 console.log('GATE PASS closed platform inaccessible; open bridge walkable; closed seat disabled');
 if(process.argv.includes('--plan-only'))return;
 fs.mkdirSync(artifactDir,{recursive:true});const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1100,height:720},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{width:100%;height:100%;touch-action:none}</style><canvas></canvas>');
 await page.addScriptTag({path:path.resolve(__dirname,'../engine-3d.js')});
 await page.evaluate(()=>{window.interactions=[];window.world=Afterimage3DWorld.create(document.querySelector('canvas'),{reducedMotion:true,onInteract:id=>interactions.push(id),onError:message=>{throw Error(message)}})});
 async function camera(a){await page.evaluate(a=>{const p=world.getPosition();const yaw=Math.atan2(Math.sin(a.yaw-p.yaw),Math.cos(a.yaw-p.yaw));world.look(yaw/.0025,(p.pitch-a.pitch)/.0025)},a);}
 async function walk(points,label){
  for(const target of points){let stalled=0;for(let i=0;i<30;i++){
   const p=await page.evaluate(()=>world.getPosition()),distance=Math.hypot(target.x-p.x,target.z-p.z);if(distance<.065)break;
   await camera({yaw:Math.atan2(target.x-p.x,-(target.z-p.z)),pitch:0});await page.keyboard.down('KeyW');await page.waitForTimeout(Math.max(35,Math.min(700,(distance-.035)/2.25*1000)));await page.keyboard.up('KeyW');
   const next=await page.evaluate(()=>world.getPosition());if(Math.hypot(next.x-p.x,next.z-p.z)<.009)stalled++;else stalled=0;
   assert(stalled<4,`${label}: keyboard route stalled at ${JSON.stringify(next)} toward ${JSON.stringify(target)}`);
   if(i===29)throw Error(label+': route did not converge');
  }}
 }
 for(const item of cases.filter(c=>!c.planOnly&&!process.argv.includes('--inputs-only'))){
  await page.evaluate(scene=>{world.load(scene);world.pause(false);interactions=[]},item.scene);
  for(const o of item.scene.objects.filter(o=>o.interactive!==false)){
   const start=await page.evaluate(()=>world.getPosition()),points=route(item.scene,start,o);await walk(points,item.name+'/'+o.id);
   const p=await page.evaluate(()=>world.getPosition());await camera(aim(p,o));
   const focus=await page.evaluate(()=>world.getDebugState().focused);assert.equal(focus,o.id,item.name+': focus '+o.id);
   await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>interactions.at(-1)),o.id,item.name+': E '+o.id);
   console.log('WALK PASS '+item.name+'/'+o.id+' @ '+p.x.toFixed(2)+','+p.z.toFixed(2));
  }
  await page.screenshot({path:path.join(artifactDir,item.name+'-3d.png')});
 }
 // A rotated narrow cabinet must stop north/south travel on its long axis,
 // while leaving the east-side lane open. These fail when yaw is only visual.
 const rotated={bounds:{minX:-5,maxX:5,minZ:-5,maxZ:5},spawn:{x:0,z:3,yaw:0},solids:[],decor:[],objects:[{id:'rotated',label:'Rotated cabinet',kind:'terminal',x:0,y:.9,z:0,w:2,h:1.8,d:.4,yaw:Math.PI/2,color:'#58877d'}]};
 await page.evaluate(scene=>{world.load(scene);world.pause(false)},rotated);await page.keyboard.down('KeyW');await page.waitForTimeout(1150);await page.keyboard.up('KeyW');
 const stopped=await page.evaluate(()=>world.getPosition());assert(stopped.z>1.23&&stopped.z<1.40,'Rotated long-axis collision footprint is wrong');
 await page.evaluate(scene=>{world.load(scene,{x:.85,z:3,yaw:0});world.pause(false)},rotated);await page.keyboard.down('KeyW');await page.waitForTimeout(1450);await page.keyboard.up('KeyW');
 assert((await page.evaluate(()=>world.getPosition())).z<.1,'Unrotated ghost collider blocks the cabinet side lane');
 await page.evaluate(scene=>{world.load(scene,{x:2,z:0,yaw:-Math.PI/2});world.pause(false)},rotated);assert.equal(await page.evaluate(()=>world.getDebugState().focused),'rotated','Rotated object cannot be targeted from its front');
 await page.screenshot({path:path.join(artifactDir,'rotated-cabinet-3d.png')});
 const archive=cases.find(c=>c.name==='prologue').scene,chair=archive.objects.find(o=>o.id==='seat'),moth=archive.objects.find(o=>o.id==='moth');
 await page.evaluate(scene=>{world.load(scene);world.pause(false)},archive);
 await walk(route(archive,archive.spawn,chair),'Archive chair approach');await camera(aim(await page.evaluate(()=>world.getPosition()),chair));await page.keyboard.press('KeyE');
 assert.equal(await page.evaluate(()=>interactions.at(-1)),'seat','Archive chair cannot be used');
 await page.evaluate(seat=>world.sit(seat),chair.seat);const seated=await page.evaluate(()=>world.getDebugState());assert(seated.seated,'Seat camera did not activate');assert.equal(seated.focused,'moth','Seated view faces the chair back or misses Moth');
 const toMoth={x:moth.x-seated.position.x,z:moth.z-seated.position.z};assert(Math.sin(seated.position.yaw)*toMoth.x-Math.cos(seated.position.yaw)*toMoth.z>1,'Seated view does not face Moth');
 await page.screenshot({path:path.join(artifactDir,'archive-seated-3d.png')});
 await page.keyboard.down('KeyS');await page.waitForTimeout(140);await page.keyboard.up('KeyS');assert.equal(await page.evaluate(()=>world.getDebugState().seated),false,'Movement does not stand from rotated chair');
 await page.evaluate(scene=>{world.load(scene,{x:-4.3,z:3.5,yaw:Math.atan2(3.9,3.7),pitch:-.08});world.pause(false)},archive);await page.screenshot({path:path.join(artifactDir,'archive-arrangement-3d.png')});
 console.log('ROTATION PASS real footprint, clear side lane, front targeting, and seated view of Moth');
 // Capture each final social arrangement from a standing position and from
 // the actual authored seat. The center ray must see the companion, not the seat.
 const viewCases=[
  {name:'prologue',source:'prologue',target:'moth',at:{x:-4.3,z:3.5},toward:{x:-.4,z:-.2}},
  {name:'transit',source:'transit',target:'silt',at:{x:5.1,z:-1.8},toward:{x:4.35,z:-3.75}},
  {name:'garden',source:'garden-returned',target:'fern',at:{x:-.7,z:-2.0},toward:{x:-3.4,z:-4}},
  {name:'chorus',source:'chorus',target:'counter',at:{x:.8,z:-1.7},toward:{x:-2.3,z:-2.75}},
  {name:'release',source:'release',target:'fern',at:{x:-1.25,z:2.2},toward:{x:-3.65,z:2.05}}
 ];
 for(const v of viewCases){
  const scene=cases.find(c=>c.name===v.source).scene,seat=scene.objects.find(o=>o.id==='seat'),standing={...v.at,yaw:Math.atan2(v.toward.x-v.at.x,-(v.toward.z-v.at.z)),pitch:-.10};
  await page.evaluate(({scene,standing})=>{world.load(scene,standing);world.pause(false)},{scene,standing});
  await page.screenshot({path:path.join(artifactDir,v.name+'-standing-final-3d.png')});
  await page.evaluate(position=>world.sit(position),seat.seat);
  assert.equal(await page.evaluate(()=>world.getDebugState().focused),v.target,v.name+': seated view misses companion or targets chair');
  await page.screenshot({path:path.join(artifactDir,v.name+'-seated-final-3d.png')});
  console.log('VIEW PASS '+v.name+' standing and seated; facing '+v.target);
 }
 // Walk into the closed gate and verify the real movement controller stops.
 await page.evaluate(scene=>{world.load(scene);world.pause(false)},closedScene);
 await walk(route(closedScene,closedScene.spawn,{id:'gate approach',x:2.1,z:-1.8,physical:true}),'closed gate approach');
 await camera({yaw:Math.PI/2,pitch:0});await page.keyboard.down('KeyW');await page.waitForTimeout(800);await page.keyboard.up('KeyW');
 assert((await page.evaluate(()=>world.getPosition())).x<2.44,'Keyboard crossed closed bridge gate');
 await page.keyboard.press('PageDown',{delay:120});assert((await page.evaluate(()=>world.getPosition())).pitch<0,'Keyboard could not look down');await page.keyboard.press('Home');assert.equal((await page.evaluate(()=>world.getPosition())).pitch,0);
 console.log('INPUT PASS closed gate collision and keyboard vertical look');
 // Mobile controls feed the exact same movement and look APIs as keyboard input.
 await page.setViewportSize({width:390,height:844});await page.evaluate(scene=>{world.load(scene);world.pause(false);world.look(-Math.PI/2/.0025,0);world.setMove(1,0)},cases[0].scene);
 const mobileBefore=await page.evaluate(()=>world.getPosition());await page.waitForTimeout(500);await page.evaluate(()=>world.setMove(0,0));const mobileAfter=await page.evaluate(()=>world.getPosition());assert(mobileAfter.x<mobileBefore.x-.5,'Mobile pad did not move');
 await page.evaluate(()=>world.look(100,40));const mobileLook=await page.evaluate(()=>world.getPosition());assert(Math.abs(mobileLook.yaw-mobileAfter.yaw)>.1&&mobileLook.pitch<mobileAfter.pitch,'Mobile look did not rotate');
 const beforeDrag=await page.evaluate(()=>world.getPosition());await page.mouse.move(190,400);await page.mouse.down();await page.mouse.move(250,430,{steps:4});await page.mouse.up();const afterDrag=await page.evaluate(()=>world.getPosition());assert(afterDrag.yaw!==beforeDrag.yaw&&afterDrag.pitch!==beforeDrag.pitch,'Drag fallback did not move camera');
 await page.screenshot({path:path.join(artifactDir,'mobile-3d.png')});
 await page.evaluate(()=>{world.pause(true);world.setMove(1,0)});const stop=await page.evaluate(()=>world.getPosition());await page.keyboard.down('KeyW');await page.waitForTimeout(120);await page.keyboard.up('KeyW');assert.deepEqual(await page.evaluate(()=>world.getPosition()),stop,'Paused input moved camera');
 assert.deepEqual(errors,[]);await page.evaluate(()=>world.destroy());console.log((process.argv.includes('--inputs-only')?'ENGINE INPUT PASS':'ENGINE PASS: all five rooms traversed via keyboard')+'; gate collision, mobile, pause, and zero page errors. Screenshots: '+artifactDir);
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1});
