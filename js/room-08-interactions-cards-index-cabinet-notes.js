// What happens when the player uses something in Room 08, part one: the
// single entry point interact(id), and the work itself. Pick up a misfiled
// card in the stacks (you carry one at a time), check it at the index desk,
// file it at the drawer cabinet, post index notes, and read the rule on the
// wall. "Take it to…" choices walk you there and open the next step. The
// tally, the Keeper, the ledger and the exit are in part two.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);
  G.carrying = null; // the card in hand this run, if any (not saved: it goes back to its place)
  const drawerName = (run, i) => S.drawers[S.drawerOf(run, i)];
  const budgetLine = state => state.budget === 0 ? '[Budget spent. This run ends when you close this.]' : `[Budget left this run: ${state.budget}.]`;
  const checkText = (state, i) => S.checkCost(state, i) ? `Checking it at the index desk costs ${S.checkCost(state, i)}.` : 'Checking it is free: an index note covers this kind of card.';

  A.interact = function (id) {
    if (G.modalOpen || G.transitioning || !G.started) return;
    const object = A.roomObjects().find(o => o.id === id);
    if (!object) return;
    A.trails.mark(); // the afterimage pauses here
    if (object.type === 'card') return pickUp(object.card);
    ({ index: atIndex, cabinet: atCabinet, notes: atBoard, rule: readRule, tally: A.atTally, keeper: A.talkToKeeper, log: A.readLedger, exit: A.useExit })[id]?.();
  };
  // Walks to a fixed object with the card in hand and uses it on arrival.
  function carryTo(id) {
    const o = A.fixedObjects.find(f => f.id === id);
    A.closeDialog(); if (!G.transitioning && !G.modalOpen) A.walkTo(o.x, o.y, id); // not if closing ended the run
  }

  function pickUp(i) {
    const state = G.state, swapped = G.carrying !== null, checked = S.checked(state, i);
    G.carrying = i;
    dialog('THE STACKS', checked ? 'A card you checked.' : 'A misfiled card.', [
      swapped ? 'You put the card you were carrying back where you found it, and take this one.' : 'Someone shelved it in the wrong place.',
      checked ? `[The index says it belongs in ${drawerName(state.run, i)}. Filing costs ${S.costs.file}.]` : `[${checkText(state, i)} Filing it at the drawer cabinet costs ${S.costs.file}.]`
    ], [
      ...(checked ? [] : [{ label: 'Take it to the index desk', primary: true, detail: 'Look up where it belongs', run: () => carryTo('index') }]),
      { label: 'Take it to the drawer cabinet', primary: checked, detail: checked ? `File it in ${drawerName(state.run, i)}` : 'File it without looking it up', run: () => carryTo('cabinet') },
      { label: 'Put it back', run: () => { G.carrying = null; A.closeDialog(); } },
      leave('Carry it and walk on')
    ], undefined, A.catalogueCard(state, i));
  }

  function atIndex() {
    const state = G.state, i = G.carrying;
    if (i === null) return dialog('THE INDEX DESK', 'The index.', ['A long book of every card the archive holds, and the drawer each one belongs in.',
      `[Bring a card here to check it. Checking costs ${S.costs.check}, and is free for kinds of card your index notes cover.]`], [leave()]);
    if (S.checked(state, i)) return checkedCard(i);
    const cost = S.checkCost(state, i), can = S.canCheck(state, i);
    dialog('THE INDEX DESK', 'Look it up?', [cost ? `[Costs ${cost} of your ${state.budget} remaining this run.]` : '[Free: an index note on the wall covers this kind of card.]'], [
      { label: 'Look it up', primary: true, disabled: !can, detail: can ? (cost ? `Costs ${cost}` : 'Free') : `Not enough budget this run (need ${cost}, have ${state.budget}).`,
        run: () => { S.advance(G.state, { type: 'Check', card: i }); A.save(); A.updateHUD(); checkedCard(i); } },
      leave('Not now')
    ], undefined, A.catalogueCard(state, i));
  }
  function checkedCard(i) {
    const state = G.state, kind = S.kindOf(state.run, i), noted = state.notes.some(n => n.kind === kind);
    dialog('THE INDEX DESK', `It belongs in ${drawerName(state.run, i)}.`, [
      `The index lists it as a ${S.kinds[kind].name}.`,
      noted ? `[Your index note on ${A.plural(kind)} is on the wall.]` : `[An index note on ${A.plural(kind)} (posted on the back wall, costs ${S.costs.note}) would make checking them free in later runs.]`,
      budgetLine(state)
    ], state.budget ? [{ label: 'Take it to the drawer cabinet', primary: true, detail: `File it in ${drawerName(state.run, i)}`, run: () => carryTo('cabinet') }, leave()] : [leave('Close')], undefined, A.catalogueCard(state, i));
  }

  const spotAside = '[When the Keeper is at the desk, they open one drawer as each run ends and note any card in it that does not belong.]';
  function atCabinet() {
    const state = G.state, i = G.carrying;
    if (i === null) return dialog('THE DRAWER CABINET', 'Four drawers.', ['The tally by the exit counts every card filed this run.', spotAside], [leave()], undefined, A.cabinetView(state));
    const checked = S.checked(state, i), can = S.canFile(state, i, S.drawerIds[0]);
    dialog('THE DRAWER CABINET', 'Which drawer?', [
      checked ? `The index said: ${drawerName(state.run, i)}.` : 'You have not looked this card up.',
      can ? `[Filing costs ${S.costs.file}. The tally counts every card filed.]` : `[Not enough budget to file it this run (need ${S.costs.file}, have ${state.budget}).]`, spotAside
    ], [leave('Not now')], undefined, A.cabinetView(state, { pick: can ? drawer => fileIn(i, drawer) : null, mark: checked ? S.drawerOf(state.run, i) : null }));
  }
  function fileIn(i, drawer) {
    S.advance(G.state, { type: 'File', card: i, drawer }); G.carrying = null; A.save(); A.updateHUD(); A.cue('note');
    const r = S.record(G.state, G.state.run);
    dialog('THE DRAWER CABINET', `Filed in ${S.drawers[drawer]}.`, [`By the exit, the tally clicks over: ${r.tally} of ${S.quota}.`, budgetLine(G.state)], [leave('Continue')]);
  }

  // Index notes: one per kind of card you have looked up, on the back wall.
  function atBoard() {
    const state = G.state, open = S.kindIds.filter(k => S.learned(state, k) && !state.notes.some(n => n.kind === k));
    dialog('THE INDEX NOTES', 'What the room remembers.', [
      state.notes.length ? `${state.notes.length} of ${S.kindIds.length} kinds of card have a note.` : 'The holders are empty.',
      `[A note costs ${S.costs.note} and records where one kind of card belongs; checking that kind is free from the next run. You can note a kind once you have looked one up.]`,
      ...(state.finished ? [] : [budgetLine(state)])
    ], [
      ...(state.finished ? [] : open.map(kind => ({ label: `Post a note: ${A.plural(kind)} → ${S.drawers[S.kinds[kind].drawer]}`, disabled: !S.canNote(state, kind),
        detail: S.canNote(state, kind) ? `Costs ${S.costs.note} · free checks from run ${A.pad(state.run + 1)}` : `Not enough budget this run (need ${S.costs.note}, have ${state.budget}).`,
        run: () => { S.advance(G.state, { type: 'PostNote', kind }); A.save(); A.updateHUD(); A.cue('note'); atBoard(); } }))),
      leave()
    ], undefined, A.indexNotesBoard(state));
  }

  function readRule() {
    dialog('A CARD ON THE WALL', 'Do not touch the tally.', ['It is signed with a K.', 'A touched tally, if seen, voids the run’s count.',
      '[The tally is the brass counter by the exit. Its back panel can be read; setting it needs the Keeper’s key.]'], [leave()]);
  }
  A.budgetLine = budgetLine;
})();
