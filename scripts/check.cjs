const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {assets} = require('./runtime-files.cjs');
const root = path.resolve(__dirname, '..');
const files = [...assets.filter(name => name.endsWith('.js')), 'scripts/runtime-files.cjs', 'scripts/serve.cjs', 'scripts/build.cjs', 'scripts/check.cjs'];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], {stdio: 'inherit'});
  if (result.error || result.status !== 0) { process.exitCode = 1; break; }
}
