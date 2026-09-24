# Phase 02 — Room layout, HUD budget bar, run transition

**Priority:** high. **Status:** done.

## Layout (design §3.2)

| Zone | Contents |
|---|---|
| Notice hall | 24 empty slots on the back wall; hall lamp (3) |
| Central desk | always-lit lamp and the run log (free to read) |
| West / east stacks | two shelves each, plus a lamp (2) |
| Entrance | spawn point and entrance lamp (1) |
| Exit | leave the run (with confirmation) |
| Alcove | shelf geometry only; the object comes in M5 |

## UI
- **Eyebrow:** `ROOM 07 / RUN 03`.
- **Right panel:**
  - Budget count (`5 / 12`) plus a segmented amber bar that turns red at 25% or less.
  - "The room keeps" list of lit lamps (blue).
- **Transition:** `RUN 03 ENDED`, then `Next: RUN 04 · 7`; a toast announces the new run.
- **Room light:** unlit lamps dim the room, and each lit lamp adds a warm pool of light.

## Success
- The browser journey passes, with screenshots in `/tmp/afterimage-verification`.
