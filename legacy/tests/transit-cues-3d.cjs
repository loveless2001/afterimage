'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const M=require('../state-3d.js');
const Story=require('../chapters-3d.js');
const base=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../transit-3d.html')).href;
const url=new URL('transit-3d.html',base).href;
const output=path.join(os.tmpdir(),'afterimage-transit-cues');fs.mkdirSync(output,{recursive:true});
let browser;const errors=[];
let ready=M.preview('transit');for(const action of ['brim','ledger'])ready=M.act(ready,action);
for(let index=0;index<3;index++)if(M.puzzles.lift.target&(1<<index))ready=M.act(ready,'turn',{id:'lift',index});ready=M.act(ready,'lift');ready=M.reset(ready,['greeting','sequence']);
async function make(state,width=1280,keepOutcome=false){
 const context=await browser.newContext({viewport:{width,height:width<750?844:800},reducedMotion:'reduce',hasTouch:width<750,isMobile:width<750});
 await context.addInitScript(()=>{let api;Object.defineProperty(window,'Afterimage3DWorld',{get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{const engine=create(canvas,options);window.transitTest={engine,options};return engine;};}});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[M.key,state]);await p.reload();await p.locator('#start').click();if(!keepOutcome&&await p.locator('#panel').isVisible())await p.keyboard.press('Escape');return p;
}
const saved=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.key);
async function visit(p,id){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');await p.evaluate(id=>transitTest.options.onInteract(id),id);}
async function click(p,label){await p.getByRole('button',{name:new RegExp('^'+label)}).click();}
async function view(p,position,name){
 if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');
 await p.evaluate(position=>{const s=JSON.parse(localStorage.getItem(Afterimage3DState.key));transitTest.engine.load(Afterimage3DChapters.world(s),position);transitTest.engine.pause(false);},position);
 await p.screenshot({path:path.join(output,name+'.png')});
}
(async()=>{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,390]){
  const p=await make(ready,width);
  const sortView={x:-4.45,z:-1.85,yaw:0,pitch:-.39},liftView={x:-5.4,z:4.9,yaw:.56,pitch:-.31};
  await view(p,sortView,'clamp-open-'+width);await view(p,liftView,'lift-support-'+width);
  await view(p,{x:1.35,z:-3.35,yaw:0,pitch:-.47},'bridge-control-'+width);
  await p.waitForFunction(()=>transitTest.engine.getDebugState().focused==='bridge');
  if(width<750)await p.locator('#touch-interact').tap();else await p.keyboard.press('KeyE');
  await click(p,'Reconnect the bridge');assert.equal((await saved(p)).world.siltReturned,false,'Opening the bridge does not move Silt');
  await view(p,{x:1.0,z:-.1,yaw:.61,pitch:-.15},'bridge-connected-'+width);
  await visit(p,'silt');assert.equal(await p.locator('[data-exhibit="silt-sketch"]').count(),1);
  assert.match(await p.locator('[data-exhibit="silt-sketch"]').getAttribute('aria-label'),/No time is written/);
  await p.screenshot({path:path.join(output,'silt-drawing-'+width+'.png')});await click(p,'Cross back with Silt and the drawing');
  assert.equal((await saved(p)).world.siltReturned,true);
  await view(p,{x:-1.9,z:-.65,yaw:0,pitch:-.14},'silt-returned-'+width);
  await visit(p,'dispatch');await click(p,'Prepare the public delivery');const before=await saved(p);
  await click(p,'Build the shelf and keep both');assert.deepEqual(await saved(p),before,'Review cannot spend the lift component');
  await click(p,'Reconsider');assert.deepEqual(await saved(p),before,'Cancellation preserves the component');
  await click(p,'Build the shelf and keep both');await click(p,'Build the shelf');
  assert.equal((await saved(p)).world.liftSpent,true);await view(p,sortView,'two-shelves-'+width);await view(p,liftView,'lift-empty-socket-'+width);
  await p.reload();await p.locator('#start').click();assert.equal((await saved(p)).world.liftSpent,true);assert.ok(M.validate(await saved(p)));await p.context().close();
 }
 for(const width of [1280,390,320])for(const ending of ['book','ledger','both','omit']){
  let state=M.act(ready,'deliver');state=M.act(state,'finish',ending);const p=await make(state,width,true);
  assert.deepEqual(await p.evaluate(()=>transitTest.engine.getPosition()),Story.transitView(width<=750),'The receipt must frame the surviving shelf');
  assert.match(await p.locator('#lines').innerText(),ending==='omit'?/Neither waiting record/:/kept/);
  await p.screenshot({path:path.join(output,'outcome-'+ending+'-'+width+'.png')});
  assert.equal(await p.locator('.dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false,'The receipt must not clip horizontally');
  await click(p,'Look around before leaving');const before=await p.evaluate(()=>transitTest.engine.getPosition());
  await p.keyboard.down('KeyW');await p.waitForTimeout(180);await p.keyboard.up('KeyW');
  assert.notDeepEqual(await p.evaluate(()=>transitTest.engine.getPosition()),before,'The ending must leave the room explorable');
  assert.equal((await saved(p)).world.siltReturned,false);await p.context().close();
 }
 for(const width of [1280,390]){
  const p=await make(ready,width),folderView={x:4.1,z:3.8,yaw:0,pitch:-.54};
  await view(p,folderView,'objection-attached-'+width);await visit(p,'objection');const before=await saved(p);
  await click(p,'Leave the objection out of the dispatch');assert.deepEqual(await saved(p),before);
  await click(p,'Reconsider');assert.deepEqual(await saved(p),before);
  await click(p,'Leave the objection out of the dispatch');await click(p,'Omit the warning');
  assert.equal(await p.locator('#panel').isVisible(),false);assert.equal((await saved(p)).flags.omitWarning,true);
  await view(p,folderView,'objection-missing-'+width);await p.reload();await p.locator('#start').click();
  assert.equal(Story.world(await saved(p)).objects.find(o=>o.id==='objection').objectionMissing,true);
  await visit(p,'objection');assert.equal(await p.getByRole('button',{name:/Leave the objection out/}).count(),0);await p.context().close();
 }
 assert.deepEqual(errors,[]);console.log('TRANSIT CUES PASS: distinct records, one-book clamp, shared lift/shelf support, omitted attachment persistence, composed endings, bridge/Silt independence, desktop/touch and reloads.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>browser?.close());
