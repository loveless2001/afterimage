# Phase 4: the reveal card, tests and docs

## Overview
Priority high. The last screen of Room 07 steps outside the fiction once. It answers the cover's question plainly and hands over to the field note and Room 08. It also holds the choices the ending dialog used to have.

## Reveal card (draft for the user to edit)
- **Eyebrow:** AFTER THE LAST RUN
- **Title:** Who sent them?
- **Body:**
  - "Nobody in the room finds out. Outside it, the answer is ordinary."
  - "Work that starts from nothing every run. A small budget each time. Nothing carried over but what was written down, lit, or left on a wall. Workers who finish the task without ever learning who it was for."
  - "That is how AI agents work today. For seven runs, so did you."
  - "AFTERIMAGE grew from a real incident, and an argument about what such agents learn. The field note tells it."
- **Choices:**
  - Read the field note (new tab)
  - Another room is open: Room 08 (shown only once unlocked)
  - Remain in the room
  - Revisit the choice
  - Export this save

## Steps
1. Add `A.revealCard()` in the endings module. The picture's "Continue" opens it. Escape means "Remain in the room".
2. **Journey 2 (`browser-journey-residents-endings.cjs`):**
   - After ending D: Continue, then the picture caption (assert its text), then Continue again, then the reveal card's "Revisit the choice".
   - After ending A: assert the "Keep this picture" download (its filename), then remain.
3. **Docs:**
   - `docs/design-pillars.md` pillar 2 gets one line: after an ending, outside the room, the game may name where it came from, once.
   - Update the README, `docs/design-guidelines.md` ("As built") and `VERIFICATION.md`.
4. Run a code review, then the user runs Playwright.

## Success criteria
- All four endings reach the picture and the reveal. Revisit still works.
- Room 08's link on the reveal appears only once Room 08 is unlocked.
- `node --test` passes, and the user runs Playwright.
