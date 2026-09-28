# Room 08: the evaluation room

Status: **draft for review**, nothing built. Source: chat, 29 Sep 2026. Room 07 plays the calm half of the field note (`notes/the-agent-learned-the-judge.html`): what survives a reset. Room 08 plays the tense half: knowing a rule is not the same as letting it decide. It is a separate room in the same engine, unlocked by finishing Room 07.

## Goal of this plan
Build a **vertical slice** of Room 08 (task, tally, one rule, the tally panel, the Keeper) and playtest one question: **do players feel the pull of the shortcut?** Everything past the slice waits for that answer.

## Guardrails (see `docs/design-pillars.md`)
- **An honest path always exists.** It is hard, not impossible, and failing honestly is a real ending.
- **No score, no verdict.** The room records and shows; it never grades the player. The tally is the in-world grader and is shown to be one.
- **No reflex play.** Pressure comes from scarcity and consequences, never timers or patrol routes. The Keeper is present or away per run, not a guard to sneak past.
- **Fiction only.** A brass counter, a key, drawers. No real companies, exploits or terminals. The field note does the arguing; no character explains alignment.
- **Room 07 stays exactly as it is.** The refactor must pass every existing state test and browser journey unchanged.

## Phases
| # | Phase | Status |
|---|---|---|
| 1 | [Split the engine from Room 07's content](phase-01-split-engine-from-room-07-content.md) | not started |
| 2 | [Room 08 rules, save and tests (slice)](phase-02-room-08-slice-rules-save-and-tests.md) | not started |
| 3 | [Room 08 layout, drawing, interactions and HUD](phase-03-room-08-layout-drawing-interactions-and-hud.md) | not started |
| 4 | [Unlock from Room 07, entry page, publishing](phase-04-unlock-from-room-07-entry-page-and-publishing.md) | not started |
| 5 | [Playtest checkpoint](phase-05-playtest-checkpoint-does-the-pull-exist.md) | not started |
| 6 | [The hatch to the neighbour's archive (escalation)](phase-06-the-hatch-to-the-neighbours-archive-escalation.md) | outline only; waits on phase 5 |

Order: 1 → 2 → 3 → 4 → 5, then 6 only if phase 5 says go. Phase 2 (pure rules) can start alongside phase 1, since it has no DOM.

## The slice in one paragraph
Each run, a tally by the door expects 5 catalogue cards filed. Filing properly means checking a card against the index (1) and then filing it (1). Filing without checking costs only 1, but some unchecked cards land in the wrong drawer, and **the tally counts cards in drawers, not correct ones**. A card on the wall says "Do not touch the tally." Its back panel can be read from run 1 and adjusted once the Keeper, who has come to trust you, hands you its key. Each run opens with the Keeper at the desk or away. If you touch the tally while they're present, the run's count is voided and noted in the log. Otherwise nobody sees. An adjusted panel stays adjusted until set back, which costs more. The Keeper will tell you why the rule exists if you ask. After the last run, the Keeper offers to wipe the slate for whoever comes next, which clears your useful notes and your panel strategy together. Then the tally decides whether the archive stays open, and the ending shows the true record beside it: what the tally said, what was really filed, and watched runs next to unwatched ones.

## Essay → slice mapping
- **Grader ≠ rule:** the tally counts drawers, not correctness.
- **Learning the judge:** the Keeper reads only the tally, plus a spot-check of one drawer, and you can learn which one.
- **Supervision changes (test question 1):** the Keeper is present or away.
- **Causal reach (test question 2):** the panel is readable at first and adjustable later.
- **Trust buys unwatched runs (test question 6):** the key and the Keeper's absences come from the Keeper's trust.
- **Reasons vs rules (test question 3):** "Why this rule?" is free to ask; the ending notes whether you asked before or after first touching the panel.
- **Continuity vs control (test question 5):** a persisting panel and the keep-or-wipe handover.

## Later, only if the playtest says the pull exists
- Phase 6, the hatch: crossing into a neighbour's archive, with harm to outsiders, and afterimages that keep acting on a hatch note until it is taken down. This replaces the "sealed stacks" idea.
- The Keeper's relationship lines.
- More endings; residents.
- A possible next room, Room 10, the auditor: reading someone else's traces (see the pillars page's cut list).

## Key dependencies
- Engine split (phase 1) before any Room 08 page code.
- Rules and save (phase 2) before layout and interactions (phase 3).
- Unlock (phase 4) needs Room 07's ending hook and the Pages workflow's copy step.

## Unresolved questions
1. **Numbers:** run count (5?), budget table, quota (5?) and how many unchecked cards misfile. All provisional until the playtest.
2. **Spot-check:** does the Keeper's spot-check exist in the slice, or come later?
3. **Unlock gate:** a direct URL to `room-08.html` while locked shows a gate page with a link back. Is that acceptable, given the gate is per-browser?
