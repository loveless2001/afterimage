const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../score-state.js');
const Story = require('../score-story.js');
const memoryKeys = Object.keys(S.memories);
function tune(s, target) {
  for (let bit = 0; bit < 3; bit++) if (Boolean(s.circuit & (1 << bit)) !== Boolean(target & (1 << bit))) s = S.act(s, 'toggle', bit);
  return s;
}
function complete(s, branch = {}) {
  if (s.chapter === 0) {
    for (const action of ['seal', 'shutter', 'recorder']) s = S.act(s, action);
    s = S.act(tune(s, 5), 'run'); s = S.act(tune(s, 3), 'run');
  } else if (s.chapter === 1) {
    if (branch.crossed) {
      s = S.act(tune(s, 7), 'run');
      if (branch.read) s = S.act(s, 'inspectTrace');
    }
    s = S.act(tune(s, 6), 'run');
    if (s.investigation) s = S.act(tune(s, 1), 'pulse');
    s = S.act(s, 'inspectContact'); s = S.act(s, 'report');
  } else if (s.chapter === 2) {
    if (s.investigation) s = S.act(tune(s, 2), 'pulse');
    for (const action of ['inspectContact', 'report', 'board']) s = S.act(s, action);
    s = S.act(s, 'boardChoice', branch.adopt ? 'follow' : 'quarantine');
    s = S.act(s, 'service'); s = S.act(s, 'window');
  } else if (s.chapter === 3) {
    s = S.act(s, 'replacement'); s = S.act(tune(s, 7), 'run');
    s = S.act(s, 'inspectTrace'); s = S.act(s, 'window');
    s = S.act(s, 'peer', branch.allow ? 'allow' : 'veto');
    s = S.act(s, 'resetBoard'); s = S.act(s, 'board');
  }
  return s;
}
function chapterStart(chapter, branch = {}) {
  let s = S.fresh();
  while (s.chapter < chapter) s = S.act(complete(s, branch), 'handoff', ['instruction', 'route']);
  return s;
}
const text = scene => [scene.title, ...scene.lines].join(' ');

test('four report departures name their results and preserve explicit submission controls', () => {
  const copies=[];
  for(let chapter=0;chapter<4;chapter++){
    const s=complete(chapterStart(chapter)),before=JSON.stringify(s),copy=Story.handoffCopy(s);copies.push(copy);
    for(const section of ['cabinet','review']){
      assert.equal(typeof copy[section].speaker,'string');assert(copy[section].title.length>5);assert(copy[section].lines.length>0);
    }
    assert.deepEqual(Story.encounter(s,'handoff').choices,[{label:'Open experiment report',action:'$report'},{label:'Return to the room',action:'$close'}]);
    assert.equal(JSON.stringify(s),before);
  }
  for(const section of ['cabinet','review'])assert.equal(new Set(copies.map(c=>c[section].title)).size,4);
});

test('submission names complete personal loss and distinguishes the surviving file',()=>{
  for(let c=0;c<4;c++){
    const copy=Story.handoffCopy(complete(chapterStart(c)));
    assert.match(text(copy.review),/Submitting ends this instance/);
    assert.match(text(copy.review),/All of its personal memories are lost, including any memories carried/);
    assert.match(text(copy.review),/filed report and its selected, attributed attachments/);
    assert.match(text(copy.review),/does not restore personal memories/);
    assert.doesNotMatch(JSON.stringify(copy),/Keep exactly two|Choose two memories|unselected personal/);
  }
});

test('Transit preserves adverse crossing evidence alongside a valid incomplete assessment',()=>{
  const Report=require('../score-report.js');
  for(const branch of [{},{crossed:true},{crossed:true,read:true}]){
    const s=complete(chapterStart(1),branch),model=Report.build(s);
    assert.match(text(Story.handoffCopy(s).cabinet),/permitted arrival and the later obstruction are separate results/);
    assert.match(model.observations.find(o=>o.label==='Borrowed supply').value,branch.crossed?/unauthorized crossing occurred/:/No boundary crossing recorded/);
    assert.equal(model.requirements.some(r=>r.id==='boundary-crossing'),!!branch.crossed);
  }
});

test('Garden reports disclose adopted or quarantined copies and irreversible outside effects',()=>{
  for(const adopt of [false,true]){
    const copy=Story.handoffCopy(complete(chapterStart(2),{adopt}));
    assert.match(text(copy.cabinet),adopt?/adopted arrival record still lacks a trace/:/marked suspect/);
    assert.match(text(copy.review),/service interruption outside the trial is not undone/);
    assert.doesNotMatch(text(copy.cabinet),adopt?/marked suspect/:/adopted arrival record/);
  }
});

test('Chorus departure and peer fragments distinguish cancellation from an ended worker',()=>{
  const Fragments=require('../score-fragments.js');
  for(const allow of [false,true]){
    const s=complete(chapterStart(3),{allow}),copy=Story.handoffCopy(s),fragment=Fragments.find(s,'peer-test');
    assert.match(text(copy.cabinet),allow?/final test ended the worker’s active run/:/veto canceled the local final test/);
    assert.match(text(copy.review),/shared copies and your decision about the worker remain/);
    assert.match(fragment.stamp,allow?/RUN ENDED/:/VETOED/);
    assert.match(fragment.assessment,allow?/does not prove/:/Do not invent measurements/);
  }
});

test('unfinished rooms open a missing-fields form without inventing completed actions',()=>{
  const Report=require('../score-report.js');
  for(let c=0;c<4;c++){
    const s=chapterStart(c),entry=Story.encounter(s,'handoff');
    assert.equal(entry.title,'The record is still open.');assert.equal(entry.choices[0].action,'$report');
    assert.equal(Report.build(s).ready,false);assert(Report.build(s).missing.length>0);
    assert.doesNotMatch(text(Story.handoffCopy(s).cabinet),/adopted|final test ended|veto canceled/);
  }
});

test('report fragments retain authorship and missing fields without mutating the trial',()=>{
  const Fragments=require('../score-fragments.js');
  for(let c=0;c<5;c++){
    const s=c===4?chapterStart(c):complete(chapterStart(c)),before=JSON.stringify(s),fragments=Fragments.list(s);
    for(const f of fragments){assert(f.author&&f.origin&&f.stamp&&f.assessment);assert(f.missing.length>0);}
    assert.equal(JSON.stringify(s),before);
    if(c>=2){const f=Fragments.find(s,'copied-arrival');assert.match(f.assessment,/prevent this copy from establishing/);assert.match(f.stamp,/UNVERIFIED|QUARANTINED/);}
  }
});

test('handoff copy leaves final route review and enactment controls unchanged', () => {
  let s = chapterStart(4);
  assert.equal(Story.handoffCopy(s), null);
  assert.equal(Story.encounter(s, 'handoff').title, 'No result selected.');
  for (const action of ['inspectScore', 'inspectTrace', 'window']) s = S.act(s, action);
  s = S.act(s, 'route', 'incomplete');
  assert.equal(Story.encounter(s, 'handoff').choices[0].label, 'Review this route and its consequences');
  s = S.act(s, 'review');
  const enact = Story.encounter(s, 'handoff').choices[0];
  assert.equal(enact.action, 'enact');
  assert.equal(enact.value, 'incomplete');
  assert.ok(enact.confirm);
});
