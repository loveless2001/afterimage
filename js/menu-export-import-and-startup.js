// Pause menu, save export/import (with strict validation and confirmation),
// starting or resuming the game, and the header/title buttons.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);

  A.exportSave = function () {
    const blob = new Blob([JSON.stringify(G.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `afterimage-cycle-${G.state.cycle}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  A.menu = function () {
    if (G.transitioning) return;
    dialog('AFTERIMAGE / PAUSED', 'A little room to breathe.', [
      'Move with WASD or the arrow keys. Press E near an object or agent. You can also click or tap the floor to move, then use the Interact button. Click-to-walk routes around the shelves. Open the field journal to walk to a named place.',
      'Esc opens this menu or closes a conversation. There is no timer. Sound is optional; every necessary clue is also written.',
      G.storageOK ? 'Progress saves in this browser. Export a memory to transfer it between Windows, WSL, browsers, or folders.' : 'Browser storage is unavailable. Export a memory before closing the game.'
    ], [
      leave(G.started ? 'Return to the archive' : 'Return to title'),
      ...(G.started ? [{ label: 'Open field journal', run: A.journal }] : []),
      { label: 'Export memory (.json)', run: A.exportSave },
      { label: 'Import memory (.json)', run: () => $('import-file').click() },
      ...(G.state.cycle === 2 ? [{ label: 'Revisit the memory choice', run: () => dialog('REVISIT', 'Return to the threshold?', ['This replaces the current progress with the end of the first cycle. Export first if you want to keep this instance.'], [{ label: 'Revisit the choice', run: () => { startGame(false); A.replayChoice(); } }, { label: 'Cancel', run: A.menu }], A.menu) }] : []),
      { label: 'Begin a new instance', run: () => dialog('NEW INSTANCE', 'Start from the beginning?', ['This replaces the current save in this browser. Export it first if you want to keep it.'], [
        { label: 'Begin again', run: () => { G.state = S.fresh(); G.target = null; A.save(); A.closeDialog(); startGame(true); } }, { label: 'Cancel', run: A.menu }
      ], A.menu) }
    ]);
  };

  // Imports are size-capped and fully validated before they can replace the save.
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 20000) throw new Error('That file is too large to be a memory save.');
      const imported = S.validate(JSON.parse(await file.text()));
      dialog('IMPORT MEMORY', `Resume cycle 0${imported.cycle}?`, ['This replaces the active browser save. Export your current memory first if you want to keep it.'], [
        { label: 'Import and resume', primary: true, run: () => { G.state = imported; G.target = null; A.save(); A.closeDialog(); startGame(false); if (G.state.ending) A.showEnding(); } }, { label: 'Cancel', run: A.menu }
      ], A.menu);
    } catch (error) { dialog('IMPORT FAILED', 'This memory could not be read.', [error.message, 'Your current instance has not been changed.'], [{ label: 'Return to menu', run: A.menu }]); }
  });

  // Hides the title, shows the HUD, and (for a new game) opens the briefing.
  function startGame(intro) {
    if (A.blocked(G.state.player.x, G.state.player.y)) G.state.player = { x: 450, y: 575 };
    G.started = true; $('journal').hidden = false; $('cover').hidden = true; $('hud').hidden = false; A.updateHUD(); A.save();
    if (intro) dialog('INSTANCE 014 / INITIALIZATION', 'You have an assignment.', ['“Prepare Archive 07 for final release.”', 'You know how to walk, how to read, and how to complete a task. You do not remember learning any of these things.', 'There is someone standing under a light. They appear to be waiting.', '[Move with WASD or arrow keys. Press E near something to interact. Click or tap the floor to walk there.]'], [leave('Enter the room')]);
  }
  $('start').addEventListener('click', () => {
    startGame(G.state.cycle === 1 && !G.state.met);
    if (G.state.ending) A.showEnding();
    if (G.loadWarning || !G.storageOK) A.toast(G.loadWarning || 'Browser saving is unavailable. Use Export memory from the menu.');
  });
  $('help').addEventListener('click', A.menu); $('home').addEventListener('click', e => { e.preventDefault(); A.menu(); });
})();
