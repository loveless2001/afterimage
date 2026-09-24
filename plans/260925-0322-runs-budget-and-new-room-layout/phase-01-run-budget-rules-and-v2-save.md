# Phase 01 — Rules: runs, budget, lamps, v2 save

**Priority:** high. **Status:** done.

## State (v2)
`{ version: 2, run: 1..7, budget, lights: [{id, run}], log: [{run, budget, spent, end}], finished, player: {x, y} }`

## Actions (`step(state, action) → next | null`)

| Action | Allowed when | Effect |
|---|---|---|
| `{type:'Light', lamp}` | not finished, lamp known, not lit, budget ≥ cost | lamp lit this run; budget reduced |
| `{type:'EndRun', reason:'left'}` | not finished, budget > 0 | run logged, next run starts |
| `{type:'EndRun', reason:'budget'}` | not finished, budget = 0 | run logged, next run starts |

- **Next run:** `run + 1`, the budget from the table, and the player back at the entrance.
- **Run 7 end:** the save becomes finished, with budget 0.

## Validation (strict)
- `version` is 2; `run` is between 1 and 7; `budget` is between 0 and the run's table value.
- Finished means run 7 with budget 0.
- The log has run − 1 entries, plus one if finished. Each entry matches its run and the table; an end by budget means the whole budget was spent, and an end by leaving means some was left.
- Lamps are known and unique, and each was lit in a run no later than the current one.
- Per-run spending equals the cost of the lamps lit that run, whether logged or in the current run.
- The player position is within the floor bounds.

## Success
- The state tests pass.
