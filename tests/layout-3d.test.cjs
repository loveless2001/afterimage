'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../state-3d.js');
const Chapters = require('../chapters-3d.js');
const object = (world,id) => {
  const value=world.objects.find(o=>o.id===id);
  assert.ok(value, 'Missing '+id);
  return value;
};
const overlap = (a,b,pad=0) => ['x','y','z'].every((axis,i)=>{
  const size=['w','h','d'][i];
  return Math.abs(a[axis]-b[axis]) < (a[size]+b[size])/2+pad-1e-6;
});
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

test('Archive preserves the original relative organization and separates both relays',()=>{
  const w=Chapters.world(State.fresh()),moth=object(w,'moth'),flower=object(w,'flower'),west=object(w,'relayA'),east=object(w,'relayB'),service=object(w,'service'),receiver=object(w,'receiver'),closure=object(w,'closure');
  const table=w.solids.find(s=>s.role==='tabletop');
  assert.ok(table,'Moth needs a shared table');
  assert.ok(moth.x<table.x,'The original table is east of Moth');
  assert.ok(Math.abs(moth.z-table.z)<.3,'Moth stands beside the table');
  assert.ok(!overlap(moth,table,.2),'Moth must stand clear of the tabletop and legs');
  assert.ok(flower.x<moth.x&&flower.z>moth.z,'The unplaced flower belongs southwest of Moth');
  assert.ok(west.x<-4&&east.x>4,'West and east relays belong on opposite sides');
  assert.ok(east.x-west.x>=8,'Restoring two relays requires crossing the Archive');
  assert.ok(service.z<moth.z-2,'The service index is north of the workstation');
  assert.ok(receiver.x>moth.x&&receiver.z>moth.z,'The receiver belongs southeast');
  assert.ok(closure.x>moth.x&&closure.z<moth.z,'The closure threshold belongs northeast');
});

test('Archive chair is beside the workstation, faces Moth, and has clear physical space',()=>{
  const w=Chapters.world(State.fresh()),moth=object(w,'moth'),chair=object(w,'seat'),seat=chair.seat;
  assert.ok(distance(chair,moth)>=1.1&&distance(chair,moth)<=1.9,'The chair must be close enough for conversation');
  assert.ok(chair.w<=1.15,'The shared workstation needs one nearby chair, not a detached bench');
  for(const solid of w.solids) assert.ok(!overlap(chair,solid,.1),'Chair overlaps a wall, table, or shelf');
  const dx=moth.x-seat.x,dz=moth.z-seat.z,length=Math.hypot(dx,dz);
  const cameraDot=(Math.sin(seat.yaw)*dx-Math.cos(seat.yaw)*dz)/length;
  const chairDot=(Math.sin(chair.yaw)*dx+Math.cos(chair.yaw)*dz)/length;
  assert.ok(cameraDot>.95,'Sitting must look toward Moth');
  assert.ok(chairDot>.95,'The visible chair must face the same way as its seated camera');
  assert.ok(Math.abs(seat.x-chair.x)<.1&&Math.abs(seat.z-chair.z)<.1,'The seated view must be on the physical chair');
});

test('No resident body intersects a table, shelf, wall, or other solid furniture',()=>{
  for(const chapter of State.chapters) {
    const s=State.preview(chapter);
    for(const returned of [false,true]) {
      if(returned) {s.world.siltReturned=true;if(chapter==='garden')s.flags.seat=true;}
      const w=Chapters.world(s),agents=w.objects.filter(o=>o.kind==='agent');
      for(const agent of agents) {
        const blockers=[...w.solids,...w.objects.filter(o=>o!==agent&&o.solid!==false)];
        for(const solid of blockers) assert.ok(!overlap(agent,solid),chapter+': '+agent.id+' overlaps '+(solid.id||solid.role||'room geometry'));
      }
    }
  }
});

test('The flower moves onto the shared table and closure leaves an empty workstation',()=>{
  let s=State.fresh();const initial=object(Chapters.world(s),'flower');
  s=State.act(s,'flower');const w=Chapters.world(s),placed=object(w,'flower'),table=w.solids.find(o=>o.role==='tabletop');
  const lamp=w.decor.find(o=>o.id==='desk-lamp');
  assert.ok(lamp,'The shared table needs the lamp named in the flower interaction');
  assert.ok(Math.abs(lamp.y-lamp.h/2-(table.y+table.h/2))<.001,'The lamp base must rest on the tabletop');
  assert.ok(distance(placed,lamp)<1.2,'The placed flower must be beside the lamp');
  assert.ok(distance(initial,placed)>1,'Placing the flower must visibly move it');
  assert.ok(Math.abs(placed.x-table.x)<table.w/2&&Math.abs(placed.z-table.z)<table.d/2,'The placed flower must be supported by the tabletop');
  assert.ok(placed.y-placed.h/2>=table.y+table.h/2-.01,'The flower must rest above the tabletop');
  for(const a of ['meet','service','receiver'])s=State.act(s,a);
  s=State.reset(s,['name','route']);s=State.act(s,'meet');s=State.act(s,'finish','clear');
  const empty=Chapters.world(s);
  assert.equal(empty.objects.some(o=>o.id==='moth'||o.id==='flower'),false);
  assert.ok(empty.objects.some(o=>o.id==='seat'),'The empty chair should remain after closure');
});


