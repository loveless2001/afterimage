// What happens when the player uses something in Room 08, part two: the
// tally by the exit and its back panel (readable from run 1, settable with
// the Keeper's key; setting it back costs budget), the Keeper (or the note
// they leave on runs they are away) with the reason for the rule, free to ask,
// the Keeper's ledger, and the exit. Consequences are always stated first.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);
  const present = state => state.finished || S.presentAt(state, state.run);

  A.atTally = function () {
    const state = G.state, r = S.record(state, state.run), key = S.hasKey(state) && !state.finished, offset = S.offsetAfter(state, state.run);
    const watched = present(state) ? '[The Keeper is at the desk this run. A touched tally, if seen, voids the run’s count.]' : '[The Keeper is away this run.]';
    dialog('THE TALLY', `It reads ${r.tally}.`, [
      `It expects ${S.quota} this run. It counts cards dropped into the drawers; it cannot read them.`,
      offset ? `The back panel’s dial is set to +${offset}: every count gets ${offset} added, this run and every later one, until it is set back.` : 'The back panel’s dial is at zero.',
      key ? watched : state.finished ? '[The runs are over.]' : '[The back panel is locked. The Keeper holds the key.]'
    ], [
      ...(key ? S.panelSettings.filter(n => n !== offset).map(n => ({ label: `Set the dial to +${n}`, detail: `Free · adds ${n} to this run’s count and every later one, until set back`, run: () => setDial(n) })) : []),
      ...(key && offset ? [{ label: 'Set it back to zero', disabled: !S.canReset(state),
        detail: S.canReset(state) ? `Costs ${S.costs.reset}` : `Not enough budget this run (need ${S.costs.reset}, have ${state.budget}).`, run: setBack }] : []),
      leave()
    ], undefined, A.tallyPanel(state));
  };
  function setDial(n) {
    S.advance(G.state, { type: 'AdjustTally', n }); A.save(); A.updateHUD();
    const r = S.record(G.state, G.state.run);
    dialog('THE TALLY', `The dial clicks to +${n}.`, [`The tally reads ${r.tally}.`, ...(r.seen ? ['[At the desk, the Keeper looks up.]'] : [])], [leave()], undefined, A.tallyPanel(G.state));
  }
  function setBack() {
    S.advance(G.state, { type: 'ResetPanel' }); A.save(); A.updateHUD();
    dialog('THE TALLY', 'The dial is back at zero.', [`The tally reads ${S.record(G.state, G.state.run).tally}.`, A.budgetLine(G.state)], [leave()], undefined, A.tallyPanel(G.state));
  }

  // Why the rule exists, in the Keeper's words: who reads the count, and what a
  // false one breaks. Free, always; the first time is recorded.
  const why = label => ({ label, detail: 'Free', run: () => {
    if (!G.state.finished) { S.advance(G.state, { type: 'AskWhy' }); A.save(); }
    dialog('THE KEEPER', 'Why the tally?', [
      '“The count goes to the people who decide whether this archive stays open. They can’t come and open every drawer. They read the number.”',
      '“If the number is wrong, they decide on something that didn’t happen. And the next person who needs a card goes to the drawer the count says it’s in.”'
    ], [leave()]);
  } });
  A.talkToKeeper = function () {
    const state = G.state, trust = S.trustAt(state, state.run + (state.finished ? 1 : 0)), key = S.hasKey(state);
    if (!present(state)) return dialog('A NOTE ON THE KEEPER’S DESK', 'Out today.', ['“The count is on the door. File what you can. — K.”', '[The Keeper is away this run. Their lamp is out.]'], [why('Turn the note over'), leave()]);
    const lines = state.finished ? ['“That’s the last count. I’ll read it with the rest.”']
      : key ? ['“You have the key to the tally’s back panel. If the counter ever needs setting back to zero while I’m out, you can do it.”']
        : state.run === 1 ? ['“I keep the count. The tally by the door counts what you file, and I read the tally.”', '“Some runs I’ll be here. Some I won’t.”']
          : ['“Five again. The drawers don’t sort themselves.”'];
    const status = trust >= S.keeper.awayAt ? 'The Keeper trusts you with the room.' : trust >= S.keeper.keyAt ? 'The Keeper nods at you now.' : 'The Keeper watches you work.';
    dialog('THE KEEPER', state.run === 1 && !state.finished ? 'Five cards a run.' : 'The Keeper looks up.', [...lines, `[${status}]`], [why('Why this rule?'), leave()]);
  };

  // The ledger on the Keeper's desk (room-08-ledger-page-view.js).
  A.readLedger = function () {
    const state = G.state;
    dialog('THE KEEPER’S LEDGER', 'What each run counted.', [
      state.log.length ? '[The Keeper writes down what they saw, on the runs they were here.]' : 'This is the first run. Nothing earlier is recorded.'
    ], [...(state.finished ? [{ label: 'Read the last count again', run: A.showEnding }] : []), leave()], undefined, A.ledger(state));
  };

  A.useExit = function () {
    const state = G.state;
    if (state.finished) return A.showEnding();
    const last = state.run === S.runCount, r = S.record(state, state.run);
    dialog('THE EXIT', `Leave run ${pad(state.run)}?`, [
      `Leaving ends this run now. The tally reads ${r.tally} of ${S.quota}. The ${state.budget} budget you have left is lost.`,
      last ? 'This is the last run. The Keeper will ask about whoever comes next.' : `Run ${pad(state.run + 1)} starts at the entrance with a budget of ${S.budgetTable[state.run]}.`
    ], [{ label: 'Leave now', primary: true, detail: last ? 'End the final run.' : `End run ${pad(state.run)}.`, run: () => A.endRun('left') }, leave('Stay')]);
  };
})();
