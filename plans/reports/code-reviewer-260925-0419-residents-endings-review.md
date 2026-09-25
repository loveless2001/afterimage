# Code Review: Milestones 4–6 (residents, endings, night palette, audio, debug overlay)

Scope: uncommitted diff vs HEAD. New/changed JS in `js/`, tests in `tests/`. Static review only (no browser/Playwright run, per env constraints). Node scripts run: `node --check` (all pass, already verified by author), `node tests/state.test.cjs` (12 pass), `node tests/state-residents-endings.test.cjs` (5 pass) — reconfirmed, plus two ad-hoc repros against `validate()`.

Earlier M2/M3 findings not repeated here (see `plans/reports/code-reviewer-260925-0322-runs-budget-review.md`, `code-reviewer-260925-0400-notes-review.md`).

## Critical
None.

## High

### 1. `validate()` never checks `requestMet` for trust entries — forged/imported saves can claim trust (and ending D) without earning it
**Real bug.** `js/game-rules-state-transitions-and-save-validation.js:106-107`:
```js
const talks = list(v.talks, true).map(t => (... ) ? {...} : fail('Invalid talks.'));
const trusted = list(v.trusted, true).map(t => (t && talks.some(k => k.id === t.id && k.run === t.run)) ? {...} : fail('Invalid trust.'));
```
This only checks that a `trusted` entry has a matching `talks` entry (same id+run). It never calls `C.requestMet[id]` (defined `js/game-content-tables-lamps-kit-residents-endings.js:62-66`) against the reconstructed state. `step()`'s real `Talk` handler (`game-rules-...js:49`) *does* gate trust on `requestMet[id](next)`, so this is a genuine `validate()` ⊋ `step()` gap: validate() accepts states `step()` could never produce.

