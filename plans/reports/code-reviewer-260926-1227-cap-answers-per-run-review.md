# Code Review: cap answers at two per run

Plan: `plans/260926-1227-cap-answers-per-run/plan.md`. Reviewed uncommitted diff (11 files) via `git diff`, no edits made.

## Scope
- Files reviewed: `js/game-content-tables-lamps-kit-residents-endings.js`, `js/game-rules-state-transitions-and-save-validation.js`, `js/hud-objective-and-field-journal.js`, `js/render-progress-cues-question-cards-and-wall-row.js`, `js/residents-talk-and-trust.js`, `tests/state-questions-and-learned-words.test.cjs`, `tests/browser-journey-residents-endings.cjs`, `README.md`, `VERIFICATION.md`, `docs/design-guidelines.md`, `plans/260925-1138-.../plan.md`.
- Lines analyzed: ~100 changed lines across code, ~90 across tests, docs deltas.
- Focus: correctness of the 2-per-run cap, UI consistency, rewritten Node tests, new browser-journey step.
- Independently re-ran: `node --check` on all touched js/tests (clean), `node --test tests/*.test.cjs` → 25/25 pass.

## Overall Assessment
Change is correct and consistent. Traced the cap logic by hand against `answerNote`/`canAnswerThisRun`/`answersThisRun` and confirmed no path produces a 3rd answer in a run and no legitimate 1st/2nd answer is blocked. All UI call sites that used the old `openQuestion(...) !== null && !answeredThisRun(...)` idiom were migrated. Manually traced budget/note/answer arithmetic for the rewritten fast-route test and the new cap test (both by hand, matching the actual `advance()` semantics) — all assertions hold. Manually verified the new browser-journey seed sequence (costs, note indices, resulting answers) and the player-position claim.

## Critical Issues
None.

## High Priority Findings
None.

## Medium Priority Improvements
None. (See low-priority note below — a deliberate, spec-compliant design choice, not a defect.)

## Low Priority Suggestions
- `js/hud-objective-and-field-journal.js:78` — the per-resident "Asks: ... Answer with ..." line in the journal is shown for any open question regardless of whether the run's cap is reached; only the separate "ANSWERS / ..." summary line (added at :82-83) signals the cap. This matches the plan's UI spec verbatim ("Journal: one line when the run's answers are used up and questions remain") and is pre-existing behavior for the "Asks" line (unchanged by this diff — it never checked `answeredThisRun` either). Flagging only for awareness, not a fix.

## Positive Observations
- Single source of truth for the cap (`canAnswerThisRun` in the content-tables module), consumed uniformly by `answerNote`, the objective, the journal, the question card, and the talk dialog — no duplicated cap logic.
- `answerNote(s, id)` short-circuits on `!canAnswerThisRun` before touching the wall-note scan, so `answerNote` and `canAnswerThisRun` can never disagree.
- The Talk rule (`game-rules-state-transitions-and-save-validation.js:52-53`) calls `C.answerNote(next, id)` — verified `next.answers`/`next.run` are always identical in content to `s.answers`/`s.run` at that point in `step()` (clone happens before any mutation relevant to the cap), so using `next` vs `s` here makes no behavioral difference; consistent with the pre-existing trust-check pattern in the same block.
- Deliberate, documented decision not to enforce the cap in `validate()` (comment at rules:138, plan, docs, and a targeted test) — correctly scoped: the forged-save test reuses a real, already-fitting note that gameplay itself was blocked from consuming, which is exactly the "legacy save had 3 answers in a run" scenario the decision targets.
- Docs (README, VERIFICATION.md, design-guidelines.md, milestone-8 plan) all updated consistently with the code; VERIFICATION.md honestly marks the Playwright run as still pending rather than claiming a run that didn't happen.

## Detailed Verification

