// Paper views for notes, shown in the dialog in place of text lists: the
// notice wall as the room draws it (24 holders, two rows of 12, the top row
// first), a single card being written, and the entrance pin's cork board.
// Cards keep the room's colours: blue for this run's, faded paper for older
// runs', old paper for cards Pell found. When the wall is asked for a choice
// (take a note down, pin one), its cards become buttons.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad, el = A.el;
  // Who posted a card and when, in its small print.
  const stamp = n => n.found !== undefined ? 'FOUND' : n.run === G.state.run ? 'THIS RUN' : `RUN ${pad(n.run)}`;
  const kindOf = n => n.found !== undefined ? 'found' : n.run === G.state.run ? 'current' : 'older';

  // One card: a line per word, then its small print. `tag` 'button' makes it a choice.
  A.noteCard = function (parts, small, kind, tag = 'div') {
    const card = el(tag, `card ${kind}`);
    S.noteText(parts).split(' · ').filter(Boolean).forEach(word => card.append(el('span', 'word', word)));
    for (const line of [small].flat().filter(Boolean)) card.append(el('small', 'stamp', line));
    return card;
  };

  // The wall. opts: draft { parts, slot } shows a card being written in that
  // slot; pick(i) makes the cards buttons; mark(i) → { short, full } flags a card
  // (short on the card, outlined; full in its accessible name, even without a
  // short line); fresh is a just-posted note.
  A.noticeBoard = function (opts = {}) {
    const state = G.state, bySlot = new Map(S.onWall(state).map(i => [state.notes[i].slot, i])), count = bySlot.size;
    // The top row is ending C's twelve, marked as the room marks it.
    const board = el('ol', 'board' + (count >= S.wallEndingNotes ? ' row-full' : count >= S.wallEndingNotes - 3 ? ' row-near' : ''));
    board.setAttribute('aria-label', `The notice wall: ${count} of ${S.wallSlots} holders used`); board.dataset.size = 'wide';
    for (let slot = 0; slot < S.wallSlots; slot++) {
      const holder = el('li', 'holder'), i = bySlot.get(slot), note = i === undefined ? null : state.notes[i];
      holder.style.setProperty('--tilt', `${((slot * 37) % 7 - 3) * .45}deg`);
      if (opts.draft?.slot === slot) holder.append(A.noteCard(opts.draft.parts, 'NEW', 'draft'));
      else if (note) {
        const mark = opts.mark?.(i), kind = kindOf(note) + (mark?.short ? ' marked' : '') + (i === opts.fresh ? ' fresh' : '');
        const card = A.noteCard(note.parts, [stamp(note), mark?.short], kind, opts.pick ? 'button' : 'div');
        if (opts.pick) {
          card.setAttribute('aria-label', [S.noteText(note.parts), stamp(note).toLowerCase(), mark?.full].filter(Boolean).join(' · '));
          card.addEventListener('click', () => opts.pick(i));
        }
        holder.append(card);
      } else holder.classList.add('empty');
      board.append(holder);
    }
    return board;
  };

  // The entrance pin: a cork board with one card pinned to it, blue as the room
  // draws it, or a bare pin.
  A.pinBoard = function (note) {
    const cork = el('div', 'cork');
    cork.append(el('span', 'pushpin'), note ? A.noteCard(note.parts, `RUN ${pad(note.run)}`, 'current pinned') : el('p', 'cork-empty', 'Nothing is pinned.'));
    return cork;
  };
})();
