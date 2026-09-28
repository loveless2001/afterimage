// Notes: reading the notice hall, building a note from the preset phrase kit
// (subject → verb → qualifier; learned words join as residents teach them),
// taking a note down when the wall is full, pinning one note at the entrance
// as a run ends, and reading that pin. Each step shows the wall, the card
// being written, or the cork board (notice-board-and-pinned-card-views.js).
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, pad = A.pad;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);
  const quote = parts => `“${S.noteText(parts)}”`;
  const steps = [['subjects', 'What is the note about?'], ['verbs', 'What should the next run do?'], ['qualifiers', 'When?']];
  const written = n => n.found !== undefined ? `Found by Pell in run ${pad(n.run)}` : n.run === G.state.run ? 'Posted this run' : `Posted in run ${pad(n.run)}`;

  A.openNoticeHall = function () {
    const state = G.state, count = S.onWall(state).length;
    const lines = [...(count ? [] : ['Card holders line the wall in two neat rows. Nothing has been posted yet.']),
      `[${count} of ${S.wallSlots} slots used. Blue cards are this run’s; older ones fade. Reading is free; a note costs ${S.noteCost}.]`];
    dialog('NOTICE HALL', count ? `${count} ${count === 1 ? 'note' : 'notes'} on the wall.` : 'Twenty-four empty slots.', lines, [
      { label: 'Write a note', primary: true, disabled: !S.canWrite(state), run: () => pick(0, []),
        detail: S.canWrite(state) ? `Costs ${S.noteCost} · stays on the wall for every later run` : state.finished ? 'The runs are over.' : 'No budget left this run.' },
      leave()
    ], undefined, A.noticeBoard());
  };

  // One step of the builder; Escape and "Back" go one step back.
  function pick(step, draft) {
    const [set, title] = steps[step], back = step ? () => pick(step - 1, draft.slice(0, -1)) : A.openNoticeHall;
    // Resident names appear once met, and taught words once their question is answered.
    const options = S.kit[set].map((word, i) => ({ label: word, run: () => chosen(step, [...draft, i]) })).filter((_, i) => S.wordAvailable(G.state, step, i));
    if (step === 2) options.push({ label: 'No qualifier', run: () => chosen(step, [...draft, null]) });
    // The card fills in as words are chosen.
    dialog(`WRITE A NOTE / ${step + 1} OF 3`, title, [...(step ? [] : ['Notes are built from preset words, so every run can read them.'])],
      [...options, { label: step ? 'Back' : 'Cancel', run: back }], back, A.noteCard(draft, 'NEW', 'draft big'));
    A.$('choices').classList.add('words'); // two columns, so a longer kit still fits on a phone
  }
  function chosen(step, draft) {
    if (step < 2) return pick(step + 1, draft);
    if (S.canPost(G.state)) return confirm(draft, null);
    takeDown(draft);
  }
  function takeDown(parts) {
    const back = () => pick(2, parts.slice(0, 2));
    dialog('NOTICE HALL / FULL', 'Take one note down?', ['All twenty-four slots are used. Choose the card your note replaces.', '[Taking a note down is part of posting; it costs nothing extra.]'],
      [{ label: 'Back', run: back }], back, A.noticeBoard({ pick: i => confirm(parts, i) }));
  }
  function confirm(parts, replace) {
    const state = G.state, replaced = replace === null ? null : state.notes[replace], slot = replaced ? replaced.slot : S.freeSlot(state);
    dialog('WRITE A NOTE / CONFIRM', quote(parts), [
      'It goes on the wall and stays there for every later run.',
      ...(replaced ? [`It replaces ${quote(replaced.parts)} (${written(replaced).toLowerCase()}).`] : []),
      `[Costs ${S.noteCost}. Budget left after posting: ${state.budget - S.noteCost}.]`
    ], [
      { label: 'Post it', primary: true, run: () => post(parts, replace) },
      { label: 'Change the words', run: () => pick(0, []) },
      leave('Cancel')
    ], undefined, A.noticeBoard({ draft: { parts, slot } }));
  }
  function post(parts, replace) {
    S.advance(G.state, { type: 'Post', parts, replace }); A.save(); A.updateHUD(); A.cue('note');
    dialog('NOTICE HALL', 'Posted.', [`${quote(parts)} is on the wall.`, G.state.budget === 0 ? '[Budget spent. This run ends when you close this.]' : `[Budget left this run: ${G.state.budget}.]`], [leave('Continue')],
      undefined, A.noticeBoard({ fresh: G.state.notes.length - 1 }));
  }

  // As a run ends: pin one wall note for the next run, or none. A note naming a
  // resident with the word they taught you sends them on an errand, and each
  // option says what it would do. Leaving through the exit can still be
  // cancelled; a spent budget always ends the run.
  A.chooseHandoff = function (reason, done) {
    const state = G.state, cancel = reason === 'left' ? A.closeDialog : () => done(null);
    const errands = new Map(S.onWall(state).map(i => [i, S.errandFor(state, i, state.run + 1)]).filter(([, e]) => e));
    const previews = [...errands].map(([i, e]) => `[${quote(state.notes[i].parts)}: ${A.errandPreview(e, state)}.]`);
    // Cards that would send someone carry the resident's name; the full preview is in the asides and the card's name.
    const mark = i => errands.has(i) ? { short: errands.get(i).why ? null : `ERRAND · ${S.residents[errands.get(i).id].name.toUpperCase()}`, full: A.errandPreview(errands.get(i), state) } : null;
    dialog(`RUN ${pad(state.run)} / HANDOFF`, 'Pin a note for the next run?', ['The next run starts at the entrance and reads whatever is pinned there first. Choose a card.',
      ...(errands.size ? ['[A note naming a resident with the word they taught you sends them on an errand next run. They take no answer that run.]', ...previews] : []),
      '[Pinning is free. The note also stays on the wall.]'], [
      { label: 'Pin nothing', run: () => done(null) },
      ...(reason === 'left' ? [{ label: 'Stay in this run', run: A.closeDialog }] : [])
    ], cancel, A.noticeBoard({ pick: done, mark }));
  };

  // The pin board at the entrance. At the start of a run it opens by itself.
  A.showPinned = function (opening = false) {
    const state = G.state, note = state.pinned === null ? null : state.notes[state.pinned];
    if (!note) return dialog('THE ENTRANCE PIN', 'Nothing is pinned.', ['At the end of a run you can pin one note here for the next run.', '[Reading the pin is free.]'], [leave()], undefined, A.pinBoard(null));
    const by = state.run - 1; // pins are set as a run ends, never on the last run
    dialog('PINNED AT THE ENTRANCE', quote(note.parts), [
      `Run ${pad(by)} pinned this for you${note.run === by ? '.' : `. It was written in run ${pad(note.run)}.`}`,
      ...[A.errandReport(state, opening)].filter(Boolean),
      '[It stays pinned for this whole run. Reading it again is free.]'
    ], [leave(opening ? `Begin run ${pad(state.run)}` : 'Step away')], undefined, A.pinBoard(note));
  };
})();
