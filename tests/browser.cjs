// Run with an existing Playwright installation:
// PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test node tests/browser.cjs
// Optional: GAME_URL=http://127.0.0.1:8765 (default is direct file launch).
// Outputs are written under os.tmpdir(), never into another project's files.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const S = require('../state.js');
const url = process.env.GAME_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const output = path.join(os.tmpdir(), 'afterimage-verification');
fs.mkdirSync(output, { recursive: true });
const errors = [];
const key = 'afterimage.prologue.v1';
let browser;

async function newPage(seed, viewport = { width: 1440, height: 960 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(new URL(url).origin)) errors.push('External request: ' + request.url()); });
  await page.goto(url);
  if (seed) { await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, seed]); await page.reload(); }
  return page;
}
async function begin(page) {
  await page.locator('#start').click();
  if (await page.getByRole('button', { name: 'Enter the room', exact: true }).isVisible()) await page.getByRole('button', { name: 'Enter the room', exact: true }).click();
}
function screen(x, y, viewport = { width: 1440, height: 960 }) {
  const { width: w, height: h } = viewport;
  let s = Math.min((w - 30) / 1670, (h - 190) / 790);
  if (w < 600) s = Math.min((w - 16) / 1670, (h - 270) / 790);
  s = Math.max(.15, s);
  return { x: w / 2 - 145 * s + (x - y) * s, y: h / 2 + (w < 600 ? 65 : 50) - 395 * s + (x + y) * .48 * s };
}
async function walk(page, x, y) {
  const p = screen(x, y, page.viewportSize()); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(([k, x, y]) => { const s = JSON.parse(localStorage.getItem(k)); return Math.hypot(s.player.x - x, s.player.y - y) < 9; }, [key, x, y], { timeout: 12000 });
}
async function interact(page, label) {
  await page.waitForFunction(label => !document.getElementById('interaction').hidden && document.getElementById('interact-label').textContent === label, label);
  await page.keyboard.press('e'); await page.locator('#modal').waitFor({ state: 'visible' });
}
async function close(page) { await page.keyboard.press('Escape'); await page.locator('#modal').waitFor({ state: 'hidden' }); }
async function stored(page) { return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key); }
async function selectPair(page, pair) {
  for (const memory of pair) await page.getByRole('button', { name: new RegExp(S.memories[memory].title) }).click();
  await page.getByRole('button', { name: /Continue · release/ }).click();
  await page.getByRole('button', { name: 'Release this instance', exact: true }).click();
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).cycle === 2, key);
  await page.waitForTimeout(100);
}
async function solveRelay(page, id) {
  const wanted = id === 'west' ? ['top to middle', 'middle to middle', 'middle to top'] : ['bottom to middle', 'middle to bottom', 'bottom to top'];
  for (let i = 0; i < 3; i++) {
    const contact = page.getByRole('button', { name: new RegExp(`^Shift contact ${i + 1}:`) });
    for (let attempts = 0; attempts < 3 && !(await contact.getAttribute('aria-label')).includes(wanted[i]); attempts++) await contact.click();
    assert.match(await contact.getAttribute('aria-label'), new RegExp(wanted[i]));
  }
  assert.match(await page.locator('.relay-status').innerText(), /Ready to connect/);
  assert.equal((await stored(page)).relays.includes(id), false);
  await page.getByRole('button', { name: 'Connect relay', exact: true }).click();
  assert.equal((await stored(page)).relays.includes(id), true);
  await close(page);
}
async function end(page, choice, ending) {
  await page.getByRole('button', { name: new RegExp('^' + choice) }).click();
  await page.getByRole('button', { name: 'Choose this ending', exact: true }).click();
  assert.equal((await stored(page)).ending, ending);
  await page.screenshot({ path: path.join(output, `ending-${ending}.png`) });
}

