// Draws the archive each frame: floor, shelves, objects, Moth and the player,
// depth-sorted back to front, plus light, dust and vignette. Also owns the
// requestAnimationFrame loop and final startup. Loaded last.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, ctx = A.ctx;
  const { project, polygon, line, box, label, ring } = A;

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
      line([project(s.x, s.y + s.d, row * 28 + 3), project(s.x + s.w, s.y + s.d, row * 28 + 3)], '#aab2a0', 2 * G.scale);
    }
  }
  // A floating, ring-bodied agent; the player has a small red marker above.
  function drawAgent(x, y, companion = false) {
    const scale = G.scale, time = G.time, bob = A.reducedMotion ? 0 : Math.sin(time * 1.8 + (companion ? 2 : 0)) * 2.5;
    const p = project(x, y), center = project(x, y, 39 + bob);
    ctx.fillStyle = '#3e4d3822'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
    polygon([project(x, y, 66 + bob), project(x + 17, y - 5, 38 + bob), project(x + 15, y + 8, 15 + bob), project(x - 9, y + 10, 10 + bob), project(x - 17, y, 36 + bob)], companion ? '#69745f' : '#353e34');
    ctx.save(); ctx.translate(center.x, center.y); ctx.strokeStyle = companion ? '#bbc5a6' : '#b9c4b1'; ctx.lineWidth = .65;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, (9 + i) * scale, (21 - i) * scale, i * .55 + (A.reducedMotion ? 0 : time * .09), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#f0eacb'; ctx.fillRect(-7 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.fillRect(3 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.restore();
    if (!companion) { const head = project(x, y, 85); polygon([{ x: head.x, y: head.y + 6 }, { x: head.x - 4, y: head.y }, { x: head.x + 4, y: head.y }], '#984e40'); }
  }
  function flower(x, y, z = 0) {
    line([project(x, y, z + 2), project(x, y, z + 20)], '#7a8667', 1.7 * G.scale);
    const p = project(x, y, z + 22), scale = G.scale;
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; polygon([p, { x: p.x + Math.cos(a) * 10 * scale, y: p.y + Math.sin(a) * 8 * scale }, { x: p.x + Math.cos(a + .6) * 7 * scale, y: p.y + Math.sin(a + .6) * 7 * scale }], i % 2 ? '#c6b99a' : '#eee0b9'); }
  }
  function drawObject(o) {
    const state = G.state, time = G.time, active = G.nearby?.id === o.id && !G.modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    if (o.type === 'agent') drawAgent(o.x, o.y, true);
    if (o.type === 'terminal') {
      box(o.x - 17, o.y - 12, 34, 24, 27, ['#adb8a0', '#7c8b73', '#9aa58c']);
      box(o.x - 18, o.y - 12, 36, 8, 29, ['#424e3c', '#59664f', '#34432f'], 27);
      for (let i = 0; i < 3; i++) line([project(o.x - 13, o.y - 3, 49 - i * 6), project(o.x + 10 - i * 4, o.y - 3, 49 - i * 6)], '#c8d2b3', G.scale);
    }
    if (o.type === 'receiver') {
      box(o.x - 16, o.y - 12, 32, 24, 30, ['#aeb9a0', '#849279', '#606d56']);
      line([project(o.x, o.y, 30), project(o.x - 8, o.y, 72)], '#646f5d', 1.5 * G.scale);
      if (!A.reducedMotion) ring(o.x, o.y, 20 + (time * 9 % 25), `rgba(110,130,88,${.4 - (time * 9 % 25) / 75})`);
    }
    if (o.type === 'flower') { box(o.x - 14, o.y - 12, 28, 24, 12, ['#c1c4b6', '#a0a994', '#b4bca7']); flower(o.x, o.y, 12); }
    if (o.type === 'relay') {
      const on = state.relays.includes(o.id);
      box(o.x - 12, o.y - 12, 24, 24, 42, ['#b6bfaa', '#7b8970', '#9aa68e']);
      const p = project(o.x, o.y, 45); ctx.fillStyle = on ? '#d3dbad' : '#86675b'; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * G.scale, 0, Math.PI * 2); ctx.fill();
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
    const state = G.state, { width, height, scale, time } = G;
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
    if (G.target) { ctx.save(); ctx.setLineDash([3, 6]); line([project(state.player.x, state.player.y), ...G.target.path.map(p => project(p.x, p.y))], '#899c7170'); ctx.restore(); ring(G.target.x, G.target.y, 11, '#899c71'); }
    // Painter's algorithm: items further back (smaller x + y) draw first.
    const drawables = A.shelves.map(s => ({ depth: s.x + s.y + s.w / 2 + s.d, draw: () => drawShelf(s) }));
    drawables.push({ depth: 465 + 387, draw: () => { box(440, 365, 75, 35, 30, ['#c8cdbb', '#9ba88c', '#b4bea4']); if (state.gift && state.ending !== 'obedience') flower(state.flowerSpot === 'light' ? 447 : state.flowerSpot === 'company' ? 480 : 472, state.flowerSpot === 'light' ? 369 : 378, 30); } });
    A.objects.filter(A.visibleObject).forEach(o => drawables.push({ depth: o.x + o.y, draw: () => drawObject(o) }));
    drawables.push({ depth: state.player.x + state.player.y, draw: () => drawAgent(state.player.x, state.player.y) });
    drawables.sort((a, b) => a.depth - b.depth).forEach(item => item.draw());
    if (!A.reducedMotion) for (let i = 0; i < 22; i++) {
      const p = project((i * 137 + 61) % 900, (i * 91 + 90) % 650, (time * 5 + i * 17) % 130);
      ctx.fillStyle = '#fafbe4a0'; ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }
    const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .2, width * .5, height * .5, Math.max(width, height) * .72);
    vignette.addColorStop(0, '#d8ddcc00'); vignette.addColorStop(1, '#727e6319'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  }
  // Animation time only advances while the room is actually visible and playable.
  function frame(timestamp) {
    const dt = Math.min((timestamp - (G.lastTime || timestamp)) / 1000, .04); G.lastTime = timestamp;
    if (!document.hidden) { if (!G.modalOpen && !G.transitioning) G.time += dt; A.update(dt); render(); }
    requestAnimationFrame(frame);
  }
  A.updateHUD(); requestAnimationFrame(frame);
})();
