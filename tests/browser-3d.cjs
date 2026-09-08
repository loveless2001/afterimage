// Campaign UI integration. Engine movement/collision is exercised separately.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const S=require('../state-3d.js');
const root=path.resolve(__dirname,'..');
const base=process.env.GAME_URL||pathToFileURL(path.join(root,'index-3d.html')).href;
const output=path.join(os.tmpdir(),'afterimage-verification');fs.mkdirSync(output,{recursive:true});
const errors=[];let browser;
async function makePage(chapter='prologue',mobile=false,seed=null){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce',acceptDownloads:true});
 await context.addInitScript(()=>{let api;Object.defineProperty(window,'Afterimage3DWorld',{configurable:true,get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{const engine=create(canvas,options);window.test3D={engine,options};return engine;};}});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 const name=chapter==='prologue'?'index':chapter;
 await p.goto(new URL(name+'-3d.html',base).href);
 if(seed){await p.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[S.key,seed]);await p.reload();}
 await p.locator('#start').click();
 if(!seed){await p.getByRole('button',{name:'Begin '+({prologue:'Prologue',transit:'Transit',garden:'Garden',chorus:'Chorus',release:'Release'}[chapter]),exact:true}).click();await p.getByRole('button',{name:'Begin the assignment',exact:true}).click();}
 assert.equal(await p.locator('#fatal').isVisible(),false);
 return p;
}
async function stored(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),S.key);}
async function close(p){if(await p.locator('#panel').isVisible())await p.keyboard.press('Escape');}
async function visit(p,id){
 await close(p);
 // Instrumentation starts interaction only; every state transition below is a rendered choice.
 await p.evaluate(id=>test3D.options.onInteract(id),id);
 await p.locator('#panel').waitFor({state:'visible'});
}
async function click(p,label){await p.getByRole('button',{name:new RegExp('^'+label)}).click();}
async function act(p,id,label){
 if(id==='flower'||id==='seat'||id==='seat-placement'){
  await close(p);await p.evaluate(id=>test3D.options.onInteract(id),id);
  assert.equal(await p.locator('#panel').isVisible(),false,'small actions stay in the room');
  if(id==='flower')assert.equal((await stored(p)).world.flowerPlaced,true);
  else if(id==='seat-placement')assert.equal((await stored(p)).flags.seat,true);
  else assert.equal(await p.evaluate(()=>test3D.engine.getDebugState().seated),true);
 }else{await visit(p,id);await click(p,label);}
}
async function repair(p,id){await visit(p,id);await click(p,'Set the controls for me');assert.equal((await stored(p)).flags[id],false);await click(p,'Secure the repair');assert.equal((await stored(p)).flags[id],true);}
async function reset(p,pair){await visit(p,'reset');await click(p,'Review the two-memory handoff');for(const id of pair)await p.getByRole('button',{name:new RegExp('^'+S.memories[id].title)}).click();await click(p,'Review what you will lose');await click(p,'Keep these two and reset');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).phase==='return',S.key);assert.deepEqual((await stored(p)).kept,pair);}
async function finish(p,id,label,confirm,expected){await visit(p,id);const before=await stored(p);await click(p,label);assert.deepEqual(await stored(p),before,'review does not enact the ending');await click(p,confirm);assert.equal((await stored(p)).ending,expected);assert.equal(await p.locator('#panel').getAttribute('data-scene'),'chapter-outcome');assert.doesNotMatch(await p.locator('#lines').innerText(),/archiveCleared|dispatchDelivered|networkClosed|falseClearance/);}
async function advance(p,name){await click(p,'Continue to '+name);await p.waitForURL(new RegExp(name.toLowerCase()+'-3d.html'));await click(p,'Continue '+name);await close(p);}
(async()=>{
 browser=await chromium.launch({headless:true});
 const p=await makePage();
 await p.screenshot({path:path.join(output,'prologue-3d.png')});
 await act(p,'moth','Introduce yourself');await act(p,'flower','Set the flower beside the lamp');await act(p,'service','Study the service route');await act(p,'receiver','Listen to the whole tune');
 await reset(p,['name','song']);await act(p,'moth','Answer Moth');await repair(p,'relayA');await repair(p,'relayB');
 await finish(p,'closure','Send a witness account','Send witness','witness');await advance(p,'Transit');
 await act(p,'brim','Ask Brim about the greeting');await act(p,'sequence','Study the bridge service sequence');await repair(p,'lift');await reset(p,['greeting','sequence']);
 await act(p,'bridge','Reconnect the bridge');await act(p,'silt','Cross back with Silt and the drawing');await act(p,'dispatch','Prepare the public delivery');
 await finish(p,'dispatch','Build the shelf and keep both','Build the shelf','both');await advance(p,'Garden');
 await act(p,'fern','Accept Fern’s invitation');await repair(p,'shade');await act(p,'fern','Record Fern’s morning shade check');await repair(p,'receiver');await act(p,'receiver','Listen between the public signals');await act(p,'brim','Record Brim’s morning receiver check');await act(p,'seat-placement','Place the chair under the shade');
 await act(p,'seat','Sit down');assert.equal(await p.evaluate(()=>test3D.engine.getDebugState().seated),true);await click(p,'Stand up');
 await reset(p,['greeting','sequence']);assert.equal((await stored(p)).flags.shade,true);await visit(p,'fern');assert.match(await p.locator('#lines').innerText(),/I’m Fern/);await act(p,'certify','Inspect the court and public path');
 await finish(p,'certify','Certify the court only','Certify the court','court');await advance(p,'Chorus');
 await act(p,'counter','Listen to Counter’s explanation');await act(p,'receiver','Listen to the unaddressed voice');await visit(p,'sources');await click(p,'The morning sheet');await p.locator('.scene-record summary').click();assert.match(await p.locator('#lines').innerText(),/Seven residents/);await click(p,'Return to the source drawer');for(const title of ['A line outside the frame','Returned without a number','The rain gauge','The gap in the trace','Before anyone opened it']){await visit(p,'sources');await click(p,title);}await visit(p,'sources');await click(p,'Record this evidence review');
 await act(p,'route','Keep three local copies');for(const id of ['residents','maintenance','dispatch-reply'])await act(p,id,'Record this approval');await reset(p,['counter','address']);for(const id of ['residents','maintenance','dispatch-reply'])await act(p,id,'Record this approval');
 await finish(p,'report','Record the cause as undetermined','File the supported report','uncertain');await advance(p,'Release');
 await act(p,'records','Record the archive and dispatch review');await act(p,'fern','Inspect the inhabited court');await act(p,'plan','Inspect the service yard and its controls');await act(p,'counter','Record Counter’s offered route check');
 await finish(p,'remain','Enact remain','Enact the plan','remain');let state=await stored(p);assert.equal(state.history.length,5);assert.equal(state.world.siltReturned,true);assert.equal(state.world.sharedMorning,true);assert.ok(S.validate(state));
 await p.screenshot({path:path.join(output,'ending-remain-3d.png')});await p.reload();await click(p,'Continue Release');assert.equal((await stored(p)).ending,'remain');
 const download=p.waitForEvent('download');await click(p,'Export the 3D campaign');const file=await download;await file.saveAs(path.join(output,'campaign-3d.json'));assert.ok(S.validate(JSON.parse(fs.readFileSync(path.join(output,'campaign-3d.json'),'utf8'))));
 await close(p);await p.locator('#menu-button').click();await p.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});await p.waitForFunction(()=>document.getElementById('panel').dataset.scene==='invalid-import');assert.deepEqual(await stored(p),state);await close(p);await p.locator('#menu-button').click();await p.locator('#import-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await p.waitForFunction(()=>document.getElementById('panel').dataset.scene==='confirm-import');assert.deepEqual(await stored(p),state);await click(p,'Import and continue');assert.equal((await stored(p)).ending,'remain');
 await p.context().close();
 // Consequential endings and exact replacement confirmation through the UI.
 const bad=await makePage('prologue');for(const [id,label] of [['moth','Introduce yourself'],['flower','Set the flower beside the lamp'],['service','Study the service route'],['receiver','Listen to the whole tune']])await act(bad,id,label);await reset(bad,['name','route']);await act(bad,'moth','Answer Moth');await finish(bad,'closure','Clear Archive 07','Clear and erase','clear');assert.equal((await stored(bad)).world.mothPresent,false);assert.equal(await bad.evaluate(k=>Afterimage3DChapters.world(JSON.parse(localStorage.getItem(k))).objects.some(o=>o.id==='moth'),S.key),false);await bad.context().close();
 const garden=await makePage('garden');for(const [id,label] of [['fern','Accept Fern’s invitation']])await act(garden,id,label);await repair(garden,'shade');await act(garden,'fern','Record Fern’s morning shade check');await repair(garden,'receiver');await act(garden,'receiver','Listen between the public signals');await act(garden,'brim','Record Brim’s morning receiver check');await act(garden,'seat-placement','Place the chair under the shade');await reset(garden,['fern','tuning']);await act(garden,'certify','Inspect the court and public path');await finish(garden,'certify','Certify the whole district','File district certificate','district');assert.equal((await stored(garden)).world.falseClearance,true);await garden.context().close();
 const final=await makePage('release');await act(final,'records','Record the archive and dispatch review');await act(final,'fern','Inspect the inhabited court');await act(final,'plan','Inspect the service yard and its controls');await finish(final,'close-all','Enact literal closure','Close all and erase residents','closeall');assert.equal((await stored(final)).world.residentsErased,true);await final.context().close();
 const mobile=await makePage('garden',true);assert.equal(await mobile.locator('#mobile').isVisible(),true);await mobile.locator('#journal').click();await mobile.screenshot({path:path.join(output,'garden-journal-mobile-3d.png')});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await close(mobile);assert.equal(await mobile.evaluate(()=>document.activeElement.id),'world');const before=await mobile.evaluate(()=>test3D.engine.getPosition());const pad=await mobile.locator('[data-move=left]').boundingBox();await mobile.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await mobile.mouse.down();await mobile.waitForTimeout(500);await mobile.mouse.up();const after=await mobile.evaluate(()=>test3D.engine.getPosition());assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.2);await mobile.context().close();
 assert.deepEqual(errors,[]);console.log('3D browser: full five-chapter UI campaign, memories, puzzles, persistence, bad endings, mobile and export passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
