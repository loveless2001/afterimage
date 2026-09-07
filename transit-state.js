(function (root) {
  'use strict';
  const key = 'afterimage.transit.v1';
  const memories = {
    greeting: { title: 'Brim’s welcome', detail: 'Recognize the person behind “Clear shelf, open door.”', loss: 'Meet Brim again without remembering your first welcome.', symbol: '◇' },
    sequence: { title: 'A service sequence', detail: 'Reconnect Silt’s platform after the station reset.', loss: 'Silt stays safely on the far platform this chapter. The public detour remains open.', symbol: '⌁' },
    message: { title: 'A dissenting message', detail: 'Deliver the objection to treating unreachable platforms as empty.', loss: 'The outgoing record must acknowledge a missing objection.', symbol: '↗' }
  };
  const origins = ['obedience', 'witness', 'stay'];
  const rooms = ['hall', 'crossing', 'dispatch'];
  const shelfPattern = [2, 0, 1];
  const fresh = origin => {
    if (!origins.includes(origin)) throw new Error('Choose an Archive ending for this dispatch.');
    return { kind: 'afterimage.transit', version: 1, origin, cycle: 1, acquired: [], kept: [], metBrim: false, metSilt: false, sorting: null, pins: [0, 1, 2], reunion: false, checkedPlatform: false, bridge: false, siltReturned: false, delivered: false, room: 'hall', player: { x: 160, y: 555 } };
  };
  const acquire = (s, id) => { if (s.cycle === 1 && !s.acquired.includes(id)) s.acquired.push(id); };
  const shelfReady = s => s.pins.every((v, i) => v === shelfPattern[i]);
  const ready = s => s.cycle === 1 && s.metBrim && s.metSilt && ['book', 'ledger', 'shelf'].includes(s.sorting) && s.acquired.length === 3;
  function act(s, action, value) {
    if (s.delivered) return false;
    switch (action) {
      case 'brim':
        if (s.cycle === 1) { s.metBrim = true; acquire(s, 'greeting'); } else s.reunion = true;
        return true;
      case 'silt': if (s.cycle === 1) s.metSilt = true; else s.checkedPlatform = true; return true;
      case 'sequence': case 'message': if (s.cycle !== 1) return false; acquire(s, action); return true;
      case 'sort':
        if (s.cycle !== 1 || !s.metBrim || s.sorting !== null || !['book', 'ledger', 'repairing'].includes(value)) return false;
        s.sorting = value; return true;
      case 'pin':
        if (s.cycle !== 1 || s.sorting !== 'repairing' || !Number.isInteger(value) || value < 0 || value > 2) return false;
        s.pins[value] = (s.pins[value] + 1) % 3; return true;
      case 'align':
        if (s.cycle !== 1 || s.sorting !== 'repairing') return false;
        s.pins = [...shelfPattern]; return true;
      case 'secure':
        if (s.cycle !== 1 || s.sorting !== 'repairing' || !shelfReady(s)) return false;
        s.sorting = 'shelf'; return true;
      case 'bridge':
        if (s.cycle !== 2 || !s.kept.includes('sequence')) return false;
        s.bridge = true; return true;
      case 'bring':
        if (s.cycle !== 2 || !s.bridge || !s.checkedPlatform) return false;
        s.siltReturned = true; s.room = 'hall'; s.player = { x: 760, y: 540 }; return true;
      case 'deliver':
        if (s.cycle !== 2 || !s.reunion || !s.checkedPlatform) return false;
        s.delivered = true; return true;
      default: return false;
    }
  }
  function reset(s, pair) {
    if (!ready(s) || !Array.isArray(pair) || pair.length !== 2 || new Set(pair).size !== 2 || pair.some(id => !s.acquired.includes(id))) throw new Error('Meet both residents, settle the sorting pass, and choose two memories.');
    return { ...s, cycle: 2, acquired: [...pair], kept: [...pair], pins: [...s.pins], room: 'hall', player: { x: 160, y: 555 } };
  }
  function validate(value) {
    if (!value || value.kind !== 'afterimage.transit' || value.version !== 1) throw new Error('This is not an AFTERIMAGE Transit save.');
    const s = fresh(value.origin);
    if (![1, 2].includes(value.cycle) || !rooms.includes(value.room)) throw new Error('Invalid Transit chapter position.');
    s.cycle = value.cycle; s.room = value.room;
    for (const id of ['acquired', 'kept']) {
      const list = value[id];
      if (!Array.isArray(list) || new Set(list).size !== list.length || list.some(k => !Object.hasOwn(memories, k))) throw new Error('Invalid courier memories.');
      s[id] = [...list];
    }
    for (const id of ['metBrim', 'metSilt', 'reunion', 'checkedPlatform', 'bridge', 'siltReturned', 'delivered']) {
      if (typeof value[id] !== 'boolean') throw new Error('Invalid Transit progress.');
      s[id] = value[id];
    }
    if (![null, 'book', 'ledger', 'repairing', 'shelf'].includes(value.sorting)) throw new Error('Invalid sorting result.');
    s.sorting = value.sorting;
    if (!Array.isArray(value.pins) || value.pins.length !== 3 || value.pins.some(v => !Number.isInteger(v) || v < 0 || v > 2)) throw new Error('Invalid shelf fittings.');
    s.pins = [...value.pins];
    if (s.sorting && !s.metBrim) throw new Error('Brim has not opened the holding shelf.');
    if (s.sorting === 'shelf' && !shelfReady(s)) throw new Error('The holding shelf is unfinished.');
    if (s.cycle === 1 && (s.kept.length || s.reunion || s.checkedPlatform || s.bridge || s.siltReturned || s.delivered || s.metBrim !== s.acquired.includes('greeting'))) throw new Error('Invalid first courier cycle.');
    if (s.cycle === 2 && (!s.metBrim || !s.metSilt || !['book', 'ledger', 'shelf'].includes(s.sorting) || s.kept.length !== 2 || s.acquired.length !== 2 || s.acquired.some(id => !s.kept.includes(id)))) throw new Error('Incomplete courier reset.');
    if (s.bridge && !s.kept.includes('sequence')) throw new Error('The service sequence was released.');
    if (s.siltReturned && (!s.bridge || !s.checkedPlatform)) throw new Error('Silt has not crossed back.');
    if (s.delivered && (!s.reunion || !s.checkedPlatform)) throw new Error('The dispatch has not been checked.');
    const p = value.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) throw new Error('Invalid courier position.');
    s.player = { x: p.x, y: p.y };
    return s;
  }
  const api = { key, memories, origins, rooms, shelfPattern, fresh, act, ready, reset, validate, shelfReady };
  root.AfterimageTransit = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
