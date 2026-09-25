// Shared helpers for the browser journeys (see tests/browser.cjs for how to run).
// Screen coordinates mirror the game's isometric projection; saves are built
// through the real game rules rather than hand-written JSON.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const S = require('../js/game-rules-state-transitions-and-save-validation.js');
const url = process.env.GAME_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const output = path.join(os.tmpdir(), 'afterimage-verification');
fs.mkdirSync(output, { recursive: true });
const errors = [];
const key = 'afterimage.v2';
const h = { browser: null };

// Builds real saves through the game rules rather than hand-writing JSON.
function seed(actions, player) {
  const s = S.fresh();
  for (const action of actions) S.advance(s, action);
  if (player) s.player = player;
  return s;
}
const leaveRun = { type: 'EndRun', reason: 'left' }, lightLamp = lamp => ({ type: 'Light', lamp });
const postNote = { type: 'Post', parts: [0, 0, null] }, spendOut = { type: 'EndRun', reason: 'budget' };

async function newPage(saved, viewport = { width: 1440, height: 960 }, extra = {}) {
  const context = await h.browser.newContext({ viewport, reducedMotion: 'reduce', acceptDownloads: true });
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

module.exports = Object.assign(h, { assert, path, fs, S, url, output, errors, key, seed, leaveRun, lightLamp, postNote, spendOut,
  newPage, begin, screen, walk, interact, close, stored, waitForRun, lightAt });
