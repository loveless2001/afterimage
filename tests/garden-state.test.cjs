const {test}=require('node:test');const assert=require('node:assert/strict');
const T=require('../transit-state.js'),G=require('../garden-state.js'),Story=require('../garden-story.js');
function receipt(origin='stay',sort='book',pair=['greeting','sequence'],bring=true){const first=T.fresh(origin);T.act(first,'brim');T.act(first,'sort',sort);if(sort==='repairing'){T.act(first,'align');T.act(first,'secure');}for(const a of ['silt','sequence','message'])T.act(first,a);const s=T.reset(first,pair);T.act(s,'brim');T.act(s,'silt');if(bring&&pair.includes('sequence')){T.act(s,'bridge');T.act(s,'bring');}T.act(s,'deliver');return T.validate(s);}
function prepared(incoming=receipt(),place='shade'){const s=G.fresh(incoming);G.act(s,'fern');G.act(s,'alignLight');G.act(s,'latchShade');G.act(s,'fernAgreement');G.act(s,'place',place);G.act(s,'alignReceiver');G.act(s,'connect');G.act(s,'listen');G.act(s,'brimAgreement');return s;}
const combinations=ids=>ids.flatMap((a,i)=>ids.slice(i+1).map(b=>[a,b]));
test('all 162 inherited outcome and Garden retention combinations can reopen honestly',()=>{
 let cases=0;for(const origin of T.origins)for(const sort of ['book','ledger','repairing'])for(const transitPair of combinations(Object.keys(T.memories))){
  const incoming=receipt(origin,sort,transitPair),original=JSON.stringify(incoming),first=prepared(incoming);assert.equal(G.ready(first),true);assert.equal(first.acquired.length,4);assert.deepEqual(G.validate(first),first);
  for(const pair of combinations(G.candidates(first))){const s=G.reset(first,pair);cases++;assert.equal(s.cycle,2);assert.deepEqual(s.kept,pair);assert.deepEqual(s.incoming,incoming);assert.equal(s.place,'shade');assert.equal(s.shadeFixed,true);assert.equal(s.receiverFixed,true);assert.equal(s.fernAgreement,true);assert.equal(s.brimAgreement,true);assert.equal(G.act(s,'open','daylight'),false);
   G.act(s,'fern');G.act(s,'shade');G.act(s,'receiver');assert.equal(G.act(s,'listen'),false);assert.equal(G.act(s,'mirror',0),false);assert.equal(G.act(s,'contact',0),false);
   assert.equal(G.act(s,'quiet'),pair.includes('tuning'));assert.equal(G.act(s,'evening',true),pair.includes('sequence'));assert.equal(G.act(s,'open',pair.includes('sequence')?'evening':'daylight'),true);
   assert.deepEqual(G.validate(JSON.parse(JSON.stringify(s))),s);assert.equal(s.open,pair.includes('sequence')?'evening':'daylight');assert.equal(s.quiet,pair.includes('tuning'));assert.equal(s.courierDuty,pair.includes('sequence'));assert.deepEqual(s.acquired,pair);assert.match(Story.receipt(s).paragraphs.join(' '),/garden court and its public access path/i);
   const settled=JSON.stringify(s);for(const action of ['fern','mirror','alignLight','latchShade','contact','alignReceiver','connect','listen','place','fernAgreement','brimAgreement','shade','receiver','quiet','evening','open'])assert.equal(G.act(s,action,true),false);assert.equal(JSON.stringify(s),settled);assert.throws(()=>G.reset(s,pair));
  }assert.equal(JSON.stringify(incoming),original);assert.equal(first.cycle,1);
 }assert.equal(cases,162);
});
test('light simulation has one real route and saves partial work before latching',()=>{
 let solutions=0;for(let n=0;n<16;n++){const s=G.fresh(receipt());s.mirrors=[0,1,2,3].map(i=>(n>>i)&1);if(G.lightPath(s).connected){solutions++;assert.deepEqual(s.mirrors,G.mirrorSolution);}}
 assert.equal(solutions,1);const s=G.fresh(receipt());assert.equal(G.act(s,'latchShade'),false);G.act(s,'mirror',0);assert.deepEqual(G.validate(JSON.parse(JSON.stringify(s))),s);G.act(s,'alignLight');assert.equal(s.shadeFixed,false);assert.equal(G.lightPath(s).connected,true);G.act(s,'latchShade');assert.equal(G.act(s,'mirror',0),false);
});
test('receiver circuit has one continuous solution and assistance never commits the repair',()=>{
 let solutions=0;const s=G.fresh(receipt());for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){s.contacts=[a,b,c];if(G.receiverCircuit(s).connected){solutions++;assert.deepEqual(s.contacts,G.receiverLayout.solution);}}assert.equal(solutions,1);
 s.contacts=[0,0,0];assert.equal(G.act(s,'connect'),false);G.act(s,'contact',0);assert.deepEqual(G.validate(JSON.parse(JSON.stringify(s))),s);G.act(s,'alignReceiver');assert.equal(s.receiverFixed,false);G.act(s,'connect');assert.equal(s.heard,false);G.act(s,'listen');assert.ok(s.acquired.includes('tuning'));
});
test('upkeep requires the offered job and evening duty can be declined',()=>{
 const s=G.fresh(receipt());assert.equal(G.act(s,'fernAgreement'),false);assert.equal(G.act(s,'brimAgreement'),false);assert.equal(G.act(s,'place','gate'),false);
 G.act(s,'fern');G.act(s,'alignLight');G.act(s,'latchShade');assert.equal(s.fernAgreement,false);G.act(s,'fernAgreement');assert.equal(s.brimAgreement,false);
 const returned=G.reset(prepared(),['sequence','fern']);G.act(returned,'fern');G.act(returned,'shade');G.act(returned,'receiver');assert.equal(G.act(returned,'open','evening'),false);G.act(returned,'evening',true);assert.equal(returned.courierDuty,true);G.act(returned,'evening',false);assert.equal(returned.courierDuty,false);G.act(returned,'evening',true);G.act(returned,'open','daylight');assert.equal(returned.evening,false);assert.equal(returned.courierDuty,false);assert.deepEqual(G.validate(returned),returned);
});
test('world facts and external testimony survive without becoming personal memories',()=>{
 const first=prepared(receipt('witness','repairing',['sequence','message'],false),'receiver'),s=G.reset(first,['fern','tuning']);assert.equal(s.incoming.siltReturned,false);assert.equal(s.incoming.bridge,false);assert.equal(s.place,'receiver');assert.equal(s.acquired.includes('message'),false);assert.equal(s.acquired.includes('sequence'),false);
 assert.match(Story.transitRecord(s).join(' '),/objection is attached/);assert.match(Story.transitRecord(s).join(' '),/far Transit platform/);assert.match(Story.brim(s).paragraphs.join(' '),/without claiming to remember/);assert.equal(G.act(s,'evening',true),false);
 const absent=prepared(receipt('obedience','ledger',['greeting','sequence']));assert.match(Story.transitRecord(absent).join(' '),/wording unavailable/);assert.match(Story.archiveRecord(absent),/not been restored/);assert.match(Story.brim(absent).paragraphs.join(' '),/not the same book/);
});
test('Garden imports reject unfinished Transit and impossible progress without changing records',()=>{
 assert.throws(()=>G.fresh(T.fresh('stay')));const good=G.reset(prepared(),['fern','tuning']);
 for(const edit of [s=>s.kind='other',s=>s.version=2,s=>s.incoming.delivered=false,s=>s.room='chorus',s=>s.cycle=3,s=>s.kept=['fern','fern'],s=>s.acquired.push('message'),s=>s.contacts=[0,0,0],s=>s.mirrors=[1,1,1,1],s=>s.place=null,s=>s.fernAgreement=false,s=>s.brimAgreement=false,s=>s.quiet=true,s=>s.evening=true,s=>s.courierDuty=true,s=>s.open='evening',s=>s.player.x=999,s=>s.reunion='true']){
  const candidate=structuredClone(good);edit(candidate);const original=JSON.stringify(candidate);assert.throws(()=>G.validate(candidate));assert.equal(JSON.stringify(candidate),original);
 }
 assert.throws(()=>G.reset(prepared(),['fern','fern']));assert.throws(()=>G.reset(prepared(),['message','tuning']));assert.throws(()=>G.reset(G.fresh(receipt()),['greeting','sequence']));
 const first=G.fresh(receipt());first.kept=['fern','tuning'];assert.throws(()=>G.validate(first));
 for(const id of ['book','ledger','shelf']){const s=G.preview(id);assert.deepEqual(G.validate(s),s);assert.equal(s.incoming.delivered,true);assert.equal(s.cycle,1);}
});

test('a connected bridge does not imply Silt crossed it',()=>{
 const incoming=receipt('stay','book',['greeting','sequence'],false);incoming.bridge=true;T.validate(incoming);const s=G.fresh(incoming);
 assert.equal(s.incoming.siltReturned,false);assert.match(Story.transitRecord(s).join(' '),/bridge is connected/);assert.match(Story.transitRecord(s).join(' '),/did not record Silt crossing back/);assert.match(Story.quiet(s).paragraphs.join(' '),/bridge is connected/);
});
