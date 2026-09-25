# Code Review: Milestone 8 — Notes answer residents (questions, learned words)

Date: 2026-09-25. Reviewed uncommitted diff + untracked files in `/home/lenovo/projects/afterimage` against `plans/260925-1138-notes-answer-resident-questions/plan.md`.

## Scope
- Reviewed: all files in `git status` (tracked diffs + untracked `js/resident-questions-dialogue-lines.js`, `tests/state-questions-and-learned-words.test.cjs`; `README.md` and `docs/design-guidelines.md` also carried uncommitted changes at review time).
- Full read: `game-content-tables-lamps-kit-residents-endings.js`, `game-rules-state-transitions-and-save-validation.js`, `resident-questions-dialogue-lines.js`, `residents-dialogue-lines.js` (unchanged, for comparison), `hud-objective-and-field-journal.js`, `notice-hall-note-builder-and-handoff-pin.js`, `endings-last-entry-secret-bench-and-screens.js`, `run-end-transition-and-handoff-routing.js`.
- ~330 lines of diff, ~450 lines of full-file context.
- `node --test tests/*.test.cjs`: 23/23 pass (re-ran fresh, confirmed).
- Did not run the Playwright suite (blocked per instructions; already verified by author).

## Critical

**1. `showEnding()` crashes when the ending is reached with zero notes ever posted on the wall.**
`js/endings-last-entry-secret-bench-and-screens.js:57,64`:
```js
const state = G.state, e = S.endings[state.ending], quote = i => `“${S.noteText(state.notes[i].parts)}”`, wall = S.onWall(state);
...
const text = {
  record: [...],
  lights: [...],
  wall: [`${wall.length} cards stay on the wall, from ${quote(wall[0])} to ${quote(wall.at(-1))}. None of them is signed.`, ...],
  alcove: [...]
}[state.ending];
```
Object-literal values are evaluated eagerly in JS, so `quote(wall[0])`/`quote(wall.at(-1))` run **regardless of which ending was chosen**. When `wall.length === 0`, `wall[0]` is `undefined`, and `quote(undefined)` does `state.notes[undefined].parts` → `TypeError: Cannot read properties of undefined`.

Both the **record** ending (`need: 'Always available.'`) and the **lights** ending (only requires every lamp lit) have no note requirement, so this is trivially reachable in normal play (e.g. a player who lights every lamp and never posts a note). Confirmed with a scripted playthrough:
```
node -e "... light all 4 lamps every run, never Post, Finish with ending 'lights' ..."
→ Finished with ending lights, notes on wall count 0
```
and confirmed the crash is real by replicating the exact object-literal shape in isolation (throws `TypeError`). The pre-diff code only read `S.onWall(state).length` here (no indexing), so this is a new regression, not pre-existing.

Impact: the ending screen (the payoff of the whole 7-run game) never renders; `G.state.finished`/`ending` are already saved (set in the earlier `setTimeout` in `finishRun`, before the one that calls `showEnding`), so the player is left in a finished-but-no-dialog state. They can recover via the menu's "Revisit the ending" (`js/menu-export-import-and-startup.js:25`, which calls `A.revisitEnding` directly, not `showEnding`) — so it's not unrecoverable, but it will also re-crash every time they click "Continue" from the title screen on a save that finished this way (`resume()` → `A.showEnding()`), and it crashes again if they re-pick `record`/`lights` without posting a note.

Fix direction: guard the `wall` case, e.g. only build that line when `wall.length`, or move `quote(wall[0])`/`quote(wall.at(-1))` behind `state.ending === 'wall'` (a function/ternary instead of an eagerly-built object literal) — this case can't actually occur for the `wall` ending itself since it requires ≥12 wall notes, only for the other three endings whose branches are evaluated as a side effect of building the lookup object.

## High

None beyond the above. The rules/validation core (the primary ask) held up well under targeted adversarial testing — see below.

## Verified correct (no issue found, worth recording since these were the focus areas)

