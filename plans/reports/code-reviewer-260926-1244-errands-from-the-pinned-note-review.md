# Code Review: Errands from the Pinned Note (milestone 9)

Scope: `js/errands-pinned-note-tables-and-helpers.js`, `js/errand-lines-previews-and-reports.js`, diffs to
`js/game-rules-state-transitions-and-save-validation.js`, `js/game-content-tables-lamps-kit-residents-endings.js`,
`js/residents-talk-and-trust.js`, `js/notice-hall-note-builder-and-handoff-pin.js`, `js/hud-objective-and-field-journal.js`,
`js/playtest-debug-overlay.js`, `js/render-room-objects-and-characters.js`, `js/room-interactions-lamps-log-hall-exit.js`,
`tests/state-errands-from-the-pinned-note.test.cjs`, `tests/browser-journey-residents-endings.cjs`.
Design refs: `plans/260926-1244-errands-from-the-pinned-note/plan.md`, `docs/design-guidelines.md` ("As built: errands").
~650 LOC changed/added across 11 files. `node --test` and `node --check` re-run: still 30/30 green.

## Overall Assessment

The rule logic (`errandFor`, `applyErrand`, `canAnswerThisRun`, `talkCostIn`) is correct and well-bounded: errands only
fire for runs 2–5, judged on the pre-transition state, never on Revisit/Finish paths. The UI plumbing (pin preview,
opening report, busy line, journal, wall render, run log, debug overlay) is thorough — I found only one missed spot.
The serious problem is in `readErrands`: its per-run "at least one matching effect exists" checks are not "exactly
one," which lets a hand-edited save grant unearned free lamps/cards while still passing validation. This directly
undercuts the stated design goal ("Validation ... requires exactly the effect") and the already-tested 12 forged-save
scenarios don't happen to cover this shape of forgery.

## Critical Issues

### 1. `readErrands` accepts duplicate `by`/`found` grants — forged saves get free lamps and cards beyond what the errand earned
**File:** `js/errands-pinned-note-tables-and-helpers.js:78-82`

```js
const lamp = lights.find(l => l.by === 'juno' && l.run === e.run), card = found.find(n => n.run === e.run);
return want && !want.why && want.id === e.id && lamp?.id === want.lamp && card?.found === want.found;
...
return ok && lights.every(l => !l.by || sent('juno', l.run)) && found.every(n => sent('pell', n.run)) ? errands : null;
```
`lights.find`/`found.find` only check the *first* matching entry against the errand's expected effect. The final
`lights.every(...)`/`found.every(...)` guard only requires each `by`-flagged light (or found note) to belong to a run
that has *some* matching errand — it never checks there's exactly one, or that extra ones match anything. Confirmed
live with the repo's own engine (bypassing the browser, only `S.validate`):

```
$ node -e "... juno() ...; x.lights.push({ id: 'east', run: 2, by: 'juno' }); S.validate(x)"
VALIDATED OK -- lights: [{"id":"hall","run":1},{"id":"west","run":2,"by":"juno"},{"id":"east","run":2,"by":"juno"}] budget 6
```
One real Juno errand (which legitimately lights only `west`) plus a single appended `{id:'east', run:2, by:'juno'}`
line makes `east` validate as a second free lamp, and the run's `spent`/`budget` don't need to change at all (both
`by`-lights are excluded from `lampSpend`). The same shape works for `found` notes:
```
$ node -e "... post Pell·keep, end 'left' ...; x.notes.push({run:3, parts:[...S.foundNotes[1].parts], slot:6, found:1});"
VALIDATED OK -- found notes: [{"run":3,...,"found":0},{"run":3,...,"found":1}]
```
A single Pell errand yields two accepted found cards instead of one. Because a resident can have at most one errand
per run but there are 3 lamps and 4 found cards total, a save-editor who reaches even one real Juno/Pell errand can,
with one array-append, claim **every remaining dark lamp or every remaining found card in that same run** — e.g. add
`east` and `entrance` alongside a single validated `west` grant to fully light the room for free off one errand.

**Fix direction:** replace the "exists somewhere" checks with an exact per-run/per-errand count, e.g. collect
`lights.filter(l => l.by === 'juno' && l.run === e.run)` and `found.filter(n => n.run === e.run)` and require each
array have length exactly `want.lamp ? 1 : 0` / `want.found !== undefined ? 1 : 0`, matching the single element found.
This also removes the need for the separate trailing `lights.every`/`found.every` (or keep it as a cheap early-exit).

## High Priority Findings

