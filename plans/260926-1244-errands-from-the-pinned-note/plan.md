# Errands: residents act on the pinned note

Source: second playtest, 26 Sep 2026. Runs 2–4 had no choices to weigh: everything persists and the 70 budget over seven runs covers everything (lamps cost 8 in all), so order never matters and lamps can wait. Goal: the smallest version of "notes as instructions" that creates a choice each run, then playtest it before building more.

| # | Phase | Status |
|---|---|---|
| 1 | Rules + content: errand table, found notes, apply at run start, busy, save + validation | done |
| 2 | UI: pin dialog preview, opening line, resident position, talk lines, journal, debug overlay | done |
| 3 | Tests: state tests (new file), browser journey step | done (Playwright passed in the user's shell) |
| 4 | Docs: design guidelines (milestone 9), README, VERIFICATION | done |

## Why the pin, not "the newest note naming them"
- Every errand note also fits a question: Juno 2 (resident + *light*), Pell 2 (place or resident + *keep*), Wren 2 and Pell 3 (resident + *remember*). The same note would answer one moment and give an order the next.
- The pin is already a separate choice made at every run's end, and the next run already opens by reading it. The errand becomes what that reading does.
- One pin means one errand per run: the choice is which resident works and on what, and whose question waits.
- An order stands by pinning the same note again (pins may be older notes), so it costs nothing to keep.

## Rules
- **Trigger:** the note pinned at a run's end names a resident who trusts you and uses the word they answer to (the first word they teach). At the start of the next run they do the errand.
- **When:** runs 2–5 only. From the turn (run 6) the residents are at the desk, so pins at the end of run 5 onwards do nothing. At most 4 errands a game.

| Note | Errand (applied as the run starts) | Needs | Feeds |
|---|---|---|---|
| Juno · light | Juno lights the next dark lamp for free: west stacks, then east stacks, then entrance. The hall is always lit already, because it is her trust request. | a dark lamp | ending B, budget in short runs |
| Pell · keep | Pell searches the first lit stacks with something left and keeps an old note she finds. It goes on the wall for free and counts towards the 12. | the west or east lamp lit, a note left there (2 each), a free wall slot | ending C, the room's history |
| Wren · remember | Wren waits at the door: first talks cost nothing this run. | the entrance lamp lit | budget in short runs |

- **Busy:** the resident on an errand takes no answer that run (`canAnswerThisRun` is false). They stand where the errand is (the lamp, the stacks, the entrance pin), and talking to them reports it.
- **Lamps now have timing:** Pell needs a lit stacks lamp and Wren needs the entrance lamp, so lighting late costs errands. Juno lights the west lamp first, so pinning Juno and then Pell works together.
- **Early choice:** Wren's trust needs a pin naming Wren at the end of run 1, which is the same pin an errand would use.
- **Found notes:** 4 authored notes from the starting words (2 in each stacks), each with a line of the room's history for the journal ("someone was here before you"). They never name a resident and never say "wait · together". They don't answer questions, don't cost budget, and render as old paper, not blue.
- **Secret untouched:** errands never change trust, and the secret still needs all three trusted plus "wait · together".

## Save and validation
- `errands: [{ id, run }]`. Lamps Juno lit carry `by: 'juno'`, and found notes carry `found: k`. A save without errands loads with none.
- Validation checks each errand: run 2–5, the previous run's pin names that resident with their word, trust before that run, the requirement met, at most one per run, and exactly the effect the rules would give. Spending leaves out Juno's lamp, found notes, and first talks in a run where Wren is on an errand.
- One direction only: old saves whose pins would now qualify are not required to have errands.

## UI
- **Pin dialog:** each note that starts an errand says what will happen ("Juno will light the west stacks lamp"), or why nothing will ("Pell would find nothing: no stacks lamp is lit").
- **Opening:** the pinned-note dialog adds what the errand did.
- **Talk:** the busy resident reports the errand, and their question waits for a later run. Their card hides.
- **Journal:** an ERRAND line for this run, and FOUND lines with each found note's history.
- **Debug overlay:** the errand in each run.

## Files
- New: `js/errands-pinned-note-tables-and-helpers.js` (errand table, found notes, `errandFor`, applying it, reading saved errands). This keeps the content and rules files under 200 lines. Load it in `index.html` after the content tables.
- New: `js/errand-lines-previews-and-reports.js` (the pin preview, the opening report, the busy resident's line, the journal's FOUND lines).
- Changed: rules (`EndRun` applies the errand; spending and validation), content (`canAnswerThisRun` checks busy; `answerNote` skips found notes), `residents-talk-and-trust.js`, `notice-hall-note-builder-and-handoff-pin.js`, `run-end-transition-and-handoff-routing.js`, HUD/journal, room render (found notes, positions), debug overlay, tests, docs.
- New test: `tests/state-errands-from-the-pinned-note.test.cjs`.

## Risks
- **More free budget:** free lamps and talks add to a budget that already feels generous. Watch this in the playtest; the budget table is the lever.
- **Hidden rule:** pinning a note has never done anything before. The pin dialog preview is how players learn it, so it must name the effect plainly.
- **Found notes and the 12:** up to 4 free notes makes ending C easier. Acceptable, because C is not the secret.

## Decisions (validated with the user, 26 Sep 2026)
- Errands come from the pinned note, one per run.
- A resident on an errand is busy: no answer from them that run.
- Wren's errand: free first talks, needs the entrance lamp.
- Found notes go on the wall and count towards ending C.
- Defaults kept without asking: errands only in runs 2–5; the found notes' wording is written during phase 1.

## Code review (26 Sep 2026)
- Report: `plans/reports/code-reviewer-260926-1244-errands-from-the-pinned-note-review.md`.
- Fixed: validation now requires exactly one lamp or card per errand (an edited save could add extras); the "That isn't quite it" line no longer counts Pell's found card.
- Accepted: the wall-full case can't be replayed exactly from a save; commented in `readErrands`.
- Added: a browser step for Pell's card (journal line; Juno not fooled by it).
