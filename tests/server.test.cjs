const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {createServer}=require('../scripts/serve.cjs');
const {files,retired,aliases}=require('../scripts/runtime-files.cjs');

test('canonical server serves only the active game and old-entry redirects',async()=>{
  const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const page=await fetch(base);assert.equal(page.status,200);const html=await page.text();assert.match(html,/score-game\.js/);assert.doesNotMatch(html,/legacy-link|src="game\.js"/);
    for(const name of files){const r=await fetch(base+'/'+name+'?test=1');assert.equal(r.status,200,name);assert.match(r.headers.get('content-type'),name.endsWith('.js')?/javascript/:name.endsWith('.css')?/css/:/html/);if(aliases.includes(name))assert.match(await r.text(),/location\.replace\('index\.html'/);}
    assert.equal((await fetch(base+'/score-3d.css',{method:'HEAD'})).status,200);
    for(const name of [...retired,'legacy/index.html','legacy/index-3d.html','legacy/engine-3d.js','research/README.md','backups/','SCORE-DESIGN.md','.git/config','package.json','tests/score-state.test.cjs','%2e%2e%2fpackage.json'])assert.equal((await fetch(base+'/'+name)).status,404,name);
    assert.equal((await fetch(base,{method:'POST'})).status,405);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
