// Heads-up display: the current objective and hint (derived from game state),
// the budget bar and count, the list of what the room keeps, and the field
// journal with walk-to destinations. Also applies the palette and low-budget cue.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;
  const lampCount = Object.keys(S.lamps).length, residentIds = Object.keys(S.residents);
  const runBudget = state => S.budgetTable[state.run - 1];
  const isLow = state => state.budget <= runBudget(state) * .25;

  // One next step at a time: [objective title, hint]. While a run is untouched,
  // the hint quotes the note the previous run pinned at the entrance.
  A.objective = function () {
    const state = G.state, [title, hint] = nextStep(state), pinned = S.pinnedNote(state);
    if (pinned && !state.finished && state.budget === runBudget(state)) return [title, `Your last run pinned: “${S.noteText(pinned.parts)}”.`];
    return [title, hint];
  };
  function nextStep(state) {
    const dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id)), cheapest = Math.min(...dark.map(id => S.lamps[id].cost));
    if (state.finished) return [`Ending ${S.endings[state.ending].letter}: ${S.endings[state.ending].title.toLowerCase()}.`, 'Look around, or revisit the ending from the menu.'];
    if (state.run >= S.turnRun) {
      const ready = ['record', 'lights', 'wall'].filter(id => S.endingReady(state, id)).length;
      return ['Decide what the room keeps.', `Write the last entry in the run log at the desk. ${ready} of 3 endings are ready; lamps and notes can still change that.`];
    }
    if (isLow(state)) return ['Your budget is nearly spent.', 'Post a note for the next run at the notice hall, or leave through the exit in the far corner.'];
    if (!state.lights.length && !state.notes.length && !state.talks.length) return ['Switch on a lamp.', 'Lamps stay on after a run ends. Each one costs budget; walking and reading are free.'];
    const unmet = residentIds.filter(id => !S.hasMet(state, id)).length;
    if (unmet) return ['Meet the residents.', `${unmet} of 3 residents have not met you yet. A first talk each run costs ${S.talkCost}.`];
    if (cheapest <= state.budget) return ['Light the archive.', `${dark.length} ${dark.length === 1 ? 'lamp is' : 'lamps are'} still dark. The cheapest costs ${cheapest}. A note costs ${S.noteCost}.`];
    return ['Leave something for the next run.', `Post a note at the notice hall (costs ${S.noteCost}), or leave through the exit in the far corner.`];
  }
  // One row of the "room keeps" panel.
  function keptRow(icon, title, detail, present) {
    const el = document.createElement('div'); el.className = `kept-item${present ? '' : ' absent'}`;
    const mark = document.createElement('i'); mark.textContent = present ? icon : '·';
    const text = document.createElement('div'); text.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    text.append(small); el.append(mark, text); return el;
  }

  A.updateHUD = function () {
    const state = G.state, [title, hint] = A.objective(), total = runBudget(state);
    $('objective').textContent = title; $('hint').textContent = hint;
    $('run').textContent = `/ RUN ${pad(state.run)}`; $('status').textContent = state.finished ? `RUN ${pad(state.run)} · ENDED` : `RUN ${pad(state.run)} OF ${pad(S.runCount)}`;
    $('budget-count').textContent = `${state.budget} / ${total}`;
    // One segment per unit of this run's budget; spent segments are hollow.
    $('budget-bar').replaceChildren(...Array.from({ length: total }, (_, i) => {
      const segment = document.createElement('i'); if (i >= state.budget) segment.className = 'spent'; return segment;
    }));
    const low = !state.finished && isLow(state);
    $('budget-bar').classList.toggle('low', low); A.setLowHum(low && G.started);
    const wall = S.onWall(state).length, thisRun = state.notes.filter(n => n.run === state.run).length, trust = state.trusted.length;
    const dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id)), cheapest = Math.min(...dark.map(id => S.lamps[id].cost));
    // Three short rows keep the panel clear of the room; the journal lists each lamp.
    $('kept').replaceChildren(
      keptRow('▤', 'Notes on the wall', `${wall} OF ${S.wallSlots}${thisRun ? ` · ${thisRun} THIS RUN` : ''}`, wall > 0),
      keptRow('◎', 'Residents', `MET ${residentIds.filter(id => S.hasMet(state, id)).length}/3 · TRUST ${trust}/3`, trust > 0),
      keptRow('◆', 'Lamps', `${state.lights.length} OF ${lampCount} LIT${dark.length ? ` · NEXT COSTS ${cheapest}` : ''}`, state.lights.length > 0));
    $('panel-note').textContent = state.lights.length || wall ? `Kept: ${state.lights.length} of ${lampCount} lamps, ${wall} notes.` : 'Walking and reading are free.';
    A.applyPalette();
  };

  // A written record of progress plus shortcuts that walk to named places.
  A.journal = function () {
    if (!G.started || G.transitioning) return;
    const state = G.state, [title, hint] = A.objective();
    const record = [title + ' ' + hint, state.finished ? 'The runs are over.' : `RUN ${pad(state.run)} of ${pad(S.runCount)} · ${state.budget} of ${runBudget(state)} budget left.`];
    for (const id of residentIds) {
      const r = S.residents[id];
      record.push(!S.hasMet(state, id) ? 'RESIDENT / Someone you have not met yet.' : `${r.name.toUpperCase()} / ${r.role}; ${S.isTrusted(state, id) ? 'trusts you.' : 'has not decided about you.'}`);
    }
    for (const [id, lamp] of Object.entries(S.lamps)) {
      const lit = state.lights.find(l => l.id === id);
      record.push(lit ? `THE ROOM KEEPS / ${lamp.title}, lit in run ${pad(lit.run)}.` : `DARK / ${lamp.title}. Costs ${lamp.cost}.`);
    }
    record.push(`NOTES / ${S.onWall(state).length} of ${S.wallSlots} on the wall.`);
    if (S.pinnedNote(state)) record.push(`PINNED / “${S.noteText(S.pinnedNote(state).parts)}”.`);
    // The alcove bench is only listed once it has been found.
    const places = A.roomObjects().filter(o => o.id !== 'bench' || state.benchSeen);
    A.dialog('FIELD JOURNAL / RUN ' + pad(state.run), 'Things worth returning to.', record, [
      ...places.map(o => {
        const name = o.type === 'resident' ? o.label : o.label.toLowerCase();
        const article = o.type === 'resident' || /^(the|a) /.test(name) ? '' : 'the ';
        return { label: 'Walk to ' + article + name, run: () => { A.closeDialog(); A.walkTo(o.x, o.y); } };
      }),
      A.leave('Close the journal')
    ]);
  };
  $('journal').addEventListener('click', A.journal);
})();