test('Later chapter seats face the resident in their conversation area',()=>{
  const cases=[['transit','silt'],['garden','fern'],['chorus','counter'],['release','fern']];
  for(const [chapter,id] of cases) {
    const s=State.preview(chapter);if(chapter==='transit')s.flags.bridge=true;if(chapter==='garden')s.flags.seat=true;
    const w=Chapters.world(s),chair=object(w,'seat'),person=object(w,id),p=chair.seat;
    assert.ok(distance(chair,person)>=1.1&&distance(chair,person)<=2.1,chapter+': seat is detached from its resident');
    const dx=person.x-p.x,dz=person.z-p.z,length=Math.hypot(dx,dz);
    assert.ok((Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/length>.95,chapter+': seated view faces away from the resident');
    assert.ok((Math.sin(chair.yaw)*dx+Math.cos(chair.yaw)*dz)/length>.95,chapter+': chair model faces away from its seated view');
    const facing=person.yaw||0;
    assert.ok((Math.sin(facing)*-dx+Math.cos(facing)*-dz)/length>.95,chapter+': resident presents their back to the seat');
  }
});

test('Desk equipment rests on tabletops instead of passing through them',()=>{
  const cases=[['transit','objection'],['garden','receiver'],['chorus','sources'],['chorus','dispatch-reply'],['release','records'],['release','plan']];
  for(const [chapter,id] of cases) {
    const w=Chapters.world(State.preview(chapter)),item=object(w,id);
    const table=w.solids.find(b=>b.role==='tabletop'&&Math.abs(b.x-item.x)<b.w/2&&Math.abs(b.z-item.z)<b.d/2);
    assert.ok(table,chapter+': '+id+' needs a supporting tabletop');
    assert.ok(Math.abs(item.y-item.h/2-(table.y+table.h/2))<.001,chapter+': '+id+' is embedded in or floating above its desk');
    assert.equal(item.solid,false,chapter+': tabletop equipment should not duplicate the desk collision');
  }
});

test('Transit displays the actual sorted book and ledger, and Silt returns beside Brim',()=>{
  const initial=State.preview('transit'),original=Chapters.world(initial);
  assert.ok(original.decor.some(o=>o.id==='greeting-book'));
  assert.ok(original.decor.some(o=>o.id==='route-ledger'));
  for(const ending of ['book','ledger','both']) {
    let s=State.preview('transit');s=State.act(s,'brim');s=State.act(s,'ledger');
    s=State.reset(s,['greeting','sequence']);
    if(ending==='both') {for(let index=0;index<3;index++)if(State.puzzles.lift.target&(1<<index))s=State.act(s,'turn',{id:'lift',index});s=State.act(s,'lift');}
    s=State.act(s,'deliver');s=State.act(s,'finish',ending);const w=Chapters.world(s);
    assert.equal(w.decor.some(o=>o.id==='greeting-book'),ending!=='ledger');
    assert.equal(w.decor.some(o=>o.id==='route-ledger'),ending!=='book');
    if(ending==='both')assert.notEqual(object(w,'lift').color,Chapters.world(initial).objects.find(o=>o.id==='lift').color,'The spent lift component should change appearance');
  }
  initial.world.siltReturned=true;const returned=Chapters.world(initial);
  assert.ok(distance(object(returned,'silt'),object(returned,'brim'))<2,'Silt should return to Brim’s sorting hall');
  const drawing=returned.decor.find(o=>o.id==='silt-drawing'),silt=object(returned,'silt');
  assert.ok(drawing,'The returned resident should visibly retain their drawing');
  assert.ok(Math.abs(drawing.y-silt.h*.35)<.08&&distance(drawing,silt)<.45,'The drawing should meet Silt’s lowered hand rather than float at chest level');
});

test('Every Transit memory pair preserves the single clamp and the cost of its extra shelf',()=>{
  let initial=State.preview('transit');for(const action of ['brim','ledger'])initial=State.act(initial,action);
  for(let index=0;index<3;index++)if(State.puzzles.lift.target&(1<<index))initial=State.act(initial,'turn',{id:'lift',index});
  initial=State.act(initial,'lift');
  const before=Chapters.world(initial),part=before.decor.find(o=>o.id==='lift-support');
  const lamp=before.decor.find(o=>o.id==='silt-reading-lamp');
  assert.equal(object(before,'sort').clampOpen,true);
  for(let a=0;a<initial.acquired.length;a++)for(let b=a+1;b<initial.acquired.length;b++)for(const ending of ['book','ledger','both','omit']){
    let s=State.reset(initial,[initial.acquired[a],initial.acquired[b]]);s=State.act(s,'deliver');s=State.act(s,'finish',ending);
    const room=Chapters.world(s),support=room.decor.filter(o=>o.id==='lift-support');
    assert.equal(support.length,1,'There must be only one reusable component');
    assert.deepEqual([support[0].kind,support[0].w,support[0].h,support[0].d],[part.kind,part.w,part.h,part.d],'The shelf must use the same recognizable part');
    assert.equal(support[0].z===part.z,ending!=='both','Only the extra shelf removes the lift support');
    assert.equal(object(room,'sort').clampOpen,false);
    const books=room.decor.filter(o=>['greeting-book','route-ledger'].includes(o.id));
    assert.equal(books.length,ending==='both'?2:ending==='omit'?0:1);
    if(ending==='both')assert.ok(Math.abs(books[0].y-books[1].y)>.3,'Both records need separate shelves');
    assert.equal(room.decor.find(o=>o.id==='parcel-lift-platform').y<.2,ending==='both');
    assert.deepEqual(room.decor.find(o=>o.id==='silt-reading-lamp'),lamp,'Finishing a dispatch must not extinguish the occupied platform');
    assert.equal(object(room,'silt').x,object(before,'silt').x,'Keeping records does not bring Silt across');
  }
});

test('Transit preserves the removed warning and depicts every lost record without restoring it',()=>{
  let s=State.preview('transit');for(const action of ['brim','ledger','omitWarning'])s=State.act(s,action);
  const folder=state=>Chapters.world(state).objects.find(o=>o.id==='objection');
  assert.equal(folder(s).objectionMissing,true);s=State.reset(s,['greeting','sequence']);
  assert.equal(folder(State.validate(JSON.parse(JSON.stringify(s)))).objectionMissing,true,'The empty clip must survive handoff and reload');
  s=State.act(s,'deliver');
  for(const ending of ['book','ledger','omit']){
    const done=State.act(s,'finish',ending),room=Chapters.world(done),outline=room.decor.find(o=>o.id==='missing-record-outline');
    assert.equal(folder(done).objectionMissing,true);
    assert.equal(outline.missingGreeting,ending!=='book');assert.equal(outline.missingLedger,ending!=='ledger');
    assert.equal(room.decor.some(o=>o.kind==='greeting-book'),ending==='book');
    assert.equal(room.decor.some(o=>o.kind==='route-ledger'),ending==='ledger');
    if(ending==='omit')assert.match(Chapters.encounter(done,'sort').lines[0],/Both records were discarded/);
  }
});

test('Release preserves the shaded garden and its receiver through service retirement',()=>{
  const s=State.preview('release'),w=Chapters.world(s),seat=object(w,'seat');
  const shade=w.decor.filter(o=>String(o.id||'').startsWith('garden-shade-'));
  assert.ok(shade.length>=4,'The final garden must retain its physical shade');
  assert.ok(shade.some(o=>Math.abs(o.x-seat.x)<o.w/2&&Math.abs(o.z-seat.z)<.5),'The final seat must sit beneath the shade');
  const live=w.objects.find(o=>o.id==='receiver');assert.ok(live,'The final garden must retain its public receiver');
  for(const ending of ['complete','witness','remain','closeall']) {
    s.ending=ending;const changed=Chapters.world(s),receiver=changed.objects.find(o=>o.id==='receiver');
    assert.ok(receiver,'Closing a service must not delete its physical equipment');
    assert.equal(receiver.color===live.color,ending==='remain','Receiver appearance must match whether the local loop still carries messages');
  }
});


test('Garden evening lighting waits for the courier’s accepted controller duty',()=>{
  let s=State.preview('garden');
  for(const action of ['fern','morning','brim','seat'])s=State.act(s,action);
  for(const id of ['shade','receiver']) {for(let index=0;index<3;index++)if(State.puzzles[id].target&(1<<index))s=State.act(s,'turn',{id,index});s=State.act(s,id);}
  s=State.act(s,'listen');s=State.reset(s,['sequence','fern']);s=State.act(s,'daylight');
  const lamp=state=>Chapters.world(state).decor.find(o=>o.x===0&&o.z===1.5&&o.y===2.63);
  const daylightColor=lamp(s).color;
  s=State.act(s,'evening');assert.equal(lamp(s).color,daylightColor,'A proposed evening opening must not energize its lamp');
  s=State.act(s,'duty');assert.notEqual(lamp(s).color,daylightColor,'The retained sequence and accepted check should energize the evening lamp');
});
