// Ending a run: the fade between runs, the automatic end when the budget
// reaches zero (after the current dialog closes), and the screen shown once
// the last run is over.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;

  // Fade out, swap in the next run's state, fade back in, announce it.
  A.endRun = function (reason) {
    const before = G.state, next = S.step(before, { type: 'EndRun', reason });
    if (!next) return;
    G.transitioning = true; // set first so closing the dialog cannot end the run twice
    A.closeDialog();
    $('transition-title').textContent = `RUN ${pad(before.run)} ENDED`;
    $('transition-detail').textContent = next.finished ? 'That was the last run.' : `Next: RUN ${pad(next.run)} · budget ${next.budget}`;
    $('transition').classList.add('on');
    setTimeout(() => { G.state = next; G.target = null; A.save(); A.updateHUD(); }, A.reducedMotion ? 0 : 650);
    setTimeout(() => {
      $('transition').classList.remove('on'); G.transitioning = false;
      if (next.finished) A.showFinished();
      else A.toast(`Run ${pad(next.run)}. Budget ${next.budget}. The room kept ${next.lights.length} of ${Object.keys(S.lamps).length} lamps.`);
    }, A.reducedMotion ? 30 : 1600);
  };

  // Called whenever a dialog closes: a spent budget ends the run then, never mid-dialog.
  A.endRunIfSpent = function () {
    if (G.started && !G.transitioning && !G.modalOpen && S.canEndRun(G.state, 'budget')) A.endRun('budget');
  };

  A.showFinished = function () {
    const state = G.state, left = state.log.filter(e => e.end === 'left').length;
    A.dialog(`RUN ${pad(state.run)} / THE LAST RUN`, 'Seven runs.', [
      `The room kept ${state.lights.length} of ${Object.keys(S.lamps).length} lamps.`,
      `${left} ${left === 1 ? 'run' : 'runs'} ended at the exit; ${state.log.length - left} ran out of budget.`,
      '[End of this prototype. Notes, residents and endings arrive in later builds. Nothing is scored.]'
    ], [
      { label: 'Look around the room', primary: true, run: A.closeDialog },
      { label: 'Read the run log', run: () => { A.closeDialog(); A.interact('log'); } },
      { label: 'Export this save', run: A.exportSave }
    ]);
  };
})();
