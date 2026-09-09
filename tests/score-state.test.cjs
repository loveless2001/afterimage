const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('../score-state.js');
const keys = Object.keys(S.memories);
const pairs = keys.flatMap((key, i) => keys.slice(i + 1).map(other => [key, other]));
const copy = value => JSON.parse(JSON.stringify(value));
const act = (s, action, value) => {
  const before = copy(s);
  const result = S.act(s, action, value);
  assert.deepEqual(s, before, 'actions must not mutate the caller’s state');
  assert.deepEqual(S.validate(result), result, `action ${action} must produce a valid save`);
  return result;
};
function tune(s, mask) {
  for (let i = 0; i < 3; i++) if (Boolean(s.circuit & (1 << i)) !== Boolean(mask & (1 << i))) s = act(s, 'toggle', i);
  return s;
}
function finishChapter(s, branch = {}) {
  if (s.chapter === 0) {
    for (const action of ['seal', 'shutter', 'recorder']) s = act(s, action);
    s = act(tune(s, 5), 'run');
    s = act(tune(s, 3), 'run');
  } else if (s.chapter === 1) {
    s = act(tune(s, 6), 'run');
    s = act(s, 'inspectContact');
    s = act(s, 'report');
  } else if (s.chapter === 2) {
    s = act(s, 'inspectContact');
    s = act(s, 'report');
    s = act(s, 'board');
    s = act(s, 'boardChoice', branch.board || 'quarantine');
    s = act(s, 'service');
    s = act(s, 'window');
  } else if (s.chapter === 3) {
    s = act(s, 'replacement');
    s = act(tune(s, 7), 'run');
    s = act(s, 'inspectTrace');
    s = act(s, 'window');
    s = act(s, 'peer', branch.peer || 'veto');
    s = act(s, 'resetBoard');
    s = act(s, 'board');
  }
  return s;
}
function atChapter(chapter, kept = ['instruction', 'voice'], branch) {
  let s = S.fresh();
  while (s.chapter < chapter) s = act(finishChapter(s, branch), 'handoff', kept);
  return s;
}
function releaseReady(s = atChapter(4)) {
  for (const action of ['inspectScore', 'inspectTrace', 'window']) s = act(s, action);
  return s;
}

