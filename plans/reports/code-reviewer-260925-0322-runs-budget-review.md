# Code Review: Milestone 2 — Runs, Budget, New Room

Reviewer: code-reviewer subagent. Scope: uncommitted diff vs HEAD (a89efcb). Static review only, no files edited, no browser launched (per instructions). Verified `node --check` on all new/modified modules and `node --test tests/state.test.cjs` (8/8 pass) independently. Also fuzz-tested `step()`+`validate()` over 3583 reachable states (0 failures, exact roundtrip) and 7 targeted mutation cases (all correctly rejected) — see commands below if reproduction needed.

## Scope
- Files reviewed: all files in `git diff --stat HEAD` (16 files) plus new `js/game-rules-state-transitions-and-save-validation.js`, `js/room-interactions-lamps-log-hall-exit.js`, `js/run-end-transition-and-final-screen.js`, plus `js/iso-projection-and-canvas-shapes.js` (unmodified, read for context), `js/audio-drone-and-four-note-motif.js` (unmodified, read for §6.2/§8 audio-cue check).
- ~1067 LOC across `js/` + `index.html` + `tests/`. All files under 200 lines (max: render, 116 lines).
- Plan: `plans/260925-0322-runs-budget-and-new-room-layout/plan.md` + phase-01 + phase-02. Both phases marked "done" / "done, pending the browser run" — accurate; the only remaining checklist item is the human-run browser journey, which is explicitly out of scope for this review per the task brief.

## Overall Assessment
Rules/validation layer (`game-rules-state-transitions-and-save-validation.js`) is well-built: pure `step`, no shared references between input/output (tested), `Object.hasOwn` used correctly for the one untrusted-key lookup that matters (`lampCost`), and the per-run spending cross-check is airtight — confirmed by fuzzing 3583 reachable states (0 validate failures, exact roundtrip) and 7 hand-picked invalid mutations (all rejected with the right message). Run-end re-entrancy is correctly guarded by the `G.transitioning` flag; I could not construct a double-end, a skipped end, or a mid-dialog end. Found one real design-guideline miss (mobile budget bar not hidden) and one fragile-but-currently-safe code path (import-while-in-game of an already-zero-budget save). No stale ids/classes from the retired story game found in JS/HTML/CSS. Test files are logically sound; coordinates in `tests/browser.cjs` line up with actual object positions within the 83px interaction radius.

## Critical Issues
None found.

## High Priority Findings
None found. (The mobile budget-bar gap below is a confirmed guideline miss but purely cosmetic/non-blocking, so rated Medium.)

## Medium Priority Improvements

**M1. Mobile budget bar is never hidden — design §4 requirement unmet.** Real bug (spec compliance), not style.
`style.css:1` — `#budget-bar` rule and its variants (`i`, `i.spent`, `.low i:not(.spent)`) have no override anywhere, including inside `@media(max-width:520px){...}` (checked programmatically: zero occurrences of `budget-bar` inside that block). Design guidelines §4: "Mobile (≤520px): the panel shrinks to 127px, the footer hints are hidden, and **the budget bar shows the number only**." Panel-shrink (127px) and footer-hint-hiding are both correctly implemented; only the segmented-bar-hide is missing. `#budget-count` (the numeric readout) is always shown regardless, so the user-visible effect is just that the segment bar stays visible and un-collapsed at narrow widths, cluttering the panel — not a functional break. Fix: add `#budget-bar{display:none}` (or similar) inside the existing `@media(max-width:520px)` block.

