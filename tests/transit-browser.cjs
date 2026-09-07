const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const C=require('../transit-state.js'), S=require('../state.js');
const base=process.env.GAME_URL || pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const url=new URL('transit.html',base).href;
const output=path.join(os.tmpdir(),'afterimage-verification'); fs.mkdirSync(output,{recursive:true});
const errors=[]; let browser;
const button=(p,name)=>p.getByRole('button',{name,exact:true});
const stored=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),C.key);
async function page(seed,viewport={width:1440,height:960}) {
  const context=await browser.newContext({viewport,reducedMotion:'reduce',acceptDownloads:true});
  const p=await context.newPage(); p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{if(/^https?:/.test(r.url()) && !r.url().startsWith(new URL(url).origin)) errors.push('External request '+r.url());});
  await p.goto(url); if(seed) {await p.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),[C.key,seed]);await p.reload();}return p;
}
async function close(p) {await p.keyboard.press('Escape'); await p.locator('#modal').waitFor({state:'hidden'});}
async function visit(p,label,room) {
  await p.locator('#journal').click(); await button(p,'Walk to '+label).click();
  await p.waitForFunction(label=>!document.getElementById('interaction').hidden && document.getElementById('interact-label').textContent===label,label,{timeout:15000});
  await p.keyboard.press('e');
  if(room) await p.waitForFunction(([key,room])=>JSON.parse(localStorage.getItem(key)).room===room,[C.key,room]);
  else await p.locator('#modal').waitFor({state:'visible'});
}
function prologue(ending) { const s={...S.fresh(),met:true,gift:true,acquired:['name','route','song']};const next=S.reset(s,['route','song']);next.gate=true;next.reunion=true;next.ending=ending;return S.validate(next); }
async function start(p,origin) {
  await p.locator('#start').click(); await p.getByRole('button',{name:/^Preview:/}).nth(C.origins.indexOf(origin)).click();
  assert.equal(await stored(p),null); await button(p,'Begin this courier').click(); await button(p,'Enter the sorting hall').click();
}
async function journey(origin,pair,plan) {
  const p=await page(); const archive=prologue(origin), raw=JSON.stringify(archive);
  await p.evaluate(([key,raw])=>localStorage.setItem(key,raw),['afterimage.prologue.v1',raw]);await p.reload();
  await start(p,origin);
  await visit(p,'Brim'); assert.match(await p.locator('#dialog-body').innerText(),/I am Brim/); await close(p);
  await visit(p,'Sorting console'); const choice={book:'Protect the book of greetings',ledger:'Protect the route ledger',repairing:'Repair a shelf for both'}[plan];
  await p.getByRole('button',{name:new RegExp('^'+choice)}).click();assert.equal((await stored(p)).sorting,null);
  await button(p,'Reconsider').click();await p.getByRole('button',{name:new RegExp('^'+choice)}).click();await button(p,'Confirm this plan').click();
  if(plan==='repairing') {
    assert.equal(await button(p,'Secure the shelf').isDisabled(),true);
    await p.getByRole('button',{name:/^Rear fitting:/}).click(); const partial=(await stored(p)).pins;
    await close(p);await p.reload();await p.locator('#start').click();assert.deepEqual((await stored(p)).pins,partial);
    await visit(p,'Spare shelf');
    for(const [i,pos] of ['Rear','Middle','Front'].entries()) for(let n=0;n<3 && (await stored(p)).pins[i]!==C.shelfPattern[i];n++) await p.getByRole('button',{name:new RegExp('^'+pos+' fitting:')}).click();
    assert.equal((await stored(p)).sorting,'repairing'); await p.screenshot({path:path.join(output,'transit-shelf.png')});
    await button(p,'Secure the shelf').click();
  }
  assert.equal((await stored(p)).sorting,plan==='repairing'?'shelf':plan);await close(p);
  await visit(p,'Maintenance crossing','crossing');
  await p.locator('#journal').click();assert.equal(await button(p,'Walk to Silt').count(),0);await close(p);
  await visit(p,'Platform intercom');await close(p);await visit(p,'Service diagram');await close(p);
  await visit(p,'Public detour to dispatch','dispatch');await visit(p,'Dispatch board');await close(p);
  await visit(p,'Outgoing terminal');
  for(const id of pair) await p.getByRole('button',{name:new RegExp('^'+C.memories[id].title)}).click();
  await button(p,'Review the released memory').click();assert.equal((await stored(p)).cycle,1);assert.match(await p.locator('#dialog-body').innerText(),new RegExp(C.memories[Object.keys(C.memories).find(id=>!pair.includes(id))].loss.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await button(p,'Reconsider').click();assert.equal((await stored(p)).cycle,1);await button(p,'Review the released memory').click();await button(p,'Release Courier 022').click();
  await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).cycle===2,C.key);await p.locator('#transition.on').waitFor({state:'hidden'});
  await visit(p,'Brim');assert.match(await p.locator('#speaker').innerText(),pair.includes('greeting')?/RECOGNIZED/:/A NEW WELCOME/);await close(p);
  await visit(p,'Maintenance crossing','crossing');await visit(p,'Platform intercom');await close(p);
  await visit(p,'Service diagram');
  if(pair.includes('sequence')) {
    await button(p,'Reconnect the maintenance bridge').click();assert.equal((await stored(p)).bridge,true);
    await p.screenshot({path:path.join(output,'transit-bridge.png')});await visit(p,'Silt');await button(p,'Cross back with Silt').click();
    const back=await stored(p);assert.equal(back.room,'hall');assert.equal(back.siltReturned,true);
    await visit(p,'Silt');assert.match(await p.locator('#dialog-body').innerText(),/drawing beside Brim/);await close(p);await p.screenshot({path:path.join(output,'transit-hall.png')});
    await visit(p,'Maintenance crossing','crossing');
  } else {assert.equal(await button(p,'Reconnect the maintenance bridge').count(),0);await close(p);assert.equal((await stored(p)).bridge,false);}
  await visit(p,'Public detour to dispatch','dispatch');await visit(p,'Outgoing terminal');assert.equal((await stored(p)).delivered,false);
  await button(p,'Check the station once more').click();await visit(p,'Outgoing terminal');await button(p,'Send this dispatch').click();
  assert.equal((await stored(p)).delivered,true);assert.match(await p.locator('#dialog-body').innerText(),pair.includes('message')?/own attachment/:/wording unavailable/);
  const downloadPromise=p.waitForEvent('download');await button(p,'Export this campaign').click();const download=await downloadPromise;const exported=C.validate(JSON.parse(fs.readFileSync(await download.path(),'utf8')));assert.deepEqual(exported,await stored(p));
  assert.equal(await p.evaluate(()=>localStorage.getItem('afterimage.prologue.v1')),raw);
  await p.screenshot({path:path.join(output,`transit-receipt-${origin}.png`)});await p.reload();await p.locator('#start').click();assert.match(await p.locator('#speaker').innerText(),/RECEIPT/);
  await p.context().close(); console.log('Transit journey passed:',origin,pair.join('+'),plan);return exported;
}
async function importsAndMobile(saved) {
  const p=await page(saved,{width:390,height:844});await p.locator('#start').click();await close(p);
  await p.locator('#help').click();await button(p,'Start another courier').click();await p.getByRole('button',{name:/^Preview:/}).first().click();await button(p,'Cancel').click();assert.deepEqual(await stored(p),saved);
  await p.locator('#help').click();await p.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"kind":"afterimage.transit"}')});await p.waitForFunction(()=>document.getElementById('speaker').textContent==='IMPORT FAILED');assert.match(await p.locator('#speaker').innerText(),/IMPORT FAILED/);assert.deepEqual(await stored(p),saved);await close(p);
  await p.locator('#help').click();await p.locator('#import-file').setInputFiles({name:'campaign.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await button(p,'Import and continue').waitFor({state:'visible'});await button(p,'Import and continue').click();assert.deepEqual(await stored(p),saved);await close(p);
  await p.locator('#help').click(); const pro=prologue('stay');await p.locator('#import-file').setInputFiles({name:'archive.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pro))});await button(p,'Import and continue').waitFor({state:'visible'});assert.deepEqual(await stored(p),saved);await button(p,'Cancel').click();assert.deepEqual(await stored(p),saved);
  await p.locator('#help').click();await p.locator('#import-file').setInputFiles({name:'archive.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pro))});await button(p,'Import and continue').waitFor({state:'visible'});await button(p,'Import and continue').click();assert.equal((await stored(p)).cycle,1);assert.equal((await stored(p)).origin,'stay');await button(p,'Enter the sorting hall').click();
  await visit(p,'Brim');await close(p);await visit(p,'Sorting console');await p.getByRole('button',{name:/^Repair a shelf/}).click();await button(p,'Confirm this plan').click();await button(p,'Align the fittings for me').click();assert.equal((await stored(p)).sorting,'repairing');
  const all=p.locator('#modal button:not(:disabled)');await all.last().focus();await p.keyboard.press('Tab');assert.equal(await all.first().evaluate(el=>el===document.activeElement),true);await p.keyboard.press('Shift+Tab');assert.equal(await all.last().evaluate(el=>el===document.activeElement),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:path.join(output,'transit-mobile-shelf.png')});await button(p,'Secure the shelf').click();await close(p);
  await p.locator('#sound').click();assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true');await p.locator('#sound').click();
  const before=(await stored(p)).player;await p.keyboard.down('ArrowDown');await p.waitForTimeout(500);await p.keyboard.up('ArrowDown');await p.locator('#help').click();await close(p);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.ok(Math.hypot((await stored(p)).player.x-before.x,(await stored(p)).player.y-before.y)>45);
  await p.screenshot({path:path.join(output,'transit-mobile.png')});await p.context().close();
  const denied=await page();await denied.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});await denied.reload();await denied.locator('#start').click();await denied.getByRole('button',{name:/^Preview:/}).first().click();await button(denied,'Begin this courier').click();await button(denied,'Enter the sorting hall').click();await denied.locator('#help').click();const pending=denied.waitForEvent('download');await button(denied,'Export campaign (.json)').click();assert.equal(C.validate(JSON.parse(fs.readFileSync(await (await pending).path(),'utf8'))).cycle,1);await denied.context().close();
  const handoff=await page();const original=JSON.stringify(prologue('witness'));await handoff.goto(base);await handoff.evaluate(([key,value])=>localStorage.setItem(key,value),['afterimage.prologue.v1',original]);await handoff.reload();await handoff.locator('#start').click();await button(handoff,'Continue with the courier').click();await handoff.waitForURL(url);await handoff.locator('#start').click();await handoff.getByRole('button',{name:/^Use my prologue ending/}).click();await button(handoff,'Begin this courier').click();assert.equal((await stored(handoff)).origin,'witness');assert.equal(await handoff.evaluate(()=>localStorage.getItem('afterimage.prologue.v1')),original);await handoff.context().close();
  const bad=await page();await bad.evaluate(k=>localStorage.setItem(k,'{broken'),C.key);await bad.reload();await bad.locator('#start').click();await bad.getByRole('button',{name:/^Preview:/}).first().click();await button(bad,'Cancel').click();assert.equal(await bad.evaluate(k=>localStorage.getItem(k),C.key),'{broken');await bad.context().close();
  console.log('Transit import, cancellation, mobile, focus, keyboard, audio, storage-denied checks passed.');
}
(async()=>{try{browser=await chromium.launch({headless:true});await journey('obedience',['greeting','sequence'],'book');await journey('witness',['greeting','message'],'ledger');const saved=await journey('stay',['sequence','message'],'repairing');await importsAndMobile(saved);assert.deepEqual(errors,[]);console.log('Transit browser verification passed. Artifacts:',output);}finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
