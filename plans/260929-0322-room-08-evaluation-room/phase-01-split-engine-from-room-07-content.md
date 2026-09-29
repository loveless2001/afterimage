# Phase 1: split the engine from Room 07's content

## Context links
- [plan.md](plan.md); `index.html` script order; `README.md` module list.

## Overview
- Priority: high (blocks phases 3–4). Status: done 29 Sep 2026; Playwright passed (user).
- Move Room 07's layout and room-specific drawing out of shared modules so a second page can load the same engine with its own room. **Behaviour must not change.**

## Key insights
- Already room-agnostic: `pathfinding-visibility-graph`, `iso-projection-and-canvas-shapes`, `dialog-modal-and-focus-trap`, `palette-day-night-theme`, `audio-drone-and-four-note-motif`, `input-movement-and-collision` (only needs `A.shelves`, `A.roomObjects`, `A.zone`), `notice-board-and-pinned-card-views`, `afterimages-earlier-runs-trails-and-ghosts`.
- Mixed engine and content, so they need splitting:
  - `game-context-world-layout-and-persistence`: namespace and saving, plus Room 07's shelves, objects and zones.
  - `render-frame-loop-lighting-and-night`: floor, painter's pass, night and cues, plus Room 07's notice wall, lamp pools and alcove.
  - `render-room-objects-and-characters`: figures, shelves and the desk, plus Room 07's object types and props.
  - `menu-export-import-and-startup`: generic apart from storage keys and texts.
- Room 07-only: content tables, rules, errands, residents, questions, endings, notice hall, room interactions, HUD objective, run-end transition, ledger columns.
- The afterimage storage key is hard-coded (`afterimage.v2.trails`). Derive it from the room's storage key.

## Requirements
- Functional: Room 07 is identical: same saves (`afterimage.v2`), same trails, same visuals.
- Non-functional: every file stays under 200 lines; kebab-case descriptive names; no build step; classic scripts from `file://`.

## Architecture
- `A.room` is the room profile, set by a small per-room module loaded first. It holds `id`, `storageKey`, `legacyKey?`, `shelves`, `fixedObjects`, `zone(p)`, `roomObjects()`, and draw hooks `backdrop(state)`, `lightPools(state, strength)` and `object(o)`.
- The engine reads only `A.room.*`. Existing names (`A.shelves`, `A.roomObjects`, `A.zone`) stay as aliases, so call sites don't churn.
- The frame loop calls `A.room.backdrop` (Room 07: the notice wall), `A.room.lightPools` and `A.room.object`. It keeps floor, walls, painter's sort, dust, vignette, night, afterimages, the player outline and cues.

## Related code files
- Create:
  - `js/room-07-layout-shelves-objects-and-zones.js`: profile, layout, zones, `roomObjects`.
  - `js/room-07-drawing-notice-wall-lamps-pin-bench-and-props.js`: Room 07 object and backdrop drawing, moved out of the render modules.
- Modify: `game-context-world-layout-and-persistence.js` (keep namespace and persistence; rename if the name stops fitting), `render-frame-loop-lighting-and-night.js`, `render-room-objects-and-characters.js`, `afterimages-earlier-runs-trails-and-ghosts.js` (key), `index.html` (order), README module list.
- Delete: none.

## Implementation steps
1. Add the Room 07 profile module. Move shelves, fixed objects, zones and `roomObjects` there, and alias `A.shelves` and the rest.
2. Move Room 07's object drawing (notice wall, lamps, pin, terminal, gate, bench, resident props and warmth colours) into the Room 07 drawing module. Keep `agent`, `shelf`, `desk`, `hiddenAt`, `afterimage` and `agentGhost` in the engine render module.
3. Frame loop: replace the direct Room 07 calls with the `A.room` hooks.
4. Afterimages key: `A.room.storageKey + '.trails'`, which equals the old key for Room 07.
5. Update the `index.html` order and README; `node --check` and state tests; agent-browser comparison screenshots of Room 07 before and after (day, night, the board).
6. Ask the user to run the Playwright journeys.

## Todo
- [x] Room 07 profile module
- [x] Room 07 drawing module
- [x] Frame loop hooks
- [x] Trails key derived from the room
- [x] Script order and README
- [x] Before and after screenshots match (ImageMagick AE 0 on 6 seeded saves: day, night, dark scheme, board, finished, spent); state tests 36/36
- [x] Playwright passed (user)

## As built
- `window.AfterimageRoom` (the profile) loads after the rules and before `game-context-namespace-runtime-and-persistence.js` (renamed from `game-context-world-layout-and-persistence.js`), which exposes it as `A.room` and keeps `A.shelves`, `A.fixedObjects`, `A.roomObjects`, `A.zone` as aliases.
- Profile fields: `id`, `title` (the floor label), `rules` (the state API, `A.S`), `storageKey`, `legacyKey`, `shelves`, `fixedObjects`, `roomObjects()`, `zone(p)`.
- Hooks added later by room modules: `backdrop(state, floor)`, `lightPools(state, strength)`, `drawObject(o)`, `onDesk(desk)`, `cues(state)`. Room 07 also puts `slotAt` there for its cues.
- Shared drawing keeps shelf, desk, the gate and terminal (furniture any room can use), card, figures, outlines and afterimages. Rooms add figures through `A.drawRoom.looks` and `props`. `A.lightPool` moved to the shape primitives.

## Success criteria
- No visible or behavioural difference in Room 07. Existing saves and trails load. All tests pass. No module over 200 lines.

## Risk assessment
- **Script-order breakage** (a hook called before it is defined): keep hooks runtime-only (called inside functions) and test on `file://`.
- **Subtle drawing-order changes:** use pixel-compare screenshots from agent-browser at fixed seeds.

## Security considerations
- None new. Storage stays local, and keys don't change for Room 07.

## Next steps
- Phase 3 builds Room 08's profile against these hooks.
