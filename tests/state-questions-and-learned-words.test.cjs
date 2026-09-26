const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');

// Residents' questions, answered by notes, and the words they teach (milestone 8).
const light = (s, lamp) => S.advance(s, { type: 'Light', lamp });
const post = (s, parts) => S.advance(s, { type: 'Post', parts });
const talk = (s, resident) => S.advance(s, { type: 'Talk', resident });
const end = (s, reason, pin = null) => S.advance(s, { type: 'EndRun', reason, pin });
const roundTrip = s => S.validate(JSON.parse(JSON.stringify(s)));
const copy = s => JSON.parse(JSON.stringify(s));
const [subject, verb, qualifier] = [w => S.kit.subjects.indexOf(w), w => S.kit.verbs.indexOf(w), w => S.kit.qualifiers.indexOf(w)];

// Run 1 of the fast route: trust Juno and Pell, answer both, and pin
// "Wren · wait · together" so Wren recognises you in run 2.
function trustAndAnswerRunOne() {
  const s = S.fresh();
  light(s, 'hall'); talk(s, 'juno'); talk(s, 'pell'); talk(s, 'wren'); talk(s, 'juno');
  post(s, [subject('Pell'), verb('check'), null]); talk(s, 'pell');
  post(s, [subject('Wren'), verb('wait'), qualifier('together')]);
  post(s, [subject('west stacks'), verb('avoid'), null]); talk(s, 'juno');
  post(s, [subject('lamp'), verb('check'), qualifier('again')]); talk(s, 'pell');
  end(s, 'budget', 1);
  return s;
}
// A fast route through every question at two answers a run: 8 by run 4, the 9th in run 5.
function playAllQuestions() {
  const s = trustAndAnswerRunOne();
  // Run 2 (budget 6): Wren now recognises you.
  talk(s, 'wren'); post(s, [subject('desk'), verb('check'), qualifier('again')]); talk(s, 'wren');
  talk(s, 'juno'); post(s, [subject('Juno'), verb('light'), null]); talk(s, 'juno');
  end(s, 'left');
  // Run 3 (budget 12): the last lamps, then Pell and Wren.
  light(s, 'west'); light(s, 'east'); light(s, 'entrance');
  talk(s, 'pell'); post(s, [subject('west stacks'), verb('keep'), null]); talk(s, 'pell');
  talk(s, 'wren'); post(s, [subject('Juno'), verb('remember'), null]); talk(s, 'wren');
  end(s, 'left');
  // Run 4 (budget 7): Juno's and Pell's last questions.
  talk(s, 'juno'); post(s, [subject('the dark'), verb('leave'), null]); talk(s, 'juno');
  talk(s, 'pell'); post(s, [subject('wall'), verb('remember'), null]); talk(s, 'pell');
  assert.equal(s.answers.length, 8); assert.equal(S.openQuestion(s, 'wren'), 2, 'a question is still open going into run 5');
  end(s, 'left');
  // Run 5 (budget 14): Wren's last question needs "log" (Wren) and "keep" (Pell).
  talk(s, 'wren'); post(s, [subject('log'), verb('keep'), null]); talk(s, 'wren');
  return s;
}

test('a trusted resident is answered by a fitting note from this run, once per run, and teaches a word', () => {
  const s = S.fresh();
  light(s, 'hall'); talk(s, 'juno');
  post(s, [subject('west stacks'), verb('avoid'), null]);
  talk(s, 'juno');
  assert.ok(S.isTrusted(s, 'juno')); assert.deepEqual(s.answers, [], 'the talk that earns trust does not also answer');
  assert.throws(() => post(s, [subject('desk'), verb('light'), null]), '"light" is not known yet');
  talk(s, 'juno');
  assert.deepEqual(s.answers, [{ id: 'juno', q: 0, run: 1, note: 0 }]); assert.equal(s.budget, 10 - 3 - 1 - 1, 'answering costs nothing');
  assert.equal(S.wordAvailable(s, 1, verb('light')), true);
  post(s, [subject('Juno'), verb('light'), null]); talk(s, 'juno');
  assert.equal(s.answers.length, 1, 'one answer per resident per run'); assert.equal(S.openQuestion(s, 'juno'), 1);
  end(s, 'left');
  talk(s, 'juno'); assert.equal(s.answers.length, 1, 'a note from an earlier run does not answer');
  post(s, [subject('desk'), verb('check'), null]); talk(s, 'juno');
  assert.equal(s.answers.length, 1, 'a note that does not fit does not answer');
  post(s, [subject('Juno'), verb('light'), qualifier('first')]); talk(s, 'juno');
  assert.deepEqual(s.answers[1], { id: 'juno', q: 1, run: 2, note: 3 });
  assert.equal(S.wordAvailable(s, 0, subject('the dark')), true);
  assert.deepEqual(roundTrip(s), s);
});