### 2. Found cards falsely trigger "That isn't quite it. Not yet." for other residents' questions
**File:** `js/residents-talk-and-trust.js:77`
```js
const tried = open && S.onWall(state).some(i => state.notes[i].run === state.run && !state.answers.some(a => a.note === i));
```
This wall-note scan wasn't updated for found cards (unlike every other "notes this run" spot — HUD count, run log,
debug overlay, `answerNote`, validation spending — which all now filter through `S.postedByYou`). Failure scenario,
no save editing needed: run 2–5, Pell is sent on an errand and finds a card at run start (pushed to the wall with
`run: state.run`, unlinked to any answer). If the player then talks to Juno or Wren first (before posting anything
this run) and that resident has an open, unanswered, answerable question, `canAnswerThisRun` is true, so `tried`
evaluates — and finds Pell's found card as "a wall note from this run that answered nobody" — showing "That isn't
quite it. Not yet." even though the player hasn't posted a single note. This is reachable in ordinary play any time
a Pell-errand run also has another resident with a live question, which is a common state around runs 2–4.

**Fix:** `state.notes[i].run === state.run && S.postedByYou(state.notes[i]) && ...` (same pattern used everywhere
else in this diff).

## Medium Priority Findings

### 3. `readErrands`'s wall-occupancy replay for Pell can be gamed by a later "take it down"
**File:** `js/errands-pinned-note-tables-and-helpers.js:74-82` (the `before.notes` prefix + `errandFor`'s
`onWall(s).length < wallSlots` check, `js/game-content-tables-lamps-kit-residents-endings.js:88-89`)

This is the leniency the plan explicitly flags ("the wall-full case can't be replayed exactly ... is the chosen
leniency safe?"). Analysis: a note's `slot` field only ever transitions non-null → null (a wall note is created
already on the wall; `Post` with `replace` is the only way to clear a slot, and nothing ever re-occupies an existing
note object). So for any note with `run < e.run`, its *final* slot value in the save is always **≤** its true
historical occupancy at the moment run `e.run` started — it can read `null` in the final save even though it was
still on the wall at that past instant, if it was taken down at some run after `e.run`. Consequence: `readErrands`'s
`onWall(before)` can only *undercount* the true historical wall usage, never overcount. That means the direction of
error only ever turns a true `full` (which should have produced no found note at all) into an apparent `not full`
that validates a forged found-note entry — i.e. it can admit histories the real rules could never produce, but it
cannot falsely reject a legitimate save (a real playthrough's found-or-not decision is baked in live, at the moment
`applyErrand` runs, using the true then-current state — not reconstructed later). So: **one-directional risk, no
false rejects, but a real soundness gap** an editor could use to get a found card in a run where the wall was
actually full at the time, by additionally editing a later run's own note-taking-down to make room for it in the
final snapshot. Bounded impact (at most 4 found notes ever exist, same cap as legitimate play), and constructing it
requires more save surgery than issue #1, but it's the same family of bug: the save schema keeps only final slot
state, not a timeline, so exact replay of a point-in-time "is the wall full" check is structurally impossible from
this schema. I did not build a full repro (would need a legitimately-shaped 12-note save); flagging as answered-but-
unverified-by-repro given time budget — recommend at least a comment near the code acknowledging this is a known,
accepted, one-directional gap (the current comment reads as if only "can't be replayed exactly" for cosmetic/log
reasons, not as a validation-bypass vector).

### 4. Errand UI text (`errand-lines-previews-and-reports.js`) has no automated coverage beyond one Juno path
Focus 5: the new browser-journey step (`tests/browser-journey-residents-endings.cjs` lines added after L58) only
exercises Juno's lamp errand (pin preview text, opening report text, busy-talk text). Pell's found-card preview/report/
busy line and Wren's free-talk preview/report/busy line, and every `why` message (`lit`/`dark`/`searched`/`full`,
including the `allFound` branch), are untested by any automated harness — `errand-lines-previews-and-reports.js` is
browser-only (`window.Afterimage`), not `require`-able from the Node test file, so the state-layer tests (which do
cover the underlying `errandFor`/`errandThisRun` data correctly per test file review) can't reach this file at all.
Per the task's "already verified" note this was checked once manually via agent-browser; it's real coverage debt for
regressions going forward, not a defect in the current code. Worth a follow-up browser-journey step for Pell/Wren if
this feature gets touched again.

## Low Priority / Observations

- `residents-talk-and-trust.js:81-82`: when a resident is both on an errand and the run's 2-answer cap is already
  full, only the errand-specific line shows (`onErrand` checked before the `fullLine` fallback). Not a bug — the
  errand reason is arguably the more useful one to surface — just noting the two states are conflatable and only one
  is ever shown.
