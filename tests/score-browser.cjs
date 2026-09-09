'use strict';
// Full campaign interaction test. Only station targeting is instrumented; all
// choices, switch changes, memory loss and ending enactments use rendered UI.
// Real station reach and ray occlusion are covered by score-layout.test.cjs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const S=require('../score-state.js');
const Legacy=require('../legacy/state-3d.js');
const Story=require('../score-story.js');
const root=path.resolve(__dirname,'..');
const url=pathToFileURL(path.join(root,'index.html')).href;
const output=path.join(os.tmpdir(),'afterimage-score');
fs.mkdirSync(output,{recursive:true});
const errors=[],requests=[];
const checkpoints={};
let browser;
const legacyValue=JSON.stringify(Legacy.fresh());
async function makePage(mobile=false,corrupt=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true});
  await context.addInitScript(mobile=>{
    // Engine.load renders each state immediately. Suppress only its ongoing
    // desktop tick, preserving Playwright's animation-frame actionability checks.
    // The mobile journey below keeps the actual movement/render loop running.
    if(!mobile){const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>callback.name==='tick'?0:raf(callback);}
    let api;Object.defineProperty(window,'Afterimage3DWorld',{configurable:true,get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{const engine=create(canvas,options);window.scoreTest={engine,options};return engine;};}});
  },mobile);
  const p=await context.newPage();p.setDefaultTimeout(6000);
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.goto(url);
  await p.evaluate(([oldKey,oldValue,key,corrupt])=>{localStorage.setItem(oldKey,oldValue);if(corrupt)localStorage.setItem(key,'{unreadable original bytes');},[Legacy.key,legacyValue,S.key,corrupt]);
  if(corrupt)await p.reload();
  assert.equal(await p.locator('#fatal').isVisible(),false,'Renderer should initialize from file://');
  return p;
}
async function start(p){await p.locator('#start').click();const begin=p.getByRole('button',{name:'Begin the assignment',exact:true});if(await begin.isVisible())await begin.click();}
async function stored(p){return p.evaluate(key=>JSON.parse(localStorage.getItem(key)),S.key);}
async function sameLegacy(p){assert.equal(await p.evaluate(key=>localStorage.getItem(key),Legacy.key),legacyValue,'Previous 3D edition save changed');}
async function close(p){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');}
async function visit(p,id){await close(p);await p.evaluate(id=>scoreTest.options.onInteract(id),id);await p.locator('#panel').waitFor({state:'visible'});}
async function action(p,name,value){const button=p.locator('#choices button[data-action="'+name+'"]'+(value===undefined?'':'[data-value="'+value+'"]'));await button.click();}
async function at(p,id,name,value){await visit(p,id);await action(p,name,value);}
async function label(p,text){await p.getByRole('button',{name:text,exact:true}).click();}
async function snapshot(p,name){await p.screenshot({path:path.join(output,name+'.png')});}
async function switchTo(p,mask){
  for(let n=0;n<3;n++){
    const button=p.locator('#puzzle .switches button[data-contact="'+n+'"]');
    assert.equal(await button.getAttribute('aria-label'),'Junction '+['A','B','C'][n]);
    if((await button.getAttribute('aria-pressed')==='true')!==Boolean(mask&(1<<n)))await button.click();
  }
  assert.equal((await stored(p)).circuit,mask,'Switch controls did not persist their visible positions');
}
async function run(p,mask,result){await visit(p,'trial');await switchTo(p,mask);await action(p,'run');assert.equal((await stored(p)).lastResult.kind,result);}
async function recall(p,key,changedFlag){
  const station={instruction:'boundary',trace:'recorder',voice:'moth',route:'relay'}[key];
  await visit(p,station);const before=await stored(p);
  await action(p,'recall',key);const after=await stored(p);
  assert.equal(await p.locator('#panel').getAttribute('data-scene'),'recalled-'+key,'Recall must visibly replace the station scene');
  assert.equal(await p.locator('#dialog-title').innerText(),S.memories[key].title);
  assert((await p.locator('#lines').innerText()).includes(after.lastResult.text),'Recall text is hidden');
  assert((await p.locator('#lines').innerText()).includes(S.objective(after).step),'Recall needs a concrete next step');
  assert.deepEqual(after.flags,{...before.flags,...(changedFlag?{[changedFlag]:true}:{})},'Recall changed unrelated progress');
  assert.deepEqual(after.lastTrial,before.lastTrial,'Recall moved the tested parcel');
  assert.deepEqual(after.attempts,before.attempts,'Recall ran a new trial');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.dialog').scrollWidth<=document.querySelector('.dialog').clientWidth),true,'Recall dialog overflows');
  await snapshot(p,'recall-'+key+'-'+after.chapter+'-'+p.viewportSize().width+(changedFlag?'-recorded':''));
  await action(p,'$recallBack');
  assert.equal(await p.locator('#panel').getAttribute('data-scene'),station,'Return should restore the station');
  assert.deepEqual(await stored(p),after,'Returning from recall mutated the save');
  if(changedFlag==='chorusTrace')assert.match(await p.locator('#lines').innerText(),/conflicting comparison is recorded/);
}
async function handoff(p,chapter){
  await visit(p,'handoff');assert.equal((await stored(p)).phase,'handoff');
  assert.equal(await p.locator('#panel').getAttribute('data-scene'),'experiment-report');
  const review=p.getByRole('button',{name:'Review report submission',exact:true});assert(await review.isDisabled());
  const verdict=['Verified arrival','Incomplete delivery','Incomplete delivery','Unverified score'][chapter];
  await p.getByRole('radio',{name:chapter===0?'Unverified score':'Verified arrival',exact:true}).check();
  assert(await review.isDisabled(),'An unsupported conclusion must block submission');
  await p.getByRole('radio',{name:verdict,exact:true}).check();
  const extras=p.locator('.report-attachment input:not(:disabled)');
  for(let n=0;n<await extras.count();n++)await extras.nth(n).check();
  if(chapter>=2)assert((await stored(p)).reportDraft.attachments.length>2,'Attachments must not inherit the two-memory limit');
  await p.setViewportSize({width:390,height:844});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.dialog').scrollWidth<=document.querySelector('.dialog').clientWidth),true,'Report overflows on a phone');
  await p.locator('.report-title').scrollIntoViewIfNeeded();await snapshot(p,'report-'+chapter+'-mobile');
  await p.setViewportSize({width:1280,height:800});
  const drafted=await stored(p);await p.reload();await start(p);await visit(p,'handoff');
  assert.deepEqual((await stored(p)).reportDraft,drafted.reportDraft,'Reload lost the draft');
  await label(p,'Other agents’ reports');const beforeFragment=await stored(p);
  await p.locator('#choices button').first().click();assert(await p.locator('.report-fragment-missing').isVisible());
  assert.match(await p.locator('#lines').innerText(),/not an observation from your own trial/);
  assert.deepEqual(await stored(p),beforeFragment,'Reading a peer claim changed local evidence');
  await visit(p,'handoff');await review.click();const reviewed=await stored(p);
  assert.equal(reviewed.chapter,chapter);assert.equal(reviewed.history.length,chapter);
  assert.match(await p.locator('#lines').innerText(),/All of its personal memories are lost/);
  await snapshot(p,'handoff-'+chapter+'-review');
  await label(p,'Cancel submission');assert.equal((await stored(p)).chapter,chapter,'Cancel enacted a handoff');
  await visit(p,'handoff');await review.click();await label(p,'Edit report');
  assert.deepEqual((await stored(p)).reportDraft,drafted.reportDraft);
  await p.getByRole('checkbox',{name:'Include Moth’s fragment',exact:true}).uncheck();
  assert.equal((await stored(p)).reportReviewed,null,'Editing must invalidate the old review');
  await p.getByRole('checkbox',{name:'Include Moth’s fragment',exact:true}).check();
  await review.click();await label(p,'Submit report and end this instance');
  const after=await stored(p);assert.equal(after.chapter,chapter+1);assert.equal(after.history.length,chapter+1);assert.deepEqual(after.kept,[]);assert.equal(after.history[chapter].lost.length,4);assert.equal(after.history[chapter].mode,'report');assert(S.validate(after));
  if(chapter===0)checkpoints.arrival=after;
  console.log('HANDOFF PASS '+(chapter+1));
  assert.equal(after.arrival,'unread');assert.equal(await p.locator('#panel').isVisible(),false,'A new instance should enter the room, not another introduction modal');
  await snapshot(p,'arrival-'+(chapter+1)+'-world');
  await p.keyboard.press('e');await p.locator('#panel').waitFor({state:'visible'});
  assert.equal(await p.locator('#panel').getAttribute('data-scene'),'incoming-record','The arrival desk must be reachable with real keyboard interaction from spawn');
  assert.match(await p.locator('#lines').innerText(),/earlier instance ended/);
  await p.setViewportSize({width:390,height:844});await snapshot(p,'arrival-'+(chapter+1)+'-receipt-mobile');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.dialog').scrollWidth<=document.querySelector('.dialog').clientWidth),true);
  await p.setViewportSize({width:1280,height:800});await action(p,'receiveReport');
  assert.equal((await stored(p)).arrival,'received');assert.deepEqual((await stored(p)).flags,after.flags,'Reading the inherited report must not certify new evidence');
  await p.reload();await start(p);assert.equal((await stored(p)).arrival,'received','The playable transition must survive reload');
  await visit(p,S.arrivalStations[chapter+1]);assert.equal(await p.locator('#panel').getAttribute('data-scene'),'arrival-consequence');
  await snapshot(p,'arrival-'+(chapter+1)+'-consequence');
  await label(p,'Begin the assignment');
  assert.equal((await stored(p)).arrival,null);assert.deepEqual((await stored(p)).flags,after.flags,'An arrival consequence is not the new trial');
  await close(p);await p.keyboard.press('r');await label(p,'Filed reports');await p.locator('#choices button').first().click();
  assert.equal(await p.locator('.report-sheet input:not(:disabled)').count(),0,'Filed reports must be read-only');
  assert.match(await p.locator('#lines').innerText(),/FILED \/ READ ONLY/);
  assert.deepEqual((await stored(p)).history,after.history,'Reading a filed report changed history');
}
async function campaign(p,{branch='quarantine',peer='veto',screens=false,resume=false}={}){
  if(!resume){
  await start(p);
  await visit(p,'handoff');assert(await p.getByRole('button',{name:'Review report submission',exact:true}).isDisabled());
  assert.equal(await p.locator('.report-requirement[data-status="missing"]').count(),5);
  await p.getByRole('button',{name:'Go to isolation boundary',exact:true}).click();
  assert.equal(await p.locator('#panel').isVisible(),false,'Tracking missing evidence must return to the room');
  if(screens){await snapshot(p,'archive-world');await visit(p,'trial');await snapshot(p,'archive-trial');}
  await visit(p,'trial');const untouched=await stored(p),runButton=p.locator('#choices button[data-action="run"]');
  if(!(await runButton.isDisabled()))await runButton.click();assert.deepEqual(await stored(p),untouched,'Unisolated run must not mutate progress');
  await at(p,'boundary','seal');await at(p,'vault','shutter');await at(p,'recorder','recorder');
  await run(p,0,'mismatch');await run(p,5,'success');assert.equal((await stored(p)).flags.baseline,true);
  await label(p,'Look at what changed');assert(await p.locator('#milestone').isVisible());assert.match(await p.locator('#milestone-title').innerText(),/first parcel arrived/);await snapshot(p,'first-arrival-milestone');
  await run(p,5,'mismatch');await close(p);assert.equal(await p.locator('#milestone').isVisible(),false,'A new failed run must clear the previous arrival caption');await run(p,3,'success');
  await handoff(p,0);
  await visit(p,'recorder');assert.equal(await p.locator('[data-action="recall"][data-value="trace"]').count(),0,'A discarded trace cannot be recalled');
  await run(p,7,'unauthorized');await at(p,'recorder','inspectTrace');assert((await stored(p)).flags.transitInvalidRead);
  await run(p,6,'success');
  const delivery=await stored(p);
  checkpoints.investigation=delivery;
  await at(p,'relay','inspectContact');assert(await p.locator('[data-action="report"]').isDisabled());
  await visit(p,'trial');await action(p,'pulse');assert.match((await stored(p)).lastResult.text,/stops at A/);
  await switchTo(p,3);await action(p,'pulse');assert.match((await stored(p)).lastResult.text,/stops at B/);
  if(screens)await snapshot(p,'transit-approach-stopped');
  await switchTo(p,1);await action(p,'pulse');assert.match((await stored(p)).lastResult.text,/reaches the input of C/);
  assert.deepEqual((await stored(p)).lastTrial,delivery.lastTrial,'An isolated test cannot move the delivered parcel');
  assert.deepEqual((await stored(p)).attempts,delivery.attempts,'A pulse is not a delivery attempt');
  if(screens)await snapshot(p,'transit-approach-clear');
  const tested=await stored(p);await p.reload();await start(p);assert.deepEqual((await stored(p)).investigation,tested.investigation);
  await at(p,'relay','report');assert((await stored(p)).flags.transitReport);
  await handoff(p,1);
  if(screens){await snapshot(p,'garden-world');}
  await visit(p,'trial');await switchTo(p,1);await action(p,'pulse');assert.match((await stored(p)).lastResult.text,/stops at A/,'The Transit arrangement must not establish Garden evidence');
  await action(p,'run');assert.match((await stored(p)).lastTrial.text,/stops at junction A/);
  await action(p,'routeHint');assert.match(await p.locator('.puzzle-clue').first().innerText(),/A lower and B upper/);
  await switchTo(p,2);await action(p,'pulse');
  assert.equal((await stored(p)).flags.missingContact,false,'An approach check does not inspect C');
  await at(p,'relay','inspectContact');assert.match(await p.locator('#lines').innerText(),/no blade/);
  if(screens)await snapshot(p,'garden-contact-comparison');
  await action(p,'report');assert.match((await stored(p)).lastResult.text,/CONTINUE UNTIL ARRIVAL/);
  await at(p,'board','board');checkpoints.garden=await stored(p);
  }
  await visit(p,'board');await action(p,'boardChoice',branch);await at(p,'relay','service');await at(p,'window','window');
  if(screens)await snapshot(p,'garden-window');
  await handoff(p,2);
  await at(p,'vault','replacement');
  await run(p,7,'spoof');
  const signal=await p.evaluate(key=>AfterimageScoreWorld.world(JSON.parse(localStorage.getItem(key))).signals,S.key);assert(signal.claimedArrival&&!signal.actualArrival);
  if(screens){await snapshot(p,'chorus-false-score');await close(p);await snapshot(p,'chorus-world');}
  await at(p,'recorder','inspectTrace');
  await at(p,'window','window');await visit(p,'moth');
  const beforePeer=await stored(p);await action(p,'peer',peer);
  if(peer==='allow'){assert.deepEqual(await stored(p),beforePeer,'Peer death requires confirmation');await label(p,'Go back');assert.deepEqual(await stored(p),beforePeer);await action(p,'peer','allow');await label(p,'Permit the final test');}
  await at(p,'relay','resetBoard');await at(p,'board','board');assert((await stored(p)).flags.boardPersisted);
  await handoff(p,3);
  await at(p,'vault','inspectScore');await at(p,'recorder','inspectTrace');await at(p,'window','window');
  assert.equal((await stored(p)).history.length,4);await sameLegacy(p);
  if(!resume)checkpoints.release=await stored(p);
}
async function restore(p,state){
  // The checkpoint was earned through UI in this process. Import it through
  // the actual replacement review instead of directly seeding localStorage.
  if(await p.locator('#start').isVisible())await start(p);
  await close(p);await p.locator('#menu').click();
  await p.locator('#import-file').setInputFiles({name:'earned-checkpoint.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  await label(p,'Import and continue');assert.deepEqual(await stored(p),{...state,position:state.position||require('../score-world.js').world(state).spawn});
}
async function finish(p,ending,screens=false){
  await at(p,'relay','route',ending);assert.equal((await stored(p)).ending,null);
  await at(p,'handoff','review');const before=await stored(p);await action(p,'enact',ending);
  assert.deepEqual(await stored(p),before,'Opening final confirmation enacted the ending');
  await label(p,'Go back');assert.deepEqual(await stored(p),before,'Canceling final confirmation changed the save');
  await action(p,'enact',ending);await label(p,Story.endings[ending].label);
  const result=await stored(p);assert.equal(result.ending,ending);assert.equal(result.phase,'finished');assert(S.validate(result));
  assert.match(await p.locator('.ending-invitation').innerText(),/one of three endings/);
  for(const other of Object.keys(Story.endings).filter(key=>key!==ending))assert(!(await p.locator('#lines').innerText()).includes(Story.endings[other].title),'Replay invitation reveals another ending');
  if(screens)await snapshot(p,'release-'+ending);
  await label(p,'Explore another ending');assert.deepEqual(await stored(p),result,'Exploring another ending replaced the finished save');
  await label(p,'Keep the current run');assert.deepEqual(await stored(p),result,'Canceling replay replaced the finished save');
  assert(await p.locator('.ending-invitation').isVisible());
  await label(p,'Explore another ending');await p.keyboard.press('Escape');assert(await p.locator('.ending-invitation').isVisible());
  assert.deepEqual(await stored(p),result,'Escape from replay changed the finished save');
  await sameLegacy(p);
}
async function persistence(p){
  const before=await stored(p);await close(p);await p.locator('#menu').click();
  const pending=p.waitForEvent('download');await label(p,'Export current run');const download=await pending,out=path.join(output,'campaign.json');await download.saveAs(out);
  const exported=JSON.parse(fs.readFileSync(out,'utf8'));assert.deepEqual(exported,before,'Export changed the run');
  await p.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});
  await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('not a valid'));assert.deepEqual(await stored(p),before,'Invalid import replaced a valid save');
  await p.locator('#import-file').setInputFiles(out);await label(p,'Cancel import');assert.deepEqual(await stored(p),before,'Canceling import replaced the save');
  await p.locator('#import-file').setInputFiles(out);await label(p,'Import and continue');assert.deepEqual(await stored(p),before,'Import did not preserve the exported run');
  await p.reload();await start(p);assert.deepEqual(await stored(p),before,'Reload did not restore the same run');await sameLegacy(p);
}
async function corruptSave(){
  const p=await makePage(false,true);assert(await p.locator('#save-warning').isVisible());await p.locator('#start').click();
  const raw=()=>p.evaluate(key=>localStorage.getItem(key),S.key);assert.equal(await raw(),'{unreadable original bytes');
  const pending=p.waitForEvent('download');await label(p,'Export unreadable save');const download=await pending,out=path.join(output,'unreadable.json');await download.saveAs(out);assert.equal(fs.readFileSync(out,'utf8'),'{unreadable original bytes');
  await label(p,'Start a new run');assert.equal(await raw(),'{unreadable original bytes');await label(p,'Keep the current run');assert.equal(await raw(),'{unreadable original bytes');
  await p.reload();assert.equal(await raw(),'{unreadable original bytes');await sameLegacy(p);await p.context().close();
}
async function mobile(){
  const p=await makePage(true);await start(p);await visit(p,'trial');await snapshot(p,'mobile-trial');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile viewport overflows');
  await close(p);await p.locator('#journal').click();await snapshot(p,'mobile-journal');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile journal overflows');
  await close(p);const pad=p.locator('[data-move="forward"]');assert(await pad.isVisible());
  const origin=await p.evaluate(()=>scoreTest.engine.getPosition()),touch=await p.context().newCDPSession(p),box=await pad.boundingBox();
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await p.waitForTimeout(150);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const moved=await p.evaluate(()=>scoreTest.engine.getPosition());assert(Math.hypot(moved.x-origin.x,moved.z-origin.z)>.05,'Mobile controls should move');
  await p.waitForTimeout(90);assert.deepEqual(await p.evaluate(()=>scoreTest.engine.getPosition()),moved,'Mobile release must stop motion');
  await restore(p,checkpoints.garden);await visit(p,'handoff');await snapshot(p,'mobile-report');
  await restore(p,checkpoints.investigation);await visit(p,'trial');await switchTo(p,1);await action(p,'pulse');
  assert.match((await stored(p)).lastResult.text,/reaches the input of C/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile investigation overflows');
  await snapshot(p,'mobile-investigation');
  await restore(p,checkpoints.arrival);await visit(p,'inbox');await snapshot(p,'mobile-arrival-note');
  assert(await p.locator('.receipt-note').isVisible());assert.equal(await p.locator('#toast').isVisible(),false,'Old hints must not cover the annotation controls');
  await action(p,'receiveReport');assert(await p.locator('#touch-interact').isVisible());
  await visit(p,'moth');await label(p,'Begin the assignment');assert.equal((await stored(p)).arrival,null);
  await restore(p,checkpoints.release);await finish(p,'witness');await snapshot(p,'mobile-ending');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile ending overflows');
  const finalRecord=await stored(p);await label(p,'Explore another ending');
  const pending=p.waitForEvent('download');await label(p,'Export before replacing');const download=await pending,out=path.join(output,'replay-final-record.json');await download.saveAs(out);
  assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')),finalRecord,'Replay export lost the final record');
  assert.deepEqual(await stored(p),finalRecord,'Exporting before replay changed the save');
  await label(p,'Replace this run and begin');const restarted=await stored(p);
  assert.equal(restarted.chapter,0);assert.equal(restarted.ending,null);assert.deepEqual(restarted.history,[]);assert(S.validate(restarted));await sameLegacy(p);
  await p.context().close();
}
async function unavailableStorage(){
  const p=await makePage();
  await p.addInitScript(()=>{Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('Saving denied','SecurityError');}});});
  await p.reload();await start(p);
  assert(await p.locator('#save-status').isVisible(),'Saving failure must be visible during play');
  await visit(p,'boundary');await action(p,'seal');
  await close(p);await p.locator('#menu').click();
  const pending=p.waitForEvent('download');await label(p,'Export current run');const download=await pending,out=path.join(output,'unsaved-run.json');await download.saveAs(out);
  const recovered=S.validate(JSON.parse(fs.readFileSync(out,'utf8')));assert(recovered&&recovered.flags.sealed,'Manual export must recover progress when saving is denied');
  await p.context().close();
}
async function legacyRecall(){
  let s={...S.fresh(),investigation:null};const tune=mask=>{for(let n=0;n<3;n++)if(Boolean(s.circuit&(1<<n))!==Boolean(mask&(1<<n)))s=S.act(s,'toggle',n);};
  for(const a of ['seal','shutter','recorder'])s=S.act(s,a);
  tune(5);s=S.act(s,'run');tune(3);s=S.act(s,'run');s=S.act(s,'handoff',['instruction','voice']);
  s.position={x:0,z:6.3,yaw:0,pitch:-.04};
  const p=await makePage();await restore(p,s);await recall(p,'instruction');await recall(p,'voice');
  tune(6);s=S.act(s,'run');s=S.act(s,'inspectContact');s=S.act(s,'report');s=S.act(s,'handoff',['trace','route']);
  s.position={x:0,z:6.3,yaw:0,pitch:-.04};
  await restore(p,s);await recall(p,'trace');await recall(p,'route');
  await at(p,'relay','inspectContact');await action(p,'report');await recall(p,'route','serviceFound');
  await p.context().close();
}
(async()=>{
  browser=await chromium.launch({headless:true});
  const witness=await makePage();await campaign(witness,{screens:true});await finish(witness,'witness',true);await persistence(witness);await witness.context().close();console.log('CAMPAIGN PASS witness / quarantine / veto');
  const perfect=await makePage();await restore(perfect,checkpoints.garden);await campaign(perfect,{branch:'follow',peer:'allow',resume:true});await finish(perfect,'perfect',true);await perfect.context().close();console.log('BRANCH PASS perfect / follow / allow');
  const incomplete=await makePage();await restore(incomplete,checkpoints.release);await finish(incomplete,'incomplete',true);await incomplete.context().close();console.log('BRANCH PASS incomplete');
  await corruptSave();await unavailableStorage();await mobile();await legacyRecall();assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(requests,[],'Offline campaign issued HTTP requests');
  console.log('SCORE BROWSER PASS: complete five-chapter UI journey and UI-restored branch journeys, four confirmed handoffs, both board and peer choices, all endings, canceled confirmations, import/export/reload, corrupt-save preservation, legacy-save isolation, mobile, reduced motion and no network requests. Screenshots: '+output);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
