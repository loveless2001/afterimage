# Paper views: notice board and pin

Source: user request, 29 Sep 2026: "when viewing the notice board, let the game display a real looking notice board, not a menu. same for the pinned note". Ideas list agreed in chat; this is items 1–2 (the run log ledger and afterimages come later).

| # | Phase | Status |
|---|---|---|
| 1 | `A.dialog(..., scene)`: optional DOM scene above the paragraphs; a wall scene widens the dialog; focus prefers scene buttons | done |
| 2 | `notice-board-and-pinned-card-views.js`: `noteCard`, `noticeBoard({ draft, pick, mark, fresh })`, `pinBoard(note)` | done |
| 3 | Notice hall, builder steps, take-down, confirm, posted, handoff, entrance pin use the views | done |
| 4 | CSS (day, night, 850/520px, reduced motion); browser journeys updated; agent-browser check | done (Playwright passed in the user's shell, 29 Sep 2026) |
| 5 | Docs: README, design guidelines, VERIFICATION | done |

## Decisions
- DOM inside the existing dialog, not canvas: the focus trap, Escape-back and screen readers keep working, and text stays sharp.
- Rules unchanged: a new note still goes in the first free slot, so empty holders aren't clickable.
- Word choices stay as buttons under the big card. The tests click them by name.
- Errand marks: a short "ERRAND · NAME" on the card and the full preview as an aside and in the card's accessible name. A note that names someone but would do nothing gets only the aside.
- The pinned card is blue on the cork board, as the room draws it.

## Code review (29 Sep 2026)
- `plans/reports/code-reviewer-260929-0225-notice-board-views-review.md`: no critical or high findings. Every pick path (take-down, confirm's free slot, pin index, fresh index) was traced against the rules and matches. Both edited Playwright steps should pass.
- Fixed (medium): the gold outline also appeared on notes that name a resident but would send nobody. It now needs a real errand; the "why" stays in the aside and the accessible name.
- Fixed (low): the gold outline hid the red keyboard-focus ring on marked cards.
- Not changed (medium): the read-only wall no longer has a one-line text summary; screen readers walk the 24-item list, labelled with its count.
