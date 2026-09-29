# Phase 2: a ghost behind the title lights a lamp

## Context
- The room renders behind the cover already: the cover's gradient is clear on its right side, and the frame loop always runs.
- `js/afterimages-earlier-runs-trails-and-ghosts.js` exports `trailPosition` (glide, hold at pauses, rest, loop) and `draw.afterimage(x, y, fade)`.
- `A.lightPool(x, y, r, color)` is in `iso-projection-and-canvas-shapes.js`.

## Overview
Priority high. For a new game only, before you press start, a faint figure walks in from the entrance. It stops at a lamp, the lamp glows, it walks on and fades, and the glow dies. The loop is about 14 s. The message is "someone was here before you". Returning players already see their own afterimages behind the title, so they get no ghost.

## Architecture
- **Profile hook:** `A.room.coverScene?.(state)` is called by the frame loop only while `!G.started`. It draws after the ghosts and before the cues.
- **New module `js/room-07-title-screen-ghost-lights-a-lamp.js`:**
  - A canned route, `[x, y]` points with one `[x, y, 1]` pause at the west lamp. The route plays through `trailPosition`.
  - A light pool at the lamp during the pause, fading in and out.
  - It is skipped when `!A.room.isNew(state)`.
- **Reduced motion:** the figure stands still by the lamp, and the lamp glows steadily.
- **No state change:** nothing is saved, and the lamp in the save stays dark.

## Steps
1. Add the frame-loop call (one line) and the module. Load it in `index.html` after the Room 07 drawing module.
2. Tune in the browser: the route stays in the clear right side of the cover, the ghost reads against a day room, and the glow reads without a night palette. If needed, add a light dusk dim on the cover only.

## Success criteria
- A new game's cover shows the walk and the glow. A save in progress shows only its own afterimages.
- In-play frames stay pixel-identical (AE 0 against captures from before this change).