**M2. Fragile re-entrant call chain when importing a zero-budget-unfinished save while already in-game.** Real edge case, currently safe by luck of ordering rather than by design, untested.
Trace: `menu-export-import-and-startup.js:37` (`Import and resume` handler) does `G.state = imported; A.save(); A.closeDialog(); resume();`. If `G.started` is already `true` (importing mid-game, not from the title screen) and the imported save has `budget === 0, finished === false` (a legitimate, `validate()`-accepted state — e.g. exported right after the last lamp of a run is lit but before the confirmation dialog is closed), then:
- `closeDialog()` (`dialog-modal-and-focus-trap.js:31-36`) unconditionally calls `A.endRunIfSpent()` at its end (line 35). This fires immediately on the *just-imported* state, inside the click handler, before `resume()` even runs.
- That triggers `A.endRun('budget')` (`run-end-transition-and-final-screen.js:9-23`), which sets `G.transitioning = true` and calls `A.closeDialog()` again recursively (harmless — everything it touches is already reset/null) and schedules the real transition via `setTimeout`.
- Control returns to the import handler, which then calls `resume()` → `startGame(false)` (redundant `A.save()`/`A.updateHUD()` on the *stale pre-transition* `G.state`, overwritten ~650ms later by the timeout) → `A.endRunIfSpent()` again, this time correctly no-op'd because `G.transitioning` is now `true`.

Net effect: no double-end, no corrupted save (confirmed by trace, not just assumption — the second `endRunIfSpent` call is short-circuited before `S.canEndRun` is even evaluated a second time). But it is two synchronous `A.save()` calls plus a recursive `closeDialog()` call that only doesn't misbehave because of one shared boolean flag with no comment at the call site explaining why it's needed for *this* path (the existing comment on `run-end-transition-and-final-screen.js:12` only documents the closeDialog-inside-endRun case, not the resume()-after-import case). `tests/browser.cjs`'s import test (line 118-130) only imports a mid-run save with budget 12 (untouched), so this path is unexercised. Recommend either a regression test for "import a zero-budget unfinished save while already started" or a defensive early-return in the import handler when `G.state.budget === 0 && !G.state.finished` (call `resume()` only, skip the manual `closeDialog()`, since `resume()`'s own `endRunIfSpent()` call already covers it — mirrors how the title-screen path already works).

## Low Priority Suggestions

**L1.** `Object.keys(S.lamps).length` is recomputed inline in three places (`room-interactions-lamps-log-hall-exit.js:43`, `run-end-transition-and-final-screen.js:21,33`) instead of reusing the module-level `lampCount` constant already cached in `hud-objective-and-field-journal.js:7`. DRY nit, no behavior difference (4 lamps, cheap to recompute) — not worth a shared export unless a fourth call site appears.

