// Game rules as one pure transition function, plus strict validation for
// browser saves and imported files. step(state, action) returns the next
// state or null when the action is not allowed; nothing else changes game
// state. Shared by the browser (window.AfterimageState) and the Node tests.
(function (root) {
  'use strict';
  // Budget per run, authored rather than random so every playthrough is the
  // same length. Provisional: tune after the first playtest (design §12a).
  const budgetTable = [10, 6, 12, 7, 14, 9, 12];
  const runCount = budgetTable.length;
  // Lamps stay lit in every later run. They are the budget sink until notes arrive.
  const lamps = {
    entrance: { title: 'Entrance lamp', cost: 1 },
    west: { title: 'West stacks lamp', cost: 2 },
    east: { title: 'East stacks lamp', cost: 2 },
    hall: { title: 'Notice hall lamp', cost: 3 }
  };
  const lampKeys = Object.keys(lamps);
  const endReasons = ['left', 'budget'];
  const entrance = { x: 450, y: 590 };
  const fresh = () => ({ version: 2, run: 1, budget: budgetTable[0], lights: [], log: [], finished: false, player: { ...entrance } });
  // Copies nested values so a transition never shares them with its input.
  const clone = s => ({ ...s, lights: s.lights.map(l => ({ ...l })), log: s.log.map(e => ({ ...e })), player: { ...s.player } });
  const isLit = (s, id) => s.lights.some(l => l.id === id);
  const lampCost = id => Object.hasOwn(lamps, id) ? lamps[id].cost : Infinity;

  function canLight(s, id) {
    return !s.finished && Object.hasOwn(lamps, id) && !isLit(s, id) && s.budget >= lamps[id].cost;
  }
  // A run ends by leaving (budget left over) or by spending the whole budget.
  function canEndRun(s, reason) {
    return !s.finished && endReasons.includes(reason) && (reason === 'budget') === (s.budget === 0);
  }

  function step(s, action) {
    const next = clone(s);
    switch (action && action.type) {
      case 'Light':
        if (!canLight(s, action.lamp)) return null;
        next.lights.push({ id: action.lamp, run: s.run }); next.budget = s.budget - lamps[action.lamp].cost;
        return next;
      case 'EndRun': {
        if (!canEndRun(s, action.reason)) return null;
        const start = budgetTable[s.run - 1];
        next.log.push({ run: s.run, budget: start, spent: start - s.budget, end: action.reason });
        if (s.run === runCount) { next.finished = true; next.budget = 0; return next; }
        next.run = s.run + 1; next.budget = budgetTable[s.run]; next.player = { ...entrance };
        return next;
      }
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
  const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  // Rebuilds a save from untrusted JSON, copying only known fields and
  // rejecting impossible combinations (spending that no lamp explains, etc.).
  function validate(v) {
    if (!v || v.version !== 2) fail('This is not an AFTERIMAGE v2 save.');
    if (!isInt(v.run, 1, runCount) || typeof v.finished !== 'boolean') fail('Invalid run.');
    if (!isInt(v.budget, 0, budgetTable[v.run - 1])) fail('Invalid budget.');
    if (v.finished && (v.run !== runCount || v.budget !== 0)) fail('Invalid final run.');
    if (!Array.isArray(v.log) || v.log.length !== v.run - 1 + (v.finished ? 1 : 0)) fail('Invalid run log.');
    const log = v.log.map((e, i) => {
      if (!e || e.run !== i + 1 || e.budget !== budgetTable[i] || !isInt(e.spent, 0, e.budget) || !endReasons.includes(e.end) ||
        (e.end === 'budget') !== (e.spent === e.budget)) fail('Invalid run log.');
      return { run: e.run, budget: e.budget, spent: e.spent, end: e.end };
    });
    if (!Array.isArray(v.lights)) fail('Invalid lights.');
    const lights = v.lights.map(l => {
      if (!l || !lampKeys.includes(l.id) || !isInt(l.run, 1, v.run)) fail('Invalid lights.');
      return { id: l.id, run: l.run };
    });
    if (new Set(lights.map(l => l.id)).size !== lights.length) fail('Invalid lights.');
    // Only lamps spend budget, so each run's spending must match its lamps.
    for (let run = 1; run <= v.run; run++) {
      const spent = run <= log.length ? log[run - 1].spent : budgetTable[run - 1] - v.budget;
      if (spent !== lights.filter(l => l.run === run).reduce((sum, l) => sum + lampCost(l.id), 0)) fail('Spending does not match the lit lamps.');
    }
    const p = v.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) fail('Invalid position.');
    return { version: 2, run: v.run, budget: v.budget, lights, log, finished: v.finished, player: { x: p.x, y: p.y } };
  }

  const api = { budgetTable, runCount, lamps, entrance, fresh, step, advance, canLight, canEndRun, isLit, validate };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
