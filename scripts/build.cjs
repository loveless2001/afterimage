const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = ['index.html', 'style.css', 'state.js', 'game.js', 'transit.html', 'transit-state.js', 'transit-story.js', 'transit.js', 'garden.html', 'garden-state.js', 'garden-story.js', 'chapter-ui.js', 'garden.js', 'chapter-flow.js', 'chorus.html', 'chorus-state.js', 'chorus-story.js', 'chorus.js', 'release.html', 'release-state.js', 'release-story.js', 'release.js','index-3d.html','transit-3d.html','garden-3d.html','chorus-3d.html','release-3d.html','engine-3d.js','state-3d.js','chapters-3d.js','game-3d.js','style-3d.css'];
(async () => {
  await fs.mkdir(output, { recursive: true });
  const entries = await fs.readdir(output);
  if (entries.some(name => ![...files, '.nojekyll'].includes(name))) {
    throw new Error('Unexpected files in dist; review them before publishing.');
  }
  for (const name of files) await fs.copyFile(path.join(root, name), path.join(output, name));
  await fs.writeFile(path.join(output, '.nojekyll'), '');
  console.log('Pages build: dist/ contains only the thirty-two game files and .nojekyll.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
