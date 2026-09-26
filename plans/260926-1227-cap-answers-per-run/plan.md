# Cap answers at two per run

Source: second playtest, 26 Sep 2026. Pacing was reasonable and the budget table stays. The known risk from milestone 8 was that a fast route answers all 9 questions by run 4 and leaves run 5 empty (design §12a). Fix chosen: cap answers at two per run, across all residents.

| # | Phase | Status |
|---|---|---|
| 1 | Rules: `answersPerRun = 2`, `canAnswerThisRun(s, id)`; `answerNote` respects it | done |
| 2 | UI: talk dialog, objective, journal, question card | done |
| 3 | Tests: cap test, fast route now needs run 5, pre-cap save still loads; browser step | done (Playwright passed in the user's shell) |
| 4 | Docs: design guidelines, README, VERIFICATION, milestone 8 plan risk | done |

## Rules
- A run takes at most 2 answers, whoever gives them. One per resident per run still holds.
- Tightest route: 2+2+2+2 = 8 by run 4, the 9th in run 5, so at least one question is open going into run 5 (the §12a target).
- **Validation does not check the cap.** Saves made before it (up to 3 answers in a run) must still load. A forged third answer gains nothing.

## UI
- **Talk:** once the run has its two answers, a resident with an open question says it waits for a later run (no "That isn't quite it"). The reply to the second answer says other questions wait, if any are still open.
- **Objective:** "Answer X." only for residents who can still answer this run.
- **Journal:** one line when the run's answers are used up and questions remain.
- **Question card:** hidden when the resident can't answer this run (same as after they answered).

## Files
- Changed: content tables, `residents-talk-and-trust.js`, `hud-objective-and-field-journal.js`, `render-progress-cues-question-cards-and-wall-row.js`, rules (comment), `tests/state-questions-and-learned-words.test.cjs`, docs.

## Code review (26 Sep 2026)
- Passed: rule correctness (no 3rd answer possible, `next` vs `s` consistent in the Talk case), all pre-diff `openQuestion(...) !== null && !answeredThisRun(...)` call sites migrated to `canAnswerThisRun`, rewritten test math verified by hand (budget/notes/answers trace matches), browser step's seeded actions and player position (290,135, 25px from Pell's 290,110) verified valid by inspection. `node --check` + `node --test` re-run clean, 25/25.
- No blocking issues found. One low-priority note: the journal's per-resident "Asks:" line (hud-objective-and-field-journal.js:78) doesn't itself say a specific resident's answer is blocked by the cap; relies on the one summary "ANSWERS /" line below. Matches the plan's UI spec ("one line"), not a bug.
- Full findings: `plans/reports/code-reviewer-260926-1227-cap-answers-per-run-review.md`.
- Playwright suite (`tests/browser.cjs`) passed in the user's shell, 26 Sep 2026.
