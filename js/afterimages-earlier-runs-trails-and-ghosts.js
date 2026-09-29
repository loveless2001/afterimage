// Afterimages: faint figures retracing your earlier runs. While you move, each
// run's path is sampled every 0.25 s of play (x, y rounded), and a pause is
// noted wherever you use something; earlier runs then replay at that pace, on
// a loop. Trails are cosmetic and live under their own storage key, outside the
// validated save, so a missing or damaged trail can never break a save. A new
// game or an import clears them, a run that starts afresh starts a fresh trail,
// and a revisited run carries on its own. Under reduced motion each
// afterimage stands where its run ended.
(function (root) {
  'use strict';
  const step = .25, cap = 400, hold = 5, rest = 8; // a pause holds 5 steps; a loop rests 8 at its end

  // Where a trail's figure stands after `steps` steps of its loop. Points are
  // [x, y] or [x, y, 1] for a pause; the figure glides between points, holds at
  // pauses, and rests at the end before starting over.
  function trailPosition(trail, steps) {
    const length = trail.reduce((sum, p) => sum + (p[2] ? hold : 1), 0);
    let s = ((steps % (length + rest)) + length + rest) % (length + rest);
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i], span = p[2] ? hold : 1, next = trail[i + 1];
      if (s < span) return p[2] || !next ? { x: p[0], y: p[1] } : { x: p[0] + (next[0] - p[0]) * s, y: p[1] + (next[1] - p[1]) * s };
      s -= span;
    }
    const last = trail[trail.length - 1];
    return { x: last[0], y: last[1] };
  }
  // Keeps a long trail under the cap by dropping every other plain point; pauses stay.
  const thin = trail => trail.length > cap ? trail.filter((p, i) => i % 2 === 0 || p[2]) : trail;
  const validTrail = t => Array.isArray(t) && t.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));

  const api = { step, trailPosition, thin, validTrail };
  if (typeof module !== 'undefined') { module.exports = api; return; }

  const A = root.Afterimage, G = A.game, key = A.room.storageKey + '.trails'; // Room 07: afterimage.v2.trails
  let trails = {}, clock = 0, dirty = false;
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); if (saved && typeof saved === 'object') trails = saved; } catch (_) { /* cosmetic: start empty */ }
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(trails)); } catch (_) { /* cosmetic: skip */ } dirty = false; };
  const add = point => { const run = G.state.run; trails[run] = thin([...(validTrail(trails[run]) ? trails[run] : []), point]); dirty = true; };
  const here = () => [Math.round(G.state.player.x), Math.round(G.state.player.y)];

  A.trails = {
    // Each frame the player can move; samples only while they actually move
    // (pressing into a wall adds nothing).
    record(dt, moved) {
      clock += dt; if (!moved || clock < step) return; clock = 0;
      const p = here(), last = trails[G.state.run]?.at?.(-1);
      if (!last || last[0] !== p[0] || last[1] !== p[1]) add(p);
    },
    // Using something leaves a pause in the trail.
    mark() { add([...here(), 1]); },
    // A run starting (again) begins a fresh trail.
    begin(run) { delete trails[run]; dirty = true; },
    save() { if (dirty) persist(); },
    reset() { trails = {}; persist(); },
    // Earlier runs' figures now: [{ x, y, fade }], the most recent run the clearest.
    ghosts(state) {
      return Object.keys(trails).map(Number).filter(run => run >= 1 && (run < state.run || (state.finished && run === state.run)) && validTrail(trails[run]) && trails[run].length > 1)
        .map(run => {
          const trail = trails[run], at = A.reducedMotion ? { x: trail.at(-1)[0], y: trail.at(-1)[1] } : trailPosition(trail, G.time / step + run * 37);
          return { ...at, fade: .12 + .2 * Math.max(0, 1 - (state.run - run - 1) / 5) };
        });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
