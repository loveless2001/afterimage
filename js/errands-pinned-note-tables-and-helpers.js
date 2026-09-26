// Errands (milestone 9): the note pinned as a run ends can send a trusted
// resident on an errand as the next run starts (runs 2–5 only; from the turn
// the residents keep to the desk). The note must name them and use the word
// they answer to, which is the first word they taught you. One pin means at
// most one errand a run, and the resident on it takes no answer that run
// (see canAnswerThisRun). Also reads saved errands back for validation.
(function (root) {
  'use strict';
  const C = root.AfterimageContent || require('./game-content-tables-lamps-kit-residents-endings.js');
  const { residents, questions, wallSlots, talkCost, turnRun, isInt, isLit, isTrusted, onWall, onErrand } = C;
  const firstErrandRun = 2, lastErrandRun = turnRun - 1;
  // The verb each resident answers to: Juno "light", Wren "remember", Pell "keep".
  const errandVerb = id => questions[id][0].teaches[1];
  // Juno lights the dark lamps in this order. The hall is already lit, because
  // it is what she waits for before trusting you.
  const lightOrder = ['west', 'east', 'entrance'];
  // Cards someone left in the stacks before you; Pell finds them in this order,
  // in whichever stacks are lit. Starting words only, so none names a resident
  // or says "wait · together" (the secret).
  const foundNotes = [
    { stacks: 'west', parts: [1, 2, 1], history: 'Tucked behind a west shelf, older than anything on the wall. Pell doesn’t know the hand.' },
    { stacks: 'west', parts: [0, 3, 0], history: 'The same hand. Wren’s log has no run it could belong to.' },
    { stacks: 'east', parts: [3, 0, 4], history: 'Folded small, the corner worn soft. Someone read it more than twice.' },
    { stacks: 'east', parts: [4, 5, 2], history: 'The last card. Whoever wrote it left in the end; the room kept what they wrote.' }
  ];

  // What pinning note `pin` would do as `run` starts, judged on state s as the
  // run before it ends. null when it is not an errand. Otherwise { id } plus the
  // effect ({ lamp }, { found } or { freeTalks: true }), or { why } when there is
  // nothing to do: 'lit' (every lamp is on), 'dark' (the lamp it needs is off),
  // 'searched' (the lit stacks are empty) or 'full' (no wall slot).
  function errandFor(s, pin, run) {
    const note = pin === null ? null : s.notes[pin];
    if (!note || run < firstErrandRun || run > lastErrandRun) return null;
    const id = C.residentBySubject(note.parts[0]);
    if (!id || note.parts[1] !== errandVerb(id) || !isTrusted(s, id)) return null;
    if (id === 'juno') { const lamp = lightOrder.find(l => !isLit(s, l)); return lamp ? { id, lamp } : { id, why: 'lit' }; }
    if (id === 'wren') return isLit(s, 'entrance') ? { id, freeTalks: true } : { id, why: 'dark' };
    const lit = ['west', 'east'].filter(l => isLit(s, l));
    if (!lit.length) return { id, why: 'dark' };
    const found = foundNotes.findIndex((f, k) => lit.includes(f.stacks) && !s.notes.some(n => n.found === k));
    if (found < 0) return { id, why: 'searched' };
    return onWall(s).length < wallSlots ? { id, found } : { id, why: 'full' };
  }
  // Starts the errand (if any) in `next`, the run that is starting from s.
  function applyErrand(s, next, pin) {
    const e = errandFor(s, pin, next.run);
    if (!e || e.why) return;
    next.errands.push({ id: e.id, run: next.run });
    if (e.lamp) next.lights.push({ id: e.lamp, run: next.run, by: 'juno' });
    if (e.found !== undefined) next.notes.push({ run: next.run, parts: [...foundNotes[e.found].parts], slot: C.freeSlot(next), found: e.found });
  }
  // With Wren waiting at the door, first talks cost nothing this run.
  const talkCostIn = s => onErrand(s, 'wren') ? 0 : talkCost;
  // This run's errand, if any, as { id, lamp?, found? } for the UI.
  function errandThisRun(s) {
    const e = s.errands.find(x => x.run === s.run);
    if (!e) return null;
    const lamp = s.lights.find(l => l.by === 'juno' && l.run === s.run), found = s.notes.find(n => n.found !== undefined && n.run === s.run);
    return { id: e.id, ...(lamp ? { lamp: lamp.id } : {}), ...(found ? { found: found.found } : {}) };
  }

  // Reads saved errands against lists validate() has already checked, or
  // returns null. Each must be exactly what the rules would have done, given
  // the lamps, notes and trust from before its run. Saves from before errands
  // have none, and pins that would now qualify are not required to have one.
  function readErrands(v, { log, lights, notes, trusted }) {
    if (v.errands !== undefined && !Array.isArray(v.errands)) return null;
    const errands = (v.errands || []).map(e => e && Object.hasOwn(residents, e.id) && isInt(e.run, firstErrandRun, Math.min(v.run, lastErrandRun)) ? { id: e.id, run: e.run } : null);
    if (errands.includes(null) || new Set(errands.map(e => e.run)).size !== errands.length) return null;
    const found = notes.filter(n => n.found !== undefined);
    if (lights.some(l => l.by !== undefined && l.by !== 'juno') || new Set(found.map(n => n.found)).size !== found.length ||
      found.some(n => !isInt(n.found, 0, foundNotes.length - 1) || n.parts.join() !== foundNotes[n.found].parts.join())) return null;
    const ok = errands.every(e => {
      // Notes are appended in run order, so those from before this run are a prefix.
      // Their slots are as saved now, and a slot only ever empties, so a wall that
      // was full then may read as having room: accepted, as a forged card gains little.
      const before = { notes: notes.slice(0, notes.filter(n => n.run < e.run).length), lights: lights.filter(l => l.run < e.run), trusted: trusted.filter(t => t.run < e.run) };
      const want = errandFor(before, log[e.run - 2].pin, e.run);
      // Exactly the effect: one lamp or one card, never extras in the same run.
      const lamps = lights.filter(l => l.by && l.run === e.run).map(l => l.id), cards = found.filter(n => n.run === e.run).map(n => n.found);
      return want && !want.why && want.id === e.id && lamps.join() === (want.lamp ?? '') && cards.join() === String(want.found ?? '');
    });
    const sent = (id, run) => errands.some(e => e.id === id && e.run === run);
    return ok && lights.every(l => !l.by || sent('juno', l.run)) && found.every(n => sent('pell', n.run)) ? errands : null;
  }

  const api = { firstErrandRun, lastErrandRun, errandVerb, lightOrder, foundNotes, errandFor, applyErrand, talkCostIn, errandThisRun, readErrands };
  root.AfterimageErrands = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
