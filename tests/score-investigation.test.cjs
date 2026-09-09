const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../score-state.js');
const R = require('../score-report.js');
const Story = require('../score-story.js');
const W = require('../score-world.js');
const fixtures = require('./fixtures/score-before-investigation.json');
const copy = value => structuredClone(value);
function act(s, action, value) {
  const before = copy(s), next = S.act(s, action, value);
  assert.deepEqual(s, before, 'actions do not mutate the input');
  assert.deepEqual(S.validate(next), next, 'save after ' + action);
  return next;
}
function tune(s, mask) {
  for (let n = 0; n < 3; n++) if (Boolean(s.circuit & (1 << n)) !== Boolean(mask & (1 << n))) s = act(s, 'toggle', n);
  return s;
}
function submit(s, verdict) {
  s = act(s, 'reportVerdict', verdict); s = act(s, 'reviewReport');
  return act(s, 'submitReport');
}
function start(chapter) {
  let s = S.fresh();
  for (const a of ['seal', 'shutter', 'recorder']) s = act(s, a);
  s = act(tune(s, 5), 'run'); s = act(tune(s, 3), 'run'); s = submit(s, 'verified');
  if (chapter === 2) {
    s = act(tune(s, 6), 'run'); s = act(tune(s, 1), 'pulse');
    s = act(s, 'inspectContact'); s = act(s, 'report'); s = submit(s, 'incomplete');
  }
  return s;
}

test('two independent checks work in either order and cannot certify an arrival', () => {
  for (const chapter of [1, 2]) for (const benchFirst of [false, true]) {
    let s = start(chapter);
    if (chapter === 1) {
      assert.equal(S.can(s, 'pulse'), false);
      s = act(tune(s, 6), 'run');
    }
    const before = copy(s);
    assert.equal(S.can(s, 'report'), false);
    if (benchFirst) s = act(s, 'inspectContact');
    // An incorrect A prevents any observation of B or C.
    s = act(tune(s, chapter === 1 ? 0 : 1), 'pulse');
    assert.match(s.lastResult.text, /stops at A/);
    assert.equal(S.can(s, 'report'), false);
    // A is fixed, but B still blocks the approach.
    s = act(tune(s, chapter === 1 ? 3 : 0), 'pulse');
    assert.match(s.lastResult.text, /stops at B/);
    s = act(tune(s, chapter === 1 ? 1 : 2), 'pulse');
    assert.equal(S.can(s, 'report'), benchFirst);
    assert.deepEqual(s.lastTrial, before.lastTrial);
    assert.deepEqual(s.trialLog, before.trialLog);
    assert.deepEqual(s.attempts, before.attempts);
    assert.equal(s.flags.transitBoundaryCrossed, false);
    if (!benchFirst) s = act(s, 'inspectContact');
    const report = R.build(s);
    assert(report.observations.some(o => o.value.includes('stops at A')));
    assert(report.observations.some(o => o.value.includes('stops at B')));
    assert(report.observations.some(o => o.value.includes('reaches the input of C')));
    assert(report.observations.some(o => o.value.includes(chapter === 1 ? 'bent retaining plate' : 'no blade')));
    s = act(s, 'report');
    assert.equal(s.phase, chapter === 1 ? 'handoff' : 'work');
    assert.match(s.lastResult.text, chapter === 1 ? /Valid assessment accepted/ : /CONTINUE UNTIL ARRIVAL/);
  }
});

test('pulse readings survive switch changes and reload without moving a parcel or powering the outside', () => {
  let s = act(tune(start(1), 6), 'run');
  const parcel = W.world(s).signals.parcel;
  s = act(tune(s, 1), 'pulse');
  assert.equal(W.world(s).decor.filter(p => p.id.startsWith('continuity-lamp-') && p.emissive).length, 3);
  const record = copy(s.investigation);
  s = act(tune(s, 7), 'toggle', 0);
  assert.deepEqual(s.investigation, record);
  assert.deepEqual(W.world(s).signals.parcel, parcel);
  assert.equal(s.flags.transitBoundaryCrossed, false);
  s = S.validate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(s.investigation, record);
  assert.equal(S.can(s, 'report'), false);
  s = act(s, 'inspectContact');
  assert(!W.world(s).decor.some(p => p.id === 'contact-inspection-cover'));
  assert.equal(W.world(s).decor.find(p => p.id === 'reference-test-lamp').emissive, true);
  assert.equal(W.world(s).decor.find(p => p.id === 'suspect-test-lamp').color, '#303d3d');
});

test('C is isolated during pulses; repeat checks are bounded and hints are not evidence', () => {
  let s = start(2);
  s = act(s, 'routeHint');
  assert.match(S.trial(s).description, /A lower and B upper/);
  assert.equal(S.investigation.clear(s), false);
  assert.equal(S.can(s, 'report'), false);
  assert.deepEqual(s.investigation.pulses, []);
  assert.equal(s.arrival, null);
  for (let repeat = 0; repeat < 3; repeat++) for (let mask = 0; mask < 8; mask++) s = act(tune(s, mask), 'pulse');
  assert.equal(s.investigation.pulses.length, 8);
  assert.equal(s.investigation.lastPulse, 7);
  assert.deepEqual(s.attempts, [2, 1, 0, 0, 0]);
  assert.equal(s.flags.missingContact, false);
  assert.equal(s.flags.serviceFound, false);
  assert.equal(S.investigation.reached(2, 2), 2);
  assert.equal(S.investigation.reached(2, 6), 2);
});

