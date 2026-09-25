const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');

// Residents, trust, endings and settings (milestones 4–6).
const light = (s, lamp) => S.advance(s, { type: 'Light', lamp });
const end = (s, reason) => S.advance(s, { type: 'EndRun', reason });
const post = (s, parts, replace) => S.advance(s, { type: 'Post', parts, replace });
const roundTrip = s => S.validate(JSON.parse(JSON.stringify(s)));
const talk = (s, resident) => S.advance(s, { type: 'Talk', resident });
// Plays whole runs by leaving, optionally doing something first in each.
const runTo = (s, run) => { while (s.run < run) end(s, 'left'); return s; };

test('talking costs 1 the first time each run; trust needs an earlier meeting and the request', () => {
  const s = S.fresh();
  light(s, 'hall'); // Juno's request is already met before you meet her
  talk(s, 'juno');
  assert.equal(s.budget, 10 - 3 - 1); assert.deepEqual(s.talks, [{ id: 'juno', run: 1 }]); assert.deepEqual(s.trusted, [], 'a first meeting only states the request');
  talk(s, 'juno');
  assert.equal(s.budget, 6, 'talking again in the same run is free'); assert.deepEqual(s.trusted, [{ id: 'juno', run: 1 }]);
  assert.throws(() => talk(s, 'nobody')); assert.throws(() => talk(s, 'toString'));
  end(s, 'left'); talk(s, 'juno');
  assert.equal(s.budget, S.budgetTable[1] - 1, 'a new run charges again'); assert.equal(s.trusted.length, 1, 'trust is recorded once');
  assert.deepEqual(roundTrip(s), s);
});

test("resident names join the note kit once met; Pell and Wren's requests use notes and the pin", () => {
  const s = S.fresh();
  assert.throws(() => post(s, [7, 0, null]), 'Pell cannot be named before meeting');
  talk(s, 'pell'); talk(s, 'wren');
  post(s, [7, 3, null]); // "Pell · ask"
  talk(s, 'pell'); assert.ok(S.isTrusted(s, 'pell'));
  post(s, [5, 4, 3]); // "Wren · wait · together"
  assert.equal(S.noteText(s.notes[1].parts), 'Wren · wait · together');
  talk(s, 'wren'); assert.equal(S.isTrusted(s, 'wren'), false, 'Wren needs to recognise you from a pinned note');
  S.advance(s, { type: 'EndRun', reason: 'left', pin: 1 });
  assert.equal(S.recognizes(s, 'wren'), true);
  talk(s, 'wren'); assert.ok(S.isTrusted(s, 'wren'));
  assert.deepEqual(roundTrip(s), s);
});

test('endings unlock at the turn, respect prerequisites, and can be revisited', () => {
  const s = runTo(S.fresh(), S.turnRun - 1);
  assert.equal(S.endingAvailable(s, 'record'), false, 'nothing before the turn');
  end(s, 'left');
  assert.equal(s.run, S.turnRun);
  assert.throws(() => S.advance(s, { type: 'Finish', ending: 'wall' }));
  assert.throws(() => S.advance(s, { type: 'Finish', ending: 'alcove' }));
  const before = JSON.parse(JSON.stringify(s));
  S.advance(s, { type: 'Finish', ending: 'record' });
  assert.equal(s.finished, true); assert.equal(s.ending, 'record'); assert.deepEqual(s.log.at(-1), { run: 6, budget: 9, spent: 0, end: 'ending', pin: null });
  assert.deepEqual(roundTrip(s), s);
  assert.throws(() => S.advance(s, { type: 'Finish', ending: 'record' }), 'one ending at a time');
  S.advance(s, { type: 'Revisit' });
  assert.deepEqual(s, before, 'revisiting restores the run exactly');
  assert.throws(() => S.advance(s, { type: 'Revisit' }));
});

