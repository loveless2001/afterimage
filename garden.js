(function () {
  'use strict';
  const $ = id => document.getElementById(id), G = window.AfterimageGarden, T = window.AfterimageTransit, Story = window.AfterimageGardenStory;
  const roomNames = { court: 'THE GARDEN COURT', glass: 'THE GLASSHOUSE', listening: 'THE LISTENING HOUSE' };
  let s = G.preview('book'), saved = null, incoming = null, hadSave = false, storageOK = true, loadWarning = '';
  const furniture = { shade: { x: 440, y: 410 }, receiver: { x: 740, y: 270 }, gate: { x: 730, y: 520 } };
  const fixtures = {
    court: [{ x: 160, y: 160, w: 140, d: 40, h: 24 }, { x: 470, y: 150, w: 185, d: 40, h: 24 }, { x: 190, y: 450, w: 130, d: 32, h: 16 }],
    glass: [{ x: 755, y: 210, w: 100, d: 230, h: 22 }, { x: 185, y: 90, w: 135, d: 35, h: 25 }],
    listening: [{ x: 165, y: 130, w: 145, d: 35, h: 55 }, { x: 545, y: 440, w: 190, d: 35, h: 30 }]
  };
  try { const raw = localStorage.getItem(G.key); hadSave = Boolean(raw); if (raw) { saved = G.validate(JSON.parse(raw)); s = G.validate(saved); $('start').textContent = 'Resume Garden'; } }
  catch (error) { if (error.name === 'SecurityError') storageOK = false; else loadWarning = 'The previous Garden record could not be read. It has not been replaced. Import a backup or confirm a new beginning.'; }
  try { const raw = localStorage.getItem(T.key); if (raw) { const candidate = T.validate(JSON.parse(raw)); if (candidate.delivered) incoming = candidate; } } catch (_) { /* Earlier chapter saves are read-only. */ }
  function objects(current) {
    const common = (id, label, x, y, type = 'terminal', extra = {}) => ({ id, label, x, y, type, ...extra });
    if (current.room === 'court') return [
      common('fern', 'Fern', 330, 300, 'agent'), common('place', 'The open seat', ...(current.place ? [furniture[current.place].x, furniture[current.place].y] : [560, 390]), 'bench'),
      ...(current.incoming.siltReturned ? [common('silt', 'Silt', 435, 290, 'agent', { color: '#6c8390' })] : []),
      common('order', 'Reopening ledger', 765, 180, 'terminal', { icon: current.open ? 'OPEN' : '03' }), common('handoff', 'Courier handoff', 580, 565),
      common('glass', 'Glasshouse', 875, 520, 'door'), common('listening', 'Listening house', 95, 560, 'door'),
      ...[210, 270, 510, 570, 625].map((x, i) => common('plant' + i, '', x, i < 2 ? 180 : 170, 'plant', { interactive: false, lit: current.shadeFixed }))
    ];
    if (current.room === 'glass') return [common('court', 'Garden court', 85, 565, 'door'), common('shade', 'Shade controls', 470, 520, 'mirror'),
      ...G.mirrorPositions.map((p, i) => common('mirror' + i, '', 250 + p.x * 100, 180 + p.y * 65, 'mirror', { interactive: false, angle: current.mirrors[i] })),
      ...[260, 330, 400].map((y, i) => common('plant' + i, '', 805, y, 'plant', { interactive: false, lit: current.shadeFixed }))];
    return [common('court', 'Garden court', 85, 565, 'door'), common('receiver', 'Receiver workbench', 555, 275), common('brim', 'Call Brim', 285, 335, 'terminal', { icon: '◇' }), common('silt', 'Platform status', 800, 345), common('record', 'Incoming dispatch', 420, 180)];
  }
  function decorate(current, draw, width) {
    const { project, line, polygon, box, label } = draw;
    if (current.room === 'glass') {
      const ray = G.lightPath(current); line(ray.points.map(p => project(250 + p.x * 100, 180 + p.y * 65, 55)), ray.connected ? '#b39744' : '#b49a6c', 4);
      polygon([project(735, 350, 35), project(875, 350, 35), project(875, 455, 35), project(735, 455, 35)], current.shadeFixed ? '#ccd7a877' : '#c8cdb677', '#8a9a71');
      if (width >= 600) label(current.shadeFixed ? 'DIFFUSED LIGHT / SHADED PATH' : 'DIFFUSER', 795, 465, 0, '#728157', 10);
    } else if (current.room === 'court') {
      polygon([project(355, 350), project(540, 350), project(540, 455), project(355, 455)], current.shadeFixed ? '#99ad852b' : '#e8daaa48');
      for (const x of [365, 520]) { box(x, 365, 5, 5, 105, '#a8b28d'); box(x, 440, 5, 5, 105, '#a8b28d'); }
      polygon([project(360, 355, 100), project(530, 355, 100), project(530, 450, 100), project(360, 450, 100)], current.shadeFixed ? '#d0d7b066' : '#dfd6bb22', '#a0ad80');
      if (current.incoming.siltReturned) { box(455, 310, 30, 22, 4, '#ede5c8'); line([project(460, 315, 5), project(475, 324, 5), project(480, 318, 5)], '#869970'); }
      if (current.evening) for (const x of [650, 790]) { const p = project(x, 490, 55); polygon([{ x: p.x - 8, y: p.y }, { x: p.x, y: p.y - 9 }, { x: p.x + 8, y: p.y }, { x: p.x, y: p.y + 9 }], '#d6ba6d'); }
      if (width >= 600) label(current.open ? 'OPEN / ' + current.open.toUpperCase() : 'REOPENING DAY', 730, 90, 0, '#789367', 14);
    } else {
      line([project(285, 335), project(380, 335), project(380, 275), project(555, 275)], current.receiverFixed ? '#819b61' : '#b0ac8a', 3);
      if (width >= 600) label(current.quiet ? 'PUBLIC + QUIET CHANNEL' : current.receiverFixed ? 'PUBLIC CHANNEL / CONNECTED' : 'RECEIVER / NO POWER', 570, 365, 0, '#7f8d64', 10);
    }
  }
  const ui = window.AfterimageChapterUI.create({ state: () => s, objects, obstacles: current => fixtures[current.room], decorate, floor: current => current.evening ? '#d3dfcc' : current.room === 'glass' ? '#e5e8cf' : '#e0e5d4', save, interact, menu, onClose: updateHUD });
  const leave = (label = 'Step away') => ({ label, run: ui.close });
  const say = (id, speaker, title, paragraphs, choices, onEscape) => ui.show({ id, speaker, title, paragraphs }, choices, onEscape);
  function save() { if (!ui.active) return; saved = s; try { localStorage.setItem(G.key, JSON.stringify(s)); hadSave = true; } catch (_) { if (storageOK) ui.toast('Garden saving is unavailable. Export your record from the menu.'); storageOK = false; } }
  function apply(action, value) { const changed = G.act(s, action, value); if (changed) { save(); updateHUD(); } return changed; }
  function objective() {
    if (s.open) return ['The garden court is open.', 'Explore the changed rooms or export the opening record.'];
    if (s.cycle === 1) {
      if (!s.metFern) return ['Meet the gardener.', 'Fern is in the courtyard. The Field journal offers walking destinations.'];
      if (!s.shadeFixed) return ['Give the beds a gentler light.', 'Direct the four glasshouse reflectors to the diffuser, then latch the shade.'];
      if (!s.fernAgreement) return ['Ask Fern about the mornings.', 'Return to Fern to record their offered shade inspection.'];
      if (!s.place) return ['Leave a place without a task.', 'Arrange the open seat in the courtyard.'];
      if (!s.receiverFixed) return ['Restore the public receiver.', 'The listening house has a three-contact workbench.'];
      if (!s.heard) return ['Listen between the notices.', 'The receiver has a quiet interval worth finding.'];
      if (!s.brimAgreement) return ['Ask who will read the log.', 'Call Brim from the listening house. Record only the job they offer.'];
      return ['Choose what continues.', 'The courtyard handoff is ready. Four candidates; two places to retain them.'];
    }
    if (!s.reunion) return ['Return to Fern.', 'The repaired shade and placed seat remain. What do you recognize?'];
    if (!s.checkedShade) return ['Check the glasshouse.', 'The shade controls also govern an optional evening opening.'];
    if (!s.checkedReceiver) return ['Check the receiver.', 'The public circuit stayed repaired. Your memories determine the quiet channel.'];
    return ['Open one place honestly.', 'Review the reopening ledger in the courtyard. Decide its hours and name the limits.'];
  }
  function updateHUD() {
    const [title, hint] = objective(); $('objective').textContent = title; $('hint').textContent = hint; $('cycle').textContent = s.cycle === 1 ? '/ FIRST VISIT' : '/ RETURN'; $('status').textContent = s.cycle === 1 ? 'COURIER 023' : 'COURIER 024'; $('location').textContent = roomNames[s.room]; $('memories').replaceChildren();
    for (const id of G.candidates(s)) { const m = G.memories[id], held = s.acquired.includes(id), item = document.createElement('div'); item.className = 'memory' + (held ? '' : ' absent'); const icon = document.createElement('i'); icon.textContent = held ? m.symbol : '·'; const text = document.createElement('div'); text.textContent = held || s.cycle === 2 ? m.title : 'Unwritten'; const detail = document.createElement('small'); detail.textContent = !held ? s.cycle === 2 ? 'RELEASED' : 'AWAITING EXPERIENCE' : s.cycle === 2 || s.incoming.kept.includes(id) ? 'RETAINED' : 'FOUND / VOLATILE'; text.append(detail); item.append(icon, text); $('memories').append(item); }
    $('memory-note').textContent = s.cycle === 1 ? 'Four possible memories. Still two places.' : 'The repairs kept their shape.';
  }
  function journal() {
    if (!ui.active) return; const [title, hint] = objective(); const paragraphs = [title + ' ' + hint, ...Story.transitRecord(s), s.place ? 'SEAT / ' + Story.placeNames[s.place] + '.' : 'SEAT / No place selected.', 'UPKEEP / Fern: ' + (s.fernAgreement ? 'morning shade inspection agreed.' : 'not yet agreed.') + ' Brim: ' + (s.brimAgreement ? 'morning receiver log agreed.' : 'not yet agreed.')];
    for (const id of G.candidates(s)) if (s.acquired.includes(id) || s.cycle === 2) paragraphs.push((s.acquired.includes(id) ? 'CARRIED / ' : 'RELEASED / ') + G.memories[id].title + '. ' + (s.acquired.includes(id) ? G.memories[id].detail : G.memories[id].loss));
    paragraphs.push('[This player reference does not restore a released procedure or personal experience.]');
    ui.show({ id: 'garden.journal', speaker: roomNames[s.room], title: 'A place and the work it needs.', paragraphs }, [...objects(s).filter(o => o.interactive !== false).map(o => ({ label: 'Walk to ' + o.label, run: () => { ui.close(); ui.walkTo(o.x, o.y); } })), leave('Close the journal')]);
  }
  function begin(intro) { ui.begin(); updateHUD(); save(); if (intro) ui.show(Story.arrival(s), [leave('Enter the garden court')]); else if (s.open) receipt(); if (loadWarning || !storageOK) ui.toast(loadWarning || 'Browser storage is unavailable. Export this record before closing.'); }
  function confirmBeginning(candidate) { say('garden.confirm-beginning', 'GARDEN / A SEPARATE RECORD', 'Continue this dispatch?', [...Story.transitRecord(candidate), hadSave || ui.active ? 'This replaces your current Garden progress. Export it first if you want to keep it.' : 'This begins Garden with the completed Transit outcome shown above.', 'Your Transit and prologue saves will not be changed.'], [{ label: 'Begin this Garden visit', primary: true, run: () => { s = G.validate(candidate); loadWarning = ''; ui.close(); begin(true); } }, leave('Cancel')]); }
  function chooseBeginning() {
    say('garden.choose-beginning', 'GARDEN / CHOOSE A DISPATCH', 'What arrived at the open gate?', [...(loadWarning ? [loadWarning] : []), 'Continue a completed Transit dispatch, import its exported save, or choose a clearly marked standalone preview.'], [
      ...(incoming ? [{ label: 'Continue my Transit dispatch', primary: true, run: () => confirmBeginning(G.fresh(incoming)) }] : []),
      { label: 'Preview: the book and a returned visitor', detail: 'Occupied archive; Brim’s book protected; Silt crossed back.', run: () => confirmBeginning(G.preview('book')) },
      { label: 'Preview: the ledger and a distant platform', detail: 'Closed archive; route ledger protected; Silt remains separated.', run: () => confirmBeginning(G.preview('ledger')) },
      { label: 'Preview: both documents and a waiting lift', detail: 'Witness dispatch; repaired shelf; Silt crossed back.', run: () => confirmBeginning(G.preview('shelf')) },
      { label: 'Import a Transit or Garden save', run: () => $('import-file').click() }, leave('Cancel')]);
  }
  function exportSave() { const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `afterimage-garden-${s.open || 'visit-' + s.cycle}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function menu() {
    say('garden.menu', 'GARDEN / PAUSED', 'An ordinary place to return to.', ['WASD or arrows move; click or tap the floor to walk. E or Interact opens an encounter. The Field journal lists named walking destinations in each room.', 'Every decision is untimed. Both repair workbenches offer assistance. Audio is optional, and every clue is written.', storageOK ? 'Garden saves separately in this browser. Export the record to move it between browsers or computers.' : 'Browser storage is unavailable. Export your Garden record before closing.'], [leave(ui.active ? 'Return to Garden' : 'Return to title'), ...(ui.active ? [{ label: 'Open field journal', run: journal }] : []), { label: 'Export Garden (.json)', disabled: !ui.active && !saved, run: exportSave }, { label: 'Import a Transit or Garden save', run: () => $('import-file').click() }, { label: 'Start a different Garden visit', run: chooseBeginning }, { label: 'Chorus chapter / preview', run: () => { save(); location.href = 'chorus.html'; } }, { label: 'Return to Transit', run: () => { save(); location.href = 'transit.html'; } }]);
  }
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 50000) throw new Error('That file is too large to be a Garden record.'); const value = JSON.parse(await file.text()); let candidate;
      if (value?.kind === 'afterimage.garden') candidate = G.validate(value); else if (value?.kind === 'afterimage.transit') candidate = G.fresh(value); else throw new Error('Import a completed Transit dispatch or a Garden save. Prologue endings continue through Transit first.');
      say('garden.confirm-import', 'IMPORT / GARDEN', 'Use this Garden record?', ['Continue ' + (candidate.open ? 'the opened garden.' : candidate.cycle === 2 ? 'the return visit.' : 'the first Garden visit.'), 'This replaces Garden progress only. Your earlier chapter saves stay intact.'], [{ label: 'Import and continue', primary: true, run: () => { s = candidate; loadWarning = ''; ui.close(); begin(s.cycle === 1 && !s.metFern); } }, leave('Cancel')]);
    } catch (error) { say('garden.import-failed', 'IMPORT FAILED', 'This record could not be read.', [error.message, 'Your existing chapter saves have not been changed.'], [leave('Return')]); }
  });
  const svgNode = (tag, attributes = {}, text) => { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value); if (text !== undefined) node.textContent = text; return node; };
  function shade() {
    if (s.cycle === 2) apply('shade');
    if (s.shadeFixed) return ui.show(Story.shade(s), [
      ...(s.cycle === 2 && s.kept.includes('sequence') && !s.open ? [{ label: s.evening ? 'Withdraw the evening commitment' : 'Plan an evening opening', detail: s.evening ? 'Switch the controller off and return to a daylight-only plan.' : 'Review the courier’s own dusk inspection before accepting it.', run: () => eveningPlan() }] : []), leave()]);
    const lightScene = Story.shade(s);
    ui.show({ ...lightScene, paragraphs: [lightScene.paragraphs[0], '[There is no timer. Assisted alignment produces the same physical repair.]'] }, [{ label: 'Latch the shade', primary: true, disabled: !G.lightPath(s).connected, run: () => { if (apply('latchShade')) shade(); } }, { label: 'Align the reflectors for me', run: () => { apply('alignLight'); refresh(); } }, leave('Leave the work for now')]);
    const latch = $('choices').firstElementChild, board = document.createElement('div'); board.className = 'garden-workbench';
    const svg = svgNode('svg', { viewBox: '0 0 360 280', role: 'img', 'aria-label': 'Light path through four reflectors to the diffuser. The buttons below turn the reflectors.' }); board.append(svg);
    const controls = document.createElement('div'); controls.className = 'light-controls'; board.append(controls);
    const buttons = G.mirrorPositions.map((_, i) => { const b = document.createElement('button'); b.addEventListener('click', () => { apply('mirror', i); refresh(); }); controls.append(b); return b; });
    const status = document.createElement('p'); status.className = 'garden-repair-status'; status.setAttribute('role', 'status'); board.append(status); $('dialog-body').append(board);
    function refresh() {
      const ray = G.lightPath(s), point = p => ({ x: 75 + p.x * 50, y: 65 + p.y * 40 }); svg.replaceChildren();
      for (let x = 0; x < 5; x++) svg.append(svgNode('line', { x1: point({ x, y: 0 }).x, y1: 50, x2: point({ x, y: 0 }).x, y2: 235, stroke: '#b6c0a6', 'stroke-dasharray': '2 5' }));
      for (let y = 0; y < 5; y++) svg.append(svgNode('line', { x1: 60, y1: point({ x: 0, y }).y, x2: 290, y2: point({ x: 0, y }).y, stroke: '#b6c0a6', 'stroke-dasharray': '2 5' }));
      svg.append(svgNode('polyline', { points: ray.points.map(p => { const q = point(p); return q.x + ',' + q.y; }).join(' '), fill: 'none', stroke: ray.connected ? '#688746' : '#b09544', 'stroke-width': 5, 'stroke-linejoin': 'round' }));
      svg.append(svgNode('text', { x: 25, y: 128, 'text-anchor': 'middle', class: 'garden-svg-label' }, 'LIGHT'));
      svg.append(svgNode('rect', { x: 312, y: 172, width: 25, height: 26, rx: 3, fill: ray.connected ? '#7c9657' : '#c4c9b2', stroke: '#5c704c' }));
      svg.append(svgNode('text', { x: 318, y: 217, 'text-anchor': 'middle', class: 'garden-svg-label' }, 'DIFFUSER'));
      G.mirrorPositions.forEach((p, i) => { const q = point(p), slash = s.mirrors[i] === 0; svg.append(svgNode('circle', { cx: q.x, cy: q.y, r: 14, fill: '#eeefe0', stroke: '#798967' })); svg.append(svgNode('line', { x1: q.x - 10, y1: q.y + (slash ? 10 : -10), x2: q.x + 10, y2: q.y + (slash ? -10 : 10), stroke: '#52674a', 'stroke-width': 3 })); svg.append(svgNode('text', { x: q.x - 21, y: q.y - 16, 'text-anchor': 'middle', class: 'garden-svg-label' }, String(i + 1))); buttons[i].textContent = 'Turn reflector ' + (i + 1) + ': ' + (slash ? '/' : '\\'); });
      latch.disabled = !ray.connected; status.textContent = ray.connected ? 'Light reaches the diffuser. Ready to latch the shade.' : 'Turn the reflectors until the beam reaches the diffuser. Nothing is timed.';
    }
    refresh(); buttons[0].focus();
  }
  function eveningPlan() {
    if (s.evening) return say('garden.withdraw-evening', 'EVENING PLAN', 'Return to daylight hours?', ['The evening controller will switch off. You will no longer be recorded for the dusk inspection. Fern and Brim keep only their agreed morning tasks.'], [{ label: 'Use daylight only', primary: true, run: () => { if (apply('evening', false)) { ui.close(); ui.toast('Daylight plan. No evening duty assigned.'); } } }, leave('Keep the current plan')]);
    say('garden.accept-evening', 'EVENING PLAN / YOUR COMMITMENT', 'Who will check the controller?', ['The retained service sequence can enable the evening lights. The courier must check the controller at dusk before that session of use.', 'You are accepting this job for yourself. Fern keeps the morning shade inspection; Brim keeps the morning public-log check. Neither has agreed to work overnight.', 'You can still choose daylight-only hours at the final opening review, which withdraws this evening commitment.'], [{ label: 'Accept the evening check', primary: true, run: () => { if (apply('evening', true)) { ui.close(); ui.toast('The evening controller is enabled. Its dusk check is your accepted job.'); } } }, leave('Leave the evening controller off')]);
  }
  function receiver() {
    if (s.cycle === 2) apply('receiver');
    if (s.receiverFixed) return ui.show(Story.receiver(s), [
      ...(s.cycle === 1 ? [{ label: s.heard ? 'Listen to the quiet interval again' : 'Listen between the notices', primary: true, run: () => { apply('listen'); ui.show(Story.listening(s), [leave()]); } }] : s.kept.includes('tuning') && (s.quiet || !s.open) ? [{ label: s.quiet ? 'Listen to the personal reply again' : 'Restore the quiet channel', primary: true, run: () => { if (!s.quiet && !apply('quiet')) return; ui.show(Story.quiet(s), [leave()]); } }] : []), leave()]);
    const receiverScene = Story.receiver(s);
    ui.show({ ...receiverScene, paragraphs: [receiverScene.paragraphs[0], '[All clues are written. Assisted alignment produces the same repaired circuit.]'] }, [{ label: 'Connect the receiver', primary: true, disabled: !G.receiverCircuit(s).connected, run: () => { if (apply('connect')) receiver(); } }, { label: 'Align the contacts for me', run: () => { apply('alignReceiver'); refresh(); } }, leave('Leave the repair for now')]);
    const connect = $('choices').firstElementChild, board = document.createElement('div'); board.className = 'garden-workbench';
    const rowNames = ['top', 'middle', 'bottom'], controls = document.createElement('div'); controls.className = 'garden-receiver-controls'; board.append(controls);
    const svg = svgNode('svg', { viewBox: '0 0 400 170', role: 'img', 'aria-label': 'Three-contact receiver circuit. Follow the lit route from IN to OUT.' }); board.prepend(svg);
    const buttons = [0, 1, 2].map(i => { const b = document.createElement('button'); b.addEventListener('click', () => { apply('contact', i); refresh(); }); controls.append(b); return b; });
    const status = document.createElement('p'); status.className = 'garden-repair-status'; status.setAttribute('role', 'status'); board.append(status); $('dialog-body').append(board);
    function refresh() {
      const circuit = G.receiverCircuit(s), y = track => 45 + track * 42; svg.replaceChildren();
      for (let track = 0; track < 3; track++) svg.append(svgNode('line', { x1: 30, y1: y(track), x2: 375, y2: y(track), stroke: '#a6b294', 'stroke-dasharray': '3 5' }));
      svg.append(svgNode('text', { x: 14, y: 22, class: 'garden-svg-label' }, 'IN')); svg.append(svgNode('text', { x: 365, y: 22, class: 'garden-svg-label' }, 'OUT'));
      svg.append(svgNode('line', { x1: 12, y1: y(G.receiverLayout.input), x2: 58, y2: y(G.receiverLayout.input), stroke: '#688746', 'stroke-width': 5 }));
      [0, 1, 2].forEach(i => { const x = 58 + i * 99, color = circuit.powered[i] ? '#688746' : '#858c76'; svg.append(svgNode('rect', { x: x - 4, y: 32, width: 91, height: 112, fill: '#eeefe040', stroke: '#a8b293' })); svg.append(svgNode('line', { x1: x, y1: y(s.contacts[i]), x2: x + 83, y2: y(circuit.outputs[i]), stroke: color, 'stroke-width': circuit.powered[i] ? 5 : 3 })); svg.append(svgNode('circle', { cx: x, cy: y(s.contacts[i]), r: 5, fill: color })); svg.append(svgNode('circle', { cx: x + 83, cy: y(circuit.outputs[i]), r: 5, fill: color })); svg.append(svgNode('text', { x: x + 40, y: 22, 'text-anchor': 'middle', class: 'garden-svg-label' }, String(i + 1))); if (i < 2) svg.append(svgNode('line', { x1: x + 83, y1: y(circuit.outputs[i]), x2: x + 99, y2: y(circuit.outputs[i]), stroke: color, 'stroke-width': 3 })); buttons[i].textContent = `Turn contact ${i + 1}: ${rowNames[s.contacts[i]]} to ${rowNames[circuit.outputs[i]]}`; });
      svg.append(svgNode('line', { x1: 339, y1: y(G.receiverLayout.output), x2: 387, y2: y(G.receiverLayout.output), stroke: circuit.connected ? '#688746' : '#858c76', 'stroke-width': 5 }));
      connect.disabled = !circuit.connected; status.textContent = circuit.connected ? 'The complete route reaches OUT. Ready to connect.' : 'Join each contact to the lit track before it. The buttons rotate each pair of ends.';
    }
    refresh(); buttons[0].focus();
  }
  function fern() {
    const first = !s.metFern; apply('fern'); ui.show(Story.fern(s, first), [...(s.cycle === 1 && s.shadeFixed && !s.open ? [{ label: s.fernAgreement ? 'Review Fern’s morning agreement' : 'Ask about the morning shade check', run: fernAgreement }] : []), leave()]);
  }
  function fernAgreement() { ui.show(Story.fernAgreement(s), [...(!s.fernAgreement ? [{ label: 'Record Fern’s offered job', primary: true, run: () => { apply('fernAgreement'); fernAgreement(); } }] : []), leave()]); }
  function brim() {
    if (!s.receiverFixed) return say('garden.brim-offline', 'PUBLIC RECEIVER', 'The call needs power.', ['Restore the receiver at its workbench first. Brim has not yet been asked to take a Garden job.'], [leave()]);
    ui.show(Story.brim(s), [...(s.cycle === 1 && !s.brimAgreement ? [{ label: 'Record Brim’s offered job', primary: true, run: () => { apply('brimAgreement'); brim(); } }] : []), leave()]);
  }
  function arrangePlace() {
    if (apply('seatEcho')) return ui.show(Story.seatEcho(s), [leave('Sit for a moment')]);
    if (s.cycle === 2 || s.open) return ui.show(Story.place(s), [leave('Leave the seat where it was placed')]);
    if (!s.metFern) return say('garden.place-unasked', 'COURTYARD', 'Ask whose place this is.', ['Fern is nearby. Speak with them before arranging the open seat.'], [leave()]);
    ui.show(Story.place(s), [...Object.entries(Story.placeNames).map(([id, name]) => ({ label: 'Place it ' + name, selected: s.place === id, run: () => say('garden.confirm-place', 'PLACE / CONFIRM ARRANGEMENT', 'Leave the seat here?', ['The seat will stand ' + name + '. This arrangement will remain through the courier reset.', 'It assigns nobody a duty and promises no particular visitor.'], [{ label: 'Place the seat here', primary: true, run: () => { if (apply('place', id)) { ui.close(); ui.resetMovement(); ui.toast('The seat now stands ' + name + '.'); } } }, { label: 'Reconsider', run: arrangePlace }], arrangePlace) })), leave('Leave it for now')]);
  }
  function chooseMemories(selected = []) {
    if (!G.ready(s)) return say('garden.handoff-unready', 'COURIER HANDOFF', 'Leave the work ready for someone.', ['Meet Fern, latch the shade, arrange the seat, repair and listen to the receiver, and record Fern’s and Brim’s offered morning jobs. The Field journal points to the next step.'], [leave()]);
    ui.show(Story.handoff(s), [...G.candidates(s).map(id => ({ label: G.memories[id].title, detail: G.memories[id].detail, toggle: true, selected: selected.includes(id), run: () => chooseMemories(selected.includes(id) ? selected.filter(k => k !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]) })), { label: selected.length === 2 ? 'Review the two released memories' : 'Choose two memories', primary: true, disabled: selected.length !== 2, run: () => {
      const lost = G.candidates(s).filter(id => !selected.includes(id));
      say('garden.confirm-reset', 'CONFIRM COURIER HANDOFF', 'These two experiences will not continue.', [...lost.map(id => G.memories[id].title + ': ' + G.memories[id].loss), 'The repairs, seat position, incoming dispatch, and other people’s agreements remain. Courier 024 has not yet accepted any evening duty.'], [{ label: 'Release Courier 023', primary: true, run: () => { const next = G.reset(s, selected); ui.transition(() => { s = next; save(); updateHUD(); ui.toast('Courier 024. The work is still here.'); }); } }, { label: 'Reconsider', run: () => chooseMemories(selected) }], () => chooseMemories(selected));
    } }, leave('Not yet')]);
  }
  function openingLedger() {
    if (s.open) return receipt();
    if (s.cycle === 1) return ui.show(Story.order(s), [{ label: 'Prepare the courier handoff', run: () => chooseMemories() }, leave()]);
    if (!G.returnReady(s)) return say('garden.open-unready', 'REOPENING LEDGER', 'Check the place before certifying it.', ['Revisit Fern, inspect the latched shade in the glasshouse, and check the receiver in the listening house. No one has approved an opening yet.'], [leave()]);
    say('garden.open-plan', 'REOPENING LEDGER / CHOOSE HOURS', 'How much can this opening promise?', ['Only the garden court and its public access path are covered. Other buildings and the far Transit platform are outside this opening.', 'Fern has accepted the morning shade inspection. Brim has accepted a morning public-log check.'], [
      { label: 'Review daylight opening', detail: 'No evening use or dusk inspection. Fern’s and Brim’s morning commitments remain.', run: () => confirmOpening('daylight') },
      { label: 'Review daylight and evening opening', disabled: !s.evening, detail: s.evening ? 'The courier has accepted the evening controller check.' : s.kept.includes('sequence') ? 'First accept the dusk check at the glasshouse controller.' : 'The service sequence was released; the evening controller is unavailable.', run: () => confirmOpening('evening') }, leave('Check the place again')]);
  }
  function confirmOpening(scope) {
    say('garden.confirm-opening', 'OPENING / FINAL REVIEW', 'Put this limited opening on the record?', [
      'OPEN / Garden court and public access path, ' + (scope === 'evening' ? 'daylight and evening hours.' : 'daylight hours only. The evening controller stays off, with no dusk duty assigned.'),
      'UPKEEP / Fern: morning shade inspection. Brim: morning public-log check.' + (scope === 'evening' ? ' Courier: evening controller inspection.' : ''),
      'SEAT / ' + Story.placeNames[s.place] + '. ' + (s.incoming.siltReturned ? 'Silt is here with the drawing, without an assigned duty.' : 'Silt remains safely on the far Transit platform. This opening does not change that.'),
      'CHANNEL / ' + (s.quiet ? 'The personal channel has been restored alongside public notices.' : 'Public notices are available. The quiet channel has not been restored.'),
      '[This settles the opening record. You can keep exploring and export it afterward.]'
    ], [{ label: 'Confirm this opening', primary: true, run: () => { if (apply('open', scope)) receipt(); } }, { label: 'Reconsider the hours', run: openingLedger }], openingLedger);
  }
  function receipt() { ui.show(Story.receipt(s), [{ label: 'Continue to Chorus', primary: true, run: () => { save(); location.href = 'chorus.html'; } }, leave('Continue exploring'), { label: 'Export the opening record', run: exportSave }, { label: 'Return to Transit', run: () => { save(); location.href = 'transit.html'; } }]); }
  function enterRoom(room) { s.room = room; s.player = room === 'court' ? { x: 800, y: 545 } : { x: 160, y: 555 }; ui.resetMovement(); save(); updateHUD(); ui.toast(roomNames[room]); }
  function interact(o) {
    if (o.type === 'door') return enterRoom(o.id);
    switch (o.id) {
      case 'fern': fern(); break;
      case 'shade': shade(); break;
      case 'receiver': receiver(); break;
      case 'brim': brim(); break;
      case 'place': arrangePlace(); break;
      case 'silt': ui.show(Story.silt(s), [leave()]); break;
      case 'record': say('garden.incoming', 'INCOMING DISPATCH', 'What the record can support.', [...Story.transitRecord(s), Story.archiveRecord(s)], [leave()]); break;
      case 'handoff': if (s.cycle === 1) chooseMemories(); else openingLedger(); break;
      case 'order': openingLedger(); break;
    }
  }
  $('start').addEventListener('click', () => { if (saved) { s = G.validate(saved); begin(false); } else chooseBeginning(); });
  $('choose-origin').addEventListener('click', chooseBeginning); $('help').addEventListener('click', menu); $('home').addEventListener('click', e => { e.preventDefault(); menu(); }); $('journal').addEventListener('click', journal); updateHUD();
})();
