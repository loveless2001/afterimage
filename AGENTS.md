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
- game.js owns encounters, input, Canvas rendering, and browser integration.
- index.html and style.css own the interface.
- scripts/serve.cjs serves an explicit allowlist. Update it when shipping a new runtime asset.
- tests cover save invariants, browser journeys, and the development server.

Preserve v1 save compatibility, explicit reset/ending confirmation, optional audio, keyboard input, and reduced-motion support. Test every memory pair when progression changes. Do not silently overwrite user saves or remove intentional endings.

Use native tools in each OS's own checkout. Never share node_modules or build caches between Windows and WSL. Use relative paths, consistent filename casing, and Node APIs for shared scripts. Respect .gitattributes.

The original WSL prototype also contains a separate research archive and unrelated Git history. Do not merge that history or copy research/PDFs into this game repository. Only game source, game development documentation, tooling, and tests belong here. Do not publish changes unless requested.
