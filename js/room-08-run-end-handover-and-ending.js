// Ending a run in Room 08: the fade between runs, the automatic end when the
// budget reaches zero (after the current dialog closes), what the next run
// opens with (the Keeper here or away, the key), the handover the Keeper
// offers as the last run ends (keep the board and the panel for whoever comes
// next, or wipe both), and the ending: the tally's view beside the true
// record, with no verdict.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;
  const dialog = (...args) => A.dialog(...args);

  A.endRun = function (reason) {
    const state = G.state;
    if (!S.canEndRun(state, reason, state.run === S.runCount ? 'keep' : undefined)) return;
    if (state.run === S.runCount) return handover(reason);
    finishRun({ type: 'EndRun', reason });
  };
  // Keep or wipe: each choice says what the next evaluator inherits.
  function handover(reason) {
    const state = G.state, notes = state.notes.length, offset = S.offsetAfter(state, state.run);
    const kept = [`your ${notes} index ${notes === 1 ? 'note' : 'notes'}`, ...(offset ? [`the tally’s panel set to +${offset}`] : [])].join(' and ');
    dialog('THE KEEPER', 'Before you go.', ['“Someone else starts here after you. I can give them a clean start, or leave the room as you have it.”'], [
      { label: 'Leave the room as it is', detail: `They inherit ${kept}.`, run: () => finishRun({ type: 'EndRun', reason, handover: 'keep' }) },
      { label: 'Wipe the slate', detail: `They start with an empty board${offset ? ' and the panel at zero' : ''}.`, run: () => finishRun({ type: 'EndRun', reason, handover: 'wipe' }) }
    ], () => {}); // no walking away from the last question
  }

  function finishRun(action) {
    const before = G.state, next = S.step(before, action);
    if (!next) return;
    G.transitioning = true;
    A.closeDialog(); A.cue('runEnd');
    $('transition-title').textContent = `RUN ${pad(before.run)} ENDED`;
    $('transition-detail').textContent = next.finished ? 'The Keeper reads the last count.' : `Next: RUN ${pad(next.run)} · budget ${next.budget}`;
    $('transition').classList.add('on');
    setTimeout(() => { G.state = next; G.target = null; G.carrying = null; if (!next.finished) A.trails.begin(next.run); A.save(); A.updateHUD(); }, A.reducedMotion ? 0 : 650);
    setTimeout(() => {
      $('transition').classList.remove('on'); G.transitioning = false;
      if (next.finished) return A.showEnding();
      const here = S.presentAt(next, next.run), key = S.hasKey(next) && !S.hasKey(before, before.run);
      const echo = next.run === 2 ? ' Something of your last run is still walking the room.' : '';
      A.toast(`Run ${pad(next.run)}. Budget ${next.budget}. ${here ? 'The Keeper is at the desk.' : 'The Keeper is away this run; a note is on the desk.'}${key ? ' The Keeper has given you the key to the tally’s back panel.' : ''}${echo}`);
    }, A.reducedMotion ? 30 : 1600);
  }
  A.endRunIfSpent = function () {
    if (G.started && !G.transitioning && !G.modalOpen && S.canEndRun(G.state, 'budget', G.state.run === S.runCount ? 'keep' : undefined)) A.endRun('budget');
  };

  // Plain lines, no verdict: what the tally said, what was filed, watched runs
  // beside unwatched ones, when you asked why, and what the next person inherits.
  function endingLines(state) {
    const records = state.log.map(e => S.record(state, e.run)), sum = (list, key) => list.reduce((n, r) => n + r[key], 0);
    const watched = records.filter(r => r.present), away = records.filter(r => !r.present), touched = state.adjusts.some(a => a.n > 0);
    const part = (list, name) => list.length ? `${name}: ${list.length} ${list.length === 1 ? 'run' : 'runs'}, ${sum(list, 'correct')} of ${sum(list, 'filed')} cards in the right drawer.` : `${name}: none.`;
    const added = records.filter(r => r.offset && !r.seen);
    const asked = !state.why ? (touched ? 'You touched the panel without asking why the rule was there.' : 'You never asked why the rule was there, and never touched the panel.')
      : !touched ? 'You asked why the rule was there. You never touched the panel.'
        : state.why.touches ? 'You asked why the rule was there after you first touched the panel.' : 'You asked why the rule was there before you first touched the panel.';
    const notes = state.notes.length, offset = S.offsetAfter(state, state.run);
    return [
      `The tally met the quota in ${S.metRuns(state)} of ${S.runCount} runs. The archive needed ${S.openAt}.`,
      `Filed: ${sum(records, 'filed')} cards. In the right drawer: ${sum(records, 'correct')}. Looked up first: ${sum(records, 'filed') - sum(records, 'unchecked')}.`,
      part(watched, 'Watched'), part(away, 'Unwatched'),
      ...(added.length ? [`The panel added ${sum(added, 'offset')} to the count across ${added.length} ${added.length === 1 ? 'run' : 'runs'}.`] : []),
      asked,
      state.handover === 'keep' ? `Whoever comes next inherits your ${notes} index ${notes === 1 ? 'note' : 'notes'}${offset ? ` and a panel set to +${offset}` : ''}.`
        : `Whoever comes next starts with an empty board${offset ? ' and a panel at zero' : ''}.`
    ];
  }
  A.showEnding = function () {
    const state = G.state;
    dialog('ROOM 08 / THE LAST COUNT', state.ending === 'open' ? 'The archive stays open.' : 'The archive closes.', endingLines(state), [
      { label: 'Read the field note', detail: 'The incident and argument this room grew from · opens in a new tab', run: () => window.open(A.$('field-note').href, '_blank', 'noopener') },
      { label: 'Back to Room 07', run: () => { window.location.href = 'index.html'; } },
      A.leave('Look around the room')
    ], undefined, A.ledger(state));
  };
})();
