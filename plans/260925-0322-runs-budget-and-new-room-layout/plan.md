# Milestone 2 — Runs, budget, new room (Moth prologue retired)

Source: `docs/design-guidelines.md` §3, §4, §6.1–6.2, §10, §12 milestone 2. The user chose to retire the prologue now.

| # | Phase | Status |
|---|---|---|
| 1 | [Rules: runs, budget, lamps, v2 save](phase-01-run-budget-rules-and-v2-save.md) | done |
| 2 | [Room layout, HUD budget bar, run transition](phase-02-room-hud-and-run-transition.md) | done |
| 3 | Tests rewritten, docs updated | done |

## Key decisions
- **Budget sinks:** 4 persistent lamps (entrance 1, west 2, east 2, hall 3) are the only way to spend budget in M2. M3 notes add a repeatable cost.
- **Ending a run:** a run ends by `left` (the exit, with budget > 0) or by `budget` (reaching 0). A run that hits 0 ends when the current dialog closes.
- **After run 7:** the save is marked finished, and a closing screen appears. Endings arrive in M5.
- **Saves:** new key `afterimage.v2`. A v1 save is left untouched, and a toast offers the fresh start.
- **Budget table:** `[10, 6, 12, 7, 14, 9, 12]` in one constant, provisional.
- **Wording:** all copy is generic, with no story content.

## Files
- **Create:**
  - `js/game-rules-state-transitions-and-save-validation.js`
  - `js/room-interactions-lamps-log-hall-exit.js`
  - `js/run-end-transition-and-final-screen.js`
- **Delete:**
  - `js/story-state-rules-and-save-validation.js`
  - `js/encounters-moth-flower-terminals.js`
  - `js/threshold-memory-release-and-endings.js`
- **Modify:** the context, HUD, dialog, menu, input and render modules; `index.html`, `style.css`, both tests, README, DESIGN (retired banner), VERIFICATION.

## Success criteria
- `node --check` passes on every module, and no file is over 200 lines.
- State tests cover costs, overspend, run end in both ways, the budget table, run 7 finishing, strict validation and purity.
- The browser journey covers:
  - lighting a lamp, then leaving
  - run 2 with the lamps still on and the budget from the table
  - running out of budget, which ends the run automatically
  - the finished screen after run 7
  - export/import and malformed-import rejection
  - v1-save detection
  - mobile, blocked storage, and no external requests
