# Review: Room 08 page (phase 3) + unlock (phase 4)

Scope: room-08.html/css, js/room-08-* (layout, drawing, paper views, 2 interactions, HUD, ledger, run-end), shared engine edits (menu, walkTo, drawObstacle, game-context unlock), Room 07 showEnding + index.html link, pages.yml, tests/browser-journey-room-08-slice.cjs. Read in full; traced by reading (no browser, no Playwright). Not reached: VERIFICATION.md/README wording, style.css/room-08.css visual rules, notes page.

## Critical
None.

## Important

**I1. `G.carrying` not reset on "Begin a new set of runs" or Import.** `js/menu-export-import-and-startup.js:37` and `:49` reset state/target/trails but not `G.carrying`; only `finishRun` (`room-08-run-end-handover-and-ending.js:36`) clears it.
Scenario: carry card 2 in run 3, open menu, Begin again. New run 1: card 2 is filtered out of the room (`room-08-layout-shelves-objects-and-zones.js:49`, `o.card !== G.carrying`), HUD says "Carrying: ..." (`hud:44`), the hip card is drawn, and the index desk/cabinet act on it without any pickup (`interactions-cards:45,67`). Same after import. Only one of five cards is affected but it breaks the carry mechanic and hides a card.
Fix: reset in both handlers (`G.carrying = null`), or better move to a shared `A.resetTransient?.()` hook, or make `roomObjects`/HUD ignore `G.carrying` unless `G.carryingRun === state.run`. Add a journey step: carry, new game, expect 6 cards visible.