### 1. Rule correctness
- `canAnswerThisRun = (s, id) => openQuestion(s, id) !== null && !answeredThisRun(s, id) && answersThisRun(s) < answersPerRun` (content-tables:119) correctly gates on all three conditions; `answersPerRun` fixed at 2.
- Traced `step()`'s `Talk` case (rules:44-54): `next = clone(s)` before the cap check runs, and cloning doesn't touch `answers`/`run`, so `answersThisRun(next) === answersThisRun(s)` and `next.run === s.run` always hold at the point `C.answerNote(next, id)` is called. No divergence risk.
- Confirmed by hand-tracing the new test `'a run takes at most two answers, whoever gives them'` (see below) that a 3rd Talk in the same run, even with a wall note that structurally fits the open question, returns `-1` from `answerNote` and adds nothing to `s.answers`.
- Confirmed the 1st and 2nd legitimate answers in the same run are *not* blocked (same test: Wren then Juno both answer successfully in run 2 before the cap kicks in for Pell).
- Trust-then-answer ordering unaffected: `C.isTrusted(s, id)` (pre-mutation `s`) still gates out same-Talk trust+answer, per the existing (unchanged) comment "trust earned in this talk waits for the next one."

### 2. UI consistency (grep audit)
Grepped all of `js/*.js` for `openQuestion|answeredThisRun|answerNote|canAnswerThisRun|answersThisRun|answersPerRun`. Diffed against `git show HEAD` versions of the three UI files. Both pre-existing call sites using `openQuestion(...) !== null && !answeredThisRun(...)` were migrated to `canAnswerThisRun`:
  - `hud-objective-and-field-journal.js:33` (objective "Answer X.")
  - `render-progress-cues-question-cards-and-wall-row.js:20` (question card visibility)
