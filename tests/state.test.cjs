const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');
const P = require('../js/pathfinding-visibility-graph.js');

const light = (s, lamp) => S.advance(s, { type: 'Light', lamp });
const end = (s, reason) => S.advance(s, { type: 'EndRun', reason });
const roundTrip = s => S.validate(JSON.parse(JSON.stringify(s)));

test('a fresh game starts run 1 at the entrance with the first budget', () => {
  const s = S.fresh();
  assert.equal(s.run, 1); assert.equal(s.budget, S.budgetTable[0]); assert.equal(s.finished, false);
  assert.deepEqual(s.player, S.entrance); assert.deepEqual(roundTrip(s), s);
});

test('lighting a lamp spends its cost once and records the run', () => {
  const s = S.fresh();
  light(s, 'hall');
  assert.equal(s.budget, S.budgetTable[0] - S.lamps.hall.cost);
  assert.deepEqual(s.lights, [{ id: 'hall', run: 1 }]);
  assert.throws(() => light(s, 'hall'), 'a lit lamp cannot be lit again');
  for (const lamp of ['nope', 'toString', '__proto__', undefined]) assert.throws(() => light(s, lamp));
  assert.deepEqual(roundTrip(s), s);
});

test('the budget cannot be overspent', () => {
  const s = S.fresh(); end(s, 'left'); // run 2 has budget 6
  light(s, 'hall'); light(s, 'west'); assert.equal(s.budget, 1);
  assert.equal(S.canLight(s, 'east'), false);
  assert.throws(() => light(s, 'east'));
  light(s, 'entrance'); assert.equal(s.budget, 0);
});

test('runs end by leaving with budget left, or by spending it all', () => {
  const s = S.fresh();
  assert.throws(() => end(s, 'budget'), 'cannot end by budget while budget remains');
  assert.throws(() => end(s, 'other'));
  light(s, 'west'); end(s, 'left');
  assert.equal(s.run, 2); assert.equal(s.budget, S.budgetTable[1]); assert.deepEqual(s.player, S.entrance);
  assert.deepEqual(s.log, [{ run: 1, budget: 10, spent: 2, end: 'left', pin: null }]);
  assert.deepEqual(s.lights, [{ id: 'west', run: 1 }], 'lamps stay lit across runs');
  light(s, 'hall'); light(s, 'east'); light(s, 'entrance');
  assert.equal(s.budget, 0);
  assert.throws(() => end(s, 'left'), 'an empty budget ends by budget, not by leaving');
  end(s, 'budget');
  assert.equal(s.run, 3); assert.equal(s.budget, S.budgetTable[2]);
  assert.deepEqual(s.log[1], { run: 2, budget: 6, spent: 6, end: 'budget', pin: null });
  assert.deepEqual(roundTrip(s), s);
});

test('each run uses the authored budget table and run 7 finishes the game', () => {
  const s = S.fresh();
  for (let run = 1; run < S.runCount; run++) {
    assert.equal(s.run, run); assert.equal(s.budget, S.budgetTable[run - 1]);
    end(s, 'left');
  }
  assert.equal(s.budget, S.budgetTable[S.runCount - 1]);
  assert.throws(() => end(s, 'left'), 'the last run must choose an ending');
  assert.throws(() => S.advance(s, { type: 'EndRun', reason: 'left', ending: 'lights' }), 'an ending needs its prerequisites');
  S.advance(s, { type: 'EndRun', reason: 'left', ending: 'record' });
  assert.equal(s.finished, true); assert.equal(s.ending, 'record'); assert.equal(s.run, S.runCount); assert.equal(s.budget, 0);
  assert.equal(s.log.length, S.runCount);
  assert.throws(() => end(s, 'budget')); assert.throws(() => light(s, 'entrance'));
  assert.deepEqual(roundTrip(s), s);
});

test('malformed imports cannot inject impossible runs, spending, or fields', () => {
  const base = S.fresh(); light(base, 'west'); end(base, 'left'); light(base, 'entrance');
  for (const patch of [
    { version: 1 }, { version: 99 }, { run: 0 }, { run: 8 }, { run: 1.5 }, { finished: 'no' },
    { budget: -1 }, { budget: 99 }, { budget: 6 }, { finished: true },
    { log: [] }, { log: [{ run: 1, budget: 10, spent: 2, end: 'budget' }] },
    { log: [{ run: 1, budget: 9, spent: 2, end: 'left' }] }, { log: [{ run: 1, budget: 10, spent: 10, end: 'left' }] },
    { lights: [{ id: 'west', run: 1 }] }, { lights: [{ id: 'west', run: 1 }, { id: 'entrance', run: 3 }] },
    { lights: [{ id: 'west', run: 1 }, { id: 'west', run: 1 }, { id: 'entrance', run: 2 }] },
    { lights: [{ id: 'sun', run: 1 }, { id: 'entrance', run: 2 }] }, { lights: 'all' },
    { player: { x: Infinity, y: 10 } }, { player: { x: 2000, y: 100 } }, { player: null }
  ]) assert.throws(() => S.validate({ ...base, ...patch }), JSON.stringify(patch));
  assert.throws(() => S.validate(null)); assert.throws(() => S.validate({ version: 1, cycle: 1 }));
  const clean = S.validate({ ...base, untrusted: 'ignored', log: base.log.map(e => ({ ...e, extra: 1 })) });
  assert.equal(clean.untrusted, undefined); assert.equal(clean.log[0].extra, undefined);
  assert.deepEqual(clean, base);
});

