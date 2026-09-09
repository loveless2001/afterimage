'use strict';
// Deterministic frame stepping checks the offsets submitted to the renderer
// without adding a real-time wait or changing the shipped engine's clock.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('@playwright/test');
let browser;

async function scene(reducedMotion){
  const context=await browser.newContext({reducedMotion,viewport:{width:640,height:360}});
  const page=await context.newPage();
  await page.setContent('<canvas style="width:640px;height:360px"></canvas>');
  await page.evaluate(()=>{
    window.motionClock=1000;
    Object.defineProperty(performance,'now',{value:()=>window.motionClock});
    window.requestAnimationFrame=callback=>{window.motionFrame=callback;return 1;};
    window.cancelAnimationFrame=()=>{};
    window.stepMotion=now=>{window.motionClock=now;window.motionFrame(now);};
  });
  await page.addScriptTag({path:path.resolve(__dirname,'../engine-3d.js')});
  await page.evaluate(()=>{
    window.engine=Afterimage3DWorld.create(document.querySelector('canvas'));
    window.room={spawn:{x:0,z:4,yaw:0},decor:[{x:1,y:1,z:0,w:.5,h:.5,d:.5,color:'#ffffff',
      motion:{cue:'parcel',duration:1800,path:[[-2,0,0],[-1,0,-1],[0,0,0]]}},
      {x:1,y:2,z:0,w:.2,h:.2,d:.2,color:'#00ff00',emissive:true,revealAfterCue:{cue:'parcel',delay:1800}}]};
    engine.load(room);
  });
  return page;
}
async function frame(page,time){return page.evaluate(now=>{stepMotion(now);return engine.getDebugState();},time);}

(async()=>{
  browser=await chromium.launch({headless:true});
  const page=await scene('no-preference');
  let debug=await frame(page,2000);
  assert.equal(debug.renderer,'WebGL');
  assert.equal(debug.paused,true,'Result observation should not depend on unpausing controls');
  assert.deepEqual(debug.motions[0].offset,[0,0,0],'Before a cue the parcel rests at its final position');
  assert.equal(debug.reveals[0].visible,true,'A loaded result displays its lamp immediately');
  await page.evaluate(()=>engine.cue('parcel'));
  assert.deepEqual((await frame(page,2000)).motions[0].offset,[-2,0,0]);
  assert.deepEqual((await frame(page,2450)).motions[0].offset,[-1.5,0,-.5],'Interpolate along the first route segment while paused');
  assert.equal((await frame(page,2450)).reveals[0].visible,false,'The arrival lamp stays off while the parcel moves');
  assert.deepEqual((await frame(page,2900)).motions[0].offset,[-1,0,-1],'Follow the authored bend');
  assert.deepEqual((await frame(page,3350)).motions[0].offset,[-.5,0,-.5]);
  assert.deepEqual((await frame(page,3800)).motions[0].offset,[0,0,0],'Finish at the physical result');
  assert.equal((await frame(page,3800)).reveals[0].visible,true,'Light the lamp after the parcel arrives');
  await page.evaluate(()=>{engine.cue('parcel');engine.load(room);});
  assert.deepEqual((await frame(page,3900)).motions[0].offset,[0,0,0],'Loading a scene clears old cues');
  const invalid=await page.evaluate(()=>{
    const base=room.decor[0],metadata=[
      {cue:'parcel',path:[[Infinity,0,0],[0,0,0]]},
      {cue:'parcel',path:[[NaN,0,0],[0,0,0]]},
      {cue:'parcel',path:[[129,0,0],[0,0,0]]},
      {cue:'parcel',path:[[1,0],[0,0,0]]},
      {cue:'parcel',path:[[1,0,0],[1,0,0]]},
      {cue:'parcel',path:[[0,0,0]]},
      {cue:42,path:[[1,0,0],[0,0,0]]}
    ];
    engine.load({...room,decor:metadata.map(motion=>({...base,motion}))});
    return engine.getDebugState().motions;
  });
  assert.deepEqual(invalid,[],'Invalid paths must remain static and never reach uniforms');
  const durations=await page.evaluate(()=>{
    const base=room.decor[0];
    engine.load({...room,decor:[-10,Infinity,1e9].map(duration=>({...base,motion:{...base.motion,duration}}))});
    return engine.getDebugState().motions.map(m=>m.duration);
  });
  assert.deepEqual(durations,[100,1800,30000],'Durations are finite and bounded');
  await page.evaluate(()=>engine.load({decor:[{kind:'agent',x:0,z:0}]}));
  assert.deepEqual((await frame(page,4000)).motions,[],'Legacy scenes do not acquire parcel motion');
  await page.context().close();

  const reduced=await scene('reduce');
  await reduced.evaluate(()=>engine.cue('parcel'));
  for(const time of [1000,1450,1900,2800]){
    const result=await frame(reduced,time);
    assert.deepEqual(result.motions[0].offset,[0,0,0],'Reduced motion always shows the stationary physical result');
    assert.equal(result.reveals[0].visible,true,'Reduced motion displays the final indicator immediately');
  }
  await reduced.context().close();
  console.log('SCORE MOTION PASS: paused trajectory, interpolation, resting result, cue reset, metadata validation, bounded durations, legacy scenes and reduced motion.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
