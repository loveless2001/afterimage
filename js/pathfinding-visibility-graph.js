// Walking routes for the isometric archive. A visibility graph over shelf
// corners gives short, natural paths without snapping to a grid. Shared by the
// browser game (window.AfterimagePath) and the Node tests (module.exports).
(function (root) {
  'use strict';
  // Floor bounds and the collision margin kept around every shelf.
  const floor = { minX: 30, maxX: 930, minY: 30, maxY: 650 }, margin = 13, cornerOffset = 17;

  // True when a floor point is off the floor or inside a shelf's margin.
  function isBlocked(p, shelves) {
    return p.x < floor.minX || p.x > floor.maxX || p.y < floor.minY || p.y > floor.maxY ||
      shelves.some(s => p.x > s.x - margin && p.x < s.x + s.w + margin && p.y > s.y - margin && p.y < s.y + s.d + margin);
  }

  // Returns waypoints from start to end (end included), or null when either
  // point is blocked or no route exists. Dijkstra over start, end and corners.
  function findPath(start, end, shelves) {
    const blocked = p => isBlocked(p, shelves);
    if (blocked(start) || blocked(end)) return null;
    const clear = (a, b) => {
      const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let i = 0; i <= count; i++) if (blocked({ x: a.x + (b.x - a.x) * i / count, y: a.y + (b.y - a.y) * i / count })) return false;
      return true;
    };
    if (clear(start, end)) return [{ ...end }];
    const nodes = [start, end];
    for (const s of shelves) for (const x of [s.x - cornerOffset, s.x + s.w + cornerOffset]) for (const y of [s.y - cornerOffset, s.y + s.d + cornerOffset]) {
      if (!blocked({ x, y })) nodes.push({ x, y });
    }
    const distance = nodes.map(() => Infinity), previous = [], visited = new Set();
    distance[0] = 0;
    while (visited.size < nodes.length) {
      let at = -1;
      for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (at < 0 || distance[i] < distance[at])) at = i;
      if (at < 0 || !Number.isFinite(distance[at])) return null;
      if (at === 1) {
        const path = [];
        for (let i = 1; i !== 0; i = previous[i]) path.unshift({ ...nodes[i] });
        return path;
      }
      visited.add(at);
      for (let i = 0; i < nodes.length; i++) {
        if (visited.has(i) || !clear(nodes[at], nodes[i])) continue;
        const next = distance[at] + Math.hypot(nodes[i].x - nodes[at].x, nodes[i].y - nodes[at].y);
        if (next < distance[i]) { distance[i] = next; previous[i] = at; }
      }
    }
    return null;
  }

  const api = { findPath, isBlocked };
  root.AfterimagePath = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
