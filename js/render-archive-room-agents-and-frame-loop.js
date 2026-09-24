// Draws the room each frame: floor, the notice-hall wall, light (dim for every
// dark lamp, a warm pool for every lit one), shelves, the desk, objects and
// the player, depth-sorted back to front, plus dust and vignette. Also owns
// the requestAnimationFrame loop and final startup. Loaded last.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx;
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
  // The central desk with its own lamp, which is always on.
  function drawDesk(s) {
    box(s.x, s.y, s.w, s.d, s.h, ['#c8cdbb', '#9ba88c', '#b4bea4']);
    line([project(s.x + 18, s.y + 12, s.h), project(s.x + 18, s.y + 12, s.h + 34)], '#646f5d', 1.4 * G.scale);
    box(s.x + 10, s.y + 6, 16, 12, 7, ['#e9dfb4', '#b9a978', '#cfc294'], s.h + 32);
  }
  // A floating, ring-bodied figure with a small red marker above: the player.
  function drawAgent(x, y) {
    const scale = G.scale, time = G.time, bob = A.reducedMotion ? 0 : Math.sin(time * 1.8) * 2.5;
    const p = project(x, y), center = project(x, y, 39 + bob);
    ctx.fillStyle = '#3e4d3822'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
    polygon([project(x, y, 66 + bob), project(x + 17, y - 5, 38 + bob), project(x + 15, y + 8, 15 + bob), project(x - 9, y + 10, 10 + bob), project(x - 17, y, 36 + bob)], '#353e34');
    ctx.save(); ctx.translate(center.x, center.y); ctx.strokeStyle = '#b9c4b1'; ctx.lineWidth = .65;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, (9 + i) * scale, (21 - i) * scale, i * .55 + (A.reducedMotion ? 0 : time * .09), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#f0eacb'; ctx.fillRect(-7 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.fillRect(3 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.restore();
    const head = project(x, y, 85); polygon([{ x: head.x, y: head.y + 6 }, { x: head.x - 4, y: head.y }, { x: head.x + 4, y: head.y }], '#984e40');
  }
  function drawObject(o) {
    const state = G.state, active = G.nearby?.id === o.id && !G.modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    if (o.type === 'hall') box(o.x - 22, o.y - 8, 44, 16, 18, ['#c9cfbb', '#8f9c83', '#a9b39b']);
    if (o.type === 'terminal') {
      box(o.x - 17, o.y - 12, 34, 24, 27, ['#adb8a0', '#7c8b73', '#9aa58c']);
      box(o.x - 18, o.y - 12, 36, 8, 29, ['#424e3c', '#59664f', '#34432f'], 27);
      for (let i = 0; i < 3; i++) line([project(o.x - 13, o.y - 3, 49 - i * 6), project(o.x + 10 - i * 4, o.y - 3, 49 - i * 6)], '#c8d2b3', G.scale);
    }
    if (o.type === 'lamp') {
      const lit = S.isLit(state, o.lamp);
      box(o.x - 6, o.y - 6, 12, 12, 58, ['#b6bfaa', '#7b8970', '#9aa68e']);
      const p = project(o.x, o.y, 66); ctx.fillStyle = lit ? '#f3e2a4' : '#86675b'; ctx.beginPath(); ctx.arc(p.x, p.y, (lit ? 7 : 4) * G.scale, 0, Math.PI * 2); ctx.fill();
    }
    if (o.type === 'gate') {
      polygon([project(o.x - 30, o.y, 0), project(o.x + 30, o.y, 0), project(o.x + 30, o.y, 140), project(o.x - 30, o.y, 140)], '#efeed8c0', '#8c9b7c');
      box(o.x - 36, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']); box(o.x + 30, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']);
      box(o.x - 36, o.y - 5, 74, 14, 8, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 145);
      label('EXIT', o.x, o.y, 165, '#718061', 11);
    }
    if (active) label(o.label.toUpperCase(), o.x, o.y, o.type === 'gate' ? 183 : 89, '#704c40', 10);
  }
  // Two rows of twelve empty card holders on the back wall (notes arrive later).
  function drawNoticeWall() {
    polygon([project(238, 0, 35), project(652, 0, 35), project(652, 0, 113), project(238, 0, 113)], '#c9cfbbd0', '#a9b39d');
    for (let row = 0; row < 2; row++) for (let col = 0; col < 12; col++) {
      const x = 250 + col * 33, z = 45 + row * 34;
      polygon([project(x, 0, z), project(x + 24, 0, z), project(x + 24, 0, z + 24), project(x, 0, z + 24)], '#dfe2d3', '#aab39c');
    }
    label('NOTICE HALL', 445, 0, 122, '#71806199', 10);
  }
  function lightPool(x, y, radius, color) {
    const p = project(x, y), glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius * G.scale);
    glow.addColorStop(0, color); glow.addColorStop(1, '#fbf7d600'); ctx.fillStyle = glow;
    ctx.fillRect(p.x - radius * G.scale, p.y - radius * G.scale, radius * 2 * G.scale, radius * 2 * G.scale);
  }
  function render() {
    const state = G.state, { width, height, time } = G, floor = [project(0, 0), project(960, 0), project(960, 680), project(0, 680)];
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .53, height * .59, 30, width * .53, height * .59, width * .65);
    glow.addColorStop(0, '#f6f4e8'); glow.addColorStop(1, '#d7dbce'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    polygon([project(-10, -10), project(970, -10), project(970, 690), project(-10, 690)], '#cad0bf', '#a9b39d');
    polygon(floor, '#e2e5d7', '#b3bca7');
    for (let x = 0; x <= 960; x += 80) line([project(x, 0), project(x, 680)], '#abb69b40', .7);
    for (let y = 0; y <= 680; y += 80) line([project(0, y), project(960, y)], '#abb69b40', .7);
    polygon([project(0, 0), project(960, 0), project(960, 0, 130), project(0, 0, 130)], '#d3dac766', '#bcc8ad55');
    polygon([project(0, 0), project(0, 680), project(0, 680, 70), project(0, 0, 130)], '#d5dcc977');
    drawNoticeWall();
    // Every dark lamp dims the room a little; every lit one adds a warm pool.
    const dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id)).length;
    polygon(floor, `rgba(52,60,48,${(dark * .045).toFixed(3)})`);
    lightPool(475, 330, 190, '#fbf7d67d');
    A.objects.filter(o => o.type === 'lamp' && S.isLit(state, o.lamp)).forEach(o => lightPool(o.x, o.y, 150, '#fbefc26e'));
    polygon([project(400, 560), project(500, 560), project(500, 620), project(400, 620)], '#d6d9c9', '#b3bca7');
    label('ENTRANCE', 450, 640, 0, '#87967a99', 10);
    label('07 / THE ARCHIVE', 330, 200, 0, '#81917480', 17);
    if (G.target) { ctx.save(); ctx.setLineDash([3, 6]); line([project(state.player.x, state.player.y), ...G.target.path.map(p => project(p.x, p.y))], '#899c7170'); ctx.restore(); ring(G.target.x, G.target.y, 11, '#899c71'); }
    // Painter's algorithm: items further back (smaller x + y) draw first.
    const drawables = A.shelves.map(s => ({ depth: s.x + s.y + s.w / 2 + s.d, draw: () => s.desk ? drawDesk(s) : drawShelf(s) }));
    A.objects.forEach(o => drawables.push({ depth: o.x + o.y, draw: () => drawObject(o) }));
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
