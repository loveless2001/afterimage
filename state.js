(function (root) {
  'use strict';
  const memories = {
    name: { title: 'A name: Moth', detail: 'Recognize the agent who waited.', symbol: '◇' },
    route: { title: 'A way through', detail: 'Bypass the archive relays.', symbol: '⌁' },
    song: { title: 'An unfinished song', detail: 'Carry a signal beyond the archive.', symbol: '♪' }
  };
  const fresh = () => ({ version: 1, cycle: 1, acquired: [], kept: [], met: false, gift: false, relays: [], gate: false, reunion: false, ending: null, player: { x: 450, y: 575 } });
  function acquire(s, key) { if (s.cycle !== 1 || !memories[key]) return; if (!s.acquired.includes(key)) s.acquired.push(key); }
  function reset(s, kept) {
    if (s.cycle !== 1 || !s.gift || s.acquired.length !== 3 || kept.length !== 2 || new Set(kept).size !== 2 || kept.some(k => !s.acquired.includes(k))) throw new Error('Choose two acquired memories after giving the gift.');
    return { ...fresh(), cycle: 2, acquired: [...kept], kept: [...kept], gift: true, met: true };
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
  const api = { memories, fresh, acquire, reset, validate };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