test('ordinary parcel failures name the contact actually reached without inventing diagnostic checks', () => {
  for (const chapter of [1, 2]) {
    let s = start(chapter);
    if (chapter === 1) s = act(tune(s, 6), 'run');
    s = act(tune(s, chapter === 1 ? 0 : 1), 'run');
    assert.match(s.lastTrial.text, /stops at junction A/);
    assert.equal(W.world(s).signals.parcel.z, -.55 + .22);
    s = act(tune(s, chapter === 1 ? 3 : 0), 'run');
    assert.match(s.lastTrial.text, /stops at junction B/);
    s = act(tune(s, chapter === 1 ? 1 : 2), 'run');
    assert.match(s.lastTrial.text, /reaches C but cannot cross/);
    assert(Math.abs(W.world(s).signals.parcel.z - (-3.85 + .22)) < 1e-10);
    assert.deepEqual(s.investigation.pulses, [], 'delivery attempts do not manufacture isolated checks');
    assert.equal(S.can(s, 'report'), false);
    const invalid = copy(s); invalid.trialLog.at(-1).approach = 7; invalid.lastTrial.approach = 7;
    assert.equal(S.validate(invalid), null);
  }
});

test('the next room needs its own measurements and the filed diagnostic record remains immutable', () => {
  let s = act(tune(start(1), 6), 'run');
  s = act(tune(s, 0), 'pulse'); s = act(tune(s, 1), 'pulse');
  s = act(s, 'inspectContact'); s = act(s, 'report');
  const measurements = copy(s.investigation);
  s = submit(s, 'incomplete');
  assert.deepEqual(s.investigation, S.investigation.fresh());
  assert.deepEqual(s.history[1].report.investigation, measurements);
  const filed = copy(s.history);
  s = act(tune(s, 1), 'pulse');
  assert.match(s.lastResult.text, /stops at A/);
  assert.equal(S.investigation.clear(s), false);
  assert.deepEqual(s.history, filed);
  const forged = copy(s); forged.history[1].report.investigation.pulses[0] = 3;
  assert.equal(S.validate(forged), null, 'a changed reading cannot retain the old filed observations');
});

test('malformed or premature diagnostic evidence and fake arrival stages are rejected', () => {
  const early = start(1);
  early.investigation.pulses = [1]; early.investigation.lastPulse = 1;
  assert.equal(S.validate(early), null, 'cannot test the second approach before the first delivery');
  const s = act(tune(start(2), 2), 'pulse');
  for (const change of [d => d.version = 2, d => d.pulses.push(2), d => d.pulses.push(9), d => d.lastPulse = 7, d => d.lastPulse = null, d => d.hint = 'yes', d => d.approved = true]) {
    const bad = copy(s); change(bad.investigation); assert.equal(S.validate(bad), null);
  }
  const arrived = copy(s); arrived.arrival = 'received'; assert.equal(S.validate(arrived), null);
  const empty = start(2); empty.flags.missingContact = true; empty.flags.reportRejected = true;
  assert.equal(S.validate(empty), null, 'cannot file without an independent approach check');
});

test('pre-experiment saves retain exact reports, pending reviews, endings and earlier progression', () => {
  for (const input of Object.values(fixtures)) {
    const original = copy(input), loaded = S.validate(input);
    assert(loaded);
    assert.deepEqual(input, original);
    assert.deepEqual(loaded, {...original, investigation: null});
    assert.deepEqual(loaded.history, original.history);
  }
  let transit = S.validate(fixtures.transitReviewed);
  assert.equal(S.can(transit, 'submitReport'), true);
  transit = act(transit, 'submitReport');
  assert.equal(transit.investigation, null);
  let garden = S.validate(fixtures.gardenWork);
  assert.equal(S.can(garden, 'pulse'), false);
  garden = act(garden, 'inspectContact'); garden = act(garden, 'report');
  assert.equal(garden.flags.reportRejected, true);
  assert.equal(S.validate(fixtures.finished).ending, 'perfect');
});

test('new instructions defer the defect diagnosis and explain independent next actions', () => {
  let s = start(2);
  assert.doesNotMatch(Story.intro(s).lines.join(' '), /has been removed|socket is empty/);
  assert.match(Story.encounter(s, 'trial').lines.join(' '), /two|separately|separate/i);
  assert.doesNotMatch(R.build(s).title, /missing contact/i);
  assert(Story.encounter(s, 'relay').choices.some(c => c.action === 'inspectContact'));
  s = act(tune(s, 2), 'pulse');
  assert.match(S.objective(s).step, /Compare contact C/);
  s = act(s, 'inspectContact');
  assert.match(S.objective(s).step, /File the defect/);
});
