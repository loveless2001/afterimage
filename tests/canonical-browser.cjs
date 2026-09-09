'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {once}=require('node:events');
const {chromium}=require('@playwright/test');
const {createServer}=require('../scripts/serve.cjs');
const {aliases}=require('../scripts/runtime-files.cjs');
const S=require('../score-state.js');
const root=path.resolve(__dirname,'..');
let browser,server;
(async()=>{
  server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  browser=await chromium.launch({headless:true});const errors=[];
  for(const mode of ['http','file']){
    const context=await browser.newContext();await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
    const base=mode==='http'?`http://127.0.0.1:${server.address().port}/`:pathToFileURL(root+path.sep).href;
    await p.goto(base+'index.html');
    const current=JSON.stringify(S.fresh()),old='older-edition-record-unchanged';
    await p.evaluate(([key,value,old])=>{localStorage.setItem(key,value);localStorage.setItem('afterimage.campaign.3d.v1',old);localStorage.setItem('afterimage.prologue.v1',old);},[S.key,current,old]);
    for(const alias of aliases){
      await p.goto(base+alias+'?entry-check=1#saved');await p.waitForURL(url=>url.pathname.endsWith('/index.html')&&url.search==='?entry-check=1'&&url.hash==='#saved');
      await p.locator('#start').waitFor();assert.equal(await p.locator('#fatal').isVisible(),false,mode+'/'+alias);
      assert.equal(await p.locator('a[href="index-3d.html"]').count(),0);
      assert.deepEqual(await p.evaluate(key=>[localStorage.getItem(key),localStorage.getItem('afterimage.campaign.3d.v1'),localStorage.getItem('afterimage.prologue.v1')],S.key),[current,old,old],mode+'/'+alias+' modified saves');
    }
    await p.context().close();
  }
  assert.deepEqual(errors,[]);console.log('CANONICAL ENTRY PASS: all ten old URLs open the current game over HTTP and file://, preserve query/hash and leave current and old saves unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}});
