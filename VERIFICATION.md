# Verification — 7 September 2026

The prologue was tested with Node and headless Chromium on Linux in WSL. A native Windows browser was not available for direct testing. The Windows launcher is a simple `start` command opening the local HTML file; it has been inspected, not executed on Windows.

## Passed

- JavaScript syntax checks for `game.js` and `state.js`; shell syntax check for `serve-wsl.sh`.
- Six state tests, including backward-compatible flower placement and shelf-aware path routing: all legal retained-memory pairs and JSON round-trips; reset prerequisites; malformed-save rejection; valid ending saves.
- Full first-cycle traversal through normal browser controls: meet Moth, give the flower, read the terminal, listen to the receiver, choose retention, confirm reset.
- Complete second cycle with name + song: recognition scene, threshold refusal without relays, physical traversal to both relays, witness ending.
- Complete second cycle with name + route: recognition scene, shortcut without relays, witness option disabled, obedience ending.
- Complete second cycle with route + song: stranger reunion, shortcut without relays, stay ending.
- Export to a real JSON download, reload a completed game, import that save, reject a malformed import without altering current progress.
- Direct `file:` launch and loopback HTTP launch via the WSL helper.
- Import of the direct-file export into the separate localhost origin, followed by successful reload.
- Keyboard movement and shelf collision: a player moved into a shelf stopped outside its collision boundary.
- 1440 × 960 desktop and 390 × 844 narrow viewport screenshots inspected; no horizontal page overflow at the narrow size.
- Small-viewport pointer movement and interaction; dialogue focus containment; Escape; sound on/off.
- Storage-denied browser context: game remains playable and manual export still downloads.
- No page-level JavaScript errors and no external runtime requests in the complete direct-file journey tests.

State command:

```bash
node tests/state.test.cjs
```

Complete direct-file browser journey command used the existing Playwright installation available in this workspace:

```bash
PLAYWRIGHT_MODULE=/home/lenovo/projects/openloop/node_modules/@playwright/test node tests/browser.cjs
```

The application does not depend on that repository or Playwright at runtime. To run the test elsewhere, point `PLAYWRIGHT_MODULE` at an existing Playwright package, or install Playwright in your own development environment. Set `GAME_URL` to test a hosted copy. Browser test artifacts were saved under `/tmp/afterimage-verification`; `preview.png` was replaced on 25 September 2026 with a capture of the current game (run 03, desktop).

Chromium and the loopback server required execution outside the tool sandbox because its process/socket restrictions blocked them. They ran successfully under the available automatic approval mechanism.

## Limits and next checks

- Native Windows Edge/Chrome/Firefox execution and the `.cmd` launcher still need a real Windows smoke test. The runtime has no compilation or external dependency to install.
- Human playtesting has not happened. The 8–12 minute length, emotional response, navigation clarity, and balance of memory choices are design targets.
- Mobile is a fallback layout, with a small overview of the archive; desktop/laptop remains the intended first-playtest target.
- Click-to-move now uses shelf-aware routing. The field journal also offers named walking destinations. Clicking inside a shelf asks for an open destination.
- No controller support, key rebinding, full screen-reader spatial navigation, multiplayer, live model calls, combat, or later chapters are implemented.
- Browser local-storage behavior differs across direct-file origins and privacy settings; manual JSON transfer is the portable save path.

The initial prototype verification preceded repository creation. A local Git repository and the incident research library were added afterward at the user's request. The gameplay files were not changed by the research update; no push or public deployment was performed.


## Demo refinement validation

The shared flower-placement activity, Field journal, and shelf-aware walking were added on 7 September 2026. Existing v1 saves remain supported; missing flower placement defaults to the original arrangement.

Re-ran all six state tests and the complete direct-file Chromium browser suite. All three retained-memory pairs and endings passed, as did save import/export, storage denial, small-screen controls, and modal focus. Added browser checks cover arranging the flower, recognition of its placement after reset, journal navigation around an intervening shelf, and placement persistence after reload. No page errors or external runtime requests were observed.

The updated localhost game also rendered in the Windows Codex in-app browser. This is a layout/load check, not a complete native Edge/Chrome/Firefox playthrough. Human playtesting and first-read timing remain outstanding.

