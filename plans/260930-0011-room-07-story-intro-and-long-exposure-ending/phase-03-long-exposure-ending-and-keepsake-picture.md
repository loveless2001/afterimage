# Phase 3: long-exposure ending and a keepsake picture

## Context
- Trails are saved per run (`afterimage.v2.trails`), up to 400 points each, with pauses marked. They are private to the afterimages module.
- `A.showEnding` (in `js/endings-last-entry-secret-bench-and-screens.js`) opens one dialog with the story text and choices. Finished saves reopen it through `resume()`.
- Endings arrive at runs 6–7, so the room is usually in its night palette. `room.lightPools(state, k)` draws the kept lamps.

## Overview
Priority high. After the ending text, the room darkens and every run's route is drawn in light at once, the newest run brightest. Then the kept lamps come on. The frame settles into one picture with a caption. "Keep this picture" saves a PNG with the caption drawn in.

## Architecture
- **`A.trails.all()`:** returns `{ run: trail }` for valid trails. There is also a pure `trailUpTo(trail, f)` (a prefix by fraction), exported for tests.
- **New engine module `js/ending-long-exposure-picture-and-keepsake.js`:**
  - `A.longExposure.play(state, caption, done)` sets `G.exposure = { start, caption, done }` and hides the HUD, header and interaction bar.
  - The frame loop calls `A.longExposure.draw()` after `render()` while `G.exposure` is set.
  - Timeline: 0–0.8 s darken (multiply). 0.8–5.5 s all trails draw together, with the `lighter` composite, a soft blur and a bright head. 5.5–6.5 s the lamp pools fade in. Then the caption card (HTML) appears.
  - The caption card offers "Keep this picture" and "Continue" (Escape also continues). Continue restores the HUD and calls `done`.
  - The keepsake: an offscreen canvas with the `#world` pixels and a caption band (ending letter and title, runs, budget spent, date, "AFTERIMAGE · ROOM 07"). It is saved with `toBlob` and a download link named `${A.room.exportName}-ending-<letter>.png`. This works from file://, since the canvas is never tainted.
  - Input is paused while `G.exposure` is set: `A.update` returns early.
- **Reduced motion:** the final frame shows at once, with the caption.
- **Room 07 wiring:** the ending dialog's only choice becomes "Continue". Continue plays the exposure with the caption `ENDING B · THE LIGHTS` and `7 runs · 41 budget spent · 30 Sep 2026`. The exposure then leads to the reveal card (phase 4).
- **No trails** (an imported save): the exposure still plays, showing the kept lamps coming on, and the caption says "No routes were kept in this browser."

## Steps
1. Add `trailUpTo` and `all()`, with a unit test for `trailUpTo`.
2. Build the module and its hooks in the frame loop and input.
3. Wire Room 07's ending. Tune the look in agent-browser for each ending, by day and night, and at 390px.

## Success criteria
- The ending plays the exposure, captions it, and "Keep this picture" downloads a PNG with the caption.
- Play frames are unchanged. Reduced motion shows the final frame.

## Risks
- Busy pictures: 7 runs × 400 points could be noisy. Mitigation: older runs are thinner and dimmer, and the newest is brightest.
