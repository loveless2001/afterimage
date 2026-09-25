// Game rules as one pure transition function, plus strict validation for
// browser saves and imported files. step(state, action) returns the next
// state or null when the action is not allowed; nothing else changes game
// state. Shared by the browser (window.AfterimageState) and the Node tests.
(function (root) {
  'use strict';
  const C = root.AfterimageContent || require('./game-content-tables-lamps-kit-residents-endings.js');
  const { budgetTable, runCount, turnRun, lamps, residents, endings, wallSlots, noteCost, talkCost, palettes, entrance, isInt, isLit, isOnWall, onWall } = C;
  const endReasons = ['left', 'budget', 'ending'];
  const fresh = () => ({ version: 2, run: 1, budget: budgetTable[0], lights: [], notes: [], pinned: null, talks: [], trusted: [], answers: [], log: [], ending: null, finished: false, benchSeen: false, palette: 'auto', player: { ...entrance } });
  // Copies nested values so a transition never shares them with its input.
  const clone = s => ({ ...s, lights: s.lights.map(l => ({ ...l })), notes: s.notes.map(n => ({ ...n, parts: [...n.parts] })), talks: s.talks.map(t => ({ ...t })), trusted: s.trusted.map(t => ({ ...t })), answers: s.answers.map(a => ({ ...a })), log: s.log.map(e => ({ ...e })), player: { ...s.player } });

  const canLight = (s, id) => !s.finished && Object.hasOwn(lamps, id) && !isLit(s, id) && s.budget >= lamps[id].cost;
  const canWrite = s => !s.finished && s.budget >= noteCost;
  // A full wall needs a note to take down; otherwise nothing may be replaced.
  const canPost = (s, replace) => canWrite(s) && (onWall(s).length < wallSlots ? replace === undefined || replace === null : isOnWall(s, replace));
  // The first talk with a resident in a run costs budget; talking again is free.
  const canTalk = (s, id) => !s.finished && Object.hasOwn(residents, id) && (C.talkedThisRun(s, id) || s.budget >= talkCost);
  // Runs end by leaving (budget left over) or by spending it all. The last run
  // must also choose an ending; runs before it cannot.
  const canEndRun = (s, reason) => !s.finished && ['left', 'budget'].includes(reason) && (reason === 'budget') === (s.budget === 0);
  // Logs the current run, including the note it pinned for the next run.
  function closeRun(s, next, end, pin = null) {
    const start = budgetTable[s.run - 1];
    next.log.push({ run: s.run, budget: start, spent: start - s.budget, end, pin });
  }

  function step(s, action) {
    const next = clone(s);
    switch (action && action.type) {
      case 'Light':
        if (!canLight(s, action.lamp)) return null;
        next.lights.push({ id: action.lamp, run: s.run }); next.budget -= lamps[action.lamp].cost;
        return next;
      case 'Post': {
        if (!canPost(s, action.replace) || !C.validParts(action.parts) || !C.partsAvailable(s, action.parts)) return null;
        const used = new Set(onWall(s).map(i => s.notes[i].slot)), replacing = isOnWall(s, action.replace);
        const slot = replacing ? s.notes[action.replace].slot : [...Array(wallSlots).keys()].find(i => !used.has(i));
        if (replacing) next.notes[action.replace].slot = null;
        next.notes.push({ run: s.run, parts: [...action.parts], slot }); next.budget -= noteCost;
        return next;
      }
      case 'Talk': {
        const id = action.resident;
        if (!canTalk(s, id)) return null;
        if (!C.talkedThisRun(s, id)) { next.talks.push({ id, run: s.run }); next.budget -= talkCost; }
        // Trust needs an earlier meeting, so a first meeting only states the request.
        if (C.hasMet(s, id) && !C.isTrusted(s, id) && C.requestMet[id](next)) next.trusted.push({ id, run: s.run });
        // A resident who already trusted you reads this run's note as the answer
        // to their open question; trust earned in this talk waits for the next one.
        const note = C.isTrusted(s, id) ? C.answerNote(next, id) : -1;
        if (note >= 0) next.answers.push({ id, q: C.openQuestion(next, id), run: s.run, note });
        return next;
      }
      case 'EndRun': {
        const pin = action.pin ?? null, last = s.run === runCount, ending = action.ending ?? null;
        if (!canEndRun(s, action.reason) || (pin !== null && (last || !isOnWall(s, pin)))) return null;
        if (last !== (ending !== null) || (last && !C.endingAvailable(s, ending))) return null;
        closeRun(s, next, action.reason, pin);
        if (last) { next.finished = true; next.ending = ending; next.budget = 0; return next; }
        next.pinned = pin; next.run = s.run + 1; next.budget = budgetTable[s.run]; next.player = { ...entrance };
        return next;
      }
      case 'Finish':
        if (!C.endingAvailable(s, action.ending)) return null;
        closeRun(s, next, 'ending'); next.finished = true; next.ending = action.ending; next.budget = 0;
        return next;
      case 'Revisit': {
        // Undo the ending: back into the run it was chosen in, with that run's budget.
        if (!s.ending) return null;
        const last = next.log.pop();
        next.run = last.run; next.budget = last.budget - last.spent; next.finished = false; next.ending = null;
        return next;
      }
      case 'VisitBench': next.benchSeen = true; return next;
      case 'SetPalette': if (!palettes.includes(action.palette)) return null; next.palette = action.palette; return next;
      default: return null;
    }
  }
  // Applies an allowed action to the live state object, or throws.
  function advance(s, action) {
    const next = step(s, action);
    if (!next) throw new Error('That action is not available in this run.');
    return Object.assign(s, next);
  }

  const fail = message => { throw new Error(message); };
  const byRun = (list, run) => list.filter(x => x.run === run);
  // Rebuilds a save from untrusted JSON, copying only known fields and
  // rejecting combinations the rules could never produce.
  function validate(v) {
    if (!v || v.version !== 2) fail('This is not an AFTERIMAGE v2 save.');
    if (!isInt(v.run, 1, runCount) || typeof v.finished !== 'boolean') fail('Invalid run.');
    if (!isInt(v.budget, 0, budgetTable[v.run - 1])) fail('Invalid budget.');
    // Older saves finished without choosing; they read as the record ending.
    const ending = v.ending === undefined ? (v.finished ? 'record' : null) : v.ending;
    if (ending !== null && !Object.hasOwn(endings, ending)) fail('Invalid ending.');
    if (v.finished !== (ending !== null) || (ending && (v.budget !== 0 || v.run < turnRun))) fail('Invalid ending.');
    if (!Array.isArray(v.log) || v.log.length !== v.run - 1 + (v.finished ? 1 : 0)) fail('Invalid run log.');
    // Logs saved before pins were recorded: the current pin came from the previous run.
    const legacyPins = v.log.every(e => e && e.pin === undefined);
    const log = v.log.map((e, i) => {
      const lastEntry = i === v.log.length - 1 && v.finished;
      if (!e || e.run !== i + 1 || e.budget !== budgetTable[i] || !isInt(e.spent, 0, e.budget) || !endReasons.includes(e.end) ||
        (e.end === 'ending' ? !lastEntry : (e.end === 'budget') !== (e.spent === e.budget)) || (lastEntry && e.end !== 'ending' && v.run !== runCount)) fail('Invalid run log.');
      const pin = legacyPins ? (i === v.run - 2 && v.pinned !== undefined ? v.pinned : null) : e.pin;
      return { run: e.run, budget: e.budget, spent: e.spent, end: e.end, pin };
    });
    // Lists added after the first v2 saves (talks, trust, notes) may be missing.
    const list = (value, optional) => Array.isArray(value) ? value : optional && value === undefined ? [] : fail('Invalid save lists.');
    const lights = list(v.lights, false).map(l => (l && Object.hasOwn(lamps, l.id) && isInt(l.run, 1, v.run)) ? { id: l.id, run: l.run } : fail('Invalid lights.'));
    const talks = list(v.talks, true).map(t => (t && Object.hasOwn(residents, t.id) && isInt(t.run, 1, v.run)) ? { id: t.id, run: t.run } : fail('Invalid talks.'));
    const trusted = list(v.trusted, true).map(t => (t && talks.some(k => k.id === t.id && k.run === t.run)) ? { id: t.id, run: t.run } : fail('Invalid trust.'));
    // Trust needs its request to have been met by that run (see requestMet in the content tables).
    const named = (n, id) => n.parts[0] === residents[id].subject;
    const earned = {
      juno: t => lights.some(l => l.id === 'hall' && l.run <= t.run),
      pell: t => notes.some(n => named(n, 'pell') && n.run <= t.run),
      wren: t => t.run >= 2 && log[t.run - 2].pin !== null && named(notes[log[t.run - 2].pin], 'wren')
    };
    const notes = list(v.notes, true).map(n => {
      if (!n || !isInt(n.run, 1, v.run) || !C.validParts(n.parts) || !(n.slot === null || isInt(n.slot, 0, wallSlots - 1))) fail('Invalid notes.');
      const named = C.residentBySubject(n.parts[0]);
      if (named && !talks.some(t => t.id === named && t.run <= n.run)) fail('Invalid notes.');
      return { run: n.run, parts: [...n.parts], slot: n.slot };
    });
    const unique = (items, key) => new Set(items.map(key)).size === items.length;
    if (!unique(lights, l => l.id) || !unique(talks, t => `${t.id}:${t.run}`) || !unique(trusted, t => t.id) || !unique(notes.filter(n => n.slot !== null), n => n.slot)) fail('Invalid save lists.');
    const pinned = v.pinned === undefined ? null : v.pinned;
    // A pin is set as a run ends, so it points at a note from that run or earlier,
    // and the current pin is the one the previous run chose.
    for (const e of log) if (e.pin !== null && (!isInt(e.pin, 0, notes.length - 1) || notes[e.pin].run > e.run || e.end === 'ending' || e.run === runCount)) fail('Invalid pinned note.');
    if (pinned !== (v.run >= 2 ? log[v.run - 2].pin : null)) fail('Invalid pinned note.');
    if (!trusted.every(t => earned[t.id](t))) fail('Invalid trust.');
    // Answers (added in milestone 8): each resident's questions in order, one per
    // run, after trust and at a talk that run, each by a fitting note from that run.
    const answers = list(v.answers, true).map(a => (a && Object.hasOwn(residents, a.id) && isInt(a.q, 0, C.questions[a.id].length - 1) && isInt(a.run, 1, v.run) &&
      isInt(a.note, 0, notes.length - 1)) ? { id: a.id, q: a.q, run: a.run, note: a.note } : fail('Invalid answers.'));
    for (const id of Object.keys(residents)) answers.filter(a => a.id === id).forEach((a, q, mine) => {
      const trust = trusted.find(t => t.id === id), n = notes[a.note];
      if (a.q !== q || !trust || trust.run > a.run || (q && mine[q - 1].run >= a.run) || !talks.some(t => t.id === id && t.run === a.run) ||
        n.run !== a.run || !C.questions[id][q].accept(n.parts)) fail('Invalid answers.');
    });
    if (!unique(answers, a => a.note)) fail('Invalid answers.');
    // A taught word can only appear in notes posted after the note that earned it.
    notes.forEach((n, i) => n.parts.forEach((w, set) => {
      const t = w !== null && !(set === 0 && C.residentBySubject(w)) && w >= C.baseWords[set] ? C.teacherOf(set, w) : null;
      if (t && !answers.some(a => a.id === t.id && a.q === t.q && a.note < i)) fail('Invalid notes.');
    }));
    // Lamps, notes and first talks are the only costs; each run's spending must match.
    for (let run = 1; run <= v.run; run++) {
      const spent = run <= log.length ? log[run - 1].spent : budgetTable[run - 1] - v.budget;
      const lampSpend = byRun(lights, run).reduce((sum, l) => sum + lamps[l.id].cost, 0);
      if (spent !== lampSpend + byRun(notes, run).length * noteCost + byRun(talks, run).length * talkCost) fail('Spending does not match the lamps, notes and talks.');
    }
    const palette = v.palette === undefined ? 'auto' : v.palette, benchSeen = v.benchSeen === undefined ? false : v.benchSeen;
    if (!palettes.includes(palette) || typeof benchSeen !== 'boolean') fail('Invalid settings.');
    const p = v.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) fail('Invalid position.');
    const s = { version: 2, run: v.run, budget: v.budget, lights, notes, pinned, talks, trusted, answers, log, ending, finished: v.finished, benchSeen, palette, player: { x: p.x, y: p.y } };
    // Nothing changes after an ending, so its prerequisites must still hold.
    if (ending && !C.endingReady(s, ending)) fail('Invalid ending.');
    return s;
  }

  const api = { ...C, fresh, step, advance, canLight, canWrite, canPost, canTalk, canEndRun, validate };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
