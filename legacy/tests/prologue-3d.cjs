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
async function act(p,id,label){await visit(p,id);await click(p,label);}
async function repair(p,id){await visit(p,id);await click(p,'Set the controls for me');assert.equal((await stored(p)).flags[id],false);await click(p,'Secure the repair');assert.equal((await stored(p)).flags[id],true);}
async function reset(p,pair){await visit(p,'reset');await click(p,'Review the two-memory handoff');for(const id of pair)await p.getByRole('button',{name:new RegExp('^'+S.memories[id].title)}).click();await click(p,'Review what you will lose');await click(p,'Keep these two and reset');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).phase==='return',S.key);assert.deepEqual((await stored(p)).kept,pair);}
async function finish(p,id,label,confirm,expected){await visit(p,id);const before=await stored(p);await click(p,label);assert.deepEqual(await stored(p),before,'review does not enact the ending');await click(p,confirm);assert.equal((await stored(p)).ending,expected);assert.equal(await p.locator('#panel').getAttribute('data-scene'),'chapter-outcome');assert.doesNotMatch(await p.locator('#lines').innerText(),/archiveCleared|dispatchDelivered|networkClosed|falseClearance/);}
async function advance(p,name){await click(p,'Continue to '+name);await p.waitForURL(new RegExp(name.toLowerCase()+'-3d.html'));await click(p,'Continue '+name);await close(p);}

(async()=>{
 browser=await chromium.launch({headless:true});
 // E and touch act on ordinary objects without a second confirmation panel.
 for(const mobile of [false,true]){
  const seed=S.fresh();seed.position={x:-3.4,z:2.55,yaw:0,pitch:-.80};
  const page=await makePage('prologue',mobile,seed);
  await page.waitForFunction(()=>test3D.engine.getDebugState().focused==='flower');
  assert.match(await page.locator('#focus-label').innerText(),/Set flower beside lamp/);
  if(mobile)await page.locator('#touch-interact').tap();else await page.keyboard.press('KeyE');
  assert.equal(await page.locator('#panel').isVisible(),false);
  const placed=await stored(page);assert.equal(placed.world.flowerPlaced,true);assert.deepEqual(placed.acquired,[]);
  assert.equal(await page.locator('#tension').isVisible(),false);
  await page.locator('#journal').click();assert.equal(await page.locator('#panel').getAttribute('data-scene'),'field-journal');await close(page);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(Afterimage3DState.key));test3D.engine.load(Afterimage3DChapters.world(s),{x:-1.75,z:2.5,yaw:0,pitch:-.7});});
  await page.waitForFunction(()=>test3D.engine.getDebugState().focused==='seat');
  if(mobile)await page.locator('#touch-interact').tap();else await page.keyboard.press('KeyE');
  assert.equal(await page.locator('#panel').isVisible(),false);assert.equal(await page.evaluate(()=>test3D.engine.getDebugState().seated),true);
  await page.screenshot({path:path.join(output,'quiet-prologue-'+(mobile?'mobile':'desktop')+'.png')});
  await page.getByRole('button',{name:'Stand up',exact:true}).click();assert.equal(await page.evaluate(()=>test3D.engine.getDebugState().seated),false);
  await page.reload();await page.locator('#start').click();assert.equal((await stored(page)).world.flowerPlaced,true);
  await page.locator('#journal').click();assert.match(await page.locator('#lines').innerText(),/closure order|Moth wants/);
  await page.context().close();
 }
 for(const pair of [['name','song'],['name','route'],['song','route']])for(const ending of ['clear','witness','stay']){
  if(ending==='witness'&&!pair.includes('song'))continue;
  let seed=S.fresh();for(const a of ['meet','flower','service','receiver'])seed=S.act(seed,a);
  const p=await makePage('prologue',false,seed);
  await reset(p,pair);assert.match(await p.locator('#tracked').innerText(),pair.includes('name')?/Moth/:/Someone at the table/);
  await visit(p,'closure');assert.equal(await p.getByRole('button',{name:/^Clear Archive 07/}).isDisabled(),true);
  await click(p,pair.includes('name')?'Go to Moth':'Go to Someone at the table');assert.equal(await p.locator('#panel').isVisible(),false);assert.match(await p.locator('#tracked').innerText(),pair.includes('name')?/Moth/:/Someone at the table/);
  await act(p,'moth','Answer Moth');
  if(!pair.includes('route')){await repair(p,'relayA');await repair(p,'relayB');}
  // Simulate arriving at the closure cabinet, so unloading must not carry its
  // coordinates into the next chapter's save.
  await close(p);await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem(Afterimage3DState.key));s.position={x:4.7,z:-3.4,yaw:0,pitch:0};test3D.engine.load(Afterimage3DChapters.world(s),s.position);});
  await finish(p,'closure',({clear:'Clear Archive 07',witness:'Send a witness account',stay:'Stay with Moth'})[ending],({clear:'Clear and erase',witness:'Send witness',stay:'Stay'})[ending],ending);
  await p.reload();await click(p,'Continue Prologue');
  await click(p,'Continue to Transit');await p.waitForURL(/transit-3d.html/);
  const next=await stored(p);assert.equal(next.chapter,'transit');assert.equal(next.phase,'work');assert.ok(S.validate(next));assert.deepEqual(next.position,S.preview('transit').position,'Transit must retain its own arrival position');
  await click(p,'Continue Transit');await act(p,'brim','Ask Brim about the greeting');assert.equal((await stored(p)).flags.brim,true);
  console.log('PROGRESSION PASS '+pair.join('+')+' / '+ending);await p.context().close();
 }
 const stranded=S.preview('transit');stranded.position={x:4.7,z:-3.4,yaw:0,pitch:0};
 const recovery=await makePage('transit',false,stranded);await recovery.locator('#menu-button').click();await click(recovery,'Return to the chapter entrance');
 const recovered=await stored(recovery);assert.deepEqual({...recovered,position:stranded.position},stranded);assert.deepEqual(recovered.position,S.preview('transit').position);assert.equal(await recovery.locator('#panel').isVisible(),false);await recovery.context().close();
 assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
