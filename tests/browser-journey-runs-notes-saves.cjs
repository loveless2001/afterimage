// Journey 1: runs, budget, lamps, notes and the handoff pin, run-log, export and
// import, full-wall replacement, older saves, mobile layout, journal routing,
// and blocked storage.
module.exports = async h => {
  const { assert, path, fs, S, url, output, errors, key, seed, leaveRun, lightLamp, postNote, spendOut, newPage, begin, walk, interact, close, stored, waitForRun, lightAt } = h;
  // Run 1: light one lamp by walking to it, then leave through the exit.
  const p = await newPage();
  await p.screenshot({ path: path.join(output, 'title.png') });
  await begin(p); await p.screenshot({ path: path.join(output, 'room-run-01.png') });
  await lightAt(p, 155, 330, 'West stacks lamp'); await close(p);
  assert.equal((await stored(p)).budget, 8);
  assert.equal(await p.locator('#budget-count').innerText(), '8 / 10');
  // Post a note by building it from the phrase kit.
  await walk(p, 400, 95); await interact(p, 'The notice hall');
  await p.getByRole('button', { name: /^Write a note/ }).click();
  for (const word of ['west stacks', 'check', 'first']) await p.getByRole('button', { name: word, exact: true }).click();
  await p.getByRole('button', { name: 'Post it', exact: true }).click();
  await p.getByRole('heading', { name: 'Posted.', exact: true }).waitFor(); await close(p);
  let s = await stored(p);
  assert.equal(s.budget, 7); assert.deepEqual(s.notes, [{ run: 1, parts: [2, 0, 0], slot: 0 }]);
  await p.screenshot({ path: path.join(output, 'note-posted.png') });
  // Leave, pin the note for run 2, and read it as run 2 opens.
  await walk(p, 900, 95); await interact(p, 'The exit');
  await p.getByRole('button', { name: /^Leave now/ }).click();
  await p.getByRole('heading', { name: 'Pin a note for the next run?', exact: true }).waitFor();
  await p.getByRole('button', { name: /^west stacks · check · first/ }).click(); await waitForRun(p, 2);
  s = await stored(p);
  assert.equal(s.budget, S.budgetTable[1]); assert.deepEqual(s.lights, [{ id: 'west', run: 1 }]); assert.deepEqual(s.player, S.entrance); assert.equal(s.pinned, 0);
  await p.getByRole('heading', { name: '“west stacks · check · first”', exact: true }).waitFor();
  assert.match(await p.locator('#hint').innerText(), /Your last run pinned: “west stacks · check · first”/);
  assert.match(await p.locator('#toast').innerText(), /Run 02\. Budget 6/);
  await p.screenshot({ path: path.join(output, 'pinned-note.png') });
  await p.getByRole('button', { name: 'Begin run 02', exact: true }).click();
  await walk(p, 380, 600); await interact(p, 'The entrance pin');
  await p.getByRole('heading', { name: '“west stacks · check · first”', exact: true }).waitFor(); await close(p);
  console.log('PASS: lamp and note spending, handoff pin, run 2 opens by reading the pin');

  // Run 2: spend the whole budget; the run ends as soon as the last dialog closes.
  await lightAt(p, 560, 95, 'Notice hall lamp'); await close(p);
  await lightAt(p, 735, 240, 'East stacks lamp'); await close(p);
  await lightAt(p, 600, 580, 'Entrance lamp');
  assert.match(await p.locator('#dialog-body').innerText(), /Budget spent/);
  assert.equal((await stored(p)).run, 2, 'the run does not end mid-dialog');
  // Closing the last dialog opens the handoff straight away (the modal never hides in between).
  await p.keyboard.press('Escape'); await p.getByRole('heading', { name: 'Pin a note for the next run?', exact: true }).waitFor();
  await p.getByRole('button', { name: 'Pin nothing', exact: true }).click(); await waitForRun(p, 3);
  assert.equal((await stored(p)).pinned, null);
  s = await stored(p);
  assert.deepEqual(s.log[1], { run: 2, budget: 6, spent: 6, end: 'budget', pin: null });
  assert.equal(await p.locator('#budget-count').innerText(), '12 / 12');
  assert.match(await p.locator('#kept').innerText(), /4 OF 4 LIT/);
  await walk(p, 475, 405); await interact(p, 'The run log');
  const logText = await p.locator('#dialog-body').innerText();
  assert.match(logText, /RUN 01 · budget 10 · spent 3 · 1 note · left through the exit/); assert.match(logText, /RUN 02 · budget 6 · spent 6 · ran out/);
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
  await last.getByRole('heading', { name: 'What should the room keep?', exact: true }).waitFor();
  assert.equal(await last.getByRole('button', { name: /^Keep the lights/ }).isDisabled(), true, 'endings without prerequisites are disabled');
  await last.getByRole('button', { name: /^Keep the record/ }).click(); await last.getByRole('button', { name: 'Write it', exact: true }).click();
  await last.getByRole('heading', { name: 'Everything, in order.', exact: true }).waitFor();
  assert.equal((await stored(last)).ending, 'record');
  await last.screenshot({ path: path.join(output, 'ending-a.png') }); await last.context().close();
  console.log('PASS: empty-budget save resumes into the next run; leaving run 7 asks for the last entry');

  // A full wall asks which note to take down; the new note takes its slot.
  const full = await newPage(seed([...Array(10).fill(postNote), spendOut, ...Array(6).fill(postNote), spendOut, ...Array(8).fill(postNote)], { x: 400, y: 95 }));
  await begin(full); await interact(full, 'The notice hall');
  await full.getByRole('button', { name: /^Write a note/ }).click();
  for (const word of ['exit', 'wait', 'No qualifier']) await full.getByRole('button', { name: word, exact: true }).click();
  await full.getByRole('heading', { name: 'Take one note down?', exact: true }).waitFor();
  await full.locator('.board button.card').first().click(); // the oldest card, in slot 0
  await full.getByRole('button', { name: 'Post it', exact: true }).click();
  s = await stored(full);
  assert.equal(s.notes[0].slot, null); assert.deepEqual(s.notes.at(-1), { run: 3, parts: [4, 4, null], slot: 0 });
  await close(full); await full.screenshot({ path: path.join(output, 'notice-wall-full.png') }); await full.context().close();
  console.log('PASS: full wall replacement reuses the taken-down slot');

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

  const blockedStorage = await h.browser.newContext({ viewport: { width: 1280, height: 800 } });
  await blockedStorage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked by browser policy', 'SecurityError'); } }));
  const r = await blockedStorage.newPage(); r.on('pageerror', e => errors.push(e.message)); await r.goto(url); await begin(r); await r.locator('#help').click();
  assert.match(await r.locator('#dialog-body').innerText(), /storage is unavailable/);
  const fallbackDownload = r.waitForEvent('download'); await r.getByRole('button', { name: 'Export save (.json)', exact: true }).click(); await fallbackDownload;
  console.log('PASS: unavailable storage still allows play and manual export'); await blockedStorage.close();
};
