# AFTERIMAGE

An offline browser game about memory, unfinished work, and small acts of care. The Archive prologue leads into playable Transit and Garden prototypes. Only two personal memories survive each courier reset.

## Play

Open index.html in a modern browser, or double-click launch-windows.cmd on Windows. No installation, build step, or network connection is required to play.

Move with WASD, arrow keys, or click/tap the floor. Press E or the on-screen button to interact. Escape opens the menu. The Field journal records progress and offers named walking destinations. Click-to-walk routes around shelves.

After bringing Moth the flower, choose its place together. Its placement survives the reset without using a memory slot. Audio is optional, decisions are untimed, and motion follows your system preference.

Without the route memory, restore the two relays by shifting three contacts into a continuous circuit. Follow the lit path from IN to OUT, then choose Connect relay. Each relay has different wiring. Progress saves between visits; Align contacts for me provides an untimed assisted path with the same story outcome.

Talk to Moth again after giving the flower to discuss your goodbye. You can ask for a new introduction or room to approach after the reset. Moth remembers the agreement; your two memory slots still determine what you recognize. Before the final choice, ask what Moth wants. After staying or sending the signal, visit them for an aftermath scene.

## Transit: The last page

Open transit.html or choose Transit / chapter preview on the prologue title. A completed prologue ending becomes a dispatch for Courier 022; standalone previews support all three endings. The original agent and Moth keep their ending.

Explore the sorting hall, maintenance crossing, and dispatch platform. Meet Brim and Silt, protect a book or ledger or repair a shelf for both, and retain two of three memories. After resetting, revisit the people and consequences, reconnect the bridge if you kept its sequence, and review the outgoing dispatch. The public detour always allows completion. The completed dispatch now continues into Garden. Chorus and Release remain planned.

The shelf has three adjustable fittings and an assisted alignment option. Sorting, reset, replacement saves, and final delivery require explicit confirmation. Transit uses its own afterimage.transit.v1 save and accepts exported prologue endings or campaign saves from Menu / help. Importing never replaces the original prologue save.

## Garden: Reopening day

Choose Continue to Garden on a Transit receipt, use Garden chapter / preview in the Transit menu, or open garden.html directly. A completed Transit save carries its exact consequences forward. The arriving character is still Courier 023; entering Garden does not cause an additional reset.

Explore the courtyard, glasshouse, and listening house. Meet Fern, direct four real reflectors to a diffuser, connect a three-contact receiver circuit, and place a seat without assigning anyone a task. Both workbenches save partial progress and offer assisted alignment; completing a repair is a separate action.

Ask Fern and Brim to record the morning upkeep they offer. Then retain two of four candidates: two memories brought from Transit and two Garden experiences. After the reset, the physical repairs, seat, incoming documents, and other people's commitments remain. The service sequence permits an evening opening only if the courier accepts its dusk check. The new tuning memory restores a quiet personal channel. Daylight opening and public messages always remain possible.

Garden uses afterimage.garden.v1 and includes a validated snapshot of the completed Transit dispatch. Importing either a completed Transit save or a Garden record requires a replacement preview; earlier saves remain untouched. Revisit controls for earlier chapters open those saved chapter records. Future chapters and the full 3–5 hour campaign remain a design target, not a claim about these prototypes.

## Development on Windows or WSL

The reference Node version is 22.19.0, matching the Windows development installation at setup. The game itself does not require Node. Install dependencies separately in each OS checkout:

```sh
npm ci
npm run browser:install
npm run dev
```

Open http://localhost:8765. Refresh after editing. If another server uses that port, run `npm run dev -- 8766`. In PowerShell, use `npm.cmd` if execution policy blocks the npm.ps1 wrapper. On a fresh Linux installation, Playwright may also require OS libraries; run `npx playwright install --with-deps chromium` there if prompted.

```sh
npm run check
npm test
npm run test:browser
```

Browser tests use local @playwright/test and direct-file launch by default. Set GAME_URL to a local server URL to exercise HTTP instead. Browser artifacts are written to your OS temporary directory under afterimage-verification.

## Cross-platform workflow

Keep a Windows checkout on the Windows filesystem and a separate WSL checkout on the Linux filesystem. Use Git branches and commits to transfer changes. Do not copy node_modules, browser installations, or caches between operating systems. See DEVELOPMENT.md for this machine's setup and migration notes.

## Saves

Progress saves automatically in the browser when available. File URLs, ports, browsers, and machines may have separate saves. Use Menu / help → Export memory and Import memory to transfer a save. Older v1 saves remain supported. Storage-denied environments can still play and export manually.

The development server exposes only the game files. For a portable game release, include index.html, style.css, state.js, game.js, transit.html, transit-state.js, transit-story.js, transit.js, garden.html, garden-state.js, garden-story.js, chapter-ui.js, garden.js, and optionally the launch scripts. No tests, dependencies, or repository metadata are needed by players.

## Online demo

Play at https://loveless2001.github.io/afterimage/. Pushes to main publish an allowlisted game-only build through GitHub Actions. Run npm run build to create that build locally. The repository and website are public. GitHub Pages from a private repository requires an eligible paid GitHub plan. Browsers necessarily download the published HTML, CSS, and JavaScript.
