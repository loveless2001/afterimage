const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../scripts/serve.cjs');

test('local server serves game assets and excludes repository files', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /AFTERIMAGE/);
    const script = await fetch(base + '/game.js?test=1');
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(base + '/style.css', { method: 'HEAD' })).status, 200);
    for (const url of ['/research/README.md', '/transit-state.test.cjs', '/.git/config', '/package.json', '/tests/state.test.cjs', '/%2e%2e%2fpackage.json']) {
      assert.equal((await fetch(base + url)).status, 404);
    }
    for (const asset of ['transit.html', 'transit.js', 'transit-state.js', 'transit-story.js', 'garden.html', 'garden.js', 'garden-state.js', 'garden-story.js', 'chapter-ui.js']) assert.equal((await fetch(base + '/' + asset)).status, 200);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
