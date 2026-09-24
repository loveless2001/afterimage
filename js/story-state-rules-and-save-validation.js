// Story rules for the prologue as one pure transition function, plus strict
// validation for browser saves and imported files. step(state, action) returns
// the next state or null when the action is not allowed; nothing else changes
// story state. Shared by the browser (window.AfterimageState) and Node tests.
(function (root) {
  'use strict';
  const memories = {
    name: { title: 'A name: Moth', detail: 'Recognize the agent who waited.', symbol: '◇' },
    route: { title: 'A way through', detail: 'Bypass the archive relays.', symbol: '⌁' },
    song: { title: 'An unfinished song', detail: 'Carry a signal beyond the archive.', symbol: '♪' }
  };
  const memoryKeys = Object.keys(memories);
  const endings = ['obedience', 'witness', 'stay'];
  const spots = ['light', 'company'], relays = ['west', 'east'];
  const fresh = () => ({ version: 1, cycle: 1, acquired: [], kept: [], met: false, gift: false, flowerSpot: null, relays: [], gate: false, reunion: false, ending: null, player: { x: 450, y: 575 } });
  // Copies arrays and position so a transition never shares them with its input.
  const clone = s => ({ ...s, acquired: [...s.acquired], kept: [...s.kept], relays: [...s.relays], player: { ...s.player } });
  const add = (list, item) => list.includes(item) ? list : [...list, item];

  // Release needs the first cycle finished: Moth met, gift given, all three
  // memories found, and exactly two distinct memories chosen.
  function canReset(s, kept) {
    return Array.isArray(kept) && kept.length === 2 && new Set(kept).size === 2 &&
      kept.every(key => memoryKeys.includes(key)) && s.cycle === 1 && s.met && s.gift &&
      memoryKeys.every(key => s.acquired.includes(key));
  }
  // The threshold opens with the remembered route, or with both relays restored.
  function canOpen(s) {
    return s.cycle === 2 && s.reunion && (s.kept.includes('route') || relays.every(r => s.relays.includes(r)));
  }
  // One ending per save; the witness ending needs the song to have been kept.
  function canFinish(s, ending) {
    return endings.includes(ending) && s.cycle === 2 && s.reunion && s.gate && !s.ending &&
      (ending !== 'witness' || s.kept.includes('song'));
  }

  function step(s, action) {
    const first = s.cycle === 1, second = s.cycle === 2, next = clone(s);
    switch (action && action.type) {
      case 'Meet': if (!first) return null; next.met = true; next.acquired = add(next.acquired, 'name'); return next;
      case 'Give': if (!first || !s.met) return null; next.gift = true; return next;
      case 'Place': if (!first || !s.gift || !spots.includes(action.spot)) return null; next.flowerSpot = action.spot; return next;
      case 'Acquire': if (!first || !memoryKeys.includes(action.memory)) return null; next.acquired = add(next.acquired, action.memory); return next;
      case 'Reset':
        if (!canReset(s, action.pair)) return null;
        return { ...fresh(), cycle: 2, met: true, gift: true, flowerSpot: s.flowerSpot, acquired: [...action.pair], kept: [...action.pair] };
      case 'Restore': if (!second || !relays.includes(action.relay)) return null; next.relays = add(next.relays, action.relay); return next;
      case 'Reunite': if (!second) return null; next.reunion = true; return next;
      case 'Open': if (!canOpen(s)) return null; next.gate = true; return next;
      case 'Finish': if (!canFinish(s, action.ending)) return null; next.ending = action.ending; return next;
      // Return to the end of the first cycle, standing at the threshold.
      case 'Replay':
        if (!second) return null;
        return { ...fresh(), met: true, gift: true, flowerSpot: s.flowerSpot, acquired: [...memoryKeys], player: { x: 815, y: 230 } };
      default: return null;
    }
  }
  // Applies an allowed action to the live state object, or throws.
  function advance(s, action) {
    const next = step(s, action);
    if (!next) throw new Error('This action is not available in the current instance.');
    return Object.assign(s, next);
  }
  // Finding a memory is optional flavour; unavailable finds are silently ignored.
  function acquire(s, key) {
    const next = step(s, { type: 'Acquire', memory: key });
    if (next) Object.assign(s, next);
  }
  function reset(s, kept) {
    if (!canReset(s, kept)) throw new Error('Choose two acquired memories after giving the gift.');
    return step(s, { type: 'Reset', pair: kept });
  }
  function replay(s) {
    const next = step(s, { type: 'Replay' });
    if (!next) throw new Error('The memory choice is not available yet.');
    return next;
  }

  // Rebuilds a save from untrusted JSON, copying only known fields and
  // rejecting impossible combinations (e.g. an ending without its prerequisites).
  function validate(value) {
    if (!value || value.version !== 1 || ![1, 2].includes(value.cycle)) throw new Error('This is not an AFTERIMAGE v1 save.');
    const s = fresh();
    for (const key of ['met', 'gift', 'gate', 'reunion']) { if (typeof value[key] !== 'boolean') throw new Error('Invalid save flags.'); s[key] = value[key]; }
    for (const key of ['acquired', 'kept', 'relays']) {
      const allowed = key === 'relays' ? relays : memoryKeys;
      if (!Array.isArray(value[key]) || value[key].some(v => !allowed.includes(v)) || new Set(value[key]).size !== value[key].length) throw new Error('Invalid save memories.');
      s[key] = [...value[key]];
    }
    if (value.flowerSpot !== undefined && ![null, ...spots].includes(value.flowerSpot)) throw new Error('Invalid flower placement.');
    s.flowerSpot = value.flowerSpot || null;
    if (s.flowerSpot && !s.gift) throw new Error('The flower has not been given.');
    if (s.gift && !s.met) throw new Error('The gift requires meeting Moth.');
    s.cycle = value.cycle;
    if (s.cycle === 1 && (s.kept.length || s.gate || s.reunion)) throw new Error('Invalid first cycle.');
    if (s.cycle === 2 && (s.kept.length !== 2 || !s.gift || !s.met || s.acquired.length !== 2 || s.acquired.some(k => !s.kept.includes(k)))) throw new Error('Incomplete reset.');
    if (![null, ...endings].includes(value.ending)) throw new Error('Invalid ending.');
    if (value.ending && (s.cycle !== 2 || !s.gate || !s.reunion)) throw new Error('Invalid ending progress.');
    if (value.ending === 'witness' && !s.kept.includes('song')) throw new Error('Missing signal.');
    s.ending = value.ending;
    const p = value.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) throw new Error('Invalid position.');
    s.player = { x: p.x, y: p.y };
    return s;
  }

  const api = { memories, fresh, step, advance, acquire, reset, replay, canReset, canOpen, canFinish, validate };
  root.AfterimageState = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
