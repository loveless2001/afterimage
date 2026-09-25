// Ending a run: the handoff pin (or, on the last run, the last entry), the
// fade between runs, the automatic end when the budget reaches zero (after
// the current dialog closes), and what the next run opens with.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;

  // The last run must choose an ending; earlier runs may pin a note first.
  A.endRun = function (reason) {
    const state = G.state;
    if (!S.canEndRun(state, reason)) return;
    if (state.run === S.runCount) return A.chooseLastEntry(reason);
    if (S.onWall(state).length) A.chooseHandoff(reason, pin => A.finishRun({ type: 'EndRun', reason, pin }));
    else A.finishRun({ type: 'EndRun', reason, pin: null });
  };

  // Applies a run-ending action (EndRun or Finish) behind a fade, then opens the
  // next run with its pinned note, or shows the ending.
  A.finishRun = function (action) {
    const before = G.state, next = S.step(before, action);
    if (!next) return;
    G.transitioning = true; // set first so closing the dialog cannot end the run twice
    A.closeDialog(); A.cue('runEnd');
    $('transition-title').textContent = `RUN ${pad(before.run)} ENDED`;
    $('transition-detail').textContent = next.finished ? 'The last entry is written.' : `Next: RUN ${pad(next.run)} · budget ${next.budget}`;
    $('transition').classList.add('on');
    setTimeout(() => { G.state = next; G.target = null; A.save(); A.updateHUD(); }, A.reducedMotion ? 0 : 650);
    setTimeout(() => {
      $('transition').classList.remove('on'); G.transitioning = false;
      if (next.finished) return A.showEnding();
      const turn = next.run === S.turnRun ? ' The lights are different tonight; the residents have gathered at the desk.' : '';
      A.toast(`Run ${pad(next.run)}. Budget ${next.budget}. The room kept ${next.lights.length} of ${Object.keys(S.lamps).length} lamps and ${S.onWall(next).length} notes.${turn}`);
      if (next.pinned !== null) A.showPinned(true);
    }, A.reducedMotion ? 30 : 1600);
  };

  // Called whenever a dialog closes: a spent budget ends the run then, never mid-dialog.
  A.endRunIfSpent = function () {
    if (G.started && !G.transitioning && !G.modalOpen && S.canEndRun(G.state, 'budget')) A.endRun('budget');
  };
})();