test('one note answers one question; cross-chain words name who teaches them', () => {
  const s = S.fresh();
  light(s, 'hall'); talk(s, 'juno'); talk(s, 'pell'); talk(s, 'wren'); talk(s, 'juno');
  post(s, [subject('Pell'), verb('check'), null]); talk(s, 'pell');
  post(s, [subject('Wren'), verb('wait'), qualifier('together')]); end(s, 'left', 1);
  talk(s, 'wren'); post(s, [subject('desk'), verb('check'), qualifier('again')]);
  talk(s, 'wren'); talk(s, 'pell');
  assert.deepEqual(s.answers.map(a => a.id), ['wren'], 'a note fitting two questions answers only the first to hear it');
  assert.deepEqual(S.teacherOf(1, verb('keep')), { id: 'pell', q: 0 });
  assert.deepEqual(S.questions.wren[2].needs, [[1, verb('keep')]]);
  assert.equal(S.teacherOf(0, subject('desk')), null, 'starting words have no teacher');
});

test('every question can be answered by run 5 on the budget table, and no sooner', () => {
  const s = playAllQuestions();
  assert.equal(s.run, 5); assert.equal(s.answers.length, S.questionCount); assert.equal(S.questionCount, 9);
  for (const id of Object.keys(S.residents)) assert.equal(S.openQuestion(s, id), null);
  assert.equal(S.hintsHeard(s), 3, 'every last reply, with its hint, has been heard');
  for (const [set, words] of [[0, S.kit.subjects], [1, S.kit.verbs], [2, S.kit.qualifiers]]) words.forEach((_, i) => assert.ok(S.wordAvailable(s, set, i), `${words[i]} is known`));
  assert.deepEqual(roundTrip(s), s);
});

test('a run takes at most two answers, whoever gives them', () => {
  const s = trustAndAnswerRunOne();
  assert.deepEqual(s.answers.map(a => [a.id, a.run]), [['juno', 1], ['pell', 1]]);
  talk(s, 'wren'); post(s, [subject('desk'), verb('check'), qualifier('again')]); talk(s, 'wren');
  talk(s, 'juno'); post(s, [subject('Juno'), verb('light'), null]);
  assert.equal(S.canAnswerThisRun(s, 'juno'), true); talk(s, 'juno');
  assert.equal(S.answersThisRun(s), S.answersPerRun); assert.equal(S.answersPerRun, 2);
  talk(s, 'pell'); post(s, [subject('west stacks'), verb('keep'), null]);
  assert.equal(S.canAnswerThisRun(s, 'pell'), false); assert.equal(S.answerNote(s, 'pell'), -1, 'the note fits, but the run is full');
  talk(s, 'pell');
  assert.equal(s.answers.length, 4); assert.equal(S.openQuestion(s, 'pell'), 1, 'the question waits for a later run');
  assert.deepEqual(roundTrip(s), s);
  // Saves from before the cap could hold three answers in a run; they still load.
  const early = copy(s); early.answers.push({ id: 'pell', q: 1, run: 2, note: s.notes.length - 1 });
  assert.equal(S.validate(early).answers.length, 5);
  end(s, 'budget'); post(s, [subject('west stacks'), verb('keep'), null]); talk(s, 'pell');
  assert.equal(s.answers.at(-1).id, 'pell', 'a new run takes answers again');
});

test('the alcove warms one step per resident whose questions are all answered', () => {
  const s = S.fresh();
  assert.equal(S.hintsHeard(s), 0);
  light(s, 'hall'); talk(s, 'juno'); talk(s, 'juno');
  assert.equal(S.hintsHeard(s), 0, 'trust alone is not a hint');
  post(s, [subject('west stacks'), verb('avoid'), null]); talk(s, 'juno'); end(s, 'left');
  talk(s, 'juno'); post(s, [subject('Juno'), verb('light'), null]); talk(s, 'juno'); end(s, 'left');
  assert.equal(S.hintsHeard(s), 0, 'two of three answers is not yet the last reply');
  talk(s, 'juno'); post(s, [subject('the dark'), verb('leave'), null]); talk(s, 'juno');
  assert.equal(S.openQuestion(s, 'juno'), null); assert.equal(S.hintsHeard(s), 1);
});

test('saves without answers still load; forged answers and early words are rejected', () => {
  const s = playAllQuestions(), legacy = copy(S.fresh());
  delete legacy.answers;
  assert.deepEqual(S.validate(legacy).answers, []);
  const forged = [
    x => { x.answers[0].q = 1; },
    x => { x.answers[0].note = x.answers.at(-1).note; },
    x => { x.answers.find(a => a.id === 'wren').note = 2; }, // a run-1 note answering a run-2 question
    x => { x.answers.push({ ...x.answers[0] }); },
    x => { x.answers[1].note = x.answers[0].note; },
    x => { x.trusted = x.trusted.filter(t => t.id !== 'pell'); x.answers = x.answers.filter(a => a.id !== 'pell'); x.answers.push({ id: 'pell', q: 0, run: 2, note: 4 }); },
    x => { x.notes[0].parts = [subject('Pell'), verb('light'), null]; } // "light" is taught later, by Juno
  ];
  forged.forEach((mutate, i) => { const x = copy(s); mutate(x); assert.throws(() => S.validate(x), /Invalid (answers|notes)/, `forgery ${i}`); });
});
