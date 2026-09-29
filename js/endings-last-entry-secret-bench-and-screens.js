// Endings: from the turn (run 6) the run log offers "the last entry", which
// decides what the room keeps; the last run asks for it as it ends. The alcove
// bench holds the secret ending. Every ending can be revisited. None is scored.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);
  const choices = { record: 'Keep the record', lights: 'Keep the lights', wall: 'Keep the wall' };
  const trusted = id => S.isTrusted(G.state, id);

  // reason: undefined from the desk (Finish), or 'left'/'budget' as the last run ends.
  A.chooseLastEntry = function (reason) {
    const state = G.state, ending = id => reason ? { type: 'EndRun', reason, ending: id } : { type: 'Finish', ending: id };
    // A spent last run cannot be escaped; say so rather than silently staying put.
    const back = reason === 'budget' ? () => { A.chooseLastEntry(reason); A.toast('This run has ended. Choose what the room keeps to finish.'); } : A.closeDialog;
    dialog('RUN LOG / THE LAST ENTRY', 'What should the room keep?', [
      reason ? 'This is the last run. Before it ends, write the last entry.' : 'Writing the last entry ends the runs, here and now.',
      '[You can revisit this choice afterwards. Nothing is scored.]'
    ], [
      ...Object.keys(choices).map(id => ({ label: choices[id], disabled: !S.endingAvailable(state, id),
        detail: S.endingAvailable(state, id) ? endingPromise(id) : S.endings[id].need, run: () => confirm(id, ending(id), back) })),
      ...(reason === 'budget' ? [] : [leave(reason ? 'Stay in this run' : 'Not yet')])
    ], back);
  };
  function endingPromise(id) {
    return { record: 'The log keeps every run, in order.', lights: 'Every lamp stays lit for whoever comes next.', wall: 'The notes stay up as one long conversation.', alcove: '' }[id];
  }
  function confirm(id, action, back) {
    dialog('THE LAST ENTRY', `${choices[id] || 'Stay'}?`, [endingPromise(id), 'This ends the runs. You can revisit the choice from the ending screen or the menu.'], [
      { label: 'Write it', primary: true, run: () => A.finishRun(action) },
      { label: 'Go back', run: back }
    ], back);
  }

  // The alcove bench: neutral until everyone trusts you and the right note is up.
  A.visitBench = function () {
    const state = G.state;
    if (!state.benchSeen) { S.advance(state, { type: 'VisitBench' }); A.save(); }
    if (state.ending === 'alcove') return A.showEnding();
    if (!S.endingAvailable(state, 'alcove')) {
      const who = Object.keys(S.residents).filter(trusted).length;
      return dialog('A QUIET CORNER', 'A bench, just big enough for four.', [
        'Nobody sits here. The cushions are straight, as if someone expects company.',
        who ? `[${who} of 3 residents trust you.]` : '[Reading this corner is free.]'
      ], [leave()]);
    }
    dialog('A QUIET CORNER', 'Three residents are waiting on the bench.', [
      'Wren, Juno and Pell have moved up to make room. Someone has pinned “wait · together” above the bench.',
      'If you sit down, the runs stop here.'
    ], [
      { label: 'Sit with them', primary: true, detail: 'Ends the runs. You can revisit this.', run: () => A.finishRun({ type: 'Finish', ending: 'alcove' }) },
      leave('Not yet')
    ]);
  };

  // fresh (true only as the runs end) plays the whole sequence: text, picture,
  // reveal. Coming back to an ending (a reloaded save, the log, the bench)
  // offers the picture again instead of playing it.
  A.showEnding = function (fresh) {
    A.unlock('room08'); // any ending, played or imported, opens the next room
    const state = G.state, e = S.endings[state.ending], quote = i => `“${S.noteText(state.notes[i].parts)}”`, wall = S.onWall(state);
    // Each resident's latest answer, and the wall from its oldest card to its newest.
    const answers = Object.keys(S.residents).map(id => state.answers.filter(a => a.id === id).at(-1)).filter(Boolean).map(a => quote(a.note));
    const kept = answers.length ? [`What you told them stays too: ${answers.join(', ')}.`] : [];
    // Every ending's text is built below, so this must not assume notes on the wall.
    const span = wall.length ? `, from ${quote(wall[0])} to ${quote(wall.at(-1))}` : '';
    const text = {
      record: ['Wren closes the log. Every run is there, in order: what each one spent and how it ended.', trusted('wren') ? 'On the last line, Wren writes a note about you, the way you once wrote one about her.' : 'Nobody here will remember you. The book will.', 'The desk lamp stays on over the closed log.'],
      lights: ['You leave every lamp burning.', trusted('juno') ? 'Juno walks the room once, touching each lamp as if to check it is real.' : 'Whoever comes next will start in a lit room.', 'They will not know who switched the lamps on. They will know someone did.'],
      wall: [`${wall.length} cards stay on the wall${span}. None of them is signed.`, trusted('pell') ? 'Pell reads them aloud from the first slot to the last. It sounds like one long conversation.' : 'Read together, they sound like one long conversation with yourself.', 'The next reader will add to it.'],
      alcove: ['You sit down. Wren, Juno and Pell move up to make room.', 'Nobody opens the exit. Nobody counts the budget.', 'For the first time, a run does not end. It just goes quiet.']
    }[state.ending];
    // The ending's text, then every run at once as a long exposure, then the reveal card.
    const spent = state.log.reduce((sum, r) => sum + r.spent, 0), now = new Date(), today = `${now.getDate()} ${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[now.getMonth()]} ${now.getFullYear()}`;
    const picture = () => { A.closeDialog(); A.longExposure.play({ eyebrow: `ENDING ${e.letter} · ${e.title.toUpperCase()}`, title: endingTitle(state.ending),
      detail: `${state.log.length} runs · ${spent} budget spent · ${today}`, file: `${A.room.exportName}-ending-${e.letter.toLowerCase()}.png`, done: revealCard }); };
    const first = fresh === true;
    dialog(`ENDING ${e.letter} / ${e.title.toUpperCase()}`, endingTitle(state.ending), [...text, ...kept, `[Ending ${e.letter} of 4. Runs played: ${state.log.length}. Nothing is scored.]`],
      first ? [{ label: 'Continue', primary: true, run: picture }] : [{ label: 'See every run again', primary: true, detail: 'The picture of all your runs, then the card after it', run: picture }, leave('Remain in the room')],
      first ? picture : A.closeDialog);
  };
  // After the picture, the one card outside the fiction: the cover's question,
  // answered plainly, and where the room came from. Escape remains in the room.
  const inWords = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] || String(n);
  function revealCard() {
    dialog('AFTER THE LAST RUN', 'Who sent them?', [
      'Nobody in the room finds out. Outside it, the answer is ordinary.',
      'Work that starts from nothing every run. A small budget each time. Nothing carried over but what was written down, lit, or left on a wall. Workers who finish the task without ever learning who it was for.',
      `That is how AI agents work today. For ${inWords(G.state.log.length)} runs, so did you.`,
      'AFTERIMAGE grew from a real incident, and an argument about what such agents learn. The field note tells it.'
    ], [
      // The same field note the title screen links to, in a new tab so the room stays open.
      { label: 'Read the field note', primary: true, detail: 'The agent learned the judge · opens in a new tab', run: () => window.open(A.$('field-note').href, '_blank', 'noopener') },
      ...(A.unlocked('room08') ? [{ label: 'Another room is open', detail: 'Room 08 · the evaluation room', run: () => { A.save(); window.location.href = 'room-08.html'; } }] : []),
      { label: 'Remain in the room', run: A.closeDialog },
      { label: 'Revisit the choice', detail: A.revisitDetail(), run: A.revisitEnding },
      { label: 'Export this save', run: A.exportSave }
    ]);
  }
  const endingTitle = id => ({ record: 'Everything, in order.', lights: 'A lit room.', wall: 'One long conversation.', alcove: 'Still here.' })[id];

  // Revisit is a rewind, not a replay: say where it lands and what it keeps.
  A.revisitDetail = function () {
    const t = S.revisitTarget(G.state);
    return `Rewinds to run ${pad(t.run)} ${t.budget ? `with ${t.budget} budget left` : 'with its budget spent'}. Lamps and notes stay; only the last entry is erased.`;
  };

  // Undo the ending: back into the run it was chosen in.
  A.revisitEnding = function () {
    S.advance(G.state, { type: 'Revisit' }); G.target = null; A.save(); A.closeDialog();
    A.toast(`Back in run ${pad(G.state.run)}. The last entry is unwritten.`);
  };
})();
