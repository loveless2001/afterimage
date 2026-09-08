# AFTERIMAGE — first-person edition

Open `index-3d.html` to play from the prologue through Transit, Garden, Chorus, and Release. All new runtime files carry the `-3d` suffix. The original edition remains available at `index.html`.

This is a compact, first-person adaptation with five playable chapters, volumetric WebGL rooms, collision, physical workstations, people, seats, and persistent consequences. It is an alternative prototype, with simplified contact puzzles and shorter conversations than the original edition.

## Controls

- WASD moves. Arrow keys move forward/back and turn.
- Click the world to capture the mouse, or drag to look. Click again or press E to interact.
- Page Up / Page Down looks up and down; Home levels the view.
- J opens the journal. Track a destination, then follow its direction and distance.
- Escape releases the mouse. Escape again opens the menu.
- Touch screens have movement buttons, a drag-to-look area, and an interaction button.

Your current assignment and next step stay visible. Sound is optional and remembers its setting. You can change it inside conversations; the Archive receiver can replay Moth’s tune while that memory remains available. Later chapters have their own ambient sound. Each repair shows its source contact plate above a live diagram of your current controls, with explicit open/closed and match/change labels. Diagrams remain available after repairs. Repairs are untimed and include an assisted alignment button; securing the repair remains a separate decision.

## Choices and saves

Four handoffs ask you to retain exactly two memories. Repairs, people’s own agreements, placed objects, and records remain in the world. Later chapters inherit the exact campaign history. The last chapter has no additional reset. The journal lists retained and released memories with their effects. Completed actions acknowledge the change and remove choices that cannot be repeated.

The new paths include literal Archive erasure, omission of a resident’s warning, an unsupported district clearance, unsupported explanations for the carrier failure, and final closure of occupied branches. Consequential choices show their effects before confirmation. No timer forces a decision. Evening Garden hours require your explicit dusk-check agreement, which expires at the next reset unless freely renewed. Chorus asks you to open all six sources before recording a new evidence review.

This edition saves to `afterimage.campaign.3d.v1`, independently of the original chapters. Menu offers export, validated import, and labelled chapter previews. A preview replaces the current 3D campaign only after confirmation. Export before starting another campaign if you want to keep both. Browser storage depends on the browser and URL; use exported JSON to transfer progress.

## Run and verify

`npm run dev` serves both editions. Open `http://localhost:8765/index-3d.html`.

`npm run check` checks all runtime scripts. `npm test` includes the 3D campaign rules. `npm run test:3d` checks campaign UI, endings, resets, save/export, mobile controls, and physical navigation. `node tests/engine-3d.test.cjs` checks physical navigation and interaction targets. Browser tests write screenshots to the OS temporary directory under `afterimage-verification` and `afterimage-engine-3d`.

`npm run build` includes both editions in `dist`. WebGL must be enabled to play the first-person edition. No external runtime libraries, models, textures, or network requests are needed.
