# Review: Room 07 story intro + long-exposure ending (30 Sep 2026)

Scope: uncommitted Room 07 intro/exposure files only. `node --check` ok; `node --test tests/*.test.cjs` 49/49 pass. Playwright not run (traced only).

## Verdict
Sound. No Critical. State flags always released via `finish()`. 2 Important (replay forces exposure + reveal every time; no skip), 1 Important a11y (caption focus/announce), plus minors.

## Critical
None.

## Important

1. **Reveal + 7 s exposure replay on every `showEnding`** (endings-last-entry-secret-bench-and-screens.js:69-73; callers: menu-export-import-and-startup.js:71 `resume()`, room-interactions-lamps-log-hall-exit.js:50,57 "Read the ending again", bench :39). Plan guardrail says reveal card "appears once per ending"; code shows it on every re-read, every reload of a finished save, every bench visit. Player is forced through ~7 s + card each time (Escape ignored while `G.transitioning`, input.js:22). Conflicts with pillar "calm, no forced waiting".
   Fix: `A.showEnding(first)`; only `finishRun` passes true (run-end-transition...js:30). Non-first: ending dialog choices = "See the picture again" (plays exposure, then `A.closeDialog` not `revealCard`) + "Close". Or keep unsaved `G.revealed = state.ending` and skip reveal if equal. Reset on `revisitEnding`.

2. **Exposure cannot be skipped** (ending-long-exposure...js:27-34). Only reduced-motion users skip. Fix: in `play`, add one-shot keydown (Escape/Enter/Space) and canvas click that sets `x.start = performance.now() - settled*1000`. Keep `G.transitioning` guard otherwise. Cheap, and fixes 7 s dead time for keyboard/SR users.

3. **Caption a11y** (ending-long-exposure...js:47-55). Focus lands on "Continue" button only, so SR hears "Continue, button" with no title/alt (`section aria-labelledby` is a region, not read on focus of a child). Nothing announced during the 7 s (dialog closed, toast hidden). Fix: `role="dialog" aria-labelledby="exposure-title" aria-describedby="exposure-alt"` (give alt `<p>` an id) so focus into it announces both; or focus the `section` (tabindex -1) not the button. Add `aria-live` sr-only text at `play()`: "The long exposure is drawing. A caption follows." (not `#toast`: hidden by CSS, see 4).

4. **Failure/feedback toast invisible** (style.css:19 hides `#toast` with `visibility:hidden` while `body.exposure`; ending-long-exposure...js:72 `A.toast(...)`). "This browser could not save the picture" never seen and not announced (visibility:hidden removes live-region output). Also no confirmation on success. Fix: a `<p role="status" class="exposure-status">` inside caption; write both messages there. Also wrap keepPicture body in try/catch (getContext/toBlob can throw on huge canvas) -> same status.

## Minor

