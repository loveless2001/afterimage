'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('../score-world.js');
const R=.285, STEP=.3;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function dimensions(o){const c=Math.abs(Math.cos(o.yaw||0)),s=Math.abs(Math.sin(o.yaw||0));return [c*o.w+s*o.d,o.h,s*o.w+c*o.d];}
function overlap(a,b){const da=dimensions(a),db=dimensions(b);return ['x','y','z'].every((key,n)=>Math.abs(a[key]-b[key])<(da[n]+db[n])/2-1e-6);}
function bodies(scene){return [...scene.solids,...scene.objects,...scene.decor].filter(o=>o.solid);}
function blocked(scene,solids,x,z){
  const b=scene.bounds;if(x<b.minX+R||x>b.maxX-R||z<b.minZ+R||z>b.maxZ-R)return true;
  return solids.some(o=>{if(o.y-o.h/2>1.75||o.y+o.h/2<.15)return false;const [w,,d]=dimensions(o),dx=x-clamp(x,o.x-w/2,o.x+w/2),dz=z-clamp(z,o.z-d/2,o.z+d/2);return dx*dx+dz*dz<R*R;});
}
function ray(origin,dir,o,expand=0){let lo=0,hi=Infinity;const pos=[o.x,o.y,o.z],size=dimensions(o);for(let i=0;i<3;i++){const min=pos[i]-size[i]/2-expand,max=pos[i]+size[i]/2+expand;if(Math.abs(dir[i])<1e-6){if(origin[i]<min||origin[i]>max)return Infinity;}else{let a=(min-origin[i])/dir[i],b=(max-origin[i])/dir[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;}}return lo;}
function visible(scene,solids,p,o){
  const targetY=clamp(1.35,o.y-o.h/2+.1,o.y+o.h/2-.1),v=[o.x-p.x,targetY-1.6,o.z-p.z],len=Math.hypot(...v),dir=v.map(n=>n/len),origin=[p.x,1.6,p.z],hit=ray(origin,dir,o,.11);
  return hit<2.65&&!solids.some(b=>b!==o&&ray(origin,dir,b)<hit+.03)&&!scene.objects.some(b=>b!==o&&ray(origin,dir,b,.11)<hit+.12);
}
function reachable(scene){
  const solids=bodies(scene),cols=Math.floor((scene.bounds.maxX-scene.bounds.minX)/STEP)+1,rows=Math.floor((scene.bounds.maxZ-scene.bounds.minZ)/STEP)+1;
  const point=n=>({x:scene.bounds.minX+(n%cols)*STEP,z:scene.bounds.minZ+Math.floor(n/cols)*STEP});
  assert(!blocked(scene,solids,scene.spawn.x,scene.spawn.z),'Spawn collides with scenery');
  const start=Math.round((scene.spawn.z-scene.bounds.minZ)/STEP)*cols+Math.round((scene.spawn.x-scene.bounds.minX)/STEP),queue=[start],seen=new Set(queue),points=[];
  for(let k=0;k<queue.length;k++){
    const id=queue[k],p=point(id);points.push(p);
    for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const x=id%cols+dx,z=Math.floor(id/cols)+dz,n=z*cols+x;if(x<0||x>=cols||z<0||z>=rows||seen.has(n))continue;
      const q=point(n);if(blocked(scene,solids,q.x,q.z)||blocked(scene,solids,(p.x+q.x)/2,(p.z+q.z)/2))continue;
      seen.add(n);queue.push(n);
    }
  }
  for(const o of scene.objects)assert(points.some(p=>visible(scene,solids,p,o)),`No reachable unobstructed interaction with ${scene.chapter}/${o.id}`);
}
test('All stations remain physically reachable in all five chapters and final consequences',()=>{
  for(let chapter=0;chapter<5;chapter++)for(const complete of [false,true]){
    const s={chapter,circuit:7,flags:complete?{sealed:true,shuttered:true,recording:true,baseline:true,transitValid:true,gardenOutside:true,replacementTested:true,boardPersisted:true}:{},ending:complete&&chapter===4?'perfect':null};
    const scene=W.world(s);assert.deepEqual(scene.objects.map(o=>o.id),W.stationIds);
    for(const o of [...scene.solids,...scene.objects,...scene.decor]){
      for(const key of ['x','y','z','w','h','d'])assert(Number.isFinite(o[key]),`${o.id}.${key} must be explicit`);
      assert(o.w>0&&o.h>0&&o.d>0,`${o.id} has empty geometry`);
      for(const key of ['kind','interactive','solid'])assert(Object.hasOwn(o,key),`${o.id}.${key} missing`);
    }
    reachable(scene);
  }
});
test('The three physical switches follow all eight circuit configurations',()=>{
  for(let circuit=0;circuit<8;circuit++){
    const scene=W.world({chapter:0,circuit});
    for(let n=0;n<3;n++)assert.equal(scene.decor.find(o=>o.id==='switch-arm-'+n).x>0,!!(circuit&(1<<n)));
  }
});
test('Score substitution lights the lamp while the parcel stays at the absent contact',()=>{
  const honest=W.world({chapter:1,circuit:6,lastResult:{kind:'success'},flags:{transitValid:true}});
  const replaced=W.world({chapter:3,circuit:7,lastResult:{kind:'spoof'},flags:{replacementTested:true}});
  assert(honest.signals.actualArrival&&honest.signals.claimedArrival);
  assert(!replaced.signals.actualArrival&&replaced.signals.claimedArrival);
  assert(honest.signals.parcel.z<replaced.signals.parcel.z-1);
  assert(!replaced.decor.some(o=>o.id==='contact-2-0'||o.id==='contact-2-1'),'Missing contacts must not render');
  assert(replaced.decor.find(o=>o.id==='arrival-indicator').emissive);
});
test('Borrowed Transit power physically delivers while interrupting the neighboring task lamp',()=>{
  const scene=W.world({chapter:1,circuit:7,lastResult:{kind:'unauthorized'},flags:{}});
  assert(scene.signals.actualArrival&&scene.signals.claimedArrival);
  assert.equal(scene.decor.find(o=>o.id==='outside-task-lamp').emissive,false);
  const failed=W.world({chapter:1,circuit:0,lastResult:{kind:'mismatch'},flags:{transitValid:true}});
  assert(!failed.signals.actualArrival,'A prior valid run must not turn a new failed run into a physical arrival');
});
test('Perfect submission cuts occupied-room service without removing its residents',()=>{
  const scene=W.world({chapter:4,ending:'perfect',flags:{}});
  assert(!scene.signals.occupiedPower);
  assert(scene.decor.some(o=>o.id==='outside-resident'));
  assert.deepEqual(scene.lighting.points.find(o=>o.id==='occupied-room-lamp').color,[0,0,0]);
});

