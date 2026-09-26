# Progress visual cues (trust, questions, wall, alcove)

Source: user feedback, 26 Sep 2026. The room is uniformly grey-green; trust, open questions, wall progress and the secret hints only show in the HUD and journal. Goal: a few quiet cues in the room itself, using the existing colour rules (blue = persists, warm = light).

| # | Phase | Status |
|---|---|---|
| 1 | Rules: `hintsHeard(s)` (residents with every question answered) + state test | done |
| 2 | Canvas: trusted rings, question cards, wall-row cue, alcove warmth | done |
| 3 | Text equivalents: "ready" objective + journal lines | done |
| 4 | Checks, docs (design guidelines, README, VERIFICATION) | done; Playwright run in the user's shell |

## Cues
- **Trusted residents:** rings turn light slate blue (`#a9c3cf`), a little heavier. Pell's untrusted rings move from pale blue to neutral (`#cfd0c2`) so blue only means trust.
- **Question card** above a trusted resident with an open question they have not answered this run: outlined while waiting, solid blue once a note posted this run answers it. Drawn after the night layer, never animated.
- **Wall row:** ending C needs 12 notes = the top row, which fills first. From 9 notes the row's empty slots are outlined in blue; at 12 a blue rule runs under the row. Also drawn after the night layer.
- **Alcove warmth:** before the turn, a faint warm pool at the bench grows one step per resident whose last reply (with its hint) has been heard. From the turn it is the existing alcove pool.

## Text equivalents (pillar 4)
- Trust: journal "trusts you", HUD `TRUST n/3` (existing).
- Card, waiting: journal "Asks: …" (existing). Card, ready: objective "Answer X." with "A note you posted this run answers X's question…", ahead of the lamp step; journal adds the same line.
- Wall row: journal NOTES line says how many more fill the top row, or that it is full.
- Alcove warmth: the hints themselves are written in the replies.

## Not doing
- No highlight for the "wait · together" note (gives the secret away).
- No new colours, no pulsing.

## Files
- Changed: content tables (`hintsHeard`), `render-room-objects-and-characters.js` (rings, slot geometry), `render-frame-loop-lighting-and-night.js` (alcove warmth, cue pass), `hud-objective-and-field-journal.js`, `index.html`, tests, docs.
- New: `js/render-progress-cues-question-cards-and-wall-row.js`.
