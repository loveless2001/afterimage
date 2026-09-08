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
