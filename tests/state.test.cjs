const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../state.js');

function ready() {
  const s = S.fresh(); s.met = s.gift = true;
  for (const key of Object.keys(S.memories)) S.acquire(s, key);
  return s;
}

test('every legal memory pair survives reset and save round-trip', () => {
  for (const pair of [['name', 'route'], ['name', 'song'], ['route', 'song']]) {
    const before = ready(), next = S.reset(before, pair);
    assert.equal(next.cycle, 2);
    assert.deepEqual(next.kept, pair);
    assert.deepEqual(next.acquired, pair);
    assert.equal(next.gift, true);
    assert.equal(next.reunion, false);
    assert.deepEqual(next.relays, []);
    assert.deepEqual(S.validate(JSON.parse(JSON.stringify(next))), next);
    assert.equal(before.cycle, 1);
    S.acquire(next, Object.keys(S.memories).find(key => !pair.includes(key)));
    assert.deepEqual(next.acquired, pair, 'released memory cannot be reacquired');
  }
});

test('reset requires preparation and exactly two distinct acquired memories', () => {
  assert.throws(() => S.reset(S.fresh(), ['name', 'route']));
  for (const pair of [[], ['name'], ['name', 'name'], ['name', 'route', 'song'], ['name', 'other']]) assert.throws(() => S.reset(ready(), pair));
  const next = S.reset(ready(), ['name', 'route']);
  assert.throws(() => S.reset(next, ['name', 'route']));
});

test('malformed imports cannot inject arbitrary state or impossible endings', () => {
  const base = S.reset(ready(), ['name', 'route']);
  for (const patch of [
    { version: 99 }, { cycle: 3 }, { acquired: ['name', 'route', 'song'] },
    { kept: ['name', 'name'] }, { relays: ['east', 'east'] }, { gift: false },
    { player: { x: Infinity, y: 10 } }, { player: { x: 2000, y: 10 } },
    { ending: 'witness', gate: true, reunion: true }, { ending: 'stay' },
    { met: 'true' }, { ending: '<script>' }
  ]) assert.throws(() => S.validate({ ...base, ...patch }));
  const clean = S.validate({ ...base, untrusted: 'ignored' });
  assert.equal(clean.untrusted, undefined);
});

test('all ending saves can be loaded when their prerequisites are present', () => {
  const base = { ...S.reset(ready(), ['name', 'song']), gate: true, reunion: true };
  for (const ending of ['obedience', 'witness', 'stay']) assert.equal(S.validate({ ...base, ending }).ending, ending);
  assert.deepEqual(S.validate(S.fresh()), S.fresh());
});

test('shared flower placement survives release and older saves still load', () => {
  const before = ready(); before.flowerSpot = 'company';
  const next = S.reset(before, ['route', 'song']);
  assert.equal(S.validate(next).flowerSpot, 'company');
  const old = ready(); delete old.flowerSpot;
  assert.equal(S.validate(old).flowerSpot, null);
  assert.throws(() => S.validate({ ...before, flowerSpot: 'invalid' }));
  assert.throws(() => S.validate({ ...S.fresh(), flowerSpot: 'light' }));
});

test('walking routes around shelves and rejects blocked destinations', () => {
  const shelves = [{ x: 400, y: 290, w: 180, d: 38 }];
  const start = { x: 450, y: 440 }, end = { x: 450, y: 230 };
  const path = S.findPath(start, end, shelves);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), end);
  let previous = start;
  for (const p of path) {
    for (let i = 0; i <= 100; i++) {
      const x = previous.x + (p.x - previous.x) * i / 100;
      const y = previous.y + (p.y - previous.y) * i / 100;
      assert.ok(!(x > 387 && x < 593 && y > 277 && y < 341));
    }
    previous = p;
  }
  assert.equal(S.findPath(start, { x: 450, y: 310 }, shelves), null);
  assert.equal(S.findPath(start, { x: 5, y: 10 }, shelves), null);
});

