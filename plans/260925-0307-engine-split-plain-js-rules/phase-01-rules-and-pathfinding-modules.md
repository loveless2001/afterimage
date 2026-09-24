# Phase 01 — Rules + pathfinding modules

**Priority:** high. **Status:** done. A fuzz run of 1.2M steps matched the old Bend core, and the state tests pass 8/8.

## Requirements
- Port every `core.bend` transition to plain JS with identical preconditions and effects:

  | Action | Allowed when | Effect |
  |---|---|---|
  | Meet | cycle 1 | met, and acquire `name` |
  | Give | cycle 1 and met | gift |
  | Place | cycle 1 and gift | `flowerSpot` = light or company |
  | Acquire | cycle 1 and a valid memory | memory added to acquired |
  | Reset | cycle 1, met, gift, all 3 acquired, and 2 distinct memories chosen | cycle 2; kept = acquired = the pair; flower placement kept |
  | Restore | cycle 2 | relay west or east restored |
  | Reunite | cycle 2 | reunion |
  | Open | cycle 2, reunion, and (route kept or both relays restored) | gate open |
  | Finish | cycle 2, reunion, gate, no ending yet, and witness requires song kept | ending set |
  | Replay | cycle 2 | back to the end of cycle 1, all 3 acquired, flower placement kept, player at the threshold |

- `validate()`, `fresh()` and `memories` stay unchanged.

## Files
- `js/pathfinding-visibility-graph.js`: `findPath` exposed as `AfterimagePath`.
- `js/story-state-rules-and-save-validation.js`: rules plus `validate` in a single file (110 lines, so no split was needed).

## Success
- The ported state tests pass.
