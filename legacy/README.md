# Superseded AFTERIMAGE editions

These files preserve the earlier 2D game and its first-person adaptation. They are historical references. The canonical game is now [AFTERIMAGE: The perfect score](../index.html); develop that campaign in the repository root.

For local reference, `index.html` opens the archived 2D edition and `index-3d.html` opens the archived first-person edition. Their relative runtime files and a frozen copy of the shared renderer are kept together. Existing browser saves are not deleted or transformed, although a different file URL or browser may have separate storage; use the archived games’ import/export controls to transfer a saved record.

`ARCHIVE-MANIFEST.json` records raw and LF-normalized SHA-256 hashes of the 56 preserved files at promotion. The archived design documents and README files describe the earlier work and may contain historical entry points or development guidance. They do not override the root README or AGENTS.md.

The active server and build exclude this entire directory. Default checks run the canonical campaign. From the repository root, `npm run test:legacy` runs the archived state and layout tests using this checkout’s dependencies.