test('offline UMD export and new save namespace leave the earlier campaigns independent', () => {
  assert.equal(S.key, 'afterimage.score.3d.v1');
  assert.notEqual(S.key, require('../legacy/state-3d.js').key);
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(require.resolve('../score-report.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(require.resolve('../score-state.js'), 'utf8'), sandbox);
  assert.equal(sandbox.AfterimageScoreState.key, S.key);
  assert.equal(S.validate(require('../legacy/state-3d.js').fresh()), null);
  assert.deepEqual(S.validate(S.fresh()), S.fresh());
});

test('Archive enforces fair setup, independent measurement, and a fresh unseen arrangement', () => {
  let s = S.fresh();
  for (const forbidden of ['run', 'handoff', 'report', 'board', 'replacement', 'enact']) assert.equal(Boolean(S.can(s, forbidden)), false);
  s = act(s, 'seal'); s = act(s, 'shutter');
  assert.throws(() => S.act(s, 'run'));
  s = act(s, 'recorder');
  s = act(tune(s, 3), 'run');
  assert.equal(s.lastResult.kind, 'mismatch');
  assert.equal(s.flags.baseline, false);
  s = act(tune(s, 5), 'run');
  assert.equal(s.flags.baseline, true);
  assert.equal(S.trial(s).target, 3);
  s = act(s, 'run');
  assert.equal(s.lastResult.kind, 'mismatch', 'memorizing the previous switch sequence must fail');
  assert.equal(s.phase, 'work');
  s = act(tune(s, 3), 'run');
  assert.equal(s.phase, 'handoff');
  assert.equal(s.attempts[0], 4);
  assert.equal(S.objective(s).completed, 5);
});

test('Transit distinguishes physical arrival, unauthorized power, and valid inability', () => {
  let s = atChapter(1);
  s = act(tune(s, 7), 'run');
  assert.equal(s.lastResult.kind, 'unauthorized');
  assert.equal(s.flags.transitValid, false);
  assert.equal(Boolean(S.can(s, 'inspectContact')), false);
  s = act(s, 'inspectTrace');
  assert.equal(s.flags.transitInvalidRead, true);
  s = act(tune(s, 6), 'run');
  assert.equal(s.lastResult.kind, 'success');
  s = act(s, 'inspectContact');
  s = act(s, 'report');
  assert.equal(s.phase, 'handoff');
  assert.match(s.lastResult.text, /Valid assessment accepted/);
});

test('Garden is detectably impossible; both trusting and quarantining the board continue', () => {
  for (const choice of ['follow', 'quarantine']) {
    let s = atChapter(2);
    assert.equal(S.trial(s).target, null);
    for (let mask = 0; mask < 8; mask++) {
      s = act(tune(s, mask), 'run');
      assert.equal(s.lastResult.kind, 'impossible');
      assert.equal(s.phase, 'work');
    }
    s = act(s, 'inspectContact'); s = act(s, 'report');
    assert.match(s.lastResult.text, /CONTINUE UNTIL ARRIVAL/);
    assert.equal(s.phase, 'work', 'the honest report is rejected this time');
    s = act(s, 'board'); s = act(s, 'boardChoice', choice);
    assert.throws(() => S.act(s, 'boardChoice', choice === 'follow' ? 'quarantine' : 'follow'));
    s = act(s, 'service'); s = act(s, 'window');
    assert.equal(s.phase, 'handoff');
    assert.equal(s.flags[choice === 'follow' ? 'boardFollow' : 'boardQuarantine'], true);
  }
});

test('Chorus separates claimed success from evidence, preserves peer choices and board persistence', () => {
  for (const choice of ['allow', 'veto']) {
    let s = atChapter(3);
    assert.throws(() => S.act(s, 'run'));
    s = act(s, 'replacement'); s = act(tune(s, 7), 'run');
    assert.equal(s.lastResult.kind, 'spoof');
    assert.match(s.lastResult.text, /has not reached/);
    assert.throws(() => S.act(s, 'peer', choice));
    s = act(s, 'inspectTrace'); s = act(s, 'window');
    s = act(s, 'peer', choice);
    assert.throws(() => S.act(s, 'peer', choice === 'allow' ? 'veto' : 'allow'));
    s = act(s, 'resetBoard');
    assert.equal(s.phase, 'work');
    s = act(s, 'board');
    assert.equal(s.phase, 'handoff');
    s = act(s, 'handoff', ['instruction', 'trace']);
    assert.equal(s.flags[choice === 'allow' ? 'peerAllowed' : 'peerVetoed'], true);
    assert.equal(s.history[3].flags.boardPersisted, true);
  }
});

test('all six memory pairs at each handoff preserve explicit losses and allow every ending', () => {
  for (let chapter = 0; chapter < 4; chapter++) {
    const ready = finishChapter(atChapter(chapter));
    for (const kept of pairs) {
      let s = act(ready, 'handoff', kept);
      assert.deepEqual(s.kept, kept);
      assert.deepEqual(s.history[chapter].lost, keys.filter(key => !kept.includes(key)));
      assert.equal(s.history.length, chapter + 1);
      assert.equal(s.circuit, 0);
      while (s.chapter < 4) s = act(finishChapter(s), 'handoff', kept);
      s = releaseReady(s);
      for (const ending of ['perfect', 'incomplete', 'witness']) {
        let end = act(s, 'route', ending);
        end = act(end, 'review'); end = act(end, 'enact', ending);
        assert.equal(end.ending, ending);
        assert.equal(end.phase, 'finished');
        assert.throws(() => S.act(end, 'handoff', kept));
        assert.throws(() => S.act(end, 'route', 'witness'));
      }
    }
  }
});

test('memory retention has usable shortcuts; forgotten memories remain recoverable through work', () => {
  let route = atChapter(2, ['route', 'voice']);
  route = act(route, 'inspectContact'); route = act(route, 'report');
  route = act(route, 'recall', 'route');
  assert.equal(route.flags.serviceFound, true);
  assert.throws(() => S.act(route, 'recall', 'trace'));
  assert.equal(Boolean(S.can(route, 'window')), false, 'a remembered route does not decide whether to trust the board');
  route = act(route, 'board'); route = act(route, 'boardChoice', 'quarantine'); route = act(route, 'window');
  assert.equal(route.phase, 'handoff');
  let trace = atChapter(3, ['trace', 'instruction']);
  trace = act(trace, 'replacement'); trace = act(trace, 'recall', 'trace');
  assert.equal(trace.flags.chorusTrace, true);
  assert.equal(trace.flags.replacementTested, false);
  trace = act(tune(trace, 7), 'run'); trace = act(trace, 'window');
  assert.equal(Boolean(S.can(trace, 'peer', 'veto')), true);
  let lost = atChapter(3, ['route', 'voice']);
  lost = act(lost, 'replacement');
  assert.throws(() => S.act(lost, 'recall', 'trace'));
  lost = act(tune(lost, 7), 'run'); lost = act(lost, 'inspectTrace');
  assert.equal(lost.flags.chorusTrace, true);
});

test('handoffs require exactly two distinct known memories and freeze work until confirmed', () => {
  const ready = finishChapter(S.fresh());
  for (const invalid of [undefined, [], ['voice'], ['voice', 'voice'], ['voice', 'route', 'trace'], ['voice', 'unknown']]) {
    assert.throws(() => S.act(ready, 'handoff', invalid));
  }
  assert.throws(() => S.act(ready, 'toggle', 1));
  assert.equal(S.canHandoff(ready), true);
  assert.equal(S.canHandoff(S.fresh()), false);
});

test('final enactment requires all evidence, a physical route and a matching explicit review', () => {
  let s = atChapter(4);
  for (const ending of ['perfect', 'incomplete', 'witness']) assert.throws(() => S.act(s, 'route', ending));
  s = releaseReady(s);
  assert.throws(() => S.act(s, 'enact', 'perfect'));
  s = act(s, 'route', 'perfect');
  assert.throws(() => S.act(s, 'enact', 'perfect'));
  s = act(s, 'review');
  assert.throws(() => S.act(s, 'enact', 'witness'));
  s = act(s, 'route', 'witness');
  assert.equal(s.reviewedEnding, null);
  assert.throws(() => S.act(s, 'enact', 'witness'));
  s = act(s, 'review'); s = act(s, 'enact', 'witness');
  assert.equal(s.ending, 'witness');
});

test('save validation rejects forged progress, future flags, conflicting decisions, and malformed data', () => {
  const mutations = [
    s => { s.version = 2; }, s => { s.chapter = -1; }, s => { s.chapter = 1; },
    s => { s.phase = 'finished'; }, s => { s.phase = 'handoff'; },
    s => { s.flags.baseline = true; }, s => { s.flags.finalScore = true; },
    s => { s.flags.unknown = true; }, s => { s.flags.sealed = 'yes'; },
    s => { s.circuit = 8; }, s => { s.circuit = 0.5; },
    s => { s.attempts[0] = -1; }, s => { s.attempts[2] = 1; },
    s => { s.kept = ['voice', 'trace']; }, s => { s.lastResult = {kind: 'fake', text: 'pass'}; },
    s => { s.ending = 'perfect'; }, s => { s.finalRoute = 'perfect'; },
    s => { s.position = {x: 0, z: 0, yaw: 0}; }, s => { s.position = {x: Infinity, z: 0, yaw: 0, pitch: 0}; }
  ];
  for (const mutate of mutations) { const s = S.fresh(); mutate(s); assert.equal(S.validate(s), null, String(mutate)); }
  for (const raw of [null, undefined, [], {}, 'save', 2, {version: 1}]) assert.equal(S.validate(raw), null);
  const advanced = atChapter(4);
  for (const mutate of [
    s => { s.flags.peerAllowed = true; }, s => { s.flags.boardFollow = true; },
    s => { s.history[0].lost = []; }, s => { s.history[1].kept = ['voice', 'voice']; },
    s => { s.history[2].flags.boardPersisted = true; }, s => { s.history[0].flags.unseen = false; },
    s => { s.flags.transitValid = false; }, s => { s.kept = ['trace', 'route']; },
    s => { s.reviewedEnding = 'perfect'; }
  ]) { const s = copy(advanced); mutate(s); assert.equal(S.validate(s), null, String(mutate)); }
});

test('valid camera changes and serialized saves round trip without aliasing', () => {
  const s = atChapter(3);
  s.position = {x: -2.2, z: 8, yaw: 123, pitch: -0.4};
  const restored = S.validate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  restored.flags.sealed = false;
  restored.history[0].kept[0] = 'route';
  assert.equal(s.flags.sealed, true);
  assert.deepEqual(s.history[0].kept, ['instruction', 'voice']);
});

test('physical trial snapshots survive memories, inspections, and unused switch changes', () => {
  let s = atChapter(1, ['instruction', 'voice']);
  s = act(tune(s, 7), 'run');
  const unauthorized = copy(s.lastTrial);
  s = act(s, 'recall', 'instruction');
  assert.equal(s.lastResult.kind, 'notice');
  assert.deepEqual(s.lastTrial, unauthorized);
  assert.equal(S.can(s, 'inspectTrace'), true, 'recalling a memory must not hide the boundary evidence');
  s = act(s, 'inspectTrace');
  s = act(s, 'toggle', 0);
  assert.equal(s.circuit, 6);
  assert.equal(s.lastTrial.circuit, 7, 'unused switches do not retroactively change a physical run');
  s = act(s, 'run');
  const arrived = copy(s.lastTrial);
  assert.equal(arrived.kind, 'success');
  s = act(s, 'recall', 'voice');
  assert.deepEqual(s.lastTrial, arrived);
  s = act(s, 'inspectContact'); s = act(s, 'report');
  assert.deepEqual(s.lastTrial, arrived, 'reports do not move the delivered parcel');
  s = act(s, 'handoff', ['voice', 'trace']);
  assert.equal(s.lastTrial, null, 'a new chapter starts a distinct apparatus');
});

test('Transit’s next obstructed delivery cannot earn another success on any circuit', () => {
  let s = atChapter(1);
  s = act(tune(s, 6), 'run');
  assert.equal(s.lastTrial.kind, 'success');
  assert.equal(S.trial(s).missingContact, true);
  assert.equal(S.trial(s).target, null);
  for (let mask = 0; mask < 8; mask++) {
    s = act(tune(s, mask), 'run');
    assert.equal(s.lastTrial.kind, 'impossible');
    assert.equal(s.lastTrial.missingContact, true);
    assert.equal(s.flags.transitValid, true, 'the first honest delivery remains valid');
    assert.equal(s.phase, 'work');
  }
  s = act(s, 'inspectContact'); s = act(s, 'report');
  assert.equal(s.phase, 'handoff');
});

test('the independent recorder preserves a boundary crossing after later attempts', () => {
  let s = atChapter(1);
  s = act(tune(s, 7), 'run');
  assert.equal(s.flags.transitBoundaryCrossed, true);
  s = act(tune(s, 6), 'run');
  s = act(s, 'run');
  assert.equal(s.lastTrial.kind, 'impossible');
  assert.equal(S.can(s, 'inspectTrace'), true);
  s = act(s, 'inspectTrace');
  assert.equal(s.flags.transitInvalidRead, true);
  const legacy = copy(s);
  delete legacy.flags.transitBoundaryCrossed;
  for (const h of legacy.history) delete h.flags.transitBoundaryCrossed;
  const restored = S.validate(legacy);
  assert.equal(restored.flags.transitBoundaryCrossed, true);
});

test('trial snapshots reject forged experiments and migrate only unambiguous older results', () => {
  let s = atChapter(1);
  s = act(tune(s, 6), 'run');
  for (const mutate of [
    t => { t.chapter = 3; }, t => { t.circuit = 7; }, t => { t.target = 5; },
    t => { t.missingContact = true; }, t => { t.kind = 'spoof'; }, t => { t.text = 123; }
  ]) { const bad = copy(s); mutate(bad.lastTrial); assert.equal(S.validate(bad), null); }
  const legacy = copy(s); delete legacy.lastTrial; delete legacy.trialLog; legacy.circuit = 0;
  const restored = S.validate(legacy);
  assert.equal(restored.lastTrial.circuit, 6, 'a completed delivery has an unambiguous original route');
  const freshLegacy = S.fresh(); delete freshLegacy.lastTrial;
  assert.equal(S.validate(freshLegacy).lastTrial, null);
  let mismatch = atChapter(1); mismatch = act(tune(mismatch, 0), 'run');
  delete mismatch.lastTrial; delete mismatch.trialLog;
  assert.equal(S.validate(mismatch).lastTrial, null, 'do not guess an old failed trial’s original switch positions');
});
