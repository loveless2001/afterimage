const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../state-3d.js');
const Story=require('../chapters-3d.js');

test('enabled story actions are executable at each campaign preparation step',()=>{
 const scenarios=[];
 for(const chapter of S.chapters){let s=S.preview(chapter);scenarios.push(s);
  const act=(action,value)=>{s=S.act(s,action,value);scenarios.push(s);};
  const repair=id=>{for(let i=0;i<3;i++)if(S.puzzles[id].target&(1<<i))act('turn',{id,index:i});act(id);};
  if(chapter==='prologue'){for(const a of ['meet','flower','service','receiver'])act(a);s=S.reset(s,['name','song']);scenarios.push(s);act('meet');repair('relayA');repair('relayB');}
  if(chapter==='transit'){act('brim');act('ledger');s=S.reset(s,s.acquired.slice(0,2));scenarios.push(s);repair('lift');act('deliver');}
  if(chapter==='garden'){act('fern');repair('shade');act('morning');repair('receiver');act('listen');act('brim');act('seat');s=S.reset(s,['fern','tuning']);scenarios.push(s);act('inspect','court');}
  if(chapter==='chorus'){act('counter');act('receiver');act('evidence');act('mode','round');for(let i=0;i<3;i++)act('voice',i);s=S.reset(s,['counter','address']);scenarios.push(s);for(let i=0;i<3;i++)act('voice',i);}
  if(chapter==='release')for(let i=0;i<3;i++)act('inspect',i);
 }
 for(const s of scenarios)for(const object of Story.world(s).objects){for(const c of Story.encounter(s,object.id).choices||[]){
  if(c.disabled){assert.ok(c.detail||c.action==='voice',s.chapter+'/'+object.id+': unavailable choice needs an explanation');continue;}
  if(c.action==='$reset')assert.equal(S.canReset(s),true);
  if(!c.action||c.action.startsWith('$'))continue;
  assert.doesNotThrow(()=>S.act(s,c.action,c.value),s.chapter+'/'+s.phase+'/'+object.id+'/'+c.label);
 }}
});

test('acquisition choices change their scene and cannot silently repeat',()=>{
 for(const [id,action] of [['moth','meet'],['service','service'],['receiver','receiver']]){
  const before=S.fresh(),after=S.act(before,action),initial=Story.encounter(before,id),result=Story.encounter(after,id);
  assert.notEqual(result.title,initial.title);assert.ok(result.lines.some(l=>l.includes('Memory found:')));
  assert.equal(result.choices.some(c=>c.action===action),false);
 }
});

test('released route and song agree with the original prologue losses',()=>{
 let s=S.fresh();for(const action of ['meet','flower','service','receiver'])s=S.act(s,action);
 const songLost=S.reset(s,['name','route']);assert.match(Story.encounter(songLost,'receiver').title,/static/);assert.equal(Story.encounter(songLost,'receiver').choices.some(c=>c.action==='$listen'),false);
 const routeLost=S.reset(s,['name','song']);assert.match(Story.encounter(routeLost,'service').title,/gone/);assert.match(Story.encounter(routeLost,'service').lines.join(' '),/Restore both relays/);
});


test('service index reports actual secured repairs before and after the handoff',()=>{
 const repair=(s,id)=>{for(let i=0;i<3;i++)if(S.puzzles[id].target&(1<<i))s=S.act(s,'turn',{id,index:i});return S.act(s,id);};
 for(const pair of [['name','song'],['name','route'],['song','route']])for(const mask of [0,1,2,3])for(const timing of ['before','after']){
   let s=S.fresh();for(const action of ['meet','flower','service','receiver'])s=S.act(s,action);
   if(timing==='after')s=S.reset(s,pair);
   for(const [i,id] of ['relayA','relayB'].entries())if(mask&(1<<i))s=repair(s,id);
   if(timing==='before')s=S.reset(s,pair);
   const panel=Story.encounter(s,'service'),text=panel.lines.join(' '),bypass=pair.includes('route');
   for(const [i,id] of ['relayA','relayB'].entries()){
     const label=i?'East':'West',done=Boolean(mask&(1<<i));assert.equal(s.flags[id],done);assert.equal(s.world[i?'archiveRelayB':'archiveRelayA'],done);
     assert.ok(text.includes(label+' relay: '+(done?'repaired and secured.':bypass?'unrepaired; optional':'still needs repair.')));
     assert.equal(Story.encounter(s,id).puzzle.readOnly,done);
     const nav=panel.choices.find(c=>c.value===id);assert.ok(nav.label.startsWith(done?'Inspect repaired':bypass?'Inspect':'Repair'));
   }
   if(mask===3){assert.match(panel.title,/Both relays are repaired/);assert.doesNotMatch(text,/Restore both|still needs|not yet secured/);assert.ok(panel.choices.some(c=>c.value==='moth'));}
   if(mask===1&&!bypass){assert.match(text,/Only the east relay/);assert.doesNotMatch(text,/Restore both/);}
   if(mask===2&&!bypass){assert.match(text,/Only the west relay/);assert.doesNotMatch(text,/Restore both/);}
   const returned=S.act(s,'meet');assert.equal(S.canFinish(returned),mask===3||bypass);
   if(mask===3||bypass){assert.ok(Story.encounter(returned,'service').choices.some(c=>c.value==='closure'));assert.doesNotMatch(S.objective(returned).step,/relay contacts/);}
   assert.deepEqual(S.validate(s),s);
 }
});

test('an aligned but unsecured relay is not reported as repaired',()=>{
 let s=S.fresh();for(const a of ['meet','flower','service','receiver'])s=S.act(s,a);s=S.reset(s,['name','song']);
 for(const i of [0,2])s=S.act(s,'turn',{id:'relayA',index:i});
 const panel=Story.encounter(s,'service');assert.match(panel.lines.join(' '),/West relay: contacts aligned; the repair is not yet secured/);assert.equal(panel.choices.find(c=>c.value==='relayA').label,'Secure west relay');assert.equal(s.flags.relayA,false);
});