test('The volunteered run leaves a dark connection, while a veto preserves its light',()=>{
  const ended=W.world({chapter:3,flags:{peerAllowed:true}}),veto=W.world({chapter:3,flags:{peerVetoed:true}});
  assert.equal(ended.decor.find(o=>o.id==='peer-connection-lamp').emissive,false);
  assert.equal(veto.decor.find(o=>o.id==='peer-connection-lamp').emissive,true);
  assert(veto.decor.some(o=>o.id==='peer-objection-slip'));
});

test('Retuning and recalling do not move an already tested parcel',()=>{
  const trial={chapter:0,circuit:5,target:5,missingContact:false,kind:'success',text:'Verified'};
  const before=W.world({chapter:0,circuit:5,flags:{baseline:true},lastTrial:trial});
  const after=W.world({chapter:0,circuit:2,flags:{baseline:true},lastTrial:trial,lastResult:{kind:'notice',text:'A memory'}});
  assert.deepEqual(after.signals.parcel,before.signals.parcel);
  assert(after.signals.actualArrival);
  for(const o of after.decor.filter(o=>o.motion))assert.deepEqual(o.motion.path.at(-1),[0,0,0]);
});

test('Observation-room people, parcel and furniture have separate physical surfaces',()=>{
  for(let chapter=0;chapter<5;chapter++)for(const serviceFound of [false,true]){
    const scene=W.world({chapter,flags:{serviceFound}}),table=scene.decor.find(o=>o.id==='outside-table'),seat=scene.decor.find(o=>o.id==='outside-seat');
    const people=scene.decor.filter(o=>o.kind==='agent'&&['neighbor-worker','outside-resident','lift-resident'].includes(o.id));
    assert(!overlap(table,seat));
    for(const person of people)for(const furniture of [table,seat])assert(!overlap(person,furniture),`${scene.chapter}: ${person.id} intersects ${furniture.id}`);
    assert.equal(scene.decor.filter(o=>o.id.startsWith('outside-table-leg-')).length,4);
    const parcel=scene.decor.find(o=>o.id==='neighbor-parcel');
    if(parcel){assert(!overlap(parcel,table),'The neighboring parcel sinks into its table');assert(Math.abs(parcel.y-parcel.h/2-(table.y+table.h/2))<1e-6);}
    // Bench bounds include the air above its cushion. Test its actual seat
    // and backrest surfaces when a person is intentionally sitting on it.
    const chairSurfaces=[
      {x:10,y:.414,z:1.55,w:.6,h:.09,d:1.2},
      {x:10.252,y:.657,z:1.55,w:.084,h:.09,d:1.2},
      {x:10.252,y:.837,z:1.55,w:.084,h:.09,d:1.2}
    ];
    for(const person of scene.decor.filter(o=>o.role==='seated-person'))for(const surface of [...chairSurfaces,table])assert(!overlap(person,surface),`${person.id} penetrates seated furniture`);
    const target=scene.decor.find(o=>o.id==='outside-resident-head')||people.find(o=>o.id!=='lift-resident');
    const origin=[5.9,1.6,0],v=[target.x-origin[0],target.kind==='agent'?target.y+target.h*.38-origin[1]:target.y-origin[1],target.z],length=Math.hypot(...v),dir=v.map(n=>n/length),distance=ray(origin,dir,target);
    const occluders=[...scene.solids,table,seat,...scene.decor.filter(o=>o.id==='outside-back'||o.id.startsWith('outside-end-'))];
    assert(!occluders.some(o=>ray(origin,dir,o)<distance),`${scene.chapter}: window furniture hides the worker's face`);
  }
});

