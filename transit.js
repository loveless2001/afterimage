(function () {
  'use strict';
  const $ = id => document.getElementById(id), C = window.AfterimageTransit, Story = window.AfterimageTransitStory, S = window.AfterimageState;
  const canvas = $('world'), ctx = canvas.getContext('2d'), keys = new Set();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s = C.fresh('stay'), saved = null, archive = null, started = false, modal = false, transitioning = false;
  let storageOK = true, loadWarning = '', hadSave = false, focusReturn = null, escapeAction = null, target = null, nearby = null;
  let width = 0, height = 0, scale = 1, origin = { x: 0, y: 0 }, last = 0, time = 0, saveClock = 0, toastTimer;
  let audio = null, soundOn = false, audioNodes = [];
  const roomNames = { hall: 'THE SORTING HALL', crossing: 'THE MAINTENANCE CROSSING', dispatch: 'THE DISPATCH PLATFORM' };
  const fixtures = {
    hall: [{ x: 160, y: 145, w: 200, d: 35, h: 75 }, { x: 415, y: 145, w: 180, d: 35, h: 75 }, { x: 160, y: 450, w: 240, d: 35, h: 58 }],
    crossing: [{ x: 190, y: 150, w: 145, d: 35, h: 45 }],
    dispatch: [{ x: 170, y: 150, w: 180, d: 38, h: 55 }, { x: 530, y: 430, w: 180, d: 38, h: 35 }]
  };
  const places = {
    hall: [
      { id: 'brim', label: 'Brim', x: 300, y: 330, type: 'agent' },
      { id: 'sorter', label: 'Sorting console', x: 660, y: 250, type: 'terminal' },
      { id: 'shelf', label: 'Spare shelf', x: 620, y: 435, type: 'shelf' },
      { id: 'silt', label: 'Silt', x: 390, y: 345, type: 'agent' },
      { id: 'crossing', label: 'Maintenance crossing', x: 875, y: 540, type: 'door' }
    ],
    crossing: [
      { id: 'hall', label: 'Sorting hall', x: 80, y: 565, type: 'door' },
      { id: 'service', label: 'Service diagram', x: 435, y: 250, type: 'terminal' },
      { id: 'intercom', label: 'Platform intercom', x: 485, y: 425, type: 'receiver' },
      { id: 'silt', label: 'Silt', x: 790, y: 350, type: 'agent' },
      { id: 'dispatch', label: 'Public detour to dispatch', x: 435, y: 590, type: 'door' }
    ],
    dispatch: [
      { id: 'crossing', label: 'Maintenance crossing', x: 90, y: 565, type: 'door' },
      { id: 'message', label: 'Dispatch board', x: 380, y: 280, type: 'terminal' },
      { id: 'terminal', label: 'Outgoing terminal', x: 760, y: 300, type: 'gate' }
    ]
  };
  try {
    const raw = localStorage.getItem(C.key); hadSave = Boolean(raw);
    if (raw) { saved = C.validate(JSON.parse(raw)); s = C.validate(saved); $('start').textContent = 'Resume the courier'; }
  } catch (e) { if (e.name === 'SecurityError') storageOK = false; else loadWarning = 'The previous campaign could not be read. It has not been replaced. Import a backup or confirm a new beginning.'; }
  try {
    const raw = localStorage.getItem('afterimage.prologue.v1');
    if (raw) { const candidate = S.validate(JSON.parse(raw)); if (candidate.ending) archive = candidate; }
  } catch (_) { /* Prologue is read-only. A preview can also use a deliberately chosen ending. */ }
  function toast(text) {
    $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5500);
  }
  function save() {
    if (!started) return;
    saved = s;
    try { localStorage.setItem(C.key, JSON.stringify(s)); hadSave = true; }
    catch (_) { if (storageOK) toast('Campaign saving is unavailable. Export the courier from the menu.'); storageOK = false; }
  }
  function show(scene, choices, onEscape) {
    if (!modal) focusReturn = document.activeElement;
    modal = true; target = null; keys.clear(); escapeAction = onEscape || close;
    $('speaker').textContent = scene.speaker; $('dialog-title').textContent = scene.title;
    $('dialog-body').replaceChildren(); $('choices').replaceChildren();
    for (let text of scene.paragraphs) {
      const p = document.createElement('p');
      if (text.startsWith('[')) { p.className = 'aside'; text = text.slice(1, -1); }
      p.textContent = text; $('dialog-body').append(p);
    }
    for (const choice of choices) {
      const b = document.createElement('button'); b.textContent = choice.label; b.disabled = Boolean(choice.disabled);
      if (choice.primary) b.classList.add('primary');
      if (choice.toggle) b.setAttribute('aria-pressed', String(Boolean(choice.selected)));
      if (choice.selected) b.classList.add('selected');
      if (choice.detail) { const detail = document.createElement('small'); detail.textContent = choice.detail; b.append(detail); }
      b.addEventListener('click', choice.run); $('choices').append(b);
    }
    $('modal').hidden = false; $('hud').inert = true; $('cover').inert = true; document.querySelector('header').inert = true;
    $('choices').querySelector('button:not(:disabled)')?.focus(); document.querySelector('.dialog').scrollTop = 0;
  }
  function say(speaker, title, paragraphs, choices, onEscape) { show({ speaker, title, paragraphs }, choices, onEscape); }
  function close() {
    modal = false; $('modal').hidden = true; $('hud').inert = false; $('cover').inert = false; document.querySelector('header').inert = false;
    if (focusReturn?.isConnected) focusReturn.focus(); focusReturn = null; escapeAction = null; updateHUD();
  }
  const leave = (label = 'Step away') => ({ label, run: close });
  function apply(action, value) { const changed = C.act(s, action, value); if (changed) { save(); updateHUD(); } return changed; }
  function begin(intro) {
    started = true; target = null; nearby = null; keys.clear();
    if (blocked(s.player.x, s.player.y) || (s.room === 'crossing' && !s.bridge && s.player.x > 575)) s.player = { x: 160, y: 555 };
    $('cover').hidden = true; $('hud').hidden = false; $('journal').hidden = false; updateHUD(); save();
    if (intro) show(Story.arrival(s), [leave('Enter the sorting hall')]); else if (s.delivered) receipt();
    if (loadWarning || !storageOK) toast(loadWarning || 'Browser storage is unavailable. Export this campaign before closing.');
  }
  function confirmBeginning(originEnding) {
    say('A NEW CAMPAIGN / SEPARATE SAVE', 'Carry this dispatch?', [Story.dispatches[originEnding][1], hadSave || started ? 'Starting this courier replaces the current Transit campaign. Export it first if you want to keep it.' : 'This starts a separate Transit campaign. Your prologue save stays as it is.', 'You will play Courier 022, a different agent receiving the consequences of that ending.'], [
      { label: 'Begin this courier', primary: true, run: () => { s = C.fresh(originEnding); close(); begin(true); } }, leave('Cancel')
    ]);
  }
  function chooseBeginning() {
    say('TRANSIT / CHOOSE A DISPATCH', 'Where does this work come from?', ['Continue from your completed prologue, import an ending, or choose an ending for a standalone preview. Preview choices do not alter the prologue.'], [
      ...(archive ? [{ label: 'Use my prologue ending', detail: Story.dispatches[archive.ending][0], primary: true, run: () => confirmBeginning(archive.ending) }] : []),
      ...C.origins.map(id => ({ label: 'Preview: ' + Story.dispatches[id][0], detail: Story.dispatches[id][1], run: () => confirmBeginning(id) })),
      { label: 'Import a prologue or campaign save', run: () => $('import-file').click() }, leave('Cancel')
    ]);
  }
  function exportCampaign() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `afterimage-transit-cycle-${s.cycle}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function menu() {
    if (transitioning) return;
    say('TRANSIT / PAUSED', 'Room for a different beginning.', [
      'WASD or arrows move. Click or tap the floor to walk; E or Interact opens an encounter. The Field journal lists destinations in the current room. Use marked doorways to move between rooms.',
      'All decisions are untimed. The station resets only after you choose two memories and confirm. Sound is optional.',
      storageOK ? 'This campaign uses its own browser save. Export it to move between browsers, computers, or the website.' : 'Browser storage is unavailable. Export your campaign before leaving.',
      'Returning to the prologue opens its original save. Starting or importing a courier never replaces that prologue save.'
    ], [leave(started ? 'Return to Transit' : 'Return to title'), ...(started ? [{ label: 'Open field journal', run: journal }] : []),
      { label: 'Export campaign (.json)', disabled: !started && !saved, run: exportCampaign },
      { label: 'Import a prologue or campaign save', run: () => $('import-file').click() }, { label: 'Start another courier', run: chooseBeginning },
      { label: 'Return to the prologue', run: () => { save(); location.href = 'index.html'; } }
    ]);
  }
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 30000) throw new Error('That file is too large to be a campaign save.');
      const value = JSON.parse(await file.text()); let candidate, description;
      if (value.kind === 'afterimage.transit') { candidate = C.validate(value); description = `Resume courier cycle ${candidate.cycle} in ${roomNames[candidate.room].toLowerCase()}.`; }
      else { const prologue = S.validate(value); if (!prologue.ending) throw new Error('Finish the prologue before using it as a dispatch.'); candidate = C.fresh(prologue.ending); description = Story.dispatches[prologue.ending][1]; }
      say('IMPORT / CAMPAIGN', 'Use this courier record?', [description, 'This replaces Transit progress only. Your prologue save will not be changed.'], [
        { label: 'Import and continue', primary: true, run: () => { s = candidate; close(); begin(s.cycle === 1 && !s.metBrim); } }, leave('Cancel')
      ]);
    } catch (error) { say('IMPORT FAILED', 'This record could not be read.', [error.message, 'Your current saves have not been changed.'], [leave('Return')]); }
  });
  function objective() {
    if (s.delivered) return ['The dispatch has a receipt.', 'Revisit the station or export the campaign. This is the end of the Transit slice.'];
    if (s.cycle === 1) {
      if (!s.metBrim) return ['Meet the librarian.', 'Brim waits in the sorting hall. The Field journal offers walking destinations.'];
      if (!s.sorting) return ['Choose what the shelf will hold.', 'Review the options at the sorting console.'];
      if (s.sorting === 'repairing') return ['Finish the holding shelf.', 'Align three fittings at the spare shelf. Assistance is available.'];
      if (!s.metSilt) return ['Check the far platform.', 'Use the intercom in the maintenance crossing.'];
      if (!s.acquired.includes('sequence')) return ['Read the service diagram.', 'Find it in the maintenance crossing.'];
      if (!s.acquired.includes('message')) return ['Read the missing objection.', 'The public detour leads to the dispatch board.'];
      return ['Choose what the courier carries.', 'The outgoing terminal is ready for a deliberate station reset.'];
    }
    if (!s.reunion) return ['Return to Brim.', 'The shelf remembers its contents. What do you recognize?'];
    if (!s.checkedPlatform) return ['Check on Silt.', 'The maintenance intercom still works.'];
    if (s.kept.includes('sequence') && !s.siltReturned) return [s.bridge ? 'Cross to the far platform.' : 'Reconnect the platform.', s.bridge ? 'Offer to cross back with Silt.' : 'Use your retained sequence at the service diagram.'];
    return ['Deliver an honest record.', 'Take the public detour to the outgoing terminal.'];
  }
  function updateHUD() {
    const [title, hint] = objective(); $('objective').textContent = title; $('hint').textContent = hint;
    $('cycle').textContent = `/ CYCLE 0${s.cycle}`; $('status').textContent = s.cycle === 1 ? 'COURIER 022' : 'COURIER 023'; $('location').textContent = roomNames[s.room];
    $('memories').replaceChildren();
    for (const [id, memory] of Object.entries(C.memories)) {
      const held = s.acquired.includes(id), lost = s.cycle === 2 && !held, item = document.createElement('div'); item.className = 'memory' + (held ? '' : ' absent');
      const icon = document.createElement('i'); icon.textContent = held ? memory.symbol : '·';
      const text = document.createElement('div'); text.textContent = held || lost ? memory.title : 'Unwritten';
      const detail = document.createElement('small'); detail.textContent = lost ? 'RELEASED' : held ? s.cycle === 1 ? 'FOUND / VOLATILE' : 'RETAINED' : 'AWAITING EXPERIENCE';
      text.append(detail); item.append(icon, text); $('memories').append(item);
    }
    $('memory-note').textContent = s.cycle === 1 ? 'Another task. Two places to carry it.' : 'The station kept its side of the work.';
  }
  function visible(o) { return o.id !== 'silt' || (s.room === 'hall' ? s.siltReturned : !s.siltReturned); }
  function reachable(o) { return visible(o) && !(s.room === 'crossing' && o.id === 'silt' && !s.bridge); }
  function journal() {
    if (!started || transitioning) return;
    const [title, hint] = objective(), notes = [title + ' ' + hint, 'INCOMING / ' + Story.dispatches[s.origin][0], Story.sorting(s)];
    if (s.metSilt) notes.push(s.siltReturned ? 'SILT / Back in the sorting hall with the drawing.' : 'SILT / On the far platform, with supplies. The intercom reaches them.');
    for (const [id, memory] of Object.entries(C.memories)) if (s.acquired.includes(id) || s.cycle === 2) notes.push((s.acquired.includes(id) ? 'CARRIED / ' : 'RELEASED / ') + memory.title + '. ' + (s.acquired.includes(id) ? memory.detail : memory.loss));
    notes.push('[This journal is a player reference. A released memory does not regain its abilities.]');
    show({ speaker: roomNames[s.room], title: 'Places worth returning to.', paragraphs: notes }, [...places[s.room].filter(reachable).map(o => ({ label: 'Walk to ' + o.label, run: () => { close(); walkTo(o.x, o.y); } })), leave('Close the journal')]);
  }
  function enterRoom(room) { s.room = room; s.player = room === 'hall' ? { x: 800, y: 535 } : { x: 160, y: 555 }; target = null; nearby = null; keys.clear(); save(); updateHUD(); toast(roomNames[room]); }
  function sortingPlan() {
    if (!s.metBrim) return say('SORTING CONSOLE', 'Ask the librarian first.', ['Brim can explain what is waiting for the clearing pass.'], [leave()]);
    if (s.sorting === 'repairing') return shelf();
    if (s.sorting) return say('SORTING PASS / RECORDED', 'The station kept the result.', [Story.sorting(s), 'Changing memories does not undo a completed pass.'], [leave()]);
    say('SORTING CONSOLE / ONE HOLDING BAY', 'What should the pass leave behind?', ['One bay protects one object. Repairing the spare shelf can keep both, but uses the parcel lift’s spare brace.', 'The lift carries parcels, not people. Its delay does not prevent the maintenance bridge from reaching Silt.', '[The pass advances only when you confirm. There is no timer.]'], [
      { label: 'Protect the book of greetings', detail: 'Keep the book; clear the route ledger. A public detour stays open.', run: () => confirmSort('book') },
      { label: 'Protect the route ledger', detail: 'Keep the ledger; clear Brim’s book. Brim remains in the hall.', run: () => confirmSort('ledger') },
      { label: 'Repair a shelf for both', detail: 'The parcel lift will wait for another brace.', run: () => confirmSort('repairing') }, leave('Not yet')]);
  }
  function confirmSort(plan) {
    const words = { book: 'The book stays. The route ledger will be cleared.', ledger: 'The ledger stays. Brim’s book will be cleared.', repairing: 'The spare brace goes to the holding shelf. The parcel lift must wait for a replacement; both documents can stay once you finish the repair.' };
    say('CONFIRM SORTING PLAN', 'Leave this result in the room?', [words[plan], 'This affects the station through the reset. Changing retained memories will not undo this work.'], [{ label: 'Confirm this plan', primary: true, run: () => { if (apply('sort', plan)) plan === 'repairing' ? shelf() : sortingPlan(); } }, { label: 'Reconsider', run: sortingPlan }], sortingPlan);
  }
  function shelf() {
    if (s.sorting !== 'repairing') return say('SPARE SHELF', s.sorting === 'shelf' ? 'Room for both.' : 'A shelf waiting for a brace.', [s.sorting === 'shelf' ? Story.sorting(s) : 'Choose the repair plan at the sorting console first.'], [leave()]);
    say('HOLDING SHELF / THREE FITTINGS', 'Make a place that holds.', ['Match each fitting to its etched socket: rear LONG, middle SHORT, front MEDIUM.', 'Tap a fitting to cycle its length. Changes are saved; the pass completes when you secure the shelf.'], [
      { label: 'Secure the shelf', primary: true, disabled: !C.shelfReady(s), run: () => { if (apply('secure')) shelf(); } },
      { label: 'Align the fittings for me', run: () => { apply('align'); refresh(); } }, leave('Leave the repair for now')]);
    const secure = $('choices').firstElementChild, board = document.createElement('div'); board.className = 'shelf-workbench';
    const names = ['short', 'medium', 'long'], positions = ['Rear', 'Middle', 'Front'];
    const buttons = positions.map((position, i) => { const b = document.createElement('button'); b.addEventListener('click', () => { apply('pin', i); refresh(); }); board.append(b); return b; });
    const status = document.createElement('p'); status.setAttribute('role', 'status'); status.className = 'shelf-status'; board.append(status); $('dialog-body').append(board);
    function refresh() { buttons.forEach((b, i) => { b.textContent = `${positions[i]} fitting: ${names[s.pins[i]]} → needs ${names[C.shelfPattern[i]]}`; b.classList.toggle('selected', s.pins[i] === C.shelfPattern[i]); }); secure.disabled = !C.shelfReady(s); status.textContent = C.shelfReady(s) ? 'All fittings meet their sockets. Ready to secure.' : 'Fit all three sockets. There is no penalty for adjusting them.'; }
    refresh(); buttons[0].focus();
  }
  function chooseMemories(selected = []) {
    show(Story.handoff(s), [...Object.entries(C.memories).map(([id, m]) => ({ label: m.title, detail: m.detail, toggle: true, selected: selected.includes(id), run: () => chooseMemories(selected.includes(id) ? selected.filter(k => k !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]) })),
      { label: selected.length === 2 ? 'Review the released memory' : 'Choose two memories', disabled: selected.length !== 2, primary: true, run: () => {
        const missing = Object.keys(C.memories).find(id => !selected.includes(id));
        say('CONFIRM COURIER RESET', 'This is what will not continue.', [C.memories[missing].title + ': ' + C.memories[missing].loss, 'The station keeps the sorting result. Only these two memories continue into Courier 023.'], [
          { label: 'Release Courier 022', primary: true, run: () => { const next = C.reset(s, selected); close(); target = null; nearby = null; transitioning = true; $('transition').classList.add('on'); setTimeout(() => { s = next; save(); updateHUD(); }, reduced ? 0 : 600); setTimeout(() => { $('transition').classList.remove('on'); transitioning = false; toast('Courier 023. Someone has already changed this station.'); }, reduced ? 30 : 1200); } },
          { label: 'Reconsider', run: () => chooseMemories(selected) }], () => chooseMemories(selected));
      } }, leave('Not yet')]);
  }
  function receipt() { show(Story.receipt(s), [leave('Revisit the station'), { label: 'Export this campaign', run: exportCampaign }, { label: 'Return to the prologue', run: () => { save(); location.href = 'index.html'; } }]); }
  function outgoing() {
    if (s.delivered) return receipt();
    if (s.cycle === 1) { if (!C.ready(s)) return say('OUTGOING TERMINAL', 'The station is not ready to reset.', ['Meet Brim, settle the sorting plan, speak to Silt, read the service diagram, and read the dispatch board.'], [leave()]); return chooseMemories(); }
    if (!s.reunion || !s.checkedPlatform) return say('OUTGOING TERMINAL', 'Check who is here before reporting.', ['Return to Brim and check on Silt at the maintenance crossing.'], [leave()]);
    say('OUTGOING / REVIEW BEFORE SENDING', 'What can you honestly deliver?', [Story.sorting(s), s.siltReturned ? 'Silt crossed back with the drawing.' : 'Silt remains safely on the far platform. The separation will be recorded.', s.kept.includes('message') ? 'The objection about unreachable platforms will be included.' : 'The missing objection will be acknowledged without invented wording.', '[Sending settles the sorting and crossing outcomes. You can still explore.]'], [{ label: 'Send this dispatch', primary: true, run: () => { if (apply('deliver')) receipt(); } }, leave('Check the station once more')]);
  }
  function interact(o) {
    if (!started || modal || transitioning || !o || !reachable(o)) return;
    if (o.type === 'door') return enterRoom(o.id);
    switch (o.id) {
      case 'brim': { const first = !s.metBrim; apply('brim'); show(Story.brim(s, first), [leave()]); break; }
      case 'sorter': sortingPlan(); break;
      case 'shelf': shelf(); break;
      case 'service':
        if (s.delivered) return say('SERVICE CROSSING', 'The route is settled.', [s.bridge ? 'The bridge is connected.' : 'The bridge remains disconnected. The public detour stays open.'], [leave()]);
        apply('sequence'); show(Story.sequence(s), [...(s.cycle === 2 && s.kept.includes('sequence') && !s.bridge ? [{ label: 'Reconnect the maintenance bridge', primary: true, run: () => { apply('bridge'); close(); toast('The bridge is connected. Silt is on the far platform.'); } }] : []), leave()]); break;
      case 'intercom': case 'silt':
        apply('silt'); show(Story.silt(s), [...(o.id === 'silt' && s.room === 'crossing' && s.bridge && !s.delivered ? [{ label: 'Cross back with Silt', primary: true, run: () => { if (apply('bring')) { close(); nearby = null; toast('Silt brings the drawing back to the sorting hall.'); } } }] : []), leave()]); break;
      case 'message': apply('message'); show(Story.message(s), [leave()]); break;
      case 'terminal': outgoing(); break;
    }
  }
  function obstacles() {
    if (s.room !== 'crossing') return fixtures[s.room];
    const gap = s.bridge ? [{ x: 590, y: 0, w: 80, d: 280 }, { x: 590, y: 420, w: 80, d: 260 }] : [{ x: 590, y: 0, w: 80, d: 680 }];
    return [...fixtures.crossing, ...gap];
  }
  function blocked(x, y) { return x < 30 || x > 930 || y < 30 || y > 650 || obstacles().some(b => x > b.x - 13 && x < b.x + b.w + 13 && y > b.y - 13 && y < b.y + b.d + 13); }
  function walkTo(x, y) {
    keys.clear(); const path = S.findPath(s.player, { x, y }, obstacles());
    if (!path?.length) { target = null; toast('There is no open path there. Use the intercom or a named journal destination.'); return; }
    target = { x, y, path };
  }
  function update(dt) {
    if (!started || modal || transitioning) return;
    let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    let dy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
    if (dx || dy) target = null;
    else if (target) { dx = target.path[0].x - s.player.x; dy = target.path[0].y - s.player.y; }
    const distance = Math.hypot(dx, dy), step = target ? Math.min(175 * dt, distance) : 175 * dt;
    if (distance) {
      const x = s.player.x + dx / distance * step, y = s.player.y + dy / distance * step;
      if (!blocked(x, s.player.y)) s.player.x = x;
      if (!blocked(s.player.x, y)) s.player.y = y;
      if (target && Math.hypot(s.player.x - target.path[0].x, s.player.y - target.path[0].y) < 1) { target.path.shift(); if (!target.path.length) { target = null; save(); } }
      saveClock += dt; if (saveClock > .7) { save(); saveClock = 0; }
    }
    nearby = places[s.room].filter(reachable).map(o => ({ o, distance: Math.hypot(o.x - s.player.x, o.y - s.player.y) })).filter(o => o.distance < 65).sort((a, b) => a.distance - b.distance)[0]?.o || null;
    $('interaction').hidden = !nearby; $('interact-label').textContent = nearby?.label || '';
  }
  function project(x, y, z = 0) { return { x: origin.x + (x - y) * scale, y: origin.y + ((x + y) * .48 - z) * scale }; }
  function polygon(points, fill, stroke) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = scale; ctx.stroke(); } }
  function line(points, color, thickness = 1) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.lineWidth = thickness * scale; ctx.stroke(); }
  function box(x, y, w, d, h, color = '#c7c6b2') {
    polygon([project(x, y), project(x + w, y), project(x + w, y, h), project(x, y, h)], '#9b9e8c');
    polygon([project(x + w, y), project(x + w, y + d), project(x + w, y + d, h), project(x + w, y, h)], '#b0b4a0');
    polygon([project(x, y, h), project(x + w, y, h), project(x + w, y + d, h), project(x, y + d, h)], color, '#79846b60');
  }
  function label(text, x, y, z = 0, color = '#6e755f', size = 10) { const p = project(x, y, z); ctx.fillStyle = color; ctx.font = `${Math.max(8, size * scale)}px monospace`; ctx.textAlign = 'center'; ctx.fillText(text, p.x, p.y); }
  function ring(x, y, color) { polygon([project(x - 22, y), project(x, y - 22), project(x + 22, y), project(x, y + 22)], '#00000000', color); }
  function agent(x, y, tint) {
    const float = reduced ? 0 : Math.sin(time * 1.6 + x) * 3;
    polygon([project(x - 17, y), project(x, y - 11), project(x + 17, y), project(x, y + 11)], '#586b4725');
    const p = project(x, y, 40 + float);
    for (let i = 0; i < 5; i++) { const a = i * 1.25 + .5; line([{ x: p.x + Math.cos(a) * 18 * scale, y: p.y + Math.sin(a) * 14 * scale }, { x: p.x - Math.sin(a) * 12 * scale, y: p.y + Math.cos(a) * 24 * scale }], tint, 3); }
    ctx.fillStyle = tint; ctx.beginPath(); ctx.ellipse(p.x, p.y, 14 * scale, 19 * scale, .2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2efd9'; ctx.fillRect(p.x + scale, p.y - 6 * scale, 3 * scale, 3 * scale); ctx.fillRect(p.x + 7 * scale, p.y - 4 * scale, 3 * scale, 3 * scale);
  }
  function drawObject(o) {
    if (!visible(o)) return;
    if (o.id === nearby?.id && !modal) ring(o.x, o.y, '#a06636');
    if (o.type === 'agent') agent(o.x, o.y, o.id === 'brim' ? '#6f7d5c' : '#6c8390');
    else if (o.type === 'door') { box(o.x - 24, o.y - 15, 48, 30, 5, '#c6bb98'); label('↗', o.x, o.y, 20, '#8a6b3e', 25); }
    else if (o.type === 'shelf') {
      box(o.x - 40, o.y - 20, 80, 40, 35, s.sorting === 'shelf' ? '#e0d5aa' : '#b9b5a4');
      if (s.sorting === 'shelf') { box(o.x - 20, o.y - 10, 20, 18, 43, '#a97b68'); box(o.x + 8, o.y - 10, 20, 18, 43, '#879a87'); }
      if (s.sorting === 'repairing') label('BRACE RESERVED', o.x, o.y, 68, '#9b673a');
    } else { box(o.x - 20, o.y - 15, 40, 30, 28, '#b5b99d'); box(o.x - 19, o.y - 15, 38, 9, o.type === 'gate' ? 75 : 58, '#57664e'); label(o.id === 'terminal' ? 'OUT' : o.id === 'intercom' ? '· ·' : '—', o.x, o.y - 5, 50, '#e5d8a5', 12); }
    if (width >= 600 || o.id === nearby?.id) label(o.label.toUpperCase(), o.x, o.y, o.type === 'door' ? 38 : 85, '#74755f', 9);
  }
  function render() {
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#e9e7de'; ctx.fillRect(0, 0, width, height);
    polygon([project(-8, -8), project(968, -8), project(968, 688), project(-8, 688)], '#c5c9b8');
    polygon([project(0, 0), project(960, 0), project(960, 680), project(0, 680)], s.room === 'crossing' ? '#daddd0' : '#e3e3d3', '#b2b99e');
    for (let x = 0; x <= 960; x += 80) line([project(x, 0), project(x, 680)], '#85906c25');
    for (let y = 0; y <= 680; y += 80) line([project(0, y), project(960, y)], '#85906c25');
    if (width >= 600) label(roomNames[s.room], 450, 65, 0, '#899474', 16);
    if (s.room === 'crossing') {
      polygon([project(580, 0), project(682, 0), project(682, 680), project(580, 680)], '#747e7460');
      if (s.bridge) { polygon([project(575, 300), project(687, 300), project(687, 410), project(575, 410)], '#cfbf93', '#8a876b'); for (let x = 580; x < 680; x += 20) line([project(x, 300), project(x, 410)], '#9d9575'); }
      else label('CROSSING OFFLINE', 635, 355, 0, '#e6e5cf', 10);
      line([project(80, 600), project(510, 600)], '#bfa775', 4); label('PUBLIC DETOUR →', 315, 625, 0, '#927448', 10);
      if (!s.siltReturned) box(820, 390, 28, 22, 10, '#ddd8b8');
    }
    if (s.room === 'hall') {
      line([project(600, 255), project(300, 255)], '#b59c69', 4); box(365, 280, 65, 40, 20, '#cfc7a9');
      if (s.sorting !== 'ledger') box(380, 290, 20, 16, 30, '#aa7661'); else label('EMPTY COVER', 395, 300, 34, '#a38776', 9);
      box(800, 170, 64, 64, 25, '#b7b9a0'); if (width >= 600) label(s.sorting === 'shelf' ? 'LIFT / WAITING FOR BRACE' : 'PARCEL LIFT', 820, 195, 65, '#847351', 9);
    }
    if (s.room === 'dispatch') for (let y = 340; y < 430; y += 22) line([project(730, y), project(880, y)], s.delivered ? '#788d67' : '#b29a67', 3);
    if (target) { ctx.setLineDash([3, 5]); line([project(s.player.x, s.player.y), ...target.path.map(p => project(p.x, p.y))], '#91723e90'); ctx.setLineDash([]); ring(target.x, target.y, '#967a46'); }
    const drawables = fixtures[s.room].map(f => ({ depth: f.x + f.y + f.w / 2, draw: () => { box(f.x, f.y, f.w, f.d, f.h); for (let x = f.x + 10; x < f.x + f.w - 5; x += 17) line([project(x, f.y, 14), project(x, f.y, f.h - 4)], '#728262', 2); } }));
    for (const o of places[s.room]) drawables.push({ depth: o.x + o.y, draw: () => drawObject(o) });
    drawables.push({ depth: s.player.x + s.player.y, draw: () => agent(s.player.x, s.player.y, '#655d4d') });
    drawables.sort((a, b) => a.depth - b.depth).forEach(d => d.draw());
  }
  function resize() {
    width = innerWidth; height = innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.max(.15, Math.min((width - (width < 600 ? 16 : 30)) / 1670, (height - (width < 600 ? 270 : 190)) / 790));
    origin = { x: width / 2 - 145 * scale, y: height / 2 + (width < 600 ? 65 : 50) - 395 * scale };
  }
  function setSound() {
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); soundOn = !soundOn;
      if (soundOn) { audio.resume().catch(() => {}); for (const frequency of [146.83, 220, 293.66]) { const osc = audio.createOscillator(), gain = audio.createGain(); osc.frequency.value = frequency; gain.gain.value = .007; osc.connect(gain).connect(audio.destination); osc.start(); audioNodes.push(osc); } }
      else { audioNodes.forEach(n => n.stop()); audioNodes = []; }
      $('sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`; $('sound').setAttribute('aria-pressed', String(soundOn));
    } catch (_) { soundOn = false; toast('Audio is unavailable. Every clue is also written.'); }
  }
  $('start').addEventListener('click', () => { if (saved) { s = C.validate(saved); begin(false); } else chooseBeginning(); });
  $('help').addEventListener('click', menu); $('home').addEventListener('click', e => { e.preventDefault(); menu(); }); $('journal').addEventListener('click', journal); $('sound').addEventListener('click', setSound);
  $('interact').addEventListener('click', () => interact(nearby)); $('choose-origin').addEventListener('click', chooseBeginning);
  window.addEventListener('keydown', e => {
    if (e.key === 'Tab' && modal) { const buttons = [...$('modal').querySelectorAll('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); if (!transitioning) modal ? escapeAction?.() : menu(); return; }
    if (!started || modal || transitioning) return;
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) e.preventDefault();
    if (key === 'e' && !e.repeat) interact(nearby); else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { keys.add(key); target = null; }
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); target = null; save(); });
  document.addEventListener('visibilitychange', () => { keys.clear(); target = null; if (document.hidden) { save(); audio?.suspend(); } else if (soundOn) audio?.resume().catch(() => {}); });
  window.addEventListener('pagehide', save);
  canvas.addEventListener('pointerdown', e => { if (!started || modal || transitioning) return; const a = (e.clientX - origin.x) / scale, b = (e.clientY - origin.y) / scale / .48; walkTo(Math.max(30, Math.min(930, (a + b) / 2)), Math.max(30, Math.min(650, (b - a) / 2))); });
  window.addEventListener('resize', resize); resize(); updateHUD();
  function frame(timestamp) { const dt = Math.min((timestamp - (last || timestamp)) / 1000, .04); last = timestamp; if (!document.hidden) { if (!modal && !transitioning && !reduced) time += dt; update(dt); render(); } requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
