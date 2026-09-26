# AFTERIMAGE — Design Guidelines (generic)

Generic design note for the next version: theme, color, type, world, UI, mechanics, gameplay loop, tech. Story content is out of scope here; every system below is story-agnostic, and the narrative layer plugs into it.

---

## 1. Pillars

1. **A readable room.** One isometric space you can hold in your head. Every interactive thing is visible and labelled on approach.
2. **What survives a reset.** Runs end. The room keeps some things and you don't. Persistence is the theme and the core mechanic.
3. **Quiet, not idle.** Low-saturation palette, soft sound, short text. Tension comes from choices and scarcity, never from reflex tests.
4. **Text-first.** Every clue is written. Sound and motion are optional layers.
5. **No hidden costs.** A consequential choice always states its cost before you confirm it.

---

## 2. Visual theme

**Mood:** a well-kept archive after hours. Paper, dust, one warm lamp, cool shadows. Think museum storage room crossed with a tidy train station.

**Rendering style:**
- Flat-shaded isometric boxes with three tones per object (top light, left mid, right dark). No outlines except for thin 0.7px seams.
- One warm radial light pool marking the "heart" of the room. A cool vignette at the edges.
- Slow dust motes (disabled under reduced motion).
- Characters are abstract. A floating body made of layered ellipse rings, with two small light slits for eyes. There are no faces, hands or clothes, so identity comes from color, ring count and a name plate.

### 2.1 Palette

Base tokens (CSS `:root`, already in use):

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#33362f` | Text, primary buttons |
| `--muted` | `#686b60` | Secondary text, hints |
| `--paper` | `#e9e7de` | Page and dialog background |
| `--red` | `#9c4438` | Accent, focus ring, warnings, eyebrows |
| `--line` | `#b6b7a9` | Borders, dividers |

Canvas palette:

