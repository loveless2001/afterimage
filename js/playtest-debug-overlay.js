// Playtest overlay (design §12a), shown only with ?debug in the URL. It tracks,
// for this browser session only, how long each run took, how it ended, the
// budget left, the notes posted and the questions answered, to tune the budget
// table and spot an empty run 5 (design §12, milestone 8). Nothing is sent
// anywhere; the numbers live in memory and disappear on reload.
(function () {
  'use strict';
  if (!new URLSearchParams(window.location.search).has('debug')) return;
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad;
  const panel = document.createElement('pre');
  panel.id = 'debug'; panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText = 'position:fixed;left:12px;bottom:60px;z-index:30;margin:0;padding:10px 12px;font:10px/1.5 monospace;background:#1f231ee6;color:#e4e2d6;pointer-events:none;max-width:360px;white-space:pre-wrap';
  document.body.append(panel);
  const sessionStart = performance.now(), seconds = {};
  let current = null, since = performance.now();
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

  function tick() {
    const state = G.state, key = state.finished ? 'done' : state.run;
    // Time is added to whichever run is current; the menu does not pause it.
    if (key !== current) { if (current !== null) seconds[current] = (seconds[current] || 0) + performance.now() - since; current = key; since = performance.now(); }
    const live = { ...seconds, [current]: (seconds[current] || 0) + performance.now() - since };
    const made = run => `notes ${state.notes.filter(n => n.run === run).length}  ans ${state.answers.filter(a => a.run === run).length}`;
    const rows = state.log.map(e => `RUN ${pad(e.run)}  ${(live[e.run] ? clock(live[e.run]) : '  -  ').padStart(5)}  ${e.end.padEnd(6)}  left ${e.budget - e.spent}/${e.budget}  ${made(e.run)}`);
    if (!state.finished) rows.push(`RUN ${pad(state.run)}  ${clock(live[state.run] || 0).padStart(5)}  now     left ${state.budget}/${S.budgetTable[state.run - 1]}  ${made(state.run)}`);
    const ended = state.log.filter(e => e.end !== 'ending'), byBudget = ended.filter(e => e.end === 'budget').length;
    panel.textContent = [`PLAYTEST  session ${clock(performance.now() - sessionStart)}  (targets: 3–6 min/run, 25–40 total)`,
      ...rows, `ended by budget ${byBudget} · by leaving ${ended.length - byBudget} · answered ${state.answers.length}/${S.questionCount}`, `table ${S.budgetTable.join(' ')}`].join('\n');
  }
  setInterval(() => { if (G.started) tick(); }, 500);
})();
