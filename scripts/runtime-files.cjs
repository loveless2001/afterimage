// The canonical release surface. Historical sources in legacy/ are never shipped.
const assets = ['index.html', 'score-3d.css', 'score-report.css', 'engine-3d.js',
  'score-investigation.js', 'score-report.js', 'score-fragments.js', 'score-report-ui.js', 'score-state.js',
  'score-story.js', 'score-world.js', 'score-audio.js', 'score-game.js'];
const aliases = ['score-3d.html', 'index-3d.html', 'transit.html', 'garden.html',
  'chorus.html', 'release.html', 'transit-3d.html', 'garden-3d.html', 'chorus-3d.html', 'release-3d.html'];
// Remove only these known outputs when refreshing a build made before promotion.
const retired = ['style.css', 'state.js', 'game.js', 'transit-state.js', 'transit-story.js', 'transit.js',
  'garden-state.js', 'garden-story.js', 'chapter-ui.js', 'garden.js', 'chapter-flow.js',
  'chorus-state.js', 'chorus-story.js', 'chorus.js', 'release-state.js', 'release-story.js', 'release.js',
  'state-3d.js', 'chapters-3d.js', 'game-3d.js', 'style-3d.css'];
module.exports = {assets, aliases, retired, files: [...assets, ...aliases]};
