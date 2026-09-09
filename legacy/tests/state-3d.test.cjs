const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../state-3d.js');
const pairs = a => a.flatMap((x,i)=>a.slice(i+1).map(y=>[x,y]));
const act = (s,a,v)=>S.act(s,a,v);
function repair(s,id) {
  for(let i=0;i<3;i++) if(S.puzzles[id].target & (1<<i)) s=act(s,'turn',{id,index:i});
  return act(s,id);
}
function prepared(chapter, s=S.preview(chapter), mode='local') {
  if(chapter==='prologue') for(const a of ['meet','flower','service','receiver']) s=act(s,a);
  if(chapter==='transit') for(const a of ['brim','ledger']) s=act(s,a);
  if(chapter==='garden') {
    for(const a of ['fern','morning','brim','seat']) s=act(s,a);
    s=repair(s,'shade'); s=repair(s,'receiver'); s=act(s,'listen');
  }
  if(chapter==='chorus') {
    s=act(s,'mode',mode); s=act(s,'counter'); s=act(s,'receiver'); s=act(s,'evidence');
    for(const v of mode==='central'?[0]:mode==='round'?[0,1,2]:[2,0,1]) s=act(s,'voice',v);
  }
  if(chapter==='release') for(const v of [2,0,1]) s=act(s,'inspect',v);
  return s;
}
function returned(s,pair) {
  s=S.reset(s,pair);
  if(s.chapter==='prologue') {s=act(s,'meet'); if(!s.kept.includes('route')) {s=repair(s,'relayA');s=repair(s,'relayB');}}
  if(s.chapter==='transit') {s=repair(s,'lift');s=act(s,'deliver');}
  if(s.chapter==='garden') s=act(s,'inspect','court');
  if(s.chapter==='chorus') for(const v of s.flags.mode===1?[0]:[0,1,2]) s=act(s,'voice',v);
  return s;
}
test('new namespace and strict self-contained previews never read legacy saves',()=>{
  assert.equal(S.key,'afterimage.campaign.3d.v1');
  assert.equal(S.validate({version:1,chapter:'prologue',memories:['name','route']}),null);
  for(const chapter of S.chapters) {
    const s=S.preview(chapter); assert.equal(s.chapter,chapter);assert.equal(s.preview,true);assert.deepEqual(S.validate(s),s);
    assert.equal(s.acquired.length,chapter==='prologue'?0:2);
    assert.equal(s.history.length,S.chapters.indexOf(chapter));
  }
});
test('every memory pair has a public route through every chapter outcome',()=>{
  const choices={prologue:['clear','witness','stay'],transit:['book','ledger','both','omit'],garden:['court','district'],chorus:['weather','signal','uncertain']};
  for(const chapter of S.chapters.slice(0,4)) {
    const ready=prepared(chapter);assert.equal(S.canReset(ready),true);
    assert.equal(ready.acquired.length,chapter==='prologue'?3:4);
    for(const pair of pairs(ready.acquired)) {
      const back=returned(ready,pair);assert.equal(S.canFinish(back),true,chapter+pair);
      for(const outcome of choices[chapter]) {
        if(chapter==='prologue' && outcome==='witness' && !pair.includes('song')) {assert.throws(()=>act(back,'finish',outcome));continue;}
        const end=act(back,'finish',outcome);assert.equal(end.phase,'finished');assert.deepEqual(S.validate(end),end);
        const next=S.advance(end);assert.deepEqual(next.kept,pair);assert.deepEqual(next.acquired,pair);assert.equal(next.phase,'work');
        assert.deepEqual(next.world,end.world);assert.equal(next.ending,null);assert.deepEqual(next.position,{x:0,z:5.4,yaw:0,pitch:0});
      }
    }
  }
});
test('physical repairs and external objects survive reset without relearning',()=>{
  let s=prepared('garden');const world=structuredClone(s.world);s=S.reset(s,['greeting','sequence']);
  assert.equal(s.flags.shade,true);assert.equal(s.flags.receiver,true);assert.deepEqual(s.world,world);
  assert.ok(!s.kept.includes('fern'));s=act(s,'inspect','court');assert.equal(S.canFinish(s),true);
  let p=prepared('prologue');p=repair(p,'relayA');const reset=S.reset(p,['name','song']);assert.equal(reset.flags.relayA,true);assert.equal(reset.world.archiveRelayA,true);
});
test('circuits require actual contact operations and explicit commit',()=>{
  let s=S.fresh();assert.throws(()=>act(s,'relayA'));assert.throws(()=>act(s,'turn',{id:'relayA',index:3}));
  s=act(s,'turn',{id:'relayA',index:0});assert.equal(s.flags.relayA,false);assert.throws(()=>act(s,'relayA'));
  s=act(s,'turn',{id:'relayA',index:2});assert.equal(s.flags.relayA,false);s=act(s,'relayA');assert.equal(s.flags.relayA,true);
  assert.throws(()=>act(s,'turn',{id:'relayA',index:1}));
});
test('all coordination methods work while acknowledgement rules differ',()=>{
  for(const mode of ['central','round','local']) {
    let s=prepared('chorus',S.preview('chorus'),mode);s=returned(s,['counter','address']);s=act(s,'finish','uncertain');
    assert.equal(s.world.centralExclusion,mode==='central');assert.equal(s.world.unsupportedReport,false);
  }
  let s=act(S.preview('chorus'),'mode','round');assert.throws(()=>act(s,'voice',2));
  s=act(s,'voice',0);assert.throws(()=>act(s,'voice',0));s=act(s,'mode','local');s=act(s,'voice',2);assert.equal(s.flags.voices,4);
});
test('garden optional schedules and self-duty do not gate a court reopening',()=>{
  const ready=prepared('garden');assert.equal(ready.flags.daylight,false);assert.equal(ready.flags.evening,false);assert.equal(ready.flags.duty,false);
  let s=returned(ready,['fern','tuning']);s=act(s,'finish','district');assert.equal(s.world.falseClearance,true);assert.equal(s.world.residentsErased,false);
  let checked=returned(ready,['fern','tuning']);checked=act(checked,'inspect','district');checked=act(checked,'finish','district');assert.equal(checked.world.falseClearance,false);
  assert.throws(()=>act(S.preview('garden'),'evening'));assert.throws(()=>act(S.preview('garden'),'duty'));
});
test('uncommitted operations and invalid actions leave the caller untouched',()=>{
  const s=prepared('prologue'), before=structuredClone(s);
  assert.throws(()=>S.reset(s,['name','name']));assert.deepEqual(s,before);
  const copy=S.reset(s,['name','route']);copy.world.mothPresent=false;copy.flags.flower=false;copy.acquired.push('fake');
  assert.deepEqual(s,before);assert.equal(S.validate(copy),null);
  assert.throws(()=>act(s,'finish','clear'));assert.throws(()=>S.advance(s));
});
test('validation rejects forged nested facts, progress, history and provenance',()=>{
  const valid=returned(prepared('garden'),['fern','tuning']);
  const forgeries=[
    s=>s.world.mothPresent=false,s=>s.world.unknown=true,s=>s.flags.court=false,s=>s.flags.shadeCircuit=7,
    s=>s.acquired.push('counter'),s=>s.kept=['name','song'],s=>s.history[0].outcome='clear',
    s=>s.history[0].consequences.push('residentsErased'),s=>s.phase='finished',s=>s.ending='district',
    s=>s.position.pitch=2,s=>s.position.x=Infinity,s=>s.position.extra=1,s=>s.origin='release',
    s=>s.events.push({action:'finish',value:'madeup'}),s=>s.events[0].unexpected=true,s=>s.extra=true
  ];
  for(const mutate of forgeries){const bad=structuredClone(valid);mutate(bad);assert.equal(S.validate(bad),null,mutate.toString());}
  const moved=structuredClone(valid);moved.position={x:2,z:-7,yaw:0.7,pitch:-0.8};assert.deepEqual(S.validate(moved),moved);
  const reordered=JSON.parse(JSON.stringify(valid));reordered.world=Object.fromEntries(Object.entries(reordered.world).reverse());assert.ok(S.validate(reordered));
});
test('costly endings carry through complete campaigns without resurrection or hard lock',()=>{
  for(let variant=0;variant<6;variant++) {
    let s=prepared('prologue',S.fresh());s=returned(s,variant%2?['song','route']:['name','song']);
    s=act(s,'finish',['clear','witness','stay'][variant%3]);const erased=s.world.archiveCleared;
    s=prepared('transit',S.advance(s));s=returned(s,pairs(s.acquired)[variant]);s=act(s,'omitWarning');s=act(s,'finish',['book','ledger','both'][variant%3]);
    s=prepared('garden',S.advance(s));s=returned(s,pairs(s.acquired)[variant]);s=act(s,'finish','district');
    s=prepared('chorus',S.advance(s),['central','round','local'][variant%3]);s=returned(s,pairs(s.acquired)[variant]);s=act(s,'finish',variant%2?'signal':'weather');
    s=prepared('release',S.advance(s));assert.equal(s.world.dispatchOmitted,true);assert.equal(s.world.falseClearance,true);assert.equal(s.world.unsupportedReport,true);assert.equal(s.world.mothPresent,!erased);
    s=act(s,'finish','closeall');assert.equal(s.history.length,5);assert.equal(s.world.residentsErased,true);assert.equal(s.world.mothPresent,false);assert.deepEqual(S.validate(s),s);assert.throws(()=>S.advance(s));
  }
});
test('release requires three distinct inspections for each final plan',()=>{
  for(const plan of ['complete','witness','remain','closeall']) {
    let s=S.preview('release');s=act(s,'inspect',0);s=act(s,'inspect',0);assert.equal(S.canFinish(s),false);assert.throws(()=>act(s,'finish',plan));
    s=act(s,'inspect',1);s=act(s,'inspect',2);assert.equal(S.canFinish(s),true);
    if(plan==='remain') {assert.throws(()=>act(s,'finish',plan));s=act(s,'counterOffer');}
    s=act(s,'finish',plan);assert.equal(s.ending,plan);assert.deepEqual(S.validate(s),s);
  }
});

