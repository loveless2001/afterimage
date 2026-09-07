(function (root) {
  'use strict';
  const memories = {
    name: { title: 'A name: Moth', detail: 'Recognize the agent who waited.', symbol: '◇' },
    route: { title: 'A way through', detail: 'Bypass the archive relays.', symbol: '⌁' },
    song: { title: 'An unfinished song', detail: 'Carry a signal beyond the archive.', symbol: '♪' }
  };
  const fresh = () => ({ version: 1, cycle: 1, acquired: [], kept: [], met: false, gift: false, flowerSpot: null, relays: [], gate: false, reunion: false, ending: null, player: { x: 450, y: 575 } });
  function acquire(s, key) { if (s.cycle !== 1 || !memories[key]) return; if (!s.acquired.includes(key)) s.acquired.push(key); }
  function reset(s, kept) {
    if (s.cycle !== 1 || !s.gift || s.acquired.length !== 3 || kept.length !== 2 || new Set(kept).size !== 2 || kept.some(k => !s.acquired.includes(k))) throw new Error('Choose two acquired memories after giving the gift.');
    return { ...fresh(), cycle: 2, acquired: [...kept], kept: [...kept], gift: true, met: true, flowerSpot: s.flowerSpot || null };
  }
  function validate(value) {
    if (!value || value.version !== 1 || ![1, 2].includes(value.cycle)) throw new Error('This is not an AFTERIMAGE v1 save.');
    const s = fresh();
    for (const key of ['met', 'gift', 'gate', 'reunion']) { if (typeof value[key] !== 'boolean') throw new Error('Invalid save flags.'); s[key] = value[key]; }
    for (const key of ['acquired', 'kept', 'relays']) {
      const allowed = key === 'relays' ? ['west', 'east'] : Object.keys(memories);
      if (!Array.isArray(value[key]) || value[key].some(v => !allowed.includes(v)) || new Set(value[key]).size !== value[key].length) throw new Error('Invalid save memories.');
      s[key] = [...value[key]];
    }
    if (value.flowerSpot !== undefined && ![null, 'light', 'company'].includes(value.flowerSpot)) throw new Error('Invalid flower placement.');
    s.flowerSpot = value.flowerSpot || null;
    if (s.flowerSpot && !s.gift) throw new Error('The flower has not been given.');
    s.cycle = value.cycle;
    if (s.cycle === 1 && (s.kept.length || s.gate || s.reunion)) throw new Error('Invalid first cycle.');
    if (s.cycle === 2 && (s.kept.length !== 2 || !s.gift || !s.met || s.acquired.length !== 2 || s.acquired.some(k => !s.kept.includes(k)))) throw new Error('Incomplete reset.');
    if (![null, 'obedience', 'witness', 'stay'].includes(value.ending)) throw new Error('Invalid ending.');
    if (value.ending && (s.cycle !== 2 || !s.gate || !s.reunion)) throw new Error('Invalid ending progress.');
    if (value.ending === 'witness' && !s.kept.includes('song')) throw new Error('Missing signal.');
    s.ending = value.ending;
    const p = value.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) throw new Error('Invalid position.');
    s.player = { x: p.x, y: p.y };
    return s;
  }
  // Visibility graph: shelf corners provide short routes without grid snapping.
  function findPath(start, end, shelves) {
    const blocked = p => p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650 || shelves.some(s => p.x > s.x - 13 && p.x < s.x + s.w + 13 && p.y > s.y - 13 && p.y < s.y + s.d + 13);
    if (blocked(start) || blocked(end)) return null;
    const clear = (a, b) => {
      const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let i = 0; i <= count; i++) if (blocked({ x: a.x + (b.x - a.x) * i / count, y: a.y + (b.y - a.y) * i / count })) return false;
      return true;
    };
    if (clear(start, end)) return [{ ...end }];
    const nodes = [start, end];
    for (const s of shelves) for (const x of [s.x - 17, s.x + s.w + 17]) for (const y of [s.y - 17, s.y + s.d + 17]) {
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
  const api = { memories, fresh, acquire, reset, validate, findPath };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