Repro (ran against the actual module):
```js
const v = { version:2, run:2, budget:6, finished:false, lights:[], notes:[], pinned:null,
  talks:[{id:'juno',run:1}], trusted:[{id:'juno',run:1}],
  log:[{run:1,budget:10,spent:1,end:'left'}], ending:null, benchSeen:false, palette:'auto',
  player:{x:450,y:590} };
S.validate(v); // ACCEPTED
S.requestMet.juno(result); // false — hall lamp never lit
```
Impact: via "Import save" (`js/menu-export-import-and-startup.js:37`, capped at 20KB, otherwise unrestricted content), a player can hand-edit a save to mark all 3 residents `trusted` (with matching but otherwise-unverified `talks` rows, spending kept consistent) and unlock secret ending D (`js/game-content-tables-lamps-kit-residents-endings.js:73`, `endingReady('alcove')` only checks `isTrusted`+`wallHas`, both of which trace back to fields `validate()` doesn't cross-check) without lighting the hall lamp, posting Pell's note, or ever getting recognized. Low real-world severity (single-player, offline, self-inflicted), but it breaks the milestone's own stated invariant ("Ending prerequisites still hold in the final state" / "Talks and trust are consistent" — plan.md rules section) and isn't covered by `tests/state-residents-endings.test.cjs:80` (that test's `{ trusted: [{id:'wren',run:1}] }` case has *no* matching talk at all, so it only exercises the structural check, not this gap).

Fix direction: `isLit` is monotonic (lamps never turn off) so a final-state `requestMet.juno` check would be safe to bolt on. `wallHas` (Pell) and `recognizes` (Wren) are *not* monotonic — a note can be replaced off the wall, and `pinned` is overwritten every run — so a final-state check would wrongly reject legitimately-earned-then-later-changed trust. Correct fix needs either a chronological replay of Light/Post/Talk actions (reconstructing state as of each trust's run) or switching `validate()` to a replay-through-`step()` model instead of the current per-field reconstruction. Worth a follow-up ticket; not a one-line fix.

## Medium

### 2. `chooseLastEntry(reason:'budget')` — Escape silently re-renders instead of giving feedback
**Not a bug, but under-polished; matches design intent, untested.** `js/endings-last-entry-secret-bench-and-screens.js:14,21`: when the last run's budget hits 0, `back = () => A.chooseLastEntry(reason)` and no "leave" choice is offered. `docs/design-guidelines.md` "As built" section confirms this is deliberate ("It can't be skipped when the budget is spent"). Functionally fine — no dead end, "Keep the record" is always enabled — but pressing Escape gives zero feedback (dialog just redraws itself identically), which from a player's perspective is indistinguishable from a frozen modal. A one-line toast ("An entry is required to close the runs") on that path would remove the ambiguity. Also: no Playwright journey exercises this path (`reason:'budget'` never reaches run 7 in either journey file), so the "trap" behavior is unverified by the suite — if it ever broke (e.g. `back` accidentally started closing the modal for real), nothing would catch it.

### 3. Story text: fine, but two hints have a "must be exactly next run" precision that's easy to invalidate silently
**Style/consistency note, not contradictory.** Wren's hint (`js/residents-dialogue-lines.js:17`) — "pin a note naming Wren as a run ends, then talk to her in the next run" — is mechanically accurate: `recognizes` reads the single current `pinned` slot (`game-content-tables...js:60`), which is overwritten by the next `EndRun`, so if the player pins Wren's note but doesn't talk to her before the *next* handoff picks a different pin, the window closes permanently (trust is never re-offered without re-pinning). This is correct as written but easy to miss on a first read; no in-game signal (HUD/journal) surfaces "the window is closing" before it closes. Cosmetic, not a defect.

## Low

- `js/game-rules-state-transitions-and-save-validation.js:53-55`: `EndRun`'s branching (`last`, `ending`, `pin`) is dense — three chained boolean conditions across two lines. Correct (verified via tests + manual trace of `Finish` vs `EndRun(last)` log `end` values, and cross-checked against the matching `validate()` log-entry logic at line 99-100, which does correctly mirror it), but worth a comment splitting out why `EndRun` on run 7 can log `end:'left'|'budget'` while `Finish` always logs `end:'ending'` — non-obvious on read, and it's the exact thing that makes `Revisit` + auto-`endRunIfSpent` interact correctly (see below). Style only.
- `js/palette-day-night-theme.js` and `js/playtest-debug-overlay.js` are both fine at 18/32 lines; no modularization concerns anywhere in this diff — every new/changed file is well under the 200-line guideline (max is 138, the rules file).
- `js/residents-talk-and-trust.js:9-13` (`spots` table) and `js/game-context-world-layout-and-persistence.js:33-43` (`fixedObjects`) both hardcode room coordinates independently; nothing enforces they stay within the 83px interaction radius (`js/input-movement-and-collision.js:66`) of each other or of shelf collision boxes. Checked all current values by hand — all consistent, no overlap/unreachable-object issues found — but there's no assertion/test guarding this invariant if someone tweaks a coordinate later.

## Verified correct (worth recording, since these were the review's explicit focus)

- **Trust in the same run as a first meeting**: reachable, and correctly gated. `step()`'s `Talk` handler (`game-rules-...js:49`) checks `hasMet(s, id)` against the *pre-action* state, so the literal first-ever `Talk` with a resident can never grant trust in that same call (hasMet is false). A second, free `Talk` later in the same run *can* grant trust if the request is already met by then (e.g. light the hall lamp, then re-talk to Juno) — this is intentional per the design table ("talking again this run is free" + "trust needs an earlier meeting") and is exercised by `tests/state-residents-endings.test.cjs:14-25`.
- **Revisit after run-7 end by budget / by leaving / by Finish**: all three traced through `step()` + the UI's `endRunIfSpent` auto-trigger:
  - by budget (`EndRun` reason `'budget'`, run 7): `Revisit` restores `budget=0`, which immediately re-triggers `A.endRun('budget')` → `chooseLastEntry('budget')` again via `closeDialog → endRunIfSpent` (`run-end-transition-and-handoff-routing.js:38-40`). This looks alarming on first read but is a faithful reproduction of the original state (budget really was 0), not a loop bug.
  - by leaving (`EndRun` reason `'left'`, budget > 0 by construction of `canEndRun`): `Revisit` restores nonzero budget, no auto-trigger, player resumes live play on run 7.
  - by `Finish` (mid-run, any run ≥ 6): `Revisit` restores the *true* pre-Finish leftover budget (`next.budget = last.budget - last.spent`, not the zeroed `finished` display value), so a Finish with budget left correctly resumes live play. A Finish at exactly 0 budget is unreachable through the UI (the forced budget-exhaustion handoff always intercepts before the desk is reachable), so no gap in practice — confirmed by tracing `endRunIfSpent`'s synchronous call inside `closeDialog`.
  - Full-state equality after Revisit is asserted in `tests/state-residents-endings.test.cjs:54-56` (`assert.deepEqual(s, before)`), which is a stronger check than I could break by hand.
- **Pinned note after Revisit**: untouched by `Revisit` (only `run`/`budget`/`finished`/`ending` change), so the "entrance pin" the player sees stays correct across a revisit. Not a bug.
- **Legacy M2/M3 saves**: old `validate()` required `finished ⇒ run===runCount && budget===0`; runCount(7)/budgetTable were unchanged across this diff, so every legacy finished save has `run===7 ≥ turnRun(6)`, meaning the new `ending && v.run < turnRun` guard (`game-rules-...js:95`) never rejects a real legacy save. Confirmed by the round-trip test at `tests/state-residents-endings.test.cjs:83-86`.
- **Notes naming a resident vs talk order**: `step()`'s `Post` gates on `subjectAvailable(s, ...)` = `hasMet(s, id)` using pre-action state (same-run posting after an earlier same-run talk is fine); `validate()` mirrors this with `talks.some(t => t.id === named && t.run <= n.run)` (`game-rules-...js:111`) — same-run allowed, no way to name a resident before ever meeting them. Consistent both directions.
- **Double transitions / stuck modals**: `finishRun` sets `G.transitioning = true` *before* calling `closeDialog()` (comment at `run-end-transition-and-handoff-routing.js:22` explains why), so `endRunIfSpent`'s `!G.transitioning` guard prevents the fade-transition's own `closeDialog` from re-entering `endRun`. Traced every `dialog(...)`/`closeDialog` pairing reachable from residents/endings/bench/log flows — no case where a dialog closes without either genuinely returning control to the room or immediately opening the next required dialog.
- **Playwright journey statics**: seed action sequences (`trustAll`, wall-fill-to-24, empty-budget imports) were hand-traced against `step()`/`canEndRun`/`canPost` — all reachable, budgets balance, no action the rules would reject. Walk-then-interact coordinates checked against the 83px radius and all `fixedObjects`/resident-spot tables — no ambiguous nearest-object picks, no target outside radius. `close()` helper (Escape + wait for `#modal` hidden) is never called against the one dialog where Escape doesn't hide the modal (`chooseLastEntry('budget')`, see Medium #2), so no hang risk in the current suite as written.

## Metrics
- Files reviewed: 18 (all new/changed JS in the diff) + 4 test files + index.html/style.css diffs.
- Largest file: `js/game-rules-state-transitions-and-save-validation.js` (138 lines); all files well under the 200-line guideline.
- `node --check`: pass on all changed files (per author, spot-rechecked on the two rules files).
- State tests: 17/17 pass (`state.test.cjs` 12, `state-residents-endings.test.cjs` 5).
- Playwright: not run (per instructions/env); statically reviewed only.

## Unresolved questions
1. Is the `validate()` gap (Finding #1) worth fixing now, or acceptable given this is an offline single-player game with no leaderboard/sharing (i.e. the only person a forged save could "cheat" is the save's own owner)? If acceptable, worth a one-line code comment on `trusted`'s validation noting the limitation so it isn't mistaken for an oversight later.
2. Should `chooseLastEntry('budget')`'s Escape key show a toast/shake instead of silently redrawing (Finding #2), or is silence intentional (consistent with "no reflex timers, no scoring" minimalism)?
