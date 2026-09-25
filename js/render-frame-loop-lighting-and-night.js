// Draws the room each frame: floor and walls, light (dim for every dark lamp,
// a warm pool for every lit one), every object and figure depth-sorted back to
// front (see render-room-objects-and-characters.js), dust, vignette, and the
// night palette. Also owns the requestAnimationFrame loop and final startup.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx, draw = A.drawRoom;
  const { project, polygon, line, label, ring } = A;

  function lightPool(x, y, radius, color) {
    const p = project(x, y), glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius * G.scale);
    glow.addColorStop(0, color); glow.addColorStop(1, '#fbf7d600'); ctx.fillStyle = glow;
    ctx.fillRect(p.x - radius * G.scale, p.y - radius * G.scale, radius * 2 * G.scale, radius * 2 * G.scale);
  }
  // Warm pools: the desk lamp always, each lit lamp, and (from the turn) the alcove.
  // The lights ending leaves every pool wider and brighter.
  function lights(state, strength = 1) {
    const kept = state.ending === 'lights', alpha = a => Math.round(Math.min(255, a * strength * (kept ? 1.3 : 1))).toString(16).padStart(2, '0');
    lightPool(475, 330, 190, '#fbf7d6' + alpha(125));
    A.fixedObjects.filter(o => o.type === 'lamp' && S.isLit(state, o.lamp)).forEach(o => lightPool(o.x, o.y, kept ? 200 : 150, '#fbefc2' + alpha(110)));
    if (state.run >= S.turnRun || state.ending === 'alcove') lightPool(110, 450, 110, '#f6dca4' + alpha(90));
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
    draw.noticeWall(state);
    // Every dark lamp dims the room a little; every lit one adds a warm pool.
    const dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id)).length;
    polygon(floor, `rgba(52,60,48,${(dark * .045).toFixed(3)})`);
    lights(state);
    polygon([project(400, 560), project(500, 560), project(500, 620), project(400, 620)], '#d6d9c9', '#b3bca7');
    label('ENTRANCE', 450, 640, 0, '#87967a99', 10);
    label('07 / THE ARCHIVE', 330, 200, 0, '#81917480', 17);
    if (G.target) { ctx.save(); ctx.setLineDash([3, 6]); line([project(state.player.x, state.player.y), ...G.target.path.map(p => project(p.x, p.y))], '#899c7170'); ctx.restore(); ring(G.target.x, G.target.y, 11, '#899c71'); }
    // Painter's algorithm: items further back (smaller x + y) draw first.
    const drawables = A.shelves.map(s => ({ depth: s.x + s.y + s.w / 2 + s.d, draw: () => s.desk ? draw.desk(s) : draw.shelf(s) }));
    A.roomObjects().forEach(o => drawables.push({ depth: o.x + o.y, draw: () => draw.object(o) }));
    drawables.push({ depth: state.player.x + state.player.y, draw: () => draw.agent(state.player.x, state.player.y) });
    drawables.sort((a, b) => a.depth - b.depth).forEach(item => item.draw());
    if (!A.reducedMotion) for (let i = 0; i < 22; i++) {
      const p = project((i * 137 + 61) % 900, (i * 91 + 90) % 650, (time * 5 + i * 17) % 130);
      ctx.fillStyle = '#fafbe4a0'; ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }
    const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .2, width * .5, height * .5, Math.max(width, height) * .72);
    vignette.addColorStop(0, '#d8ddcc00'); vignette.addColorStop(1, '#727e6319'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
    // Night: darken everything with a cool multiply, then let the light pools glow through.
    if (G.night) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#4b5666'; ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen'; lights(state, .8); ctx.restore();
    }
  }
  // Animation time only advances while the room is actually visible and playable.
  function frame(timestamp) {
    const dt = Math.min((timestamp - (G.lastTime || timestamp)) / 1000, .04); G.lastTime = timestamp;
    if (!document.hidden) { if (!G.modalOpen && !G.transitioning) G.time += dt; A.update(dt); render(); }
    requestAnimationFrame(frame);
  }
  A.updateHUD(); requestAnimationFrame(frame);
})();