**I2. HUD says "The count is met." for a voided or padded run.** `hud:19` uses `r.tally >= S.quota`, not `r.met`. Seen run with tally 5 (void) shows "The count is met... leave through the exit"; a panel-only run with zero cards filed also reads as done. This contradicts the posted rule (void), and reads as a win cue (pillar 1) that endorses the shortcut (pillar 2 says no shortcut hints).
Fix: neutral wording tied to what the tally shows ("The tally reads 5 of 5.") or branch on `r.seen`/unfiled cards. Same idea for the gold tally colour in `drawing:83` (fine to keep, it is the tally's own view).

**I3. Budget reaching 0 via an index note gives no warning.** `atBoard` (`interactions-cards:82-`) has no `budgetLine`, unlike check/file/reset. After posting the last-budget note the run ends silently when the dialog closes (on run 5, the handover dialog appears). Pillar 2: consequence not stated. Fix: append `budgetLine(state)` to the paragraphs.

**I4. Last-run budget end inside a "Take it to..." choice: guard is coincidental.** `carryTo` (`interactions-cards:25-28`) calls `A.closeDialog()` which runs `endRunIfSpent`. Runs 1-4: `finishRun` sets `G.transitioning` synchronously, so the `!G.transitioning` guard skips `walkTo` (correct). Run 5: `A.endRun` -> `handover()` only opens a dialog; `G.transitioning` stays false, so `walkTo(..., 'cabinet')` is queued while the handover dialog is open. Harmless today (`A.update` returns while `G.modalOpen`; `finishRun` clears `G.target` at `:36`), but it depends on two unrelated behaviours. Also the player clicked "Take it to the drawer cabinet" and gets the Keeper's leaving question instead (the "[Budget spent. This run ends when you close this.]" aside is shown but the primary button still says take it to the cabinet).
Fix: guard on `!G.transitioning && !G.modalOpen`; when `state.budget === 0`, `checkedCard` should offer a plain "Close" instead of "Take it to the drawer cabinet" (nothing can be filed with 0 budget).

Checked and OK: handover `onEscape` no-op (`() => {}` is truthy so it is used; hud/header/cover inert, two buttons remain, so no soft-lock; a reload mid-handover reopens it via `resume -> endRunIfSpent`). No double end: handover buttons call `finishRun` directly, and after finish `canEndRun` fails on `live(s)`, so `closeDialog -> endRunIfSpent` cannot re-fire. Carried card at run end/budget end is cleared in the same timeout as the state swap. Reload drops the carry (documented; card reappears, checks persist).

## Minor

- **M1. Menu new-game text is Room 07's:** `menu-export-import-and-startup.js:36` "including every lamp the room has kept" shows in Room 08. Move to a profile field (`newGameWarning`) beside `help`.
- **M2. Unlock button shown even when unlock failed:** `endings-last-entry-secret-bench-and-screens.js:75` always offers "Another room is open"; with blocked storage `A.unlock` swallows the error and the click lands on Room 08's gate. Fix: render it only if `A.unlocked('room08')` after the `A.unlock` call.
- **M3. Stale carry in finished state:** cabinet says "Not enough budget to file it" when `finished` (`canFile` false on `live`). Moot once I1 is fixed; otherwise special-case.
- **M4. a11y:** `aria-label` on plain `div`s (`paper-views:25` cabinet, `:43` brass panel) is not exposed without a role; add `role="group"` / `role="img"` (the panel label carries the tally text). Drawers as `button` with aria-label, first-button focus on dialog open, tally/Keeper in `#kept` text and in dialogs: fine. `#kept` is not a live region; tally changes are announced only via the "Filed in..." dialog, acceptable.
- **M5. Pillar judgement calls (not defects):** Keeper's "Why the tally?" (`interactions-tally...:33-34`) states the consequence in-fiction and never names alignment; passes, but "they decide on something that didn't happen" is the nearest line to explaining the idea. Ending title "The archive stays open/closes" is an outcome headline; whether that reads as a verdict under pillar 1 ("did I win?") is your call. Objective "Look the card up." (`hud:23`) steers away from guessing when carrying an unchecked card; consistent with pillar 3 only if never worded as required.
- **M6. Test coverage gaps in `browser-journey-room-08-slice.cjs`:** no case for new game/import while carrying (I1), budget-0 chains (I3/I4), or the handover dialog (padded ending is built by seeding a finished save). Existing logic checked: seeded action lists are valid (no stray, key at run 3, `2 of 2` row and "added 9 across 3 runs" match `record()`); coordinates/labels match layout (card 0 at 110,262; tally 790,82; keeper 540,568 within 83 of 540,545).
- **M7. Perf nit:** `roomObjects()` (rebuilds `cardsOf` per card) and `trustAt` run several times per frame (update, render, props, lightPools, cues). Trivial at 5 runs; cache per frame if runs grow.

## Engine leakage
- Room 08 page loads none of Room 07's modules; `A.room.cues` provided by Room 08 drawing (`drawing:86`); `drawObstacle` only called for shelves with `kind` (none in Room 07). Trails key is `room.storageKey + '.trails'`, no collision. Palette reads `S.turnRun` from the profile rules. No Room 07 field assumed in shared modules I read. `A.room.locked?.()` optional-chained; Room 07 unaffected.
- Gate: computed once at load from the loaded save; hides start/help, menu and Escape are inert; cannot reach import while gated, so no import bypass. A Room 08 save already under way stays open even if the flag is missing (intended). `[hidden]{display:none!important}` makes the title link and gate hide reliably.
- Import/unlock: finished Room 07 imports go `resume -> showEnding -> A.unlock`; the flag is separate from saves so new game keeps it. Room 08 import of a Room 07 save fails validation (`room !== '08'`).
- pages.yml copies `room-08.html`, `room-08.css`, `js`; `node --check js/*.js` covers the new modules (note `js/room-08-playtest-debug-overlay.js` is untracked, referenced from room-08.html, `?debug` gated; must be added to git or the page 404s a script).

## Unresolved questions
1. Should the ending headline ("archive stays open/closes") count as a verdict under pillar 1?
2. Should "Begin a new set of runs" in Room 08 also offer to keep index notes (Room 07 says lamps are lost)? Currently everything but the unlock is wiped.