- **"Talk that earns trust never answers":** `step()`'s `Talk` case gates `answerNote` on `C.isTrusted(s, id)` using the pre-talk state `s`, not `next` — trust granted in this same call can't also produce an answer in the same call. Matches `validate()`'s `trust.run > a.run` check (equal is allowed — a second talk in the same run the trust was earned can answer, which is correct and exercised by the test suite).
- **"One answer per resident per run" / "note answers at most one question":** enforced both at generation time (`answerNote` excludes notes already used; per-resident answer count gates `openQuestion`) and at validation time (`mine[q-1].run >= a.run` fails; `unique(answers, a => a.note)`).
- **Legacy saves / forged saves:** `list(v.answers, true)` defaults missing `answers` to `[]` — confirmed a `fresh()` save with `answers` deleted round-trips through `validate()`. Tried a hand-built forged save that exploits the "note index vs. taught-word" ordering check (`js/game-rules-state-transitions-and-save-validation.js:147-150`, `a.note < i` rather than "posted after the teaching *talk*"): built a save where a note using a freshly-taught word sits immediately after the answering note with only one collapsed `talks` entry. It validates — but I confirmed via `step()`/`advance()` that the identical final state **is** legitimately reachable (post the answering note, talk 3 times — meet, trust, answer — then post the word-using note); repeat talks in the same run never add a second `talks` entry, so the ambiguity is inherent to the save format, not a hole: at least one legitimate history produces the exact same serialized state, so accepting it is correct.
- **Full wall / note replacement:** taking a note off the wall (`slot → null`) doesn't retract a word it taught (`taught()` only reads `s.answers`, not slot state) and doesn't invalidate it as a past answer (`validate()` never checks `slot` for answer/teaching notes) — both match how `answerNote` only ever looks at wall notes *at the moment of the talk*, which is exactly what real play would have seen.
- **Revisit after an ending:** `Revisit` doesn't touch `answers`; re-entering the same run number, `answeredThisRun`/`openQuestion` are recomputed from the untouched `answers` array, so a resident can't be double-answered by revisiting and retrying.
- **Cross-chain `needs` (Wren Q3 needs Pell's `keep`, Pell Q3 needs Wren's `remember`):** purely informational for the UI aside (`js/residents-talk-and-trust.js:166`); the actual gate is `wordAvailable`/`taught`, so a note can never use an unlearned cross-chain word regardless of `needs` — confirmed by the forgery test (`js/notes[0].parts` using `light` before Juno teaches it → rejected).
- **Hint duplication (`js/residents-dialogue-lines.js` untouched):** the old trusted-resident lines (corner/bench/"wait together" hints) are only reachable once a resident has answered all 3 questions and the player talks again without a new answer — at which point the same hint was already delivered via the Q3 reply in `resident-questions-dialogue-lines.js`. I initially flagged this as an unfinished "move" (plan.md explicitly lists this as an open decision to confirm), but `docs/design-guidelines.md`'s new "As built" section states the hint "is repeated once all their questions are answered" — so this is documented, intentional behaviour, not a bug.

## Low

- `plans/260925-1138-notes-answer-resident-questions/plan.md`'s "Docs" line also calls for updating `VERIFICATION.md`; only `README.md` and `docs/design-guidelines.md` were touched. Not blocking.

## Metrics
- State tests: 23/23 pass (`node --test tests/*.test.cjs`).
- Browser journey: not re-run (blocked/pre-verified per task instructions).
- No type system in this codebase (plain JS); no lint config found to run.

## Recommended actions
1. **Fix before merge:** guard the `wall` ending text against `wall.length === 0` in `js/endings-last-entry-secret-bench-and-screens.js` (critical, trivially reachable, breaks the game's culminating screen).
2. Optional: add a state/browser test that finishes with `record` or `lights` and zero notes posted, to catch this class of regression going forward.

## Unresolved questions
- None for me; plan.md's own open item ("hints move… not an extra layer — confirm this is fine") appears resolved by the docs update (repetition is intentional), but worth the author double-checking that's still the desired call now that it's written down.
