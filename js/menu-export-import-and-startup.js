// Pause menu, save export/import (with strict validation and confirmation),
// starting or resuming the game, and the header/title buttons. Room-specific
// words come from the room profile: its rules summary (help), the opening
// briefing, and the export file name; Revisit appears where a room has it.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, $ = A.$, pad = A.pad;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);

  A.exportSave = function () {
    const blob = new Blob([JSON.stringify(G.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `${A.room.exportName}-run-${pad(G.state.run)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // A room that is not open yet (the profile's `locked`) shows its gate, with a
  // way back, in place of the start button and the menu.
  const gated = Boolean(A.room.locked?.(G.state));
  if (gated) {
    $('start').hidden = true; $('help').hidden = true; $('gate').hidden = false;
    if (!G.storageOK) $('gate').append(' This browser is not keeping saves, so the room cannot tell.');
  }

  A.menu = function () {
    if (G.transitioning || gated) return;
    dialog('AFTERIMAGE / PAUSED', 'A little room to breathe.', [
      'Move with WASD or the arrow keys. Press E near something to use it. You can also click or tap the floor to walk there, then use the Interact button. Open the field journal to walk to a named place.',
      A.room.help,
      G.storageOK ? 'Progress saves in this browser. Export a save to move it between Windows, WSL, browsers, or folders.' : 'Browser storage is unavailable. Export a save before closing the game.'
    ], [
      leave(G.started ? 'Return to the room' : 'Return to title'),
      ...(G.started ? [{ label: 'Open field journal', run: A.journal }] : []),
      { label: 'Export save (.json)', run: A.exportSave },
      { label: 'Import save (.json)', run: () => $('import-file').click() },
      { label: `Palette: ${G.state.palette}`, detail: `Auto follows your system, and turns to night from run ${pad(S.turnRun)}.`, run: () => { S.advance(G.state, { type: 'SetPalette', palette: S.palettes[(S.palettes.indexOf(G.state.palette) + 1) % S.palettes.length] }); A.save(); A.updateHUD(); A.menu(); } },
      ...(G.state.ending && A.revisitEnding ? [{ label: 'Revisit the ending', detail: A.revisitDetail(), run: A.revisitEnding }] : []),
      { label: 'Begin a new set of runs', run: () => dialog('NEW GAME', 'Start again from run 01?', [`This replaces the current save in this browser, including ${A.room.keeps}. Export it first if you want to keep it.`], [
        { label: 'Begin again', run: () => { replaceSave(S.fresh()); startGame(true); } }, { label: 'Cancel', run: A.menu }
      ], A.menu) }
    ]);
  };

  // A new game or an import: nothing walks on or stays in hand from the old save.
  function replaceSave(state) { G.state = state; G.target = null; G.carrying = null; A.trails.reset(); A.save(); A.closeDialog(); }

  // Imports are size-capped and fully validated before they can replace the save.
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 20000) throw new Error('That file is too large to be a save.');
      const imported = S.validate(JSON.parse(await file.text()));
      dialog('IMPORT SAVE', `Resume run ${pad(imported.run)}?`, ['This replaces the active browser save. Export your current save first if you want to keep it.'], [
        { label: 'Import and resume', primary: true, run: () => { replaceSave(imported); resume(); } }, { label: 'Cancel', run: A.menu }
      ], A.menu);
    } catch (error) { dialog('IMPORT FAILED', 'This save could not be read.', [error.message, 'Your current game has not been changed.'], [{ label: 'Return to menu', run: A.menu }]); }
  });

  // Hides the title, shows the HUD, and (for a new game) opens the briefing.
  function startGame(intro) {
    if (A.blocked(G.state.player.x, G.state.player.y)) G.state.player = { ...S.entrance };
    G.started = true; $('journal').hidden = false; $('cover').hidden = true; $('hud').hidden = false; A.updateHUD(); A.save();
    if (!intro) return;
    const [title, paragraphs] = A.room.briefing(G.state);
    dialog(`RUN ${pad(G.state.run)} / ROOM ${A.room.id}`, title, [...paragraphs,
      '[Move with WASD or arrow keys. Press E near something to use it. Click or tap the floor to walk there.]'
    ], [leave(`Begin run ${pad(G.state.run)}`)]);
  }
  // Continue a loaded or imported save: finished games reopen the last screen,
  // and a run saved with an empty budget ends straight away.
  function resume() {
    startGame(false);
    if (G.state.finished) A.showEnding(); else A.endRunIfSpent();
  }
  $('start').addEventListener('click', () => {
    if (A.room.isNew(G.state)) startGame(true); else resume();
    if (G.loadWarning || !G.storageOK) A.toast(G.loadWarning || 'Browser saving is unavailable. Use Export save from the menu.');
  });
  $('help').addEventListener('click', A.menu); $('home').addEventListener('click', e => { e.preventDefault(); A.menu(); });
})();
