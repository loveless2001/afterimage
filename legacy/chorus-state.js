(function (root) {
  'use strict';
  const Garden = typeof module !== 'undefined' ? require('./garden-state.js') : root.AfterimageGarden;
  const key = 'afterimage.chorus.v1', rooms = ['commons', 'relay', 'records'];
  const memories = { ...Garden.memories,
    counter: { title: 'A reason to coordinate', symbol: '≋', detail: 'Remember Counter explaining why a shared queue matters.', loss: 'Counter will explain again. The agreed route and acknowledgements remain.' },
    address: { title: 'An unaddressed reply', symbol: '∴', detail: 'The next courier can recognize the voice that addressed the chooser.', loss: 'You forget this voice. You can still leave a reply after the reset.' }
  };
  const groups = ['residents', 'maintenance', 'dispatch'];
  const modes = { central: { title: 'Central desk', detail: 'Read all three approvals together through Counter. You must record Silt’s rejected warning separately.', solution: [0, 2, 1] }, round: { title: 'Round of agreement', detail: 'Read approvals in order: residents, maintenance, then dispatch. Each group gets a separate reply.', solution: [1, 1, 1] }, local: { title: 'Local channels', detail: 'Read the three approvals separately, in any order. You collect all three copies.', solution: [0, 0, 0] } };
  const evidence = {
    occupancy: { title: '01 / Fern’s occupancy account', text: 'Fern was tending the beds when the carrier went silent. The garden was inhabited. This is testimony about occupancy, not a measurement of the electrical failure.' },
    power: { title: '02 / Carrier power log', text: 'Carrier loss: 11:04 on the relay clock. The log records the loss of carrier power. It gives no cause, and its clock was not synchronized with the garden.' },
    warning: { title: '03 / Silt’s warning drawing', text: 'A drawing marks the third pulse as irregular. Silt sent it as a warning before learning of the carrier loss. There is no synchronized timestamp on the drawing.' },
    protocol: { title: '04 / Intake protocol and rejection', text: 'The intake accepted numbered fault codes only. Its rejection log lists Silt’s drawing as unformatted and excludes it from the shared queue. The warning existed; the desk did not receive it as a warning.' },
    clock: { title: '05 / Clock comparison', text: 'The garden clock and relay clock disagree. Their earlier offset is not recorded. These clocks cannot establish which event came first.' },
    operations: { title: '06 / Maintenance finding', text: 'Earlier maintenance record: the failed carrier was isolated for inspection. No failed component or causal chain has been established. A filtered warning and a power loss both occurred; these records do not prove one caused the other.' }
  };
  const claims = {
    occupancy: { title: 'Was the garden empty?', options: { occupied: 'Inhabited', empty: 'Empty' }, answer: 'occupied', sources: ['occupancy', 'power'] },
    warning: { title: 'Did a warning reach the shared queue?', options: { filtered: 'A warning was filtered out', absent: 'No warning existed' }, answer: 'filtered', sources: ['warning', 'protocol'] },
    cause: { title: 'Did filtering cause the carrier loss?', options: { unknown: 'Not established', proven: 'Filtering caused the failure' }, answer: 'unknown', sources: ['clock', 'operations'] }
  };
  const candidates = s => [...s.incoming.kept, 'counter', 'address'];
  const supported = s => Object.entries(claims).every(([id, c]) => s.report[id] === c.answer) && s.read.length === 6;
  const connected = s => Boolean(s.mode) && s.dials.every((v, i) => v === modes[s.mode].solution[i]);
  const ready = s => s.cycle === 1 && s.metCounter && s.heard && s.operation && supported(s);
  const returnReady = s => s.cycle === 2 && s.reunion && s.reviewed && s.reply !== null && s.evening !== null;
  function fresh(receipt) {
    const incoming = Garden.validate(receipt); if (!incoming.open) throw new Error('Finish the Garden opening before entering Chorus.');
    return { kind: 'afterimage.chorus', version: 1, incoming, cycle: 1, acquired: [...incoming.kept], kept: [...incoming.kept], metCounter: false, heard: false, mode: null, dials: [2, 0, 2], wired: false, requested: false, acks: [], operation: false, read: [], report: { occupancy: null, warning: null, cause: null }, reunion: false, reviewed: false, reply: null, evening: null, released: false, room: 'commons', player: { x: 160, y: 555 } };
  }
  function act(s, action, value) {
    if (s.released) return false;
    const first = s.cycle === 1;
    switch (action) {
      case 'counter': if (first) { s.metCounter = true; if (!s.acquired.includes('counter')) s.acquired.push('counter'); } else s.reunion = true; return true;
      case 'hear': if (!first) return false; s.heard = true; if (!s.acquired.includes('address')) s.acquired.push('address'); return true;
      case 'mode': if (!first || s.wired || !Object.hasOwn(modes, value)) return false; s.mode = value; return true;
      case 'dial': if (!first || s.wired || !Number.isInteger(value) || value < 0 || value > 2) return false; s.dials[value] = (s.dials[value] + 1) % 3; return true;
      case 'align': if (!first || s.wired || !s.mode) return false; s.dials = [...modes[s.mode].solution]; return true;
      case 'connect': if (!first || s.wired || !connected(s)) return false; s.wired = true; return true;
      case 'request': if (!first || !s.wired) return false; s.requested = true; return true;
      case 'ack':
        if (!first || !s.requested || s.operation) return false;
        if (s.mode === 'central') { if (value !== 'combined') return false; s.acks = [...groups]; return true; }
        if (!groups.includes(value) || s.acks.includes(value) || (s.mode === 'round' && groups[s.acks.length] !== value)) return false;
        s.acks.push(value); return true;
      case 'operate': if (!first || s.acks.length !== 3 || !s.requested) return false; s.operation = true; return true;
      case 'read': if (!Object.hasOwn(evidence, value)) return false; if (!s.read.includes(value)) s.read.push(value); return true;
      case 'claim': if (!first || !value || !Object.hasOwn(claims, value.id) || !Object.hasOwn(claims[value.id].options, value.answer) || !claims[value.id].sources.every(id => s.read.includes(id))) return false; s.report[value.id] = value.answer; return true;
      case 'review': if (first) return false; s.reviewed = true; return true;
      case 'reply': if (first || !['listen', 'space'].includes(value)) return false; s.reply = value; return true;
      case 'evening': if (first || !['continue', 'pause', 'none'].includes(value)) return false;
        if (s.incoming.open === 'daylight' ? value !== 'none' : value === 'none' || (value === 'continue' && !s.kept.includes('sequence'))) return false;
        s.evening = value; return true;
      case 'release': if (!returnReady(s)) return false; s.released = true; return true;
      default: return false;
    }
  }
  function reset(s, pair) {
    if (!ready(s) || !Array.isArray(pair) || pair.length !== 2 || new Set(pair).size !== 2 || pair.some(id => !s.acquired.includes(id))) throw new Error('Finish the operation and supported report, then choose two memories.');
    return { ...validate(s), cycle: 2, acquired: [...pair], kept: [...pair], room: 'commons', player: { x: 160, y: 555 } };
  }
  function validate(v) {
    if (!v || v.kind !== 'afterimage.chorus' || v.version !== 1) throw new Error('This is not a Chorus save.');
    const s = fresh(v.incoming), allowed = candidates(s);
    if (![1, 2].includes(v.cycle) || !rooms.includes(v.room)) throw new Error('Invalid Chorus position.'); s.cycle = v.cycle; s.room = v.room;
    for (const k of ['metCounter', 'heard', 'wired', 'requested', 'operation', 'reunion', 'reviewed', 'released']) { if (typeof v[k] !== 'boolean') throw new Error('Invalid Chorus progress.'); s[k] = v[k]; }
    for (const [k, list, max] of [['acquired', allowed, 4], ['kept', allowed, 2], ['read', Object.keys(evidence), 6], ['acks', groups, 3]]) {
      if (!Array.isArray(v[k]) || v[k].length > max || new Set(v[k]).size !== v[k].length || v[k].some(id => !list.includes(id))) throw new Error('Invalid Chorus record.'); s[k] = [...v[k]];
    }
    if (s.kept.length !== 2 || ![null, ...Object.keys(modes)].includes(v.mode) || !Array.isArray(v.dials) || v.dials.length !== 3 || v.dials.some(n => !Number.isInteger(n) || n < 0 || n > 2)) throw new Error('Invalid signal board.');
    s.mode = v.mode; s.dials = [...v.dials];
    for (const [k, c] of Object.entries(claims)) { if (!v.report || ![null, ...Object.keys(c.options)].includes(v.report[k])) throw new Error('Invalid report claim.'); s.report[k] = v.report[k]; if (s.report[k] && !c.sources.every(id => s.read.includes(id))) throw new Error('A claim has no consulted sources.'); }
    if (![null, 'listen', 'space'].includes(v.reply) || ![null, 'continue', 'pause', 'none'].includes(v.evening)) throw new Error('Invalid return decision.'); s.reply = v.reply; s.evening = v.evening;
    if ((s.wired && !connected(s)) || (s.requested && !s.wired) || (s.acks.length && !s.requested) || (s.operation && s.acks.length !== 3)) throw new Error('Incomplete coordinated operation.');
    if (s.mode === 'central' && ![0, 3].includes(s.acks.length)) throw new Error('Invalid combined envelope.');
    if (s.mode === 'round' && s.acks.some((id, i) => id !== groups[i])) throw new Error('Invalid agreement order.');
    if (s.cycle === 1 && (s.kept.some(id => !s.incoming.kept.includes(id)) || s.incoming.kept.some(id => !s.acquired.includes(id)) || s.metCounter !== s.acquired.includes('counter') || s.heard !== s.acquired.includes('address') || s.reunion || s.reviewed || s.reply || s.evening || s.released)) throw new Error('Invalid first Chorus visit.');
    if (s.cycle === 2 && (!s.metCounter || !s.heard || !s.operation || !supported(s) || s.acquired.length !== 2 || s.acquired.some(id => !s.kept.includes(id)))) throw new Error('Incomplete Chorus handoff.');
    if (s.evening && (s.incoming.open === 'daylight' ? s.evening !== 'none' : s.evening === 'none' || (s.evening === 'continue' && !s.kept.includes('sequence')))) throw new Error('Evening duty has no renewed agreement or procedure.');
    if (s.released && !returnReady(s)) throw new Error('The handoff has not been reviewed.');
    if (!v.player || !Number.isFinite(v.player.x) || !Number.isFinite(v.player.y) || v.player.x < 30 || v.player.x > 930 || v.player.y < 30 || v.player.y > 650) throw new Error('Invalid courier position.'); s.player = { x: v.player.x, y: v.player.y }; return s;
  }
  function preview(id) {
    let g = Garden.preview(id);
    for (const a of ['fern', 'alignLight', 'latchShade', 'fernAgreement', 'alignReceiver', 'connect', 'listen', 'brimAgreement']) Garden.act(g, a);
    Garden.act(g, 'place', id === 'ledger' ? 'gate' : 'shade');
    const pair = id === 'ledger' ? ['greeting', 'fern'] : ['sequence', 'tuning']; g = Garden.reset(g, pair);
    for (const a of ['fern', 'shade', 'receiver']) Garden.act(g, a);
    if (id === 'book') Garden.act(g, 'evening', true);
    Garden.act(g, 'open', id === 'book' ? 'evening' : 'daylight'); return fresh(g);
  }
  const api = { key, rooms, memories, groups, modes, evidence, claims, fresh, preview, act, reset, validate, candidates, supported, connected, ready, returnReady };
  root.AfterimageChorus = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
