# Phase 02 — Browser module split

**Priority:** high. **Status:** done. The code review found no behavior drift; the browser journey passed.

## Architecture
- `window.Afterimage` is the namespace. Each file is an IIFE that registers functions on it.
- `Afterimage.game` holds mutable runtime values: state, started, modalOpen, transitioning, target, nearby, time, keys and the view.
- Calls between modules go through `A.fn()` and resolve at call time, so the load order only matters for top-level setup.

## Load order (index.html)

| # | File | Role |
|---|---|---|
| 1 | pathfinding-visibility-graph | walking routes |
| 2–3 | story-state-rules-and-save-validation | story rules and save checking (single file) |
| 4 | game-context-world-layout-and-persistence | namespace, DOM refs, shelves/objects, save/load, toast |
| 5 | iso-projection-and-canvas-shapes | project/unproject/resize, polygon/line/box/label/ring |
| 6 | dialog-modal-and-focus-trap | dialog, closeDialog, leave |
| 7 | hud-objective-and-field-journal | objective, updateHUD, journal |
| 8 | encounters-moth-flower-terminals | interact, flower scenes, talkMoth |
| 9 | threshold-memory-release-and-endings | threshold, chooseMemories, reset, final choice, endings |
| 10 | menu-export-import-and-startup | menu, export/import, startGame, header buttons |
| 11 | audio-drone-and-four-note-motif | setSound, playNotes |
| 12 | input-movement-and-collision | keys, pointer, walkTo, blocked, update |
| 13 | render-archive-room-and-agents | draw shelf/agent/flower/object, render, frame loop |

## Success
- The browser journey test passes, with only the require path changed.