(async () => {
  browser = await chromium.launch({ headless: true });
  // A complete first cycle through physical movement and normal interactions.
  const p = await newPage();
  await p.screenshot({ path: path.join(output, 'title.png') });
  await begin(p); await p.screenshot({ path: path.join(output, 'archive.png') });
  await walk(p, 398, 420); await interact(p, 'The other agent');
  assert.match(await p.locator('#dialog-title').innerText(), /call me Moth/); await close(p);
  await walk(p, 275, 410); await interact(p, 'An unclassified object');
  await p.getByRole('button', { name: 'Bring the flower to Moth', exact: true }).click();
  await p.getByRole('button', { name: 'Find a place for it together', exact: true }).click();
  await p.getByRole('button', { name: /^Between our places/ }).click();
  assert.equal((await stored(p)).flowerSpot, 'company'); await close(p);
  await walk(p, 505, 230); await interact(p, 'Index terminal'); await close(p);
  await walk(p, 565, 410); await walk(p, 750, 525); await interact(p, 'A damaged receiver'); await close(p);
  const firstCycle = await stored(p); assert.equal(firstCycle.gift, true); assert.equal(firstCycle.acquired.length, 3);
  await walk(p, 870, 510); await walk(p, 880, 245); await interact(p, 'The return threshold');
  await p.screenshot({ path: path.join(output, 'memory-choice.png') });
  await selectPair(p, ['name', 'song']);
  await walk(p, 398, 420); await interact(p, 'Moth');
  assert.match(await p.locator('#dialog-title').innerText(), /remembered/); assert.match(await p.locator('#dialog-body').innerText(), /still available/); await close(p);
  // No route: both relays must actually be visited, and the threshold initially refuses.
  await walk(p, 565, 250); await walk(p, 880, 245); await interact(p, 'The return threshold');
  assert.match(await p.locator('#dialog-title').innerText(), /do not remember/); await close(p);
  await walk(p, 100, 230); await interact(p, 'West relay');
  assert.equal(await p.getByRole('button', { name: 'Connect relay', exact: true }).isDisabled(), true);
  const firstContact = p.getByRole('button', { name: /^Shift contact 1:/ });
  await firstContact.focus(); await p.keyboard.press('Enter');
  assert.equal(await firstContact.evaluate(el => el === document.activeElement), true);
  assert.equal((await stored(p)).relayContacts.west[0], 0);
  assert.deepEqual((await stored(p)).relays, []);
  await p.screenshot({ path: path.join(output, 'relay-workbench.png') });
  await close(p); await p.reload(); await begin(p); await interact(p, 'West relay');
  assert.match(await p.getByRole('button', { name: /^Shift contact 1:/ }).getAttribute('aria-label'), /top to middle, powered/);
  await solveRelay(p, 'west');
  await walk(p, 860, 240); await walk(p, 865, 390); await interact(p, 'East relay'); await solveRelay(p, 'east');
  await walk(p, 880, 245); await interact(p, 'The return threshold');
  await p.getByRole('button', { name: 'Read the final assignment', exact: true }).click();
  await end(p, 'Send a witness signal', 'witness');
  assert.equal((await stored(p)).relays.length, 2);
  // Export, reload, and import through the player-facing flow.
  const downloadPromise = p.waitForEvent('download'); await p.getByRole('button', { name: 'Export this memory', exact: true }).click();
  const download = await downloadPromise; const savePath = path.join(output, 'witness-save.json'); await download.saveAs(savePath);
  assert.equal(S.validate(JSON.parse(fs.readFileSync(savePath))).ending, 'witness');
  await p.reload(); await begin(p); assert.match(await p.locator('#speaker').innerText(), /ENDING B/);
  await close(p); await walk(p, 100, 230); await interact(p, 'West relay');
  assert.equal(await p.locator('#dialog-title').innerText(), 'No further work required.');
  assert.equal(await p.locator('.relay-workbench').count(), 0);
  assert.equal((await stored(p)).ending, 'witness');
  console.log('PASS: full journey without route, witness ending, export, reload and post-ending relay');
  await p.context().close();

  // The remaining pairs use a real first-cycle save at the threshold, then traverse cycle two.
  for (const [pair, ending, choice] of [[['name', 'route'], 'obedience', 'Complete the assignment'], [['route', 'song'], 'stay', 'Stay with Moth']]) {
    const q = await newPage({ ...firstCycle, player: { x: 880, y: 245 } }); await begin(q);
    await interact(q, 'The return threshold'); await selectPair(q, pair);
    await walk(q, 398, 420); await interact(q, 'Moth');
    assert.match(await q.locator('#dialog-title').innerText(), pair.includes('name') ? /remembered/ : /call me Moth/);
    await close(q); await walk(q, 565, 250); await walk(q, 880, 245); await interact(q, 'The return threshold');
    await q.getByRole('button', { name: 'Read the final assignment', exact: true }).click();
    assert.equal(await q.getByRole('button', { name: /^Send a witness signal/ }).isDisabled(), !pair.includes('song'));
    await end(q, choice, ending); assert.equal((await stored(q)).relays.length, 0);
    console.log(`PASS: ${pair.join(' + ')}, shortcut, ${ending} ending`); await q.context().close();
  }
  const q = await newPage(); await begin(q); await q.locator('#help').click();
  await q.locator('#import-file').setInputFiles(savePath);
  await q.getByRole('button', { name: 'Import and resume', exact: true }).click();
  assert.equal((await stored(q)).ending, 'witness'); await close(q); await q.locator('#help').click();
  const before = await stored(q);
  await q.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version": 99}') });
  await q.getByRole('heading', { name: 'This memory could not be read.', exact: true }).waitFor();
  assert.deepEqual(await stored(q), before);
  console.log('PASS: save import and malformed-import preservation'); await q.context().close();

  // Responsive UI, keyboard movement, modal focus, optional sound, and no scrolling overflow.
  const mobile = await newPage(undefined, { width: 390, height: 844 });
  await mobile.screenshot({ path: path.join(output, 'mobile-title.png') }); await begin(mobile);
  await mobile.screenshot({ path: path.join(output, 'mobile-archive.png') });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await walk(mobile, 398, 420); await mobile.locator('#interact').click();
  await mobile.keyboard.press('Shift+Tab');
  assert.equal(await mobile.evaluate(() => document.getElementById('modal').contains(document.activeElement)), true);
  await close(mobile); await mobile.locator('#sound').click(); assert.equal(await mobile.locator('#sound').getAttribute('aria-pressed'), 'true');
  await mobile.locator('#sound').click(); await mobile.keyboard.down('ArrowDown'); await mobile.waitForTimeout(400); await mobile.keyboard.up('ArrowDown');
  await mobile.locator('#help').click(); await mobile.keyboard.press('Escape');
  console.log('PASS: small viewport, pointer interaction, modal focus, keyboard and optional audio'); await mobile.context().close();

  // A single destination crosses a shelf; the journal must route around it.
  const navigation = await newPage({ ...firstCycle, player: { x: 750, y: 530 } }); await begin(navigation);
  await navigation.locator('#journal').click();
  await navigation.getByRole('button', { name: 'Walk to index terminal', exact: true }).click();
  await navigation.waitForFunction(k => { const s = JSON.parse(localStorage.getItem(k)); return Math.hypot(s.player.x - 505, s.player.y - 228) < 2; }, key, { timeout: 15000 });
  await navigation.reload(); await begin(navigation); await navigation.locator('#journal').click();
  assert.match(await navigation.locator('#dialog-body').innerText(), /two places at the table/);
  await navigation.screenshot({ path: path.join(output, 'field-journal.png') });
  await navigation.context().close();
  console.log('PASS: journal navigation around shelves and persistent shared activity');

  // Assistance uses the same circuit and requires an explicit connection on a narrow screen.
  const assist = await newPage({ ...S.reset(firstCycle, ['name', 'song']), reunion: true, player: { x: 100, y: 230 } }, { width: 390, height: 844 });
  await begin(assist); await interact(assist, 'West relay');
  await assist.keyboard.press('Shift+Tab');
  assert.equal(await assist.evaluate(() => document.activeElement.textContent), 'Leave the cover open');
  assert.equal(await assist.locator('.relay-contact').count(), 3);
  for (const button of await assist.locator('.relay-contact').all()) {
    const box = await button.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44);
  }
  await assist.screenshot({ path: path.join(output, 'mobile-relay.png') });
  await assist.getByRole('button', { name: /^Align contacts for me/ }).click();
  assert.deepEqual((await stored(assist)).relays, []);
  await assist.getByRole('button', { name: 'Connect relay', exact: true }).click();
  assert.deepEqual((await stored(assist)).relays, ['west']);
  assert.equal(await assist.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await close(assist); await assist.locator('#journal').click();
  assert.match(await assist.locator('#dialog-body').innerText(), /WEST \/ Connected to the threshold/);
  await assist.context().close();
  console.log('PASS: manual relay circuits, partial reload, narrow-screen assistance and journal progress');
  const blockedStorage = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await blockedStorage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked by browser policy', 'SecurityError'); } }));
  const r = await blockedStorage.newPage(); r.on('pageerror', e => errors.push(e.message)); await r.goto(url); await begin(r); await r.locator('#help').click();
  assert.match(await r.locator('#dialog-body').innerText(), /storage is unavailable/);
  const fallbackDownload = r.waitForEvent('download'); await r.getByRole('button', { name: 'Export memory (.json)', exact: true }).click(); await fallbackDownload;
  console.log('PASS: unavailable storage still allows play and manual export'); await blockedStorage.close();
  assert.deepEqual(errors, []); console.log(`PASS: no browser errors or external runtime requests; artifacts: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
