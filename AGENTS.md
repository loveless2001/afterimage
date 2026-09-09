# AFTERIMAGE development

The canonical game is **The perfect score**, the offline first-person campaign at `index.html`. It supersedes the earlier 2D and 3D editions. Keep the browser runtime independent of Node, external services, downloaded fonts, and package installation. Directly opening index.html must remain supported.

## Commands

- Reference Node version: 22.19.0 (.node-version / .nvmrc).
- Setup: npm ci, then npm run browser:install.
- Local server: npm run dev (8765), or npm run dev -- 8766.
- Validation: npm run check, npm test, npm run test:browser.
- Build: npm run build. This does not publish.
- Use npm.cmd on PowerShell systems that restrict npm.ps1.
- Browser tests use this checkout’s @playwright/test. Do not borrow dependencies from other projects.
- Archived rule checks are optional: npm run test:legacy.

Keep titles and headlines evocative. Dialogue should sound spoken, and instructions must name concrete next actions. Use short paragraphs and remove repeated explanations. Keep memory-loss and ending consequences explicit.

## Active project boundaries

- index.html is the canonical playable entry. Old HTML entry points are compatibility redirects to it.
- score-state.js owns save validation, trial rules, old memory-handoff compatibility, report submission, arrival state, and final enactment.
- score-report.js derives required evidence, conclusions, attachment classifications, and immutable report snapshots.
- score-story.js owns encounters, report annotations, arrival consequences, milestones, facility connections, and ending prose. score-fragments.js owns other workers’ authored report fragments.
- score-world.js owns the procedural facility and visible consequences. engine-3d.js is the shared offline WebGL renderer and input engine used by the current campaign.
- score-game.js owns browser integration, report controls, playable arrivals, journal, tracking, import/export, and accessible panels.
- score-report-ui.js / score-report.css own the paper form; score-3d.css owns the main interface. score-audio.js owns optional generated sound.
- scripts/runtime-files.cjs is the single active asset allowlist for scripts/serve.cjs and scripts/build.cjs. Update it when shipping a runtime asset.
- tests/ covers canonical save invariants, report and arrival rules, physical navigation, browser journeys, entry-point compatibility, and build/server boundaries.

Preserve the afterimage.score.3d.v1 save key, existing v1 saves, explicit reset and ending confirmation, optional audio, keyboard/touch input, and reduced-motion support. Test every legacy memory pair when progression changes. Do not silently overwrite user saves or remove intentional endings.

## Historical material and environments

legacy/ contains the superseded editions, frozen runtime, tests, and documentation. It is excluded from the active server and builds. Do not restore it as a parallel active game or modify its preserved files without a task requiring that historical work. Existing old-edition saves must remain untouched.

Use native tools in each OS’s own checkout. Never share node_modules or build caches between Windows and WSL. Use relative paths, consistent filename casing, and Node APIs for shared scripts. Respect .gitattributes.

The original WSL prototype contains unrelated Git history; do not merge it into this repository. Its local research archive lives in ignored research/. Keep research/ and backups/ excluded from game builds and servers. Do not publish research, downloaded PDFs, or game changes without an explicit request to publish.