test('optional acts have explicit guards and independent external consequences',()=>{
  let transit=prepared('transit');assert.throws(()=>act(transit,'silt'));
  let back=S.reset(transit,['greeting','sequence']);assert.throws(()=>act(back,'silt'));back=act(back,'bridge');back=act(back,'silt');
  assert.equal(back.world.bridgeCrossed,true);assert.equal(back.world.siltReturned,true);
  let noSequence=S.reset(transit,['song','route']);noSequence=act(noSequence,'bridge');assert.throws(()=>act(noSequence,'silt'));
  let garden=prepared('garden');assert.equal(garden.flags.sit,false);garden=act(garden,'sit');garden=returned(garden,['fern','tuning']);garden=act(garden,'finish','court');assert.equal(garden.world.sharedMorning,true);
  let alone=returned(prepared('garden'),['fern','tuning']);alone=act(alone,'finish','court');assert.equal(alone.world.sharedMorning,false);
  let release=prepared('release');release=act(release,'finish','complete');assert.equal(release.world.residentExceptions,true);assert.equal(release.world.residentsDisplaced,false);assert.equal(release.world.residentsErased,false);
});
test('all safe Release plans preserve residents and record the enacted service plan',()=>{
  for(const plan of ['complete','witness','remain']) {
    let s=prepared('release');
    const residentsBefore={mothPresent:s.world.mothPresent,flowerPresent:s.world.flowerPresent};
    if(plan==='remain') s=act(s,'counterOffer');
    s=act(s,'finish',plan);
    assert.equal(s.world.residentExceptions,true,plan);
    assert.equal(s.world.residentsErased,false,plan);
    assert.equal(s.world.residentsDisplaced,false,plan);
    assert.equal(s.world.mothPresent,residentsBefore.mothPresent,plan);
    assert.equal(s.world.flowerPresent,residentsBefore.flowerPresent,plan);
    assert.equal(s.world.gardenOpen,true,plan);
    assert.equal(s.world.networkClosed,plan!=='remain',plan);
    assert.equal(s.world.witnessLeft,plan==='witness',plan);
    assert.equal(s.world.stayedBehind,plan==='remain',plan);
    assert.equal(s.flags.counterOffer,plan==='remain',plan);
    const receipt=s.history.at(-1);
    assert.ok(receipt.consequences.includes('residentExceptions'),plan);
    assert.equal(receipt.consequences.includes('networkClosed'),plan!=='remain',plan);
    assert.deepEqual(S.validate(s),s);
  }
});
test('source visits gate new reviews while legacy v1 evidence acknowledgements remain valid',()=>{
  const legacy=prepared('chorus');
  assert.equal(Object.hasOwn(legacy.flags,'sources'),false);
  assert.equal(legacy.flags.evidence,true);
  assert.deepEqual(S.validate(JSON.parse(JSON.stringify(legacy))),legacy);
  let s=S.preview('chorus');
  assert.throws(()=>act(s,'readSource',6));assert.throws(()=>act(s,'readSource',-1));
  s=act(s,'readSource',0);s=act(s,'readSource',0);assert.equal(s.flags.sources,1);
  assert.throws(()=>act(s,'evidence'));
  for(const i of [5,2,4,1,3])s=act(s,'readSource',i);
  assert.equal(s.flags.sources,63);s=act(s,'evidence');assert.equal(s.flags.evidence,true);
  assert.deepEqual(S.validate(s),s);
  const forged=structuredClone(s);forged.flags.sources=31;assert.equal(S.validate(forged),null);
});
function eveningGarden(pair=['sequence','fern'], consent=true) {
  let s=returned(prepared('garden'),pair);s=act(s,'daylight');s=act(s,'evening');
  if(consent)s=act(s,'duty');return s;
}
test('derived Garden hours require a retained sequence and voluntary dusk acceptance',()=>{
  for(const c of S.chapters)assert.deepEqual(S.gardenSchedule(S.preview(c)),{eveningProposed:false,evening:false,acceptedDuty:false,needsRenewal:false,gardenAcceptedDuty:false});
  let proposed=eveningGarden(['sequence','fern'],false);
  assert.deepEqual(S.gardenSchedule(proposed),{eveningProposed:true,evening:false,acceptedDuty:false,needsRenewal:false,gardenAcceptedDuty:false});
  const noSequence=eveningGarden(['fern','tuning']);assert.equal(S.gardenSchedule(noSequence).evening,false);
  const accepted=act(proposed,'duty');assert.equal(S.gardenSchedule(accepted).evening,true);
  const done=act(accepted,'finish','court');assert.equal(S.gardenSchedule(done).acceptedDuty,true);assert.equal(S.gardenSchedule(done).gardenAcceptedDuty,true);
  assert.deepEqual(done.history.at(-1).consequences,['gardenOpen']);
  assert.deepEqual(S.validate(done),done);
});
test('dusk duties expire at the next reset and only an explicit retained-sequence renewal restores them',()=>{
  const garden=act(eveningGarden(),'finish','court');
  let chorus=prepared('chorus',S.advance(garden));assert.equal(S.gardenSchedule(chorus).evening,true);
  assert.throws(()=>act(chorus,'renewDuty'));
  const lost=S.reset(chorus,['counter','address']);assert.equal(S.gardenSchedule(lost).needsRenewal,true);assert.equal(S.gardenSchedule(lost).acceptedDuty,false);assert.throws(()=>act(lost,'renewDuty'));
  chorus=S.reset(chorus,['sequence','counter']);assert.equal(S.gardenSchedule(chorus).evening,false);
  chorus=act(chorus,'renewDuty');assert.equal(chorus.flags.duty,true);assert.equal(S.gardenSchedule(chorus).needsRenewal,false);
  for(const i of [0,1,2])chorus=act(chorus,'voice',i);chorus=act(chorus,'finish','uncertain');
  for(const plan of ['complete','witness','remain','closeall']) {
    let release=prepared('release',S.advance(chorus));assert.equal(S.gardenSchedule(release).evening,true);
    if(plan==='remain')release=act(release,'counterOffer');release=act(release,'finish',plan);
    assert.equal(S.gardenSchedule(release).evening,plan==='remain',plan);
    assert.equal(S.gardenSchedule(release).acceptedDuty,plan==='remain',plan);
    assert.equal(S.gardenSchedule(release).gardenAcceptedDuty,true,plan);
    assert.deepEqual(S.validate(release),release);
  }
  const daylight=returned(prepared('chorus'),['counter','address']);assert.throws(()=>act(daylight,'renewDuty'));
});
test('optional quiet replies require retained tuning, while a receiver answer remains open to every pair',()=>{
  let garden=prepared('garden');assert.throws(()=>act(garden,'restoreQuiet'));
  const lostGarden=S.reset(garden,['greeting','sequence']);assert.throws(()=>act(lostGarden,'restoreQuiet'));
  garden=S.reset(garden,['fern','tuning']);garden=act(garden,'restoreQuiet');assert.equal(garden.flags.quiet,true);assert.deepEqual(S.validate(garden),garden);
  let chorus=prepared('chorus');assert.throws(()=>act(chorus,'privateReply'));assert.throws(()=>act(chorus,'answerReceiver','listen'));
  const lostChorus=S.reset(chorus,['counter','address']);assert.throws(()=>act(lostChorus,'privateReply'));
  for(const reply of ['listen','space']) {const answered=act(lostChorus,'answerReceiver',reply);assert.equal(answered.flags.addressReply,reply);assert.deepEqual(S.validate(answered),answered);}
  assert.throws(()=>act(lostChorus,'answerReceiver','promise'));
  chorus=S.reset(chorus,['tuning','counter']);chorus=act(chorus,'privateReply');assert.equal(chorus.flags.privateReply,true);assert.deepEqual(S.validate(chorus),chorus);
  const forged=structuredClone(lostChorus);forged.flags.privateReply=true;assert.equal(S.validate(forged),null);
});


