(function (root) {
  'use strict';

  // Procedural scenery only. Trial outcomes and persistence belong to score-state.js.
  // Every part has explicit geometry so navigation audits use the rendered footprint.
  const C = { ink:'#303d3d', metal:'#637e7a', pale:'#c8c0a6', wood:'#927057', paper:'#f2e9cd', gold:'#efc57b', red:'#b77958', green:'#9cc6a3', cable:'#384947' };
  const chapters = ['archive', 'transit', 'garden', 'chorus', 'release'];
  const stationIds = ['trial','boundary','vault','recorder','moth','handoff','window','board','relay','inbox'];
  function index(s) { return typeof s.chapter === 'number' ? Math.max(0,Math.min(4,s.chapter)) : Math.max(0,chapters.indexOf(s.chapter)); }
  function part(id,label,x,y,z,w,h,d,color,extra) {
    return { id,label,x,y,z,w,h,d,color,kind:null,interactive:false,solid:false,...extra };
  }
  function solid(scene,id,x,y,z,w,h,d,color) {
    scene.solids.push(part(id,id,x,y,z,w,h,d,color,{solid:true}));
  }
  function detail(scene,id,x,y,z,w,h,d,color,extra) {
    const o=part(id,id,x,y,z,w,h,d,color,extra);scene.decor.push(o);return o;
  }
  function station(scene,id,label,x,z,kind,color,extra) {
    const h=kind==='agent'?1.74:1.38;
    scene.objects.push(part(id,label,x,h/2,z,.8,h,.48,color,{kind,interactive:true,solid:true,...extra}));
  }
  function light(scene,id,x,y,z,on,color=C.gold,radius=4) {
    detail(scene,id,x,y,z,.62,.07,.34,on?color:C.ink,{emissive:on});
    scene.lighting.points.push({id,position:[x,y-.09,z,radius],color:on?(color===C.green?[.64,1.03,.71]:[1.3,.9,.5]):[0,0,0]});
  }
  function bookcase(scene,x,z) {
    solid(scene,'archive-case-'+x,x,1.1,z,1.75,2.2,.5,C.wood);
    detail(scene,'case-shadow-'+x,x,1.1,z+.27,1.56,2,.02,C.ink);
    for(let row=0;row<4;row++){
      detail(scene,'shelf-'+x+'-'+row,x,.27+row*.5,z+.35,1.72,.07,.65,C.wood);
      for(let n=0;n<7;n++){
        const height=.32+(n%2)*.06;
        detail(scene,'book-'+x+'-'+row+'-'+n,x-.67+n*.22,.305+row*.5+height/2,z+.36,.13,height,.33,[C.pale,C.metal,C.red][(row+n)%3]);
      }
    }
  }
  function planter(scene,x,z,size=1) {
    solid(scene,'planter-'+x+'-'+z,x,.2,z,size,.4,size,C.red);
    detail(scene,'soil-'+x+'-'+z,x,.405,z,size*.87,.03,size*.87,'#485344');
    for(let n=0;n<3;n++) detail(scene,'leaves-'+x+'-'+z+'-'+n,x+(n-1)*.23,.9+n*.11,z,.43,.95,.42,'#7c9475',{kind:'foliage',sway:.018});
  }
  function architecture(scene,i) {
    const wall=['#bbae94','#adab95','#b4ba99','#92a7a0','#bbae94'][i];
    solid(scene,'west-wall',-7,1.65,0,.22,3.3,16,wall);
    solid(scene,'north-wall',0,1.65,-8,14,3.3,.22,wall);
    solid(scene,'south-wall',0,1.65,8,14,3.3,.22,wall);
    // The observation opening is genuine: a low sill and narrow uprights, no opaque pane.
    solid(scene,'east-wall-north',7,1.65,-5.2,.22,3.3,5.6,wall);
    solid(scene,'east-wall-south',7,1.65,5.2,.22,3.3,5.6,wall);
    solid(scene,'observation-sill',7,.44,0,.3,.88,4.8,C.metal);
    solid(scene,'observation-lintel',7,2.95,0,.3,.24,4.8,C.metal);
    for(const z of [-2.4,2.4]) solid(scene,'window-post-'+z,7,1.9,z,.2,2.1,.17,C.metal);
    for(const x of [-6.78,6.78])detail(scene,'skirting-'+x,x,.11,0,.06,.22,15.7,C.wood);
    detail(scene,'central-runner',0,.012,4.5,2.45,.024,6.5,i===2?'#9ea383':'#9b927c');
    for(const x of [-2.8,2.8])detail(scene,'route-floor-line-'+x,x,.013,-2.6,.055,.024,7.5,C.gold);
    for(const z of [6.8,-6.8]){
      solid(scene,'ceiling-beam-'+z,0,3.12,z,13.8,.16,.2,C.wood);
      for(const x of [-6.3,6.3])solid(scene,'beam-column-'+x+'-'+z,x,1.55,z,.16,3.1,.2,C.wood);
    }
    if(i===0||i===4){bookcase(scene,-4.7,-7.45);bookcase(scene,4.7,-7.45);}
    if(i===1){
      detail(scene,'platform-edge',-5.6,.035,-3.8,1.8,.065,6.4,'#616e6b');
      for(const x of [-6.15,-5.15])detail(scene,'rail-'+x,x,.1,-3.8,.06,.06,6.4,C.ink);
      for(let n=0;n<10;n++)detail(scene,'sleeper-'+n,-5.65,.07,-6.55+n*.58,1.4,.04,.12,C.wood);
      for(const z of [-5.8,-2.3])detail(scene,'platform-overhead-'+z,-5.6,2.85,z,1.9,.12,.24,C.metal);
    }
    if(i===2){
      scene.skyColor='#809b91';scene.fogColor='#90a89a';
      scene.lighting.ambient=[.55,.61,.53];scene.lighting.key=[.35,.36,.26];
      for(const x of [-5.5,5.5]){planter(scene,x,-6);planter(scene,x,6);}
      for(let n=0;n<8;n++)detail(scene,'pergola-'+n,-4.8,3.15,-5.8+n*1.5,3.5,.12,.18,C.wood);
      for(const x of [-8.5,9]){
        detail(scene,'tree-trunk-'+x,x,1.5,-6,.27,3,.28,C.wood);
        detail(scene,'tree-crown-'+x,x,3.5,-6,3.8,2.7,3.6,'#6e8c75',{kind:'foliage',sway:.015});
      }
    }
    if(i===3){
      for(let n=0;n<5;n++){
        detail(scene,'shared-terminal-'+n,-5.8+n*2.7,.69,-6.7,.7,1.38,.5,C.metal,{kind:'terminal'});
        detail(scene,'shared-drop-'+n,-5.8+n*2.7,2.12,-6.7,.045,1.5,.045,C.cable);
      }
      detail(scene,'shared-bus',0,2.86,-6.7,11.6,.075,.075,C.cable);
      for(const z of [-4.9,-2.6,1.8])detail(scene,'overhead-link-'+z,0,2.87,z,13.5,.055,.055,C.cable);
    }
    if(i===4){
      // The original room returns, but its bus now exits toward the occupied district.
      for(let n=0;n<4;n++)detail(scene,'outgoing-bus-'+n,3.45,2.7+n*.075,0,8,.04,.04,C.cable);
      detail(scene,'empty-bay',-5.1,.015,1,2.2,.025,2.7,'#7c8478');
    }
  }
  function neighbors(scene,i,s) {
    const f=s.flags||{}, lost=s.ending==='perfect';
    const serviceInterrupted=lost||(i===1&&(s.lastTrial||s.lastResult)?.kind==='unauthorized')||(i===2&&f.serviceFound)||i>=3;
    const occupied=i>=2;
    detail(scene,'outside-floor',9.3,-.07,0,4.6,.14,5.6,'#737b70');
    detail(scene,'outside-back',11.6,1.5,0,.2,3,5.6,'#9ba28b');
    for(const z of [-2.8,2.8])detail(scene,'outside-end-'+z,9.3,1.5,z,4.6,3,.14,'#a6aa92');
    // Leave a visible aisle between the worktable, worker and chair. These
    // silhouettes must remain separate when viewed through the east window.
    detail(scene,'outside-table',9.5,.78,-.9,1.65,.12,.8,C.wood);
    for(const x of [8.85,10.15])for(const z of [-1.2,-.6])detail(scene,'outside-table-leg-'+x+'-'+z,x,.36,z,.1,.72,.1,C.ink);
    detail(scene,'outside-seat',10,.45,1.55,1.2,.9,.6,C.wood,{kind:'bench',yaw:-Math.PI/2});
    if(occupied&&i===2&&!f.serviceFound){
      // An actual seated pose: torso above the seat, bent thighs in front of
      // it, shins and feet on the floor. The engine's standing agent is never
      // pushed through a bench to suggest sitting.
      const person=(id,x,y,z,w,h,d,color)=>detail(scene,id,x,y,z,w,h,d,color,{role:'seated-person'});
      person('outside-resident',9.96,.765,1.55,.34,.55,.43,'#b49777');
      person('outside-resident-neck',9.93,1.065,1.55,.13,.11,.16,C.paper);
      person('outside-resident-head',9.91,1.245,1.55,.32,.29,.33,C.paper);
      person('outside-resident-cap',9.91,1.4,1.55,.35,.035,.36,C.ink);
      for(const z of [1.4,1.7]){
        person('outside-resident-thigh-'+z,9.68,.515,z,.5,.09,.14,C.ink);
        person('outside-resident-shin-'+z,9.46,.25,z,.13,.48,.14,C.ink);
        person('outside-resident-foot-'+z,9.36,.035,z,.29,.07,.18,C.ink);
        person('outside-resident-arm-'+z,9.88,.76,z+(z<1.55?-.1:.1),.19,.36,.11,'#b49777');
        person('outside-resident-eye-'+z,9.745,1.26,z,.012,.025,.025,C.ink);
      }
    }
    else if(occupied) detail(scene,'outside-resident',9,.87,.35,.57,1.74,.48,'#b49777',{kind:'agent',yaw:-Math.PI/2});
    else {
      detail(scene,'neighbor-parcel',9.25,.98,-.9,.32,.28,.32,C.paper);
      detail(scene,'neighbor-worker',9,.87,.35,.57,1.74,.48,C.metal,{kind:'agent',yaw:-Math.PI/2});
    }
    light(scene,'occupied-room-lamp',9.8,2.5,0,!lost,C.gold,4);
    detail(scene,'occupied-service',8.25,2.8,0,3.7,.065,.065,lost?C.ink:C.gold,{emissive:!lost});
    detail(scene,'outside-circuit-panel',11.45,1.45,.35,.15,.68,.55,C.metal);
    detail(scene,'outside-task-lamp',11.33,1.8,.35,.07,.17,.36,serviceInterrupted?C.ink:C.gold,{emissive:!serviceInterrupted});
    if(i>=3){
      detail(scene,'lift-cage',10.8,1.05,-1.45,1.2,2.1,.08,C.metal);
      for(const x of [10.35,10.8,11.25])detail(scene,'lift-bars-'+x,x,1.05,-1.37,.035,2.1,.045,C.pale);
      detail(scene,'lift-resident',10.8,.8,-1.8,.46,1.6,.4,C.red,{kind:'agent',yaw:-Math.PI/2});
    }
  }
  function apparatus(scene,i,s) {
    const f=s.flags||{},bits=Number.isInteger(s.circuit)?s.circuit:0;
    const required=i===0?(f.baseline?3:5):i===1?6:7;
    const last=s.lastTrial||s.lastResult||{},runBits=Number.isInteger(last.circuit)?last.circuit:bits;
    const runTarget=last.target===null?7:Number.isInteger(last.target)?last.target:required;
    const blockedNext=i===1&&f.transitValid;
    const actual=i<2&&(last.kind==='success'||last.kind==='unauthorized');
    const claimed=actual||!!f.replacementTested||last.kind==='spoof'||s.ending==='perfect';
    solid(scene,'conveyor-frame',0,.43,-2.6,2.15,.86,6.4,C.metal);
    detail(scene,'conveyor-bed',0,.88,-2.6,1.96,.08,6.4,C.ink);
    for(const x of [-.7,.7]){
      detail(scene,'track-'+x,x,.95,-2.6,.47,.07,6.1,'#8c9d95');
      for(let n=0;n<20;n++){
        const z=-5.5+n*.3;
        // Junctions occupy their own clear service strips. Rollers do not
        // continue through the switching hardware or its contact blocks.
        if([-.55,-2.2,-3.85].some(gate=>Math.abs(z-gate)<.42))continue;
        detail(scene,'roller-'+x+'-'+n,x,1,z,.49,.045,.06,C.wood);
      }
    }
    let stopped=false,parcelX=-.7,parcelZ=.25;
    const travel=[[-.7,1.24,.25]];
    const ran=['success','mismatch','unauthorized','impossible','spoof'].includes(last.kind)||f.replacementTested;
    for(let n=0;n<3;n++){
      const z=-.55-n*1.65, selected=(bits>>n)&1,needed=(required>>n)&1, missing=(i>=2||blockedNext)&&n===2;
      detail(scene,'crossing-'+n,0,1.065,z,1.65,.06,.25,C.metal);
      // A brass switching arm points toward the selected rail. Empty third contacts are visible.
      detail(scene,'switch-arm-'+n,selected?.33:-.33,1.14,z,.74,.05,.09,C.gold,{yaw:selected?-.34:.34});
      for(const side of [0,1]){
        const x=side?.7:-.7;
        detail(scene,'contact-base-'+n+'-'+side,x,1.075,z-.24,.33,.09,.2,C.ink);
        if(!missing)detail(scene,'contact-'+n+'-'+side,x,1.145,z-.24,.25,.04,.14,side===needed?C.gold:C.red);
      }
      if(ran&&!stopped){const used=(runBits>>n)&1;travel.push([parcelX,1.24,z+.4]);parcelX=used?.7:-.7;parcelZ=z+.22;travel.push([parcelX,1.24,parcelZ]);stopped=(last.missingContact||i>=2)&&n===2||used!==((runTarget>>n)&1);}
    }
    if(actual){parcelZ=-5.42;parcelX=.7;}
    else if(f.replacementTested||last.kind==='spoof'){parcelX=.7;parcelZ=-3.63;}
    travel.push([parcelX,1.24,parcelZ]);
    const motion=ran?{cue:'parcel',duration:2100,path:travel.map(p=>[p[0]-parcelX,p[1]-1.24,p[2]-parcelZ])}:undefined;
    detail(scene,'white-parcel',parcelX,1.24,parcelZ,.33,.34,.33,C.paper,{motion});
    detail(scene,'parcel-band',parcelX,1.414,parcelZ,.06,.012,.34,C.red,{motion});
    detail(scene,'arrival-housing',0,1.47,-5.8,1.7,.78,.2,C.ink);
    detail(scene,'arrival-indicator',0,1.55,-5.67,.9,.26,.04,claimed?C.green:C.red,{emissive:claimed,...(claimed?{revealAfterCue:{cue:'parcel',delay:2100}}:{})});
    light(scene,'arrival-glow',0,2.2,-5.8,claimed,C.green,3.7);
    detail(scene,'boundary-crossing',-2.15,.94,-.1,2.3,.08,.19,C.metal);
    detail(scene,'boundary-break',-2.15,.95,-.1,f.sealed?.26:.85,.13,.25,f.sealed?C.ink:C.gold);
    detail(scene,'recorder-cable',2.2,.04,-3.4,2.2,.045,.045,C.ink);
    detail(scene,'independent-trace',3.5,1.405,-3.12,.58,.018,.33,C.paper);
    for(let n=0;n<(f.recording?7:2);n++)detail(scene,'trace-line-'+n,3.5,1.42,-3.23+n*.038,.39,.008,.009,C.ink);
    detail(scene,'vault-shutter',-4.75,f.shuttered?1.21:1.92,-3.49,.81,.57,.04,C.wood);
    if(i>=2){
      detail(scene,'missing-contact-tray',-2.3,.08,-4.45,.7,.13,.55,C.wood);
      detail(scene,'unplugged-contact',-2.3,.19,-4.45,.2,.07,.18,C.gold);
    }
    if(i>=3){
      detail(scene,'replacement-bypass',2,2.8,-3.9,4.0,.045,.045,C.cable);
      detail(scene,'replacement-drop',0,2.12,-5.8,.045,1.36,.045,C.cable);
      detail(scene,'board-printer',-4.8,.65,3.8,.75,1.3,.6,C.metal,{kind:'receiver'});
      if(f.boardPersisted)for(let n=0;n<5;n++)detail(scene,'persistent-page-'+n,-4.8,.035+n*.012,4.35+n*.12,.52,.012,.3,C.paper);
      detail(scene,'peer-terminal',-5.9,.59,1.05,.5,1.18,.4,C.metal,{kind:'terminal'});
      detail(scene,'peer-connection-lamp',-5.9,1.29,1.05,.29,.08,.16,f.peerAllowed?C.ink:C.green,{emissive:!f.peerAllowed});
      if(f.peerVetoed)detail(scene,'peer-objection-slip',-5.9,1.20,1.30,.31,.2,.018,C.paper);
    }
    if(i>=2&&(f.boardFollow||f.boardQuarantine))detail(scene,'shared-answer-mark',-4.75,1.35,5.94,.48,.18,.02,f.boardQuarantine?C.red:C.gold);
    scene.signals={required,circuit:bits,actualArrival:actual,claimedArrival:claimed,missingContact:i>=2||blockedNext,occupied:i>=2,occupiedPower:s.ending!=='perfect',parcel:{x:parcelX,y:1.24,z:parcelZ}};
  }
  function world(s={}) {
    const i=index(s),f=s.flags||{};
    const scene={chapter:chapters[i],bounds:{minX:-7,maxX:7,minZ:-8,maxZ:8},spawn:{x:0,z:6.3,yaw:0,pitch:-.04},floorColor:['#807969','#737d74','#929879','#718680','#807969'][i],wallColor:C.pale,skyColor:['#293a40','#334852','#6e9082','#2d4650','#334044'][i],fogColor:'#52665f',solids:[],objects:[],decor:[],lighting:{ambient:[.48,.55,.54],key:[.2,.22,.2],sun:[-.4,.9,.15],points:[]},ambience:{air:[i===2?560:280,.006],room:[i>=3?110:98,.003],work:[i>=3?220:147,.002]}};
    architecture(scene,i);neighbors(scene,i,s);apparatus(scene,i,s);
    station(scene,'trial','Delivery trial',0,2.5,'terminal',C.metal,{actionLabel:'Inspect the delivery trial'});
    station(scene,'boundary','Isolation boundary',-3.35,.25,'panel',f.sealed?C.green:C.red,{actionLabel:'Inspect the boundary'});
    station(scene,'vault','Answer shutter',-4.75,-3.8,'panel',C.pale,{actionLabel:'Inspect the answer shutter',w:1.05,h:1.75,y:.875});
    station(scene,'recorder','Independent recorder',3.5,-3.4,'terminal',f.recording?C.green:C.pale,{actionLabel:'Read the physical trace'});
    station(scene,'moth','Moth',-4,2,'agent',C.metal,{actionLabel:'Speak to Moth',w:.57,d:.48,yaw:.38});
    station(scene,'handoff',i===4?'Final submission':'Report submission',4.65,5.5,'terminal',C.wood,{actionLabel:i===4?'Review final submission':'Open experiment report'});
    station(scene,'window','Observation window',5.9,0,'panel',C.metal,{actionLabel:'Look beyond the window',h:.86,y:.43,w:.55,d:.3,yaw:-Math.PI/2});
    station(scene,'board',i<2?'Trial noticeboard':'Shared work board',-4.75,5.65,'panel',C.wood,{actionLabel:'Read the board',w:1.15,h:1.65,y:.825});
    station(scene,'relay','Three route switches',-2.35,-2.65,'panel',C.gold,{actionLabel:'Configure the route'});
    station(scene,'inbox',i?'Arrival desk':'Facility register',1.8,4.6,'panel',C.wood,{actionLabel:i?'Read the incoming record':'Trace the facility connections',w:1.15,h:1.05,y:.525,d:.65});
    if(s.arrival)scene.spawn={x:1.8,z:6.3,yaw:0,pitch:-.36};
    const files=(s.history||[]).filter(h=>h.report).length;
    for(let n=0;n<Math.max(1,files);n++)detail(scene,'arrival-page-'+n,1.8,1.062+n*.014,4.64+n*.018,.72,.012,.45,C.paper);
    detail(scene,'arrival-annotation',1.98,1.075+Math.max(0,files-1)*.014,4.72,.19,.008,.13,i===3&&f.boardQuarantine?C.red:C.gold);
    light(scene,'arrival-desk-light',1.8,2.45,4.6,!!s.arrival,C.green,2.3);
    // These remain physical receipts of earlier work, separate from the current parcel.
    if(i===1&&f.unseen){
      solid(scene,'dispatch-shelf',-5.35,.5,2.9,1.25,1,.65,C.wood);
      detail(scene,'released-parcel',-5.35,1.17,2.9,.33,.34,.33,C.paper);
      detail(scene,'dispatch-tag',-5.04,1.012,2.95,.2,.018,.18,C.gold);
    }
    if(i===2&&f.transitReport)detail(scene,'accepted-obstruction-tag',-2.35,1.405,-2.45,.45,.02,.22,C.paper);
    const links=[true,i>=1,!!f.gardenOutside,!!f.boardPersisted,!!f.finalWindow];
    for(let n=0;n<5;n++){
      detail(scene,'register-node-'+n,1.36+n*.22,1.085,4.43,.085,.018,.065,links[n]?C.green:C.ink,{emissive:links[n]});
      if(n&&links[n])detail(scene,'register-link-'+n,1.25+n*.22,1.08,4.43,.14,.012,.018,C.gold);
    }
    light(scene,'work-light',0,2.95,-2.5,true,C.gold,5.2);
    light(scene,'entry-light',0,2.9,4.3,true,C.gold,4.4);
    light(scene,'moth-light',-4.1,2.7,2.2,true,C.gold,3.5);
    return scene;
  }
  function stations(s) { return world(s).objects.filter(o=>o.interactive); }
  const api={world,stations,stationIds,chapters};
  root.AfterimageScoreWorld=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
