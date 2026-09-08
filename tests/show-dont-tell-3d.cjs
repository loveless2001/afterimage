// Visual evidence stays readable; ordinary actions expose their physical result.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const M=require('../state-3d.js'),Story=require('../chapters-3d.js');
const base=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index-3d.html')).href;
const output=path.join(os.tmpdir(),'afterimage-later-chapters');fs.mkdirSync(output,{recursive:true});
let browser;const errors=[];
async function pageFor(seed,viewport={width:1280,height:800}){
 const touch=viewport.width<500||viewport.height<500;
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 await context.addInitScript(()=>{let api;Object.defineProperty(window,'Afterimage3DWorld',{configurable:true,get:()=>api,set:v=>{api=v;const create=v.create;v.create=(canvas,options)=>{const engine=create(canvas,options);window.reviewTest={engine,interact:options.onInteract};return engine;};}});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(new URL(seed.chapter+'-3d.html',base).href);await p.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[M.key,seed]);await p.reload();await p.locator('#start').click();return p;
}
async function saved(p){return p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.key);}
async function visit(p,id){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');await p.evaluate(id=>reviewTest.interact(id),id);}
async function click(p,label){await p.getByRole('button',{name:new RegExp('^'+label)}).click();}
async function fits(p){
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.querySelector('.dialog').scrollWidth>document.querySelector('.dialog').clientWidth),false,'no horizontal overflow');
 const svg=p.locator('#lines > .exhibit');
 if(await svg.count())for(const bounds of await svg.locator('text').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox();return{x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};})))assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=360&&bounds.bottom<=200,'exhibit labels stay within viewBox: '+JSON.stringify(bounds));
}
(async()=>{
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const sourceSeed=M.preview('chorus');sourceSeed.position={x:-4.1,z:-2.2,yaw:0,pitch:-.4};
  const p=await pageFor(sourceSeed,viewport);await visit(p,'sources');
  assert.equal((await saved(p)).flags.sources,undefined,'thumbnails do not count as reading');
  assert.equal(await p.locator('.source-card').count(),6);assert.equal(await p.getByRole('button',{name:/^Record this evidence review/}).isDisabled(),true);await fits(p);
  await p.screenshot({path:path.join(output,'drawer-'+viewport.width+'.png')});
  for(const [i,src] of Story.sources.entries()){
   await click(p,src.title);assert.equal(await p.locator('#lines > svg').getAttribute('aria-label'),src.lines.join(' '));
   assert.equal(await p.locator('.scene-record').getAttribute('open'),null);await fits(p);
   await p.screenshot({path:path.join(output,src.id+'-'+viewport.width+'.png')});
   await p.locator('.scene-record summary').focus();await p.keyboard.press('Enter');
   assert.deepEqual(await p.locator('.scene-record p').allTextContents(),src.lines);
   assert.equal((await saved(p)).flags.sources,(1<<(i+1))-1);
   await click(p,'Return to the source drawer');
  }
  await click(p,'Record this evidence review');assert.equal((await saved(p)).flags.evidence,true);
  await p.reload();await p.locator('#start').click();await visit(p,'sources');assert.equal(await p.locator('.source-card small').filter({hasText:'Opened'}).count(),6);
  await p.context().close();
  let seed=M.preview('release');for(const n of [0,1,2])seed=M.act(seed,'inspect',n);seed=M.act(seed,'counterOffer');
  const final=await pageFor(seed,viewport);
  for(const plan of ['complete','witness','remain','closeall']){
   await visit(final,plan==='closeall'?'close-all':plan);await fits(final);assert.equal(await final.locator('[data-exhibit=plan]').count(),1);
   await final.screenshot({path:path.join(output,plan+'-'+viewport.width+'.png')});
   const before=await saved(final);await click(final,'Enact '+(plan==='closeall'?'literal closure':plan));
   assert.deepEqual(await saved(final),before,'review cannot enact a plan');assert.equal(await final.locator('.exhibit').count(),0,'confirmation uses explicit consequences');
   assert.match(await final.locator('#lines').innerText(),plan==='closeall'?/Fern, Brim, Counter.*erased/:plan==='witness'?/No reply or rescue/:plan==='remain'?/Counter accepts/:/residents.*remain/);
   await click(final,'Reconsider');assert.deepEqual(await saved(final),before);
  }
  await final.context().close();
 }
 for(const mode of ['central','round','local']){
  const p=await pageFor(M.preview('chorus'));await visit(p,'route');await click(p,({central:'Use Counter’s central desk',round:'Pass an ordered round',local:'Keep three local copies'})[mode]);
  assert.equal(await p.locator('#panel').isVisible(),false);
  const initial=Story.world(await saved(p)).decor;assert.ok(initial.some(o=>o.id?.startsWith(mode==='local'?'local-copy-':mode+'-wire-')));
  await visit(p,'residents');await click(p,mode==='central'?'Record Counter’s combined envelope':'Record this approval');assert.equal(await p.locator('#panel').isVisible(),false);
  const state=await saved(p),world=Story.world(state);assert.notEqual(world.decor.find(o=>o.id==='approval-light-0').color,initial.find(o=>o.id==='approval-light-0').color);
  await visit(p,'route');assert.match(await p.locator('[data-exhibit=route]').getAttribute('aria-label'),/Residents: signed/);await fits(p);
  await p.screenshot({path:path.join(output,'route-'+mode+'.png')});await p.context().close();
 }
 const chairSeed=M.preview('garden');chairSeed.position={x:-4.35,z:2.7,yaw:0,pitch:-.74};
 const garden=await pageFor(chairSeed,{width:390,height:844});await garden.waitForFunction(()=>reviewTest.engine.getDebugState().focused==='seat-placement');
 await garden.locator('#touch-interact').tap();assert.equal(await garden.locator('#panel').isVisible(),false);
 const placed=await saved(garden);assert.equal(placed.flags.seat,true);assert.deepEqual(placed.acquired,chairSeed.acquired);assert.equal(Story.world(placed).objects.find(o=>o.id==='seat-placement').interactive,false);
 await garden.context().close();
 assert.deepEqual(errors,[]);console.log('Later chapters: six visual sources and transcripts, evidence gate, three physical routes, approval lights, direct chair placement, and four explicit plan reviews passed at four screen sizes. Screenshots: '+output);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
