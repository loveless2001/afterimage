// Run with an existing Playwright installation:
// PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test node tests/browser.cjs
// Optional: GAME_URL=http://127.0.0.1:8765 (default is direct file launch).
// Outputs are written under os.tmpdir(), never into another project's files.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');
const url = process.env.GAME_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const output = path.join(os.tmpdir(), 'afterimage-verification');
fs.mkdirSync(output, { recursive: true });
const errors = [];
const key = 'afterimage.v2';
let browser;

// Builds real saves through the game rules rather than hand-writing JSON.
function seed(actions, player) {
  const s = S.fresh();
  for (const action of actions) S.advance(s, action);
  if (player) s.player = player;
  return s;
}
const leaveRun = { type: 'EndRun', reason: 'left' }, lightLamp = lamp => ({ type: 'Light', lamp });

async function newPage(saved, viewport = { width: 1440, height: 960 }, extra = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(new URL(url).origin)) errors.push('External request: ' + request.url()); });
  await page.goto(url);
  if (saved || Object.keys(extra).length) {
    await page.evaluate(([k, s, extra]) => { if (s) localStorage.setItem(k, JSON.stringify(s)); for (const [name, value] of Object.entries(extra)) localStorage.setItem(name, value); }, [key, saved, extra]);
    await page.reload();
  }
  return page;
}
async function begin(page) {
  await page.locator('#start').click();
  const intro = page.getByRole('button', { name: 'Begin run 01', exact: true });
  if (await intro.isVisible()) await intro.click();
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
async function waitForRun(page, run) { await page.waitForFunction(([k, run]) => JSON.parse(localStorage.getItem(k)).run === run, [key, run]); await page.locator('#transition.on').waitFor({ state: 'detached' }).catch(() => {}); await page.waitForTimeout(100); }
async function lightAt(page, x, y, label) {
  await walk(page, x, y); await interact(page, label);
  await page.getByRole('button', { name: /^Switch it on/ }).click();
  await page.getByRole('heading', { name: 'Light.', exact: true }).waitFor();
}

(async () => {
  browser = await chromium.launch({ headless: true });
  // Run 1: light one lamp by walking to it, then leave through the exit.
  const p = await newPage();
  await p.screenshot({ path: path.join(output, 'title.png') });
  await begin(p); await p.screenshot({ path: path.join(output, 'room-run-01.png') });
  await lightAt(p, 155, 330, 'West stacks lamp'); await close(p);
  assert.equal((await stored(p)).budget, 8);
  assert.equal(await p.locator('#budget-count').innerText(), '8 / 10');
  await walk(p, 900, 95); await interact(p, 'The exit');
  await p.getByRole('button', { name: /^Leave now/ }).click(); await waitForRun(p, 2);
  let s = await stored(p);
  assert.equal(s.budget, S.budgetTable[1]); assert.deepEqual(s.lights, [{ id: 'west', run: 1 }]); assert.deepEqual(s.player, S.entrance);
  assert.match(await p.locator('#toast').innerText(), /Run 02\. Budget 6/);
  console.log('PASS: run 1 lamp spend, exit confirmation, run 2 starts with the table budget and the lamp kept');

  // Run 2: spend the whole budget; the run ends as soon as the last dialog closes.
  await lightAt(p, 560, 95, 'Notice hall lamp'); await close(p);
  await lightAt(p, 735, 240, 'East stacks lamp'); await close(p);
  await lightAt(p, 600, 580, 'Entrance lamp');
  assert.match(await p.locator('#dialog-body').innerText(), /Budget spent/);
  assert.equal((await stored(p)).run, 2, 'the run does not end mid-dialog');
  await close(p); await waitForRun(p, 3);
  s = await stored(p);
  assert.deepEqual(s.log[1], { run: 2, budget: 6, spent: 6, end: 'budget' });
  assert.equal(await p.locator('#budget-count').innerText(), '12 / 12');
  assert.equal(await p.locator('.kept-item:not(.absent)').count(), 4);
  await walk(p, 475, 405); await interact(p, 'The run log');
  const logText = await p.locator('#dialog-body').innerText();
  assert.match(logText, /RUN 01 · budget 10 · spent 2 · left through the exit/); assert.match(logText, /RUN 02 · budget 6 · spent 6 · ran out/);
  await p.screenshot({ path: path.join(output, 'run-log.png') }); await close(p);
  await p.locator('#help').click();
  const downloadPromise = p.waitForEvent('download'); await p.getByRole('button', { name: 'Export save (.json)', exact: true }).click();
  const savePath = path.join(output, 'run-03-save.json'); await (await downloadPromise).saveAs(savePath);
  assert.equal(S.validate(JSON.parse(fs.readFileSync(savePath))).run, 3);
  console.log('PASS: spending to zero ends the run after the dialog, run log, export');
  await p.context().close();

  // A save with an empty budget ends its run on load; the last run finishes the game.
  const spent = await newPage(seed([lightLamp('west'), leaveRun, lightLamp('hall'), lightLamp('east'), lightLamp('entrance')]));
  await begin(spent); await waitForRun(spent, 3); await spent.context().close();
  const last = await newPage(seed(Array(6).fill(leaveRun), { x: 900, y: 95 }));
  await begin(last); await interact(last, 'The exit');
  await last.getByRole('button', { name: /^Leave now/ }).click();
  await last.getByRole('heading', { name: 'Seven runs.', exact: true }).waitFor();
  assert.equal((await stored(last)).finished, true);
  await last.screenshot({ path: path.join(output, 'finished.png') }); await last.context().close();
  console.log('PASS: empty-budget save resumes into the next run; run 7 ends the game');

  // Import through the menu, reject malformed files, and never touch an older prologue save.
  const q = await newPage(undefined, undefined, { 'afterimage.prologue.v1': '{"version":1,"cycle":1}' });
  await begin(q);
  assert.match(await q.locator('#toast').innerText(), /earlier prologue/);
  await q.locator('#help').click(); await q.locator('#import-file').setInputFiles(savePath);
  await q.getByRole('button', { name: 'Import and resume', exact: true }).click();
  assert.equal((await stored(q)).run, 3);
  const before = await stored(q); await q.locator('#help').click();
  await q.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...before, budget: 99 })) });
  await q.getByRole('heading', { name: 'This save could not be read.', exact: true }).waitFor();
  assert.deepEqual(await stored(q), before);
  assert.equal(await q.evaluate(() => localStorage.getItem('afterimage.prologue.v1')), '{"version":1,"cycle":1}');
  console.log('PASS: import, malformed-import rejection, older save left untouched'); await q.context().close();

  // Responsive UI, pointer interaction, modal focus, keyboard, optional sound, no overflow.
  const mobile = await newPage(undefined, { width: 390, height: 844 });
  await mobile.screenshot({ path: path.join(output, 'mobile-title.png') }); await begin(mobile);
  await mobile.screenshot({ path: path.join(output, 'mobile-room.png') });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await walk(mobile, 600, 580); await mobile.locator('#interact').click();
  await mobile.keyboard.press('Shift+Tab');
  assert.equal(await mobile.evaluate(() => document.getElementById('modal').contains(document.activeElement)), true);
  await close(mobile); await mobile.locator('#sound').click(); assert.equal(await mobile.locator('#sound').getAttribute('aria-pressed'), 'true');
  await mobile.locator('#sound').click(); await mobile.keyboard.down('ArrowDown'); await mobile.waitForTimeout(400); await mobile.keyboard.up('ArrowDown');
  await mobile.locator('#help').click(); await mobile.keyboard.press('Escape');
  console.log('PASS: small viewport, pointer interaction, modal focus, keyboard and optional audio'); await mobile.context().close();

  // The journal routes around shelves to a named place.
  const navigation = await newPage(seed([]));
  await begin(navigation); await navigation.locator('#journal').click();
  await navigation.getByRole('button', { name: 'Walk to the west stacks lamp', exact: true }).click();
  await navigation.waitForFunction(k => { const s = JSON.parse(localStorage.getItem(k)); return Math.hypot(s.player.x - 155, s.player.y - 310) < 2; }, key, { timeout: 15000 });
  await navigation.screenshot({ path: path.join(output, 'journal-walk.png') });
  console.log('PASS: journal navigation around shelves'); await navigation.context().close();

  const blockedStorage = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await blockedStorage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked by browser policy', 'SecurityError'); } }));
  const r = await blockedStorage.newPage(); r.on('pageerror', e => errors.push(e.message)); await r.goto(url); await begin(r); await r.locator('#help').click();
  assert.match(await r.locator('#dialog-body').innerText(), /storage is unavailable/);
  const fallbackDownload = r.waitForEvent('download'); await r.getByRole('button', { name: 'Export save (.json)', exact: true }).click(); await fallbackDownload;
  console.log('PASS: unavailable storage still allows play and manual export'); await blockedStorage.close();
  assert.deepEqual(errors, []); console.log(`PASS: no browser errors or external runtime requests; artifacts: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
