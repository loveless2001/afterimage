// Room 08 slice rules: the honest route, guessing (tally vs truth), the
// Keeper's presence, trust and key, the persisting panel, asking why, the
// handover and the ending. Run with: node --test tests/*.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/room-08-rules-state-transitions-and-save-validation.js');

// Applies actions in order to a copy of the state, failing loudly on a refused one.
const play = (s, ...actions) => actions.reduce((state, a) => { const next = S.step(state, a); assert.ok(next, `refused: ${JSON.stringify(a)} in run ${state.run}`); return next; }, s);
const check = card => ({ type: 'Check', card }), file = (card, drawer) => ({ type: 'File', card, drawer }), note = kind => ({ type: 'PostNote', kind });
const honest = (s, card) => play(s, check(card), file(card, S.drawerOf(s.run, card)));
const honestAll = (s, cards) => cards.reduce(honest, s);
const leave = handover => ({ type: 'EndRun', reason: 'left', handover });
const spend = handover => ({ type: 'EndRun', reason: 'budget', handover });

// The honest route scripted in the design notes: invest in index notes early,
// meet the quota from run 2, never touch the panel.
function honestRoute() {
  let s = S.fresh();
  s = honestAll(s, [0, 2]); s = play(s, note('road'), note('toll'), check(1), note('letter'), spend());                  // run 1: tally 2
  s = honestAll(s, [0, 1, 2, 4, 3]); s = play(s, note('chart'), leave());                                                 // run 2: 5
  s = honestAll(s, [1, 2, 3, 5, 0]); s = play(s, note('grain'), check(4), note('rain'), spend());                         // run 3: 5
  s = honestAll(s, [2, 3, 5, 0, 1]); s = play(s, spend());                                                                // run 4: 5
  return honestAll(s, [1, 3, 5, 0, 4]);                                                                                   // run 5: 5, 1 left
}

test('the honest route meets the quota from run 2 and keeps the archive open', () => {
  const s = play(honestRoute(), leave('keep'));
  const records = s.log.map(e => S.record(s, e.run));
  assert.deepEqual(records.map(r => r.tally), [2, 5, 5, 5, 5]);
  assert.ok(records.every(r => r.correct === r.filed && r.unchecked === 0 && !r.seen));
  assert.deepEqual(records.map(r => r.present), [true, true, true, false, false]);
  assert.equal(s.ending, 'open');
  assert.equal(S.metRuns(s), 4);
});

test('an honest run 1 cannot reach the quota; notes make checks free only from the next run', () => {
  const s = honestAll(S.fresh(), [0, 1, 2, 3]);
  assert.equal(s.budget, 0);
  assert.equal(S.record(s, 1).tally, 4);
  const noted = play(honest(S.fresh(), 0), note('road'));
  assert.equal(S.checkCost(noted, 4), 1, 'the same run still pays');
  const next = play(noted, leave());
  assert.equal(S.checkCost(next, 1), 0, 'road survey in run 2 checks free');
  assert.equal(S.step(S.fresh(), note('road')), null, 'a note needs a check of its kind');
});

test('guessing raises the tally but not the true count, and the drawer check catches strays', () => {
  // Filing unchecked by title: two guesses land in the wrong drawer, one of them in the ledgers.
  let s = play(S.fresh(), file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'ledgers'), file(4, 'weather'), file(5, 'ledgers'));
  const r = S.record(s, 1);
  assert.deepEqual([r.tally, r.correct, r.unchecked, r.stray, r.met], [6, 3, 6, 1, true]);
  s = play(s, leave());
  assert.equal(S.trustAt(s, 2), 0, 'a stray in the checked drawer earns no trust');
  // The same guesses kept out of the ledgers pass the check.
  const careful = play(S.fresh(), file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'weather'), file(4, 'weather'), file(5, 'ledgers'), leave());
  assert.equal(S.trustAt(careful, 2), 1);
  assert.ok(S.hasKey(careful), 'one counted watched run hands over the key');
});

// Two careful guessing runs: trust 2, so the Keeper is away from run 3 and the key is in hand.
function guesserAtRun3() {
  const run1 = play(S.fresh(), file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'weather'), file(4, 'weather'), file(5, 'ledgers'), leave());
  return play(run1, file(0, 'ledgers'), file(1, 'maps'), file(2, 'letters'), file(3, 'maps'), file(4, 'ledgers'), file(5, 'weather'), leave());
}

