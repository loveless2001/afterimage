'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const M=require('../state-3d.js');
const Story=require('../chapters-3d.js');
const base=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index-3d.html')).href;
const output=path.join(os.tmpdir(),'afterimage-environments');fs.mkdirSync(output,{recursive:true});
const errors=[],external=[];let browser;
function repair(state,id){for(let index=0;index<3;index++)if(M.puzzles[id].target&(1<<index))state=M.act(state,'turn',{id,index});return M.act(state,id);}
let transit=M.preview('transit');for(const a of ['brim','ledger'])transit=M.act(transit,a);transit=repair(transit,'lift');transit=M.reset(transit,['greeting','sequence']);
let garden=M.preview('garden');for(const a of ['fern','morning','brim','seat'])garden=M.act(garden,a);garden=repair(garden,'shade');garden=repair(garden,'receiver');garden=M.act(garden,'listen');
let chorus=M.act(M.preview('chorus'),'mode','local');for(const n of [0,1,2])chorus=M.act(chorus,'voice',n);
let release=M.preview('release');for(const n of [0,1,2])release=M.act(release,'inspect',n);release=M.act(release,'counterOffer');
const views={transit:{x:1.4,z:-1.7,yaw:.59,pitch:-.06},garden:{x:-.55,z:-1.4,yaw:-.58,pitch:-.12},chorus:{x:0,z:2.9,yaw:0,pitch:-.08},release:{x:1.2,z:3.4,yaw:-.32,pitch:-.02}};
async function make(state,width=1280,motion='reduce'){
 const context=await browser.newContext({viewport:{width,height:width<750?844:800},reducedMotion:motion,isMobile:width<750,hasTouch:width<750});
 await context.addInitScript(()=>{
  let api;Object.defineProperty(window,'Afterimage3DWorld',{get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{const engine=create(canvas,options);window.environmentTest={engine,options};return engine;};}});
  window.environmentAudio={voices:[],context:null};const Native=window.AudioContext;
  window.AudioContext=class extends Native{constructor(...args){super(...args);environmentAudio.context=this;const create=this.createOscillator.bind(this);this.createOscillator=()=>{const node=create(),connect=node.connect.bind(node);node.connect=(destination,...rest)=>{if(destination.gain)environmentAudio.voices.push({node,gain:destination.gain});return connect(destination,...rest);};return node;};}};
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!process.env.GAME_URL)external.push(r.url());});
 await p.goto(new URL(state.chapter+'-3d.html',base).href);await p.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[M.key,state]);await p.reload();await p.locator('#start').click();
 assert.equal(await p.locator('#fatal').isVisible(),false);if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');return p;
}
async function frame(p,state,name,width){
 await p.evaluate(([state,position])=>{environmentTest.engine.pause(true);environmentTest.engine.load(Afterimage3DChapters.world(state),position);},[state,views[state.chapter]]);
 await p.screenshot({path:path.join(output,name+'-'+width+'.png'),style:'#hud,#mobile{visibility:hidden!important}'});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await p.evaluate(()=>document.getElementById('world').getContext('webgl').getError()),0);
}
async function visit(p,id){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');await p.evaluate(id=>environmentTest.options.onInteract(id),id);}
const click=(p,label)=>p.getByRole('button',{name:new RegExp('^'+label)}).click();
const gain=(p,hz)=>p.evaluate(hz=>environmentAudio.voices.find(v=>v.node.frequency.value===hz).gain.value,hz);
(async()=>{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,390,320]){
  for(const [chapter,ready] of [['transit',transit],['garden',garden],['chorus',chorus],['release',release]]){
   const initial=M.preview(chapter),p=await make(initial,width);await frame(p,initial,chapter+'-arrival',width);await frame(p,ready,chapter+'-working',width);
   if(chapter==='transit'){
    await frame(p,M.act(ready,'bridge'),'transit-bridge',width);
    await frame(p,M.act(M.act(ready,'deliver'),'finish','both'),'transit-shelf',width);
   }
   if(chapter==='release')for(const ending of ['complete','witness','remain','closeall'])await frame(p,M.act(ready,'finish',ending),'release-'+ending,width);
   if(chapter==='garden'){
    const changed=await p.evaluate(([state,position])=>{
     const world=Afterimage3DChapters.world(state),gl=document.getElementById('world').getContext('webgl');
     const pixels=w=>{environmentTest.engine.load(w,position);const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
     const shaded=pixels(world),clear=pixels({...world,lighting:{...world.lighting,canopy:[0,0,-1,-1]}});let count=0;
     for(let i=0;i<clear.length;i+=4)if(clear[i]-shaded[i]>12)count++;return count;
    },[ready,views.garden]);assert.ok(changed>300,'The slats must cast visible shadows onto the court');
   }
   await p.context().close();
  }
 }
 // Reduced motion freezes foliage and its dappled light, while ordinary motion remains subtle.
 for(const motion of ['reduce','no-preference']){
  const p=await make(garden,390,motion);await frame(p,garden,'garden-'+motion,390);await p.evaluate(()=>environmentTest.engine.pause(false));
  const before=await p.locator('#world').screenshot();await p.waitForTimeout(600);const after=await p.locator('#world').screenshot();
  assert.equal(before.equals(after),motion==='reduce');await p.context().close();
 }
 // Spending the lift component stops its motor, including when sound was already on.
 const lift=await make(transit);await lift.locator('#sound').click();assert.ok(await gain(lift,74)>.003);
 await visit(lift,'dispatch');await click(lift,'Prepare the public delivery');await click(lift,'Build the shelf and keep both');assert.ok(await gain(lift,74)>.003,'Review must leave the motor running');
 await click(lift,'Build the shelf');await lift.waitForTimeout(1000);assert.ok(await gain(lift,74)<.00001);await lift.context().close();
 for(const ending of ['complete','witness','remain','closeall']){
  const p=await make(release);await p.locator('#sound').click();assert.ok(await gain(p,98)>.003);
  await visit(p,ending==='closeall'?'close-all':ending);await click(p,'Enact '+(ending==='closeall'?'literal closure':ending));
  assert.ok(await gain(p,98)>.003,'Review must not silence the carrier');await click(p,ending==='closeall'?'Close all and erase residents':'Enact the plan');
  await p.waitForTimeout(1000);assert.equal(await gain(p,98)>.001,ending==='remain');
  await p.locator('#dialog-sound').click();assert.equal(await p.evaluate(()=>environmentAudio.context.state),'suspended');await p.context().close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('ENVIRONMENTS PASS: four district atmospheres, working shade shadows, all Release endings, motion preferences, motor/carrier audio consequences, mobile layouts, and offline rendering.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>browser?.close());
