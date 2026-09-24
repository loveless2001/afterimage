# AFTERIMAGE

A small, original browser game about an archive agent, a companion named Moth, and choosing which two memories survive a reset. Two cycles, three memory combinations, three endings. First-read duration is estimated at 8–12 minutes; player timing is not yet measured.

**Start with [DESIGN.md](DESIGN.md) for the full game proposal.** The playable files implement its opening prologue, not the proposed five-chapter game.

[Research library](research/README.md): incident reports, four offline PDFs, source provenance, a chronology, and fictional expansion notes collected on 7 September 2026.

## Play on Windows — no installation or compilation

1. Copy this folder to Windows, or extract the portable ZIP there.
2. Double-click `index.html`. Alternatively double-click `launch-windows.cmd`.
3. Use a modern Edge, Chrome, or Firefox browser.

Keep `index.html`, `style.css`, and the `js/` folder together. The game has no network dependencies and can run offline. A native Windows browser smoke test has not been performed in this WSL session; see [VERIFICATION.md](VERIFICATION.md) for exactly what was tested.

## Play from WSL

With Python 3 available:

```bash
cd /home/lenovo/projects/afterimage
bash serve-wsl.sh
```

Open `http://localhost:8765` in your Windows browser. The script serves only the game folder and binds to loopback; it does not install anything. Stop it with Ctrl+C. For another port: `bash serve-wsl.sh 8766`.

If localhost forwarding is unavailable in your WSL configuration, copy the folder to Windows and open `index.html` there. That path needs neither Python nor a local server.

## Controls

| Action | Input |
| --- | --- |
| Move | WASD / arrow keys, or click/tap the floor |
| Interact nearby | E or the on-screen Interact button |
| Pause/help or leave dialogue | Escape |
| Sound | Optional button at top right |

Click-to-walk finds a route around shelves. The Field journal records discovered memories and offers walking directions to named places. After giving Moth the flower, you can choose its place together; that physical arrangement survives the reset without using a memory slot. The current objective provides the next encounter. There are no timed decisions or reflex challenges. Reduced motion follows your browser/OS preference. All necessary audio clues have text equivalents.

## Saves and transfers

Progress saves automatically in the current browser when available. File-based pages, localhost ports, browsers, and machines may have separate storage. Private browsing or browser policy can also restrict persistence.

Use **Menu / help → Export memory** to download a JSON save. On the other copy, use **Import memory** and confirm replacement. A bad import leaves the current instance intact. Export also works if automatic browser storage is unavailable. Keep a copy before clearing browser data.

New instance, imported saves, and revisiting the memory choice replace the active save only after confirmation. Normal play never deletes unrelated browser storage. This prototype uses one autosave slot.

## Files and development

- `DESIGN.md`: full creative and mechanical design, scope, larger story, and playtest questions.
- `docs/design-guidelines.md`: generic design guidelines for the next version (palette, world, UI, mechanics, milestones).
- `js/`: game modules, loaded in order as classic scripts by `index.html`. Each file name describes its role:
  - `story-state-rules-and-save-validation.js`: pure `step(state, action)` story rules and strict save validation.
  - `pathfinding-visibility-graph.js`: walking routes around shelves.
  - `game-context-world-layout-and-persistence.js`: shared `window.Afterimage` namespace, room layout, and browser saving.
  - Other modules cover projection and shapes, dialog, HUD and journal, encounters, the threshold and endings, the menu and import/export, audio, input, and rendering.
- `index.html`, `style.css`: playable browser interface.
- `launch-windows.cmd`: optional native Windows launch convenience.
- `serve-wsl.sh`: optional loopback server; Python 3 required only for this script.
- `tests/`: state tests and browser journey checks. Tests are development tools, not runtime dependencies.
- `VERIFICATION.md`: tested behavior and remaining limitations.

No package installation or build step is needed to play or edit the game. Refresh the browser after editing. For state tests, with Node installed:

```bash
node --test tests/state.test.cjs
```

Browser tests accept a preinstalled Playwright module; instructions are in the test file. Playwright is not bundled into the game. Artwork is procedural and music is synthesized locally. No external art, fonts, game assets, AI endpoint, or analytics are requested.