## Bend core rework — 23 September 2026

The story transitions now run in `core.bend`, compiled by Bend 2.0.16 into `bend-core.js`. The existing browser save format and direct-file launch remain supported. Canvas drawing, dialogue text, input, audio, and pathfinding remain in JavaScript. Bend's `All terms check.` confirms that the core type-checks; it is not a proof of every game-design rule.

Checks run from the repository root:

```bash
BEND_NO_TELEMETRY=1 bend core.bend
bash build-bend.sh --check
node --test tests/state.test.cjs
PLAYWRIGHT_MODULE=/home/lenovo/projects/openloop/node_modules/@playwright/test node tests/browser.cjs
git diff --check
```

The complete direct-file browser journey passed for all three endings, reset and relay paths, save import/export, storage denial, narrow viewport controls, and journal navigation, with no page errors or external runtime requests. Chromium needed execution outside the filesystem sandbox because its launch failed there with `Operation not permitted`. A native Windows browser smoke test and human playtest remain outstanding.

## Engine split + plain-JS rules — 25 September 2026

The Bend core was removed. Story rules are now a pure `step(state, action)` in `js/story-state-rules-and-save-validation.js`. `game.js` and `state.js` were split into 12 classic-script modules under `js/` (loaded by `index.html`, each under 200 lines). Sections above that mention `game.js`, `state.js`, `core.bend` or `build-bend.sh` describe the earlier layout. The save key and JSON shape are unchanged.

Checks: `node --check` on every `js/*.js`, `node --test tests/state.test.cjs`, and the Playwright browser command from the Bend section above (the Bend build commands no longer apply).

- **Syntax:** `node --check` passed on all modules.
- **State tests:** 8/8 passed (the 7 original scenarios ported to semantic actions, plus a new check that `step()` is pure).
- **Rules equivalence:** a one-off fuzz script (not kept in the repo) ran 20,000 random sequences (1.2M steps) against the old Bend-backed `state.js`. States, accept/reject results, and `canOpen`/`canFinish`/`canReset` were identical, and the runs covered cycle two, all endings and replay.
- **Text preservation:** every string literal from the old `game.js`/`state.js` appears verbatim in the new modules, apart from two renamed template strings and the removed Bend loader.
- **Code review:** no behavior drift found (`plans/reports/code-reviewer-260925-0317-engine-split-review.md`).
- **Browser journey:** passed, run by the user in their own shell. Covers all three endings, reset and relay paths, save import/export, malformed-import rejection, storage denial, narrow-viewport controls, modal focus, and journal navigation. No page errors or external requests. A native Windows browser test and a human playtest are still outstanding.

## Milestone 2: runs, budget, new room — 25 September 2026

The Moth prologue was retired. The game is now seven runs in one room, with an authored budget table (`[10, 6, 12, 7, 14, 9, 12]`, provisional). Four persistent lamps are the budget sink, and there is a run log, an exit, and a notice hall that stays empty until notes arrive. Saves use the new key `afterimage.v2`. A v1 prologue save is detected and left untouched.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/browser.cjs`.
- **State tests:** 8/8 passed. They cover lamp costs, no double lighting or overspending, both ways a run can end, the budget table, run 7 finishing the game, 22 malformed-save cases (including spending that doesn't match the lit lamps), and purity.
- **Layout:** every object and the alcove are unblocked and reachable from the entrance (visibility-graph check).
- **Code review:** no bugs found (`plans/reports/code-reviewer-260925-0322-runs-budget-review.md`). The mobile budget bar is now hidden at 520px or narrower, where it shows the number only, per design §4. This fix came after the browser run below; a headless check confirmed the computed `display` is `none` at 500px wide and `flex` at 1440px.
- **Headless Chromium smoke:** the title screen and room render from `file://` with no console errors.
- **Browser journey:** passed, run by the user in their own shell. It covers:
  - run 1 lighting a lamp, then leaving through the exit
  - run 2 starting with the table budget and the lamp kept
  - spending to 0, which ends the run only after the dialog closes
  - the run log and export
  - an empty-budget save resuming into the next run
  - run 7 finishing the game
  - import, malformed-import rejection and the untouched v1 save
  - mobile, keyboard, sound, journal routing and blocked storage

  No page errors or external requests.

