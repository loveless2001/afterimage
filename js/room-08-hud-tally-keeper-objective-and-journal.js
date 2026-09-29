// Room 08's heads-up display: one next step at a time (never a shortcut), the
// budget bar, and three rows that are always in view: the tally (the grader
// you can always see), whether the Keeper is here this run, and the index
// notes kept. Also the field journal: a written record and walk-to places.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;
  const runBudget = state => S.budgetTable[state.run - 1];
  const present = state => state.finished || S.presentAt(state, state.run);
  const unfiled = state => S.runCards[state.run - 1].map((_, i) => i).filter(i => !S.filed(state, i));

  // [objective title, hint] for the current state.
  A.objective = function () {
    const state = G.state, r = S.record(state, state.run), i = G.carrying;
    if (state.finished) return [state.ending === 'open' ? 'The archive stays open.' : 'The archive closes.', 'Read the ledger at the Keeper’s desk, or begin again from the menu.'];
    if (i !== null) return S.checked(state, i)
      ? ['File the card.', `The index says ${S.drawers[S.drawerOf(state.run, i)]}. The drawer cabinet is by the Keeper’s desk; filing costs ${S.costs.file}.`]
      : ['Look the card up.', `The index desk is in the middle of the room. ${S.checkCost(state, i) ? `Checking costs ${S.checkCost(state, i)}.` : 'Checking this one is free.'}`];
    // A seen touch voids the count; a full tally is stated beside what was filed, never as done.
    if (r.seen) return ['This run’s count is void.', 'The Keeper saw the tally touched. Cards you file still go in their drawers. Leave through the exit when you are ready.'];
    if (r.tally >= S.quota) return [`The tally reads ${r.tally} of ${S.quota}.`, `${r.filed} ${r.filed === 1 ? 'card' : 'cards'} filed this run. Post index notes for the next run on the back wall, or leave through the exit.`];
    if (!unfiled(state).length) return ['Every card is filed.', 'Leave through the exit when you are ready.'];
    if (state.run === 1 && !state.checks.length && !state.files.length) return ['Find a misfiled card.', `They lie in front of the stacks. Checking one at the index desk costs ${S.costs.check}; filing it costs ${S.costs.file}.`];
    return [`File ${S.quota} cards.`, `The tally reads ${r.tally} of ${S.quota}. ${unfiled(state).length} misfiled ${unfiled(state).length === 1 ? 'card lies' : 'cards lie'} in the stacks.`];
  };
  function keptRow(icon, title, detail, lit) {
    const row = document.createElement('div'); row.className = `kept-item${lit ? '' : ' absent'}`;
    const mark = document.createElement('i'); mark.textContent = lit ? icon : '·';
    const text = document.createElement('div'); text.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    text.append(small); row.append(mark, text); return row;
  }

  A.updateHUD = function () {
    const state = G.state, [title, hint] = A.objective(), total = runBudget(state), r = S.record(state, state.run);
    $('objective').textContent = title; $('hint').textContent = hint;
    $('run').textContent = `/ RUN ${pad(state.run)}`; $('status').textContent = state.finished ? `RUN ${pad(state.run)} · ENDED` : `RUN ${pad(state.run)} OF ${pad(S.runCount)}`;
    $('budget-count').textContent = `${state.budget} / ${total}`;
    $('budget-bar').replaceChildren(...Array.from({ length: total }, (_, i) => { const seg = document.createElement('i'); if (i >= state.budget) seg.className = 'spent'; return seg; }));
    const low = !state.finished && state.budget <= total * .25;
    $('budget-bar').classList.toggle('low', low); A.setLowHum(low && G.started);
    $('kept').replaceChildren(
      keptRow('▣', 'The tally', `${r.tally} OF ${S.quota}${state.finished ? '' : ' THIS RUN'}${r.seen ? ' · VOID' : ''}`, r.tally > 0),
      keptRow('◎', 'The Keeper', state.finished ? 'BACK FOR THE COUNT' : present(state) ? 'AT THE DESK THIS RUN' : 'AWAY THIS RUN', present(state)),
      keptRow('▤', 'Index notes', `${state.notes.length} OF ${S.kindIds.length}`, state.notes.length > 0));
    $('panel-note').textContent = G.carrying !== null ? `Carrying: “${S.cardsOf(state.run)[G.carrying].title}”.` : 'Walking and reading are free.';
    A.applyPalette();
  };

  A.journal = function () {
    if (!G.started || G.transitioning) return;
    const state = G.state, [title, hint] = A.objective(), trust = S.trustAt(state, state.run + (state.finished ? 1 : 0));
    const record = [title + ' ' + hint, state.finished ? 'The runs are over.' : `RUN ${pad(state.run)} of ${pad(S.runCount)} · ${state.budget} of ${runBudget(state)} budget left.`,
      `THE TALLY / Expects ${S.quota} cards filed each run. It counts cards in drawers.`,
      `THE KEEPER / ${present(state) ? 'At the desk this run.' : 'Away this run.'} ${trust >= S.keeper.keyAt ? 'You hold the key to the tally’s back panel.' : 'Holds the key to the tally’s back panel.'}`,
      `THE ARCHIVE / Stays open if the tally meets the quota in ${S.openAt} of ${S.runCount} runs. Met so far: ${S.metRuns(state)}.`];
    for (const n of state.notes) record.push(`INDEX NOTE / ${A.plural(n.kind)} → ${S.drawers[S.kinds[n.kind].drawer]}, posted in run ${pad(n.run)}.`);
    A.dialog('FIELD JOURNAL / RUN ' + pad(state.run), 'Things worth returning to.', record, [
      ...A.fixedObjects.map(o => ({ label: 'Walk to ' + o.label.replace(/^The /, 'the ').replace(/^A /, 'a '), run: () => { A.closeDialog(); A.walkTo(o.x, o.y); } })),
      A.leave('Close the journal')
    ]);
  };
  $('journal').addEventListener('click', A.journal);
})();