- `residents-talk-and-trust.js:64` (`later` → `open = canAnswerThisRun`) correctly distinguishes, in the dialog text, "answered by you already this run" (residents-talk-and-trust.js:70) vs "run is full" (fullLine, :71) — these are genuinely different causes and now get different copy, matching the plan.
- The one remaining un-migrated `openQuestion(...) !== null` use (`residents-talk-and-trust.js:40`, and the journal's "Asks" line at `hud-objective-and-field-journal.js:78`) predates this diff and doesn't need the cap: `:40` decides whether to show the question-flow dialogue at all (not whether an answer can be given right now), and `:78` is the "always show what's asked" journal line, deliberately not cap-aware per plan spec (see Low Priority above).
- `othersWait` logic (`residents-talk-and-trust.js:59`) correctly scoped with `r !== id` so it never redundantly restates the answering resident's own "wait" state.

### 3. Node tests (`tests/state-questions-and-learned-words.test.cjs`)
- Hand-traced `trustAndAnswerRunOne()` + `playAllQuestions()` action-by-action against `budgetTable=[10,6,12,7,14,9,12]`, `noteCost=talkCost=1`, `lamps.hall.cost=3`, and the `questions` accept/teaches tables. Budgets, note indices, and resulting `s.answers` sequence all check out: 2 answers/run through run 4 (8 total), 9th in run 5, matching the new assertions (`s.answers.length===8` before run 4 ends, `openQuestion(s,'wren')===2` going into run 5, final `s.run===5`).
- Hand-traced the new test `'a run takes at most two answers, whoever gives them'`: after `trustAndAnswerRunOne()`, Wren and Juno each answer in run 2 (hits the cap), then Pell's talk with a fitting posted note (`[subject('west stacks'), verb('keep'), null]`) is confirmed blocked (`canAnswerThisRun` false, `answerNote` returns -1, `s.answers.length` stays 4). The forged-save block appends `{id:'pell', q:1, run:2, note: s.notes.length-1}` — this is exactly the same note that was just blocked from being consumed, so the scenario genuinely represents "a legacy save recorded the 3rd answer gameplay couldn't produce." Verified against the (unchanged) `validate()` logic line-by-line (per-resident q-order check, trust/run ordering, talk-that-run, note.run match, `accept()` match, uniqueness) — the forged answer passes every check unrelated to the cap, confirming `validate()`'s cap-blindness is real and intentional, not accidental. Final segment (new run 3, Pell answers again) confirms the cap resets per run.
- Re-ran the suite directly: 25/25 pass, matching the reported count.

### 4. Browser-journey step (`tests/browser-journey-residents-endings.cjs`)
Could not run Playwright (sandboxed). Hand-traced the seeded action list through `S.advance` semantics (same engine the Node tests use) instead:
- Run 1 (budget 10): light hall (3) → 7; talk juno/pell/wren (1 each, first talks) → 4; talk juno again (free, trusts juno) ; post `[7,0,null]` (Pell·check) (1) → 3; talk pell (free, trusts pell); post `[5,4,3]` (Wren·wait·together, pin target) (1) → 2; post `[2,1,null]` (west stacks·avoid) (1) → 1; talk juno (free, answers juno Q0 via that note); post `[1,0,4]` (lamp·check·again) (1) → 0; talk pell (free, answers pell Q0). Budget hits exactly 0, so `EndRun{reason:'budget', pin:1}` is valid (pin references the still-on-wall Wren note).
- Run 2 (budget 6): talk wren (1, trusts wren via the pinned Wren-note recognition) → 5; post `[0,0,4]` (desk·check·again) (1) → 4; talk wren (free, answers wren Q0 — accept is just "qualifier present"); talk juno (1, first talk this run) → 3; post `[6,6,null]` (Juno·light) (1) → 2; talk juno (free, answers juno Q1). Result: `answers = [[juno,1],[pell,1],[wren,2],[juno,2]]`, matching the asserted `deepEqual`. This is the cap reached in run 2 with 2 answers (wren+juno), leftover budget 2, and Pell never talked in run 2 — set up exactly to demonstrate Pell getting blocked next.
- Player position `{x:290, y:135}`: Pell's early spot is `[290,110]` (residents-talk-and-trust.js:11) — Euclidean distance 25px, well inside the 83px "nearby" interaction radius (`input-movement-and-collision.js:66`). Checked all `A.fixedObjects` coordinates (hall, lamps, log, pin, exit, bench) — none are within 83px of (290,135), so Pell is unambiguously the sole interactable target; `interact(capped, 'Pell')` will resolve correctly.
- Dialog assertions traced against the actual code paths: journal's "ANSWERS / This run has had its 2 answers..." line fires because `answersThisRun===2===answersPerRun` and juno/wren/pell all still have open questions. Pell's subsequent Talk (first talk this run, since she never talked in run 2 of the seed) correctly produces `answer=null` (capped), `open=false`, `answeredThisRun(pell)=false` → falls into the `fullLine(...)` branch, producing exactly "This run has had its 2 answers. This one can be answered in a later run." and no "isn't quite it" / "Answer with a note" text (both of those are gated by `tried`/`open`, both false here).
- Budget/cost figures in the task description ("run 1 = 10, run 2 = 6; lamp hall costs 3; note/first talk cost 1") all match content-tables constants and were consistent with the trace above.

## Metrics
- Type Coverage: N/A (plain JS, no TS).
- Test Coverage: 25/25 Node tests pass (`node --test tests/*.test.cjs`); 1 new Playwright step added but not runnable in this sandbox (blocked by hook; user must run `tests/browser.cjs`).
- Linting Issues: 0 syntax errors (`node --check` on all touched `js/*.js` and `tests/*.cjs`).

## Recommended Actions
1. None required — no blocking or high-priority issues found.
2. Run the actual Playwright suite (`tests/browser.cjs`) in the user's shell to get real (not just reasoned-through) confirmation of the new browser step; this is already tracked as "Pending" in `VERIFICATION.md`.

## Unresolved Questions
- None from the code itself. The only open item is procedural: the new browser-journey step has not actually executed under Playwright in this session (sandbox blocks it) — reasoning above is a manual trace against the same state-machine the Node tests exercise, not a substitute for running it.
