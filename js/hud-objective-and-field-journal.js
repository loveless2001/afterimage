// Heads-up display: the current objective and hint (derived from story state),
// the memory panel, and the field journal with walk-to destinations.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$;

  // One next step at a time: [objective title, hint].
  A.objective = function () {
    const state = G.state;
    if (state.ending) return ['The archive remembers.', 'Your prologue is complete. You can revisit either cycle from the menu.'];
    if (state.cycle === 1) {
      if (!state.met) return ['Find the other agent.', 'Another agent waits at the central workstation.'];
      if (!state.gift) return ['Bring Moth something useless.', 'A small paper flower lies to the southwest of Moth.'];
      if (!state.acquired.includes('route')) return ['Find a way through.', 'Read the index terminal northeast of Moth.'];
      if (!state.acquired.includes('song')) return ['Listen to the damaged receiver.', 'There is still a signal in the southeast corner.'];
      return ['Choose what survives.', 'The return threshold is at the northeast edge. You can keep two of your three memories.'];
    }
    if (!state.reunion) return ['Return to the other agent.', 'The room is the same. You are not.'];
    if (!state.gate) return state.kept.includes('route')
      ? ['Open the return threshold.', 'You remember the bypass. Use it at the northeast threshold.']
      : ['Restore both archive relays.', 'The west and east relays must both be active. Then return to the northeast threshold.'];
    return ['Decide what completion means.', 'The threshold is open. Read the final assignment.'];
  };

  A.updateHUD = function () {
    const state = G.state, [title, hint] = A.objective(); $('objective').textContent = title; $('hint').textContent = hint;
    $('cycle').textContent = `/ CYCLE 0${state.cycle}`; $('status').textContent = `INSTANCE ${state.cycle === 1 ? '014' : '015'}`;
    $('memories').replaceChildren();
    Object.entries(S.memories).forEach(([id, item]) => {
      const available = state.acquired.includes(id), lost = state.cycle === 2 && !state.kept.includes(id);
      const el = document.createElement('div'); el.className = `memory${available ? '' : ' absent'}`;
      const icon = document.createElement('i'); icon.textContent = available ? item.symbol : '·';
      const text = document.createElement('div'); text.textContent = available || lost ? item.title : 'Unwritten';
      const detail = document.createElement('small'); detail.textContent = lost ? 'RELEASED' : available ? (state.cycle === 1 ? 'FOUND / VOLATILE' : 'RETAINED') : 'AWAITING EXPERIENCE';
      text.append(detail); el.append(icon, text); $('memories').append(el);
    });
    $('memory-note').textContent = state.cycle === 1 ? 'Three experiences. Room for two.' : 'An absence can have a shape.';
  };

  // A written record of progress plus shortcuts that walk to named places.
  A.journal = function () {
    if (!G.started || G.transitioning) return;
    const state = G.state, [title, hint] = A.objective();
    const record = [title + ' ' + hint];
    if (state.cycle === 1) record.push(state.met ? 'Moth chose a name. They collect things with no assigned use.' : 'A second agent is waiting in the archive.');
    else record.push('This is a player reference, not an extra memory slot. Released memories cannot be used by this instance.');
    if (state.gift) record.push(state.flowerSpot === 'light' ? 'IN THE ROOM / A paper flower stands under the lamp.' : state.flowerSpot === 'company' ? 'IN THE ROOM / A flower marks two places at the table.' : 'IN THE ROOM / Moth kept the paper flower.');
    for (const [id, m] of Object.entries(S.memories)) {
      if (state.acquired.includes(id)) record.push((state.cycle === 1 ? 'FOUND / ' : 'RETAINED / ') + m.title + '. ' + m.detail);
      else if (state.cycle === 2) record.push('RELEASED / ' + m.title + '. This experience did not continue.');
    }
    if (state.cycle === 2) record.push('RELAYS / ' + state.relays.length + ' of 2 restored.');
    const destinations = A.objects.filter(o => A.visibleObject(o) && (o.id !== 'gift' || state.met));
    A.dialog('FIELD JOURNAL / CYCLE 0' + state.cycle, 'Things worth returning to.', record, [
      ...destinations.map(o => ({ label: 'Walk to ' + (o.id === 'moth' && state.met ? 'Moth' : o.label.toLowerCase()), run: () => { A.closeDialog(); A.walkTo(o.x, o.y); } })),
      A.leave('Close the journal')
    ]);
  };
  $('journal').addEventListener('click', A.journal);
})();
