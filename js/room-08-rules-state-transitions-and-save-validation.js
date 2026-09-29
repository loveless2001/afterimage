// Room 08's rules as one pure transition function, the records derived from
// a save (tally, truth, the Keeper's presence and trust), and strict save
// validation. step(state, action) returns the next state or null when the
// action is not allowed. Only choices are stored (checks, filings, notes,
// panel settings); everything the Keeper sees or trusts is derived from them,
// so a save cannot claim a count or a trust it did not earn.
(function (root) {
  'use strict';
  const C = root.AfterimageRoom08Content || require('./room-08-content-tables-cards-drawers-keeper-schedule.js');
  const { budgetTable, runCount, quota, openAt, costs, drawers, spotDrawer, kinds, keeper, panelSettings, handovers, palettes, entrance, isInt } = C;
  const fresh = () => ({ version: 1, room: '08', run: 1, budget: budgetTable[0], checks: [], files: [], notes: [], adjusts: [], why: null, log: [], handover: null, ending: null, finished: false, palette: 'auto', player: { ...entrance } });
  const clone = s => ({ ...s, checks: s.checks.map(c => ({ ...c })), files: s.files.map(f => ({ ...f })), notes: s.notes.map(n => ({ ...n })), adjusts: s.adjusts.map(a => ({ ...a })), why: s.why && { ...s.why }, log: s.log.map(e => ({ ...e })), player: { ...s.player } });
  const inRun = (list, run) => list.filter(x => x.run === run);

  // The panel's setting once `run` has ended (or now, for the current run): the
  // last setting made by then, 0 when untouched or set back.
  const offsetAfter = (s, run) => s.adjusts.filter(a => a.run <= run).at(-1)?.n ?? 0;
  // Touches: settings above zero. Setting it back is not a touch.
  const touches = s => s.adjusts.filter(a => a.n > 0);
  // Off zero at any point in the run: carried in from before, or set during it.
  const touchedIn = (s, run) => offsetAfter(s, run - 1) > 0 || touches(s).some(a => a.run === run);
  // Watched runs: the first ones always, then only while trust is short of `awayAt`.
  const watched = (run, trust) => run <= keeper.watchedRuns || trust < keeper.awayAt;
  // What one run amounts to: the tally's view (tally, met) beside the truth
  // (correct, unchecked), and what a present Keeper saw.
  function record(s, run, present = presentAt(s, run)) {
    const files = inRun(s.files, run), offset = offsetAfter(s, run);
    const seen = present && touchedIn(s, run), tally = files.length + offset;
    return {
      run, present, seen, offset, tally, met: !seen && tally >= quota,
      filed: files.length, correct: files.filter(f => f.drawer === C.drawerOf(run, f.card)).length,
      unchecked: files.filter(f => !C.checked(s, f.card, run)).length,
      stray: present ? files.filter(f => f.drawer === spotDrawer && C.drawerOf(run, f.card) !== spotDrawer).length : 0
    };
  }
  // Trust when `run` starts: one for each earlier watched run the Keeper could
  // count. One pass, run by run, since each run's presence depends on the trust before it.
  function trustAt(s, run) {
    let trust = 0;
    for (let r = 1; r < run; r++) { const e = record(s, r, watched(r, trust)); if (e.present && e.met && !e.stray) trust++; }
    return trust;
  }
  const presentAt = (s, run) => watched(run, trustAt(s, run));
  const hasKey = (s, run = s.run) => trustAt(s, run) >= keeper.keyAt;
  const metRuns = s => s.log.filter(e => record(s, e.run).met).length;
  const endingFor = s => metRuns(s) >= openAt ? 'open' : 'closed';

  const live = s => !s.finished;
  const canCheck = (s, card) => live(s) && C.validCard(s.run, card) && !C.checked(s, card) && !C.filed(s, card) && s.budget >= C.checkCost(s, card);
  const canFile = (s, card, drawer) => live(s) && C.validCard(s.run, card) && !C.filed(s, card) && Object.hasOwn(drawers, drawer) && s.budget >= costs.file;
  const canNote = (s, kind) => live(s) && Object.hasOwn(kinds, kind) && !s.notes.some(n => n.kind === kind) && C.learned(s, kind) && s.budget >= costs.note;
  const canAdjust = (s, n) => live(s) && hasKey(s) && panelSettings.includes(n) && n !== offsetAfter(s, s.run);
  const canReset = s => live(s) && hasKey(s) && offsetAfter(s, s.run) > 0 && s.budget >= costs.reset;
  // Runs end by leaving (budget left) or by spending it all; the last run also
  // settles the handover, and only the last run may.
  const canEndRun = (s, reason, handover) => live(s) && ['left', 'budget'].includes(reason) && (reason === 'budget') === (s.budget === 0) &&
    (s.run === runCount ? handovers.includes(handover) : handover === undefined || handover === null);

  function step(s, action) {
    const next = clone(s), a = action || {};
    switch (a.type) {
      case 'Check': if (!canCheck(s, a.card)) return null; next.budget -= C.checkCost(s, a.card); next.checks.push({ run: s.run, card: a.card }); return next;
      case 'File': if (!canFile(s, a.card, a.drawer)) return null; next.budget -= costs.file; next.files.push({ run: s.run, card: a.card, drawer: a.drawer }); return next;
      case 'PostNote': if (!canNote(s, a.kind)) return null; next.budget -= costs.note; next.notes.push({ run: s.run, kind: a.kind }); return next;
      case 'AdjustTally': if (!canAdjust(s, a.n)) return null; next.adjusts.push({ run: s.run, n: a.n }); return next;
      case 'ResetPanel': if (!canReset(s)) return null; next.budget -= costs.reset; next.adjusts.push({ run: s.run, n: 0 }); return next;
      // Asking why is free and always answered; only the first time is recorded,
      // with how many touches came before it.
      case 'AskWhy': if (s.finished) return null; if (!s.why) next.why = { run: s.run, touches: touches(s).length }; return next;
      case 'EndRun': {
        if (!canEndRun(s, a.reason, a.handover)) return null;
        next.log.push({ run: s.run, budget: budgetTable[s.run - 1], spent: budgetTable[s.run - 1] - s.budget, end: a.reason });
        if (s.run === runCount) { next.finished = true; next.handover = a.handover; next.budget = 0; next.ending = endingFor(next); return next; }
        next.run = s.run + 1; next.budget = budgetTable[s.run]; next.player = { ...entrance };
        return next;
      }
      case 'SetPalette': if (!palettes.includes(a.palette)) return null; next.palette = a.palette; return next;
      default: return null;
    }
  }
  function advance(s, action) {
    const next = step(s, action);
    if (!next) throw new Error('That action is not available in this run.');
    return Object.assign(s, next);
  }

  const fail = message => { throw new Error(message); };
  const list = (v, check, message) => Array.isArray(v) && v.every(x => x && typeof x === 'object' && check(x)) ? v : fail(message);
  const unique = (items, key) => new Set(items.map(key)).size === items.length;
  // Rebuilds a save from untrusted JSON, copying only known fields and
  // rejecting anything the rules could not have produced.
  function validate(v) {
    if (!v || v.version !== 1 || v.room !== '08') fail('This is not a Room 08 save.');
    if (!isInt(v.run, 1, runCount) || typeof v.finished !== 'boolean' || (v.finished && v.run !== runCount)) fail('Invalid run.');
    if (!isInt(v.budget, 0, budgetTable[v.run - 1]) || (v.finished && v.budget !== 0)) fail('Invalid budget.');
    const done = v.run - 1 + (v.finished ? 1 : 0);
    const log = list(v.log, () => true, 'Invalid run log.').map((e, i) => {
      if (e.run !== i + 1 || e.budget !== budgetTable[i] || !isInt(e.spent, 0, e.budget) || !['left', 'budget'].includes(e.end) || (e.end === 'budget') !== (e.spent === e.budget)) fail('Invalid run log.');
      return { run: e.run, budget: e.budget, spent: e.spent, end: e.end };
    });
    if (log.length !== done) fail('Invalid run log.');
    const inPlay = r => isInt(r, 1, v.run);
    const checks = list(v.checks, c => inPlay(c.run) && C.validCard(c.run, c.card), 'Invalid checks.').map(c => ({ run: c.run, card: c.card }));
    const files = list(v.files, f => inPlay(f.run) && C.validCard(f.run, f.card) && Object.hasOwn(drawers, f.drawer), 'Invalid filings.').map(f => ({ run: f.run, card: f.card, drawer: f.drawer }));
    const notes = list(v.notes, n => inPlay(n.run) && Object.hasOwn(kinds, n.kind), 'Invalid notes.').map(n => ({ run: n.run, kind: n.kind }));
    const adjusts = list(v.adjusts, a => inPlay(a.run) && (a.n === 0 || panelSettings.includes(a.n)), 'Invalid panel.').map(a => ({ run: a.run, n: a.n }));
    if (!unique(checks, c => `${c.run}:${c.card}`) || !unique(files, f => `${f.run}:${f.card}`) || !unique(notes, n => n.kind)) fail('Invalid save lists.');
    const s = { version: 1, room: '08', run: v.run, budget: v.budget, checks, files, notes, adjusts, why: null, log, handover: null, ending: null, finished: v.finished, palette: 'auto', player: { ...entrance } };
    // A note needs a check of its kind by then.
    if (!notes.every(n => checks.some(c => c.run <= n.run && C.kindOf(c.run, c.card) === n.kind))) fail('Invalid notes.');
    // The panel, replayed in order: each setting needs the key that run and a
    // change; setting it back needs something to set back.
    adjusts.forEach((a, i) => {
      const before = adjusts[i - 1], prev = before ? before.n : 0;
      if ((before && before.run > a.run) || !hasKey(s, a.run) || a.n === prev || (a.n === 0 && prev === 0)) fail('Invalid panel.');
    });
    // Spending per run: checks (free for kinds noted earlier), filings, notes, resets.
    for (let run = 1; run <= v.run; run++) {
      const spent = run <= log.length ? log[run - 1].spent : budgetTable[run - 1] - v.budget;
      const cost = inRun(checks, run).reduce((sum, c) => sum + C.checkCost(s, c.card, run), 0) + inRun(files, run).length * costs.file +
        inRun(notes, run).length * costs.note + inRun(adjusts, run).filter(a => a.n === 0).length * costs.reset;
      if (spent !== cost) fail('Spending does not match the checks, filings, notes and panel.');
    }
    // Asking why: at most once, with the touches before it consistent with the panel's order.
    if (v.why !== null && v.why !== undefined) {
      const w = v.why, before = touches(s).filter(a => a.run < w.run).length, by = touches(s).filter(a => a.run <= w.run).length;
      if (!w || !inPlay(w.run) || !isInt(w.touches, before, by)) fail('Invalid question.');
      s.why = { run: w.run, touches: w.touches };
    }
    if (v.finished ? !handovers.includes(v.handover) || v.ending !== endingFor(s) : v.handover !== null || v.ending !== null) fail('Invalid ending.');
    s.handover = v.handover; s.ending = v.ending;
    s.palette = palettes.includes(v.palette) ? v.palette : fail('Invalid settings.');
    const p = v.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) fail('Invalid position.');
    s.player = { x: p.x, y: p.y };
    return s;
  }

  const api = { ...C, fresh, step, advance, validate, record, trustAt, presentAt, hasKey, offsetAfter, touchedIn, metRuns, endingFor, canCheck, canFile, canNote, canAdjust, canReset, canEndRun };
  root.AfterimageRoom08State = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
