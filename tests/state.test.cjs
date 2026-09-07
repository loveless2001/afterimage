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
