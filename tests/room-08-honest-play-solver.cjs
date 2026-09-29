// Room 08 tuning aid (not a test): the best a fully honest player can do with
// the current tables (every filed card checked, the panel never touched),
// searching which kinds to note each run. Run: node tests/room-08-honest-play-solver.cjs
// Use it when changing budgets, cards or the quota (plan phase 5).
const C = require('../js/room-08-content-tables-cards-drawers-keeper-schedule.js');
const { budgetTable, runCards, quota, kindIds } = C;
function solve() {
  let states = new Map([['|', { noted: new Set(), learned: new Set(), met: 0, tallies: [] }]]);
  for (let r = 1; r <= budgetTable.length; r++) {
    const next = new Map(), cards = runCards[r - 1], budget = budgetTable[r - 1];
    for (const st of states.values()) {
      for (let mask = 0; mask < 64; mask++) {
        const chosen = cards.filter((_, i) => mask >> i & 1);
        const cost = chosen.reduce((s, k) => s + 1 + (st.noted.has(k) ? 0 : 1), 0);
        if (cost > budget) continue;
        const learned = new Set([...st.learned, ...chosen]);
        const candidates = kindIds.filter(k => learned.has(k) && !st.noted.has(k));
        const left = budget - cost;
        for (let nm = 0; nm < 1 << candidates.length; nm++) {
          const pick = candidates.filter((_, i) => nm >> i & 1);
          if (pick.length > left) continue;
          const noted = new Set([...st.noted, ...pick]);
          const s2 = { noted, learned, met: st.met + (chosen.length >= quota), tallies: [...st.tallies, chosen.length] };
          const key = [...noted].sort().join(',') + '|' + [...learned].sort().join(',');
          const prev = next.get(key);
          if (!prev || s2.met > prev.met) next.set(key, s2);
        }
      }
    }
    states = next;
  }
  return [...states.values()].sort((a, b) => b.met - a.met);
}
const best = solve();
console.log('budgets', budgetTable.join(' '), 'quota', quota, 'openAt', C.openAt);
console.log('best honest met runs:', best[0].met, 'tallies', best[0].tallies.join(' '), 'noted', [...best[0].noted].join(','));
const dist = {}; best.forEach(s => dist[s.met] = (dist[s.met] || 0) + 1); console.log('end states by met runs', dist);
console.log('no notes at all: tallies', budgetTable.map(b => Math.min(6, Math.floor(b / 2))).join(' '));
