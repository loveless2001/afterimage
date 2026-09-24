# Code Review: engine-split-plain-js-rules refactor

Date: 2026-09-25. Reviewer: code-reviewer subagent. Scope: uncommitted working tree vs HEAD (5c3ae43).

## Scope
- Reviewed: all 12 `js/*.js` modules (808 lines total), `index.html` script tags, `tests/state.test.cjs`, `tests/browser.cjs`, `README.md`/`DESIGN.md` diffs, `VERIFICATION.md` (unchanged), plan files under `plans/260925-0307-engine-split-plain-js-rules/`.
- Baseline: `git show HEAD:game.js` (507 lines), `git show HEAD:state.js` (131 lines), `git show HEAD:core.bend` (112 lines).
- Verified independently: `node --check` on all 12 modules (pass), `node --test tests/state.test.cjs` (8/8 pass), no `node_modules`/lint config present.
- Did not run `tests/browser.cjs` (needs Playwright + browser; skipped per "no heavy processes" env constraint — this was already noted as unverified by the requester too since it only needs the require-path change).

## Overall Assessment
Refactor is behavior-preserving. Traced every `focus` item in the brief by hand against the old `game.js`/`state.js`; found no functional regressions. `step()` rules match the `core.bend` table exactly (Meet/Give/Place/Acquire/Reset/Restore/Reunite/Open/Finish/Replay), `validate()` is a byte-for-byte port, and independent string-literal diffing confirms only Bend-internal artifacts were removed (see below) — no user-facing text drifted. All modules are well under the 200-line cap (max 110, `story-state-rules-and-save-validation.js`). Main gaps are process/doc hygiene, not code: `VERIFICATION.md` wasn't updated despite the plan listing it, and the plan/phase files still say "pending" though the work (including file deletions) is done in the working tree.

## Critical Issues
None found. No XSS surface (grep confirms zero `innerHTML`/`eval`/`new Function` usage — same as original, everything goes through `textContent`), no injection paths in `validate()`, import path still size-capped (20000 bytes) before `JSON.parse`.

