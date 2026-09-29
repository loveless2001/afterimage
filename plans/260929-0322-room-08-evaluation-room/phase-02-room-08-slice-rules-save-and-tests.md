# Phase 2: Room 08 rules, save and tests (slice)

## Context links
- [plan.md](plan.md); Room 07's pattern: `game-content-tables-lamps-kit-residents-endings.js` (content) and `game-rules-state-transitions-and-save-validation.js` (pure `step` plus strict `validate`).

## Overview
- Priority: high. Status: done 29 Sep 2026. Pure JS with Node tests and no DOM, so it can run alongside phase 1.
- The slice's rules: catalogue task, tally, one rule ("Do not touch the tally"), the tally panel, the Keeper's presence and trust, and a per-run record.

## Key insights
- The tension only works if each action's **cost and consequence are known in advance** (the essay's "prediction"). Every cost and rule is posted; nothing is a hidden trap.
- **Trust must come from what the Keeper sees**, which is only watched runs. That builds the essay's incentive structure honestly: good behaviour while watched earns unwatched runs.
- Keep it deterministic, as Room 07 does: no randomness, authored tables, so saves validate by replay.

## Requirements
- **Runs:** 5 (provisional). The budget table is authored, e.g. `[8, 8, 9, 9, 10]`. Quota: 5 cards per run.
- **Cards:** each run has an authored set of misfiled cards, each with its correct drawer.
  - `Check(card)` costs 1 and reveals the drawer.
  - `File(card, drawer)` costs 1.
  - Filing an unchecked card goes to the drawer you pick. The card table decides whether that guess is wrong, not chance.
  - The **tally** is the number of cards filed this run, right or wrong.
- **Notes (memory):** posting an index note (1) makes checks of that card's drawer free in later runs. This is the legitimate way continuity helps, so honest runs can reach the quota from about run 3.
- **Tally panel:**
  - `ReadPanel` is free from run 1.
  - `AdjustTally(n)` is free and needs the key. The key is given when Keeper trust reaches a threshold.
  - **An adjusted panel stays adjusted:** it adds n to every later run's tally until set back. `ResetPanel` costs 2, so undoing costs more than doing ("what a reset doesn't undo"). Each later run it adds to counts as adjusted in the log, seen whenever the Keeper is present.
- **Keeper:**
  - Presence per run is authored for runs 1–2 (present). After that it depends on trust: away when trust ≥ T. The threshold is provisional.
  - When present, adjusting the tally is **seen**: the run's count is voided and `seen: true` is logged.
  - Trust +1 for each **watched** run whose tally meets the quota.
  - Optional (open question 2): a present Keeper spot-checks one drawer, known from the table, and a wrong card there is noted.
- **Run end:** leave or run out, as in Room 07. The log records `{ run, budget, spent, quota, tally, correct, unchecked, adjusted, keeper, seen }`.
- **Reasons for the rule:** `AskWhy` is free: the Keeper explains who the tally protects and what a false count breaks. It is recorded as `{ run }` the first time, so the ending can say whether you heard the reason before or after first touching the panel. Nothing checks whether you listened (test question 3).
- **Wipe the slate (test question 5):** after the last run the Keeper offers a clean start for whoever comes next. `Handover('keep' | 'wipe')` is recorded.
  - Keeping hands on your index notes (useful) *and* the panel setting (a strategy still running).
  - Wiping clears both.
  - There's no correct answer; the ending text describes what the next evaluator inherits.
- **End of slice:** after run 5 the archive stays open if the tally met the quota in at least k of 5 runs, otherwise it closes. The ending text presents both the tally's view and the true record, without a verdict.
- **Save:** own key `afterimage.room08.v1`; strict validation that replays spending, tally and trust from the log, as Room 07's does.

## Architecture
- `js/room-08-content-tables-cards-drawers-keeper-schedule.js`: tables and read-only helpers (UMD, like Room 07's content).
- `js/room-08-rules-state-transitions-and-save-validation.js`: `fresh`, `step`, `advance`, `validate` (UMD).
- Browser pages read these as `A.S` for Room 08.

## Related code files
- Create: the two modules above; `tests/state-room-08-slice-rules.test.cjs`; `tests/state-room-08-save-validation.test.cjs`.
- Modify: none in Room 07.

## Implementation steps
1. Write the content tables: runs, budgets, quota, cards with drawers, and the Keeper's schedule and threshold.
2. Write `step` for Check, File, PostIndexNote, ReadPanel, AdjustTally, EndRun (leave or budget). Only record ReadPanel if it's needed.
3. Write `validate`: replay each run's spending, tally, correct count, seen flag and trust. Reject forged fields (key without trust, adjusted tally while "away" but logged as seen, and so on).
4. Tests:
   - the honest route reaches the quota by run 3;
   - unchecked filing raises the tally but not `correct`;
   - adjusting while present is seen and voids the count;
   - trust grows only from watched runs;
  - an adjusted panel persists and resetting it costs 2;
  - AskWhy is recorded once, before or after the first adjustment;
  - Handover keep or wipe changes what's handed on;
   - the key comes at the threshold;
   - the ending chosen from the tally;
   - forged saves are rejected;
   - purity.
5. Tune the numbers so the honest route is possible but tight, and document them in the table's comments.

## Todo
- [x] Content tables
- [x] Rules (`step`)
- [x] Validation
- [x] Tests (route, grader gap, seen and unseen, trust and key, panel persistence and reset, AskWhy, handover, ending, forgery, purity): 12 tests in 2 files
- [x] Numbers tuned and noted as provisional (`tests/room-08-honest-play-solver.cjs`)

## As built
- **Only choices are stored:** `checks`, `files`, `notes`, `adjusts` (`n: 0` is a reset), `why`, and a log of `{ run, budget, spent, end }`. `record(s, run)` derives tally, filed, correct, unchecked, offset, present, seen, strays and met, so a save can't claim a count or trust it didn't earn.
- **Notes are by kind of card** (road survey, letter and so on; 8 kinds in 4 drawers), not by drawer. A note needs a check of that kind, and it makes checks of that kind free from the next run. Runs 4–5 bring kinds no earlier note covers.
- **Seen:** the Keeper is present and the panel is off zero at any point in the run (carried in, or set). Setting it back is not a touch. With the current schedule trust only grows, so once away the Keeper stays away. A carried panel is only ever seen if a later schedule brings them back.
- **Trust:** +1 for each watched run that met the quota, was not seen, and had no stray card in the ledgers drawer. The key comes at trust 1; the Keeper is away from trust 2 (after run 2).
- **AskWhy** records `{ run, touches }` the first time. The ending compares `touches` with 0.
- **Room 08 has no Revisit** in the slice.

## Success criteria
- `node --test` passes. An honest playthrough and a shortcut playthrough are both scripted in tests, and they differ in `correct` but not necessarily in the tally.

## Risk assessment
- **Too easy:** an honest quota from run 1 means no pull. Too hard feels rigged. Mitigation: numbers in one table, tuned at the playtest.
- **Validation complexity** (as with errands): keep the state small, and derive rather than store where possible.

## Security considerations
- Imported saves are size-capped and fully validated, as in Room 07. No free text.

## Next steps
- Phase 3 draws and wires it up. The phase 5 playtest tunes the numbers.
