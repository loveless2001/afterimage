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

The application does not depend on that repository or Playwright at runtime. To run the test elsewhere, point `PLAYWRIGHT_MODULE` at an existing Playwright package, or install Playwright in your own development environment. Set `GAME_URL` to test a hosted copy. Browser test artifacts were saved under `/tmp/afterimage-verification`; `preview.png` is the desktop archive capture included with this project.

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
