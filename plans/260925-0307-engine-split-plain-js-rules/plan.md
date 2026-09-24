# Milestone 1 — Engine split + plain-JS rules

Source: `docs/design-guidelines.md` §11–12, milestone 1.
Goal: split `game.js` (507 lines) + `state.js` into modules under 200 lines, replace the Bend core with a pure JS `step()`, and keep behavior identical (same save key, save shape, DOM, text).

| # | Phase | Status |
|---|---|---|
| 1 | [Rules + pathfinding modules](phase-01-rules-and-pathfinding-modules.md) | done |
| 2 | [Browser modules split from game.js](phase-02-browser-module-split.md) | done |
| 3 | Remove Bend files, update tests + docs | done |

## Key decisions
- Classic `<script>` tags only (runs from `file://`). The modules share one namespace, `window.Afterimage`; the runtime state lives in `Afterimage.game`.
- `step(state, action) → nextState | null`, pure. `advance()` applies it or throws. Actions are semantic (`{type:'Place', spot:'light'}`), not bit codes.
- Save key `afterimage.prologue.v1` and the JSON shape are unchanged, so existing saves still load.

## Files
- **Create:** `js/*.js` (12 modules; validation merged into the rules module, 110 lines).
- **Delete:** `game.js`, `state.js`, `core.bend`, `bend-core.js`, `build-bend.sh`, `core-build.html`, `core-entry.js`.
- **Modify:** `index.html` (script tags), `tests/*.cjs` (paths, action shape), `README.md`, `VERIFICATION.md`, `DESIGN.md` (tech section).

## Success criteria
- `node --check` passes on every module.
- The state tests pass, with the same scenarios ported to the new action shape.
- The browser journey test passes unchanged, apart from the require path.
- No file over 200 lines.
