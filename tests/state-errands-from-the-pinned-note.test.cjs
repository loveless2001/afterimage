const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');

// Errands (milestone 9): the pinned note sends a trusted resident on an errand
// as the next run starts; they take no answer that run.
const light = (s, lamp) => S.advance(s, { type: 'Light', lamp });
const post = (s, parts) => S.advance(s, { type: 'Post', parts });
const talk = (s, resident) => S.advance(s, { type: 'Talk', resident });
const end = (s, reason, pin = null) => S.advance(s, { type: 'EndRun', reason, pin });
const copy = s => JSON.parse(JSON.stringify(s));
const roundTrip = s => S.validate(copy(s));
const [subject, verb, qualifier] = [w => S.kit.subjects.indexOf(w), w => S.kit.verbs.indexOf(w), w => S.kit.qualifiers.indexOf(w)];
const invalid = /Invalid (errands|answers|notes|lights)|Spending/;

// Run 1: Juno and Pell trust you and answer, which teaches "light" and "keep";
// then "Juno · light" (note 3) is posted and pinned instead of a note for Wren.
function juno() {
  const s = S.fresh();
  light(s, 'hall'); talk(s, 'juno'); talk(s, 'pell'); talk(s, 'wren'); talk(s, 'juno');
  post(s, [subject('Pell'), verb('check'), null]); talk(s, 'pell');
  post(s, [subject('west stacks'), verb('avoid'), null]); talk(s, 'juno');
  post(s, [subject('lamp'), verb('check'), qualifier('again')]); talk(s, 'pell');
  post(s, [subject('Juno'), verb('light'), null]);
  end(s, 'budget', 3);
  return s;
}
// Run 1: Wren is pinned. Run 2: she recognises you and answers ("remember"),
// the entrance lamp goes on, and "Wren · remember" (note 2) is pinned.
function wren({ entrance = true } = {}) {
  const s = S.fresh();
  talk(s, 'wren'); post(s, [subject('Wren'), verb('check'), null]); end(s, 'left', 0);
  talk(s, 'wren'); post(s, [subject('desk'), verb('check'), qualifier('again')]); talk(s, 'wren');
  if (entrance) light(s, 'entrance');
  post(s, [subject('Wren'), verb('remember'), null]); end(s, 'left', 2);
  return s;
}

test('Juno lights the next dark lamp for free and takes no answer that run', () => {
  const s = juno();
  assert.equal(s.run, 2); assert.equal(s.budget, 6, 'the errand costs nothing');
  assert.deepEqual(s.errands, [{ id: 'juno', run: 2 }]); assert.deepEqual(s.lights.at(-1), { id: 'west', run: 2, by: 'juno' });
  assert.deepEqual(S.errandThisRun(s), { id: 'juno', lamp: 'west' });
  assert.equal(S.onErrand(s, 'juno'), true); assert.equal(S.canAnswerThisRun(s, 'juno'), false);
  post(s, [subject('Wren'), verb('light'), null]); talk(s, 'juno');
  assert.equal(s.answers.length, 2, 'a fitting note does not answer while she is on the errand'); assert.equal(S.openQuestion(s, 'juno'), 1);
  talk(s, 'wren'); assert.equal(S.isTrusted(s, 'wren'), false, 'the pin went to Juno, so Wren does not recognise you');
  assert.deepEqual(roundTrip(s), s);
});

test('Pell keeps the cards she finds in lit stacks; re-pinning keeps her searching until they run out', () => {
  const s = juno();
  post(s, [subject('Pell'), verb('keep'), null]); end(s, 'left', 4);
  assert.deepEqual(s.errands.at(-1), { id: 'pell', run: 3 }); assert.equal(s.budget, 12);
  const card = s.notes.at(-1);
  assert.deepEqual(card, { run: 3, parts: S.foundNotes[0].parts, slot: 5, found: 0 }); assert.equal(S.foundNotes[0].stacks, 'west');
  assert.equal(S.postedByYou(card), false); assert.equal(S.canAnswerThisRun(s, 'pell'), false);
  assert.deepEqual(roundTrip(s), s);
  end(s, 'left', 4); assert.equal(s.notes.at(-1).found, 1, 'the second west card');
  assert.deepEqual(S.errandFor(s, 4, 5), { id: 'pell', why: 'searched' }, 'the east stacks are still dark');
  end(s, 'left', 4); assert.equal(s.errands.length, 3, 'nothing left to find, so no errand'); assert.equal(S.onErrand(s, 'pell'), false);
  end(s, 'left', 3); assert.equal(s.run, 6); assert.equal(S.errandFor(s, 3, 6), null, 'from the turn, pins send nobody');
  assert.equal(s.errands.length, 3); assert.equal(S.isLit(s, 'east'), false);
  assert.deepEqual(roundTrip(s), s);
});

