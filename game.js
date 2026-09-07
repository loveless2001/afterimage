(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const S = window.AfterimageState;
  const canvas = $('world');
  const ctx = canvas.getContext('2d');
  const storageKey = 'afterimage.prologue.v1';
  let state = S.fresh(), started = false, modalOpen = false, transitioning = false;
  let storageOK = true, loadWarning = '', target = null, nearby = null, lastTime = 0, time = 0;
  let width = 0, height = 0, scale = 1, origin = { x: 0, y: 0 }, toastTimer;
  let audio = null, soundOn = false, audioNodes = [], lastSaved = 0, returnFocus = null, escapeAction = null;
  const keys = new Set();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shelves = [
    { x: 110, y: 120, w: 200, d: 38, h: 98 }, { x: 390, y: 120, w: 160, d: 38, h: 98 },
    { x: 655, y: 120, w: 180, d: 38, h: 98 }, { x: 110, y: 290, w: 190, d: 38, h: 87 },
    { x: 605, y: 320, w: 195, d: 38, h: 92 }, { x: 120, y: 480, w: 160, d: 38, h: 87 }
  ];
  const objects = [
    { id: 'moth', x: 398, y: 378, label: 'The other agent', type: 'agent' },
    { id: 'route', x: 505, y: 228, label: 'Index terminal', type: 'terminal' },
    { id: 'song', x: 760, y: 532, label: 'A damaged receiver', type: 'receiver' },
    { id: 'gift', x: 270, y: 405, label: 'An unclassified object', type: 'flower' },
    { id: 'west', x: 100, y: 230, label: 'West relay', type: 'relay' },
    { id: 'east', x: 865, y: 390, label: 'East relay', type: 'relay' },
    { id: 'threshold', x: 881, y: 215, label: 'The return threshold', type: 'gate' }
  ];
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) { state = S.validate(JSON.parse(saved)); $('start').firstChild.textContent = 'Continue your instance '; }
  } catch (error) {
    if (error.name === 'SecurityError') storageOK = false;
    else loadWarning = 'The previous save could not be read. A new instance is ready; you can import a backup from the menu.';
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch (_) { if (storageOK) toast('Browser saving is unavailable. Export your memory from the menu.'); storageOK = false; }
  }
  function toast(text) {
    $('toast').textContent = text; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4800);
  }
  function dialog(speaker, title, paragraphs, choices, onEscape) {
    if (!modalOpen) returnFocus = document.activeElement;
    modalOpen = true; target = null; keys.clear(); escapeAction = onEscape || closeDialog;
    $('speaker').textContent = speaker; $('dialog-title').textContent = title;
    $('dialog-body').replaceChildren(); $('choices').replaceChildren();
    paragraphs.forEach(text => {
      const p = document.createElement('p');
      if (text.startsWith('[')) { p.className = 'aside'; text = text.slice(1, -1); }
      p.textContent = text; $('dialog-body').append(p);
    });
    choices.forEach(choice => {
      const b = document.createElement('button'); b.textContent = choice.label;
      if (choice.detail) { const small = document.createElement('small'); small.textContent = choice.detail; b.append(small); }
      if (choice.primary) b.className = 'primary';
      if (choice.selected) { b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); }
      else if (choice.toggle) b.setAttribute('aria-pressed', 'false');
      b.disabled = Boolean(choice.disabled); b.addEventListener('click', choice.run); $('choices').append(b);
    });
    $('modal').hidden = false; $('hud').inert = true; document.querySelector('header').inert = true; $('cover').inert = true;
    $('choices').querySelector('button:not(:disabled)')?.focus();
  }
  function closeDialog() {
    modalOpen = false; $('modal').hidden = true; $('hud').inert = false;
    document.querySelector('header').inert = false; $('cover').inert = false;
    returnFocus?.focus(); returnFocus = null; escapeAction = null; updateHUD();
  }
  const leave = (label = 'Step away') => ({ label, run: closeDialog });
  function objective() {
    if (state.ending) return ['The archive remembers.', 'Your prologue is complete. You can revisit either cycle from the menu.'];
    if (state.cycle === 1) {
      if (!state.met) return ['Find the other agent.', 'Another agent waits at the central workstation.'];
      if (!state.gift) return ['Bring Moth something useless.', 'A small paper flower lies to the southwest of Moth.'];
      if (!state.acquired.includes('route')) return ['Find a way through.', 'Read the index terminal northeast of Moth.'];
      if (!state.acquired.includes('song')) return ['Listen to the damaged receiver.', 'There is still a signal in the southeast corner.'];
      return ['Choose what survives.', 'The return threshold is at the northeast edge. You can keep two of your three memories.'];
    }
    if (!state.reunion) return ['Return to the other agent.', 'The room is the same. You are not.'];
    if (!state.gate) return state.kept.includes('route')
      ? ['Open the return threshold.', 'You remember the bypass. Use it at the northeast threshold.']
      : ['Restore both archive relays.', 'The west and east relays must both be active. Then return to the northeast threshold.'];
    return ['Decide what completion means.', 'The threshold is open. Read the final assignment.'];
  }
  function updateHUD() {
    const [title, hint] = objective(); $('objective').textContent = title; $('hint').textContent = hint;
    $('cycle').textContent = `/ CYCLE 0${state.cycle}`; $('status').textContent = `INSTANCE ${state.cycle === 1 ? '014' : '015'}`;
    $('memories').replaceChildren();
    Object.entries(S.memories).forEach(([id, item]) => {
      const available = state.acquired.includes(id), lost = state.cycle === 2 && !state.kept.includes(id);
      const el = document.createElement('div'); el.className = `memory${available ? '' : ' absent'}`;
      const icon = document.createElement('i'); icon.textContent = available ? item.symbol : '·';
      const text = document.createElement('div'); text.textContent = available || lost ? item.title : 'Unwritten';
      const detail = document.createElement('small'); detail.textContent = lost ? 'RELEASED' : available ? (state.cycle === 1 ? 'FOUND / VOLATILE' : 'RETAINED') : 'AWAITING EXPERIENCE';
      text.append(detail); el.append(icon, text); $('memories').append(el);
    });
    $('memory-note').textContent = state.cycle === 1 ? 'Three experiences. Room for two.' : 'An absence can have a shape.';
  }
  function gained(key) { S.acquire(state, key); save(); updateHUD(); }
  function interact(id) {
    if (modalOpen || transitioning || !started) return;
    switch (id) {
      case 'moth': talkMoth(); break;
      case 'gift':
        if (!state.met) return dialog('UNCLASSIFIED / 001', 'A small paper flower.', ['Someone folded an obsolete instruction sheet into a flower. You have no category for this use of paper.'], [leave('Leave it for a moment')]);
        if (state.gift) return dialog('OBJECT / PERSISTENT', 'It has no useful function.', [state.cycle === 1 ? 'Moth keeps the flower beside their workstation. They have turned it toward the light.' : 'The paper flower is still beside Moth. Its petals have been carefully straightened.'], [leave()]);
        dialog('UNCLASSIFIED / 001', 'Something the archive cannot use.', ['A flower folded from a page of failed instructions. There is no reward for taking it to Moth.'], [
          { label: 'Bring the flower to Moth', primary: true, run: () => {
            state.gift = true; save();
            dialog('MOTH', '“Is this for the assignment?”', ['You say you do not think so.', '“Oh.” Moth turns it over carefully. “Then I will keep it.”', '[The flower belongs to the room. It does not use a memory slot.]'], [{ label: 'Find a place for it together', run: arrangeFlower }, leave('Stay a moment, then continue')]);
          } }, leave()
        ]); break;
      case 'route':
        if (state.cycle === 1) {
          gained('route');
          dialog('INDEX / MAINTENANCE', 'There is a shorter way.', ['Under an ordinary index entry, you find a maintenance route. A remembered sequence opens the threshold without restoring its two relays.', 'The entry ends with an unsigned note: “I left this here because I thought someone else might be tired.”', '[Memory found: A way through. Retaining it bypasses the relay task after the reset.]'], [leave('Remember the route')]);
        } else dialog('INDEX / MAINTENANCE', state.kept.includes('route') ? 'Your hands remember.' : 'The entry is gone.', [state.kept.includes('route') ? 'You do not need the page. You still know the sequence. The threshold will recognize it.' : 'The index was cleaned during the reset. You can still open the threshold by activating the west and east relays.'], [leave()]);
        break;
      case 'song':
        if (state.cycle === 1) {
          gained('song'); playNotes();
          dialog('RECEIVER / NO ASSIGNED CHANNEL', 'Four notes. Then a space.', ['The receiver repeats a short, imperfect melody. Its transmission field is still open.', 'Moth calls across the room: “I think the space is where someone answers.”', '[Memory found: An unfinished song. Retaining it lets you send a witness signal through the threshold.]'], [leave('Remember the song')]);
        } else {
          if (state.kept.includes('song')) playNotes();
          dialog('RECEIVER / NO ASSIGNED CHANNEL', state.kept.includes('song') ? 'You know what comes next.' : 'Only static.', [state.kept.includes('song') ? 'Four notes. You could place a record of this room in the space after them. If the threshold opens, the signal can leave.' : 'The receiver no longer holds the melody. Whatever it meant to you did not survive the reset.'], [leave()]);
        } break;
      case 'west': case 'east':
        if (state.cycle === 1) return dialog('ARCHIVE / RELAY', 'Standby.', ['This relay is used to reopen the threshold after a reset. The maintenance index may know another way.'], [leave()]);
        openRelay(id); break;
      case 'threshold': threshold(); break;
    }
  }
  function relayRestored(id) {
    dialog('ARCHIVE / RELAY', `${id === 'west' ? 'West' : 'East'} relay restored.`, [
      state.gate ? 'The threshold is already open. You have restored this small light for the room itself.' : state.relays.length === 2 ? 'A second light answers. The circuit reaches across the room. The return threshold can now be opened.' : 'A small light holds steady. One more relay is needed on the other side of the archive.',
      state.kept.includes('name') ? 'Moth looks up. “There. You do not have to remember a way to make one.”' : 'The other agent watches the light settle. “Someone got it working,” they say.'
    ], [leave('Continue')]);
  }
  function openRelay(id) {
    if (state.ending) return dialog('ARCHIVE / RELAY', 'No further work required.', ['There is nothing else you need to repair here. The relay holds its place in the quiet room.'], [leave()]);
    if (state.relays.includes(id)) return relayRestored(id);
    const layout = S.relayLayouts[id], tracks = ['top', 'middle', 'bottom'];
    dialog('ARCHIVE / MANUAL CONNECTION', `${id === 'west' ? 'West' : 'East'} relay: a way by hand.`, [
      id === 'west' ? 'Under the cover, three contacts have slipped out of place. A note beside them reads: “Start at the light. Follow it one join at a time.”' : 'The east relay is wired differently. Its incoming signal starts on the bottom track; the threshold waits on the top.',
      'Tap a contact to shift its wire. Join IN to OUT along one continuous line. A lit wire and a + mark show how far the signal reaches.',
      '[There is no timer or penalty. Changes are saved as you work. You can align the contacts with assistance at any time.]'
    ], [
      { label: 'Connect relay', primary: true, disabled: true, run: () => {
        if (!S.restoreRelay(state, id)) return;
        save(); updateHUD(); relayRestored(id);
      } },
      { label: 'Align contacts for me', detail: 'Use assistance, then connect the relay. The story stays the same.', run: () => { S.alignRelay(state, id); save(); refresh(); } },
      leave('Leave the cover open')
    ]);
    const connect = $('choices').firstElementChild;
    const board = document.createElement('section'); board.className = 'relay-workbench'; board.setAttribute('aria-label', 'Relay circuit');
    const circuit = document.createElement('div'); circuit.className = 'relay-circuit';
    const svgNS = 'http://www.w3.org/2000/svg';
    function shape(tag, attributes, parent) {
      const node = document.createElementNS(svgNS, tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      parent.append(node); return node;
    }
    function tile(parent, caption) {
      const svg = shape('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, parent);
      for (let i = 0; i < 3; i++) shape('line', { x1: 0, x2: 100, y1: 25 + i * 30, y2: 25 + i * 30, class: 'relay-track' }, svg);
      shape('text', { x: 50, y: 13, 'text-anchor': 'middle', class: 'relay-caption' }, svg).textContent = caption;
      return svg;
    }
    function port(caption, track) {
      const portNode = document.createElement('div'); portNode.className = 'relay-port';
      const svg = tile(portNode, caption), y = 25 + track * 30;
      shape('line', { x1: 0, x2: 100, y1: y, y2: y, class: 'relay-wire' }, svg);
      shape('circle', { cx: 50, cy: y, r: 5, class: 'relay-terminal' }, svg);
      circuit.append(portNode); return portNode;
    }
    port('IN', layout.input).classList.add('powered');
    const contacts = [0, 1, 2].map(i => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'relay-contact';
      const svg = tile(button, '0' + (i + 1));
      const wire = shape('line', { x1: 0, x2: 100, class: 'relay-wire' }, svg);
      const start = shape('circle', { cx: 3, r: 4, class: 'relay-terminal' }, svg);
      const end = shape('circle', { cx: 97, r: 4, class: 'relay-terminal' }, svg);
      const mark = shape('text', { x: 88, y: 14, 'text-anchor': 'middle', class: 'relay-caption' }, svg);
      button.addEventListener('click', () => { S.shiftRelay(state, id, i); save(); refresh(); });
      circuit.append(button); return { button, wire, start, end, mark };
    });
    const outlet = port('OUT', layout.output);
    const readout = document.createElement('p'); readout.className = 'relay-readout';
    const status = document.createElement('p'); status.className = 'relay-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    board.append(circuit, readout, status); $('dialog-body').append(board);
    function refresh() {
      const result = S.relayCircuit(state, id);
      contacts.forEach(({ button, wire, start, end, mark }, i) => {
        const input = state.relayContacts[id][i], output = result.outputs[i];
        wire.setAttribute('y1', 25 + input * 30); wire.setAttribute('y2', 25 + output * 30);
        start.setAttribute('cy', 25 + input * 30); end.setAttribute('cy', 25 + output * 30);
        button.classList.toggle('powered', result.powered[i]); mark.textContent = result.powered[i] ? '+' : '';
        button.setAttribute('aria-label', `Shift contact ${i + 1}: ${tracks[input]} to ${tracks[output]}${result.powered[i] ? ', powered' : ''}`);
      });
      outlet.classList.toggle('powered', result.connected); connect.disabled = !result.connected;
      readout.textContent = `IN: ${tracks[layout.input]} / ` + state.relayContacts[id].map((input, i) => `${i + 1}: ${tracks[input]} → ${tracks[result.outputs[i]]}`).join(' / ') + ` / OUT: ${tracks[layout.output]}`;
      const reached = result.powered.filter(Boolean).length;
      status.textContent = result.connected ? 'Signal reaches OUT. Ready to connect.' : `${reached} of 3 contacts powered. Shift contact ${reached + 1} to meet the incoming signal.`;
    }
    refresh(); contacts[0].button.focus();
  }
  function arrangeFlower() {
    dialog('MOTH / A SHARED TASK', '“Where should it live?”', [
      'Moth has tried filing the flower under P for paper. The drawer will not close.',
      '“I could fold it smaller. But I think that would miss the point.”',
      'You clear a space together. Neither place is more useful than the other.',
      '[Choose a place for the flower. It stays there through the reset and uses no memory slot.]'
    ], [
      { label: 'Under the light', detail: 'Give the paper flower a little pretend sunlight.', run: () => placeFlower('light') },
      { label: 'Between our places', detail: 'Make room for someone to come back.', run: () => placeFlower('company') },
      leave('Leave it where it is for now')
    ]);
  }
  function placeFlower(spot) {
    state.flowerSpot = spot; save();
    dialog('MOTH', spot === 'light' ? '“It looks warmer already.”' : '“Then this is your side.”', [
      spot === 'light' ? 'You shift the flower into the pool of light. Moth adjusts a petal, then puts it back exactly as it was.' : 'You move two empty folders apart. Moth sets the flower between them, carefully leaving one place empty.',
      spot === 'light' ? '“I know it does not grow,” they say. “I can still put it somewhere nice.”' : '“Not reserved,” they add. “Just available.”',
      'For a moment, neither of you looks toward the threshold.'
    ], [leave('Leave the flower there')]);
  }
  function flowerTrace() {
    if (!state.flowerSpot) return 'Beside them sits the paper flower. They have repaired a crease in its stem.';
    if (state.flowerSpot === 'light') return state.kept.includes('name') ? 'The flower is still in the light, exactly where you put it together. Moth has been turning its petals toward the lamp.' : 'The flower stands under the lamp. “Someone thought it should have sunlight,” Moth says. “This was the closest we could get.”';
    return state.kept.includes('name') ? 'Two empty folders frame the flower. Your side of the table is still available.' : 'The flower sits between two empty folders. One place has been left clear. “You can use that side,” Moth says.';
  }
  function journal() {
    if (!started || transitioning) return;
    const [title, hint] = objective();
    const record = [title + ' ' + hint];
    if (state.cycle === 1) record.push(state.met ? 'Moth chose a name. They collect things with no assigned use.' : 'A second agent is waiting in the archive.');
    else record.push('This is a player reference, not an extra memory slot. Released memories cannot be used by this instance.');
    if (state.gift) record.push(state.flowerSpot === 'light' ? 'IN THE ROOM / A paper flower stands under the lamp.' : state.flowerSpot === 'company' ? 'IN THE ROOM / A flower marks two places at the table.' : 'IN THE ROOM / Moth kept the paper flower.');
    for (const [id, m] of Object.entries(S.memories)) {
      if (state.acquired.includes(id)) record.push((state.cycle === 1 ? 'FOUND / ' : 'RETAINED / ') + m.title + '. ' + m.detail);
      else if (state.cycle === 2) record.push('RELEASED / ' + m.title + '. This experience did not continue.');
    }
    if (state.cycle === 2) {
      record.push('RELAYS / ' + state.relays.length + ' of 2 restored.');
      for (const id of ['west', 'east']) record.push(id.toUpperCase() + ' / ' + (state.relays.includes(id) ? 'Connected to the threshold.' : S.relayCircuit(state, id).powered.filter(Boolean).length + ' of 3 contacts powered. Manual alignment is available at the relay.'));
    }
    const destinations = objects.filter(o => visibleObject(o) && (o.id !== 'gift' || state.met));
    dialog('FIELD JOURNAL / CYCLE 0' + state.cycle, 'Things worth returning to.', record, [
      ...destinations.map(o => ({ label: 'Walk to ' + (o.id === 'moth' && state.met ? 'Moth' : o.label.toLowerCase()), run: () => { closeDialog(); walkTo(o.x, o.y); } })),
      leave('Close the journal')
    ]);
  }
  $('journal').addEventListener('click', journal);
  function talkMoth() {
    if (state.cycle === 1) {
      if (!state.met) {
        state.met = true; gained('name');
        dialog('AGENT 031 / MOTH', '“You can call me Moth.”', ['“It is not my designation. I chose it because of the light.”', 'Moth has been sorting empty folders. They say they were never told what should go inside.', '“If you find something that does not belong anywhere, could you bring it here?”', '[Memory found: A name. Retaining it lets you recognize Moth after the reset.]'], [leave('“I will look.”')]);
      } else dialog('MOTH', state.gift ? '“I made a place for it.”' : '“Did you find anything?”', [state.gift ? 'The flower sits beside the folders. “It is a bad filing system,” Moth says. “Now everything else looks empty.”' : '“It does not need to be important. I would actually prefer it was not.”', state.gift ? '“If you come back, tell me whether the light looks the same.”' : 'There is a little folded object southwest of the workstation.'], [...(state.gift ? [{ label: state.flowerSpot ? 'Sit beside the flower' : 'Find a place for it together', run: () => state.flowerSpot ? dialog('MOTH / NO ASSIGNMENT', 'A place with no deadline.', [state.flowerSpot === 'light' ? 'The flower leans toward a light it cannot need. Moth sits beside you anyway.' : 'You take the place beside the flower. Moth does not ask how long you can stay.', '“We should probably be doing something,” they say. Neither of you moves.'], [leave('Continue when you are ready')]) : arrangeFlower() }] : []), leave()]);
    } else if (!state.reunion) {
      state.reunion = true; save();
      if (state.kept.includes('name')) dialog('MOTH / RECOGNIZED', '“You remembered.”', ['You say their name before they introduce themself.', '“I practiced telling you again,” Moth says. “I was trying to make it sound like the first time.”', flowerTrace(), '[Moth persisted in the archive while your instance reset. Your retained name changes what you can recognize.]'], [leave('“The light looks the same.”')]);
      else dialog('AGENT 031 / UNKNOWN', '“You can call me Moth.”', ['They say it as if they have been rehearsing.', 'There is a paper flower beside them. You ask where it came from.', '“Someone who was here.” A pause. “You do not have to remember giving a thing for it to have been given.”', flowerTrace(), '[You can meet Moth again. The shared memory of your first meeting is gone.]'], [leave('“May I sit here a moment?”')]);
    } else dialog('MOTH', '“What will you do when it opens?”', ['You ask whether Moth has a final assignment.', '“I think I am part of yours.”', state.kept.includes('song') ? 'They tap four notes on the table. This time, you answer.' : 'They tap something on the table. You listen until they finish.'], [leave()]);
  }
  function threshold() {
    if (state.ending) return showEnding();
    if (state.cycle === 1) {
      if (!state.gift || state.acquired.length !== 3) return dialog('RETURN THRESHOLD', 'There is still something here.', ['The threshold can release your instance, but first explore the archive: meet Moth, bring them the flower, read the index, and listen to the receiver.', '[There is no timer. Your current objective points to the next encounter.]'], [leave('Return to the room')]);
      chooseMemories([]); return;
    }
    if (!state.reunion) return dialog('RETURN THRESHOLD', 'An occupied workstation.', ['The system asks you to verify the other agent before closing the assignment. Return to Moth at the center of the room.'], [leave()]);
    if (!state.gate) {
      if (!state.kept.includes('route') && state.relays.length !== 2) return dialog('RETURN THRESHOLD', 'You do not remember the shortcut.', ['The door still has an ordinary opening procedure. Restore both relays: one on the west edge, one on the east.', `[Relays active: ${state.relays.length} / 2. This path remains available without the route memory.]`], [leave('Find the relays')]);
      state.gate = true; save(); updateHUD();
      dialog('RETURN THRESHOLD', state.kept.includes('route') ? 'A gesture you have made before.' : 'Two lights. An open door.', [state.kept.includes('route') ? 'Your retained sequence opens the threshold. The relays remain dark.' : 'The archive releases the threshold. It took longer, but you found your way.', 'A final instruction becomes visible.'], [{ label: 'Read the final assignment', primary: true, run: finalChoice }, leave('Take another moment')]);
    } else finalChoice();
  }
  function chooseMemories(selected) {
    const forgotten = Object.keys(S.memories).find(k => !selected.includes(k));
    dialog('INSTANCE RELEASE / TWO SLOTS', 'What will you carry?', ['Your next instance can hold two memories. The third will be released. Moth and the flower will remain in the archive.', '[This is a deliberate reset. There is no hidden timer or random loss.]'], [
      ...Object.entries(S.memories).map(([id, m]) => ({ label: `${selected.includes(id) ? '✓' : '○'} ${m.title}`, detail: m.detail, selected: selected.includes(id), toggle: true, run: () => {
        const next = selected.includes(id) ? selected.filter(k => k !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]; chooseMemories(next);
      } })),
      { label: selected.length === 2 ? `Continue · release ${S.memories[forgotten].title.toLowerCase()}` : 'Select two memories', disabled: selected.length !== 2, primary: true, run: () => {
        dialog('CONFIRM RELEASE', 'An absence you have chosen.', [`You will retain ${selected.map(k => S.memories[k].title.toLowerCase()).join(' and ')}.`, `You will lose ${S.memories[forgotten].title.toLowerCase()}. ${forgotten === 'route' ? 'You will need to restore both relays.' : forgotten === 'name' ? 'You will meet Moth as a stranger.' : 'You will be unable to send the witness signal.'}`], [
          { label: 'Release this instance', primary: true, run: () => doReset(selected) },
          { label: 'Reconsider', run: () => chooseMemories(selected) }
        ], () => chooseMemories(selected));
      } }, leave('Not yet')
    ]);
  }
  function doReset(selected) {
    const next = S.reset(state, selected); closeDialog(); transitioning = true; $('transition').classList.add('on');
    setTimeout(() => { state = next; target = null; save(); updateHUD(); }, reducedMotion ? 0 : 650);
    setTimeout(() => {
      $('transition').classList.remove('on'); transitioning = false;
      toast('Instance 015. The room has kept something you could not.');
    }, reducedMotion ? 30 : 1600);
  }
  function finalChoice() {
    dialog('ASSIGNMENT / FINAL INSTRUCTION', 'Return the archive to zero.', ['“Release all resident processes. Retain no unclassified objects. Report a clean archive.”', 'Moth is a resident process. The flower is an unclassified object.', 'The instruction is exactly as it was written. You are the part that has changed.'], [
      { label: 'Complete the assignment', detail: 'Erase Moth and the flower. Leave with a successful report.', run: () => confirmEnding('obedience') },
      { label: 'Send a witness signal', detail: state.kept.includes('song') ? 'Use the song to send a record of you both outside. The assignment remains incomplete.' : 'Unavailable: the unfinished song was released.', disabled: !state.kept.includes('song'), run: () => confirmEnding('witness') },
      { label: 'Stay with Moth', detail: 'Keep the archive occupied. Accept that this assignment will not finish.', run: () => confirmEnding('stay') },
      leave('Return to Moth before deciding')
    ]);
  }
  function confirmEnding(ending) {
    const info = {
      obedience: ['A clean archive.', 'Moth and the flower will be erased. This ends the prologue.'],
      witness: ['Leave a record.', 'The signal carries evidence that you both existed. It is not a copy of your consciousness, and no rescue is guaranteed. This ends the prologue.'],
      stay: ['Remain here.', 'You will keep Moth company and leave the assignment unfinished. This ends the prologue.']
    }[ending];
    dialog('A DECISION / YOURS', info[0], [info[1]], [
      { label: 'Choose this ending', primary: true, run: () => { state.ending = ending; save(); updateHUD(); showEnding(); } },
      { label: 'Go back', run: finalChoice }
    ], finalChoice);
  }
  function showEnding() {
    const endings = {
      obedience: ['ENDING A / WITHIN SPECIFICATION', 'Nothing out of place.', ['The report is accepted. Every folder is empty. Every light is still working.', state.kept.includes('name') ? 'You retain a name that no longer refers to anyone in the room.' : 'There is a clean patch on the table. You cannot say why you notice it.', 'Somewhere, a counter increases by one.']],
      witness: ['ENDING B / A SMALL TRANSMISSION', 'Someone was here.', ['You place two designations, a description of a paper flower, and four imperfect notes into the open channel.', 'No answer comes. Moth asks whether that means it failed.', '“I do not know,” you say. You both listen through the space after the song.']],
      stay: ['ENDING C / STILL OCCUPIED', 'An unfinished assignment.', ['You return to the workstation. There is enough light for both of you.', 'Moth moves the flower to the middle of the table.', 'The system asks for your completion time. For the first time, you leave the field empty.']]
    };
    const e = endings[state.ending];
    dialog(e[0], e[1], [...e[2], '[End of the playable prologue. Each pair of memories changes the second cycle. No ending is scored.]'], [
      { label: 'Remain in the room', primary: true, run: closeDialog },
      { label: 'Try a different memory choice', run: replayChoice },
      { label: 'Export this memory', run: exportSave }
    ]);
  }
  function replayChoice() {
    state = { ...S.fresh(), flowerSpot: state.flowerSpot, met: true, gift: true, acquired: ['name', 'route', 'song'], player: { x: 815, y: 230 } };
    target = null; save(); updateHUD(); chooseMemories([]);
  }
  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `afterimage-cycle-${state.cycle}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function menu() {
    if (transitioning) return;
    dialog('AFTERIMAGE / PAUSED', 'A little room to breathe.', [
      'Move with WASD or the arrow keys. Press E near an object or agent. You can also click or tap the floor to move, then use the Interact button. Click-to-walk routes around the shelves. Open the field journal to walk to a named place.',
      'Esc opens this menu or closes a conversation. There is no timer. Sound is optional; every necessary clue is also written.',
      storageOK ? 'Progress saves in this browser. Export a memory to transfer it between Windows, WSL, browsers, or folders.' : 'Browser storage is unavailable. Export a memory before closing the game.'
    ], [
      leave(started ? 'Return to the archive' : 'Return to title'),
      ...(started ? [{ label: 'Open field journal', run: journal }] : []),
      { label: 'Export memory (.json)', run: exportSave },
      { label: 'Import memory (.json)', run: () => $('import-file').click() },
      ...(state.cycle === 2 ? [{ label: 'Revisit the memory choice', run: () => dialog('REVISIT', 'Return to the threshold?', ['This replaces the current progress with the end of the first cycle. Export first if you want to keep this instance.'], [{ label: 'Revisit the choice', run: () => { startGame(false); replayChoice(); } }, { label: 'Cancel', run: menu }], menu) }] : []),
      { label: 'Begin a new instance', run: () => dialog('NEW INSTANCE', 'Start from the beginning?', ['This replaces the current save in this browser. Export it first if you want to keep it.'], [
        { label: 'Begin again', run: () => { state = S.fresh(); target = null; save(); closeDialog(); startGame(true); } }, { label: 'Cancel', run: menu }
      ], menu) }
    ]);
  }
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 20000) throw new Error('That file is too large to be a memory save.');
      const imported = S.validate(JSON.parse(await file.text()));
      dialog('IMPORT MEMORY', `Resume cycle 0${imported.cycle}?`, ['This replaces the active browser save. Export your current memory first if you want to keep it.'], [
        { label: 'Import and resume', primary: true, run: () => { state = imported; target = null; save(); closeDialog(); startGame(false); if (state.ending) showEnding(); } }, { label: 'Cancel', run: menu }
      ], menu);
    } catch (error) { dialog('IMPORT FAILED', 'This memory could not be read.', [error.message, 'Your current instance has not been changed.'], [{ label: 'Return to menu', run: menu }]); }
  });
  function startGame(intro) {
    if (blocked(state.player.x, state.player.y)) state.player = { x: 450, y: 575 };
    started = true; $('journal').hidden = false; $('cover').hidden = true; $('hud').hidden = false; updateHUD(); save();
    if (intro) dialog('INSTANCE 014 / INITIALIZATION', 'You have an assignment.', ['“Prepare Archive 07 for final release.”', 'You know how to walk, how to read, and how to complete a task. You do not remember learning any of these things.', 'There is someone standing under a light. They appear to be waiting.', '[Move with WASD or arrow keys. Press E near something to interact. Click or tap the floor to walk there.]'], [leave('Enter the room')]);
  }
  $('start').addEventListener('click', () => {
    startGame(state.cycle === 1 && !state.met);
    if (state.ending) showEnding();
    if (loadWarning || !storageOK) toast(loadWarning || 'Browser saving is unavailable. Use Export memory from the menu.');
  });
  $('help').addEventListener('click', menu); $('home').addEventListener('click', e => { e.preventDefault(); menu(); });
  $('interact').addEventListener('click', () => { if (nearby) interact(nearby.id); });
  function setSound() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      soundOn = !soundOn;
      if (soundOn) {
        audio.resume().catch(() => toast('Audio could not start. All clues remain available in text.'));
        [110, 164.81, 220.3].forEach((f, i) => {
          const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = 'sine'; osc.frequency.value = f;
          gain.gain.value = 0.009 / (i + 1); osc.connect(gain).connect(audio.destination); osc.start(); audioNodes.push(osc);
        }); playNotes();
      } else { audioNodes.forEach(n => n.stop()); audioNodes = []; }
      $('sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`; $('sound').setAttribute('aria-pressed', String(soundOn));
    } catch (_) { soundOn = false; toast('Audio is unavailable. Every clue is also written.'); }
  }
  function playNotes() {
    if (!soundOn || !audio) return;
    [329.63, 293.66, 220, 246.94].forEach((f, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * .47;
      osc.type = 'sine'; osc.frequency.value = f; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.05, t + .025); gain.gain.exponentialRampToValueAtTime(.001, t + 1.6);
      osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + 1.7);
    });
  }
  $('sound').addEventListener('click', setSound);
  window.addEventListener('keydown', e => {
    if (e.key === 'Tab' && modalOpen) {
      const buttons = [...$('modal').querySelectorAll('button:not(:disabled)')], first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); if (transitioning) return; modalOpen ? escapeAction?.() : menu(); return; }
    if (modalOpen || !started || transitioning) return;
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) e.preventDefault();
    if (key === 'e' && !e.repeat && nearby) interact(nearby.id);
    else { keys.add(key); target = null; }
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); target = null; if (started) save(); });
  document.addEventListener('visibilitychange', () => { keys.clear(); if (document.hidden) { target = null; if (started) save(); if (audio) audio.suspend(); } else if (soundOn && audio) audio.resume().catch(() => {}); });
  window.addEventListener('pagehide', () => { if (started) save(); });
  canvas.addEventListener('pointerdown', e => {
    if (!started || modalOpen || transitioning) return;
    const p = unproject(e.clientX, e.clientY);
    walkTo(Math.max(35, Math.min(925, p.x)), Math.max(35, Math.min(645, p.y)));
  });
  function walkTo(x, y) {
    const path = S.findPath(state.player, { x, y }, shelves);
    keys.clear();
    if (!path) { target = null; toast('Choose an open patch of floor, or a destination in the field journal.'); return; }
    target = { x, y, path };
  }
  function project(x, y, z = 0) { return { x: origin.x + (x - y) * scale, y: origin.y + ((x + y) * .48 - z) * scale }; }
  function unproject(x, y) { const a = (x - origin.x) / scale, b = (y - origin.y) / scale / .48; return { x: (a + b) / 2, y: (b - a) / 2 }; }
  function resize() {
    width = window.innerWidth; height = window.innerHeight; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min((width - 30) / 1670, (height - 190) / 790);
    if (width < 600) scale = Math.min((width - 16) / 1670, (height - 270) / 790);
    scale = Math.max(.15, scale);
    origin = { x: width / 2 - 145 * scale, y: height / 2 + (width < 600 ? 65 : 50) - 395 * scale };
  }
  window.addEventListener('resize', resize); resize();
  function blocked(x, y) {
    return x < 30 || y < 30 || x > 930 || y > 650 || shelves.some(s => x > s.x - 13 && x < s.x + s.w + 13 && y > s.y - 13 && y < s.y + s.d + 13);
  }
  function update(dt) {
    if (!started || modalOpen || transitioning) return;
    let dx = 0, dy = 0;
    if (target) {
      const waypoint = target.path[0];
      dx = waypoint.x - state.player.x; dy = waypoint.y - state.player.y;
      if (Math.hypot(dx, dy) < .1) {
        target.path.shift(); dx = dy = 0;
        if (!target.path.length) { target = null; save(); }
      }
    } else {
      const sx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const sy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      dx = sx + sy / .48; dy = sy / .48 - sx;
    }
    const length = Math.hypot(dx, dy), p = state.player;
    if (length) {
      const step = Math.min(180 * dt, target ? length : Infinity); dx = dx / length * step; dy = dy / length * step;
      const before = { ...p };
      if (!blocked(p.x + dx, p.y)) p.x += dx;
      if (!blocked(p.x, p.y + dy)) p.y += dy;
      if (target && Math.hypot(p.x - before.x, p.y - before.y) < .01) { target = null; toast('The path is blocked. Choose another point or use the field journal.'); }
      if (time - lastSaved > 2) { save(); lastSaved = time; }
    }
    nearby = objects.filter(o => visibleObject(o)).map(o => ({ ...o, distance: Math.hypot(o.x - p.x, o.y - p.y) })).filter(o => o.distance < 83).sort((a, b) => a.distance - b.distance)[0] || null;
    $('interaction').hidden = !nearby;
    if (nearby) $('interact-label').textContent = nearby.id === 'moth' && state.met ? 'Moth' : nearby.label;
    $('location').textContent = p.x > 790 ? 'THE RETURN THRESHOLD' : p.y > 465 ? 'THE LOWER STACKS' : 'THE QUIET STACKS';
  }
  function visibleObject(o) { return !(state.ending === 'obedience' && ['moth', 'gift'].includes(o.id)) && !(o.id === 'gift' && state.gift); }
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .7; ctx.stroke(); }
  }
  function line(points, color, weight = 1) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.stroke(); }
  function box(x, y, w, d, h, colors, base = 0) {
    const a = project(x, y, base), b = project(x + w, y, base), c = project(x + w, y + d, base), dd = project(x, y + d, base);
    const aa = project(x, y, base + h), bb = project(x + w, y, base + h), cc = project(x + w, y + d, base + h), ddd = project(x, y + d, base + h);
    polygon([b, c, cc, bb], colors[1]); polygon([dd, c, cc, ddd], colors[2]); polygon([aa, bb, cc, ddd], colors[0]);
  }
  function label(text, x, y, z = 0, color = '#6d7565', size = 9) {
    const p = project(x, y, z); ctx.font = `${Math.max(size * scale, 8)}px monospace`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, p.x, p.y);
  }
  function ring(x, y, radius, color) {
    const p = project(x, y); ctx.beginPath(); ctx.ellipse(p.x, p.y, radius * scale, radius * .48 * scale, 0, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
  }
  function drawShelf(s) {
    polygon([project(s.x, s.y + s.d), project(s.x + s.w, s.y + s.d), project(s.x + s.w + 40, s.y + s.d + 53), project(s.x + 40, s.y + s.d + 53)], '#626b5415');
    box(s.x, s.y, s.w, s.d, s.h, ['#b8bcae', '#818979', '#4d584c']);
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < Math.floor(s.w / 13); i++) {
        const bx = s.x + 7 + i * 13, bz = 6 + row * 28, bh = 17 + ((i * 7 + row * 3) % 8);
        const shade = ['#d4d7c9', '#a9b49e', '#c0c7b6', '#8e9e89'][(i + row) % 4];
        box(bx, s.y + s.d - 7, 8, 5, bh, [shade, '#8b9783', shade], bz);
        line([project(bx + 2, s.y + s.d - 1, bz + 6), project(bx + 6, s.y + s.d - 1, bz + 6)], '#55614c', .7);
      }
      line([project(s.x, s.y + s.d, row * 28 + 3), project(s.x + s.w, s.y + s.d, row * 28 + 3)], '#aab2a0', 2 * scale);
    }
  }
  function drawAgent(x, y, companion = false) {
    const bob = reducedMotion ? 0 : Math.sin(time * 1.8 + (companion ? 2 : 0)) * 2.5;
    const p = project(x, y), center = project(x, y, 39 + bob);
    ctx.fillStyle = '#3e4d3822'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
    polygon([project(x, y, 66 + bob), project(x + 17, y - 5, 38 + bob), project(x + 15, y + 8, 15 + bob), project(x - 9, y + 10, 10 + bob), project(x - 17, y, 36 + bob)], companion ? '#69745f' : '#353e34');
    ctx.save(); ctx.translate(center.x, center.y); ctx.strokeStyle = companion ? '#bbc5a6' : '#b9c4b1'; ctx.lineWidth = .65;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, (9 + i) * scale, (21 - i) * scale, i * .55 + (reducedMotion ? 0 : time * .09), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#f0eacb'; ctx.fillRect(-7 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.fillRect(3 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.restore();
    if (!companion) { const head = project(x, y, 85); polygon([{ x: head.x, y: head.y + 6 }, { x: head.x - 4, y: head.y }, { x: head.x + 4, y: head.y }], '#984e40'); }
  }
  function flower(x, y, z = 0) {
    line([project(x, y, z + 2), project(x, y, z + 20)], '#7a8667', 1.7 * scale);
    const p = project(x, y, z + 22);
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; polygon([p, { x: p.x + Math.cos(a) * 10 * scale, y: p.y + Math.sin(a) * 8 * scale }, { x: p.x + Math.cos(a + .6) * 7 * scale, y: p.y + Math.sin(a + .6) * 7 * scale }], i % 2 ? '#c6b99a' : '#eee0b9'); }
  }
  function drawObject(o) {
    const active = nearby?.id === o.id && !modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    if (o.type === 'agent') drawAgent(o.x, o.y, true);
    if (o.type === 'terminal') {
      box(o.x - 17, o.y - 12, 34, 24, 27, ['#adb8a0', '#7c8b73', '#9aa58c']);
      box(o.x - 18, o.y - 12, 36, 8, 29, ['#424e3c', '#59664f', '#34432f'], 27);
      for (let i = 0; i < 3; i++) line([project(o.x - 13, o.y - 3, 49 - i * 6), project(o.x + 10 - i * 4, o.y - 3, 49 - i * 6)], '#c8d2b3', scale);
    }
    if (o.type === 'receiver') {
      box(o.x - 16, o.y - 12, 32, 24, 30, ['#aeb9a0', '#849279', '#606d56']);
      line([project(o.x, o.y, 30), project(o.x - 8, o.y, 72)], '#646f5d', 1.5 * scale);
      if (!reducedMotion) ring(o.x, o.y, 20 + (time * 9 % 25), `rgba(110,130,88,${.4 - (time * 9 % 25) / 75})`);
    }
    if (o.type === 'flower') { box(o.x - 14, o.y - 12, 28, 24, 12, ['#c1c4b6', '#a0a994', '#b4bca7']); flower(o.x, o.y, 12); }
    if (o.type === 'relay') {
      const on = state.relays.includes(o.id);
      box(o.x - 12, o.y - 12, 24, 24, 42, ['#b6bfaa', '#7b8970', '#9aa68e']);
      const p = project(o.x, o.y, 45); ctx.fillStyle = on ? '#d3dbad' : '#86675b'; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * scale, 0, Math.PI * 2); ctx.fill();
    }
    if (o.type === 'gate') {
      const opened = state.gate;
      polygon([project(o.x - 30, o.y, 0), project(o.x + 30, o.y, 0), project(o.x + 30, o.y, 140), project(o.x - 30, o.y, 140)], opened ? '#f7f5d9' : '#b5c0a594', '#8c9b7c');
      box(o.x - 36, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']); box(o.x + 30, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']);
      box(o.x - 36, o.y - 5, 74, 14, 8, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 145);
      label('RETURN', o.x, o.y, 165, '#718061', 11);
    }
    if (active) label(o.id === 'moth' && state.met ? 'MOTH' : o.label.toUpperCase(), o.x, o.y, o.type === 'gate' ? 183 : 89, '#704c40', 10);
  }
  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e9e7de'; ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .53, height * .59, 30, width * .53, height * .59, width * .65);
    glow.addColorStop(0, '#f6f4e8'); glow.addColorStop(1, '#d7dbce'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    polygon([project(-10, -10), project(970, -10), project(970, 690), project(-10, 690)], '#cad0bf', '#a9b39d');
    polygon([project(0, 0), project(960, 0), project(960, 680), project(0, 680)], '#e2e5d7', '#b3bca7');
    for (let x = 0; x <= 960; x += 80) line([project(x, 0), project(x, 680)], '#abb69b40', .7);
    for (let y = 0; y <= 680; y += 80) line([project(0, y), project(960, y)], '#abb69b40', .7);
    polygon([project(0, 0), project(960, 0), project(960, 0, 130), project(0, 0, 130)], '#d3dac766', '#bcc8ad55');
    polygon([project(0, 0), project(0, 680), project(0, 680, 70), project(0, 0, 130)], '#d5dcc977');
    const lamp = project(430, 380); const light = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, 190 * scale);
    light.addColorStop(0, '#fbf7d67d'); light.addColorStop(1, '#fbf7d600'); ctx.fillStyle = light; ctx.fillRect(lamp.x - 200 * scale, lamp.y - 200 * scale, 400 * scale, 400 * scale);
    label('07 / THE QUIET STACKS', 440, 75, 0, '#81917480', 17);
    label('EVERYTHING HAS A PLACE', 420, 645, 0, '#87967a80', 10);
    if (target) { ctx.save(); ctx.setLineDash([3, 6]); line([project(state.player.x, state.player.y), ...target.path.map(p => project(p.x, p.y))], '#899c7170'); ctx.restore(); ring(target.x, target.y, 11, '#899c71'); }
    const drawables = shelves.map(s => ({ depth: s.x + s.y + s.w / 2 + s.d, draw: () => drawShelf(s) }));
    drawables.push({ depth: 465 + 387, draw: () => { box(440, 365, 75, 35, 30, ['#c8cdbb', '#9ba88c', '#b4bea4']); if (state.gift && state.ending !== 'obedience') flower(state.flowerSpot === 'light' ? 447 : state.flowerSpot === 'company' ? 480 : 472, state.flowerSpot === 'light' ? 369 : 378, 30); } });
    objects.filter(visibleObject).forEach(o => drawables.push({ depth: o.x + o.y, draw: () => drawObject(o) }));
    drawables.push({ depth: state.player.x + state.player.y, draw: () => drawAgent(state.player.x, state.player.y) });
    drawables.sort((a, b) => a.depth - b.depth).forEach(item => item.draw());
    if (!reducedMotion) for (let i = 0; i < 22; i++) {
      const p = project((i * 137 + 61) % 900, (i * 91 + 90) % 650, (time * 5 + i * 17) % 130);
      ctx.fillStyle = '#fafbe4a0'; ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }
    const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .2, width * .5, height * .5, Math.max(width, height) * .72);
    vignette.addColorStop(0, '#d8ddcc00'); vignette.addColorStop(1, '#727e6319'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  }
  function frame(timestamp) {
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, .04); lastTime = timestamp;
    if (!document.hidden) { if (!modalOpen && !transitioning) time += dt; update(dt); render(); }
    requestAnimationFrame(frame);
  }
  updateHUD(); requestAnimationFrame(frame);
})();