- `js/errands-pinned-note-tables-and-helpers.js:41`: `foundNotes.findIndex` picks the lowest-index unfound card in
  lit stacks, matching the design's "in this order" wording; confirmed against the west/west/east/east table.
- Confirmed by inspecting `kit.subjects`/`kit.verbs`/`kit.qualifiers`: none of the 4 `foundNotes` entries name a
  resident (subjects used are 0/1/3/4, residents are 5–7) or use the secret's verb+qualifier pair (`wait`+`together`),
  so found cards can't accidentally satisfy a resident's trust request or the alcove secret. Matches the design's
  "secret untouched" claim.

## Focus-by-Focus Answers

1. **Rule correctness:** `EndRun` calls `E.applyErrand(s, next, pin)` after `next.run = s.run + 1` is set, so
   `errandFor(s, pin, next.run)` correctly judges the pre-transition state against the *new* run number — matches
   `chooseHandoff`'s preview call (`S.errandFor(state, i, state.run + 1)`), same state, same run arithmetic, no
   mismatch found. `applyErrand` is only reached on the non-final `EndRun` branch (the `last` branch returns before
   it), and `Finish`/`Revisit` never touch errands, so no errand can fire at run 6+ or on the final run —
   `lastErrandRun = turnRun - 1 = 5` plus the early-return in `EndRun` both independently enforce this.
2. **readErrands soundness:** see Critical #1 (exploitable, confirmed) and Medium #3 (structural, reasoned but not
   repro'd). The "notes are a prefix" ordering assumption itself is safe for legitimate saves (notes are always
   appended in non-decreasing run order by construction) and validate() never reorders `v.notes`, so no false reject
   there; the actual gap is the slot-value snapshot problem in #3 plus the count-checking gap in #1.
3. **"Yours" vs found-card spots:** all checked via grep for `.run === `/`notes.filter`/`notes.some` across `js/`.
   HUD this-run count, run log, debug overlay, wall render, notice hall listing, `answerNote`, and validation
   spending all correctly exclude/flag found cards via `S.postedByYou`. Only the "tried" line in
   `residents-talk-and-trust.js:77` was missed (High #2).
4. **UI text paths:** `chooseHandoff`/`showPinned` wiring is correct (preview uses the right pin/run, report only
   shown when non-null). `talkTo`'s free-talk skip-confirm (`S.talkCostIn(state) === 0`) is correctly resident-
   agnostic, matching that Wren's effect is global ("first talks" not "first talk with Wren"). Busy-line precedence
   is fine except the minor overlap noted in Low.
5. **Tests:** the 5 state tests in `tests/state-errands-from-the-pinned-note.test.cjs` are well-targeted and match
   the rules exactly (verified the `juno()`/`wren()` fixtures against the rule tables). None of the 12 existing
   forged-save mutations happen to be a duplicate-array-entry shape, which is why Critical #1 wasn't caught. The new
   browser-journey step correctly reproduces the same action sequence as the unit test's `juno()` fixture and checks
   real UI text, but only for the Juno path (Medium #4).

## Recommended Actions (priority order)

1. Fix `readErrands` to require an exact count (not "exists") of `by`-lights and `found`-notes per run — Critical #1.
   Add a forged-save test case appending a duplicate `by`/`found` entry to the existing forgery list.
2. Exclude found cards from the `tried` computation in `residents-talk-and-trust.js:77` — High #2. Trivial one-line
   fix, same pattern already used elsewhere in this diff.
3. Decide whether Medium #3 is an accepted, documented risk (update the code comment to say so explicitly) or worth
   hardening (e.g., record a `takenDownAfterRun` marker, or simplest: forbid replacing/taking down a `found` note's
   *neighbors* isn't the issue — the real fix would need per-note removal timestamps, which is a bigger schema change
   than this feature warrants; documenting the risk is likely the pragmatic YAGNI call here).
4. Optional: add a Pell/Wren browser-journey step alongside the existing Juno one for regression coverage of
   `errand-lines-previews-and-reports.js` text (Medium #4).

## Unresolved Questions

- Is Medium #3 (wall-full replay leniency) worth fixing given it's already an explicitly-accepted design risk in the
  plan, or is documenting it sufficient? I did not build a full repro to force the question.
- Should save-editing exploits like Critical #1 be treated as security bugs for a local single-player save file, or
  purely as "does validation do what its own doc claims" correctness bugs? Framed here as the latter, but ranked
  Critical because it's a one-line edit that defeats the feature's stated purpose (spending must match errand
  effects exactly).
