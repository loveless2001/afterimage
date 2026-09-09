# Development environment

The Windows primary checkout is `D:\repo\afterimage`. The canonical game is **The perfect score** at `index.html`. `score-*` modules and `engine-3d.js` are the active implementation. Earlier 2D and first-person sources are frozen in `legacy/`, outside the active build and server.

## Daily commands

Use Node 22.19.0 as the reference version. On Windows PowerShell:

```powershell
cd D:\repo\afterimage
npm.cmd ci
npm.cmd run browser:install
npm.cmd run dev
```

In a separate WSL development clone, run the same npm commands without `.cmd`. Never share node_modules or build caches between Windows and WSL.

`npm run check`, `npm test`, and `npm run test:browser` validate the canonical game, save compatibility, all ending paths, keyboard/touch controls, reports, playable arrivals, geometry, audio, and old URL redirects. `npm run test:legacy` is an optional check of archived rules. `test:score` remains a convenience command for current checks; `test:3d` is a compatibility alias for the current browser suite.

`npm run build` copies the explicit allowlist in `scripts/runtime-files.cjs` into `dist/`. It removes only named, superseded runtime outputs from older builds, rejects unexpected output files for review, and excludes legacy/, research/, backups/, tests, and repository metadata. Build output includes compatibility pages that point old URLs to the canonical index.

The loopback server uses the same allowlist and defaults to port 8765. Use `npm run dev -- 8766` for another port. Both Windows launchers open the canonical index. Opening it directly remains supported without Node.

## Repository history and publishing

This checkout uses the game-only history from `https://github.com/loveless2001/afterimage`. The original `/home/lenovo/projects/afterimage` prototype has unrelated history. Do not merge or publish that history. Its research archive was copied to the ignored Windows research/ directory; research/COPY-RECORD.md records that transfer.

For WSL development, use a separate clone of this game repository. Share coherent commits between development checkouts rather than maintaining unrelated copies of the same change. Respect .gitattributes and use Node APIs for cross-platform scripts.

GitHub Actions runs the default checks on Windows and Ubuntu. The existing Pages workflow builds the explicit game-only output. This canonical promotion updates local source and build output. Publishing requires an explicit user request.
