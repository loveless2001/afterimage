const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../js/afterimages-earlier-runs-trails-and-ghosts.js');

// Afterimages replay an earlier run's sampled path: glide between points,
// hold at pauses, rest at the end, then loop.
test('a trail glides between points, holds at a pause, rests, then loops', () => {
  const trail = [[0, 0], [10, 0, 1], [10, 20]];
  assert.deepEqual(T.trailPosition(trail, 0), { x: 0, y: 0 });
  assert.deepEqual(T.trailPosition(trail, .5), { x: 5, y: 0 }, 'halfway to the next point');
  assert.deepEqual(T.trailPosition(trail, 1), { x: 10, y: 0 }, 'arrives at the pause');
  assert.deepEqual(T.trailPosition(trail, 5.9), { x: 10, y: 0 }, 'a pause holds for 5 steps');
  assert.deepEqual(T.trailPosition(trail, 6.5), { x: 10, y: 20 }, 'the last point holds');
  assert.deepEqual(T.trailPosition(trail, 12), { x: 10, y: 20 }, 'rests at the end');
  assert.deepEqual(T.trailPosition(trail, 15.5), { x: 5, y: 0 }, 'then loops (7 steps + 8 of rest)');
});

test('long trails thin out but keep every pause; damaged trails are rejected', () => {
  const long = Array.from({ length: 401 }, (_, i) => i === 7 ? [i, 0, 1] : [i, 0]);
  const thin = T.thin(long);
  assert.ok(thin.length <= 202); assert.ok(thin.some(p => p[2]), 'the pause survives');
  assert.equal(T.thin(long.slice(0, 50)).length, 50, 'short trails are untouched');
  assert.equal(T.validTrail([[1, 2], [3, 4, 1]]), true);
  for (const bad of [null, {}, [[1]], [['a', 2]], [[1, NaN]]]) assert.equal(T.validTrail(bad), false);
});
