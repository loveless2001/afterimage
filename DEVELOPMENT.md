# Development environment

Windows primary checkout: `D:\repo\afterimage`.
Upstream: https://github.com/loveless2001/afterimage.

This checkout was cloned from the game-only public history. The latest flower activity, journal, navigation changes, and tests were copied from the original WSL prototype. Environment setup and copied improvements are included in the Pages deployment commit. Use this repository history for future Windows/WSL clones.

The original `/home/lenovo/projects/afterimage` folder remains intact, including its private research archive. Its Git history is unrelated to the public game repository. Do not add the public remote there and push the whole history.

For future WSL development, create a separate clone such as `~/projects/afterimage-dev` from the upstream using your authenticated GitHub login. Alternatively, clone the Windows checkout locally once it has a commit containing this setup, then point origin at GitHub. Keep the original prototype as a reference until migration is complete.

## Daily commands

Windows PowerShell:

```powershell
cd D:\repo\afterimage
npm.cmd ci
npm.cmd run browser:install
npm.cmd run dev
```

WSL, in a clean development clone:

```sh
npm ci
npm run browser:install
npm run dev
```

Use Node 22.19.0 as the reference version on both platforms; .nvmrc and .node-version support version managers without changing your global installation. The npm engine range also permits newer Node releases.

Commit a coherent change on a feature branch, then push/pull the branch between checkouts. Run check, unit tests, and browser tests before merging. Windows and Ubuntu CI use the reference Node version. Do not maintain two copies with unrelated uncommitted edits to the same feature.

## Codex project

`D:\repo\afterimage` is attached to the game project and set as its primary folder. The previous game 4 folder remains attached as a secondary folder. New tasks start in this repository and discover its AGENTS.md automatically. Existing tasks may retain their original working directory.

## Validation scope

`npm test` covers memory rules, older-save compatibility, navigation, and the loopback server's asset allowlist. `npm run test:browser` covers three endings, save import/export, narrow-screen controls, the shared flower activity, and journal routing. Human playtesting and native desktop packaging are separate future work.


Verified on 7 September 2026: Windows Node 22.19.0 passed syntax checks, all seven unit/server tests, and the complete Chromium browser suite. WSL Node 25.5.0 also passed the same syntax and unit/server checks. GitHub Actions includes cross-platform game checks and a separate game-only Pages deployment workflow.