test('the secret ending needs all three residents trusted and a "wait · together" note', () => {
  const s = S.fresh();
  light(s, 'hall'); talk(s, 'juno'); talk(s, 'pell'); talk(s, 'wren'); talk(s, 'juno');
  post(s, [7, 0, null]); talk(s, 'pell'); post(s, [5, 4, 3]); // Pell trusted; "Wren · wait · together"
  S.advance(s, { type: 'EndRun', reason: 'left', pin: 1 }); talk(s, 'wren');
  assert.deepEqual(s.trusted.map(t => t.id).sort(), ['juno', 'pell', 'wren']);
  runTo(s, S.turnRun);
  assert.equal(S.endingAvailable(s, 'alcove'), true);
  S.advance(s, { type: 'Finish', ending: 'alcove' });
  assert.equal(s.ending, 'alcove'); assert.deepEqual(roundTrip(s), s);
  const bare = runTo(S.fresh(), S.turnRun);
  assert.equal(S.endingAvailable(bare, 'alcove'), false);
});

test('settings and new fields validate strictly; older finished saves read as the record ending', () => {
  const s = S.fresh();
  S.advance(s, { type: 'SetPalette', palette: 'night' }); S.advance(s, { type: 'VisitBench' });
  assert.equal(s.palette, 'night'); assert.equal(s.benchSeen, true); assert.throws(() => S.advance(s, { type: 'SetPalette', palette: 'neon' }));
  talk(s, 'juno');
  for (const patch of [
    { palette: 'neon' }, { benchSeen: 'yes' }, { talks: [] }, { talks: [{ id: 'juno', run: 1 }, { id: 'juno', run: 1 }] },
    { talks: [{ id: 'ghost', run: 1 }] }, { trusted: [{ id: 'wren', run: 1 }] }, { ending: 'record' }, { ending: 'nope', finished: true },
    { notes: [{ run: 1, parts: [5, 0, null], slot: 0 }] }, { lights: undefined }
  ]) assert.throws(() => S.validate({ ...s, ...patch }), JSON.stringify(patch));
  const done = runTo(S.fresh(), S.runCount); S.advance(done, { type: 'EndRun', reason: 'left', ending: 'record' });
  const legacy = JSON.parse(JSON.stringify(done)); for (const key of ['ending', 'talks', 'trusted', 'palette', 'benchSeen']) delete legacy[key];
  assert.deepEqual(S.validate(legacy), done);
  assert.throws(() => S.validate({ ...done, ending: 'lights' }), 'the ending prerequisites must still hold');
});

test('trust in a save needs evidence that its request was met; pins are recorded in the log', () => {
  const s = S.fresh();
  talk(s, 'wren'); talk(s, 'juno'); talk(s, 'pell'); post(s, [5, 0, null]);
  S.advance(s, { type: 'EndRun', reason: 'left', pin: 0 });
  assert.equal(s.log[0].pin, 0, 'the run log records the pin');
  talk(s, 'wren'); assert.ok(S.isTrusted(s, 'wren')); assert.deepEqual(roundTrip(s), s);
  // Forged trust: the talks exist but the requests were never met.
  const forged = run => ({ ...s, trusted: [...s.trusted, { id: run[0], run: run[1] }] });
  assert.throws(() => S.validate(forged(['juno', 1])), 'Juno needs the hall lamp lit');
  assert.throws(() => S.validate(forged(['pell', 1])), 'Pell needs a note naming Pell');
  assert.throws(() => S.validate({ ...s, log: [{ ...s.log[0], pin: null }], pinned: null }), 'Wren needs the pin that opened the run to name her');
  assert.throws(() => S.validate({ ...s, pinned: null }), 'the current pin must match the previous run');
});

test('older saves without recorded pins take the current pin as the previous run’s', () => {
  const s = S.fresh(); post(s, [0, 0, null]); S.advance(s, { type: 'EndRun', reason: 'left', pin: 0 }); end(s, 'left');
  light(s, 'entrance');
  const legacy = JSON.parse(JSON.stringify(s)); legacy.log = legacy.log.map(({ pin, ...e }) => e); legacy.pinned = null;
  assert.equal(S.validate(legacy).log[0].pin, null);
  const m3 = S.fresh(); post(m3, [0, 0, null]); S.advance(m3, { type: 'EndRun', reason: 'left', pin: 0 });
  const old = JSON.parse(JSON.stringify(m3)); old.log = old.log.map(({ pin, ...e }) => e);
  assert.deepEqual(S.validate(old), m3, 'an M3 save with a pin loads unchanged');
});
