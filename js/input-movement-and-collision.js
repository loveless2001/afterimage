// Player input and movement: keyboard (WASD/arrows, E, Escape), click/tap to
// walk along a routed path, shelf collision, nearby-object detection, and
// saving when the page loses focus.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, $ = A.$;
  const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'];

  A.blocked = (x, y) => A.P.isBlocked({ x, y }, A.shelves);

  // Plans a route to a floor point; the frame loop follows it waypoint by waypoint.
  A.walkTo = function (x, y) {
    const path = A.P.findPath(G.state.player, { x, y }, A.shelves);
    G.keys.clear();
    if (!path) { G.target = null; A.toast('Choose an open patch of floor, or a destination in the field journal.'); return; }
    G.target = { x, y, path };
  };

  window.addEventListener('keydown', e => {
    if (e.key === 'Tab' && G.modalOpen) return; // handled by the dialog focus trap
    if (e.key === 'Escape') { e.preventDefault(); if (G.transitioning) return; G.modalOpen ? G.escapeAction?.() : A.menu(); return; }
    if (G.modalOpen || !G.started || G.transitioning) return;
    const key = e.key.toLowerCase();
    if (movementKeys.includes(key)) e.preventDefault();
    if (key === 'e' && !e.repeat && G.nearby) A.interact(G.nearby.id);
    else { G.keys.add(key); G.target = null; }
  });
  window.addEventListener('keyup', e => G.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { G.keys.clear(); G.target = null; if (G.started) A.save(); });
  document.addEventListener('visibilitychange', () => { G.keys.clear(); if (document.hidden) { G.target = null; if (G.started) A.save(); } });
  window.addEventListener('pagehide', () => { if (G.started) A.save(); });
  A.canvas.addEventListener('pointerdown', e => {
    if (!G.started || G.modalOpen || G.transitioning) return;
    const p = A.unproject(e.clientX, e.clientY);
    A.walkTo(Math.max(35, Math.min(925, p.x)), Math.max(35, Math.min(645, p.y)));
  });
  $('interact').addEventListener('click', () => { if (G.nearby) A.interact(G.nearby.id); });

  // Per-frame movement. Keys move relative to the screen, so their floor
  // direction is rotated through the isometric projection.
  A.update = function (dt) {
    if (!G.started || G.modalOpen || G.transitioning) return;
    const p = G.state.player, keys = G.keys;
    let dx = 0, dy = 0;
    if (G.target) {
      const waypoint = G.target.path[0];
      dx = waypoint.x - p.x; dy = waypoint.y - p.y;
      if (Math.hypot(dx, dy) < .1) {
        G.target.path.shift(); dx = dy = 0;
        if (!G.target.path.length) { G.target = null; A.save(); }
      }
    } else {
      const sx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const sy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      dx = sx + sy / .48; dy = sy / .48 - sx;
    }
    const length = Math.hypot(dx, dy);
    if (length) {
      const step = Math.min(180 * dt, G.target ? length : Infinity); dx = dx / length * step; dy = dy / length * step;
      const before = { ...p };
      if (!A.blocked(p.x + dx, p.y)) p.x += dx;
      if (!A.blocked(p.x, p.y + dy)) p.y += dy;
      if (G.target && Math.hypot(p.x - before.x, p.y - before.y) < .01) { G.target = null; A.toast('The path is blocked. Choose another point or use the field journal.'); }
      if (G.time - G.lastSaved > 2) { A.save(); G.lastSaved = G.time; }
    }
    G.nearby = A.objects.filter(A.visibleObject).map(o => ({ ...o, distance: Math.hypot(o.x - p.x, o.y - p.y) })).filter(o => o.distance < 83).sort((a, b) => a.distance - b.distance)[0] || null;
    $('interaction').hidden = !G.nearby;
    if (G.nearby) $('interact-label').textContent = G.nearby.id === 'moth' && G.state.met ? 'Moth' : G.nearby.label;
    $('location').textContent = p.x > 790 ? 'THE RETURN THRESHOLD' : p.y > 465 ? 'THE LOWER STACKS' : 'THE QUIET STACKS';
  };
})();
