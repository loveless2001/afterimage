# Room 07: a story intro and a long-exposure ending

Status: **done** (30 Sep 2026): reviewed; Playwright passed. Source: chat, 30 Sep 2026. Before the Room 08 playtest and commit, Room 07's front door and last screen get stronger. The intro should say what you'll do and why it's worth playing. The ending should show the whole game at once and then say, outside the fiction, where the room came from.

## Decisions (user, 30 Sep 2026)
- **Intro:** cover copy "Who sent them" (the three residents, their unfinished work, nobody knows who it's for, you help them over seven visits), plus a ghost behind the title who walks the room and lights a lamp.
- **Theme:** stays in the fiction until the end. After the last run, one card outside the fiction names it and links the field note.
- **Ending visual:** long exposure. Every run's route is drawn as light at once, then the kept lamps come on, then it settles into one picture you can save.
- **Scope:** Room 07 first. Room 08 later, in its own pass: its ledger shows the tally's view first, then the true record appears beside it.

## Guardrails (`docs/design-pillars.md`)
- **Nothing is scored:** the picture has a caption, not a grade.
- **Shows, doesn't tell:** no character explains anything. The reveal card sits outside the room, after the ending, and appears once per ending. Pillar 2 gets one line saying so.
- **Calm, accessible:** under reduced motion the sequence shows its last frame at once. Every picture has a text caption. It works on a phone.
- **In-play frames unchanged:** the title ghost draws only before the game starts. The exposure draws only at the ending.

## Phases
| # | Phase | Status |
|---|---|---|
| 1 | [Cover copy and first briefing](phase-01-cover-copy-and-first-briefing.md) | done |
| 2 | [Ghost behind the title](phase-02-title-screen-ghost-lights-a-lamp.md) | done |
| 3 | [Long-exposure ending and keepsake picture](phase-03-long-exposure-ending-and-keepsake-picture.md) | done |
| 4 | [Reveal card, tests and docs](phase-04-reveal-card-tests-and-docs.md) | done |

## Ending sequence (after this plan)
1. The last entry is written, and the transition fades as now.
2. **The ending dialog:** Wren, Juno and Pell's closing lines, as now. Its one choice is "Continue".
3. **The long exposure** (about 7 s): the room darkens and every run's route draws in light at once. Then the lamps you kept come on and it settles.
4. **Caption:** "ENDING B · THE LIGHTS / 7 runs · 41 budget spent · 30 Sep 2026", with "Keep this picture" (PNG) and "Continue".
5. **Reveal card** (outside the fiction): "Who sent them?" It offers the field note, Room 08, remain in the room, revisit the choice, and export.

## Unresolved questions
- The reveal card's wording (draft in phase 4) is for the user to edit.
- Should the cover still link the field note titled "The agent learned the judge"? Its title half-spoils the reveal. Default: keep it as is.
