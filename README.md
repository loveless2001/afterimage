# AFTERIMAGE — The perfect score

This is the canonical AFTERIMAGE game. It supersedes the earlier 2D and first-person prototypes.

Open **index.html** directly, run **launch-windows.cmd**, or start `npm run dev` and open the printed local address. The runtime works offline without Node, external services, downloaded fonts, or installed packages. Node is only needed for development and automated checks.

The five-chapter campaign follows one assignment: **Deliver the parcel. Light the arrival lamp. Leave a verifiable record.** Experiments produce physical traces; reports distinguish required evidence, missing work, and optional material. Submitting a report ends the instance’s personal memories. The next instance encounters the filed evidence, another reader’s annotation, and the consequences of the previous work.

## Play

- WASD moves. Arrow keys move and turn; drag or capture the mouse to look.
- E interacts. R opens the report; J opens the journal and station tracker.
- Page Up / Page Down looks vertically; Home levels the view.
- Escape closes a panel or opens the menu. Touch screens have movement and look controls.
- Sound is optional. Menu → Sound settings includes volume and a test chime.

Trials are untimed and respect reduced motion. All three endings require a separate consequence review and explicit confirmation.

## Saves

The canonical game keeps `afterimage.score.3d.v1`. Existing Perfect Score saves, filed reports, earlier memory handoffs, and audio preferences remain compatible. Menu provides export/import and confirmed new-run replacement.

Old game URLs, including `score-3d.html` and `index-3d.html`, now lead to `index.html`. Saves from the superseded editions are left untouched; they are not converted into this campaign’s different story and rules. Browser, file URL, port, and machine changes can use separate storage. Export before moving a run.

## Development

Use Node 22.19.0 as the reference version. On restricted PowerShell systems, use `npm.cmd`.

```sh
npm ci
npm run browser:install
npm run dev
npm run check
npm test
npm run test:browser
npm run build
```

The default checks, browser journeys, server, and build target the canonical campaign. `dist/` contains only the active runtime and compatibility entry pages. `scripts/runtime-files.cjs` owns that allowlist. Building does not publish.

See [SCORE-DESIGN.md](SCORE-DESIGN.md) for the campaign and [DEVELOPMENT.md](DEVELOPMENT.md) for checkout guidance. The internal `score-*` filenames identify active modules; they do not denote an alternate edition.

## Superseded work

The earlier 2D and 3D source, tests, documentation, and a frozen renderer are preserved in [legacy/](legacy/README.md). They are historical references, excluded from the active server and release build. `npm run test:legacy` runs their archived rule tests when needed. The ignored research archive and local backups are also excluded from all releases.
