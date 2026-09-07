(function (root) {
  'use strict';
  const Chorus = typeof module !== 'undefined' ? require('./chorus-state.js') : root.AfterimageChorus;
  const key = 'afterimage.release.v1', rooms = ['court', 'archive', 'yard'], memories = Chorus.memories;
  const endings = {
    complete: { title: 'Complete / retire the shared carrier', action: 'Turn the shared carrier breaker off', object: 'breaker', detail: 'Close the shared signal service and evening lamps. Preserve the occupied local spaces and daylight garden as explicit exceptions. Keep the report in the local archive.' },
    witness: { title: 'Witness / send an honest account', action: 'Send the sealed account', object: 'outbox', detail: 'Transmit the supported report, disagreement, and unknown cause beyond the network. Then retire the shared carrier and evening lamps. The message carries records; residents stay here. No rescue is promised.' },
    remain: { title: 'Remain / maintain a smaller network', action: 'Connect the local service loop', object: 'loop', detail: 'Keep the garden and public receiver linked through the chosen Chorus route. Close the unused long-distance dispatch branch. Counter offers the route check; existing morning jobs remain. Evening use requires the courier’s renewed duty.' }
  };
  const candidates = s => [...s.kept];
  function fresh(receipt) {
    const incoming = Chorus.validate(receipt); if (!incoming.released) throw new Error('Finish the Chorus handoff before entering Release.');
    return { kind: 'afterimage.release', version: 1, incoming, cycle: 2, acquired: [...incoming.kept], kept: [...incoming.kept], visited: [], counterAgreement: false, plan: null, ending: null, coda: false, room: 'court', player: { x: 160, y: 555 } };
  }
  const ready = s => s.visited.length === 3;
  function act(s, action, value) {
    if (s.ending) { if (action === 'coda') { s.coda = true; return true; } return false; }
    switch (action) {
      case 'inspect': if (!rooms.includes(value)) return false; if (!s.visited.includes(value)) s.visited.push(value); return true;
      case 'counterAgreement': s.counterAgreement = true; return true;
      case 'plan': if (!ready(s) || !Object.hasOwn(endings, value) || (value === 'remain' && !s.counterAgreement)) return false; s.plan = value; return true;
      case 'cancel': s.plan = null; return true;
      case 'enact': if (!ready(s) || !s.plan || value !== endings[s.plan].object || (s.plan === 'remain' && !s.counterAgreement)) return false; s.ending = s.plan; return true;
      default: return false;
    }
  }
  function validate(v) {
    if (!v || v.kind !== 'afterimage.release' || v.version !== 1) throw new Error('This is not a Release save.');
    const s = fresh(v.incoming);
    if (v.cycle !== 2 || !rooms.includes(v.room)) throw new Error('Invalid Release position.'); s.room = v.room;
    for (const k of ['acquired', 'kept']) { if (!Array.isArray(v[k]) || v[k].length !== 2 || new Set(v[k]).size !== 2 || v[k].some(id => !s.kept.includes(id))) throw new Error('Invalid final memories.'); }
    if (!Array.isArray(v.visited) || new Set(v.visited).size !== v.visited.length || v.visited.some(id => !rooms.includes(id))) throw new Error('Invalid consequence review.'); s.visited = [...v.visited];
    for (const k of ['counterAgreement', 'coda']) { if (typeof v[k] !== 'boolean') throw new Error('Invalid final agreement.'); s[k] = v[k]; }
    for (const k of ['plan', 'ending']) { if (![null, ...Object.keys(endings)].includes(v[k])) throw new Error('Invalid network plan.'); s[k] = v[k]; }
    if ((s.plan && !ready(s)) || (s.plan === 'remain' && !s.counterAgreement) || (s.ending && s.ending !== s.plan) || (s.coda && !s.ending)) throw new Error('The final plan has not been enacted.');
    if (!v.player || !Number.isFinite(v.player.x) || !Number.isFinite(v.player.y) || v.player.x < 30 || v.player.x > 930 || v.player.y < 30 || v.player.y > 650) throw new Error('Invalid courier position.'); s.player = { x: v.player.x, y: v.player.y }; return s;
  }
  function preview(id) {
    let c = Chorus.preview(id); Chorus.act(c, 'counter'); Chorus.act(c, 'hear'); Chorus.act(c, 'mode', id === 'book' ? 'central' : id === 'ledger' ? 'local' : 'round'); Chorus.act(c, 'align'); Chorus.act(c, 'connect'); Chorus.act(c, 'request');
    for (const g of c.mode === 'central' ? ['combined'] : Chorus.groups) Chorus.act(c, 'ack', g); Chorus.act(c, 'operate');
    for (const k of Object.keys(Chorus.evidence)) Chorus.act(c, 'read', k); for (const [id, claim] of Object.entries(Chorus.claims)) Chorus.act(c, 'claim', { id, answer: claim.answer });
    c = Chorus.reset(c, id === 'book' ? ['sequence', 'address'] : ['counter', 'address']); Chorus.act(c, 'counter'); Chorus.act(c, 'review'); Chorus.act(c, 'reply', 'listen'); Chorus.act(c, 'evening', id === 'book' ? 'continue' : 'none'); Chorus.act(c, 'release'); return fresh(c);
  }
  const api = { key, rooms, memories, endings, candidates, fresh, preview, ready, act, validate }; root.AfterimageRelease = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
