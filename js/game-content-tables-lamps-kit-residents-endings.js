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
  // Preset phrase kit (no free text). New subjects are only ever appended.
  const kit = {
    subjects: ['desk', 'lamp', 'west stacks', 'east stacks', 'exit', 'Wren', 'Juno', 'Pell'],
    verbs: ['check', 'avoid', 'bring', 'ask', 'wait', 'leave'],
    qualifiers: ['first', 'later', 'never', 'together', 'again']
  };
  const kitSets = [kit.subjects, kit.verbs, kit.qualifiers];
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
  // Place subjects are always available; a resident's name once you have met them.
  const subjectAvailable = (s, i) => { const id = residentBySubject(i); return id ? hasMet(s, id) : isInt(i, 0, kit.subjects.length - 1); };
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
    hasMet, talkedThisRun, isTrusted, pinnedNote, recognizes, requestMet, subjectAvailable, endingReady, endingAvailable
  };
  root.AfterimageContent = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
