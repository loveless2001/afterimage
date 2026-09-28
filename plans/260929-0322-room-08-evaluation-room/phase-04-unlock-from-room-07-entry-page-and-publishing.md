# Phase 4: unlock from Room 07, entry page, publishing

## Context links
- [plan.md](plan.md); Room 07 ending flow `endings-last-entry-secret-bench-and-screens.js`; the title screen in `index.html`; `.github/workflows/pages.yml`.

## Overview
- Priority: medium. Status: not started.
- Room 08 unlocks when Room 07 reaches any ending (user decision, 29 Sep 2026).

## Key insights
- The unlock must survive "Begin a new set of runs" and Revisit, so it can't be derived from the Room 07 save. Use its own flag.
- The gate is per browser (local storage). Importing a finished Room 07 save should also unlock it.

## Requirements
- **Flag:** `afterimage.rooms.v1` = `{ "room08": true }`. It is set whenever Room 07 shows an ending (after Finish or EndRun with an ending) and on importing a finished save. It is never cleared by a new game.
- **Room 07 title screen:** once unlocked, a second quiet line appears under the field-note link: "Room 08 · the evaluation room ↗".
- **Room 07 ending screens:** a choice "Another room is open" linking to Room 08, after the field-note button.
- **`room-08.html` while locked:** a gate page in the same style, "This room opens after you finish Room 07", with a link back and no other content.
- **Publishing:** add `room-08.html` to the workflow's copy step. `js/` is already copied.
- **Docs:** README (Room 08 section and module list), design guidelines (Room 08 section), VERIFICATION entry.

## Architecture
- Tiny helpers in the shared context: `A.unlocked(room)` and `A.unlock(room)`, wrapped in try/catch; blocked storage means locked, and the page says so plainly.

## Related code files
- Modify:
  - `js/endings-last-entry-secret-bench-and-screens.js`: set the flag and add the ending choice.
  - `js/menu-export-import-and-startup.js`: set the flag on import of a finished save.
  - `index.html`: the title link, hidden until unlocked.
  - `.github/workflows/pages.yml` (use the Write/Edit tools; a hook blocks shell commands containing "build").
  - README, docs, VERIFICATION.
- Create: none beyond phase 3's page (the gate lives in `room-08.html`).

## Implementation steps
1. Add the flag helpers and set the flag on endings and imports.
2. Add the title link and the ending choice.
3. Add the gate in `room-08.html` startup.
4. Update the workflow copy step.
5. Browser checks: locked gate, unlock via an ending, the title link appears, a new game keeps the unlock; blocked storage.
6. Playwright step added (the user runs it); then commit and push only when asked.

## Todo
- [ ] Flag helpers
- [ ] Set on ending and on import
- [ ] Title link and ending choice
- [ ] Gate page
- [ ] Workflow copy step
- [ ] Docs
- [ ] Browser checks; Playwright (user)

## Success criteria
- A fresh browser sees no Room 08 link and gets the gate at the direct URL. After any Room 07 ending, the link appears everywhere listed and the room opens. It survives a new game.

## Risk assessment
- **Players on a new device must replay Room 07 or import a save:** acceptable, and stated on the gate.
- **The link spoils the tone of Room 07's endings:** keep the wording as quiet as the field-note line.

## Security considerations
- The flag is a plain boolean in local storage, and its contents are never trusted beyond that.

## Next steps
- Phase 5 playtest.
