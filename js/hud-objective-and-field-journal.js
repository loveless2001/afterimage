// Heads-up display: the current objective and hint (derived from game state),
// the budget bar and count, the list of what the room keeps, and the field
// journal with walk-to destinations.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;
  const lampCount = Object.keys(S.lamps).length;
  const runBudget = state => S.budgetTable[state.run - 1];
  const isLow = state => state.budget <= runBudget(state) * .25;

  // One next step at a time: [objective title, hint].
  A.objective = function () {
    const state = G.state, dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id));
    if (state.finished) return ['The runs are over.', 'Look around, read the run log, or begin again from the menu.'];
    if (!dark.length) return ['Every lamp is on.', 'Leave through the exit in the far corner, or read the run log at the desk.'];
    const cheapest = Math.min(...dark.map(id => S.lamps[id].cost));
    if (cheapest > state.budget) return ['Nothing left here is affordable.', 'Leave through the exit in the far corner. The next run starts with a new budget.'];
    if (isLow(state)) return ['Your budget is nearly spent.', `Spend what is left, or leave through the exit in the east.`];
    if (!state.lights.length) return ['Switch on a lamp.', 'Lamps stay on after a run ends. Each one costs budget; walking and reading are free.'];
    return ['Light the archive.', `${dark.length} ${dark.length === 1 ? 'lamp is' : 'lamps are'} still dark. The cheapest costs ${cheapest}.`];
  };

  A.updateHUD = function () {
    const state = G.state, [title, hint] = A.objective(), total = runBudget(state);
    $('objective').textContent = title; $('hint').textContent = hint;
    $('run').textContent = `/ RUN ${pad(state.run)}`; $('status').textContent = state.finished ? `RUN ${pad(state.run)} · ENDED` : `RUN ${pad(state.run)} OF ${pad(S.runCount)}`;
    $('budget-count').textContent = `${state.budget} / ${total}`;
    // One segment per unit of this run's budget; spent segments are hollow.
    $('budget-bar').replaceChildren(...Array.from({ length: total }, (_, i) => {
      const segment = document.createElement('i'); if (i >= state.budget) segment.className = 'spent'; return segment;
    }));
    $('budget-bar').classList.toggle('low', !state.finished && isLow(state));
    $('kept').replaceChildren(...Object.entries(S.lamps).map(([id, lamp]) => {
      const lit = state.lights.find(l => l.id === id);
      const el = document.createElement('div'); el.className = `kept-item${lit ? '' : ' absent'}`;
      const icon = document.createElement('i'); icon.textContent = lit ? '◆' : '·';
      const text = document.createElement('div'); text.textContent = lamp.title;
      const detail = document.createElement('small'); detail.textContent = lit ? `LIT IN RUN ${pad(lit.run)}` : `DARK · COSTS ${lamp.cost}`;
      text.append(detail); el.append(icon, text); return el;
    }));
    $('panel-note').textContent = state.lights.length ? `The room has kept ${state.lights.length} of ${lampCount}.` : 'Walking and reading are free.';
  };

  // A written record of progress plus shortcuts that walk to named places.
  A.journal = function () {
    if (!G.started || G.transitioning) return;
    const state = G.state, [title, hint] = A.objective();
    const record = [title + ' ' + hint, state.finished ? 'All seven runs have ended.' : `RUN ${pad(state.run)} of ${pad(S.runCount)} · ${state.budget} of ${runBudget(state)} budget left.`];
    for (const [id, lamp] of Object.entries(S.lamps)) {
      const lit = state.lights.find(l => l.id === id);
      record.push(lit ? `THE ROOM KEEPS / ${lamp.title}, lit in run ${pad(lit.run)}.` : `DARK / ${lamp.title}. Costs ${lamp.cost}.`);
    }
    A.dialog('FIELD JOURNAL / RUN ' + pad(state.run), 'Things worth returning to.', record, [
      ...A.objects.map(o => {
        const name = o.label.toLowerCase();
        return { label: 'Walk to ' + (name.startsWith('the ') ? name : 'the ' + name), run: () => { A.closeDialog(); A.walkTo(o.x, o.y); } };
      }),
      A.leave('Close the journal')
    ]);
  };
  $('journal').addEventListener('click', A.journal);
})();
