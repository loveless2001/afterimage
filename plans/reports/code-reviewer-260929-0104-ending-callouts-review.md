# Code review: ending call-outs and the Revisit hint (29 Sep 2026)

Scope: uncommitted diff for `plans/260929-0104-ending-callouts-and-revisit-hint/plan.md` (content tables, dialogue lines, talk, HUD, endings screen, menu, browser journey) plus `tests/state-ending-callouts.test.cjs`. Cross-checked against the rules (Revisit/EndRun/Finish/validate) and run-end routing. `node --check` clean, state tests pass.

## Assessment
- Core logic correct. `revisitTarget`/`budgetAfterRevisit`/`costToReady` traced through the rules: budget never carries between runs, lamps and notes have no other gate, and wall slots (24) exceed the threshold (12). So "reachable" and "late" are exact, not heuristics.
- No crash risk:
  - `log.at(-1)` is only read when finished, and validation guarantees a non-empty log then, legacy saves included.
  - Line lookups use closed vocabularies.
  - The non-ready branches never hit a zero count.
  - The HUD's "Two residents" is always exactly two.

## Findings
- **Critical / high:** none.
- **Medium, fixed:** `benchHint` used `budgetAfterRevisit > 0` as a stand-in for "not trapped in the last entry". That only holds while no run has a 0 budget, and the budget table is marked provisional. It now checks `run < runCount || budget > 0` directly.
- **Medium, coverage, fixed:** no test finished with the lights or wall ending. Wren's "ready" and a chosen resident's bench hint were untested; a lights-ending case was added.
- **Medium, coverage, not changed:** no automated test for the HUD "Two residents…" fallback (checked in agent-browser).
- **Low, not changed:** Pell's "late" line has "read around them" and "might fill them" back to back. The wording was approved by the user.
