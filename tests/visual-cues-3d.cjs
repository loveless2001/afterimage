'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const M=require('../state-3d.js');
const Story=require('../chapters-3d.js');
const url=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index-3d.html')).href;
const output=path.join(os.tmpdir(),'afterimage-archive-cues');fs.mkdirSync(output,{recursive:true});
const errors=[];let browser;
let prepared=M.fresh();for(const action of ['meet','flower','service','receiver'])prepared=M.act(prepared,action);
async function pageFor(seed,width=1280,motion='reduce'){
 const context=await browser.newContext({viewport:{width,height:width<750?844:800},reducedMotion:motion,hasTouch:width<750,isMobile:width<750});
 await context.addInitScript(()=>{let api;Object.defineProperty(window,'Afterimage3DWorld',{get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{const engine=create(canvas,options),calls=[],cue=engine.cue;engine.cue=name=>{calls.push(name);cue(name);};window.cueTest={engine,options,calls};return engine;};}});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.evaluate(([key,state])=>localStorage.setItem(key,JSON.stringify(state)),[M.key,seed]);await p.reload();await p.locator('#start').click();return p;
}
const stored=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.key);
async function click(p,label){await p.getByRole('button',{name:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();}
async function visit(p,id){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');await p.evaluate(id=>cueTest.options.onInteract(id),id);}
const capture=(p,name)=>p.screenshot({path:path.join(output,name+'.png')});
const canvas=p=>p.locator('#world').screenshot({style:'body > :not(#world){visibility:hidden!important}'});
async function viewpoint(p,position){await p.evaluate(position=>{const state=JSON.parse(localStorage.getItem(Afterimage3DState.key));cueTest.engine.pause(true);cueTest.engine.load(Afterimage3DChapters.world(state),position);},position);}

(async()=>{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,390,320]){
  for(const pair of width===1280?[['name','song'],['name','route'],['song','route']]:[['song','route']]){
   const p=await pageFor(prepared,width);await visit(p,'reset');await click(p,'Review the two-memory handoff');
   for(const id of pair)await click(p,M.memories[id].title+' '+M.memories[id].description);
   const original=await stored(p);await click(p,'Review what you will lose');
   assert.deepEqual(await stored(p),original,'Review must not commit a reset or change the saved position');
   const before=await p.evaluate(()=>cueTest.engine.getPosition());assert.deepEqual(before,Story.archiveView());
   const picture=await canvas(p);await capture(p,'handoff-before-'+width+'-'+pair.join('-'));
   await click(p,'Keep these two and reset');await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).phase==='return',M.key);
   assert.deepEqual(await p.evaluate(()=>cueTest.engine.getPosition()),before,'Handoff must return to the identical view');
   assert.deepEqual(await canvas(p),picture,'The same physical room must remain after losing a memory');
   const state=await stored(p);assert.ok(M.validate(state));assert.equal(state.flags.returned,false,'Recognition must not auto-answer Moth');
   const moth=Story.world(state).objects.find(o=>o.id==='moth');assert.equal(moth.label,pair.includes('name')?'Moth':'Someone at the table');
   await capture(p,'handoff-after-'+width+'-'+pair.join('-'));await p.context().close();
  }
  for(const ending of ['stay','clear','witness']){
   let ready=M.reset(prepared,['song','route']);ready=M.act(ready,'meet');
   const p=await pageFor(ready,width);await visit(p,'closure');const before=await stored(p);
   await p.getByRole('button',{name:new RegExp('^'+({stay:'Stay with Moth',clear:'Clear Archive 07',witness:'Send a witness account'})[ending])}).click();
   assert.deepEqual(await stored(p),before,'Ending review must not enact consequences');
   await click(p,({stay:'Stay',clear:'Clear and erase',witness:'Send witness'})[ending]);
   assert.equal((await stored(p)).ending,ending);
   assert.equal(await p.evaluate(()=>cueTest.calls.filter(name=>name==='witness').length),ending==='witness'?1:0);
   const debug=await p.evaluate(()=>cueTest.engine.getDebugState());assert.deepEqual(debug.position,Story.archiveView(ending));assert.equal(debug.seated,ending==='stay');
   await capture(p,'ending-'+ending+'-'+width);
   const overflow=await p.locator('.dialog').evaluate(el=>el.scrollWidth>el.clientWidth);assert.equal(overflow,false);
   const visible=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem(Afterimage3DState.key));return Afterimage3DChapters.world(s).objects.map(o=>o.id);});
   assert.equal(visible.includes('moth'),ending!=='clear');assert.equal(visible.includes('flower'),ending!=='clear');
   await click(p,'Look around before leaving');if(ending==='stay'){await click(p,'Stand up');assert.equal(await p.evaluate(()=>cueTest.engine.getDebugState().seated),false);}
   await p.reload();await p.locator('#start').click();assert.equal((await stored(p)).ending,ending);assert.ok(M.validate(await stored(p)));
   assert.equal(await p.evaluate(()=>cueTest.calls.includes('witness')),false,'Reloading an ending must not send the witness signal again');
   await p.context().close();
  }
 }
 // At the same viewpoint, remembering briefly adds a trace; the paper scratches remain.
 for(const retained of [true,false]){
  const state=M.reset(prepared,retained?['song','route']:['name','song']);
  const p=await pageFor(state);await viewpoint(p,{x:.3,z:-2.3,yaw:0,pitch:-.56});
  const plain=await canvas(p);await p.evaluate(()=>cueTest.engine.cue('route'));await p.waitForTimeout(100);
  const recalled=await canvas(p);assert.equal(plain.equals(recalled),!retained,'Only retained route memory may reveal a trace');
  await capture(p,'route-'+(retained?'remembered':'released'));
  await p.waitForTimeout(4700);assert.deepEqual(await canvas(p),plain,'Recall must fade without changing the physical scratches');await p.context().close();
 }
 const detail=await pageFor(prepared);await viewpoint(detail,{x:-.65,z:.72,yaw:.16,pitch:-.59});await capture(detail,'flower-and-closure-form');await detail.context().close();
 // The desk lamp illuminates geometry, and its shader settings cannot leak into another chapter.
 for(const width of [1280,390,320]){
  const p=await pageFor(prepared,width);await viewpoint(p,Story.archiveView());
  if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');
  await capture(p,'archive-lighting-'+width);
  const check=await p.evaluate(()=>{
   const engine=cueTest.engine,scene=Afterimage3DChapters.world(JSON.parse(localStorage.getItem(Afterimage3DState.key))),position=Afterimage3DChapters.archiveView();
   const gl=document.getElementById('world').getContext('webgl');
   const pixels=world=>{engine.load(world,position);const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
   const lit=pixels(scene),unlit=pixels({...scene,lighting:{...scene.lighting,lampColor:[0,0,0]}});
   let illuminated=0;for(let i=0;i<lit.length;i+=4)if(lit[i]-unlit[i]>12&&lit[i]-unlit[i]>lit[i+2]-unlit[i+2])illuminated++;
   const changed=[];
   for(const chapter of ['transit','garden','chorus','release']){
    const other=Afterimage3DChapters.world(Afterimage3DState.preview(chapter)),before=pixels(other);
    pixels(scene);const after=pixels(other);if(before.some((value,index)=>value!==after[index]))changed.push(chapter);
   }
   return {illuminated,changed,error:gl.getError()};
  });
  assert.ok(check.illuminated>500,'The desk lamp must cast visibly warm light across nearby surfaces');
  assert.deepEqual(check.changed,[],'Loading the Archive must not change other chapters’ lighting');
  assert.equal(check.error,0,'The lighting shader must render without WebGL errors');await p.context().close();
 }
 // Animated outgoing signal is one-way and expires; reopening the record does not resend it.
 let ready=M.reset(prepared,['song','route']);ready=M.act(ready,'meet');
 const motion=await pageFor(ready,1280,'no-preference');await visit(motion,'closure');await motion.getByRole('button',{name:/^Send a witness account/}).click();await click(motion,'Send witness');
 await motion.waitForTimeout(1600);await capture(motion,'witness-in-flight');await motion.waitForTimeout(3200);await capture(motion,'witness-waiting');await motion.context().close();
 assert.deepEqual(errors,[]);console.log('VISUAL CUES PASS: identical handoffs, all three endings, route loss/recall, keyboard/touch layouts, reloads, optional motion, warm desk illumination, and chapter lighting isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>browser?.close());
