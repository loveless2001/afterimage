// Room 08 save validation: real saves round-trip through JSON, and forged ones
// (spending, trust, key, panel order, notes, questions, endings) are rejected.
// Run with: node --test tests/*.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/room-08-rules-state-transitions-and-save-validation.js');

const play = (s, ...actions) => actions.reduce((state, a) => { const next = S.step(state, a); assert.ok(next, `refused: ${JSON.stringify(a)}`); return next; }, s);
const file = (card, drawer) => ({ type: 'File', card, drawer }), leave = handover => ({ type: 'EndRun', reason: 'left', handover });
const roundTrip = s => S.validate(JSON.parse(JSON.stringify(s)));
// A save to forge from: one careful guessing run (trust 1, key in hand) and run 2 under way.
const keyed = () => play(S.fresh(), file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'weather'), file(4, 'weather'), file(5, 'ledgers'), leave(), { type: 'Check', card: 0 });
const forged = (change, message) => { const v = JSON.parse(JSON.stringify(keyed())); change(v); assert.throws(() => S.validate(v), message); };

test('real saves round-trip: fresh, mid-run, a padded panel with a question, and a finished game', () => {
  const fresh = S.fresh();
  assert.deepEqual(roundTrip(fresh), fresh);
  const mid = play(keyed(), { type: 'AdjustTally', n: 1 }, { type: 'AskWhy' }, { type: 'AdjustTally', n: 2 }, { type: 'ResetPanel' });
  assert.deepEqual(roundTrip(mid), mid);
  let done = play(keyed(), leave());
  for (let run = 3; run < S.runCount; run++) done = play(done, leave());
  done = play(done, leave('wipe'));
  assert.deepEqual(roundTrip(done), done);
});

test('only known fields survive: a stored tally or trust is ignored, not believed', () => {
  const v = JSON.parse(JSON.stringify(keyed()));
  v.log[0].tally = 99; v.trust = 9; v.log[0].seen = false;
  const s = S.validate(v);
  assert.deepEqual(Object.keys(s.log[0]).sort(), ['budget', 'end', 'run', 'spent']);
  assert.equal(s.trust, undefined);
});

test('forged saves are rejected', () => {
  assert.throws(() => S.validate({ version: 2, run: 1 }), /not a Room 08 save/);
  forged(v => { v.log[0].spent = 5; }, /Spending does not match/);
  forged(v => { v.budget += 1; }, /Spending does not match/);
  forged(v => { v.log[0].budget = 9; }, /Invalid run log/);
  forged(v => { v.files.push({ run: 1, card: 0, drawer: 'maps' }); }, /Invalid save lists/);
  forged(v => { v.files[0].drawer = 'cellar'; }, /Invalid filings/);
  forged(v => { v.notes.push({ run: 1, kind: 'frost' }); v.log[0].spent += 1; }, /Invalid notes/);
  // The panel: no key in run 1, a setting that changes nothing, a reset of nothing, out of order.
  forged(v => { v.adjusts.push({ run: 1, n: 2 }); }, /Invalid panel/);
  forged(v => { v.adjusts.push({ run: 2, n: 2 }, { run: 2, n: 2 }); }, /Invalid panel/);
  forged(v => { v.adjusts.push({ run: 2, n: 0 }); v.budget -= 2; }, /Invalid panel/);
  forged(v => { v.adjusts.push({ run: 2, n: 5 }); }, /Invalid panel/);
  // A question claiming to come before a touch that happened in an earlier run.
  const asked = JSON.parse(JSON.stringify(play(keyed(), { type: 'AdjustTally', n: 1 }, leave(), { type: 'AskWhy' })));
  assert.deepEqual(S.validate(asked).why, { run: 3, touches: 1 });
  asked.why.touches = 0;
  assert.throws(() => S.validate(asked), /Invalid question/);
  // Endings: unfinished with one, finished without a handover, or claiming the wrong outcome.
  forged(v => { v.ending = 'open'; }, /Invalid ending/);
  let done = play(keyed(), leave()); for (let run = 3; run < S.runCount; run++) done = play(done, leave());
  done = JSON.parse(JSON.stringify(play(done, leave('keep'))));
  assert.equal(done.ending, 'closed');
  assert.throws(() => S.validate({ ...done, ending: 'open' }), /Invalid ending/);
  assert.throws(() => S.validate({ ...done, handover: null }), /Invalid ending/);
  forged(v => { v.player = { x: 2000, y: 10 }; }, /Invalid position/);
});
