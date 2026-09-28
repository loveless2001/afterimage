# Ending call-outs and the Revisit hint

Source: user question, 29 Sep 2026. After an ending nothing said other endings exist, beyond "Ending A of 4". Fix chosen: residents point to the endings you passed over, in their own voice (speech only, no bracketed hints), and Revisit says what it actually does. Lines drafted in chat and approved before building.

| # | Phase | Status |
|---|---|---|
| 1 | Helpers in content tables: `revisitTarget`, `budgetAfterRevisit`, `endingOwners`, `darkLamps`, `wallGaps`, `endingCallout`, `benchHint` | done |
| 2 | Lines: `A.residentCallouts`, `A.benchHints`; closing talk picks them | done |
| 3 | Objective after an ending names the two residents; Revisit detail on the ending screen and in the menu | done |
| 4 | Tests: `tests/state-ending-callouts.test.cjs`; one browser assertion; agent-browser check | done (Playwright passed in the user's shell, 29 Sep 2026) |
| 5 | Docs: design guidelines, README, VERIFICATION | done |

## Rules
- Each resident speaks for one ending: Wren the record, Juno the lights, Pell the wall. The secret belongs to all three.
- After endings A–C, the two residents whose endings you passed over point to them:
  - **ready:** the need is met; choose it after a revisit.
  - **reachable:** a revisit leaves enough budget to meet it: the rewound run's leftover plus every later run.
  - **late:** only a new set of runs can reach it.
- The resident whose ending you chose keeps the closing line. Once you have seen the bench, or heard at least one resident's last reply, they add a bench hint: "ready" if the secret is met and a revisit leaves any budget, else an oblique hint. A spent last run reopens the last entry at once, so the bench is out of reach.
- After ending D nobody points anywhere.
- Revisit is a rewind: "Rewinds to run 07 with 5 budget left. Lamps and notes stay; only the last entry is erased." The user first read it as a review-only replay. It stays a rewind, because it's the only way to reach another ending without replaying the whole game.

## Files
- Changed: content tables, `residents-dialogue-lines.js`, `residents-talk-and-trust.js`, `hud-objective-and-field-journal.js`, `endings-last-entry-secret-bench-and-screens.js`, `menu-export-import-and-startup.js`, `tests/browser-journey-residents-endings.cjs`, docs.
- New: `tests/state-ending-callouts.test.cjs`.
- No save format change.

## Code review (29 Sep 2026)
- `plans/reports/code-reviewer-260929-0104-ending-callouts-review.md`: no critical or high findings. `revisitTarget`, `budgetAfterRevisit` and `costToReady` were traced against the rules and match exactly.
- Fixed (medium): `benchHint` took "budget after a revisit > 0" as "the bench is walkable", which only holds while no run has 0 budget. It now checks the rewound run directly: not the last run, or budget left.
- Fixed (coverage): a new case finishes with the lights ending, covering Wren's "ready" line and Juno's bench hint on a spent last run.
- Not changed: Pell's "late" line wording (approved by the user); no automated test for the "Two residents…" fallback (checked in agent-browser).
