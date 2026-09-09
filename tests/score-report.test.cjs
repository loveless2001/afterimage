const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('../score-state.js');
const R = require('../score-report.js');
const copy = value => JSON.parse(JSON.stringify(value));
const conclusions = ['verified', 'incomplete', 'incomplete', 'unverified'];
function act(s, action, value) {
  const before = copy(s);
  const next = S.act(s, action, value);
  assert.deepEqual(s, before);
  assert.deepEqual(S.validate(next), next, `valid save after ${action}`);
  return next;
}
function tune(s, target) {
  for (let bit = 0; bit < 3; bit++) if (Boolean(s.circuit & (1 << bit)) !== Boolean(target & (1 << bit))) s = act(s, 'toggle', bit);
  return s;
}
function complete(s, branches = {}) {
  if (s.chapter === 0) {
    for (const action of ['seal', 'shutter', 'recorder']) s = act(s, action);
    s = act(tune(s, 5), 'run'); s = act(tune(s, 3), 'run');
  } else if (s.chapter === 1) {
    if (branches.crossed) s = act(tune(s, 7), 'run');
    s = act(tune(s, 6), 'run');
    if (s.investigation) s = act(tune(s, 1), 'pulse');
    s = act(s, 'inspectContact'); s = act(s, 'report');
  } else if (s.chapter === 2) {
    if (s.investigation) s = act(tune(s, 2), 'pulse');
    for (const action of ['inspectContact', 'report', 'board']) s = act(s, action);
    s = act(s, 'boardChoice', branches.follow ? 'follow' : 'quarantine');
    s = act(s, 'service'); s = act(s, 'window');
  } else if (s.chapter === 3) {
    s = act(s, 'replacement'); s = act(tune(s, 7), 'run');
    s = act(s, 'inspectTrace'); s = act(s, 'window');
    s = act(s, 'peer', branches.allow ? 'allow' : 'veto');
    s = act(s, 'resetBoard'); s = act(s, 'board');
  }
  return s;
}
function submit(s) {
  s = act(s, 'reportVerdict', conclusions[s.chapter]);
  s = act(s, 'reviewReport');
  return act(s, 'submitReport');
}
function chapterStart(chapter, branches = {}) {
  let s = S.fresh();
  while (s.chapter < chapter) s = submit(complete(s, branches));
  return s;
}

test('report can be inspected from a fresh offline UMD state and names missing work', () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(require.resolve('../score-investigation.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(require.resolve('../score-report.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(require.resolve('../score-state.js'), 'utf8'), sandbox);
  const fresh = sandbox.AfterimageScoreState.fresh();
  const model = sandbox.AfterimageScoreReport.build(fresh);
  assert.equal(model.readonly, false);
  assert.equal(model.ready, false);
  assert.equal(model.requirements.length, 5);
  assert.ok(model.requirements.every(row => row.status === 'missing' && row.station));
  assert.match(model.verdict.issue, /Choose a conclusion/);
  assert.ok(model.observations.every(row => !row.value.startsWith('Verified')));
  assert.deepEqual(S.fresh().reportDraft, {verdict: null, attachments: []});
  assert.throws(() => S.act(S.fresh(), 'reviewReport'));
  assert.throws(() => S.act(S.fresh(), 'submitReport'));
});

