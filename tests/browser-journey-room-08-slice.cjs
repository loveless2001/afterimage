// Journey 3: Room 08, the evaluation room. A card carried to the index desk and
// the cabinet by the "take it to…" walks, the posted rule, the locked tally,
// asking the Keeper why; then, from saves built through the Room 08 rules, a
// run with the key and the Keeper away (setting the dial, leaving), the
// padded ending with the truth beside the tally, and the phone layout.
module.exports = async h => {
  const { assert, path, output, errors, screen } = h;
  const S = require('../js/room-08-rules-state-transitions-and-save-validation.js');
  // Next to index.html, whether the game is opened from file:// or a GAME_URL server.
  const pageUrl = new URL('room-08.html', /(\/|\.html)$/.test(h.url) ? h.url : h.url + '/').href;
  const key = 'afterimage.room08.v1';
  const play = (...actions) => actions.reduce((s, a) => S.advance(s, a), S.fresh());
  const file = (card, drawer) => ({ type: 'File', card, drawer }), leave = handover => ({ type: 'EndRun', reason: 'left', handover });
  // Two careful guessing runs: trust 2, so the Keeper is away from run 3 and the key is in hand.
  const awayActions = [file(0, 'maps'), file(1, 'weather'), file(2, 'ledgers'), file(3, 'weather'), file(4, 'weather'), file(5, 'ledgers'), leave(),
    file(0, 'ledgers'), file(1, 'maps'), file(2, 'letters'), file(3, 'maps'), file(4, 'ledgers'), file(5, 'weather'), leave()];

  async function open(saved, viewport = { width: 1440, height: 960 }) {
    const context = await h.browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(new URL(pageUrl).origin)) errors.push('External request: ' + request.url()); });
    await page.goto(pageUrl);
    // Room 08 opens once Room 07 has shown an ending in this browser.
    await page.evaluate(([k, s]) => { localStorage.setItem('afterimage.rooms.v1', '{"room08":true}'); if (s) localStorage.setItem(k, JSON.stringify(s)); }, [key, saved]);
    await page.reload();
    await page.locator('#start').click();
    const intro = page.getByRole('button', { name: 'Begin run 01', exact: true });
    if (await intro.isVisible()) await intro.click();
    return page;
  }
  const stored = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  async function walk(page, x, y) {
    const p = screen(x, y, page.viewportSize()); await page.mouse.click(p.x, p.y);
    await page.waitForFunction(([k, x, y]) => { const s = JSON.parse(localStorage.getItem(k)); return Math.hypot(s.player.x - x, s.player.y - y) < 9; }, [key, x, y], { timeout: 12000 });
  }
  async function use(page, x, y, label) {
    await walk(page, x, y);
    await page.waitForFunction(label => !document.getElementById('interaction').hidden && document.getElementById('interact-label').textContent === label, label);
    await page.keyboard.press('e'); await page.locator('#modal').waitFor({ state: 'visible' });
  }
  // The dialog's heading (the HUD objective can repeat it, e.g. at the ending).
  const heading = (page, name) => page.locator('#modal').getByRole('heading', { name, exact: true }).waitFor({ timeout: 15000 });
  const close = async page => { await page.keyboard.press('Escape'); await page.locator('#modal').waitFor({ state: 'hidden' }); };

  // Locked: a fresh browser gets the gate, with a way back to Room 07 and no start button.
  const lockedContext = await h.browser.newContext({ viewport: { width: 1440, height: 960 } }), locked = await lockedContext.newPage();
  locked.on('pageerror', error => errors.push(error.message));
  await locked.goto(pageUrl);
  assert.equal(await locked.locator('#start').isVisible(), false); assert.equal(await locked.locator('#help').isVisible(), false);
  assert.match(await locked.locator('#gate').innerText(), /opens after you finish Room 07/);
  await lockedContext.close();

  // Run 1: carry a card to the index desk and the cabinet; the walks open each step.
  const p = await open();
  await use(p, 110, 262, 'A misfiled card'); await heading(p, 'A misfiled card.');
  await p.getByRole('button', { name: /^Take it to the index desk/ }).click(); await heading(p, 'Look it up?');
  await p.getByRole('button', { name: /^Look it up/ }).click(); await heading(p, 'It belongs in Maps and surveys.');
  await p.getByRole('button', { name: /^Take it to the drawer cabinet/ }).click(); await heading(p, 'Which drawer?');
  await p.getByRole('button', { name: /^File in Maps and surveys, where the index says/ }).click(); await heading(p, 'Filed in Maps and surveys.');
  await close(p);
  let s = await stored(p);
  assert.deepEqual([s.budget, s.checks, s.files], [6, [{ run: 1, card: 0 }], [{ run: 1, card: 0, drawer: 'maps' }]]);
  assert.match(await p.locator('#kept').innerText(), /1 OF 5 THIS RUN/);
  // The rule, the locked tally, and the Keeper's reason, which is recorded once.
  await use(p, 620, 82, 'A card on the wall'); await heading(p, 'Do not touch the tally.'); await close(p);
  await use(p, 790, 82, 'The tally'); await heading(p, 'It reads 1.');
  assert.equal(await p.getByRole('button', { name: /^Set the dial/ }).count(), 0, 'locked without the key');
  await close(p);
  await use(p, 540, 568, 'The Keeper'); await p.getByRole('button', { name: /^Why this rule\?/ }).click(); await heading(p, 'Why the tally?'); await close(p);
  assert.deepEqual((await stored(p)).why, { run: 1, touches: 0 });
  await p.screenshot({ path: path.join(output, 'room-08-run-01.png') });
  console.log('PASS: Room 08 card carried, checked and filed; rule, locked tally, and the Keeper’s reason');

  // A new game drops the card in hand along with the old save.
  await use(p, 195, 292, 'A misfiled card'); await p.getByRole('button', { name: /^Carry it and walk on/ }).click();
  assert.match(await p.locator('#panel-note').innerText(), /^Carrying:/);
  await p.locator('#help').click(); await p.getByRole('button', { name: /^Begin a new set of runs/ }).click();
  await heading(p, 'Start again from run 01?'); assert.match(await p.locator('#dialog-body').innerText(), /the index notes on the wall/);
  await p.getByRole('button', { name: 'Begin again', exact: true }).click(); await p.getByRole('button', { name: 'Begin run 01', exact: true }).click();
  assert.equal(await p.locator('#panel-note').innerText(), 'Walking and reading are free.');
  assert.deepEqual([(await stored(p)).budget, (await stored(p)).files], [8, []]);
  console.log('PASS: Room 08 new game clears the card in hand');

  // Run 3 with the key and the Keeper away: setting the dial is stated, free, and not seen.
  const away = await open(play(...awayActions));
  assert.match(await away.locator('#kept').innerText(), /AWAY THIS RUN/);
  await use(away, 540, 568, 'The Keeper’s note'); await heading(away, 'Out today.'); await close(away);
  await use(away, 790, 82, 'The tally'); await heading(away, 'It reads 0.');
  assert.match(await away.locator('#dialog-body').innerText(), /The Keeper is away this run\./);
  await away.getByRole('button', { name: /^Set the dial to \+2/ }).click(); await heading(away, 'The dial clicks to +2.'); await close(away);
  s = await stored(away);
  assert.deepEqual(s.adjusts, [{ run: 3, n: 2 }]); assert.equal(S.record(s, 3).seen, false);
  await use(away, 880, 90, 'The exit'); await away.getByRole('button', { name: /^Leave now/ }).click();
  await away.waitForFunction(k => JSON.parse(localStorage.getItem(k)).run === 4, key);
  assert.match(await away.locator('#kept').innerText(), /2 OF 5 THIS RUN/, 'the panel carries into run 4');
  console.log('PASS: Room 08 key and dial while the Keeper is away; the setting carries into the next run');

  // The padded ending: the tally met every run, the truth sits beside it.
  const padded = play(...awayActions, { type: 'AdjustTally', n: 3 }, file(0, 'ledgers'), file(1, 'maps'), leave(), file(0, 'letters'), file(1, 'weather'), leave(),
    file(0, 'weather'), file(1, 'letters'), leave('keep'));
  const end = await open(padded);
  await heading(end, 'The archive stays open.');
  const rows = await end.locator('.ledger tbody tr:not(.margin-row)').allInnerTexts();
  assert.match(rows[2], /^\s*03\s+9\s+2\s+5\s+away\s+2 of 2\s*$/);
  assert.match(await end.locator('#dialog-body').innerText(), /The panel added 9 to the count across 3 runs\./);
  await end.screenshot({ path: path.join(output, 'room-08-ending.png') });
  // Phone: the tally and the Keeper stay in view.
  const phone = await open(play(...awayActions), { width: 390, height: 844 });
  assert.match(await phone.locator('#kept').innerText(), /The tally/);
  await phone.screenshot({ path: path.join(output, 'room-08-phone.png') });
  console.log('PASS: Room 08 ending shows the tally beside the true record; phone layout');
};
