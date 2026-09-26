// Talking to residents: confirms the cost of a first talk each run, applies
// the Talk rule (which may record trust or an answer), and picks the right
// authored lines: first meeting, trust, then questions until all are answered.
// Resident positions change at the turn (they gather at the desk) and after
// the secret ending (they sit on the alcove bench).
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);
  const spots = {
    early: { wren: [380, 430], juno: [700, 470], pell: [290, 110] },
    turn: { wren: [560, 365], juno: [400, 250], pell: [560, 250] },
    alcove: { wren: [80, 440], juno: [140, 430], pell: [110, 470] }
  };
  A.residentSpot = (id, state) => spots[state.ending === 'alcove' ? 'alcove' : state.run >= S.turnRun ? 'turn' : 'early'][id];
  // Before you meet them, residents are described by what they are doing.
  const strangers = { wren: 'A resident with a pencil', juno: 'A resident polishing a lamp', pell: 'A resident, reading' };
  A.residentLabel = (id, state) => S.hasMet(state, id) ? S.residents[id].name : strangers[id];

  A.talkTo = function (id) {
    const state = G.state, name = S.residents[id].name;
    if (state.finished) return dialog(name.toUpperCase(), '“The runs are over.”', [A.residentClosing[state.ending]], [leave()]);
    if (S.talkedThisRun(state, id)) return talk(id);
    const met = S.hasMet(state, id);
    dialog(met ? name.toUpperCase() : 'A RESIDENT', met ? `Talk to ${name}?` : 'Talk to the resident?', [
      met ? `${name} ${S.residents[id].role}.` : 'Someone who lives in the room. They look up as you come near.',
      `[The first talk with each resident costs ${S.talkCost} per run. Talking again this run is free.]`
    ], [
      { label: 'Talk', primary: true, detail: `Costs ${S.talkCost} · budget left after: ${state.budget - S.talkCost}`, run: () => talk(id) },
      leave()
    ]);
  };

  function talk(id) {
    const met = S.hasMet(G.state, id), wasTrusted = S.isTrusted(G.state, id), answers = G.state.answers.length;
    S.advance(G.state, { type: 'Talk', resident: id }); A.save(); A.updateHUD();
    const state = G.state, wall = S.onWall(state), name = S.residents[id].name;
    const answer = state.answers.length > answers ? state.answers.at(-1) : null, trusting = !wasTrusted && S.isTrusted(state, id);
    // Once trusted, a resident talks about their questions until all are answered.
    const [title, lines] = wasTrusted && (answer || S.openQuestion(state, id) !== null) ? questionTalk(id, answer) : A.residentLines[id]({
      first: !met, trusting, trusted: S.isTrusted(state, id),
      recognized: S.recognizes(state, id), turn: state.run >= S.turnRun, late: state.run >= 4,
      newest: wall.length ? S.noteText(state.notes[wall.at(-1)].parts) : null,
      allLamps: Object.keys(S.lamps).every(l => S.isLit(state, l))
    });
    const tail = [...(trusting ? [`[${name} has a question for you now. Talk to ${name} again to hear it.]`] : []),
      ...(state.budget === 0 ? ['[Budget spent. This run ends when you close this.]'] : [])];
    dialog(met ? name.toUpperCase() : `A RESIDENT / ${name.toUpperCase()}`, title, [...lines, ...tail], [leave(`Leave ${name} be`)]);
  }

  // A trusted resident's side of the questions: the reply to the note that just
  // answered, or the open question and the kind of note that answers it.
  function questionTalk(id, answer) {
    const state = G.state, name = S.residents[id].name, q = S.openQuestion(state, id), word = w => `“${S.wordText(w)}”`;
    // Once the run has all its answers, nobody else's question can be answered.
    const full = S.answersThisRun(state) >= S.answersPerRun, fullLine = rest => `[This run has had its ${S.answersPerRun} answers. ${rest}]`;
    if (answer) {
      const [title, lines] = A.questionLines[id][answer.q].reply(S.noteText(state.notes[answer.note].parts));
      const othersWait = full && Object.keys(S.residents).some(r => r !== id && S.openQuestion(state, r) !== null && !S.answeredThisRun(state, r));
      return [title, [...lines, `[New word: ${word(S.questions[id][answer.q].teaches)}. It is in the note builder now.]`,
        q === null ? `[That was ${name}’s last question.]` : `[${name} has another question. It can be answered in a later run.]`,
        ...(othersWait ? [fullLine('Other questions wait for a later run.')] : [])]];
    }
    const { ask, why, form } = A.questionLines[id][q], open = S.canAnswerThisRun(state, id);
    const missing = (S.questions[id][q].needs || []).filter(([set, i]) => !S.wordAvailable(state, set, i));
    // A note from this run that answered nobody was posted, but does not fit.
    const tried = open && S.onWall(state).some(i => state.notes[i].run === state.run && !state.answers.some(a => a.note === i));
    return [ask, [why, ...(tried ? ['“That isn’t quite it. Not yet.”'] : []),
      open ? `[Answer with a note: ${form}. Post it at the notice hall this run, then talk to ${name} again.]`
        : S.answeredThisRun(state, id) ? '[One answer per resident each run. This one can be answered in a later run.]'
          : fullLine('This one can be answered in a later run.'),
      ...missing.map(w => `[You don’t know the word ${word(w)} yet. ${S.residents[S.teacherOf(...w).id].name} uses it.]`)]];
  }
})();