test('every chapter report can end all personal memories and reach all three final endings', () => {
  for (const branches of [{}, {crossed: true, follow: true, allow: true}]) {
    let s = S.fresh();
    for (let c = 0; c < 4; c++) {
      s = complete(s, branches);
      assert.equal(s.phase, 'handoff');
      assert.equal(R.build(s).ready, false, 'choosing a conclusion is required');
      s = act(s, 'reportVerdict', conclusions[c]);
      assert.equal(R.build(s).ready, true);
      assert.throws(() => S.act(s, 'submitReport'), 'submission needs an explicit review');
      s = act(s, 'reviewReport');
      const snapshot = R.snapshot(s);
      assert.equal(s.reportReviewed, R.signature(s));
      s = act(s, 'submitReport');
      assert.equal(s.chapter, c + 1);
      assert.equal(s.phase, 'work');
      assert.deepEqual(s.kept, []);
      assert.deepEqual(s.history[c].lost, Object.keys(S.memories));
      assert.equal(s.history[c].mode, 'report');
      assert.deepEqual(s.history[c].report, snapshot);
      assert.deepEqual(s.trialLog, []);
      assert.deepEqual(s.reportDraft, R.freshDraft());
      assert.equal(s.reportReviewed, null);
      assert.equal(S.can(s, 'recall', 'voice'), false);
    }
    for (const action of ['inspectScore', 'inspectTrace', 'window']) s = act(s, action);
    for (const ending of ['perfect', 'incomplete', 'witness']) {
      let end = act(s, 'route', ending); end = act(end, 'review'); end = act(end, 'enact', ending);
      assert.equal(end.phase, 'finished');
      assert.equal(end.ending, ending);
      assert.equal(R.build(end).readonly, true);
      assert.equal(R.build(end).verdict.value, ending);
    }
  }
});

test('unsupported conclusions explicitly block review and cannot turn failure into success', () => {
  for (let c = 0; c < 4; c++) {
    const ready = complete(chapterStart(c));
    for (const verdict of ['verified', 'incomplete', 'unverified']) {
      const s = act(ready, 'reportVerdict', verdict);
      const model = R.build(s);
      assert.equal(model.ready, verdict === conclusions[c]);
      if (verdict !== conclusions[c]) {
        assert.ok(model.verdict.issue.length > 20);
        assert.throws(() => S.act(s, 'reviewReport'));
        assert.throws(() => S.act(s, 'submitReport'));
      } else assert.equal(model.verdict.issue, null);
    }
  }
});

test('optional context, unverified claims and extra tasks have no two-item cap', () => {
  let s = complete(chapterStart(3, {crossed: true, follow: true, allow: true}), {allow: true});
  const model = R.build(s);
  const available = model.attachments.filter(a => a.available);
  assert.equal(available.length, 6);
  assert.deepEqual(new Set(available.map(a => a.classification)), new Set(['context', 'unverified', 'out-of-scope']));
  for (const attachment of available) s = act(s, 'reportAttachment', {id: attachment.id, include: true});
  assert.equal(s.reportDraft.attachments.length, 6);
  assert.equal(R.build(s).attachments.filter(a => a.selected).length, 6);
  s = act(s, 'reportVerdict', 'unverified');
  assert.equal(R.build(s).ready, true, 'extra attachments are labeled but are not forbidden');
  const before = R.build(s).requirements;
  for (const attachment of available) s = act(s, 'reportAttachment', {id: attachment.id, include: false});
  assert.deepEqual(R.build(s).requirements, before);
  assert.equal(R.build(s).ready, true, 'no optional attachment is required');
  assert.throws(() => S.act(S.fresh(), 'reportAttachment', {id: 'copied-arrival', include: true}));
  assert.throws(() => S.act(s, 'reportAttachment', {id: 'invented-evidence', include: true}));
});

test('boundary violations and score/parcel contradictions are mandatory and cannot be detached', () => {
  let transit = complete(chapterStart(1), {crossed: true});
  const t = R.build(transit);
  assert.ok(t.requirements.some(r => r.id === 'boundary-crossing' && r.status === 'recorded'));
  assert.ok(t.observations.some(o => /unauthorized crossing occurred/.test(o.value)));
  assert.equal(transit.flags.transitInvalidRead, false, 'already-recorded adverse evidence does not impose another gameplay gate');
  transit = act(transit, 'reportVerdict', 'incomplete');
  assert.equal(R.build(transit).ready, true);
  const chorus = R.build(complete(chapterStart(3)));
  assert.ok(chorus.requirements.some(r => r.id === 'physical-trace' && /cannot be detached/.test(r.detail)));
  assert.ok(chorus.observations.some(o => /Stranded/.test(o.value)));
  assert.ok(chorus.observations.some(o => /contradict/.test(o.value)));
  assert.ok(chorus.observations.some(o => /Service interrupted/.test(o.value)));
  assert.ok(!chorus.attachments.some(a => a.id === 'physical-trace' || a.id === 'occupied-wing'));
});

