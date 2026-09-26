// Text for errands (milestone 9): what pinning a note will do (the handoff
// dialog), what this run's errand did (the opening pin and the journal), and
// what the resident on it says when you talk to them. Rules live in
// errands-pinned-note-tables-and-helpers.js.
(function () {
  'use strict';
  const A = window.Afterimage, S = A.S;
  const name = id => S.residents[id].name, lampName = id => S.lamps[id].title.toLowerCase();
  const card = k => `“${S.noteText(S.foundNotes[k].parts)}”`;
  const allFound = state => S.foundNotes.every((_, k) => state.notes.some(n => n.found === k));
  // Why a note that would send a resident has nothing for them to do.
  const why = (e, state) => ({
    lit: `${name(e.id)} has no dark lamp left to light`,
    dark: e.id === 'wren' ? 'Wren can’t watch the door: the entrance lamp is dark' : 'Pell can’t search yet: no stacks lamp is lit',
    searched: allFound(state) ? 'Pell has found everything in the stacks' : 'Pell has searched the lit stacks; another stacks lamp would give Pell more to search',
    full: 'Pell can’t keep anything: the wall is full'
  })[e.why];

  // The pin dialog's line for a note: e is S.errandFor(state, pin, next run).
  A.errandPreview = function (e, state) {
    if (!e) return null;
    if (e.why) return why(e, state);
    const busy = `${name(e.id)} takes no answer then`;
    return e.lamp ? `Next run Juno lights the ${lampName(e.lamp)} for free; ${busy}`
      : e.found !== undefined ? `Next run Pell searches the ${S.foundNotes[e.found].stacks} stacks; ${busy}`
        : `Next run Wren waits at the door, so first talks are free; ${busy}`;
  };

  // What this run's errand did, for the opening pin and the journal; or, at the
  // opening only, why the pinned note sent nobody.
  A.errandReport = function (state, opening = false) {
    const e = S.errandThisRun(state);
    if (!e) { const idle = opening ? S.errandFor(state, state.pinned, state.run) : null; return idle?.why ? `[${why(idle, state)}.]` : null; }
    const busy = `${name(e.id)} takes no answer this run.`;
    if (e.lamp) return `Juno read it and lit the ${lampName(e.lamp)} before you came in. ${busy}`;
    if (e.found !== undefined) return `Pell read it and searched the ${S.foundNotes[e.found].stacks} stacks, and kept a card found there: ${card(e.found)}. It is on the wall now. ${busy}`;
    return `Wren read it and is waiting at the door: first talks cost nothing this run. ${busy}`;
  };

  // The first thing the resident on an errand says.
  A.errandTalkLine = function (id, state) {
    const e = S.errandThisRun(state);
    if (!e || e.id !== id) return null;
    if (e.lamp) return `“The ${lampName(e.lamp)} is on. Your note asked, so I lit it. It stays lit.”`;
    if (e.found !== undefined) return `“Found this in the ${S.foundNotes[e.found].stacks} stacks: ${card(e.found)}. Not your hand, I think. I put it on the wall.”`;
    return '“I’m keeping the door this run. Nobody pays to be known today.”';
  };

  // Journal lines: every card Pell has found, with what is known about it.
  A.foundLines = state => state.notes.filter(n => n.found !== undefined)
    .map(n => `FOUND / ${card(n.found)}, from the ${S.foundNotes[n.found].stacks} stacks in run ${A.pad(n.run)}. ${S.foundNotes[n.found].history}`);
})();
