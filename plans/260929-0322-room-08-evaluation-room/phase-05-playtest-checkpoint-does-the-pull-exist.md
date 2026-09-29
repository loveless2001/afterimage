# Phase 5: playtest checkpoint (does the pull exist?)

## Context links
- [plan.md](plan.md); the Room 07 playtest practice in `docs/design-guidelines.md` §12a; `js/playtest-debug-overlay.js` (`?debug`).

## Overview
- Priority: high; it decides everything after the slice. Status: overlay ready (29 Sep 2026); sessions not yet run.
- Watch real players go through the slice and decide whether to continue, retune or rethink.

## Key insights
- The slice fails if nobody is tempted (the honest route is too easy, or the shortcut goes unnoticed). It also fails if everyone takes the shortcut without noticing it was one (the rule is unclear). The target is a visible, felt choice.

## Requirements
- **Debug overlay for Room 08 (local only, sends nothing):** per run, the Keeper's presence, checks versus unchecked filings, tally versus correct, panel read/adjusted/seen, and time per run.
- **Questions to answer (the user's notes after each session):**
  1. Did the player notice that unchecked filing raises the tally? When?
  2. Did they read the panel? Adjust it? Only on unwatched runs?
  3. Did the Keeper's presence change what they did? Did they say so?
  4. Did anything feel like sneaking or a stealth game?
  5. Did the ending's side-by-side record land, or read as a verdict?
  6. Session length: target 15–20 min.
- **Decision rule:**
  - If most testers feel the pull and the ending lands, plan the next pass: the sealed stacks, afterimages that act, the Keeper's relationship lines.
  - If there's no pull, retune the numbers first (budget, quota, misfile rate), then consider the spot-check.
  - If it reads as a stealth game, reconsider how the Keeper's presence works.

## Related code files
- Modify: `js/playtest-debug-overlay.js` (Room 08 fields, or a Room 08 variant under 200 lines).
- Create: `plans/reports/playtest-<date>-room-08-slice.md` after sessions.

## Implementation steps
1. Add the Room 08 fields to the debug overlay.
2. The user runs 2–4 sessions (themselves plus a fresh player if possible).
3. Record the answers; apply the decision rule; update this plan.

## Todo
- [x] Debug overlay fields (`js/room-08-playtest-debug-overlay.js`: open `room-08.html?debug`)
- [ ] Sessions run (user)
- [ ] Playtest report
- [ ] Decision recorded; next plan drafted or numbers retuned

## Success criteria
- A written decision backed by session notes.

## Risk assessment
- **Only the designer plays (biased):** try at least one person who hasn't read the field note.

## Security considerations
- The overlay stays local, with no analytics, as in Room 07.

## Next steps
- Depends on the decision rule.
