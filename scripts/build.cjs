const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {files, retired} = require('./runtime-files.cjs');
async function build(output = path.join(root, 'dist')) {
  await fs.mkdir(output, { recursive: true });
  const entries = await fs.readdir(output);
  if (entries.some(name => ![...files, ...retired, '.nojekyll'].includes(name))) {
    throw new Error('Unexpected files in dist; review them before publishing.');
  }
  for (const name of files) await fs.copyFile(path.join(root, name), path.join(output, name));
  for (const name of retired) if (entries.includes(name)) await fs.unlink(path.join(output, name));
  await fs.writeFile(path.join(output, '.nojekyll'), '');
  return files.length;
}
if (require.main === module) build().then(count => console.log(`Canonical build: dist/ contains ${count} runtime and compatibility files, plus .nojekyll. Earlier editions are excluded.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = {build};
