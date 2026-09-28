const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');

// After an ending, residents point to the endings you passed over, and Revisit
// says where it rewinds to.
const light = (s, lamp) => S.advance(s, { type: 'Light', lamp });
const post = (s, parts) => S.advance(s, { type: 'Post', parts });
const talk = (s, resident) => S.advance(s, { type: 'Talk', resident });
const runTo = (s, run) => { while (s.run < run) S.advance(s, { type: 'EndRun', reason: 'left' }); return s; };
const callouts = s => Object.fromEntries(Object.keys(S.residents).map(id => [id, S.endingCallout(s, id)]));
// The last run, spent on `spend`, then closed with an ending (the record by default).
const spentLastRun = (spend, ending = 'record') => { const s = runTo(S.fresh(), S.runCount); spend(s); assert.equal(s.budget, 0); S.advance(s, { type: 'EndRun', reason: 'budget', ending }); return s; };
const lightAllThenPost = s => { for (const id of Object.keys(S.lamps)) light(s, id); while (s.budget) post(s, [0, 0, null]); };

test('finishing early leaves the other endings reachable, and Revisit lands where it says', () => {
  const s = runTo(S.fresh(), S.turnRun);
  assert.deepEqual(callouts(s), { wren: null, juno: null, pell: null }, 'nothing to say before an ending');
  S.advance(s, { type: 'VisitBench' }); S.advance(s, { type: 'Finish', ending: 'record' });
  assert.deepEqual(S.revisitTarget(s), { run: S.turnRun, budget: S.budgetTable[S.turnRun - 1] });
  assert.equal(S.budgetAfterRevisit(s), S.budgetTable[S.turnRun - 1] + S.budgetTable[S.runCount - 1], 'the rewound run plus the run after it');
  assert.deepEqual(callouts(s), { wren: null, juno: 'reachable', pell: 'reachable' });
  assert.deepEqual([S.benchHint(s, 'wren'), S.benchHint(s, 'juno')], ['hint', null], 'only the chosen ending’s resident hints, once the bench is seen');
  const target = S.revisitTarget(s);
  S.advance(s, { type: 'Revisit' });
  assert.deepEqual({ run: s.run, budget: s.budget }, target);
});

test('a spent last run: endings already met are ready, the rest are late', () => {
  const lit = spentLastRun(lightAllThenPost);
  assert.equal(S.budgetAfterRevisit(lit), 0);
  assert.deepEqual(callouts(lit), { wren: null, juno: 'ready', pell: 'late' });
  assert.deepEqual([S.darkLamps(lit), S.wallGaps(lit)], [[], S.wallEndingNotes - 4]);
  const wall = spentLastRun(s => { while (s.budget) post(s, [0, 0, null]); });
  assert.deepEqual(callouts(wall), { wren: null, juno: 'late', pell: 'ready' });
  assert.equal(S.wallGaps(wall), 0);
  const lights = spentLastRun(s => { S.advance(s, { type: 'VisitBench' }); lightAllThenPost(s); }, 'lights');
  assert.deepEqual(callouts(lights), { wren: 'ready', juno: null, pell: 'late' }, 'the record is always ready');
  assert.deepEqual(Object.keys(S.residents).map(id => S.benchHint(lights, id)), [null, 'hint', null], 'Juno hints, and a spent last run can’t reach the bench');
});

test('the bench hint turns ready only while a revisit can still reach it; the secret ending silences everyone', () => {
  const secret = () => {
    const s = S.fresh();
    light(s, 'hall'); talk(s, 'juno'); talk(s, 'pell'); talk(s, 'wren'); talk(s, 'juno');
    post(s, [7, 0, null]); talk(s, 'pell'); post(s, [5, 4, 3]); // Pell trusted; "Wren · wait · together"
    S.advance(s, { type: 'EndRun', reason: 'left', pin: 1 }); talk(s, 'wren');
    return runTo(s, S.turnRun);
  };
  const unseen = secret(), seen = secret();
  S.advance(seen, { type: 'VisitBench' });
  for (const s of [unseen, seen]) S.advance(s, { type: 'Finish', ending: 'record' });
  assert.equal(S.benchHint(unseen, 'wren'), null, 'not seen and no last reply heard');
  assert.equal(S.benchHint(seen, 'wren'), 'ready');
  const alcove = secret();
  S.advance(alcove, { type: 'Finish', ending: 'alcove' });
  assert.deepEqual(callouts(alcove), { wren: null, juno: null, pell: null });
  assert.deepEqual(Object.keys(S.residents).map(id => S.benchHint(alcove, id)), [null, null, null]);
});

test('callout lines count lamps and gaps in words', () => {
  global.window = { Afterimage: {} };
  require('../js/residents-dialogue-lines.js');
  const A = global.window.Afterimage;
  assert.deepEqual(A.residentCallouts.juno({ kind: 'late', dark: ['west stacks lamp'] }), ['“The west stacks lamp is still dark. Whoever comes next might light it.”']);
  assert.match(A.residentCallouts.juno({ kind: 'reachable', dark: ['entrance lamp', 'east stacks lamp'] })[0], /^“Two lamps are still dark\./);
  assert.match(A.residentCallouts.pell({ kind: 'reachable', gaps: 1 })[0], /one gap\. I read around it\./);
  assert.match(A.residentCallouts.pell({ kind: 'late', gaps: 4 })[0], /four gaps\. .* might fill them\./);
  assert.match(A.residentCallouts.pell({ kind: 'ready', cards: 21 })[0], /^“Twenty-one cards\./);
  delete global.window;
});
