# AFTERIMAGE

The new **The perfect score** campaign starts at [score-3d.html](score-3d.html), or double-click `launch-perfect-score.cmd` on Windows. Play an agent completing delivery trials across Archive, Transit, Garden, Chorus, and Release. Fair assessments gradually give way to shared answers, a broken task, and a passing display that disagrees with the physical world. See [SCORE-DESIGN.md](SCORE-DESIGN.md) for the implemented design.

It runs offline, uses its own `afterimage.score.3d.v1` save, and includes four report submissions and three explicitly confirmed endings. Open Report (R) to inspect required evidence, missing work, trial diagrams, and optional attachments. Submitting ends personal memory; the next instance inherits the filed record. Existing saves preserve their previous memory choices. New submissions lead into playable arrivals with annotated files and visible consequences; the arrival desk and journal show how the facility’s connections grow. Keyboard and touch controls, optional sound, reduced motion, import/export, and a journal with station tracking are supported. Run `npm run test:score` for its rules, physical layout, and full browser journeys. The earlier editions below retain their own saves.

An offline browser game about memory, unfinished work, and small acts of care. The Archive prologue now leads through playable Transit, Garden, Chorus, and Release prototypes. Only two personal memories survive each courier reset.

For the parallel first-person edition, open `index-3d.html`. See [README-3d.md](README-3d.md) for controls, chapters, and its separate campaign save.

## Play

Open index.html in a modern browser, or double-click launch-windows.cmd on Windows. No installation, build step, or network connection is required to play.

Move with WASD, arrow keys, or click/tap the floor. Press E or the on-screen button to interact. Escape opens the menu. The Field journal records progress and offers named walking destinations. Click-to-walk routes around shelves.

After bringing Moth the flower, choose its place together. Its placement survives the reset without using a memory slot. Audio is optional, decisions are untimed, and motion follows your system preference.

Without the route memory, restore the two relays by shifting three contacts into a continuous circuit. Follow the lit path from IN to OUT, then choose Connect relay. Each relay has different wiring. Progress saves between visits; Align contacts for me provides an untimed assisted path with the same story outcome.

Talk to Moth again after giving the flower to discuss your goodbye. You can ask for a new introduction or room to approach after the reset. Moth remembers the agreement; your two memory slots still determine what you recognize. Before the final choice, ask what Moth wants. After staying or sending the signal, visit them for an aftermath scene.

## Transit: The last page

Open transit.html or choose Transit / chapter preview on the prologue title. A completed prologue ending becomes a dispatch for Courier 022; standalone previews support all three endings. The original agent and Moth keep their ending.

Explore the sorting hall, maintenance crossing, and dispatch platform. Meet Brim and Silt, protect a book or ledger or repair a shelf for both, and retain two of three memories. After resetting, revisit the people and consequences, reconnect the bridge if you kept its sequence, and review the outgoing dispatch. The public detour always allows completion. The completed dispatch now continues into Garden. Garden continues to Chorus, then Release.

The shelf has three adjustable fittings and an assisted alignment option. Sorting, reset, replacement saves, and final delivery require explicit confirmation. Transit uses its own afterimage.transit.v1 save and accepts exported prologue endings or campaign saves from Menu / help. Importing never replaces the original prologue save.

## Garden: Reopening day

Choose Continue to Garden on a Transit receipt, use Garden chapter / preview in the Transit menu, or open garden.html directly. A completed Transit save carries its exact consequences forward. The arriving character is still Courier 023; entering Garden does not cause an additional reset.

Explore the courtyard, glasshouse, and listening house. Meet Fern, direct four real reflectors to a diffuser, connect a three-contact receiver circuit, and place a seat without assigning anyone a task. Both workbenches save partial progress and offer assisted alignment; completing a repair is a separate action.

Ask Fern and Brim to record the morning upkeep they offer. Then retain two of four candidates: two memories brought from Transit and two Garden experiences. After the reset, the physical repairs, seat, incoming documents, and other people's commitments remain. The service sequence permits an evening opening only if the courier accepts its dusk check. The new tuning memory restores a quiet personal channel. Daylight opening and public messages always remain possible.

Garden uses afterimage.garden.v1 and includes a validated snapshot of the completed Transit dispatch. Importing either a completed Transit save or a Garden record requires a replacement preview; earlier saves remain untouched. Revisit controls for earlier chapters open those saved chapter records. The full 3–5 hour campaign remains a pacing and production target, not a claim about these compact prototypes.

## Chorus: A place to disagree

Continue from a completed Garden record or open chorus.html for labelled previews. Courier 024 chooses a central desk, round of agreement, or local channels, then physically routes the signal board and coordinates one inspection window. Read six sources across three rooms and draft three supported claims. The cause of the carrier loss remains unestablished; uncertainty is a usable conclusion.

The unaddressed receiver makes the story's first deliberate address to the person choosing the memories. Retain two of four experiences, then return as Courier 025. Records and agreements survive; recognition does not. An earlier evening duty ends at the handoff and requires both the retained sequence and explicit renewed consent. Chorus uses its own afterimage.chorus.v1 save, with the completed Garden receipt nested inside.

## Release: What remains unfinished

Continue from Chorus or open release.html. Inspect the changed garden, local records, and service yard. Review Complete, Witness, or Remain, then enact the plan at its named control. Every memory pair can reach all three endings. Remain requires recording Counter's offered route check; there is no hidden memory requirement.

Complete retires the shared carrier with inhabited local exceptions. Witness sends the supported account before retirement, without transferring residents or promising rescue. Remain keeps a smaller local loop with named upkeep. Earlier losses, Silt's location, the seat, documents, and renewed duties shape the consequences. Return to Fern for the coda; exploration and export remain available afterward. Release uses afterimage.release.v1 and adds no further memory reset.

Subtle earlier lines prepare this address. Garden's seat encounter appears once only if Fern's invitation was released and the returned courier visits the seat before Fern. It grants no memory, achievement, or explanation. Old Garden v1 saves remain compatible.

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

The development server exposes only the game files. For a portable game release, use the 32 runtime files for both editions copied by npm run build into dist/, plus the optional launch scripts. No tests, dependencies, or repository metadata are needed by players.

## Online demo

Play at https://loveless2001.github.io/afterimage/. Pushes to main publish an allowlisted game-only build through GitHub Actions. Run npm run build to create that build locally. The repository and website are public. GitHub Pages from a private repository requires an eligible paid GitHub plan. Browsers necessarily download the published HTML, CSS, and JavaScript.
