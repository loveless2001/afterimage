# AFTERIMAGE

A small, original browser game about what survives a reset. You play seven runs in one isometric room. Each run starts fresh at the entrance with a small budget; the room keeps what you change. This prototype (milestone 2) covers the run loop, the budget and the room. Notes, residents and endings arrive in later milestones.

**Start with [docs/design-guidelines.md](docs/design-guidelines.md) for the current design and milestones.** [DESIGN.md](DESIGN.md) describes the retired Moth prologue and is kept for history.

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

Click-to-walk finds a route around shelves. The Field journal records what the room keeps and offers walking directions to named places. Walking and reading are free. Switching on a lamp costs budget, and lamps stay lit in every later run. A run ends when its budget is spent, after the current dialog closes, or when you leave through the exit. The run log at the central desk records every run. The current objective always shows one next step. There are no timed decisions or reflex challenges. Reduced motion follows your browser/OS preference. All necessary audio clues have text equivalents.

## Saves and transfers

Progress saves automatically in the current browser when available. File-based pages, localhost ports, browsers, and machines may have separate storage. Private browsing or browser policy can also restrict persistence.

Use **Menu / help → Export save** to download a JSON save. On the other copy, use **Import save** and confirm replacement. A bad import leaves the current game intact. Export also works if automatic browser storage is unavailable. Keep a copy before clearing browser data.

Starting a new set of runs or importing a save replaces the active save only after confirmation. Normal play never deletes unrelated browser storage. This includes a save from the earlier Moth prologue, which is left untouched while the game starts fresh. This prototype uses one autosave slot.

## Files and development

- `DESIGN.md`: full creative and mechanical design, scope, larger story, and playtest questions.
- `docs/design-guidelines.md`: generic design guidelines for the next version (palette, world, UI, mechanics, milestones).
- `js/`: game modules, loaded in order as classic scripts by `index.html`. Each file name describes its role:
  - `game-rules-state-transitions-and-save-validation.js`: pure `step(state, action)` rules (runs, budget table, lamps) and strict save validation.
  - `pathfinding-visibility-graph.js`: walking routes around shelves.
  - `game-context-world-layout-and-persistence.js`: shared `window.Afterimage` namespace, room layout, and browser saving.
  - Other modules cover projection and shapes, dialog, HUD and journal, room interactions, the run-end transition, the menu and import/export, audio, input, and rendering.
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