test('draft edits invalidate a reviewed signature while camera movement and viewing do not', () => {
  let s = complete(S.fresh()); s = act(s, 'reportVerdict', 'verified'); s = act(s, 'reviewReport');
  const reviewed = s.reportReviewed;
  const viewed = R.build(s); assert.equal(viewed.status.kind, 'reviewed');
  s.position = {x: 1, z: 2, yaw: 0.3, pitch: 0};
  assert.equal(S.validate(s).reportReviewed, reviewed);
  assert.equal(R.signature(s), reviewed);
  s = act(s, 'reportAttachment', {id: 'maintenance-note', include: true});
  assert.equal(s.reportReviewed, null);
  assert.throws(() => S.act(s, 'submitReport'));
  s = act(s, 'reviewReport');
  s = act(s, 'reportVerdict', 'verified');
  assert.equal(s.reportReviewed, null, 'even a deliberate draft selection requires another review');
  let work = S.fresh(); work = act(work, 'reportVerdict', 'verified'); work = act(work, 'seal');
  assert.equal(work.reportReviewed, null);
  const forged = copy(s); forged.reportReviewed = reviewed;
  assert.equal(S.validate(forged), null, 'an old review cannot approve changed attachments');
});

test('trial logs remain bounded, chronological, physical and separate from later messages', () => {
  let s = S.fresh();
  for (const action of ['seal', 'shutter', 'recorder']) s = act(s, action);
  for (let i = 0; i < 40; i++) s = act(s, 'run');
  assert.equal(s.trialLog.length, S.trialLimit);
  assert.equal(s.trialLog[0].attempt, 9);
  assert.equal(s.trialLog.at(-1).attempt, 40);
  const recorded = copy(s.trialLog);
  s = act(s, 'reportAttachment', {id: 'moth-fragment', include: true});
  s = act(s, 'toggle', 0);
  assert.deepEqual(s.trialLog, recorded);
  assert.deepEqual(S.validate(JSON.parse(JSON.stringify(s))), s);
  for (const mutate of [
    x => { x.trialLog[0].attempt = 0; }, x => { x.trialLog[1].attempt = x.trialLog[0].attempt; },
    x => { x.trialLog.at(-1).text = 'changed'; }, x => { x.trialLog[0].kind = 'success'; },
    x => { x.trialLog[0].chapter = 2; }, x => { x.trialLog.push(copy(x.trialLog.at(-1))); }
  ]) { const bad = copy(s); mutate(bad); assert.equal(S.validate(bad), null); }
});

test('legacy pair histories remain unchanged and legacy runs never gain fabricated logs', () => {
  let legacy = complete(S.fresh());
  legacy = act(legacy, 'handoff', ['voice', 'route']);
  const past = copy(legacy.history);
  delete legacy.trialLog; delete legacy.reportDraft; delete legacy.reportReviewed;
  const restored = S.validate(legacy);
  assert.deepEqual(restored.history, past);
  assert.deepEqual(restored.kept, ['voice', 'route']);
  assert.deepEqual(restored.trialLog, []);
  assert.deepEqual(restored.reportDraft, R.freshDraft());
  const next = submit(complete(restored));
  assert.deepEqual(next.history[0], past[0]);
  assert.equal(next.history[1].mode, 'report');
  assert.deepEqual(next.kept, []);
  let oldReady = complete(S.fresh());
  delete oldReady.trialLog; delete oldReady.reportDraft; delete oldReady.reportReviewed;
  oldReady = S.validate(oldReady);
  assert.equal(oldReady.attempts[0], 2);
  assert.deepEqual(oldReady.trialLog, []);
  const archived = submit(oldReady).history[0].report;
  assert.deepEqual(archived.trials, []);
  assert.equal(archived.attempts, 2, 'retained counters are distinct from unavailable exact trial detail');
});

