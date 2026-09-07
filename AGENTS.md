# AFTERIMAGE development

This is an offline Canvas 2D browser game. Keep the runtime independent of Node, external services, fonts, and package installation. Directly opening index.html must remain supported.

## Commands

- Reference Node version: 22.19.0 (see .node-version / .nvmrc).
- Setup: npm ci, then npm run browser:install.
- Local server: npm run dev (port 8765), or npm run dev -- 8766.
- Validation: npm run check, npm test, npm run test:browser.
- On PowerShell systems that restrict npm.ps1, invoke npm.cmd instead.
- Browser tests use this checkout's @playwright/test by default. Do not borrow dependencies from other projects.

## Project boundaries

- state.js owns save validation, memory/reset rules, and the current navigation helper.
- transit-state.js owns the separate courier save and chapter rules; transit-story.js owns its scenes; transit.js owns its rooms and browser integration.
- garden-state.js owns the separate Garden save, inherited Transit snapshot, repair rules, and handoff; garden-story.js owns identified authored scenes; garden.js owns its rooms and interactions.
- chorus-state.js owns routing, evidence, acknowledgement order, retention, and the nested Garden receipt. release-state.js owns consequence review and explicit final enactment. Their matching story and runtime files own authored scenes and interactions.
- chapter-flow.js supplies Chorus and Release with separate save, import/export, title, journal, and chapter navigation behavior.
- chapter-ui.js supplies Garden, Chorus, and Release with shared presentation, navigation, modal controls, and optional audio. Earlier chapters retain their established runtime.
- game.js owns encounters, input, Canvas rendering, and browser integration.
- index.html and style.css own the interface.
- scripts/serve.cjs serves an explicit allowlist. Update it when shipping a new runtime asset.
- tests cover save invariants, browser journeys, and the development server.

Preserve v1 save compatibility, explicit reset/ending confirmation, optional audio, keyboard input, and reduced-motion support. Test every memory pair when progression changes. Do not silently overwrite user saves or remove intentional endings.

Use native tools in each OS's own checkout. Never share node_modules or build caches between Windows and WSL. Use relative paths, consistent filename casing, and Node APIs for shared scripts. Respect .gitattributes.

The original WSL prototype contains unrelated Git history; do not merge that history into this game repository. At the user's request, a local copy of its research archive now lives in research/. Keep research/ ignored by Git and excluded from all game builds and servers. Do not publish the research or downloaded PDFs without an explicit request to do so. Game source, game development documentation, tooling, and tests may be tracked. Do not publish changes unless requested.
