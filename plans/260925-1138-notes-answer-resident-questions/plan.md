# Milestone 8 — Notes answer residents (questions, learned words)

Source: first playtest, 25 Sep 2026. Runs 3–5 drag once the lamps are lit and all three residents trust you: notes only count towards 12, and trusted residents repeat one line. Goal: a note's words matter, and each late run brings something new.

| # | Phase | Status |
|---|---|---|
| 1 | Rules: questions, answers, learned words, validation | done; review found no rule or validation issues |
| 2 | UI: talk dialog, note builder, journal, HUD, run toast, ending quotes | done; the review's `showEnding()` crash with an empty wall is fixed |
| 3 | Copy: 9 questions and replies; the secret hints come with the last replies | done |
| 4 | Tests and docs | done; Playwright journeys passed in the user's shell |

Review: `plans/reports/code-reviewer-260925-1138-notes-answer-questions-review.md`.

## How it plays
- Once a resident trusts you, they ask 3 questions in order (9 in total). The dialog always states what kind of note answers.
- To answer, post a matching note this run, then talk to them again. The cost is the usual first talk (1) plus the note (1).
- Each resident answers at most once per run, so the chains stretch across runs. Run 4 (budget 7) forces a choice.
- An answer earns a reply (a piece of the room's history, quoting your note) and teaches a new word for the note kit.
- Two questions need a word another resident teaches, so the chains interlock. The dialog names who uses the missing word.
- The secret's hints (the corner, the bench, "wait together") move from the trusted lines into each resident's last reply.

## Questions (draft copy, tune while writing)
| Resident | # | Asks (gist) | Answered by a note with | Teaches |
|---|---|---|---|---|
| Juno | 1 | Where was it darkest when you came in? | a place + avoid or check | verb *light* |
| Juno | 2 | Who should the light be for? | a resident + *light* | subject *the dark* |
| Juno | 3 | What should happen to the dark? | *the dark* + leave | qualifier *tonight*; bench hint |
| Wren | 1 | What goes on this run's blank line? | any note with a qualifier | verb *remember* |
| Wren | 2 | Who do you remember? | a resident + *remember* | subject *log* |
| Wren | 3 | What should the log keep? | *log* + *keep* (from Pell) | qualifier *still*; corner hint |
| Pell | 1 | Write me something worth reading twice. | any note with *again* | verb *keep* |
| Pell | 2 | What should the wall keep? | a place or resident + *keep* | subject *wall* |
| Pell | 3 | Write something for all of us. | a resident or *wall* + *remember* (from Wren) | qualifier *for good*; "wait together" hint |

- Fastest route: all 9 answers by run 4. Most players will still be answering in run 5 or at the turn.
- The 9 answer notes also count towards ending C.

## Rules (content tables + pure `step`)
- **Kit:** learned words are appended (subjects 8–10, verbs 6–8, qualifiers 5–7), so stored indices never shift.
- **`wordAvailable(s, set, i)`** replaces `subjectAvailable`. Base words are always available, resident names once met, learned words once taught. `Post` checks all three parts.
- **Question data:** `questions[id][q] = { accept(parts), teaches: [set, index] }` lives in the content tables. The copy lives in a new `js/resident-questions-dialogue-lines.js`.
- **State:** `answers: [{ id, q, run, note }]`, where `note` is an index into `notes`.
- **`Talk`:** an answer is recorded when all of these hold:
  - the resident trusted you before this talk and has an open question
  - they have not answered this run
  - a note posted this run matches and answers nothing else (the newest such note is used)

  Answering adds no cost.
- **Validation:** `answers` missing → `[]`, so existing saves load.
  - Per resident, `q` goes 0, 1, 2 with strictly increasing runs.
  - Trust run ≤ answer run, and there was a talk with that resident in that run.
  - The note exists, was posted that run, matches the question, and answers only one question.
  - Every note that uses a learned word was posted in or after the run that taught it.
- **Endings unchanged:** C still needs 12 notes and D still needs "wait · together", so finished saves still validate.

## UI
- **Talk dialog, trusted resident:**
  - After an answer: the reply, then "[New word: *remember*. It is in the note builder now.]"
  - With a question open: the question, plus an aside giving the note's form and "post it, then talk to X again".
  - If a note posted this run doesn't fit: "Not quite."
  - If a needed word is still unlearned: the aside names who uses it.
  - Chain done: a closing line.
- **Note builder:** all three steps filter by `wordAvailable`. Words show in a two-column grid so 11 subjects fit on mobile.
- **Journal:** a Questions section (each open question and its note form), plus the learned words.
- **HUD:**
  - The Residents row reads `TRUST n/3 · ANSWERED n/9`.
  - While a question is open, the objective is "Answer Juno." (after the lamps, before "Leave something…").
- **Run transition:** the toast adds "Learned: remember, keep." for words learned that run.
- **Endings:** each ending screen quotes up to three answer notes; ending C quotes the wall.

## Modules
- **New:** `js/resident-questions-dialogue-lines.js`, loaded after `residents-dialogue-lines.js`.
- **Changed:**
  - content tables and rules (rules file stays under 200 lines)
  - residents talk UI and residents dialogue lines (hints move out)
  - note builder, HUD/journal, run transition, endings
  - `style.css`, `index.html`

## Tests
- **State tests:**
  - question order
  - one answer per resident per run
  - the note must be from this run
  - a non-matching note doesn't answer
  - one note can't answer twice
  - learned words are blocked until taught
  - cross-chain dependencies
  - the full chain fits the budget table
  - a legacy save without `answers` loads
  - forged answers and early learned words are rejected
- **Browser:** answer Juno's first question in the room (talk, post, talk) and see the new word in the builder. Existing journeys still pass.
- **Docs:** design guidelines §6.3–6.4 and the as-built section, README, VERIFICATION.

## Risks
- **Chains feel like chores:** several notes fit each question, and the aside always states the form.
- **Longer word lists crowd the builder:** use the two-column grid and check it at 390px wide.
- **Fast players still get an empty run 5:** watch this in the next playtest. The fix would be a 4th question each, or a cap of two answers per run.

## Decisions / open
- Ending C keeps the 12-note rule (no answer given; "every question answered" would break finished saves).
- Resident chains are a replacement for the trusted lines' hints, not an extra layer. Confirm this is fine.