test('relay circuits have one continuous solution and require explicit connection', () => {
  for (const id of ['west', 'east']) {
    const s = S.reset(ready(), ['name', 'song']);
    assert.equal(S.restoreRelay(s, id), false);
    let solutions = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
      s.relayContacts[id] = [a, b, c];
      if (S.relayCircuit(s, id).connected) solutions++;
    }
    assert.equal(solutions, 1);
    assert.equal(S.alignRelay(s, id), true);
    assert.deepEqual(s.relays, [], 'assistance aligns but does not commit the connection');
    assert.equal(S.relayCircuit(s, id).connected, true);
    assert.equal(S.restoreRelay(s, id), true);
    assert.equal(S.restoreRelay(s, id), false, 'connection is idempotent');
    assert.equal(S.shiftRelay(s, id, 0), false, 'restored wiring stays in place');
    assert.deepEqual(s.relays, [id]);
  }
  const fresh = S.fresh();
  assert.equal(S.alignRelay(fresh, 'west'), false);
  assert.equal(S.shiftRelay(fresh, 'east', 0), false);
  const ended = { ...S.reset(ready(), ['name', 'song']), ending: 'stay' };
  assert.equal(S.alignRelay(ended, 'west'), false);
});

test('partial relay work round-trips independently and old v1 restores stay restored', () => {
  const s = S.reset(ready(), ['name', 'song']);
  const eastBefore = [...s.relayContacts.east];
  assert.equal(S.shiftRelay(s, 'west', 0), true);
  assert.deepEqual(s.relayContacts.east, eastBefore);
  assert.deepEqual(S.validate(JSON.parse(JSON.stringify(s))), s);
  const old = { ...s, relays: ['west'] }; delete old.relayContacts;
  const migrated = S.validate(old);
  assert.deepEqual(migrated.relays, ['west']);
  assert.equal(S.relayCircuit(migrated, 'west').connected, true);
  assert.deepEqual(migrated.relayContacts.east, S.fresh().relayContacts.east);
  assert.equal(S.restoreRelay(migrated, 'west'), false);
  const fresh = S.fresh(); fresh.relayContacts.west[0] = 0;
  assert.equal(S.fresh().relayContacts.west[0], 2, 'new instances do not share arrays');
  for (const contacts of [null, [], {}, { west: [0, 1], east: [0, 0, 0] }, { west: [0, 1, 3], east: [0, 0, 0] }, { west: [0, '1', 2], east: [0, 0, 0] }]) {
    assert.throws(() => S.validate({ ...s, relayContacts: contacts }));
  }
  assert.throws(() => S.validate({ ...s, relays: ['east'] }), /connected circuit/);
  assert.equal(S.shiftRelay(s, 'missing', 0), false);
  assert.equal(S.shiftRelay(s, 'west', -1), false);
  assert.equal(S.shiftRelay(s, 'west', 1.5), false);
});

test('Moth keeps an agreement across every reset without restoring a released memory', () => {
  for (const greeting of ['introduce', 'space']) for (const pair of [['name', 'route'], ['name', 'song'], ['route', 'song']]) {
    const before = ready(); before.mothGreeting = greeting;
    const next = S.reset(before, pair);
    assert.equal(next.mothGreeting, greeting);
    assert.deepEqual(next.kept, pair);
    assert.deepEqual(next.acquired, pair);
    assert.deepEqual(S.validate(JSON.parse(JSON.stringify(next))), next);
  }
  const old = ready(); delete old.mothGreeting;
  assert.equal(S.validate(old).mothGreeting, null);
  assert.equal(S.reset(old, ['route', 'song']).mothGreeting, null);
  assert.throws(() => S.validate({ ...ready(), mothGreeting: 'remember-everything' }));
  assert.throws(() => S.validate({ ...S.fresh(), mothGreeting: 'space' }));
});