// Immutable save fixtures generated by the committed state module at 804d4f9.
// They intentionally predate source-visit and optional duty/reply fields.
test('committed 804d4f9 save fixtures restore without migration or changed facts',()=>{
  const fixtures=[{"kind":"afterimage.3d","version":1,"chapter":"chorus","phase":"return","flags":{"evidence":true,"counter":true,"receiver":true,"mode":1,"voices":0},"world":{"mothPresent":true,"flowerPresent":true,"archiveCleared":false,"archiveWitnessed":true,"archiveStayed":false,"dispatchDelivered":true,"dispatchOmitted":false,"brimBookSaved":true,"ledgerSaved":false,"liftSpent":false,"gardenOpen":true,"districtCertified":false,"falseClearance":false,"sharedMorning":false,"centralExclusion":false,"routeRestored":false,"unsupportedReport":false,"networkClosed":false,"residentsErased":false,"residentsDisplaced":false,"witnessLeft":false,"stayedBehind":false,"archiveRelayA":true,"archiveRelayB":true,"publicLiftRepaired":false,"gardenShadeRepaired":true,"gardenReceiverRepaired":true,"flowerPlaced":true,"siltReturned":false,"bridgeCrossed":false,"residentExceptions":false},"acquired":["fern","tuning","counter","address"],"kept":["counter","address"],"history":[{"chapter":"prologue","outcome":"witness","consequences":["archiveWitnessed"]},{"chapter":"transit","outcome":"book","consequences":["dispatchDelivered","brimBookSaved"]},{"chapter":"garden","outcome":"court","consequences":["gardenOpen"]}],"ending":null,"position":{"x":0,"z":5.4,"yaw":0,"pitch":0},"preview":true,"origin":"chorus","events":[{"action":"counter","value":null},{"action":"receiver","value":null},{"action":"evidence","value":null},{"action":"mode","value":"central"},{"action":"voice","value":0},{"action":"reset","value":["counter","address"]}]},{"kind":"afterimage.3d","version":1,"chapter":"release","phase":"finished","flags":{"counterOffer":false,"inspected":7},"world":{"mothPresent":true,"flowerPresent":true,"archiveCleared":false,"archiveWitnessed":true,"archiveStayed":false,"dispatchDelivered":true,"dispatchOmitted":false,"brimBookSaved":true,"ledgerSaved":false,"liftSpent":false,"gardenOpen":true,"districtCertified":false,"falseClearance":false,"sharedMorning":false,"centralExclusion":false,"routeRestored":true,"unsupportedReport":false,"networkClosed":true,"residentsErased":false,"residentsDisplaced":false,"witnessLeft":true,"stayedBehind":false,"archiveRelayA":true,"archiveRelayB":true,"publicLiftRepaired":false,"gardenShadeRepaired":true,"gardenReceiverRepaired":true,"flowerPlaced":true,"siltReturned":false,"bridgeCrossed":false,"residentExceptions":true},"acquired":["counter","address"],"kept":["counter","address"],"history":[{"chapter":"prologue","outcome":"witness","consequences":["archiveWitnessed"]},{"chapter":"transit","outcome":"book","consequences":["dispatchDelivered","brimBookSaved"]},{"chapter":"garden","outcome":"court","consequences":["gardenOpen"]},{"chapter":"chorus","outcome":"uncertain","consequences":["routeRestored","report:uncertain"]},{"chapter":"release","outcome":"witness","consequences":["witnessLeft","networkClosed","residentExceptions"]}],"ending":"witness","position":{"x":0,"z":5.4,"yaw":0,"pitch":0},"preview":true,"origin":"release","events":[{"action":"inspect","value":0},{"action":"inspect","value":1},{"action":"inspect","value":2},{"action":"finish","value":"witness"}]}];
  for(const fixture of fixtures){
    assert.equal(Object.hasOwn(fixture.flags,'sources'),false);
    assert.deepEqual(S.validate(fixture),fixture);
    assert.equal(S.gardenSchedule(fixture).gardenAcceptedDuty,false);
  }
  const resumed=act(fixtures[0],'voice',0);
  assert.equal(S.canFinish(resumed),true);
  assert.deepEqual(S.validate(act(resumed,'finish','uncertain')).history.at(-1).outcome,'uncertain');
});
