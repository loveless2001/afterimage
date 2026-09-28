# Code Review: Notice-board paper views

## Scope
- `js/notice-board-and-pinned-card-views.js` (new)
- `js/dialog-modal-and-focus-trap.js` (scene arg, wide toggle, focus)
- `js/notice-hall-note-builder-and-handoff-pin.js` (callers of the new scene builders)
- `index.html` (one script tag), `style.css` (last 3 lines)
- `tests/browser-journey-runs-notes-saves.cjs`, `tests/browser-journey-residents-endings.cjs` (the two edited steps)

`node --check` on all three JS files: OK. `node --test tests/*.test.cjs`: 34/34 pass (unit rules layer untouched by this diff, as expected).

## Overall Assessment
Solid refactor. The new file is a clean, single-purpose view layer; the slot/index arithmetic (`confirm()`'s `slot`, `takeDown`'s `pick`, handoff's `done(i)`, `post()`'s `fresh` index) all mirror `step()`/`errandFor()` exactly — traced each against `js/game-rules-state-transitions-and-save-validation.js` and `js/errands-pinned-note-tables-and-helpers.js` and found no divergence. No note/slot can be mis-picked. Dialog's scene plumbing (reset, `.wide` toggle, focus, trap) is correct and no other `A.dialog` call site accidentally passes a 6th arg (grepped all callers). The two edited Playwright steps should still pass — traced both against the new DOM/accessible-name output.

## Critical Issues
None found.

## High Priority Findings
None found.

## Medium Priority Findings

1. **Textual equivalent for the read-only wall was dropped, not carried over** — `js/notice-hall-note-builder-and-handoff-pin.js:15-17` (`openNoticeHall`). The old code emitted one flat line per note ("RUN 01 / west stacks · check · first" …) as dialog paragraphs; that's gone, replaced by `[N of 24 slots used…]` plus the 24-holder board. Content is still exposed to AT (each card is real text in `<span class="word">`/`<small class="stamp">` inside `<li>`), so it's not a hard accessibility violation, but a screen-reader user now has to walk a 24-item list (many empty) instead of reading one summarized line. Same pattern in the word-builder step (`pick()`, line 32) where the old "So far: …" running-summary paragraph was removed in favor of the big draft card alone.
   - Suggestion: keep it as-is if intentional (the board *is* the summary), but consider adding an `aria-label` to the read-only cards too (matching what `pick` mode already does at `notice-board-and-pinned-card-views.js:39`) so each card reads as one utterance instead of disjoint spans.

2. **`.card.marked` outline fires for "why" (non-actionable) errand candidates too, with no visible label explaining it** — `js/notice-hall-note-builder-and-handoff-pin.js:73-74` combined with `js/notice-board-and-pinned-card-views.js:36`. `mark(i)` returns a truthy object whenever `errandFor` returns anything (including `{ id, why: 'lit' }` etc.), so the card gets the `marked` CSS outline (`style.css` line 6: `.card.marked{outline:2px solid var(--budget)…}`) even though `mark.short` is `null` and no "ERRAND ·" badge is shown. A player tabbing/looking at the board sees an outlined card with no on-card explanation of why (the explanation only exists in the asides text above). This is intentional per the code's own comment ("the short mark only for real errands") but is a UX ambiguity worth confirming is desired — not a defect, just flagging since it's easy to read as a bug.

## Low Priority Suggestions

1. **Focus-visible outline can be shadowed by `.marked` on a focused card** — `style.css` line 6. `.card.marked{outline:2px solid var(--budget);…}` has specificity (0,2,0), which beats the base `button:focus-visible{outline:3px solid var(--red);…}` at (0,1,1). Tabbing to a marked+focused card shows the amber "marked" outline instead of the standard red focus ring. Still visibly focused, just inconsistent with every other focusable element on the page. Minor; not blocking.

2. Take-down's card order changed semantics silently (from "oldest note by creation order" to "ascending physical slot order"). In the one scenario exercised by the tests they coincide (no prior take-downs, so `slot === index`), so the edited test (`tests/browser-journey-runs-notes-saves.cjs:82`) is correct, but worth documenting explicitly that "oldest first" is no longer literally true in general (e.g. after a prior take-down/replace, a low slot could hold a newer note than a higher slot). Not a bug — the physical-wall metaphor is arguably better UX — just a behavior change from what the old comment/name (`wallNotes(true)`) implied.

## Positive Observations
- `A.dialog`'s scene reset (`replaceChildren(...(scene ? [scene] : []))`) is unconditional every call, so there's no leakage between dialogs regardless of scene presence.
- `.wide` toggle keyed off `scene.classList.contains('board')` is precise — only the notice-wall board widens the dialog; the single draft card and the cork board correctly stay narrow.
- Focus trap (`querySelectorAll('button:not(:disabled)')` scoped to `#modal`) naturally picks up scene card-buttons with zero changes needed — good use of the existing DOM-order-based trap.
- `confirm()`'s and `post()`'s slot/`fresh` computations were checked line-by-line against `step()` in the rules module and match exactly; no drift risk even though the preview is computed independently from the actual mutation.
- Grepped every `A.dialog(...)` call site in the codebase (`room-interactions`, `residents-talk-and-trust`, `endings-last-entry`, `menu-export-import`, `hud-objective`) — none pass a 6th argument, so no accidental scene/`wide` activation elsewhere.
- Test edits are both correct: `.board button.card` first-in-slot-order click lands on the same note the old `#choices button` first-in-creation-order click did (traced the seed script: 24 sequential posts, no prior take-downs, so slot 0 = note index 0); the aria-label-based errand assertions correctly exercise the new `mark.full`/`mark.short` split against `errandFor`'s real-errand-vs-`why` distinction.

## Metrics
- Files reviewed: 7 (1 new, 6 modified in scope)
- Linting: `node --check` clean on all 3 JS files
- Unit tests: 34/34 pass (`node --test tests/*.test.cjs`)
- Browser tests: not run per instructions (traced by code reading only)

## Unresolved Questions
1. Is the "marked but no on-card badge" state for `why`-only errand candidates (Medium #2) intentional final UX, or should those cards skip the `marked` outline entirely and rely solely on the aside text?
2. Is dropping the flat per-note text summary from `openNoticeHall` (Medium #1) an accepted tradeoff, or should a concise textual equivalent be kept alongside the board for non-visual users?
