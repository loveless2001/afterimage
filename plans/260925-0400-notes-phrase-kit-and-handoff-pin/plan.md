# Milestone 3 — Notes: phrase kit, notice hall, ghost cards, handoff pin

Source: `docs/design-guidelines.md` §6.3, §12 milestone 3.

| # | Phase | Status |
|---|---|---|
| 1 | Rules: `Post`, `EndRun` with a pin, note validation | done |
| 2 | UI: hall list, three-step builder, full-wall replace, handoff, pinned read, entrance pin board | done |
| 3 | Render (blue current-run cards, ghost older cards, pin board), HUD, journal, run log; tests; docs | done; the browser run is folded into the complete suite |

## Rules
- **Kit:** 5 place subjects (desk, lamp, west stacks, east stacks, exit) · 6 verbs · 5 qualifiers.
  - The 3 resident subjects are appended in M4, so indices stay stable.
  - A note is `{run, parts:[subject, verb, qualifier|null], slot:0..23|null}`, and `slot:null` means it was taken down.
- **`Post`:** costs 1.
  - While the wall has space, the note takes the first free slot.
  - When all 24 slots are full, the post must name a wall note to replace, and takes that note's slot.
- **`EndRun`:** takes an optional `pin`, which is a note currently on the wall. It sets `pinned` for the next run.
- **Validation:**
  - Parts use kit ranges, slots are unique, and a note's run is no later than the current run.
  - The pinned note comes from an earlier run.
  - Spending per run equals lamp costs plus the notes posted that run.
  - A v2 save without notes (from M2) loads, with `notes:[]` and `pinned:null`.

## Flow
- **Posting:** hall → "Write a note" → subject → verb → qualifier or none. If the wall is full, the player picks a note to take down. Then confirm and post.
- **Handoff:** a run ending (by leaving or by budget) with notes on the wall offers a pin. There is no handoff on the last run.
  - After leaving through the exit, the player can still choose "Stay".
  - After running out of budget, Escape means pin nothing.
- **Next run:** it opens by reading the pinned note. The hint quotes it while the budget is untouched, and the entrance pin board can be re-read for free.

## Success criteria
- `node --check` passes on every module, with no file over 200 lines.
- The state and browser tests pass, including full-wall replacement and the handoff pin.