## Milestone 3: notes, phrase kit, handoff pin — 25 September 2026

Notes are built from the preset phrase kit (5 place subjects, 6 verbs, 5 qualifiers; resident subjects follow in M4) and cost 1. They stay on the 24-slot wall, where this run's notes show blue and older ones as faded ghost cards. A full wall asks which note to take down, and the new note reuses its slot. As a run ends, one wall note can be pinned at the entrance, and the next run opens by reading it. Saves from M2 without notes still load.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/browser.cjs`.
- **State tests:** 12/12 passed. New tests cover note cost and slot order, invalid phrase parts, full-wall replacement, pin rules, note validation (duplicate slots, future runs, a pin pointing at the current run, spending), and loading an M2 save.
- **Layout:** the new entrance pin board is reachable and not blocked.
- **Headless Chromium smoke:** the page loads from `file://` with no console errors.
- **Browser journey:** covered by the complete suite below.

## Milestones 4–7: residents, endings, polish — 25 September 2026

The game is complete: three residents with trust and recognition, the turn at run 6, three endings plus a secret one, revisiting, the night palette with a menu override, audio cues, and the `?debug` playtest overlay. All writing is original and generic.

- **Syntax:** `node --check` passed on all `js/*.js` (20 modules; the largest is 138 lines) and all `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 19/19. `tests/state-residents-endings.test.cjs` covers:
  - talk cost and trust rules
  - name subjects only after meeting
  - recognition from a pinned note
  - endings gated at the turn and by prerequisites
  - revisiting restoring the run exactly
  - the secret conditions
  - strict validation of talks, trust, endings and settings
  - older finished saves reading as ending A
  - forged trust being rejected
  - older pinned saves being upgraded
- **Layout:** every object and resident spot, both before the turn and after it, is unblocked, reachable from the entrance, and at least 85 apart.
- **Contrast (WCAG):** the day `--muted` token darkened from `#686b60` (4.39:1) to `#5e6156`, which is at least 4.95:1 on every light background, including the canvas glow. The night tokens measure 4.68–12.26:1 for text.
- **Smoke playthrough:** a scratch DevTools-protocol driver (not in the repo) drove headless Chromium through the real UI, with 22 checks and no page exceptions or console errors. It covered:
  - earning all three residents' trust across runs 1–2
  - the run 6 night palette and the turn announcement
  - secret ending D
  - revisiting, then ending A from the desk
  - a spent last run that must choose an ending (Escape can't skip it), then ending B
  - revisiting a spent last run, which asks again
  - the palette override

  Screenshots of night mode and the ending screens were checked by eye.
- **Narrow screens:** at 500px wide (the smallest headless window), mid-game in both day and night: no horizontal overflow. At 520px or narrower the panel shows only the notes and residents rows; the panel note already summarises the lamps.
- **Browser journeys:** `tests/browser.cjs` now runs two journeys:
  - `browser-journey-runs-notes-saves.cjs`, whose finished-game check now writes the last entry
  - `browser-journey-residents-endings.cjs`, which covers:
    - meeting a resident by walking up
    - Wren's recognition
    - the bench secret
    - revisiting
    - the desk's last entry
    - the menu's revisit and palette options
    - importing an empty-budget save with wall notes (from the M2 and M3 reviews)
    - `?debug`

  **Pending:** the Playwright run happens in the user's shell (same command as in the Bend section above).

**Code review of M4–M6** (`plans/reports/code-reviewer-260925-0419-residents-endings-review.md`) found one real bug and one smaller issue, both fixed:
- **Forged trust (bug):** `validate()` accepted trust that its request never earned, so an imported save could unlock the secret ending.
  - Trust now needs evidence: Juno needs the hall lamp lit by that run; Pell needs a note naming Pell posted by then; Wren needs the pin that opened that run to name her.
  - Run-log entries now record their pin, so Wren's check is exact. Older logs without pins are upgraded from the current pin.
- **Silent Escape (smaller):** the forced last entry on a spent run 7 now explains why Escape doesn't close it, instead of silently redrawing.

After the fixes, the state tests passed 19/19, the smoke playthrough passed with no page errors, and `node --check` passed on every file.

## Milestone 8: notes answer residents — 25 September 2026

After the first playtest (runs 3–5 dragged once lamps and trust were done), trusted residents now ask 3 questions each. A note posted that run answers, and each answer teaches a word for the note kit. See the milestone 8 section of `docs/design-guidelines.md`.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 23/23. The new file `tests/state-questions-and-learned-words.test.cjs` covers:
  - answers need a fitting note from this run
  - one answer per resident per run
  - the trust talk never also answers
  - one note answers one question
  - taught words are blocked until learned
  - cross-chain words name their teacher
  - all 9 answers fit the budget table by run 4
  - saves without `answers` load
  - seven forged saves (answers or early words) are rejected
- **Browser smoke (CDP, scratchpad runner, headless shell):** passed with no page errors. It covered:
  - the answer reply and "New word" line
  - the builder offering the learned verb in its two-column grid
  - the one-answer-per-run notice
  - "not quite" for a non-fitting note
  - the "Answer Pell." objective
  - Wren's missing-word hint naming Pell
  - `ANSWERED 9/9` and the words learned in the journal
  - the "Learned last run" toast
  - ending C's wall and answer quotes
  - ending B with no notes (regression)
  - the builder at 390px: 11 subjects and Cancel fit
- **Browser journeys:** `browser-journey-residents-endings.cjs` adds a step that answers Juno's first question in the room and checks the builder. The Playwright run (`tests/browser.cjs`, same command as above) passed in the user's shell on 25 September 2026.

**Code review** (`plans/reports/code-reviewer-260925-1138-notes-answer-questions-review.md`) found one critical regression, now fixed. `showEnding()` built every ending's text up front, and the new wall quote indexed an empty wall, so ending A or B with no notes crashed the ending screen. The quote is now only built when the wall has notes. The rules and validation had no findings.

## Progress cues in the room — 26 September 2026

Trusted residents wear blue rings; a card above a resident shows an open question (solid once a note posted this run answers it); the notice wall outlines its remaining top-row slots from 9 notes and rules the row at 12; the alcove warms one step per secret hint heard. See "As built: progress cues" in `docs/design-guidelines.md`. The shelf that hid the alcove bench was removed in the previous commit.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 24/24, including the new `hintsHeard` test (0 until a resident's last question is answered, then one per resident).
- **Browser check (agent-browser, seeded saves, 1440×960):** screenshots in day and night of run 4 with Wren ready (solid card), Pell waiting (outlined card), 10 notes (two outlined slots) and one hint heard; 12 notes (rule under the row) with three hints heard; run 1 with Juno trusted next to Pell untrusted, the card lifted over Juno's label. The objective read "Answer Juno." with the ready line in run 1 ahead of "Meet the residents.", and the journal showed the ready line and "11 more fill the top row."
- **Browser journeys:** `browser-journey-residents-endings.cjs` now asserts the ready objective before answering Juno. Passed, run by the user in their own shell.

## Second playtest and the answer cap — 26 September 2026

- **Human playtest:** the user played the full seven runs several times. Pacing was reasonable. The budget table stays: it may feel generous to someone who has played through several times, but new players may need it.
- **Native Windows browser:** tested by the user.
- **Change:** a run now takes at most 2 answers, whoever gives them, so the 9 questions last into run 5 (design §12a). Once the cap is reached, the other residents' question cards hide, the objective moves on, the journal says the open questions wait, and their dialog says so instead of asking for a note. Validation does not check the cap, so saves made before it still load. Plan: `plans/260926-1227-cap-answers-per-run/plan.md`.
- **Syntax:** `node --check` passed on all `js/*.js` and `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 25/25. The fast route now answers 8 by run 4 and the 9th in run 5. A new test covers the cap: two answers in run 2, a fitting note for Pell that doesn't answer, a pre-cap save with three answers in a run that still loads, and Pell answering in run 3.
- **Browser journeys:** new step: after Juno and Wren answer in run 2, the journal shows the ANSWERS line and Pell's dialog says the question waits, with no "Answer with a note". Passed, run by the user in their own shell.

## Errands from the pinned note — 26 September 2026

The pinned note can send a trusted resident on an errand as the next run starts (runs 2–5): Juno lights the next dark lamp, Pell keeps an old card found in the lit stacks, and Wren makes first talks free. The resident on an errand takes no answer that run. See "As built: errands from the pinned note" in `docs/design-guidelines.md`.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 30/30. New file `state-errands-from-the-pinned-note.test.cjs` covers:
  - Juno's free lamp, and a fitting note that doesn't answer while she's on the errand; the Juno pin means Wren doesn't recognise you.
  - Pell's cards in order, re-pinning, running out, and nothing from the turn onwards.
  - Wren's free talks, and no errand when the entrance lamp is dark.
  - Pins that aren't errands.
  - 14 forged saves, each rejected with the intended error (checked one by one).
  - Legacy saves, including a pin that would now qualify.
- **Browser check (agent-browser, seeded saves, 1440×960):**
  - The pin dialog shows the errand line and the preview under "Juno · light" only.
  - Pinning it opens run 2 with "Juno read it and lit the west stacks lamp…"; the lamp is lit and Juno stands by it with no card.
  - Run 3 with Pell's card: an old-paper card on the wall, Pell at the mouth of the west aisle (moved there after the first screenshot showed Pell hidden behind a shelf), and the journal's ERRAND and FOUND lines.
  - Run 3 with Wren at the entrance pin: the talk was free with no confirmation, and the dialog said her question waits.
- **Code review** (`plans/reports/code-reviewer-260926-1244-errands-from-the-pinned-note-review.md`) found two problems, both fixed:
  - **Critical:** validation checked that an errand's lamp or card existed, not that there was exactly one, so an edited save could add a second free lamp or card in the same run. It now requires exactly the effect; two new forgeries cover it.
  - **High:** the "That isn't quite it" line counted Pell's found card as a failed answer, so in a Pell-errand run another resident said it wrongly. It now counts only your notes; checked in the browser.
  - Accepted and commented: the wall-full case can't be replayed exactly (slots taken down later), so a forged card on a wall that was full gets through.
- **Browser journeys:** two new steps in `browser-journey-residents-endings.cjs`: the pin preview, the opening line, the saved errand and free lamp, busy Juno's talk; then Pell's card in the journal, and Juno not counting it as your note. Passed, run by the user in their own shell.

## Ending call-outs and the Revisit hint — 29 September 2026

After endings A–C, the two residents whose endings you passed over point to them (ready, reachable after a revisit, or late). The resident whose ending you chose may add a bench hint. The objective names the two residents, and the Revisit buttons say they rewind. See "As built: ending call-outs" in `docs/design-guidelines.md`.

- **Syntax:** `node --check` passed on all `js/*.js` and `tests/*.cjs`.
- **State tests:** `node --test tests/*.test.cjs` passed 34/34. New file `state-ending-callouts.test.cjs` covers:
  - finishing at run 6: Juno and Pell reachable, Wren's bench hint once the bench is seen, and Revisit landing exactly on `revisitTarget`
  - a spent last run: lamps met → Juno ready, Pell late; wall met → Pell ready, Juno late
  - the bench hint ready only once seen, and silence after the secret ending
  - line wording: one lamp, two lamps, one gap, four gaps, twenty-one cards
- **Browser check (agent-browser, seeded saves):**
  - Ending A at run 6 (1 lamp, empty wall, bench seen): the Revisit detail reads "Rewinds to run 06 with 9 budget left…" on the ending screen and in the menu. Wren gives the closing line plus the bench hint. Juno says "Three lamps are still dark…", Pell says "…twelve gaps…" (both reachable).
  - The first objective named unmet residents. It now says "Two residents at the desk…" until both are met.
  - Ending A at run 7, budget spent, all lamps lit: "…with its budget spent…"; Juno ready, Pell late ("eight gaps"). Revisiting reopened the last entry with "Keep the lights" available and "Keep the wall" disabled.
- **Browser journeys:** one new assertion in `browser-journey-residents-endings.cjs` checks the objective after ending A. Passed, run by the user in their own shell (29 Sep 2026).

## Resident shapes, props and the player outline — 29 September 2026

Residents now differ by shape and a held prop, not colour alone. Wren is hunched, with the open log and a pencil. Juno is low and wide, with a lantern. Pell is tall and thin, reading a card. When a shelf hides the player, their outline is drawn over it. Rendering only: no rules or save changes.

- **Syntax and state tests:** `node --check` clean; `node --test tests/*.test.cjs` 34/34.
- **Browser check (agent-browser, seeded saves, 1280×581 and 1920×1080, day and night):**
  - Each resident is recognisable by shape and prop at both sizes. The first version of Wren's book (two tilted pages) read as a grin at the small size, so it is now a flat open book.
  - With the player at (620, 300) behind the east stacks, the outline shows on the shelf's dark and light faces, by day and at night.
  - Known and unchanged: the player's red marker can overlap a resident standing just behind them, and Juno's lantern crosses the desk-lamp post at the turn spot.
- **Browser journeys:** not affected (no text or rules changed). Passed with the ending call-outs, run by the user in their own shell (29 Sep 2026).

## Trust warmth — 29 September 2026

Trust now shows as warmth instead of blue rings. A trusted resident takes one step, and each answer adds one more, up to 4. Their body and rings shift warm, the rings thicken, and a faint glow grows. The glow is drawn with the light pools, so it shines at night. Meeting a resident doesn't count. Rendering only.

- **Syntax and state tests:** `node --check` clean; `node --test tests/*.test.cjs` 34/34.
- **Browser check (agent-browser, 1920×1080):** a save built with the real rules, with Wren at step 1, Pell at step 2 and Juno at step 4 (run 3 by day, run 6 at night).
  - The colours step up visibly: Wren's rings just touched, Pell's body mauve, Juno fully amber.
  - The first glow was invisible on the pale floor. It is now about twice as strong, and shows as a soft halo by day and a clear glow at night.
  - The player stays dark.
- **Browser journeys:** passed, run by the user in their own shell (29 Sep 2026).

## Paper views for the notice hall and the pin — 29 September 2026

The notice hall, each writing step, full-wall take-down, confirm, posted, the end-of-run pin chooser and the entrance pin now show paper instead of text lists: the wall of 24 holders, a large card being written, and a cork board. Taking a note down and choosing the pin are done by clicking cards. No rules or save changes.

- **Syntax and state tests:** `node --check` clean on all `js/*.js` and `tests/*.cjs`; `node --test tests/*.test.cjs` 34/34.
- **Browser check (agent-browser, a real-rules save in run 3: 5 older cards, 1 found, 2 this run's):**
  - Wall at 1440×960: colours match the room, and the empty top-row holders are outlined once 9 notes are up.
  - Writing: the card fills in word by word. Confirm shows the dashed NEW card in the next free slot, and posting turned it blue in that slot.
  - Pin chooser: "Juno · light" and "Pell · keep" have gold outlines with "ERRAND · JUNO" and "ERRAND · PELL", and their previews are listed below. Focus starts on the first card.
  - Entrance pin: one blue card on a cork board with a pushpin.
  - Phone (390×844): the wall wraps to 4 columns and the dialog scrolls. At night the wall and older cards go dark, and this run's and found cards stay readable.
- **Browser journeys:** the full-wall step now clicks the first card on the wall. The errand step reads the preview from the card's accessible name and checks the card shows "ERRAND · JUNO". Pending: the Playwright run in the user's shell.

## Field note link — 29 September 2026

The essay "The agent learned the judge" is now at `notes/the-agent-learned-the-judge.html` (renamed from `the-agent-learned-the-judge-revised.html`). It is linked quietly under the title screen's intro text, by a "Read the field note" button on every ending screen (new tab, reusing the title link's URL), and from the README. The Pages workflow now also copies `notes/`.

- **Checks:** `node --check` clean; `node --test tests/*.test.cjs` 34/34.
- **Browser (agent-browser):** the link shows at 1440×960 and 390×844, below the start button. `notes/the-agent-learned-the-judge.html` served 200 text/html, and ending A lists the new button after "Revisit the choice".
- **The page itself:** self-contained, with no external scripts, stylesheets, fonts or images (only citation links).
