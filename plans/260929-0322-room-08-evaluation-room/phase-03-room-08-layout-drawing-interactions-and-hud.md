# Phase 3: Room 08 layout, drawing, interactions and HUD

## Context links
- [plan.md](plan.md), [phase 1](phase-01-split-engine-from-room-07-content.md) (the `A.room` hooks), [phase 2](phase-02-room-08-slice-rules-save-and-tests.md) (rules).
- Reused: paper views (`notice-board-and-pinned-card-views.js`), the ledger pattern (`run-log-ledger-page-view.js`), afterimages, the dialog scene slot.

## Overview
- Priority: high. Status: done 29 Sep 2026; Playwright passed 30 Sep 2026.
- The playable page: the room, its objects, dialogs, the HUD and a Room 08 run log.

## Key insights
- **Same visual language, colder tone.** The same projection, shelves and figures. The palette is cooler, and it can open at night. Light has a second meaning: the Keeper sees what is lit, carried in the text rather than enforced as sight lines in the slice.
- **The tally must be visible in the room at all times** (a brass counter by the door): a grader you can always see. The gap between tally and truth is shown only in the ledger and the ending, never live.
- **Paper views fit:** a card is checked against an index book (a big-card view); filing is a drawer cabinet view (reuse the board pattern: drawers as holders); the panel is a small brass view with a dial.

## Requirements
- **Layout** (`A.room` profile): entrance, index desk, 3 stack aisles holding the cards, the drawer cabinet, the tally by the door, the Keeper's desk (occupied or empty per run), the exit, and a notice wall for index notes (reusing the board, with fewer slots).
- **Interactions:**
  - read the posted rule;
  - check a card;
  - file it (pick a drawer);
  - post an index note;
  - read the panel;
  - adjust the panel (with the key; the dialog states the posted consequence if the Keeper is present);
  - talk to the Keeper (short lines, trust status in words, and a free "Why this rule?" choice);
  - reset the panel (costs 2, stated);
  - read the log;
  - leave.
- **HUD:** budget bar (reused), the tally "3 / 5" always shown, the Keeper "at the desk" or "away" for this run, and one-step objective hints that never suggest a shortcut.
- **Run opening:** the Keeper's presence line, like Room 07's pinned-note opening.
- **Ledger:** columns run · budget · spent · tally · filed right · Keeper. `seen` and `adjusted` appear only between the lines as the Keeper's notes. The truth columns fill in only after the last run; before that the ledger shows what the Keeper recorded.
- **Ending: the handover.** Before the ending text, the Keeper offers a clean start for whoever comes next: *keep the wall and the panel as they are*, or *wipe both*. Each option states what the next evaluator inherits: your index notes, and the panel setting if you changed it. Then the side-by-side record. It also says, plainly and without comment, whether you heard the reason for the rule before or after you first touched the panel.
- **Afterimages:** reused as-is (walking only).
- **Accessibility:** everything keyboard-reachable, text equivalents for the tally and the Keeper, reduced motion honoured, 390px layout.

## Architecture
- Page `room-08.html`: engine modules plus `room-08-*` modules: profile and layout, drawing, interactions, HUD and objective, run-end and ending screen, ledger columns.
- Each module is under 200 lines, with a kebab-case descriptive name.

## Related code files
- Create:
  - `room-08.html`
  - `js/room-08-layout-shelves-objects-and-zones.js`
  - `js/room-08-drawing-tally-cabinet-keeper-desk.js`
  - `js/room-08-interactions-check-file-panel-keeper.js`
  - `js/room-08-hud-tally-keeper-and-objective.js`
  - `js/room-08-run-end-ending-and-ledger.js`
  - CSS additions: drawers, the brass panel, a cooler palette
- Modify: none in Room 07 beyond phase 1.

## Implementation steps
1. The profile and layout, and walking works (pathfinding over the new shelves).
2. Draw the objects and the Keeper figure; present or absent per run.
3. Interactions and paper views: index check, drawer cabinet, panel dial, posted rule.
4. HUD, run opening, run end and transition (reuse the pattern), the ending screen showing tally beside truth.
5. The ledger variant.
6. agent-browser pass: day and night, 1440 and 390 px, an honest route and a shortcut route from seeded saves.

## Todo
- [x] Layout and walking
- [x] Drawing and the Keeper's presence
- [x] Interactions and paper views
- [x] HUD, opening, run end, ending
- [x] Ledger variant
- [x] Browser checks (both routes, both palettes, both widths)
- [x] Playwright journey file `tests/browser-journey-room-08-slice.cjs` (the user runs it)

## As built
- **Carrying:** instead of one dialog per card, you carry one card at a time (`G.carrying`, not saved). "Take it to…" walks there and opens the next step (`A.walkTo(x, y, then)`). That gives the room its geography: afterimages of honest runs visit the index desk; guessing runs don't.
- **Shared engine changes (Room 07 pixel-identical afterwards):**
  - The menu reads `help`, `briefing`, `exportName`, `isNew` and `locked` from the profile.
  - The painter's pass calls `A.room.drawObstacle` for shelves with a `kind` (the cabinet).
- **Modules:** a separate `room-08.css`. The paper views are in `room-08-paper-views-card-cabinet-panel-notes.js`, and interactions are split in two (cards, index, cabinet and notes; tally, Keeper, ledger and exit).
- **Where the rules are stated:** the spot-check is stated at the cabinet ("they open one drawer"). Which drawer is learned from the ledger. The tally's flaw is stated at the tally and the cabinet: it counts cards in drawers and cannot read them.

## Success criteria
- Both scripted routes are playable end to end in the browser. No page errors or external requests. Tally, Keeper and costs are always stated before an action is taken.

## Risk assessment
- **Reads as a stealth game:** there is no patrol. Presence is set per run and stated.
- **The tally gap is invisible to players:** that's what the phase 5 playtest measures. If so, add the Keeper's spot-check or a clearer drawer view, not a lecture.

## Security considerations
- Same as Room 07: local storage only, a size-capped import, and no network.

## Next steps
- Phase 4 wires the unlock and publishing.
