# Code Review: Milestone 3 — Notes, Phrase Kit, Handoff Pin

Scope: uncommitted diff vs HEAD (4c5e9ec) + new `js/notice-hall-note-builder-and-handoff-pin.js`. Static review only, no files edited, no browser/Playwright launched (per instructions). M2 already reviewed run/budget logic (`plans/reports/code-reviewer-260925-0322-runs-budget-review.md`) — this covers only what's new for notes.

Verified independently: `node --check` on all 6 changed `js/` files (pass), `node --test tests/state.test.cjs` (12/12 pass, confirmed live).

## Overall Assessment

Rules layer (`game-rules-state-transitions-and-save-validation.js`) is solid: `validate()` and `step()` agree on every scenario I traced (pinned-vs-taken-down, pin-after-finished-run-7, slot reuse, M2 legacy load). Handoff re-entrancy is correctly guarded by the existing `G.transitioning`/`G.modalOpen` flags — traced all three paths (budget auto-end, exit-cancel, import/resume of a zero-budget save with wall notes) and found no double-end, no stuck modal. Builder navigation has no dead ends. `tests/browser.cjs` is well-built: the one place that could hang (`close()`'s `waitFor({state:'hidden'})` racing against the auto-reopened handoff dialog) is correctly avoided by using a direct heading-wait instead, with a comment explaining why. No real bugs found. One dead-but-harmless code branch and one continuity note on an M2-flagged gap.

## Critical Issues
None.

## High Priority Findings
None.

## Medium Priority Improvements

**M1. `showPinned`'s `finished` branch is unreachable through the shipped UI — dead code, not a bug.** Style/completeness, not a real bug.
`js/notice-hall-note-builder-and-handoff-pin.js:77` — `const by = state.finished ? state.run : state.run - 1;` implies `state.pinned` can be non-null when `state.finished`. But `game-rules-state-transitions-and-save-validation.js:74-78` always does `next.pinned = pin` on `EndRun`, including the run-7 (last-run) branch, and the UI (`run-end-transition-and-final-screen.js:12`) only offers `chooseHandoff` when `state.run < S.runCount`, so `finishRun` always passes `pin: null` for the last run. Net effect: finishing run 7 always nulls `pinned`, so `state.finished && state.pinned !== null` can only occur via a hand-edited/future-tooling import (which `validate()` correctly permits — `notes[pinned].run > (v.finished ? v.run : v.run-1)`, line ~119). Confirmed via `tests/state.test.cjs:129` (`'each run end replaces the pin'`) that resetting the pin on every `EndRun` is the intended, tested behavior — so this is not a validate/step mismatch, just an unreachable-via-play branch. No fix needed unless a future milestone wants "what was pinned entering the last run" to survive to the ending screen, in which case `EndRun` would need to skip the pin overwrite on the `s.run === runCount` branch.

**M2. Import/resume-of-zero-budget-with-notes deepens an M2-flagged fragile path; still untested.** Continuity note, not a new bug.
M2's review (M2 finding "M2") already flagged: importing mid-game (`G.started` already true) a `budget:0, finished:false` save triggers a re-entrant `closeDialog → endRunIfSpent → endRun` chain inside the "Import and resume" click handler (`js/menu-export-import-and-startup.js:37`), before `resume()` (line 55-58) even runs. M3 adds one more layer: if that imported save also has wall notes and isn't the last run, `endRun` (`run-end-transition-and-final-screen.js:12`) now calls `A.chooseHandoff`, which opens a dialog *inside* the nested `closeDialog()` call, before `resume()`'s own `startGame(false)`/`endRunIfSpent()` runs. I traced this by hand: `resume()`'s later `A.endRunIfSpent()` call correctly no-ops because `G.modalOpen` is already `true` (the handoff dialog) by then. No double-end, no bug — but `tests/browser.cjs`'s only import test (`:153-165`) imports a non-zero-budget save, so neither the M2 gap nor this new wrinkle is exercised by the suite. Worth a regression test if this path matters (import a `budget:0` save with `notes` on the wall while `G.started` is already `true`).

## Low Priority Suggestions

**L1.** `js/notice-hall-note-builder-and-handoff-pin.js:45-56` `confirm()` — Escape and the "Cancel" button both go straight to `A.closeDialog` (abandon the whole note), while every other builder step's Escape mirrors a "Back" button (one step back). This is actually consistent with what's *visibly offered* at each step (Confirm shows "Cancel", not "Back"), so not flagging as a real inconsistency — just noting the asymmetry in case a future pass wants Escape-always-goes-back semantics.

**L2.** `js/render-archive-room-agents-and-frame-loop.js:82-89` `card(x, y, z, current, alongX = true)` — the `alongX = false` branch is never exercised (both call sites pass `true`/default). Harmless, likely forward-looking for a differently-oriented card (e.g. the pin-board card at `render-archive-room-agents-and-frame-loop.js:46`). No action needed.

## Positive Observations

- Slot→wall-row mapping (`render-archive-room-agents-and-frame-loop.js:76-83`, `z = 79 - Math.floor(slot/12)*34`) verified correct against `project()`'s z-axis convention (higher z = higher on screen) — slot 0-11 (posted first) do render in the visually top row, matching the design's "As built (M3): the wall fills from the top row" note. I initially misread this as inverted; double-checking `project()` confirmed it's right.
- `validate()`'s per-run spending reconciliation (`game-rules-state-transitions-and-save-validation.js:121-125`) correctly counts taken-down notes (`slot:null`) toward their original run's spending, including same-run post-then-takedown chains (verified by hand-tracing two Post actions in one run where the second replaces the first) — matches the plan's stated invariant exactly.
- `takeDown`/`chooseHandoff` note-selection lists correctly exclude notes taken down earlier in the same run (`onWall()` filters by `slot !== null`), so a just-replaced note can never be offered as the handoff pin.
- `tests/browser.cjs:105-113` — the `p.keyboard.press('Escape')` + heading-wait (instead of the `close()` helper) for the budget-exhausted → auto-handoff transition is exactly right, and the accompanying comment explains why; this is the one spot that would otherwise hang.
- `tests/browser.cjs` wall-note button matching (`:92`, `/^west stacks · check · first/`) correctly uses a prefix regex rather than `exact: true`, sidestepping the pre-existing `choice.detail` text getting concatenated into the button's accessible name (`dialog-modal-and-focus-trap.js:22`).
- All 6 changed `js/` files stay under 200 lines (new file: 83 lines); kebab-case, self-documenting names; comments are accurate and explain the "why" (e.g. the `G.transitioning` ordering comment).
- No stray TODO/FIXME markers.

## Metrics
- `node --check`: 6/6 changed files pass.
- State tests: 12/12 pass (verified live).
- Browser tests: not run (per instructions; user will run).
- File sizes: all under 200-line cap (plan's stated success criterion).

## Unresolved Questions
1. Is M1 (pin not surviving the run-7 finish) intentional, or should a future milestone preserve "what was pinned entering the last run" through to the ending screen? Current behavior is internally consistent and tested (`'each run end replaces the pin'`), so treating as intentional unless design says otherwise.
2. Should the M2-flagged import-mid-game-with-zero-budget path (now with the handoff dialog layered on top) get an explicit regression test, or is it accepted as a known-safe-but-untested edge case for another milestone?