| Role | Top | Left | Right |
|---|---|---|---|
| Floor | `#e2e5d7` (edge `#cad0bf`, grid `#abb69b40`) | – | – |
| Shelf / furniture | `#b8bcae` | `#818979` | `#4d584c` |
| Terminal | `#adb8a0` | `#7c8b73` | `#9aa58c` |
| Book spines (cycle) | `#d4d7c9` `#a9b49e` `#c0c7b6` `#8e9e89` | | |
| Lamp light | `#fbf7d6` at 50% → 0% | | |
| Player body | `#353e34`, marker `#984e40` | | |
| Resident body | `#69745f`, rings `#bbc5a6` (Pell's untrusted rings are neutral `#cfd0c2`) | | |
| Trusted resident rings | `#a9c3cf` (light `--note`), 0.9px | | |
| Interaction ring / label | `#9a574a` / `#704c40` | | |

Proposed additions:

| New token | Hex | Use |
|---|---|---|
| `--note` | `#5f7a86` | Persistent notes and anything carried across runs (cool slate blue, the only cool accent) |
| `--budget` | `#b8873a` | Run budget bar and its world glow (amber) |
| `--budget-low` | `--red` | Budget under 25% |
| `--ghost` | `#33362f40` | Traces of previous runs (translucent ink) |

**Color rules:**
- The cool slate blue is reserved for "things that persist". Players learn one rule: blue survives.
- Red appears only for focus, warnings and the player marker. Never decorate with it.
- Contrast is at least 4.5:1 for all DOM text. Canvas labels also get a DOM text equivalent in the HUD or journal.

### 2.2 Night palette (default from run 6)

| Token | Hex |
|---|---|
| `--paper` | `#1f231e` |
| `--ink` | `#e4e2d6` |
| `--muted` | `#a3a697` |
| `--line` | `#454b41` |
| floor | `#2b3029` |
| lamp | `#f3d99a` at 35% |

Implement it as `:root[data-theme="night"]`.

**Schedule:**

| Runs | Palette |
|---|---|
| 1–5 | Day. Follows `prefers-color-scheme` |
| 6–7 (the Turn onward) | Night by default, as the visual signal that the room has changed |

- The switch happens during the run-end transition into run 6. The next run opens with the toast "The lights are different tonight."
- The menu offers **Palette: auto / day / night**. `auto` follows the schedule above; a manual pick overrides it and is saved.
- The lamp pool grows warmer and brighter at night (`#f3d99a`), so the desk becomes the clear focal point.
- Blue notes keep `--note` but lift to `#8fb0bd` at night for contrast.

### 2.3 Typography

- Headings and narration: Georgia serif, 28–32px, weight 400, tight leading (1.1).
- Labels, eyebrows, IDs and counters: monospace, 9–11px, letter-spacing 1–2px, uppercase.
- Body: Arial or Helvetica 14px, leading 1.75.
- Asides and system notes: monospace 11px, muted, with a 2px left rule. Author them as `[bracketed]` paragraphs.
- Voice: short sentences. At most 3–4 paragraphs per dialog. Titles are one line.

---

## 3. World

### 3.1 Projection and bounds (keep current)

- `project(x,y,z) = { x: ox + (x−y)·s, y: oy + ((x+y)·0.48 − z)·s }`
- Walkable area: x 30..930, y 30..650. Obstacles are axis-aligned rectangles with a 13px collision margin.
- Pathfinding: visibility graph over obstacle corners (±17). This is already implemented and tested.

### 3.2 Room layout (zones)

```
        N (back wall)
  ┌──────────────────────────────┐
  │ STACKS W    NOTICE HALL  STACKS E │
  │   ▥▥▥      [▦▦▦▦▦▦▦]      ▥▥▥   │
  │            (persistent)          │
  │ ALCOVE    ☼ CENTRAL DESK   EXIT ⌂ │
  │ (secret)   (lamp, residents)      │
  │   ▥▥        ENTRANCE ◎      ▥▥   │
  └──────────────────────────────┘
        S (player spawns here)
```

- **Entrance (S):** the spawn point. The "last note" from the previous run is pinned here.
- **Central desk (lamp):** the social hub where residents gather. This is the warmest light.
- **Notice hall (N):** the persistent wall. It fills over runs and is the visual record of progress.
- **Stacks (W/E):** exploration, collectibles and small tasks.
- **Exit / threshold (NE):** where a run ends deliberately.
- **Alcove (W, tucked between the west shelves):** houses the secret-ending object. It stays in view but is easy to walk past.

**Zone rules:**
- Each zone has a floor label (large, 17px, 50% alpha) and a footer location string.
- The room never grows in size. Progress shows as density: more notes, more lights on, more residents.

### 3.3 Object kit

| Type | Shape | States |
|---|---|---|
| Shelf | long box plus rows of spine boxes | static |
| Terminal | box plus dark slanted screen, 3 text lines | idle / read |
| Notice slot | thin card (8×1×12) on the hall wall | empty / own note (blue) / old note (ghost) / pinned (blue + red pin) |
| Lamp | pole plus radial light | on / off |
| Relay / switch | pillar with a small round light | off (`#86675b`) / on (`#d3dbad`) |
| Threshold | two pillars plus lintel and a light panel | closed / open (panel `#f7f5d9`) |
| Resident | ring-body character | idle bob / talking (rings speed up slightly) |
| Collectible | small object on a low plinth | present / taken |

**Interaction:** within 83px the nearest object gets a red ring, a name label above it, and a DOM prompt ("E · Interact").

---

## 4. UI and HUD

| Region | Content |
|---|---|
| Top left | Eyebrow (`RUN 03 / ROOM 07`), objective h1, one-line hint |
| Top right | Panel. Row 1 is the **budget bar** (amber, 10 segments, numeric `7/10`). Below it, carried items or notes as a list (icon, title, state tag) |
| Bottom center | Interaction prompt; toast above it |
| Footer | Location, control hints, run ID |
| Header | Wordmark, Journal, Sound, Menu |
| Modal | Speaker eyebrow, title, paragraphs, vertical choice buttons |

**Rules:**
- Choice buttons read label first, with an optional `small` detail line stating the cost or effect.
- Toggle choices use `aria-pressed`. A confirm step follows any irreversible choice.
- The HUD is `inert` while a modal is open, focus is trapped inside the modal, and Esc closes or goes back.
- Mobile (≤520px): the panel shrinks to 127px, the footer hints are hidden, and the budget bar shows the number only.

---

## 5. Controls

| Input | Action |
|---|---|
| WASD / arrows | Move (screen-relative) |
| Click or tap floor | Path to that point (dashed line plus target ring) |
| E / Interact button | Interact with the nearest object |
| J / Journal | Journal with walk-to destinations |
| Esc | Menu, or close dialog |
| Tab | Cycle choices in a dialog |

There is no real-time pressure: walking is free and the budget is spent only by actions (§6.2).

---

## 6. Mechanics

### 6.1 Runs

- The game is a sequence of **runs**. Each run is a fresh character (new run ID and name plate), starting at the entrance.
- A run ends when the budget reaches 0 or the player leaves through the threshold. Leaving early is a choice, not a failure.
- **Between runs, the room keeps:** notice-hall notes, lights switched on, collectibles moved to the desk, and resident relationships (as flags).
- **Between runs, the character loses:** inventory, dialogue knowledge flags, and position.

### 6.2 Budget

- **Run 1:** fixed 10 segments (onboarding).
- **From run 2:** the budget varies per run from an authored table, not randomly, so every playthrough is the same length and testable. The table is **provisional**: tune it after the first playtest (§12a). Keep it in one data constant so tuning touches one line:

  | Run | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
  |---|---|---|---|---|---|---|---|
  | Budget | 10 | 6 | 12 | 7 | 14 | 9 | 12 |

  - Short runs (6–7) push toward posting notes and leaving early.
  - Long runs (12–14) allow resident trust and multi-step tasks.
- The run's budget is announced on the transition screen ("RUN 04 · 7") and shown in the HUD eyebrow.
- The budget segment count is shown as a number plus a bar, so it is readable without color.
- Costs:

  | Action | Cost |
  |---|---|
  | Walking, reading notes, opening the journal | 0 |
  | Talking to a resident (first time per run) | 1 |
  | Using a terminal or switch | 1 |
  | Posting a note | 1 |
  | Large actions | 2–3, cost shown in the choice detail |

- At ≤25% the bar turns red, a low hum starts (if sound is on) and the hint line mentions the exit.
- At 0 the current dialog finishes, then the run-end sequence plays. Never cut a dialog mid-sentence.

### 6.3 Notes (persistent layer)

- Post at any notice slot. A note is built from a **phrase kit** of 2–3 fragments (no free text), for tone control, localization and save size. Kit size is 8 / 6 / 5:

  | Set | Count | Fragments |
  |---|---|---|
  | Subject | 8 | desk · lamp · west stacks · east stacks · exit · resident 1 · resident 2 · resident 3 |
  | Verb | 6 | check · avoid · bring · ask · wait · leave |
  | Qualifier | 5 | first · later · never · together · again |

  - Resident subjects show as "someone" until that resident has been met in any run; after that they show the resident's name.
  - *As built (M3):* the kit has only the 5 place subjects. The resident subjects are appended in M4, so stored indices never shift.
  - *As built (M8):* nine learned words are appended after them: subjects *the dark*, *log*, *wall*; verbs *light*, *remember*, *keep*; qualifiers *tonight*, *still*, *for good*. Each is taught by answering a resident's question (see the milestone 8 section).
  - The alcove is deliberately not in the kit, so the secret has to be found by exploring, not by reading notes.
  - A note is subject + verb, with an optional qualifier. That gives 8 × 6 × 6 = 288 combinations.
  - A save stores a note as three small integers.
- Each note stores the run ID, fragment IDs and slot index.
- Old notes render as ghost cards. Notes from the current run render blue.
- Cap at 24 slots; when full, posting asks which note to take down.
  - *As built (M3):* a taken-down note stays in the save with `slot: null`, so each run's spending can still be checked against its lamps and notes. The wall fills from the top row.
- **Handoff:** at run end, choose one note (or none) to pin at the entrance. The next run starts by reading it.
  - *As built (M3):*
    - There is no handoff on the last run.
    - When leaving through the exit, the player can still choose "Stay in this run".
    - When the budget is spent, Escape means pin nothing.
    - The pinned note is quoted in the hint until the run spends anything, and the entrance pin board can be re-read for free.
- Notes can change the world. For example, a note "switch · west · first" makes the next run's hint point there, and residents may quote notes.

### 6.4 Residents

- 3–4 residents at the desk, each with a small state machine: `unmet → met → trusted → (ending-relevant)`.
- Dialogue is authored and keyed by run number band (1, 2–3, 4+), notes present, and relationship state.
- Residents persist across runs, so they remember the room but not your face. Recognition is a mechanic: a pinned note naming a resident unlocks a "recognized" greeting.

### 6.5 Choices and consent

- Big choices are always two-step: pick, then a confirm screen with a plain-language cost.
- Every choice list includes a way to step away.
- Choices can be revisited from the menu after an ending (replay from the last checkpoint).

### 6.6 Discovery and the secret ending

- The secret object sits in the alcove and is visible from run 1. It is labelled neutrally.
- It becomes meaningful only after a specific combination of persistent state (e.g. 2 residents trusted plus a specific note pinned).
- Nothing in the HUD points to it. The journal lists it only once it has been touched.

### 6.7 Endings

- 3 standard endings plus 1 secret. None is scored.
- Each ending has an ending screen (eyebrow `ENDING A / …`, title, 3 short paragraphs, bracketed note) with three options: remain in the room, revisit the choice, export save.
- After any ending, the room shows a permanent trace of it (a light, an object, an empty chair).

---

## 7. Gameplay flow

| Phase | Runs | Focus |
|---|---|---|
| Onboarding | 1 | Movement, interacting, budget, posting one note, leaving |
| Loop | 2–5 | Reading old notes, building resident trust, switching on lights, reaching the "long run" |
| Turn | 6 | The room changes (a new zone lights up, residents gather); the key choice unlocks |
| Resolution | 7 | Choose an ending, or find the secret |

- **Session length:** 25–40 minutes total, 3–6 minutes per run.
- **Objective line:** always one next step, derived from state (never a list).

---

## 8. Audio

- A drone of 3 sine oscillators (110 / 164.81 / 220.3 Hz) at very low gain.
- A 4-note motif for discoveries (329.63 / 293.66 / 220 / 246.94 Hz) with a 0.47s spacing.
- Budget low: an extra oscillator at 55 Hz that fades in.
- Note posted: a single soft tone at 440 Hz.
- Run end: the motif played backwards.
- Sound is off by default. Every audio cue has a text equivalent.

---

## 9. Motion

| Effect | Motion | Reduced motion |
|---|---|---|
| Character bob | ±2.5px, sine 1.8 Hz | none |
| Rings | rotate 0.09 rad/s | none |
| Dust | 22 motes | off |
| Run transition | 650ms fade out, 1600ms total | instant |
| Note appear | 300ms scale-in | instant |

---

## 10. Save and persistence

- localStorage key `afterimage.v2`. The v1 key is ignored, and a toast offers a fresh start.
- Save shape (JSON):
  - `version`, `run`, `budget`
  - `notes[] {slot, run, parts[]}`
  - `pinned`
  - `residents {id: state}`
  - `lights[]`, `desk[]`
  - `ending`, `secretSeen`
  - `player {x, y}`
- Validation is strict. Check types, ranges and cross-field rules (e.g. `pinned` must reference an existing note). Reject files over 20KB.
- Export and import JSON from the menu. Import always confirms before replacing.
- Save shape adds `palette: "auto" | "day" | "night"`.
- Rule logic is plain JS, with no Bend core for now. It uses one pure `step(state, action) → nextState | null` function, where `null` means the action is not allowed. The game never mutates state outside `step`, and the Node tests call the same function.

---

## 11. Tech layout (offline, `file://`, classic scripts, each file < 200 lines)

```
index.html
style.css
js/state-rules-and-validation.js   rules, fresh(), validate(), step()
js/pathfinding-visibility-graph.js findPath()
js/iso-projection-and-shapes.js    project/unproject/box/polygon/label/ring
js/world-layout-and-objects.js     obstacles, zones, object kit data
js/render-room-and-characters.js   draw loop, depth sort, lights
js/dialog-and-hud.js               dialog(), toast(), HUD, journal
js/notes-phrase-kit.js             fragments, note builder dialog
js/audio-drone-and-motifs.js       Web Audio
js/input-and-movement.js           keys, pointer, walkTo, update()
js/save-export-import.js           localStorage, export/import
js/main-game-loop.js               wiring, frame()
tests/state.test.cjs               rules plus validation
tests/browser.cjs                  Playwright journey, no external requests
```

---

## 12. Milestones

1. **Engine split:** move the current engine into modules with no behavior change and replace the Bend core with plain-JS `step()`. Remove `core.bend`, `bend-core.js`, `build-bend.sh`, `core-build.html` and `core-entry.js`; tests pass.
2. **Run and budget:** run counter, authored budget table, budget bar, run-end transition.
3. **Notes:** phrase kit, notice hall, ghost rendering, handoff pin.
4. **Residents:** state machines plus authored dialogue bands.
5. **Endings:** 3 standard plus the secret, the ending screens and the room traces.
6. **Polish:** night palette with its run-6 switch and the menu override, audio cues, mobile layout, accessibility pass.
7. **Verification:** state tests, a browser journey for each ending, and screenshots in `/tmp/afterimage-verification`.
8. **Notes answer residents** (after the first playtest): trusted residents ask questions that notes answer; answers teach new words.

---

### 12a. First playtest (budget tuning)

Track these per run with the debug overlay (add `?debug` to the URL). It stays local and is never sent anywhere:

| Measure | Target |
|---|---|
| Real time per run | 3–6 min |
| Segments left when the run ends | 0–2 on short runs; long runs may end early by choice |
| Notes posted per run | ≥ 1 from run 2 onward |
| Questions answered per run | at least one question still open going into run 5 (all 9 done by run 4 means run 5 is empty) |
| Runs that end by budget vs by leaving | roughly half and half |
| Total session | 25–40 min |

Tuning rules:
- If a run is under 3 minutes, add 1–2 segments.
- If players never leave early, shorten the short runs.
- Keep the short/long alternation.
- If players answer all 9 questions by run 4, give each resident a 4th question or cap answers at two per run.

---

## As built: residents, endings, polish (milestones 4–6)

- **Residents:** Wren (desk, the run log), Juno (the lamps), Pell (the notice hall). The first talk with each costs 1 per run, after a confirmation; talking again that run is free.
  - Trust needs an earlier meeting plus the resident's request:

    | Resident | Request |
    |---|---|
    | Juno | the notice hall lamp is lit |
    | Pell | a note naming Pell is on the wall |
    | Wren | recognition: the pinned note names Wren |

  - Before you meet them, residents are described by what they are doing; afterwards their names join the note kit (subjects 5–7).
  - Each resident's hint towards the secret now comes with the reply to their last question (M8), and is repeated once all their questions are answered.
  - From run 6 they gather at the desk; after the secret ending they sit on the bench.
- **The turn (run 6):**
  - The auto palette turns to night, and a toast announces the change.
  - The alcove glows, and the run log offers "Write the last entry".
  - The last run asks for the entry as it ends. It can't be skipped when the budget is spent; after leaving through the exit, you can still choose to stay.
- **Endings:** none is scored.

  | Ending | Requires | Trace left in the room |
  |---|---|---|
  | A, the record | always available | a closed log on the desk |
  | B, the lights | all 4 lamps lit | wider, brighter pools |
  | C, the wall | 12 or more notes on the wall | every card blue |
  | D, still here (secret) | all 3 residents trusted, plus a wall note with "wait" and "together" | the residents on the bench |

  - Each ending leaves the trace listed above.
  - Revisiting pops the last log entry and restores that run and its budget.
  - The alcove bench ("A quiet corner") is listed in the journal only after it has been found.
- **Palette:**
  - The menu cycles auto, day and night, and the choice is saved.
  - Auto follows the system colour scheme and turns to night from run 6.
  - The canvas darkens with a multiply layer at night, and the light pools shine through it.
- **Audio cues:** a single tone when a note is posted, the motif played backwards as a run ends, and a 55 Hz hum when the budget is at 25% or less (only if sound is on).
- **Playtest overlay:** `?debug` shows, per run, the time taken, how the run ended, the budget left and the notes posted, as the §12a targets require. It is in memory only.

## As built: questions and learned words (milestone 8)

The first playtest found that runs 3–5 dragged once the lamps were lit and all three residents trusted you. By then notes only counted towards 12, and trusted residents repeated one line. Now a note's words matter:

- Once a resident trusts you, they ask 3 questions in order (9 in total). The dialog always states the kind of note that answers, so nothing is guessed.
- **To answer:** post a fitting note this run, then talk to them again that run. It costs the usual first talk (1) plus the note (1); the answer itself is free.
- **Limits:**
  - One answer per resident per run.
  - The talk that earns trust never also answers.
  - A note answers at most one question.
  - A note from an earlier run doesn't count.
- **Rewards:** each answer earns a reply that quotes the note and teaches one word for the note kit.

  | Resident | Asks | Answered by | Teaches |
  |---|---|---|---|
  | Juno | where it was darkest | a place + avoid/check | *light* |
  | Juno | who the light is for | a resident + *light* | *the dark* |
  | Juno | what the dark should do | *the dark* + leave | *tonight* |
  | Wren | what goes on the blank line | any note with a qualifier | *remember* |
  | Wren | who you remember | a resident + *remember* | *log* |
  | Wren | what the log should keep | *log* + *keep* (taught by Pell) | *still* |
  | Pell | something worth reading twice | any note ending "again" | *keep* |
  | Pell | what the wall should keep | a place or resident + *keep* | *wall* |
  | Pell | something for all of us | a resident or *wall* + *remember* (taught by Wren) | *for good* |

- **Crossed chains:** when a question needs another resident's word, the dialog says who uses it.
- **Secret hints:** each resident's last reply carries their hint towards the secret. Ending rules are unchanged: C still needs 12 notes and D still needs "wait · together", so finished saves still load.
- **Where progress shows:**
  - the Residents row (`TRUST n/3 · ANSWERED n/9` once everyone is met)
  - the objective "Answer X." (after lamps, before "Leave something…")
  - the journal (each open question and its note form, plus the words learned)
  - the run toast ("Learned last run: …")
  - the ending screens, which quote each resident's latest answer; ending C also quotes the wall's first and newest cards
- **Note builder:** all three steps list only available words, in a two-column grid so 11 subjects fit at 390px.
- **Save:** `answers: [{ id, q, run, note }]`. A save without it loads with none.
  - Validation checks question order, one answer per resident per run, trust by then, a talk that run, and a fitting note from that run used once.
  - A note that uses a taught word must come after the note that earned it.
- **Playtest watch:** a fast route finishes all 9 by run 4, which could leave run 5 empty again. If so, add a 4th question each or cap answers per run.

## As built: progress cues in the room (26 Sep 2026)

The room was uniformly grey-green; progress only showed in the HUD and journal. A few quiet cues now use the existing colour rules (blue = persists, warm = light). Plan: `plans/260926-0047-progress-visual-cues/plan.md`.

| Cue | Shows | Text equivalent |
|---|---|---|
| Blue rings (`#a9c3cf`, slightly heavier) | the resident trusts you; trust persists, so it takes the blue | journal "trusts you", HUD `TRUST n/3` |
| Outlined card above a resident | their question is open and waits for a note | journal "Asks: …", objective "Answer X." |
| Solid blue card, pale edge | a note posted this run answers it; talk to them now | objective "Answer X." (ahead of every step but the turn) and the journal line |
| Blue outlines on the wall's empty top-row slots (from 9 notes) | ending C's 12 = the top row, which fills first | journal "n more fill the top row." |
| Blue rule under the top row (12+) | the row, and ending C's threshold, is full | journal "The top row is full." |
| Warm pool at the alcove, one step per resident whose questions are all answered | the secret's hints, heard in each last reply | the hints themselves |

- Cards and the wall cues are drawn after the night layer so they stay readable at night. Nothing animates. The alcove pool is part of the light pools, and from the turn it is the full alcove glow.
- Cards sit just above the head and lift over the name label when you stand next to the resident. They hide once the resident has answered this run, after their last question, and after an ending.
- The "wait · together" note is deliberately not marked.

## Decisions (2026-09-25)

- No Bend for now. Rules live in plain JS.
- Notes use preset phrases only.
- The budget varies from run 2, using an authored table.
- The palette switches to night at run 6, with a menu override.
- Target session length is 25–40 minutes.
- Phrase kit is 8 subjects / 6 verbs / 5 qualifiers.
- The budget table is provisional, to be tuned after the first playtest (§12a).
- Milestones 4–6 are built as described above. Milestone 7 verification is recorded in `VERIFICATION.md`.
- After the first playtest: notes answer residents' questions and teach words (milestone 8). Ending C keeps its 12-note rule.
- The secret's hints come only with each resident's last reply (repeated once all their questions are answered), never with the trust talk or the questions (26 Sep 2026). The alcove warmth counts these replies.