test('Wren makes first talks free when the entrance lamp is lit', () => {
  const s = wren();
  assert.deepEqual(s.errands, [{ id: 'wren', run: 3 }]); assert.equal(S.talkCostIn(s), 0);
  talk(s, 'juno'); talk(s, 'pell'); assert.equal(s.budget, 12, 'first talks cost nothing');
  post(s, [subject('Juno'), verb('remember'), null]); talk(s, 'wren');
  assert.equal(s.answers.length, 1, 'Wren is on the errand, so her question waits');
  assert.deepEqual(roundTrip(s), s);
  const dark = wren({ entrance: false });
  assert.deepEqual(dark.errands, []); assert.deepEqual(S.errandFor(dark, 2, 3), { id: 'wren', why: 'dark' });
  talk(dark, 'juno'); assert.equal(dark.budget, 11);
});

test('a pin that is not an errand, or has nothing to do, sends nobody', () => {
  const s = juno(); // run 2: the west lamp is lit by Juno
  assert.equal(S.errandFor(s, 0, 3), null, '"Pell · check" is not Pell’s word');
  assert.equal(S.errandFor(s, 1, 3), null, 'a note about a place names nobody');
  light(s, 'east'); light(s, 'entrance');
  assert.deepEqual(S.errandFor(s, 3, 3), { id: 'juno', why: 'lit' });
  const early = S.fresh();
  light(early, 'hall'); talk(early, 'pell'); post(early, [subject('Pell'), verb('check'), null]); talk(early, 'pell');
  post(early, [subject('lamp'), verb('check'), qualifier('again')]); talk(early, 'pell');
  post(early, [subject('Pell'), verb('keep'), null]);
  assert.deepEqual(S.errandFor(early, 2, 2), { id: 'pell', why: 'dark' }, 'no stacks lamp is lit');
  end(early, 'left', 2); assert.deepEqual(early.errands, []); assert.equal(S.onErrand(early, 'pell'), false);
});

test('saves: errands must match the rules; saves from before errands still load', () => {
  const s = juno();
  post(s, [subject('Wren'), verb('light'), null]); talk(s, 'juno'); // note 4 fits Juno's question, but she is busy
  post(s, [subject('Pell'), verb('keep'), null]); end(s, 'left', 5); // run 3: Pell's first card
  const forged = [
    x => { x.errands = []; },
    x => { x.errands[0].run = 4; },
    x => { x.lights.find(l => l.by).id = 'east'; },
    x => { x.lights.find(l => l.by).by = 'pell'; },
    x => { delete x.notes.at(-1).found; },
    x => { x.notes.at(-1).parts = [0, 0, null]; },
    x => { x.notes.at(-1).found = 2; },
    x => { x.log[0].pin = 1; },
    x => { x.errands.push({ id: 'wren', run: 3 }); },
    x => { x.errands.push({ id: 'juno', run: 6 }); },
    x => { x.errands = 'none'; },
    x => { x.lights.push({ id: 'east', run: 2, by: 'juno' }); }, // a second free lamp beside Juno's real one
    x => { x.notes.push({ ...x.notes.at(-1), parts: S.foundNotes[1].parts, slot: 9, found: 1 }); }, // a second card in Pell's run
    x => { x.answers.push({ id: 'juno', q: 1, run: 2, note: 4 }); } // "Wren · light" answering Juno while she was on the errand
  ];
  forged.forEach((mutate, i) => { const x = copy(s); mutate(x); assert.throws(() => S.validate(x), invalid, `forgery ${i}`); });
  const legacy = copy(wren({ entrance: false }));
  delete legacy.errands;
  assert.deepEqual(S.validate(legacy).errands, []);
  // A pin that would qualify now, saved before errands: the lamp reads as bought.
  const before = copy(juno());
  before.errands = []; delete before.lights.at(-1).by; before.budget -= 2;
  assert.deepEqual(S.validate(before).errands, []);
});
