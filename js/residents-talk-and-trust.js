// Talking to residents: confirms the cost of a first talk each run, applies
// the Talk rule (which may record trust), and picks the right authored lines.
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
    const met = S.hasMet(G.state, id), wasTrusted = S.isTrusted(G.state, id);
    S.advance(G.state, { type: 'Talk', resident: id }); A.save(); A.updateHUD();
    const state = G.state, wall = S.onWall(state), name = S.residents[id].name;
    const [title, lines] = A.residentLines[id]({
      first: !met, trusting: !wasTrusted && S.isTrusted(state, id), trusted: S.isTrusted(state, id),
      recognized: S.recognizes(state, id), turn: state.run >= S.turnRun, late: state.run >= 4,
      newest: wall.length ? S.noteText(state.notes[wall.at(-1)].parts) : null,
      allLamps: Object.keys(S.lamps).every(l => S.isLit(state, l))
    });
    const tail = state.budget === 0 ? ['[Budget spent. This run ends when you close this.]'] : [];
    dialog(met ? name.toUpperCase() : `A RESIDENT / ${name.toUpperCase()}`, title, [...lines, ...tail], [leave(`Leave ${name} be`)]);
  }
})();
