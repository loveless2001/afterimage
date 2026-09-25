# Milestones 4–7 — Residents, endings, polish, verification (complete the game)

Source: `docs/design-guidelines.md` §2.2, §6.4–6.7, §7, §8, §12, §12a. All writing stays generic: an archive room, residents, what survives a reset.

| # | Phase | Status |
|---|---|---|
| 4 | Residents: Wren, Juno, Pell; talk cost; trust requests; recognition; name subjects in the kit | done |
| 5 | Turn at run 6, endings A–C plus secret D, revisit, room traces | done |
| 6 | Night palette (auto/day/night), audio cues, `?debug` overlay, accessibility pass | done |
| 7 | State tests, Playwright journeys per ending, CDP smoke runner (scratchpad), docs | done, except the Playwright run (the user's shell) |

## Rules (pure `step`)
- **`Talk {resident}`:**
  - The first talk with a resident in a run costs 1 and records `talks:{id,run}`.
  - Talking again later in the same run is free.
  - Trust is recorded when a resident met in an earlier talk has their request met:

    | Resident | Role | Request |
    |---|---|---|
    | Wren | keeps the run log at the desk | recognition: the pinned note names Wren |
    | Juno | tends the lamps | the notice hall lamp is lit |
    | Pell | reads the notice hall | a note naming Pell is on the wall |

- **Kit:** subjects 5–7 are the resident names. A name appears in the builder only once that resident has been met.
- **Endings:** available from run 6 onward (`turnRun`).

  | Ending | Title | Requires |
  |---|---|---|
  | A | record | nothing (always available) |
  | B | lights | all 4 lamps lit |
  | C | wall | 12 or more notes on the wall |
  | D (secret) | alcove | all 3 residents trusted, plus a wall note using the words "wait" and "together" |

- **Choosing an ending:**
  - `Finish {ending}` works mid-run from the desk on run 6 or later, or from the alcove bench for D. It logs the run with the end reason `ending`.
  - Run 7's `EndRun` requires a chosen ending and takes no pin.
  - `Revisit` undoes the ending: it pops the last log entry and restores that run and its budget.
- **Other actions:**
  - `SetPalette {auto|day|night}` sets the palette.
  - `VisitBench` records `benchSeen`, so the journal lists the bench once touched.
- **Validation:**
  - Talks and trust are consistent; a note naming a resident needs an earlier meeting.
  - Ending prerequisites still hold in the final state.
  - Spending covers lamps, notes and talks.
  - Legacy saves get defaults, and a finished legacy save becomes ending A.

## Modules
- **New:**
  - content tables
  - resident dialogue lines
  - resident talk and trust UI
  - endings (choice screens and traces)
  - palette theme
  - playtest debug overlay
  - render objects and characters, split from the render loop
- **Changed:** the rules (step and validation), the context (dynamic room objects), HUD, menu (palette), audio (cues), render, CSS (night tokens).