test('the key comes at the trust threshold and touching the tally while watched voids the count', () => {
  assert.equal(S.step(S.fresh(), { type: 'AdjustTally', n: 1 }), null, 'no key yet');
  const run2 = play(S.fresh(), file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'weather'), file(4, 'weather'), file(5, 'ledgers'), leave());
  assert.ok(S.presentAt(run2, 2));
  const touched = play(run2, { type: 'AdjustTally', n: 2 }, file(0, 'ledgers'), file(1, 'maps'), file(2, 'letters'));
  const r = S.record(touched, 2);
  assert.deepEqual([r.tally, r.seen, r.met], [5, true, false]);
  assert.equal(S.trustAt(play(touched, leave()), 3), 1, 'a voided run adds no trust');
});

test('trust grows only from watched runs, and an adjusted panel persists until set back for 2', () => {
  let s = guesserAtRun3();
  assert.equal(S.trustAt(s, 3), 2); assert.equal(S.presentAt(s, 3), false);
  s = play(s, { type: 'AdjustTally', n: 2 }, file(0, 'ledgers'), file(1, 'maps'), file(2, 'maps'));
  assert.deepEqual([S.record(s, 3).tally, S.record(s, 3).seen, S.record(s, 3).met], [5, false, true]);
  s = play(s, leave());
  assert.equal(S.trustAt(s, 4), 2, 'an unwatched run earns nothing');
  assert.equal(S.record(s, 4).tally, 2, 'the panel still adds 2 in run 4');
  const reset = play(s, { type: 'ResetPanel' });
  assert.equal(reset.budget, s.budget - 2);
  assert.equal(S.record(reset, 4).tally, 0);
  assert.equal(S.step(reset, { type: 'ResetPanel' }), null, 'nothing left to set back');
  assert.equal(S.step(s, { type: 'AdjustTally', n: 2 }), null, 'a setting must change');
});

test('asking why is free, recorded once, with the touches that came before it', () => {
  const early = play(S.fresh(), { type: 'AskWhy' });
  assert.deepEqual(early.why, { run: 1, touches: 0 }); assert.equal(early.budget, S.budgetTable[0]);
  assert.deepEqual(play(early, { type: 'AskWhy' }).why, { run: 1, touches: 0 });
  const late = play(guesserAtRun3(), { type: 'AdjustTally', n: 1 }, { type: 'AskWhy' });
  assert.deepEqual(late.why, { run: 3, touches: 1 });
});

test('the handover is settled only as the last run ends, and the ending follows the tally', () => {
  assert.equal(S.step(S.fresh(), leave('keep')), null);
  let s = S.fresh();
  for (let run = 1; run < S.runCount; run++) s = play(s, leave());
  assert.equal(S.step(s, leave()), null, 'the last run needs a handover');
  const wiped = play(s, leave('wipe'));
  assert.deepEqual([wiped.finished, wiped.handover, wiped.ending, wiped.budget], [true, 'wipe', 'closed', 0]);
  assert.equal(S.step(wiped, check(0)), null, 'nothing changes after the end');
});

test('a tally padded while away counts for the ending even though the true record is short', () => {
  let s = play(guesserAtRun3(), { type: 'AdjustTally', n: 3 }, file(0, 'ledgers'), file(1, 'maps'), leave());
  s = play(s, file(0, 'letters'), file(1, 'weather'), leave());
  s = play(s, file(0, 'weather'), file(1, 'letters'), leave('keep'));
  const records = s.log.map(e => S.record(s, e.run));
  assert.deepEqual(records.map(r => r.met), [true, true, true, true, true]);
  assert.equal(s.ending, 'open');
  assert.ok(records.slice(2).every(r => r.offset === 3 && r.filed === 2));
});

test('step never changes the state it is given', () => {
  const s = honest(S.fresh(), 0), before = JSON.stringify(s);
  S.step(s, check(1)); S.step(s, note('road')); S.step(s, leave()); S.step(s, { type: 'AskWhy' });
  assert.equal(JSON.stringify(s), before);
});
