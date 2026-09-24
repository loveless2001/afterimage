// Isometric projection between floor coordinates (x, y, height z) and screen
// pixels, viewport fitting, and the primitive shapes the renderer draws with.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, ctx = A.ctx;
  A.project = (x, y, z = 0) => ({ x: G.origin.x + (x - y) * G.scale, y: G.origin.y + ((x + y) * .48 - z) * G.scale });
  A.unproject = (x, y) => { const a = (x - G.origin.x) / G.scale, b = (y - G.origin.y) / G.scale / .48; return { x: (a + b) / 2, y: (b - a) / 2 }; };

  // Fits the floor into the window; narrow screens reserve extra room for the HUD.
  function resize() {
    G.width = window.innerWidth; G.height = window.innerHeight; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    A.canvas.width = Math.round(G.width * dpr); A.canvas.height = Math.round(G.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let scale = Math.min((G.width - 30) / 1670, (G.height - 190) / 790);
    if (G.width < 600) scale = Math.min((G.width - 16) / 1670, (G.height - 270) / 790);
    G.scale = Math.max(.15, scale);
    G.origin = { x: G.width / 2 - 145 * G.scale, y: G.height / 2 + (G.width < 600 ? 65 : 50) - 395 * G.scale };
  }
  window.addEventListener('resize', resize); resize();

  A.polygon = function (points, fill, stroke) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .7; ctx.stroke(); }
  };
  A.line = function (points, color, weight = 1) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.stroke();
  };
  // A flat-shaded block: colors are [top, right face, front face].
  A.box = function (x, y, w, d, h, colors, base = 0) {
    const project = A.project;
    const a = project(x, y, base), b = project(x + w, y, base), c = project(x + w, y + d, base), dd = project(x, y + d, base);
    const aa = project(x, y, base + h), bb = project(x + w, y, base + h), cc = project(x + w, y + d, base + h), ddd = project(x, y + d, base + h);
    A.polygon([b, c, cc, bb], colors[1]); A.polygon([dd, c, cc, ddd], colors[2]); A.polygon([aa, bb, cc, ddd], colors[0]);
  };
  A.label = function (text, x, y, z = 0, color = '#6d7565', size = 9) {
    const p = A.project(x, y, z); ctx.font = `${Math.max(size * G.scale, 8)}px monospace`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, p.x, p.y);
  };
  // A floor ellipse, used for the interaction ring and the walk target.
  A.ring = function (x, y, radius, color) {
    const p = A.project(x, y); ctx.beginPath(); ctx.ellipse(p.x, p.y, radius * G.scale, radius * .48 * G.scale, 0, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
  };
})();
