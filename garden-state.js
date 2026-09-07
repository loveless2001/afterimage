(function (root) {
  'use strict';
  const Transit = typeof module !== 'undefined' ? require('./transit-state.js') : root.AfterimageTransit;
  const key = 'afterimage.garden.v1';
  const memories = {
    greeting: { title: 'Brim’s welcome', symbol: '◇', detail: 'Recognize Brim when the receiver carries their greeting.', loss: 'Brim will introduce themself again. Their upkeep agreement remains on the record.' },
    sequence: { title: 'A service sequence', symbol: '⌁', detail: 'Use the station’s shared controller sequence to open the garden after dusk.', loss: 'The garden can reopen in daylight. Its evening controller will remain off.' },
    message: { title: 'A dissenting message', symbol: '↗', detail: 'Remember reading the objection to calling unreachable places empty.', loss: 'The delivered objection stays in the incoming record, if attached. Your experience of reading its original page does not continue.' },
    fern: { title: 'An invitation without a task', symbol: '❧', detail: 'Remember why Fern left a place where no work is required.', loss: 'The seat and Fern remain. You will meet the invitation without remembering its first offer.' },
    tuning: { title: 'The space between signals', symbol: '≈', detail: 'Restore the receiver’s quiet channel for a personal reply after the reset.', loss: 'The repaired public receiver still works. The quiet channel and its new personal reply will be unavailable this visit.' }
  };
  const rooms = ['court', 'glass', 'listening'];
  const places = ['shade', 'receiver', 'gate'];
  const mirrorPositions = [{ x: 1, y: 2 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }];
  const mirrorSolution = [0, 0, 1, 1];
  const receiverLayout = { input: 1, output: 2, offsets: [1, 2, 1], solution: [1, 2, 1] };
  function lightPath(s) {
    let x = -1, y = 2, dx = 1, dy = 0; const points = [{ x, y }];
    for (let n = 0; n < 40; n++) {
      x += dx; y += dy; points.push({ x, y });
      if (x < 0 || x > 4 || y < 0 || y > 4) return { points, connected: x === 5 && y === 3 };
      const index = mirrorPositions.findIndex(p => p.x === x && p.y === y);
      if (index >= 0) [dx, dy] = s.mirrors[index] === 0 ? [-dy, -dx] : [dy, dx];
    }
    return { points, connected: false };
  }
  function receiverCircuit(s) {
    let track = receiverLayout.input, live = true; const outputs = [], powered = s.contacts.map((input, i) => {
      const output = (input + receiverLayout.offsets[i]) % 3; outputs.push(output); live = live && track === input; track = output; return live;
    });
    return { outputs, powered, connected: live && track === receiverLayout.output };
  }
  function fresh(receipt) {
    const incoming = Transit.validate(receipt);
    if (!incoming.delivered) throw new Error('Finish the Transit dispatch before continuing to Garden.');
    return { kind: 'afterimage.garden', version: 1, incoming, cycle: 1, acquired: [...incoming.kept], kept: [...incoming.kept], metFern: false, mirrors: [1, 0, 0, 1], shadeFixed: false, contacts: [0, 0, 0], receiverFixed: false, heard: false, place: null, fernAgreement: false, brimAgreement: false, reunion: false, checkedShade: false, checkedReceiver: false, quiet: false, evening: false, courierDuty: false, open: null, room: 'court', player: { x: 160, y: 555 } };
  }
  const candidates = s => [...s.incoming.kept, 'fern', 'tuning'];
  const ready = s => s.cycle === 1 && s.metFern && s.shadeFixed && s.receiverFixed && s.heard && s.place !== null && s.fernAgreement && s.brimAgreement;
  const returnReady = s => s.cycle === 2 && s.reunion && s.checkedShade && s.checkedReceiver;
  const acquire = (s, id) => { if (!s.acquired.includes(id)) s.acquired.push(id); };
  function act(s, action, value) {
    if (s.open) return false;
    switch (action) {
      case 'fern': if (s.cycle === 1) { s.metFern = true; acquire(s, 'fern'); } else s.reunion = true; return true;
      case 'mirror':
        if (s.cycle !== 1 || s.shadeFixed || !Number.isInteger(value) || value < 0 || value > 3) return false;
        s.mirrors[value] = 1 - s.mirrors[value]; return true;
      case 'alignLight': if (s.cycle !== 1 || s.shadeFixed) return false; s.mirrors = [...mirrorSolution]; return true;
      case 'latchShade': if (s.cycle !== 1 || s.shadeFixed || !lightPath(s).connected) return false; s.shadeFixed = true; return true;
      case 'contact':
        if (s.cycle !== 1 || s.receiverFixed || !Number.isInteger(value) || value < 0 || value > 2) return false;
        s.contacts[value] = (s.contacts[value] + 1) % 3; return true;
      case 'alignReceiver': if (s.cycle !== 1 || s.receiverFixed) return false; s.contacts = [...receiverLayout.solution]; return true;
      case 'connect': if (s.cycle !== 1 || s.receiverFixed || !receiverCircuit(s).connected) return false; s.receiverFixed = true; return true;
      case 'listen': if (s.cycle !== 1 || !s.receiverFixed) return false; s.heard = true; acquire(s, 'tuning'); return true;
      case 'place': if (s.cycle !== 1 || !s.metFern || !places.includes(value)) return false; s.place = value; return true;
      case 'fernAgreement': if (s.cycle !== 1 || !s.metFern || !s.shadeFixed) return false; s.fernAgreement = true; return true;
      case 'brimAgreement': if (s.cycle !== 1 || !s.receiverFixed) return false; s.brimAgreement = true; return true;
      case 'shade': if (s.cycle !== 2) return false; s.checkedShade = true; return true;
      case 'receiver': if (s.cycle !== 2) return false; s.checkedReceiver = true; return true;
      case 'quiet': if (s.cycle !== 2 || !s.kept.includes('tuning') || !s.checkedReceiver) return false; s.quiet = true; return true;
      case 'evening':
        if (s.cycle !== 2 || !s.kept.includes('sequence') || !s.checkedShade || typeof value !== 'boolean') return false;
        s.evening = value; s.courierDuty = value; return true;
      case 'open':
        if (!returnReady(s) || !['daylight', 'evening'].includes(value) || (value === 'evening' && (!s.evening || !s.courierDuty))) return false;
        if (value === 'daylight') { s.evening = false; s.courierDuty = false; }
        s.open = value; return true;
      default: return false;
    }
  }
  function reset(s, pair) {
    if (!ready(s) || !Array.isArray(pair) || pair.length !== 2 || new Set(pair).size !== 2 || pair.some(id => !s.acquired.includes(id))) throw new Error('Complete the repairs and agreements, then choose exactly two acquired memories.');
    return { ...s, incoming: Transit.validate(s.incoming), mirrors: [...s.mirrors], contacts: [...s.contacts], cycle: 2, acquired: [...pair], kept: [...pair], room: 'court', player: { x: 160, y: 555 } };
  }
  function validate(value) {
    if (!value || value.kind !== 'afterimage.garden' || value.version !== 1) throw new Error('This is not an AFTERIMAGE Garden save.');
    const s = fresh(value.incoming), allowed = candidates(s);
    if (![1, 2].includes(value.cycle) || !rooms.includes(value.room)) throw new Error('Invalid Garden chapter position.');
    s.cycle = value.cycle; s.room = value.room;
    for (const id of ['acquired', 'kept']) {
      if (!Array.isArray(value[id]) || value[id].length > 4 || new Set(value[id]).size !== value[id].length || value[id].some(k => !allowed.includes(k))) throw new Error('Invalid Garden memories.');
      s[id] = [...value[id]];
    }
    for (const id of ['metFern', 'shadeFixed', 'receiverFixed', 'heard', 'fernAgreement', 'brimAgreement', 'reunion', 'checkedShade', 'checkedReceiver', 'quiet', 'evening', 'courierDuty']) {
      if (typeof value[id] !== 'boolean') throw new Error('Invalid Garden progress.'); s[id] = value[id];
    }
    for (const [id, length, max] of [['mirrors', 4, 1], ['contacts', 3, 2]]) {
      if (!Array.isArray(value[id]) || value[id].length !== length || value[id].some(n => !Number.isInteger(n) || n < 0 || n > max)) throw new Error('Invalid repair position.'); s[id] = [...value[id]];
    }
    if (![null, ...places].includes(value.place) || ![null, 'daylight', 'evening'].includes(value.open)) throw new Error('Invalid Garden arrangement.');
    s.place = value.place; s.open = value.open;
    if (s.shadeFixed && !lightPath(s).connected) throw new Error('The shade has not been latched.');
    if ((s.receiverFixed && !receiverCircuit(s).connected) || (s.heard && !s.receiverFixed)) throw new Error('The receiver is unfinished.');
    if ((s.place || s.fernAgreement) && !s.metFern) throw new Error('Fern has not been consulted.');
    if ((s.fernAgreement && !s.shadeFixed) || (s.brimAgreement && !s.receiverFixed)) throw new Error('The upkeep agreement has no working repair.');
    if (s.cycle === 1 && (s.kept.length !== 2 || s.kept.some(id => !s.incoming.kept.includes(id)) || s.incoming.kept.some(id => !s.acquired.includes(id)) || s.metFern !== s.acquired.includes('fern') || s.heard !== s.acquired.includes('tuning') || s.reunion || s.checkedShade || s.checkedReceiver || s.quiet || s.evening || s.courierDuty || s.open)) throw new Error('Invalid first Garden visit.');
    if (s.cycle === 2 && (!s.metFern || !s.shadeFixed || !s.receiverFixed || !s.heard || !s.place || !s.fernAgreement || !s.brimAgreement || s.kept.length !== 2 || s.acquired.length !== 2 || s.acquired.some(id => !s.kept.includes(id)))) throw new Error('Incomplete Garden handoff.');
    if (s.quiet && (!s.kept.includes('tuning') || !s.checkedReceiver)) throw new Error('The quiet channel was not retained.');
    if (s.evening !== s.courierDuty || (s.evening && (!s.kept.includes('sequence') || !s.checkedShade))) throw new Error('Evening opening has no controller sequence or agreed upkeep.');
    if (s.open && (!returnReady(s) || (s.open === 'evening') !== s.evening)) throw new Error('The opening has not been checked.');
    const p = value.player;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 30 || p.x > 930 || p.y < 30 || p.y > 650) throw new Error('Invalid courier position.');
    s.player = { x: p.x, y: p.y }; return s;
  }
  function preview(id) {
    const choices = { book: ['stay', 'book', ['greeting', 'sequence']], ledger: ['obedience', 'ledger', ['greeting', 'message']], shelf: ['witness', 'repairing', ['sequence', 'message']] };
    if (!Object.hasOwn(choices, id)) throw new Error('Choose a preview dispatch.');
    const [origin, sorting, pair] = choices[id], first = Transit.fresh(origin);
    Transit.act(first, 'brim'); Transit.act(first, 'sort', sorting); if (sorting === 'repairing') { Transit.act(first, 'align'); Transit.act(first, 'secure'); }
    for (const action of ['silt', 'sequence', 'message']) Transit.act(first, action);
    const receipt = Transit.reset(first, pair); Transit.act(receipt, 'brim'); Transit.act(receipt, 'silt');
    if (pair.includes('sequence')) { Transit.act(receipt, 'bridge'); Transit.act(receipt, 'bring'); } Transit.act(receipt, 'deliver');
    return fresh(receipt);
  }
  const api = { key, memories, rooms, places, mirrorPositions, mirrorSolution, receiverLayout, fresh, candidates, ready, returnReady, act, reset, validate, lightPath, receiverCircuit, preview };
  root.AfterimageGarden = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
