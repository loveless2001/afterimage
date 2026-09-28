# AFTERIMAGE

A small, original browser game about what survives a reset. You play seven runs in one isometric room. Each run starts fresh at the entrance with a small budget, and the room keeps what you change: lamps, notes on the wall, and what three residents think of you. They remember the room but never your face, unless a note tells them. From run 6 you decide what the room keeps. There are three endings and a secret one, and none is scored. A full playthrough takes about 25–40 minutes.

**Start with [docs/design-guidelines.md](docs/design-guidelines.md) for the current design and milestones, and [docs/design-pillars.md](docs/design-pillars.md) for the pillars every new idea is checked against.** [DESIGN.md](DESIGN.md) describes the retired Moth prologue and is kept for history.

**Play online: https://loveless2001.github.io/afterimage/** (saves stay in your browser).

**Field note: [The agent learned the judge](notes/the-agent-learned-the-judge.html)**. It covers the incident and the argument this room grew from: what happens when an agent knows a safety rule and still works around it, and why a reset may not stop the work. It is linked from the title screen and every ending.

[Research library](research/README.md): incident reports, four offline PDFs (kept locally, not in the repository), source provenance, a chronology, and fictional expansion notes collected on 7 September 2026.

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

Click-to-walk finds a route around shelves. The Field journal records what the room keeps and offers walking directions to named places. Walking and reading are free. Switching on a lamp costs budget, and lamps stay lit in every later run. At the notice hall you can post a note for 1 budget, building it from preset words (subject, verb, and an optional qualifier). Notes stay on the wall in every later run: this run's notes are blue, and older ones fade. When a run ends you can pin one note at the entrance, and the next run opens by reading it. Three residents live in the room: Wren at the desk, Juno by the lamps and Pell at the notice hall. The first talk with each resident costs 1 per run. Each is waiting for something before they trust you; talk to them to find out what. Once a resident trusts you, they ask three questions. Answer one with a note posted that run, then talk to them again; each answer teaches a new word for your notes. Each resident takes one answer a run, and a run takes two answers in all. Pinning a note that names a resident with the first word they taught you sends them on an errand as the next run starts (runs 2–5): Juno lights a lamp, Pell searches the lit stacks for old cards, and Wren waits at the door so first talks are free. The pin dialog says what each note would do, and a resident on an errand takes no answer that run. From run 6 the room turns to night, the residents gather at the desk, and the run log offers the last entry, which decides what the room keeps. The last run asks for it as it ends. Every ending can be revisited from its screen or the menu: this rewinds to the run where the last entry was written, with the budget it had left, and keeps everything the room has. After an ending, the two residents whose endings you passed over say what is still missing. The menu also switches the palette between auto, day and night. A run ends when its budget is spent, after the current dialog closes, or when you leave through the exit. The run log at the central desk records every run, as a ledger: one row per run, with errands and Wren's copies of your answers written between the lines. From run 2 a faint afterimage of each earlier run walks the route you took then, pausing where you stopped to use something; it is only a picture of the past and changes nothing. The room shows progress too: residents who trust you grow warmer, with a faint glow, and warmer still with each answer, a card floats above anyone with an open question (solid once a note you posted this run answers it), and the notice wall marks its top row of 12. The current objective always shows one next step. There are no timed decisions or reflex challenges. Reduced motion follows your browser/OS preference. All necessary audio clues have text equivalents.

## Saves and transfers

Progress saves automatically in the current browser when available. File-based pages, localhost ports, browsers, and machines may have separate storage. Private browsing or browser policy can also restrict persistence.

Use **Menu / help → Export save** to download a JSON save. On the other copy, use **Import save** and confirm replacement. A bad import leaves the current game intact. Export also works if automatic browser storage is unavailable. Keep a copy before clearing browser data.

Starting a new set of runs or importing a save replaces the active save only after confirmation. Normal play never deletes unrelated browser storage. This includes a save from the earlier Moth prologue, which is left untouched while the game starts fresh. The game uses one autosave slot.

## Files and development

- `DESIGN.md`: full creative and mechanical design, scope, larger story, and playtest questions.
- `docs/design-guidelines.md`: generic design guidelines for the next version (palette, world, UI, mechanics, milestones).
- `js/`: game modules, loaded in order as classic scripts by `index.html`. Each file name describes its role:
  - `game-content-tables-lamps-kit-residents-endings.js`: content tables (budget table, lamps, phrase kit, residents with their requests and questions, the words answers teach, endings and prerequisites) and read-only helpers.
  - `game-rules-state-transitions-and-save-validation.js`: pure `step(state, action)` rules and strict save validation.
  - `pathfinding-visibility-graph.js`: walking routes around shelves.
  - `game-context-world-layout-and-persistence.js`: shared `window.Afterimage` namespace, room layout, and browser saving.
  - `run-log-ledger-page-view.js`: the run log as a ledger table.
  - `afterimages-earlier-runs-trails-and-ghosts.js`: afterimages. Each run's path is sampled as you move and replayed as a faint figure in later runs. It is stored under its own key, outside the save, and cleared by a new game or an import.
  - `notice-board-and-pinned-card-views.js`: the paper views the notes are shown in: the wall of 24 holders, the card being written, and the entrance pin's cork board.
  - `notice-hall-note-builder-and-handoff-pin.js`: the notice hall, the three-step note builder, full-wall replacement, and the handoff pin.
  - `residents-dialogue-lines.js`, `resident-questions-dialogue-lines.js`, `residents-talk-and-trust.js`: authored resident lines and questions, talking, trust and answers, and where residents stand.
  - `endings-last-entry-secret-bench-and-screens.js`: the last entry, the secret bench, ending screens, and revisiting.
  - `errands-pinned-note-tables-and-helpers.js`, `errand-lines-previews-and-reports.js`: errands from the pinned note (rules, found cards, save checks) and their text in the pin dialog, the opening, talks and the journal.
  - `render-progress-cues-question-cards-and-wall-row.js`: in-room progress cues drawn over the finished frame: a card above a resident with an open question (solid once a note posted this run answers it) and the notice wall's top row of 12.
  - `playtest-debug-overlay.js`: open the game with `?debug` to see per-run timings, notes and answers for budget tuning. It is local only and sends nothing.
  - Other modules cover projection and shapes, dialog, HUD and journal, the palette, room interactions, the run-end transition, the menu and import/export, audio, input, and rendering (room objects, then the frame loop).
- `index.html`, `style.css`: playable browser interface.
- `notes/`: field notes linked from the game (a standalone page with no scripts or fonts from elsewhere). Published with the game.
- `launch-windows.cmd`: optional native Windows launch convenience.
- `serve-wsl.sh`: optional loopback server; Python 3 required only for this script.
- `tests/`: state tests and browser journey checks. Tests are development tools, not runtime dependencies.
- `VERIFICATION.md`: tested behavior and remaining limitations.

No package installation or build step is needed to play or edit the game. Refresh the browser after editing. For state tests, with Node installed:

```bash
node --test tests/*.test.cjs
```

Browser tests accept a preinstalled Playwright module; run `tests/browser.cjs` as described in its header. It runs both journeys: runs, notes and saves, then residents and endings. Playwright is not bundled into the game. Artwork is procedural and music is synthesized locally. No external art, fonts, game assets, AI endpoint, or analytics are requested.
