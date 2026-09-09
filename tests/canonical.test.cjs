const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {build}=require('../scripts/build.cjs');
const {assets,files,aliases,retired}=require('../scripts/runtime-files.cjs');
const root=path.resolve(__dirname,'..');

test('canonical entry ships every referenced runtime asset and removes alternate-edition links',async()=>{
  const html=await fs.readFile(path.join(root,'index.html'),'utf8');
  const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
  for(const ref of refs)assert(assets.includes(ref),'Noncanonical dependency or link: '+ref);
  assert(refs.includes('score-game.js'));assert(!refs.includes('game.js'));
  for(const launcher of ['launch-windows.cmd','launch-perfect-score.cmd'])assert.match(await fs.readFile(path.join(root,launcher),'utf8'),/%~dp0index\.html/);
  for(const name of aliases){const alias=await fs.readFile(path.join(root,name),'utf8');assert.match(alias,/location\.replace\('index\.html'\+location.search\+location.hash\)/);assert.doesNotMatch(alias,/<script src=|stylesheet/);}
});

test('build removes known superseded outputs and excludes archival and research sources',async()=>{
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'afterimage-canonical-build-'));
  try{
    for(const name of retired)await fs.writeFile(path.join(output,name),'old edition');
    await build(output);
    assert.deepEqual((await fs.readdir(output)).sort(),[...files,'.nojekyll'].sort());
    for(const name of files)assert.deepEqual(await fs.readFile(path.join(output,name)),await fs.readFile(path.join(root,name)));
    await fs.writeFile(path.join(output,'personal-note.txt'),'keep this');
    await assert.rejects(build(output),/Unexpected files/);
    assert.equal(await fs.readFile(path.join(output,'personal-note.txt'),'utf8'),'keep this');
  }finally{
    // Remove only files this test explicitly created in its own temporary directory.
    for(const name of [...files,...retired,'.nojekyll','personal-note.txt'])await fs.unlink(path.join(output,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
    await fs.rmdir(output);
  }
});

test('superseded source and tests retain their promotion-time hashes',async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(root,'legacy/ARCHIVE-MANIFEST.json'),'utf8'));
  assert.equal(manifest.files.length,56);
  for(const file of manifest.files){const bytes=await fs.readFile(path.join(root,'legacy',file.path));assert.equal(crypto.createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),file.lfSha256,file.path);}
});
