const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../transit-state.js');
const S = require('../state.js');
function prepared(origin = 'stay', plan = 'book') {
  const s = C.fresh(origin); C.act(s,'brim'); C.act(s,'sort',plan);
  if (plan === 'repairing') { for (let i = 0; i < 3; i++) while(s.pins[i] !== C.shelfPattern[i]) C.act(s,'pin',i); C.act(s,'secure'); }
  for (const action of ['silt','sequence','message']) C.act(s,action);
  return s;
}
for (const origin of C.origins) for (const pair of [['greeting','sequence'],['greeting','message'],['sequence','message']]) for (const plan of ['book','ledger','repairing']) {
  test(`${origin}, ${pair.join('+')}, ${plan}: consequence survives and delivery completes`, () => {
    const first=prepared(origin,plan), s=C.reset(first,pair);
    assert.equal(C.ready(first),true); assert.deepEqual(C.validate(s),s);
    assert.deepEqual(s.acquired,pair); assert.equal(s.sorting,plan === 'repairing' ? 'shelf' : plan); assert.equal(s.origin,origin);
    assert.equal(C.act(s,'deliver'),false); C.act(s,'brim'); C.act(s,'silt');
    assert.equal(C.act(s,'sequence'),false); assert.equal(C.act(s,'message'),false);
    assert.equal(C.act(s,'bridge'),pair.includes('sequence'));
    assert.equal(C.act(s,'bring'),pair.includes('sequence'));
    assert.equal(C.act(s,'deliver'),true); assert.deepEqual(C.validate(s),s);
    const settled=JSON.stringify(s); for (const a of ['sort','brim','silt','sequence','message','pin','align','secure','bridge','bring','deliver']) assert.equal(C.act(s,a,'ledger'),false);
    assert.equal(JSON.stringify(s),settled); assert.throws(()=>C.reset(s,pair));
    assert.equal(first.cycle,1); assert.equal(first.delivered,false);
  });
}
test('repair work is resumable and requires explicit securing', () => {
  const s=C.fresh('witness'); assert.equal(C.act(s,'sort','book'),false); C.act(s,'brim'); C.act(s,'sort','repairing');
  assert.equal(C.act(s,'secure'),false); C.act(s,'pin',0); assert.deepEqual(C.validate(JSON.parse(JSON.stringify(s))),s);
  C.act(s,'align'); assert.equal(s.sorting,'repairing'); assert.equal(C.ready(s),false); C.act(s,'secure'); assert.equal(s.sorting,'shelf'); assert.equal(C.act(s,'sort','ledger'),false);
});
test('invalid and impossible campaign saves are rejected without mutating input', () => {
  const good=C.reset(prepared(),['greeting','message']);
  for (const edit of [s=>s.version=2,s=>s.origin='unknown',s=>s.room='garden',s=>s.bridge=true,s=>s.siltReturned=true,s=>s.delivered=true,s=>s.sorting='repairing',s=>s.acquired.push('sequence'),s=>s.kept=['greeting','greeting'],s=>s.pins=[-1,0,1],s=>s.player.x=1000,s=>s.reunion=1]) {
    const candidate=structuredClone(good); edit(candidate); const before=JSON.stringify(candidate); assert.throws(()=>C.validate(candidate)); assert.equal(JSON.stringify(candidate),before);
  }
  assert.throws(()=>C.validate(S.fresh())); assert.throws(()=>C.reset(C.fresh('stay'),['greeting','message']));
  assert.throws(()=>C.reset(prepared(),['greeting','greeting']));
});
test('navigation cannot cross the gap until it has an opening', () => {
  const start={x:485,y:425}, end={x:790,y:350};
  assert.equal(S.findPath(start,end,[{x:590,y:0,w:80,d:680}]),null);
  const path=S.findPath(start,end,[{x:590,y:0,w:80,d:280},{x:590,y:420,w:80,d:260}]);
  assert.ok(path && path.length); assert.deepEqual(path.at(-1),end);
});
