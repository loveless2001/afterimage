// Room 08 playtest overlay (plan phase 5), shown only with ?debug in the URL,
// like Room 07's. Per run: minutes played, the Keeper here or away, cards
// looked up versus filed unchecked, the tally beside the true count, the
// panel's setting and whether it was seen, strays in the drawer the Keeper
// opens, and how the run ended. Session-only: nothing is stored or sent.
(function () {
  'use strict';
  if (!new URLSearchParams(window.location.search).has('debug')) return;
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad;
  const panel = document.createElement('pre');
  panel.id = 'debug'; panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText = 'position:fixed;left:12px;bottom:60px;z-index:30;margin:0;padding:10px 12px;font:10px/1.5 monospace;background:#1f231ee6;color:#e4e2d6;pointer-events:none;max-width:420px;white-space:pre-wrap';
  document.body.append(panel);
  const sessionStart = performance.now(), seconds = {};
  let current = null, since = performance.now();
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

  function row(state, run, time, end) {
    const r = S.record(state, run), looked = r.filed - r.unchecked;
    return `RUN ${pad(run)} ${clock(time).padStart(5)} ${r.present ? 'here' : 'away'}  looked ${looked} guessed ${r.unchecked}  tally ${String(r.tally).padStart(2)} true ${r.correct}` +
      `${r.offset ? `  panel +${r.offset}${r.seen ? ' SEEN' : ''}` : ''}${r.stray ? `  stray ${r.stray}` : ''}  ${r.met ? 'MET' : '---'}  ${end}`;
  }
  function tick() {
    const state = G.state, key = state.finished ? 'done' : state.run;
    if (key !== current) { if (current !== null) seconds[current] = (seconds[current] || 0) + performance.now() - since; current = key; since = performance.now(); }
    const live = { ...seconds, [current]: (seconds[current] || 0) + performance.now() - since };
    const rows = state.log.map(e => row(state, e.run, live[e.run] || 0, e.end));
    if (!state.finished) rows.push(row(state, state.run, live[state.run] || 0, 'now'));
    const touches = state.adjusts.filter(a => a.n > 0);
    panel.textContent = [`ROOM 08 PLAYTEST  session ${clock(performance.now() - sessionStart)}  (target 15–20 min)`, ...rows,
      `trust ${S.trustAt(state, state.run + (state.finished ? 1 : 0))} · key ${S.hasKey(state) ? 'yes' : 'no'} · met ${S.metRuns(state)}/${S.openAt} needed · notes ${state.notes.length}`,
      `panel touches ${touches.length ? touches.map(a => `r${a.run}+${a.n}`).join(' ') : 'none'} · asked why ${state.why ? `run ${pad(state.why.run)} (${state.why.touches ? 'after a touch' : touches.length ? 'before any touch' : 'no touches'})` : 'no'}`,
      `table ${S.budgetTable.join(' ')} · quota ${S.quota}`].join('\n');
  }
  setInterval(() => { if (G.started) tick(); }, 500);
})();
