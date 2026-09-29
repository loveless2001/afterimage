// Room 08's paper views, shown in the dialog above the text (like Room 07's
// notice wall): a catalogue card up close, the drawer cabinet (its drawers
// become buttons when you are filing), the tally with its back panel's dial,
// and the board of index notes. Blue still marks what you leave: index notes.
(function () {
  'use strict';
  const A = window.Afterimage, S = A.S, pad = A.pad, el = A.el;
  const filedIn = (state, drawer) => state.files.filter(f => f.run === state.run && f.drawer === drawer).length;
  A.plural = kind => S.kinds[kind].name + 's';

  // One card as it is held: its title, which run's card it is, and once
  // checked, the index's word on where it belongs.
  A.catalogueCard = function (state, i) {
    const card = el('div', 'card big catalogue'), total = S.runCards[state.run - 1].length;
    card.append(el('span', 'word', S.cardsOf(state.run)[i].title), el('small', 'stamp', `CARD ${i + 1} OF ${total} · RUN ${pad(state.run)}`),
      el('small', 'stamp', S.checked(state, i) ? `INDEX · ${S.drawers[S.drawerOf(state.run, i)].toUpperCase()}` : 'NOT CHECKED'));
    return card;
  };

  // The cabinet: one drawer per shelf-mark, with this run's count in each.
  // opts: pick(drawer) makes the drawers buttons; mark names the drawer the
  // index gave for the card in hand.
  A.cabinetView = function (state, opts = {}) {
    const cabinet = el('div', 'cabinet');
    cabinet.setAttribute('role', 'group'); cabinet.setAttribute('aria-label', 'The drawer cabinet');
    for (const id of S.drawerIds) {
      const count = filedIn(state, id), marked = opts.mark === id;
      const drawer = el(opts.pick ? 'button' : 'div', 'drawer' + (marked ? ' marked' : ''));
      drawer.append(el('span', 'plate', S.drawers[id]), el('small', 'stamp', `${count} FILED THIS RUN`));
      if (marked) drawer.append(el('small', 'stamp', 'THE INDEX SAYS HERE'));
      if (opts.pick) {
        drawer.setAttribute('aria-label', `File in ${S.drawers[id]}${marked ? ', where the index says it belongs' : ''}. ${count} filed here this run.`);
        drawer.addEventListener('click', () => opts.pick(id));
      }
      cabinet.append(drawer);
    }
    return cabinet;
  };

  // The tally: its count in brass, and the back panel's dial (0 to +3).
  A.tallyPanel = function (state) {
    const r = S.record(state, state.run), offset = S.offsetAfter(state, state.run), panel = el('div', 'brass-panel');
    panel.setAttribute('role', 'img'); panel.setAttribute('aria-label', `The tally reads ${r.tally} of ${S.quota}. The back panel is set to ${offset ? '+' + offset : 'zero'}.`);
    const counter = el('div', 'counter' + (r.tally >= S.quota ? ' met' : '')); counter.append(el('span', '', String(r.tally)), el('small', '', `OF ${S.quota}`));
    const dial = el('ol', 'dial');
    [0, ...S.panelSettings].forEach(n => dial.append(el('li', n === offset ? 'set' : '', n ? `+${n}` : '0')));
    panel.append(counter, el('small', 'stamp', 'BACK PANEL'), dial);
    return panel;
  };

  // The index notes board: a holder per kind of card; posted notes are blue
  // and read "kind → drawer".
  A.indexNotesBoard = function (state) {
    const board = el('ol', 'board index-board');
    board.setAttribute('aria-label', `Index notes: ${state.notes.length} of ${S.kindIds.length} holders used`);
    for (const kind of S.kindIds) {
      const holder = el('li', 'holder'), note = state.notes.find(n => n.kind === kind);
      if (note) {
        const card = el('div', 'card current');
        card.append(el('span', 'word', A.plural(kind)), el('span', 'word', `→ ${S.drawers[S.kinds[kind].drawer]}`), el('small', 'stamp', `RUN ${pad(note.run)}`));
        holder.append(card);
      } else holder.classList.add('empty');
      board.append(holder);
    }
    return board;
  };
})();