5. Double-click "Keep this picture" makes two downloads (:52). Disable button until `toBlob` callback fires.
6. Blob revoke 1000 ms (:74): fine in Chromium/Firefox; Safari can lose slow downloads. Use 10-30 s.
7. Focus after caption removal (:58): `finish()` removes focused button; `dialog()` then records `returnFocus = body`. After reveal card closes, focus is on body. Fix: before `x.done()`, focus `A.canvas` (tabindex -1) or the `#journal` button.
8. `draw()` allocates each frame (:37 `A.trails.all(state)`, and `upTo` called twice per route in `route()` :17,:22) and shadowBlur strokes 60 fps forever while caption is up. Cache `trails` and per-run `upTo` results in `play()`; after `t >= settled` render once (or every ~250 ms). Phone battery.
9. Keepsake layout ok: band = 8.5% of device width, `u=band/100`, all text within 100u, canvas is `min(dpr,2)` scaled so DPR consistent. Only risk: extreme portrait, text 36u..~340u fits if width>~400u, i.e. always. No issue; note only that title font `Georgia` falls back on Linux, cosmetic.
10. Caption alt (:50) says routes only; also mention kept lamps: "3 routes drawn in light; 5 lamps kept." (`state.lights.length`). Alt "0 routes" branch reads fine.
11. Caption CSS `caption-in` animation (style.css:19) not disabled under reduced motion; global rule only kills `transition`. Add `@media (prefers-reduced-motion:reduce){.exposure-caption{animation:none}}`.
12. Caption detail "N runs · 41 budget spent": a bare spend count next to an ending can read as an efficiency score. Pillar 1 borderline (the in-dialog "Runs played" is count only). Consider dropping "budget spent", keep runs + date. Owner decision.
13. `picture()` (endings...js:71) receives click event as arg; harmless. `A.dialog(...)` Escape now == Continue (can't just dismiss ending); acceptable, note in plan.
14. Room-07-only global: `A.longExposure` undefined in Room 08; safe because `G.exposure` never set there (render-frame-loop:51). If Room 08 ever calls showEnding-like flow it must load module. Add a one-line guard `if (G.exposure && A.longExposure)`.

## Answers to your checks
1. **State/flow.** `G.transitioning` set in `play`, cleared only in `finish` (Continue button). Only path out is the button (caption always appears at t>=settled, or first frame under reduced motion). Never left set except if tab stays hidden (rAF paused, resumes fine). `G.exposure` cleared same place. Escape: input.js:22 returns while transitioning: ok. Menu: `A.menu` gated (menu...js:24); nav hidden by CSS. Revisit from reveal card: `revisitEnding` closes dialog, state rewound, next `finishRun` replays cleanly (flags already cleared). `resume()` on finished save: `startGame(false)` then `showEnding` -> full sequence (see #1). Bench: `showEnding` again -> same (#1). Double click Continue: first click `picture` -> `closeDialog` hides modal (`[hidden]{display:none!important}`), second click hits canvas, gated by `G.transitioning`; if it did re-enter, `play` just resets `start`. Safe. Trail mutation during exposure: `A.update` returns while transitioning, so no trail writes.
2. **Frames.** Additions in render are guarded: `!G.started` (coverScene) and `G.exposure`. In-play frame path unchanged by scoped code. NOT verified: pixel identity of `room.backdrop`/`lightPools` extraction (render-frame-loop diff removes ~25 lines, moved to room-07-drawing file; part of Room 08 split, outside scope) - Playwright screenshot diff should cover. `coverScene?.` optional: Room 08 has none; `A.trails` key now `A.room.storageKey + '.trails'`, Room 07 value unchanged (comment says so; verify `storageKey === 'afterimage.v2'`). Room 08 cannot break from the exposure module (not loaded, never invoked).
3. **A11y.** See 3, 4, 11. Keyboard: Continue focused, Tab reaches Keep. Reduced motion: shows settled frame at once, ok.
4. **Keepsake.** See 5-9. DPR ok, scaling ok, revoke short, failure path invisible (#4).
5. **Playwright journey 2.** Harness uses `reducedMotion:'reduce', acceptDownloads:true` (browser-test-helpers.cjs:28): caption appears on first frame, `waitFor` ok; download event ok (PNG via toBlob works headless). Locators: `button()` = role button, regex `^Continue`, hidden modal excluded -> only caption Continue matches; `^Keep this picture` unique; `^Remain in the room` unique. `heading()` is page-wide exact: 'Who sent them?' != cover h2 "Nobody remembers who sent them." (exact + cover hidden after start). Danger spot: caption `<h2>` duplicates the ending heading text ("Still here.", "Everything, in order.") while visible; test only calls `heading()` for those BEFORE clicking Continue, so no clash today. Any future `heading(t,'Still here.')` after Continue would match caption h2 (and #dialog-title if visible). Scope such calls to `#modal` like Room 08's helper (browser-journey-room-08-slice.cjs:43). Alcove step: seeded save has no stored trails -> caption "No routes..."; regexes only match eyebrow/title/detail, ok. Regex `\d runs` ok for "5 runs"; would fail for 10+ (not reachable).
6. **Pillars.** Nothing graded; no score, only counts (see 12). Fiction unchanged; theme stated only on reveal card, outside fiction, after ending; cover copy hints without explaining. Breaks the "once per ending" promise (#1). Reveal text "That is how AI agents work today" is plain outside-voice: ok. Cover says "seven short visits" while ending can come at run 6/alcove; reveal uses actual count (`inWords`), fine.

## Positive
Pure `trailUpTo` with tests and clamping; DOM built via `textContent` (no injection); `G.transitioning` reuse gives free input lock; reduced-motion path; `finish` cleans all flags in one place; cover ghost scoped by `isNew` and `!G.started`, nothing saved.

## Unresolved questions
- Should replays (resume, desk, bench) show the exposure/reveal at all, or only on first arrival? (#1)
- Is "budget spent" in the caption acceptable under pillar 1?
- Plan says pillar 2 gets a line for reveal card: present (design-pillars.md:16); wording "may say" vs plan "once per ending" needs aligning with #1 decision.
- Confirm `A.room.storageKey` for Room 07 equals `'afterimage.v2'` (not read).
