// Content tables and read-only helpers shared by the rules, the UI and the
// Node tests: the budget table, lamps, the note phrase kit, residents and what
// each one is waiting for, and the endings with their prerequisites.
// Nothing here changes state (see game-rules-state-transitions-and-save-validation.js).
(function (root) {
  'use strict';
  // Budget per run, authored rather than random so every playthrough is the
  // same length. Provisional: tune after the first playtest (design §12a).
  const budgetTable = [10, 6, 12, 7, 14, 9, 12];
  const runCount = budgetTable.length, turnRun = 6;
  const lamps = {
    entrance: { title: 'Entrance lamp', cost: 1 },
    west: { title: 'West stacks lamp', cost: 2 },
    east: { title: 'East stacks lamp', cost: 2 },
    hall: { title: 'Notice hall lamp', cost: 3 }
  };
  // Residents persist across runs: they remember the room, not your face.
  // Each one's name is also a note subject (index into kit.subjects).
  const residents = {
    wren: { name: 'Wren', subject: 5, role: 'keeps the run log at the desk' },
    juno: { name: 'Juno', subject: 6, role: 'tends the lamps' },
    pell: { name: 'Pell', subject: 7, role: 'reads the notice hall' }
  };
  // Preset phrase kit (no free text). Words are only ever appended, so stored
  // indices never shift. Each set starts with `baseWords` words; after them come
  // the resident names (subjects 5–7, once met) and the words residents teach
  // when you answer their questions (see `questions`).
  const kit = {
    subjects: ['desk', 'lamp', 'west stacks', 'east stacks', 'exit', 'Wren', 'Juno', 'Pell', 'the dark', 'log', 'wall'],
    verbs: ['check', 'avoid', 'bring', 'ask', 'wait', 'leave', 'light', 'remember', 'keep'],
    qualifiers: ['first', 'later', 'never', 'together', 'again', 'tonight', 'still', 'for good']
  };
  const kitSets = [kit.subjects, kit.verbs, kit.qualifiers], baseWords = [5, 6, 5];
  const sub = w => kit.subjects.indexOf(w), verb = w => kit.verbs.indexOf(w), qual = w => kit.qualifiers.indexOf(w);
  const place = i => i < baseWords[0], person = i => Boolean(residentBySubject(i));
  // Once a resident trusts you, they ask these in order. A note posted this run
  // answers when `accept(parts)` holds; the answer teaches one word, as [set, index].
  // `needs` lists words taught by another resident's questions.
  const questions = {
    juno: [
      { accept: p => place(p[0]) && [verb('avoid'), verb('check')].includes(p[1]), teaches: [1, verb('light')] },
      { accept: p => person(p[0]) && p[1] === verb('light'), teaches: [0, sub('the dark')] },
      { accept: p => p[0] === sub('the dark') && p[1] === verb('leave'), teaches: [2, qual('tonight')] }
    ],
    wren: [
      { accept: p => p[2] !== null, teaches: [1, verb('remember')] },
      { accept: p => person(p[0]) && p[1] === verb('remember'), teaches: [0, sub('log')] },
      { accept: p => p[0] === sub('log') && p[1] === verb('keep'), teaches: [2, qual('still')], needs: [[1, verb('keep')]] }
    ],
    pell: [
      { accept: p => p[2] === qual('again'), teaches: [1, verb('keep')] },
      { accept: p => (place(p[0]) || person(p[0])) && p[1] === verb('keep'), teaches: [0, sub('wall')] },
      { accept: p => (person(p[0]) || p[0] === sub('wall')) && p[1] === verb('remember'), teaches: [2, qual('for good')], needs: [[1, verb('remember')]] }
    ]
  };
  const questionCount = Object.values(questions).reduce((sum, list) => sum + list.length, 0);
  const wordText = ([set, i]) => kitSets[set][i];
  // The question that teaches a word, as { id, q }, or null for a word you start with.
  const teacherOf = (set, i) => {
    for (const [id, list] of Object.entries(questions)) {
      const q = list.findIndex(x => x.teaches[0] === set && x.teaches[1] === i);
      if (q >= 0) return { id, q };
    }
    return null;
  };
  const endings = {
    record: { letter: 'A', title: 'The record', need: 'Always available.' },
    lights: { letter: 'B', title: 'The lights', need: 'Needs every lamp lit.' },
    wall: { letter: 'C', title: 'The wall', need: 'Needs twelve notes on the wall.' },
    alcove: { letter: 'D', title: 'Still here', need: 'A secret.', secret: true }
  };
  const wallSlots = 24, noteCost = 1, talkCost = 1, wallEndingNotes = 12;
  const secretWords = { verb: 4, qualifier: 3 }; // "wait" · "together"
  const palettes = ['auto', 'day', 'night'];
  const entrance = { x: 450, y: 590 };

  const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  const isLit = (s, id) => s.lights.some(l => l.id === id);
  const lampCost = id => Object.hasOwn(lamps, id) ? lamps[id].cost : Infinity;
  // "west stacks · check · first"; also renders partial drafts while building.
  const noteText = parts => parts.map((p, i) => p === null || p === undefined ? null : kitSets[i][p]).filter(Boolean).join(' · ');
  const validParts = p => Array.isArray(p) && p.length === 3 && isInt(p[0], 0, kit.subjects.length - 1) &&
    isInt(p[1], 0, kit.verbs.length - 1) && (p[2] === null || isInt(p[2], 0, kit.qualifiers.length - 1));
  // Indices (into state.notes) of the notes currently on the wall, oldest first.
  const onWall = s => s.notes.map((n, i) => n.slot === null ? -1 : i).filter(i => i >= 0);
  const isOnWall = (s, i) => Number.isInteger(i) && i >= 0 && i < s.notes.length && s.notes[i].slot !== null;
  const wallHas = (s, test) => onWall(s).some(i => test(s.notes[i].parts));
  const residentBySubject = subject => Object.keys(residents).find(id => residents[id].subject === subject);

  const hasMet = (s, id) => s.talks.some(t => t.id === id);
  const talkedThisRun = (s, id) => s.talks.some(t => t.id === id && t.run === s.run);
  const isTrusted = (s, id) => s.trusted.some(t => t.id === id);
  const pinnedNote = s => s.pinned === null ? null : s.notes[s.pinned];
  // A pinned note naming a resident means this run arrives already known to them.
  const recognizes = (s, id) => pinnedNote(s)?.parts[0] === residents[id].subject;
  // What each resident is waiting for before they trust you.
  const requestMet = {
    wren: s => recognizes(s, 'wren'),
    juno: s => isLit(s, 'hall'),
    pell: s => wallHas(s, p => p[0] === residents.pell.subject)
  };
  // Starting words are always available, a resident's name once you have met
  // them, and a taught word once its question has been answered.
  const taught = (s, set, i) => { const t = teacherOf(set, i); return Boolean(t) && s.answers.some(a => a.id === t.id && a.q === t.q); };
  const wordAvailable = (s, set, i) => {
    if (!isInt(i, 0, kitSets[set].length - 1)) return false;
    const id = set === 0 ? residentBySubject(i) : null;
    return id ? hasMet(s, id) : i < baseWords[set] || taught(s, set, i);
  };
  const partsAvailable = (s, p) => p.every((i, set) => i === null || wordAvailable(s, set, i));
  // Questions: a trusted resident waits on the next unanswered one (null once
  // all are answered) and takes at most one answer per run.
  const answersBy = (s, id) => s.answers.filter(a => a.id === id);
  const openQuestion = (s, id) => isTrusted(s, id) && answersBy(s, id).length < questions[id].length ? answersBy(s, id).length : null;
  const answeredThisRun = (s, id) => s.answers.some(a => a.id === id && a.run === s.run);
  // Words taught so far, or only in one run, in the order they were learned.
  const learnedWords = (s, run) => s.answers.filter(a => run === undefined || a.run === run).map(a => wordText(questions[a.id][a.q].teaches));
  // The newest wall note posted this run that fits the open question and has
  // not answered anything else, or -1.
  const answerNote = (s, id) => {
    const q = openQuestion(s, id);
    if (q === null || answeredThisRun(s, id)) return -1;
    return onWall(s).filter(i => s.notes[i].run === s.run && !s.answers.some(a => a.note === i) && questions[id][q].accept(s.notes[i].parts)).at(-1) ?? -1;
  };
  // Prerequisites only; the rules also require run ≥ turnRun and an unfinished game.
  const endingReady = (s, id) => id === 'record' ? true
    : id === 'lights' ? Object.keys(lamps).every(l => isLit(s, l))
    : id === 'wall' ? onWall(s).length >= wallEndingNotes
    : id === 'alcove' ? Object.keys(residents).every(r => isTrusted(s, r)) && wallHas(s, p => p[1] === secretWords.verb && p[2] === secretWords.qualifier)
    : false;
  const endingAvailable = (s, id) => Object.hasOwn(endings, id) && !s.finished && s.run >= turnRun && endingReady(s, id);

  const api = {
    budgetTable, runCount, turnRun, lamps, residents, kit, endings, wallSlots, noteCost, talkCost, wallEndingNotes, palettes, entrance,
    isInt, isLit, lampCost, noteText, validParts, onWall, isOnWall, residentBySubject,
    hasMet, talkedThisRun, isTrusted, pinnedNote, recognizes, requestMet, endingReady, endingAvailable,
    baseWords, questions, questionCount, teacherOf, wordAvailable, partsAvailable, openQuestion, answeredThisRun, answerNote, wordText, learnedWords
  };
  root.AfterimageContent = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
