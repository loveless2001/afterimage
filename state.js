(function (root) {
  'use strict';
  const Core = root.AfterimageCore || (typeof require === 'function' && (require('./bend-core.js'), root.AfterimageCore));
  if (!Core) throw new Error('The Bend game core must load before state.js.');
  const memories = {
    name: { title: 'A name: Moth', detail: 'Recognize the agent who waited.', symbol: '◇' },
    route: { title: 'A way through', detail: 'Bypass the archive relays.', symbol: '⌁' },
    song: { title: 'An unfinished song', detail: 'Carry a signal beyond the archive.', symbol: '♪' }
  };
  const memoryBits = { name: 1, route: 2, song: 4 };
  const endingCodes = { obedience: 1, witness: 2, stay: 3 };
  const fresh = () => ({ version: 1, cycle: 1, acquired: [], kept: [], met: false, gift: false, flowerSpot: null, relays: [], gate: false, reunion: false, ending: null, player: { x: 450, y: 575 } });
  function mask(keys, choices) { return keys.reduce((bits, key) => bits | (choices[key] || 0), 0); }
  function encode(s) {
    return mask(s.acquired, memoryBits) | (mask(s.kept, memoryBits) << 3) |
      (s.cycle === 2 ? 64 : 0) | (s.met ? 128 : 0) | (s.gift ? 256 : 0) |
      (s.flowerSpot === 'light' ? 512 : s.flowerSpot === 'company' ? 1024 : 0) |
      (s.relays.includes('west') ? 2048 : 0) | (s.relays.includes('east') ? 4096 : 0) |
      (s.reunion ? 8192 : 0) | (s.gate ? 16384 : 0) |
      (s.ending ? 1 << (endingCodes[s.ending] + 14) : 0);
  }
  function ordered(bits, prior, choices) {
    const kept = prior.filter(key => bits & choices[key]);
    for (const key of Object.keys(choices)) if ((bits & choices[key]) && !kept.includes(key)) kept.push(key);
    return kept;
  }
  function decode(bits, prior) {
    return { ...prior, cycle: bits & 64 ? 2 : 1,
      acquired: ordered(bits & 7, prior.acquired, memoryBits),
      kept: ordered((bits >> 3) & 7, prior.kept, memoryBits),
      met: Boolean(bits & 128), gift: Boolean(bits & 256),
      flowerSpot: bits & 512 ? 'light' : bits & 1024 ? 'company' : null,
      relays: ordered((bits >> 11) & 3, prior.relays, { west: 1, east: 2 }),
      reunion: Boolean(bits & 8192), gate: Boolean(bits & 16384),
      ending: bits & 32768 ? 'obedience' : bits & 65536 ? 'witness' : bits & 131072 ? 'stay' : null };
  }
  function action(kind, field, value) { return field ? { $: kind, [field]: value } : { $: kind }; }
  function step(s, kind, field, value) { return Core.step(encode(s), action(kind, field, value)); }
  function advance(s, kind, field, value) {
    const result = step(s, kind, field, value);
    if (result.$ !== 'Some') throw new Error('This action is not available in the current instance.');
    Object.assign(s, decode(result.value, s));
    return s;
  }
  function acquire(s, key) {
    if (!memoryBits[key]) return;
    const result = step(s, 'Acquire', 'memory', memoryBits[key]);
    if (result.$ === 'Some') Object.assign(s, decode(result.value, s));
  }
  function canReset(s, kept) {
    return Array.isArray(kept) && kept.length === 2 && new Set(kept).size === 2 &&
      kept.every(key => memoryBits[key] && s.acquired.includes(key)) &&
      Core.can_reset(encode(s), mask(kept, memoryBits));
  }
  function reset(s, kept) {
    if (!canReset(s, kept)) throw new Error('Choose two acquired memories after giving the gift.');
    const result = step(s, 'Reset', 'pair', mask(kept, memoryBits));
    const next = decode(result.value, fresh());
    next.acquired = [...kept]; next.kept = [...kept];
    return next;
  }
  function canOpen(s) { return Core.can_open(encode(s)); }
  function canFinish(s, ending) { return Boolean(endingCodes[ending]) && Core.can_finish(encode(s), endingCodes[ending]); }
  function replay(s) {
    const result = step(s, 'Replay');
    if (result.$ !== 'Some') throw new Error('The memory choice is not available yet.');
    return { ...decode(result.value, fresh()), player: { x: 815, y: 230 } };
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
    if (s.gift && !s.met) throw new Error('The gift requires meeting Moth.');
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
  const api = { memories, fresh, acquire, reset, validate, findPath, advance, canReset, canOpen, canFinish, replay };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