## High Priority Findings
None. (See "Verified safe" below for the one item that looked high-risk on first read but isn't.)

## Medium Priority Improvements

1. **Stale-alias pattern is safe today but fragile** (focus item 1). Several handlers do `const state = G.state;` once at the top of a function and then use `state` inside nested `run:` closures that fire later on a button click, e.g. `js/encounters-moth-flower-terminals.js:75-85` (`talkMoth`, the "Sit beside the flower" callback at line 80) and `js/threshold-memory-release-and-endings.js:9-21` (`A.threshold`). If `G.state` is ever reassigned (reset/replay/import/new-game) while that specific dialog is still the open modal, the callback would read the *old* object instead of the live `G.state` — a real behavior difference from the original, where every reference was to the single outer `let state` variable and always read current data.
   - **Verified not currently exploitable**: every reassignment site (`doReset` in threshold module, "Begin again" and import-resume in `menu-export-import-and-startup.js`, `A.replayChoice`) calls `A.closeDialog()` (or is itself the click handler of the dialog being replaced) before touching `G.state`, and `A.interact`/keydown/pointerdown all early-return while `G.modalOpen`/`G.transitioning` is true. So no dialog holding a stale `state` alias can still be open when a reassignment happens. This matches the requester's "no drift" claim — I independently re-derived it rather than trusting it.
   - Still flagging as medium: it's an invariant enforced by convention across 4+ files, not by a test or a lint rule. A future edit that reassigns `G.state` without going through `closeDialog()` first (e.g., a "quick reset" keyboard shortcut) would silently reintroduce staleness with no unit test to catch it (the Node tests only exercise `story-state-rules-and-save-validation.js` headlessly, not the DOM/dialog layer). Low-cost fix if wanted: read `G.state.foo` directly inside `run:` closures instead of via the outer `state` alias, consistent with how `S.advance(G.state, ...)` is already written elsewhere in the same files (e.g. `js/encounters-moth-flower-terminals.js:21`, `:41`, `:60`).

2. **`VERIFICATION.md` not updated** — still says (lines 7, 60, 65-66): `JavaScript syntax checks for game.js and state.js`, `The story transitions now run in core.bend, compiled by Bend 2.0.16 into bend-core.js`, and gives `bash build-bend.sh --check` as a command to run. All of `core.bend`, `bend-core.js`, `build-bend.sh`, `game.js`, `state.js` are deleted in this change. `plans/260925-0307-engine-split-plain-js-rules/plan.md` explicitly lists `VERIFICATION.md` under "Modify" — this file was missed.

3. **Plan/phase status not updated.** `plan.md` and both phase files (`phase-01-rules-and-pathfinding-modules.md`, `phase-02-browser-module-split.md`) still say `**Status:** pending` / table shows `pending`, despite: the Bend files already deleted in the working tree, `js/*.js` fully implemented, `index.html` rewired, tests passing. Row 3 of `plan.md`'s table ("Remove Bend files, update tests + docs") has no linked phase file at all, so there's nowhere to track that it's actually >90% done (files removed, tests+README/DESIGN updated) except VERIFICATION.md above. Per this task's explicit instruction I did not edit the plan files — flagging for the caller to update status to done/in-progress and note the VERIFICATION.md gap as a follow-up.

## Low Priority Suggestions (style / plan drift, no functional impact)

- `js/pathfinding-visibility-graph.js:4` header comment references phase-01's originally planned two-file split (`save-validation-strict-import.js`, `story-rules-state-transitions.js`); the actual implementation merged rules+validation into one file, `js/story-state-rules-and-save-validation.js` (110 lines — still fine under the 200-line cap). Not a bug, just plan vs. implementation drift worth a one-line note in the plan.
- `phase-02-browser-module-split.md`'s load-order table names the last module `render-archive-room-and-agents`; actual file is `render-archive-room-agents-and-frame-loop.js`. Cosmetic naming drift only.
- `visibilitychange` handler split (focus item 2) between `js/audio-drone-and-four-note-motif.js:33-35` (suspend/resume audio) and `js/input-movement-and-collision.js:30` (clear keys, drop target, save) — verified behaviorally equivalent to the original single handler: the two halves touch disjoint state (`audio`/`soundOn` closure vars vs. `G.keys`/`G.target`), both independently gate on `document.hidden`, and DOM listener order between the two modules (audio registers before input, per load order) doesn't matter since neither reads the other's output. No drift, just two listeners instead of one.
- Tab focus-trap split (focus item 2) between `js/dialog-modal-and-focus-trap.js:40-45` and the early-return guard in `js/input-movement-and-collision.js:20` (`if (e.key === 'Tab' && G.modalOpen) return;`) — correct: dialog module's listener (registered earlier, module #5 vs #11) does the actual trap/preventDefault, input module's listener no-ops for that case. Matches original combined-handler semantics exactly.

## Verified Safe (called out per review brief, no issues found)

- **Load order** (focus item 3): checked all 12 files' top-level (non-function-body) statements for forward references. None found — every load-time side effect (`resize()` call in iso module, `$('journal').addEventListener` in hud module, the final `A.updateHUD(); requestAnimationFrame(frame);` in the render module) only touches symbols already registered on `window.Afterimage`/`window.AfterimageState`/`window.AfterimagePath` by an earlier `<script>` tag in `index.html:31-42`. The render module's `const { project, polygon, line, box, label, ring } = A;` (`js/render-archive-room-agents-and-frame-loop.js:7`) destructures at load time but is module #12 of 12, after iso module (#4) which defines those — safe.
- **`validate()`** (focus item 4): diffed line-by-line against `git show HEAD:state.js:69-93` — logic is an exact port (`js/story-state-rules-and-save-validation.js:81-105`). Same bounds checks (player position clamp, array de-dup via `Set` size check, flower/ending prerequisite chain), same error messages. `tests/state.test.cjs` "malformed imports cannot inject arbitrary state or impossible endings" test (12 malformed patches) passes.
- **String-literal survival claim**: independently re-derived by grepping all quoted string literals ≥4 chars from old `game.js`+`state.js` vs. new `js/*.js` and diffing the sorted sets. Only removed strings: `'./bend-core.js'`, `'Some'`, `'The Bend game core must load before state.js.'` (Bend bridge artifacts) and `'ending'`, `'function'`, `'memory'`, `'pair'`, `'spot'` (old bit-encoding field-name strings, replaced by the semantic `{type:'X', field:val}` action shape). No user-facing dialogue/UI text changed. Confirms the requester's claim rather than just trusting it.
- **Collision/pathfinding unification**: old code had `blocked()` duplicated in `game.js` (inline) and inside `state.js`'s `findPath` closure, both hardcoding the same bounds (30/930/650) and margin (13). New code unifies both into `js/pathfinding-visibility-graph.js`'s `isBlocked` (used directly by `A.blocked` in `js/input-movement-and-collision.js:9` and internally by `findPath`), with identical constants (`floor = {minX:30, maxX:930, minY:30, maxY:650}, margin:13`). A DRY improvement, not a behavior change — verified the numbers match exactly.

## Positive Observations
- Module boundaries are clean and each file's role matches its (long, descriptive) filename per the project's kebab-case convention; top-of-file comments explain purpose and interactions well (e.g. `js/story-state-rules-and-save-validation.js:1-4`, `js/game-context-world-layout-and-persistence.js:1-3`).
- `A.game` (G) as one shared mutable object, rather than per-module closures, sidesteps the whole class of "stale closed-over `let`" bugs for cross-module state — the one place it's still possible (function-local `const state = G.state` aliases, see Medium #1) is confined and currently safe.
- `step(state, action)` purity is directly tested (`tests/state.test.cjs` "step is pure and rejects unknown or malformed actions": checks input isn't mutated, checks returned arrays aren't shared with input) — a real regression-catcher the Bend version didn't have in JS-land.
- Test suite was meaningfully ported (not just recompiled): action-shape tests, save round-trip, malformed-import fuzz cases, pathfinding geometry test, and an explicit purity/no-shared-arrays test. All 8 pass.

## Recommended Actions
1. Update `VERIFICATION.md` to remove references to `game.js`/`state.js`/`core.bend`/`bend-core.js`/`build-bend.sh` (Medium #2).
2. Update `plan.md` + phase-01/02 status to reflect completion; add or fold in a phase-03 note for the Bend-file removal + docs work that's already done (Medium #3).
3. Optional hardening for Medium #1: in `run:` closures created inside functions that alias `G.state` to a local `state` const, read `G.state.foo` directly instead of the outer alias, to remove the invariant-by-convention rather than just documenting it's currently safe.
4. Optional: run `tests/browser.cjs` (Playwright) at least once before merge, since this review didn't execute it (environment constraint) — it's the only check that exercises the DOM/dialog/event-split layer end-to-end rather than the pure state module.

## Metrics
- Files reviewed: 12 `js/*.js` (808 lines) + `index.html`, `tests/state.test.cjs`, `tests/browser.cjs`, `README.md`, `DESIGN.md`, `VERIFICATION.md`, plan files.
- `node --check`: 12/12 pass.
- `node --test tests/state.test.cjs`: 8/8 pass, 0 fail.
- Files over 200 lines: 0 (max 110).
- Linting: no lint config in repo; not applicable.
- Updated plans: none (explicitly out of scope per task instructions — "Report findings only; do NOT edit any files").

## Unresolved Questions
1. Should `tests/browser.cjs` be run before this is considered mergeable, given it's the only test touching the split event-listener/dialog layer? (Not run here per env constraints.)
2. Intentional to leave `plan.md` row 3 ("Remove Bend files, update tests + docs") without a linked phase file, or should one be created for traceability given the work is already done?
3. Confirm whether the phase-01 file-split deviation (2 planned files → 1 actual file) should be reflected in the plan, or left as an implementation detail.
