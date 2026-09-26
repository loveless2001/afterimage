// Journey 2: meeting a resident by walking up to them, recognition from a
// pinned note, the secret bench ending, writing the last entry at the desk,
// revisiting endings, the night palette and its menu override, the ?debug
// playtest overlay, and importing an empty-budget save with notes on the wall.
module.exports = async h => {
  const { assert, path, fs, url, output, seed, leaveRun, lightLamp, newPage, begin, walk, interact, close, stored, waitForRun } = h;
  const talk = resident => ({ type: 'Talk', resident }), post = parts => ({ type: 'Post', parts });
  const heading = (page, name) => page.getByRole('heading', { name, exact: true }).waitFor();
  const button = (page, name) => page.getByRole('button', { name: typeof name === 'string' ? new RegExp('^' + name) : name });
  // Earns all three residents' trust in runs 1–2, including Wren's recognition.
  const trustAll = [lightLamp('hall'), talk('juno'), talk('pell'), talk('wren'), talk('juno'), post([7, 0, null]), talk('pell'),
    post([5, 4, 3]), { type: 'EndRun', reason: 'left', pin: 1 }, talk('wren')];

  // Meet Juno by walking up and pressing E; the first talk costs 1.
  const p = await newPage();
  await begin(p); await walk(p, 700, 490); await interact(p, 'A resident polishing a lamp');
  await heading(p, 'Talk to the resident?'); await button(p, 'Talk').click();
  await heading(p, '“Mind the dark patches.”'); await close(p);
  let s = await stored(p);
  assert.equal(s.budget, 9); assert.deepEqual(s.talks, [{ id: 'juno', run: 1 }]);
  // The prompt label refreshes on the next frame after the dialog closes, so wait for it.
  await p.waitForFunction(() => document.getElementById('interact-label').textContent === 'Juno', null, { timeout: 5000 });
  await p.screenshot({ path: path.join(output, 'resident-met.png') }); await p.context().close();
  console.log('PASS: meeting a resident through the room, with the talk cost confirmed');

  // A pinned note naming Wren makes her recognise you.
  const w = await newPage(seed([talk('wren'), post([5, 0, null]), { type: 'EndRun', reason: 'left', pin: 0 }], { x: 380, y: 460 }));
  await begin(w); await interact(w, 'Wren'); await button(w, 'Talk').click();
  await heading(w, '“I know you.”');
  assert.deepEqual((await stored(w)).trusted, [{ id: 'wren', run: 2 }]); await w.context().close();
  console.log('PASS: recognition from a pinned note earns Wren’s trust');

  // A trusted Juno reads this run's note as the answer and teaches a word for the builder.
  const a = await newPage(seed([lightLamp('hall'), talk('juno'), talk('juno'), post([2, 1, null])], { x: 700, y: 490 }));
  await begin(a);
  assert.equal(await a.locator('#objective').innerText(), 'Answer Juno.', 'a ready answer is the next step, ahead of meeting the others');
  assert.match(await a.locator('#hint').innerText(), /answers Juno’s question/);
  await interact(a, 'Juno'); await heading(a, '“So that’s where.”');
  assert.match(await a.locator('#dialog-body').innerText(), /New word: “light”/);
  assert.deepEqual((await stored(a)).answers, [{ id: 'juno', q: 0, run: 1, note: 0 }]); await close(a);
  await walk(a, 400, 95); await interact(a, 'The notice hall'); await button(a, 'Write a note').click();
  assert.equal(await a.locator('#choices').getAttribute('class'), 'words');
  await button(a, 'desk').click(); assert.equal(await button(a, 'light').count(), 1, 'the learned verb is in the builder');
  await a.screenshot({ path: path.join(output, 'question-answered-word-learned.png') }); await a.context().close();
  console.log('PASS: answering a question with a note teaches a word the note builder offers');

  // The turn: night palette, the bench secret, revisiting, then the desk's last entry.
  const t = await newPage(seed([...trustAll, leaveRun, leaveRun, leaveRun, leaveRun], { x: 150, y: 450 }));
  await begin(t);
  assert.equal(await t.evaluate(() => document.documentElement.dataset.theme), 'night', 'auto palette turns to night at run 6');
  await t.locator('#journal').click();
  assert.equal(await button(t, 'Walk to a quiet corner').count(), 0, 'the bench is not listed before it is found'); await close(t);
  await interact(t, 'A quiet corner'); await heading(t, 'Three residents are waiting on the bench.');
  await button(t, 'Sit with them').click(); await heading(t, 'Still here.');
  assert.equal((await stored(t)).ending, 'alcove');
  await t.screenshot({ path: path.join(output, 'ending-d-secret.png') });
  await button(t, 'Revisit the choice').click();
  s = await stored(t); assert.equal(s.ending, null); assert.equal(s.run, 6); assert.equal(s.benchSeen, true);
  await t.locator('#journal').click(); assert.equal(await button(t, 'Walk to a quiet corner').count(), 1); await close(t);
  await walk(t, 475, 405); await interact(t, 'The run log');
  await button(t, 'Write the last entry').click(); await heading(t, 'What should the room keep?');
  assert.equal(await button(t, 'Keep the wall').isDisabled(), true);
  await button(t, 'Keep the record').click(); await button(t, 'Write it').click(); await heading(t, 'Everything, in order.');
  assert.equal((await stored(t)).ending, 'record'); await close(t);
  await t.locator('#help').click(); await button(t, 'Revisit the ending').click();
  assert.equal((await stored(t)).ending, null, 'endings can be revisited from the menu');
  await t.locator('#help').click(); await button(t, 'Palette: auto').click();
  assert.equal((await stored(t)).palette, 'day'); await close(t);
  assert.equal(await t.evaluate(() => document.documentElement.dataset.theme), 'day', 'the manual palette overrides the turn');
  await t.context().close();
  console.log('PASS: turn at run 6, secret bench ending, revisit, last entry at the desk, palette override');

  // An empty-budget save with notes on the wall, imported mid-game, opens the handoff.
  const spentWithNotes = seed([post([0, 0, null]), leaveRun, ...Array(6).fill(post([1, 0, null]))]);
  const importPath = path.join(output, 'spent-with-notes.json'); fs.writeFileSync(importPath, JSON.stringify(spentWithNotes));
  const q = await newPage(); await begin(q); await q.locator('#help').click();
  await q.locator('#import-file').setInputFiles(importPath); await button(q, 'Import and resume').click();
  await heading(q, 'Pin a note for the next run?'); await button(q, 'Pin nothing').click(); await waitForRun(q, 3);
  await q.context().close();
  console.log('PASS: importing an empty-budget save with wall notes offers the handoff, then starts the next run');

  // The playtest overlay appears only with ?debug and stays local.
  const d = await newPage(); await d.goto(url + '?debug'); await begin(d); await d.waitForTimeout(700);
  assert.match(await d.locator('#debug').innerText(), /PLAYTEST/); await d.context().close();
  console.log('PASS: ?debug playtest overlay');
};
