# Run log ledger and afterimages

Source: the ideas list agreed on 29 Sep 2026, items 3 and 7. The user said "go ahead".

| # | Phase | Status |
|---|---|---|
| 1 | `A.el` shared; the dialog sizes from `scene.dataset.size` (wide / book) | done |
| 2 | Ledger: `run-log-ledger-page-view.js`; readLog uses it; CSS; Playwright step reads rows | done |
| 3 | Afterimages: `afterimages-earlier-runs-trails-and-ghosts.js` (pure replay maths + browser storage); hooks in movement, interact, run start, save, new game/import, frame loop; run-2 message | done |
| 4 | Tests: `state-afterimage-trails.test.cjs`; agent-browser checks | done (Playwright passed in the user's shell, 29 Sep 2026) |
| 5 | Docs: README, design guidelines, VERIFICATION | done |

## Decisions
- Ledger margin notes are errands and Wren's answers only, because Wren is the one who says she copies notes into the margin.
- Trails are kept outside the validated save: cosmetic, and never able to break loading. The cost is that they don't travel with an exported save.
- Afterimages are drawn after the night layer so they read at night, and skipped while a shelf hides them (partial overlap draws on top).
- A run that starts afresh starts a fresh trail. A revisited run carries on its own trail, since play continues from where you stood.

## Code review (29 Sep 2026)
- `plans/reports/code-reviewer-260929-0259-ledger-and-afterimages-review.md`: no critical or high findings. Ledger fields and the edited Playwright regex check out, and blocked or junk storage is handled.
- Kept (medium): Revisit continues the rewound run's trail (intended). The afterimage checks for shelves at one height, since it hides when mostly covered, while the player outline shows when any part is covered.
- Fixed (low): pressing into a wall no longer records duplicate points.
- Not changed (low): repeated thinning isn't exactly every other original point (cosmetic); pauses always survive.