test('step is pure and rejects unknown or malformed actions', () => {
  const s = S.fresh(), before = JSON.stringify(s);
  const next = S.step(s, { type: 'Light', lamp: 'entrance' });
  assert.equal(JSON.stringify(s), before, 'input state is not mutated');
  next.lights[0].run = 5; next.player.x = 99;
  assert.equal(JSON.stringify(s), before, 'result does not share nested values with the input');
  for (const action of [null, {}, { type: 'Unknown' }, { type: 'Light' }, { type: 'EndRun' }]) assert.equal(S.step(s, action), null);
});

const post = (s, parts, replace) => S.advance(s, { type: 'Post', parts, replace });

test('posting a note costs 1, takes the first free slot, and renders from the kit', () => {
  const s = S.fresh();
  post(s, [2, 0, 0]); post(s, [4, 5, null]);
  assert.equal(s.budget, S.budgetTable[0] - 2);
  assert.deepEqual(s.notes, [{ run: 1, parts: [2, 0, 0], slot: 0 }, { run: 1, parts: [4, 5, null], slot: 1 }]);
  assert.equal(S.noteText(s.notes[0].parts), 'west stacks · check · first');
  assert.equal(S.noteText(s.notes[1].parts), 'exit · leave');
  assert.equal(S.noteText([1]), 'lamp', 'partial drafts render too');
  for (const parts of [[5, 0, 0], [0, 6, null], [0, 0, 5], [0, 0], [0, 0, undefined], '0,0,0', [-1, 0, null], [0.5, 0, null]]) assert.throws(() => post(s, parts), JSON.stringify(parts));
  assert.throws(() => post(s, [0, 0, null], 0), 'nothing may be replaced while the wall has space');
  assert.deepEqual(roundTrip(s), s);
});

test('a full wall needs a note taken down, and the new note reuses its slot', () => {
  const s = S.fresh(), note = [0, 0, null];
  for (let i = 0; i < 10; i++) post(s, note);
  end(s, 'budget');
  for (let i = 0; i < 6; i++) post(s, note);
  end(s, 'budget');
  for (let i = 0; i < 8; i++) post(s, note);
  assert.equal(S.onWall(s).length, S.wallSlots);
  assert.equal(S.canPost(s), false); assert.throws(() => post(s, [1, 1, 1]));
  assert.throws(() => post(s, [1, 1, 1], 99)); assert.throws(() => post(s, [1, 1, 1], -1));
  post(s, [1, 1, 1], 3);
  assert.equal(s.notes[3].slot, null); assert.equal(s.notes.at(-1).slot, 3); assert.equal(S.onWall(s).length, S.wallSlots);
  assert.throws(() => post(s, [1, 1, 1], 3), 'a taken-down note cannot be taken down again');
  assert.deepEqual(roundTrip(s), s, 'taken-down notes still explain the spending of their run');
});

test('a run can pin one wall note for the next run', () => {
  const s = S.fresh();
  post(s, [2, 0, 0]);
  assert.throws(() => S.advance(s, { type: 'EndRun', reason: 'left', pin: 1 }), 'the pin must be a note on the wall');
  S.advance(s, { type: 'EndRun', reason: 'left', pin: 0 });
  assert.equal(s.pinned, 0); assert.equal(s.run, 2);
  assert.deepEqual(roundTrip(s), s);
  end(s, 'left');
  assert.equal(s.pinned, null, 'each run end replaces the pin');
});

test('note validation rejects impossible walls, pins and spending; older saves load', () => {
  const base = S.fresh(); post(base, [2, 0, 0]); S.advance(base, { type: 'EndRun', reason: 'left', pin: 0 }); post(base, [0, 3, null]);
  const note = (run, slot, parts = [0, 0, null]) => ({ run, parts, slot });
  for (const patch of [
    { notes: 'none' }, { notes: [note(1, 0), note(2, 0)] }, { notes: [note(1, 0), note(3, 1)] }, { notes: [note(1, 24), note(2, 1)] },
    { notes: [note(1, 0, [9, 0, null]), note(2, 1)] }, { notes: [note(1, 0), note(2, 1), note(2, 2)] }, { notes: [note(1, 0)] },
    { pinned: 1 }, { pinned: 2 }, { pinned: -1 }, { pinned: '0' }
  ]) assert.throws(() => S.validate({ ...base, ...patch }), JSON.stringify(patch));
  const legacy = S.fresh(); delete legacy.notes; delete legacy.pinned;
  assert.deepEqual(S.validate(legacy), S.fresh(), 'a milestone 2 save without notes still loads');
});

test('walking routes around shelves and rejects blocked destinations', () => {
  const shelves = [{ x: 400, y: 290, w: 180, d: 38 }];
  const start = { x: 450, y: 440 }, target = { x: 450, y: 230 };
  const path = P.findPath(start, target, shelves);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), target);
  let previous = start;
  for (const p of path) {
    for (let i = 0; i <= 100; i++) {
      const x = previous.x + (p.x - previous.x) * i / 100;
      const y = previous.y + (p.y - previous.y) * i / 100;
      assert.ok(!(x > 387 && x < 593 && y > 277 && y < 341));
    }
    previous = p;
  }
  assert.equal(P.findPath(start, { x: 450, y: 310 }, shelves), null);
  assert.equal(P.findPath(start, { x: 5, y: 10 }, shelves), null);
});
