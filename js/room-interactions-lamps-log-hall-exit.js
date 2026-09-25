// What happens when the player uses something in the room: lamps (spend
// budget, stay lit), the run log at the desk (free to read; from the turn it
// also holds the last entry), the exit (ends the run early), and hand-offs to
// the notes, residents and endings modules.
// interact(id) is the single entry point from the keyboard, button and tests.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label), pad = A.pad;

  A.interact = function (id) {
    if (G.modalOpen || G.transitioning || !G.started) return;
    const object = A.roomObjects().find(o => o.id === id);
    if (!object) return;
    if (object.type === 'lamp') return useLamp(object);
    if (object.type === 'resident') return A.talkTo(object.resident);
    if (id === 'bench') return A.visitBench();
    if (id === 'log') return readLog();
    if (id === 'hall') return A.openNoticeHall();
    if (id === 'pin') return A.showPinned();
    if (id === 'exit') return useExit();
  };

  function useLamp(object) {
    const state = G.state, lamp = S.lamps[object.lamp], speaker = 'LAMP / ' + lamp.title.toUpperCase();
    const lit = state.lights.find(l => l.id === object.lamp);
    if (lit) return dialog(speaker, 'The lamp is on.', [lit.run === state.run ? 'You switched it on during this run.' : `It has been on since run ${pad(lit.run)}. The room kept it.`], [leave()]);
    if (state.finished) return dialog(speaker, 'The runs are over.', ['The switch no longer responds.'], [leave()]);
    const affordable = S.canLight(state, object.lamp);
    dialog(speaker, 'Switch on the lamp?', ['The lamp is dark. Once it is on, it stays on in every later run.', `[Costs ${lamp.cost} of your ${state.budget} remaining this run.]`], [
      { label: 'Switch it on', primary: true, disabled: !affordable,
        detail: affordable ? `Costs ${lamp.cost} · stays lit in every later run` : `Not enough budget this run (need ${lamp.cost}, have ${state.budget}).`,
        run: () => {
          S.advance(G.state, { type: 'Light', lamp: object.lamp }); A.save(); A.updateHUD(); A.playNotes();
          dialog(speaker, 'Light.', ['The corner is easier to read now.', G.state.budget === 0 ? '[Budget spent. This run ends when you close this.]' : `[The room keeps this light. Budget left this run: ${G.state.budget}.]`], [leave('Continue')]);
        } },
      leave('Leave it dark')
    ]);
  }

  // The desk keeps a record of every run: its budget, what was spent, how it ended.
  function readLog() {
    const state = G.state;
    const posted = run => { const n = state.notes.filter(note => note.run === run).length; return n ? ` · ${n} ${n === 1 ? 'note' : 'notes'}` : ''; };
    const lines = state.log.map(e => `RUN ${pad(e.run)} · budget ${e.budget} · spent ${e.spent}${posted(e.run)} · ${e.end === 'budget' ? 'ran out' : 'left through the exit'}`);
    if (!state.finished) lines.push(`RUN ${pad(state.run)} · budget ${S.budgetTable[state.run - 1]} · ${state.budget} left${posted(state.run)} · in progress`);
    if (!state.log.length) lines.unshift('This is the first run. Nothing earlier is recorded.');
    lines.push(`[${state.lights.length} of ${Object.keys(S.lamps).length} lamps are on. Reading the log is free.]`);
    const lastEntry = !state.finished && state.run >= S.turnRun;
    dialog('RUN LOG / ROOM 07', 'What each run did.', lines, [
      ...(lastEntry ? [{ label: 'Write the last entry', primary: true, detail: 'Choose what the room keeps. This ends the runs.', run: () => A.chooseLastEntry() }] : []),
      ...(state.finished ? [{ label: 'Read the ending again', run: A.showEnding }] : []),
      leave()
    ]);
  }

  function useExit() {
    const state = G.state;
    if (state.finished) return A.showEnding();
    const last = state.run === S.runCount;
    dialog('THE EXIT', `Leave run ${pad(state.run)}?`, [
      `Leaving ends this run now. The ${state.budget} budget you have left is lost. The room keeps its lamps and notes.`,
      last ? 'This is the last run.' : `Run ${pad(state.run + 1)} starts at the entrance with a budget of ${S.budgetTable[state.run]}.`
    ], [
      { label: 'Leave now', primary: true, detail: last ? 'End the final run.' : `End run ${pad(state.run)}.`, run: () => A.endRun('left') },
      leave('Stay')
    ]);
  }
})();
