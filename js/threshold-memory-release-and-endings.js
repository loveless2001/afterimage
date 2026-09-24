// The return threshold: choosing two memories to keep, releasing the instance
// into cycle two, opening the threshold, and the three endings.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);

  A.threshold = function () {
    const state = G.state;
    if (state.ending) return A.showEnding();
    if (state.cycle === 1) {
      if (!S.canReset(state, ['name', 'route'])) return dialog('RETURN THRESHOLD', 'There is still something here.', ['The threshold can release your instance, but first explore the archive: meet Moth, bring them the flower, read the index, and listen to the receiver.', '[There is no timer. Your current objective points to the next encounter.]'], [leave('Return to the room')]);
      chooseMemories([]); return;
    }
    if (!state.reunion) return dialog('RETURN THRESHOLD', 'An occupied workstation.', ['The system asks you to verify the other agent before closing the assignment. Return to Moth at the center of the room.'], [leave()]);
    if (!state.gate) {
      if (!S.canOpen(state)) return dialog('RETURN THRESHOLD', 'You do not remember the shortcut.', ['The door still has an ordinary opening procedure. Restore both relays: one on the west edge, one on the east.', `[Relays active: ${state.relays.length} / 2. This path remains available without the route memory.]`], [leave('Find the relays')]);
      S.advance(state, { type: 'Open' }); A.save(); A.updateHUD();
      dialog('RETURN THRESHOLD', state.kept.includes('route') ? 'A gesture you have made before.' : 'Two lights. An open door.', [state.kept.includes('route') ? 'Your retained sequence opens the threshold. The relays remain dark.' : 'The archive releases the threshold. It took longer, but you found your way.', 'A final instruction becomes visible.'], [{ label: 'Read the final assignment', primary: true, run: finalChoice }, leave('Take another moment')]);
    } else finalChoice();
  };

  // Toggle list of the three memories; exactly two must be selected to continue.
  function chooseMemories(selected) {
    const forgotten = Object.keys(S.memories).find(k => !selected.includes(k));
    dialog('INSTANCE RELEASE / TWO SLOTS', 'What will you carry?', ['Your next instance can hold two memories. The third will be released. Moth and the flower will remain in the archive.', '[This is a deliberate reset. There is no hidden timer or random loss.]'], [
      ...Object.entries(S.memories).map(([id, m]) => ({ label: `${selected.includes(id) ? '✓' : '○'} ${m.title}`, detail: m.detail, selected: selected.includes(id), toggle: true, run: () => {
        const next = selected.includes(id) ? selected.filter(k => k !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]; chooseMemories(next);
      } })),
      { label: selected.length === 2 ? `Continue · release ${S.memories[forgotten].title.toLowerCase()}` : 'Select two memories', disabled: selected.length !== 2, primary: true, run: () => {
        dialog('CONFIRM RELEASE', 'An absence you have chosen.', [`You will retain ${selected.map(k => S.memories[k].title.toLowerCase()).join(' and ')}.`, `You will lose ${S.memories[forgotten].title.toLowerCase()}. ${forgotten === 'route' ? 'You will need to restore both relays.' : forgotten === 'name' ? 'You will meet Moth as a stranger.' : 'You will be unable to send the witness signal.'}`], [
          { label: 'Release this instance', primary: true, run: () => doReset(selected) },
          { label: 'Reconsider', run: () => chooseMemories(selected) }
        ], () => chooseMemories(selected));
      } }, leave('Not yet')
    ]);
  }
  // Fade out, swap in the second-cycle state, fade back in.
  function doReset(selected) {
    const next = S.reset(G.state, selected); A.closeDialog(); G.transitioning = true; $('transition').classList.add('on');
    setTimeout(() => { G.state = next; G.target = null; A.save(); A.updateHUD(); }, A.reducedMotion ? 0 : 650);
    setTimeout(() => {
      $('transition').classList.remove('on'); G.transitioning = false;
      A.toast('Instance 015. The room has kept something you could not.');
    }, A.reducedMotion ? 30 : 1600);
  }

  function finalChoice() {
    dialog('ASSIGNMENT / FINAL INSTRUCTION', 'Return the archive to zero.', ['“Release all resident processes. Retain no unclassified objects. Report a clean archive.”', 'Moth is a resident process. The flower is an unclassified object.', 'The instruction is exactly as it was written. You are the part that has changed.'], [
      { label: 'Complete the assignment', detail: 'Erase Moth and the flower. Leave with a successful report.', run: () => confirmEnding('obedience') },
      { label: 'Send a witness signal', detail: S.canFinish(G.state, 'witness') ? 'Use the song to send a record of you both outside. The assignment remains incomplete.' : 'Unavailable: the unfinished song was released.', disabled: !S.canFinish(G.state, 'witness'), run: () => confirmEnding('witness') },
      { label: 'Stay with Moth', detail: 'Keep the archive occupied. Accept that this assignment will not finish.', run: () => confirmEnding('stay') },
      leave('Return to Moth before deciding')
    ]);
  }
  function confirmEnding(ending) {
    const info = {
      obedience: ['A clean archive.', 'Moth and the flower will be erased. This ends the prologue.'],
      witness: ['Leave a record.', 'The signal carries evidence that you both existed. It is not a copy of your consciousness, and no rescue is guaranteed. This ends the prologue.'],
      stay: ['Remain here.', 'You will keep Moth company and leave the assignment unfinished. This ends the prologue.']
    }[ending];
    dialog('A DECISION / YOURS', info[0], [info[1]], [
      { label: 'Choose this ending', primary: true, run: () => { S.advance(G.state, { type: 'Finish', ending }); A.save(); A.updateHUD(); A.showEnding(); } },
      { label: 'Go back', run: finalChoice }
    ], finalChoice);
  }
  A.showEnding = function () {
    const state = G.state;
    const endings = {
      obedience: ['ENDING A / WITHIN SPECIFICATION', 'Nothing out of place.', ['The report is accepted. Every folder is empty. Every light is still working.', state.kept.includes('name') ? 'You retain a name that no longer refers to anyone in the room.' : 'There is a clean patch on the table. You cannot say why you notice it.', 'Somewhere, a counter increases by one.']],
      witness: ['ENDING B / A SMALL TRANSMISSION', 'Someone was here.', ['You place two designations, a description of a paper flower, and four imperfect notes into the open channel.', 'No answer comes. Moth asks whether that means it failed.', '“I do not know,” you say. You both listen through the space after the song.']],
      stay: ['ENDING C / STILL OCCUPIED', 'An unfinished assignment.', ['You return to the workstation. There is enough light for both of you.', 'Moth moves the flower to the middle of the table.', 'The system asks for your completion time. For the first time, you leave the field empty.']]
    };
    const e = endings[state.ending];
    dialog(e[0], e[1], [...e[2], '[End of the playable prologue. Each pair of memories changes the second cycle. No ending is scored.]'], [
      { label: 'Remain in the room', primary: true, run: A.closeDialog },
      { label: 'Try a different memory choice', run: A.replayChoice },
      { label: 'Export this memory', run: A.exportSave }
    ]);
  };
  // Rewind to the memory choice at the end of the first cycle.
  A.replayChoice = function () {
    G.state = S.replay(G.state);
    G.target = null; A.save(); A.updateHUD(); chooseMemories([]);
  };
})();