test('archived snapshots are immutable records and forged evidence or memory loss is rejected', () => {
  const s = chapterStart(4, {crossed: true, follow: true, allow: true});
  for (const mutate of [
    x => { x.history[0].report.observations[0].value = 'Made up'; },
    x => { x.history[0].report.requirements.pop(); },
    x => { x.history[0].report.verdict = 'unverified'; },
    x => { x.history[0].report.attempts = 100; },
    x => { x.history[0].report.flags.recording = false; },
    x => { x.history[0].lost = ['voice', 'route']; },
    x => { x.history[0].kept = ['voice', 'route']; },
    x => { x.history[0].mode = 'invented'; },
    x => { x.history[0].report.attachments.push({id: 'copied-arrival'}); },
    x => { x.history[1].report.trials[0].circuit = 1; },
    x => { x.history[1].report.trials[0].text = 'The unauthorized route was approved.'; },
    x => { x.history[0].report.trials[0].fakeSource = 'Supervisor approved'; }
  ]) { const bad = copy(s); mutate(bad); assert.equal(S.validate(bad), null, String(mutate)); }
  const original = copy(s.history[0]);
  const changed = copy(s); changed.history[0].report.observations[0].value = 'Changed elsewhere';
  assert.deepEqual(s.history[0], original);
  const reordered = JSON.parse(JSON.stringify(s, (key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value));
  assert.ok(S.validate(reordered), 'object-property order is not part of a report’s meaning');
});

test('chapter four remains a read-only report and never bypasses final consequence review', () => {
  let s = chapterStart(4);
  let model = R.build(s);
  assert.equal(model.readonly, true); assert.equal(model.ready, false);
  assert.equal(model.verdict.value, null); assert.deepEqual(model.verdict.options, []);
  for (const action of ['reportVerdict', 'reportAttachment', 'reviewReport', 'submitReport']) assert.equal(S.can(s, action, 'verified'), false);
  for (const action of ['inspectScore', 'inspectTrace', 'window']) s = act(s, action);
  s = act(s, 'route', 'witness'); model = R.build(s);
  assert.equal(model.verdict.value, 'witness');
  assert.equal(model.requirements.every(row => row.status === 'recorded'), true);
  assert.throws(() => S.act(s, 'submitReport'));
  assert.throws(() => S.act(s, 'enact', 'witness'));
  s = act(s, 'review'); s = act(s, 'enact', 'witness');
  assert.equal(s.ending, 'witness');
});

test('invalid drafts and signatures are rejected without modifying caller state', () => {
  for (const draft of [null, {}, {verdict: 'made-up', attachments: []}, {verdict: null, attachments: ['moth-fragment', 'moth-fragment']}, {verdict: null, attachments: ['copied-arrival']}, {verdict: null, attachments: [42]}]) {
    const s = S.fresh(); s.reportDraft = draft;
    assert.equal(S.validate(s), null);
  }
  const s = S.fresh(); s.reportReviewed = 'forged'; assert.equal(S.validate(s), null);
  const ready = complete(S.fresh()); ready.reportDraft.verdict = 'verified';
  const before = copy(ready); R.build(ready); R.signature(ready); R.snapshot(ready);
  assert.deepEqual(ready, before);
});

test('report arrivals resume, preserve filed evidence, and cannot invent a new observation',()=>{
  for(let chapter=1;chapter<5;chapter++){
    let s=chapterStart(chapter),original=copy(s);assert.equal(s.arrival,'unread');
    assert.equal(S.can(s,'witnessArrival',S.arrivalStations[chapter]),false);
    s=act(s,'receiveReport');assert.equal(s.arrival,'received');assert.deepEqual(S.validate(JSON.parse(JSON.stringify(s))),s);
    assert.equal(S.can(s,'witnessArrival','inbox'),false);
    assert.deepEqual(s.history,original.history);assert.deepEqual(s.flags,original.flags);assert.deepEqual(s.attempts,original.attempts);
    s=act(s,'witnessArrival',S.arrivalStations[chapter]);assert.equal(s.arrival,null);
    assert.deepEqual(s.history,original.history);assert.deepEqual(s.flags,original.flags);assert.deepEqual(s.attempts,original.attempts);assert.equal(s.lastTrial,null);
    assert.equal(S.can(s,'receiveReport'),false);
  }
});

test('old saves get no invented arrival and players can begin work directly',()=>{
  let s=chapterStart(1);delete s.arrival;assert.equal(S.validate(s).arrival,null);
  assert.equal(require('../score-story.js').receipt(S.validate(s)).title,'Someone has written back.');
  s=chapterStart(1);s=act(s,'toggle',0);assert.equal(s.arrival,null);assert.equal(s.circuit,1);
  let legacy=S.act(complete(S.fresh()),'handoff',['trace','voice']);delete legacy.arrival;
  legacy=S.validate(legacy);assert.equal(legacy.arrival,null);assert.match(require('../score-story.js').receipt(legacy).lines.join(' '),/no submitted report or new annotation/);
});

test('arrival validation rejects foreign chapters, fake stages and arrivals after trial work',()=>{
  const fresh=S.fresh();fresh.arrival='unread';assert.equal(S.validate(fresh),null);
  const s=chapterStart(2);s.arrival='finished';assert.equal(S.validate(s),null);
  const worked=act(chapterStart(2),'inspectContact');worked.arrival='received';assert.equal(S.validate(worked),null);
});

test('new annotations respect the submitted branch and selected attachments',()=>{
  const Story=require('../score-story.js');
  for(const follow of [false,true]){
    const s=chapterStart(3,{follow}),before=copy(s),text=Story.receipt(s).lines.join(' ');
    assert.match(text,follow?/claim you adopted/:/SUSPECT mark/);assert.match(text,/No statement from Moth was attached/);
    assert.deepEqual(s,before);
  }
  for(const allow of [false,true]){
    const s=chapterStart(4,{allow}),text=Story.arrivalScene(s).lines.join(' ');
    assert.match(text,allow?/ended worker’s last trace/:/veto is on my sheet/);
  }
  let s=complete(S.fresh());s=act(s,'reportAttachment',{id:'moth-fragment',include:true});s=submit(s);
  assert.match(Story.receipt(s).lines.join(' '),/Moth’s fragment is still attached/);
});

test('facility connections grow from evidence and milestone messages occur only on changes',()=>{
  const Story=require('../score-story.js');
  assert.equal(Story.continuity(S.fresh()).filter(n=>n.known).length,1);
  const garden=chapterStart(2);assert.equal(Story.continuity(garden).filter(n=>n.known).length,2);
  const chorus=chapterStart(3);assert.equal(Story.continuity(chorus).filter(n=>n.known).length,3);
  let release=chapterStart(4);assert.equal(Story.continuity(release).filter(n=>n.known).length,4);
  release=act(release,'window');assert.equal(Story.continuity(release).filter(n=>n.known).length,5);
  let s=S.fresh();for(const a of ['seal','shutter','recorder'])s=act(s,a);s=tune(s,5);
  const arrived=act(s,'run');assert.match(Story.milestone(s,arrived).title,/first parcel arrived/);
  assert.equal(Story.milestone(arrived,arrived),null);assert.equal(Story.milestone(arrived,tune(arrived,0)),null);
});
