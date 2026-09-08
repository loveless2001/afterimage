// Visible source/current diagrams, all contact states, persistence, and responsive layout.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const M=require('../state-3d.js'),Story=require('../chapters-3d.js');
const base=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index-3d.html')).href;
const output=path.join(os.tmpdir(),'afterimage-diagrams-3d');fs.mkdirSync(output,{recursive:true});
const cases=[['prologue','relayA'],['prologue','relayB'],['transit','lift'],['garden','shade'],['garden','receiver']];
let browser;const errors=[];
async function open(page,id){if(await page.locator('#panel').isVisible())await page.keyboard.press('Escape');await page.evaluate(id=>openTestEncounter(id),id);await page.locator('.contact-diagram').waitFor({state:'visible'});}
async function check(page,id,bits){
 const svg=page.locator('.contact-diagram');assert.equal(await svg.getAttribute('data-target'),String(M.puzzles[id].target));assert.equal(await svg.getAttribute('data-current'),String(bits));
 assert.match(await svg.getAttribute('aria-labelledby'),/contact-title contact-description/);assert.match(await svg.locator('desc').textContent(),/Source plate:.*Your controls:/);
 for(const [row,value] of [['source',M.puzzles[id].target],['current',bits]])for(let i=0;i<3;i++){const g=svg.locator('[data-row="'+row+'"] [data-contact="'+i+'"]');assert.equal(await g.getAttribute('data-on'),String(Boolean(value&(1<<i))));const line=g.locator('.diagram-switch');assert.equal(Number(await line.getAttribute('y1'))===Number(await line.getAttribute('y2')),Boolean(value&(1<<i)),row+' switch geometry');assert.ok((await g.locator('.diagram-state').textContent()).startsWith(value&(1<<i)?'ON':'OFF'));}
 const metrics=await page.evaluate(()=>{const svg=document.querySelector('.contact-diagram'),b=svg.getBoundingClientRect(),panel=document.querySelector('.dialog'),pb=panel.getBoundingClientRect();return{width:b.width,x:b.x,right:b.right,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth||panel.scrollWidth>panel.clientWidth,labels:[...svg.querySelectorAll('text')].map(n=>{const b=n.getBBox();return{x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};}),panelHeight:pb.height,viewportHeight:innerHeight};});
 assert.equal(metrics.overflow,false,'no horizontal clipping');assert.ok(metrics.width>=250);assert.ok(metrics.x>=0&&metrics.right<=metrics.viewport);assert.ok(metrics.panelHeight<=metrics.viewportHeight);
 for(const b of metrics.labels)assert.ok(b.x>=0&&b.y>=0&&b.right<=360&&b.bottom<=208,'diagram text fits viewBox');
}
(async()=>{
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:740},{width:844,height:390}])for(const [chapter,id] of cases){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.addInitScript(()=>{let api;Object.defineProperty(window,'Afterimage3DWorld',{configurable:true,get:()=>api,set:value=>{api=value;const create=value.create;value.create=(canvas,options)=>{window.openTestEncounter=options.onInteract;return create(canvas,options);};}});});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(new URL((chapter==='prologue'?'index':chapter)+'-3d.html',base).href);await p.evaluate(([key,seed])=>localStorage.setItem(key,JSON.stringify(seed)),[M.key,M.preview(chapter)]);await p.reload();await p.locator('#start').click();await open(p,id);await check(p,id,0);assert.equal(await p.getByRole('button',{name:/^Secure the repair/}).getAttribute('aria-describedby'),'puzzle-status');assert.match(await p.locator('#puzzle-status').innerText(),/Match the controls/);
  if(viewport.width===1280)assert.equal(await p.locator('.dialog').evaluate(el=>el.scrollHeight<=el.clientHeight+1),true,'desktop repair fits without scrolling');
  const initial=await p.locator('.contact-diagram').boundingBox();const frame=await p.locator('.dialog').boundingBox();assert.ok(initial.y>=frame.y&&initial.y<frame.y+frame.height,'diagram starts in visible panel');
  // Source plate must not change while controls move through all eight possible states.
  const source=await p.locator('[data-row=source]').innerHTML();let previous=0;
  for(const bits of (process.argv.includes('--layout-only')?[]:[1,3,2,6,7,5,4,0])){const index=Math.log2(bits^previous);await p.locator('.switches button').nth(index).click();await check(p,id,bits);assert.equal(await p.locator('[data-row=source]').innerHTML(),source);assert.equal(await p.getByRole('button',{name:/^Secure the repair/}).isDisabled(),bits!==M.puzzles[id].target);previous=bits;}
  await p.locator('.contact-diagram').scrollIntoViewIfNeeded();
  const visible=await p.locator('.contact-diagram').boundingBox(),bounds=await p.locator('.dialog').boundingBox();assert.ok(visible.y>=bounds.y&&visible.y+visible.height<=bounds.y+bounds.height,'entire diagram can be seen inside the scrollable panel');
  if(viewport.height>=600)await p.locator('.dialog').evaluate(el=>el.scrollTop=0);await p.screenshot({path:path.join(output,id+'-'+viewport.width+'x'+viewport.height+'.png')});
  await p.locator('.switches button').nth(1).click();await p.reload();await p.locator('#start').click();await open(p,id);await check(p,id,2);
  await p.getByRole('button',{name:'Set the controls for me',exact:true}).click();await check(p,id,M.puzzles[id].target);assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).flags[document.querySelector('.contact-diagram').dataset.puzzle],M.key),false);
  await p.getByRole('button',{name:/^Secure the repair/}).click();assert.equal(await p.locator('#panel').isVisible(),false,'securing a repair reveals the changed room');await open(p,id);await check(p,id,M.puzzles[id].target);assert.equal(await p.locator('.switches button').count(),0);assert.match(await p.locator('.circuit-status').innerText(),/Repair secured/);assert.ok(M.validate(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.key)));
  await p.locator('.dialog').evaluate(el=>el.scrollTop=0);if(viewport.width===390)await p.screenshot({path:path.join(output,id+'-secured-mobile.png')});await context.close();
 }
 // Audit every chapter object: unrelated scenes must never inherit a stale diagram.
 for(const chapter of M.chapters){const s=M.preview(chapter);for(const o of Story.world(s).objects){const repair=cases.some(([c,id])=>c===chapter&&id===o.id);assert.equal(Boolean(Story.encounter(s,o.id).puzzle),repair,chapter+'/'+o.id);}}
 // Secured contact positions and diagrams survive the handoff without new fields.
 for(const chapter of ['prologue','transit','garden']){
   let s=M.preview(chapter);for(const [c,id] of cases.filter(([c])=>c===chapter)){for(let i=0;i<3;i++)if(M.puzzles[id].target&(1<<i))s=M.act(s,'turn',{id,index:i});s=M.act(s,id);}
   for(const action of ({prologue:['meet','flower','service','receiver'],transit:['brim','ledger'],garden:['fern','morning','brim','seat','listen']})[chapter])s=M.act(s,action);
   s=M.reset(s,({prologue:['name','song'],transit:['greeting','sequence'],garden:['fern','tuning']})[chapter]);
   for(const [c,id] of cases.filter(([c])=>c===chapter)){assert.equal(Story.encounter(s,id).puzzle.readOnly,true);assert.equal(s.flags[id+'Circuit'],M.puzzles[id].target);}assert.ok(M.validate(s));
 }
 assert.deepEqual(errors,[]);console.log('Diagrams: all five repairs, eight contact states, fixed source plates, assisted/manual alignment, saved positions, completed diagrams, and four screen sizes passed. Screenshots: '+output);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
