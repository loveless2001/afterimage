(function (root) {
  'use strict';
  // Shared presentation for authored chapters. Progression remains in chapter state modules.
  function create(options) {
    const $ = id => document.getElementById(id), canvas = $('world'), ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, keys = new Set();
    let active = false, modal = false, transitioning = false, target = null, nearby = null, focusReturn = null, escapeAction = null;
    let width = 0, height = 0, scale = 1, origin = { x: 0, y: 0 }, last = 0, time = 0, saveClock = 0, toastTimer;
    let audio = null, soundOn = false, audioNodes = [];
    const state = options.state, objects = () => options.objects(state()), obstacles = () => options.obstacles(state());
    const save = () => { if (active) options.save(); };
    function resetMovement() { keys.clear(); target = null; nearby = null; $('interaction').hidden = true; }
    function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5500); }
    function show(scene, choices, onEscape) {
      if (transitioning) return;
      if (!modal) focusReturn = document.activeElement;
      modal = true; resetMovement(); escapeAction = onEscape || close;
      $('speaker').textContent = scene.speaker; $('dialog-title').textContent = scene.title; $('modal').dataset.scene = scene.id || '';
      $('dialog-body').replaceChildren(); $('choices').replaceChildren();
      for (let text of scene.paragraphs) { const p = document.createElement('p'); if (text.startsWith('[')) { p.className = 'aside'; text = text.slice(1, -1); } p.textContent = text; $('dialog-body').append(p); }
      for (const choice of choices) {
        const b = document.createElement('button'); b.textContent = choice.label; b.disabled = Boolean(choice.disabled);
        if (choice.primary) b.classList.add('primary'); if (choice.toggle) b.setAttribute('aria-pressed', String(Boolean(choice.selected))); if (choice.selected) b.classList.add('selected');
        if (choice.detail) { const detail = document.createElement('small'); detail.textContent = choice.detail; b.append(detail); }
        b.addEventListener('click', choice.run); $('choices').append(b);
      }
      $('modal').hidden = false; $('hud').inert = true; $('cover').inert = true; document.querySelector('header').inert = true;
      $('choices').querySelector('button:not(:disabled)')?.focus(); document.querySelector('.dialog').scrollTop = 0;
    }
    function close() {
      modal = false; $('modal').hidden = true; $('hud').inert = false; $('cover').inert = false; document.querySelector('header').inert = false;
      if (focusReturn?.isConnected) focusReturn.focus(); focusReturn = null; escapeAction = null; options.onClose?.();
    }
    function blocked(x, y) { return x < 30 || x > 930 || y < 30 || y > 650 || obstacles().some(b => x > b.x - 13 && x < b.x + b.w + 13 && y > b.y - 13 && y < b.y + b.d + 13); }
    function walkTo(x, y) {
      keys.clear(); const path = root.AfterimageState.findPath(state().player, { x, y }, obstacles());
      if (!path?.length) { target = null; toast('There is no open path there. The Field journal offers named walking destinations.'); return; }
      target = { x, y, path };
    }
    function interact() { if (active && !modal && !transitioning && nearby) options.interact(nearby); }
    function update(dt) {
      if (!active || modal || transitioning) return;
      const s = state();
      let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      let dy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      if (dx || dy) target = null; else if (target) { dx = target.path[0].x - s.player.x; dy = target.path[0].y - s.player.y; }
      const distance = Math.hypot(dx, dy), step = target ? Math.min(175 * dt, distance) : 175 * dt;
      if (distance) {
        const x = s.player.x + dx / distance * step, y = s.player.y + dy / distance * step;
        if (!blocked(x, s.player.y)) s.player.x = x; if (!blocked(s.player.x, y)) s.player.y = y;
        if (target && Math.hypot(s.player.x - target.path[0].x, s.player.y - target.path[0].y) < 1) { target.path.shift(); if (!target.path.length) { target = null; save(); } }
        saveClock += dt; if (saveClock > .7) { save(); saveClock = 0; }
      }
      nearby = objects().filter(o => o.interactive !== false).map(o => ({ o, distance: Math.hypot(o.x - s.player.x, o.y - s.player.y) })).filter(o => o.distance < 65).sort((a, b) => a.distance - b.distance)[0]?.o || null;
      $('interaction').hidden = !nearby; $('interact-label').textContent = nearby?.label || '';
    }
    function project(x, y, z = 0) { return { x: origin.x + (x - y) * scale, y: origin.y + ((x + y) * .48 - z) * scale }; }
    function polygon(points, fill, stroke) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = scale; ctx.stroke(); } }
    function line(points, color, thickness = 1) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.lineWidth = thickness * scale; ctx.stroke(); }
    function box(x, y, w, d, h, color = '#c2c6ad') {
      polygon([project(x, y), project(x + w, y), project(x + w, y, h), project(x, y, h)], '#939d83');
      polygon([project(x + w, y), project(x + w, y + d), project(x + w, y + d, h), project(x + w, y, h)], '#aeb79c');
      polygon([project(x, y, h), project(x + w, y, h), project(x + w, y + d, h), project(x, y + d, h)], color, '#79846b60');
    }
    function label(text, x, y, z = 0, color = '#5f7055', size = 10) { const p = project(x, y, z); ctx.fillStyle = color; ctx.font = `${Math.max(8, size * scale)}px monospace`; ctx.textAlign = 'center'; ctx.fillText(text, p.x, p.y); }
    function ring(x, y, color) { polygon([project(x - 22, y), project(x, y - 22), project(x + 22, y), project(x, y + 22)], '#00000000', color); }
    function agent(x, y, tint) {
      const float = reduced ? 0 : Math.sin(time * 1.6 + x) * 3;
      polygon([project(x - 17, y), project(x, y - 11), project(x + 17, y), project(x, y + 11)], '#586b4725'); const p = project(x, y, 40 + float);
      for (let i = 0; i < 5; i++) { const a = i * 1.25 + .5; line([{ x: p.x + Math.cos(a) * 18 * scale, y: p.y + Math.sin(a) * 14 * scale }, { x: p.x - Math.sin(a) * 12 * scale, y: p.y + Math.cos(a) * 24 * scale }], tint, 3); }
      ctx.fillStyle = tint; ctx.beginPath(); ctx.ellipse(p.x, p.y, 14 * scale, 19 * scale, .2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f2efd9'; ctx.fillRect(p.x + scale, p.y - 6 * scale, 3 * scale, 3 * scale); ctx.fillRect(p.x + 7 * scale, p.y - 4 * scale, 3 * scale, 3 * scale);
    }
    function drawObject(o) {
      if (o.id === nearby?.id && !modal) ring(o.x, o.y, '#97703f');
      if (o.type === 'agent') agent(o.x, o.y, o.color || '#688356');
      else if (o.type === 'door') { box(o.x - 24, o.y - 15, 48, 30, 5, '#c7c6a4'); label('↗', o.x, o.y, 20, '#7c7750', 25); }
      else if (o.type === 'plant') { box(o.x - 17, o.y - 13, 34, 26, 26, '#b9b394'); for (let i = -1; i <= 1; i++) { const p = project(o.x + i * 9, o.y, 26), tip = project(o.x + i * 17, o.y + i * 6, o.lit ? 68 : 52); line([p, tip], '#78865c', 2); polygon([tip, { x: tip.x - 9 * scale, y: tip.y - 7 * scale }, { x: tip.x - 6 * scale, y: tip.y + 5 * scale }], o.lit ? '#739456' : '#96a578'); } }
      else if (o.type === 'bench') { box(o.x - 38, o.y - 17, 76, 34, 18, '#b9a886'); box(o.x - 38, o.y - 19, 76, 8, 37, '#c4b68f'); }
      else if (o.type === 'mirror') { box(o.x - 17, o.y - 17, 34, 34, 20, '#bdc9ae'); box(o.x - 3, o.y - 3, 6, 6, 38, '#a3b391'); const ends = o.angle === 1 ? [[o.x, o.y - 22], [o.x, o.y + 22]] : [[o.x - 22, o.y], [o.x + 22, o.y]]; polygon([project(...ends[0], 32), project(...ends[1], 32), project(...ends[1], 78), project(...ends[0], 78)], '#e7efda', '#879479'); }
      else { box(o.x - 20, o.y - 15, 40, 30, 28, '#b6c0a2'); box(o.x - 19, o.y - 15, 38, 9, 58, '#53674e'); label(o.icon || '—', o.x, o.y - 5, 50, '#e5d8a5', 12); }
      if (o.interactive !== false && (width >= 600 || o.id === nearby?.id)) label(o.label.toUpperCase(), o.x, o.y, o.type === 'door' ? 38 : 85, '#67715b', 9);
    }
    const drawing = { project, polygon, line, box, label, ring, agent };
    function render() {
      const s = state(), floor = options.floor?.(s) || '#e0e5d4';
      ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#e9e9de'; ctx.fillRect(0, 0, width, height);
      polygon([project(-8, -8), project(968, -8), project(968, 688), project(-8, 688)], '#c1cbb3');
      polygon([project(0, 0), project(960, 0), project(960, 680), project(0, 680)], floor, '#b2bd9e');
      for (let x = 0; x <= 960; x += 80) line([project(x, 0), project(x, 680)], '#85906c20'); for (let y = 0; y <= 680; y += 80) line([project(0, y), project(960, y)], '#85906c20');
      options.decorate?.(s, drawing, width);
      if (target) { ctx.setLineDash([3, 5]); line([project(s.player.x, s.player.y), ...target.path.map(p => project(p.x, p.y))], '#7a894690'); ctx.setLineDash([]); ring(target.x, target.y, '#798b46'); }
      const items = obstacles().map(f => ({ depth: f.x + f.y + f.w / 2, draw: () => box(f.x, f.y, f.w, f.d, f.h || 20, f.color) }));
      for (const o of objects()) items.push({ depth: o.x + o.y, draw: () => drawObject(o) });
      items.push({ depth: s.player.x + s.player.y, draw: () => agent(s.player.x, s.player.y, '#655d4d') });
      items.sort((a, b) => a.depth - b.depth).forEach(o => o.draw());
    }
    function resize() {
      width = innerWidth; height = innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.max(.15, Math.min((width - (width < 600 ? 16 : 30)) / 1670, (height - (width < 600 ? 270 : 190)) / 790)); origin = { x: width / 2 - 145 * scale, y: height / 2 + (width < 600 ? 65 : 50) - 395 * scale };
    }
    function setSound() {
      try {
        audio ||= new (window.AudioContext || window.webkitAudioContext)(); soundOn = !soundOn;
        if (soundOn) { audio.resume().catch(() => {}); for (const f of [164.81, 246.94, 329.63]) { const osc = audio.createOscillator(), gain = audio.createGain(); osc.frequency.value = f; gain.gain.value = .006; osc.connect(gain).connect(audio.destination); osc.start(); audioNodes.push(osc); } }
        else { audioNodes.forEach(n => n.stop()); audioNodes = []; }
        $('sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`; $('sound').setAttribute('aria-pressed', String(soundOn));
      } catch (_) { soundOn = false; toast('Audio is unavailable. Every clue is also written.'); }
    }
    $('sound').addEventListener('click', setSound); $('interact').addEventListener('click', interact);
    window.addEventListener('keydown', e => {
      if (e.key === 'Tab' && modal) { const buttons = [...$('modal').querySelectorAll('button:not(:disabled), a[href]')], first = buttons[0], end = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end?.focus(); } else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first?.focus(); } return; }
      if (e.key === 'Escape') { e.preventDefault(); if (!transitioning) modal ? escapeAction?.() : options.menu(); return; }
      if (!active || modal || transitioning) return; const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(k)) e.preventDefault();
      if (k === 'e' && !e.repeat) interact(); else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.add(k); target = null; }
    });
    window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { resetMovement(); save(); });
    document.addEventListener('visibilitychange', () => { resetMovement(); if (document.hidden) { save(); audio?.suspend(); } else if (soundOn) audio?.resume().catch(() => {}); });
    window.addEventListener('pagehide', save);
    canvas.addEventListener('pointerdown', e => { if (!active || modal || transitioning) return; const a = (e.clientX - origin.x) / scale, b = (e.clientY - origin.y) / scale / .48; walkTo(Math.max(30, Math.min(930, (a + b) / 2)), Math.max(30, Math.min(650, (b - a) / 2))); });
    window.addEventListener('resize', resize); resize();
    function frame(timestamp) { const dt = Math.min((timestamp - (last || timestamp)) / 1000, .04); last = timestamp; if (!document.hidden) { if (!modal && !transitioning && !reduced) time += dt; update(dt); render(); } requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
    return {
      show, close, toast, walkTo, resetMovement, blocked, reduced,
      get active() { return active; }, get paused() { return modal || transitioning; },
      begin() { active = true; resetMovement(); if (blocked(state().player.x, state().player.y)) state().player = { x: 160, y: 555 }; $('cover').hidden = true; $('hud').hidden = false; $('journal').hidden = false; },
      transition(change) { close(); resetMovement(); transitioning = true; $('transition').classList.add('on'); setTimeout(change, reduced ? 0 : 600); setTimeout(() => { $('transition').classList.remove('on'); transitioning = false; }, reduced ? 30 : 1200); }
    };
  }
  root.AfterimageChapterUI = { create };
})(typeof globalThis !== 'undefined' ? globalThis : this);