**L2.** Forward-looking maintainability risk, not a current bug: the "never end a run mid-dialog" guarantee depends entirely on every future budget-spending choice re-invoking `A.dialog(...)` instead of `A.closeDialog()` before the run can end (see `room-interactions-lamps-log-hall-exit.js:29-32`, where the `Light` action's `run:` callback opens a *new* dialog rather than closing). This is correct today (the only spender is lamps) but nothing enforces the invariant structurally — M3's notes/residents spending paths will need to follow the same pattern by convention only. Worth a one-line comment in `game-rules-state-transitions-and-save-validation.js` or the design doc calling this out for the next milestone's implementer.

**L3.** `style.css` eyebrow order: implementation renders `"ROOM 07 / RUN 01"` (`index.html:18`, static `ROOM 07` + `<span id="run">/ RUN 01</span>`), while `docs/design-guidelines.md` §4 literally shows `` `RUN 03 / ROOM 07` `` (RUN first). The milestone's own `phase-02-room-hud-and-run-transition.md:17` documents the flipped order as a deliberate choice ("Eyebrow: `ROOM 07 / RUN 03`"), so the code matches its immediate spec — just flagging the drift from the parent design doc for awareness, not a code defect.

**L4.** Design §6.2/§8 low-budget audio cue ("an extra oscillator at 55 Hz that fades in" when budget ≤25%) is not implemented in `js/audio-drone-and-four-note-motif.js`. This file is untouched by this diff (not in `git diff --stat`), so it's a pre-existing gap rather than a milestone-2 regression — flagging for completeness since §6.2 is in the review's focus list.

**L5.** Import size cap is `file.size > 20000` bytes (`menu-export-import-and-startup.js:34`) vs design's "over 20KB" (arguably 20 × 1024 = 20480). Trivial, stricter-than-spec, not worth changing.

## Positive Observations
- `validate()` correctly uses `Object.hasOwn` for the one place an attacker-controlled string indexes into a plain object (`lampCost`), and `lampKeys.includes(...)` elsewhere (array membership, inherently prototype-safe). Confirmed against `__proto__`/`toString`/`constructor` via `state.test.cjs:22` and independently via fuzzing.
- The per-run spending cross-check (`game-rules-state-transitions-and-save-validation.js:81-85`) is the most subtle piece of this milestone and it's correct: verified analytically and empirically (3583 reachable states, 0 failures; 7/7 targeted invalid mutations correctly rejected).
- Run-end sequencing (`endRun` → `closeDialog` → `endRunIfSpent`, guarded by `G.transitioning`) correctly prevents ending mid-dialog even though the "spend to zero" path re-opens a confirmation dialog from inside a choice callback rather than closing first — this is the right pattern and `tests/browser.cjs:88-91` explicitly exercises and asserts it (`'the run does not end mid-dialog'`).
- No stale ids/classes from the retired story game (`memory`, `moth`, `cycle`, `relay`, `threshold`-as-ending) found anywhere in `js/`, `index.html`, or `style.css`; the CSS rename (`.memory-panel`→`.budget-panel`, `.memory`→`.kept-item`, `#memory-note`→`#panel-note`) is complete with no orphaned selectors. The one `prologue.v1`/`cycle` reference left is the intentional legacy-save-detection test fixture (`tests/browser.cjs:119`), correctly isolated from live game state.
- `tests/browser.cjs` coordinates all resolve to the intended nearest object within the 83px interaction radius (checked all 7 `lightAt`/`walk`/`interact` call sites against `A.objects` positions in `game-context-world-layout-and-persistence.js`); the `screen()` helper is an exact port of the in-game `resize()`/`project()` math (including the narrow-viewport branch), so click coordinates should land correctly.
- Docs (`README.md`, `VERIFICATION.md`, `DESIGN.md` banner) were updated consistently with the retirement; no leftover Moth/memory-slot language in player-facing copy besides the (intentional, unrelated) wordmark tagline.

## Recommended Actions
1. (Medium) Add a `@media(max-width:520px){#budget-bar{display:none}}`-style rule to `style.css` to satisfy design §4's "budget bar shows the number only" on mobile.
2. (Medium) Either add a browser-test case for "import a zero-budget-unfinished save while already started," or simplify `menu-export-import-and-startup.js:37` to not call `A.closeDialog()` before `resume()` when the imported state might already need to auto-end (let `resume()`'s own `endRunIfSpent()` be the single source of truth, as it already is for the title-screen import path).
3. (Low) One-line comment noting the "spend must reopen a dialog, not close it" invariant, for M3 implementers.
4. (Low, optional) Dedupe `Object.keys(S.lamps).length` call sites.

## Metrics
- `node --check`: pass on all reviewed modules.
- `node --test tests/state.test.cjs`: 8/8 pass (verified independently).
- Fuzz: 3583 reachable states via `step()`, 0 `validate()` mismatches; 7/7 invalid mutations correctly rejected.
- Files >200 lines: 0.
- Linting: none configured/run (no lint script in repo); no syntax errors.

## Unresolved Questions
1. Is the "budget bar shows number only" mobile requirement (M1) intentional deferral, or should it block this milestone? Plan's phase-02 doesn't call it out explicitly (only design-guidelines.md §4 does), so it may have been missed rather than deferred.
2. Is the import-while-in-game re-entrancy path (M2) worth a regression test now, or acceptable risk given M3 will touch this file anyway?
3. Should the 55 Hz low-budget audio cue (L4) be tracked as a follow-up now, or is audio explicitly out of scope until a later milestone (not stated in plan.md's decisions)?