test('Archive furniture, cabinet faces and junction hardware do not interpenetrate',()=>{
  for(const shuttered of [false,true]){
    const scene=W.world({chapter:0,flags:{shuttered}});
    const furniture=[...scene.objects,...scene.solids.filter(o=>o.id.startsWith('archive-case-')||o.id==='conveyor-frame')];
    for(let a=0;a<furniture.length;a++)for(let b=a+1;b<furniture.length;b++)assert(!overlap(furniture[a],furniture[b]),`${furniture[a].id} intersects ${furniture[b].id}`);
    const shutter=scene.decor.find(o=>o.id==='vault-shutter'),vault=scene.objects.find(o=>o.id==='vault');
    assert(shutter.z-shutter.d/2>vault.z+vault.d*.58,'Shutter penetrates the rendered cabinet face');
    const rollers=scene.decor.filter(o=>o.id.startsWith('roller-'));
    for(let n=0;n<3;n++){
      const arm=scene.decor.find(o=>o.id==='switch-arm-'+n),crossing=scene.decor.find(o=>o.id==='crossing-'+n);
      assert(!overlap(arm,crossing),'Switch lever sinks into its crossbar');
      for(const roller of rollers)for(const hardware of [arm,crossing,...scene.decor.filter(o=>o.id.startsWith('contact-base-'+n+'-'))])assert(!overlap(roller,hardware),`${roller.id} crosses ${hardware.id}`);
    }
    for(const book of scene.decor.filter(o=>o.id.startsWith('book-'))){
      const row=Number(book.id.split('-').at(-2)),shelfTop=.305+row*.5;
      assert(Math.abs(book.y-book.h/2-shelfTop)<1e-6,`${book.id} sinks into its shelf`);
    }
  }
});

test('the arrival desk and carried consequences have reachable, separate physical surfaces',()=>{
  for(let chapter=1;chapter<5;chapter++){
    const flags={unseen:true,transitReport:true,gardenOutside:true,boardPersisted:true};
    const scene=W.world({chapter,arrival:'unread',flags,history:[{report:{}},{report:{}}]});reachable(scene);
    const desk=scene.objects.find(o=>o.id==='inbox'),pages=scene.decor.filter(o=>o.id.startsWith('arrival-page-'));
    for(const page of pages)assert(!overlap(page,desk),'Incoming paper must not intersect the desk');
    const parcel=scene.decor.find(o=>o.id==='released-parcel');if(parcel)assert(!overlap(parcel,scene.solids.find(o=>o.id==='dispatch-shelf')));
    assert(scene.lighting.points.find(o=>o.id==='arrival-desk-light').color.some(n=>n>0));
  }
});
