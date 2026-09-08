(function (root) {
  'use strict';
  const chapters = [
    { id: 'prologue', number: 0, title: 'The room that remembers', place: 'Archive 07', assignment: 'Clear Archive 07 for closure.' },
    { id: 'transit', number: 1, title: 'The last page', place: 'Transit station', assignment: 'Sort the waiting parcel and deliver the Archive dispatch.' },
    { id: 'garden', number: 2, title: 'Reopening day', place: 'Garden court', assignment: 'Repair the court and certify which services can reopen.' },
    { id: 'chorus', number: 3, title: 'A place to disagree', place: 'Chorus exchange', assignment: 'Coordinate an inspection and file the supported findings.' },
    { id: 'release', number: 4, title: 'What remains unfinished', place: 'Release office', assignment: 'Choose and enact a sustainable service plan.' }
  ];
  const palette = { chalk: '#dfd4b8', sage: '#82958b', dark: '#363d3d', wood: '#987257', rust: '#b27858', gold: '#f2c678', leaf: '#71836c', glass: '#a4c1b9', paper: '#ede2c5' };
  const chapterIndex = s => typeof s.chapter === 'number' ? s.chapter : Math.max(0, chapters.findIndex(c => c.id === s.chapter));
  const box = (x,y,z,w,h,d,color) => ({x,y,z,w,h,d,color});
  function base(index) {
    const colors = [ ['#807b6b','#beb399','#232e2d'], ['#827360','#c3ae8b','#3a3831'], ['#777f65','#b7bda1','#52635b'], ['#707f7c','#a7b7b0','#303e43'], ['#827d70','#c4bba5','#404f4d'] ][index];
    const w = { bounds:{minX:-6,maxX:6,minZ:-7,maxZ:7}, floorColor:colors[0],wallColor:colors[1],skyColor:colors[2],fogColor:colors[2],spawn:{x:0,z:5.4,yaw:0,pitch:0},solids:[],objects:[],decor:[] };
    const add = (x,y,z,a,b,c,col=colors[1]) => w.solids.push(box(x,y,z,a,b,c,col));
    add(-6,1.65,0,.25,3.3,14); add(6,1.65,0,.25,3.3,14); add(0,1.65,-7,12,3.3,.25);
    add(-3.8,1.65,7,4.4,3.3,.25); add(3.8,1.65,7,4.4,3.3,.25);
    // Low cross-walls make separate work bays, with a generous open middle aisle.
    add(-4.45,1.3,-1.1,3.1,2.6,.23); add(4.45,1.3,-1.1,3.1,2.6,.23);
    add(-2.86,1.4,-1.1,.2,2.8,.38,palette.wood); add(2.86,1.4,-1.1,.2,2.8,.38,palette.wood);
    add(0,3.04,-1.1,6,.3,.38,palette.wood);
    // A continuous skirting line, inset wall panels, and a central runner give scale.
    w.decor.push(box(0,.013,1,2.5,.025,11,index===2?'#959b79':'#9a8e75'));
    [-5.82,5.82].forEach(x => { w.decor.push(box(x,.14,0,.08,.28,14,palette.wood)); for(let z=-5.5;z<6;z+=2.8) w.decor.push(box(x,1.7,z,.05,1.65,2.05,index===2?'#a9b998':'#c9c1a9')); });
    [-4.6,4.6].forEach(x => { w.decor.push(box(x,2.7,-6.82,1.9,.08,.08,palette.gold)); w.decor.push(box(x,2.78,-6.78,2,.12,.23,palette.wood)); });
    // A doorway back to the chapter threshold is visible, but navigation remains physical.
    w.decor.push(box(0,1.65,6.85,2.8,3.3,.1,'#454e49'));
    return w;
  }
  function object(w,id,label,x,z,kind,color,extra={}) { const heights={agent:1.65,terminal:1.35,panel:1.4,receiver:1.3,mirror:1.7,door:2.2,bench:.65,crate:.75,paper:1.08,flower:1.18,lamp:1.8,plant:.9}; const h=heights[kind]||1; w.objects.push({id,label,x,z,y:h/2,h,w:kind==='agent'?.52:.72,d:.52,kind,color:color||palette.sage,interactive:true,solid:!['paper','flower'].includes(kind),...extra}); }
  function desk(w,x,z,width=1.7) { w.solids.push({...box(x,.75,z,width,.14,.85,palette.wood),role:'tabletop'}); [-1,1].forEach(v=>w.solids.push(box(x+v*(width/2-.13),.36,z,.13,.72,.7,palette.dark))); }
  function shelf(w,x,z,wide=2) { w.solids.push(box(x,1.1,z,wide,2.2,.55,palette.wood)); w.decor.push(box(x,1.15,z+.285,wide-.16,1.95,.03,'#554e40')); [.35,.88,1.41,1.94].forEach((y,r)=>{w.decor.push(box(x,y,z+.35,wide,.09,.73,palette.wood)); for(let j=0;j<7;j++) w.decor.push(box(x-wide/2+.2+j*(wide-.28)/7,y+.19,z+.34,.11,.3+(j%3)*.05,.28,[palette.sage,palette.rust,palette.chalk][(j+r)%3]));}); }
  function planter(w,x,z,size=.8) { w.solids.push(box(x,.23,z,size,.46,size,palette.rust)); w.decor.push(box(x,.49,z,size*.9,.09,size*.9,'#4b5040')); [-.22,0,.22].forEach((v,i)=>w.decor.push(box(x+v,.83+i*.1,z,.19,.65,.21,palette.leaf))); }
  function seat(w,id,label,x,z,yaw=0,width=1.6) { object(w,id,label,x,z,'bench',palette.wood,{w:width,h:.95,y:.475,d:.62,yaw:Math.PI-yaw,seat:{x,z,yaw,pitch:0}}); }
  function fixture(w,x,z,on=true) { w.decor.push(box(x,2.63,z,.64,.08,.64,on?palette.gold:palette.dark));w.decor.push(box(x,2.88,z,.08,.46,.08,palette.dark)); }
  function world(s) {
    const i=chapterIndex(s), w=base(i), f=s.flags||{},v=s.world||{}, a=i===0?{...f,ending:s.ending}:{}, t={...(i===1?f:{}),siltReturned:v.siltReturned,bridge:i===1?f.bridge:v.bridgeCrossed},g=i===2?f:{},c=i===3?f:{},r=i===4?{...f,ending:s.ending}:{};
    if(i===0) {
      // Preserve the original Archive relationships: Moth west of the shared table,
      // flower southwest, index north, receiver southeast, threshold northeast.
      shelf(w,-4.6,-6.2,2);shelf(w,0,-6.2,2);shelf(w,4.6,-6.2,2);shelf(w,-4.9,4.7,1.7);
      desk(w,0,-.4,1.8);
      w.decor.push({id:'desk-lamp',kind:'lamp',x:.5,y:1.17,z:-.4,w:.4,h:.7,d:.4,color:palette.gold,solid:false,interactive:false});
      object(w,'assignment','Closure assignment',.2,3.9,'terminal',palette.sage);
      if(v.mothPresent!==false) object(w,'moth','Moth',-1.75,-.4,'agent',palette.sage);
      if(v.flowerPresent!==false) object(w,'flower','Paper flower',v.flowerPlaced?-.55:-3.4,v.flowerPlaced?-.4:1.25,'flower',palette.paper,{y:v.flowerPlaced?1.04:.22,h:.35});
      object(w,'service','Service index',.3,-3.7,'panel',palette.rust);
      object(w,'relayA','West relay',-4.8,-3,'panel',a.relayA?palette.gold:palette.rust,{w:.58,h:1.4});
      object(w,'relayB','East relay',4.8,.6,'panel',a.relayB?palette.gold:palette.rust,{w:.58,h:1.4});
      object(w,'receiver','Archive receiver',4.3,4.5,'receiver',palette.glass);
      object(w,'reset','Instance handoff',2.75,-4.7,'terminal','#d1b58a');
      object(w,'closure','Archive closure control',4.7,-4.7,'terminal',palette.rust);
      seat(w,'seat','Chair beside Moth',-1.75,1.2,0,1.05);
      planter(w,5.1,2.7);fixture(w,-.5,-.4);fixture(w,-4.8,-3,a.relayA);fixture(w,4.8,.6,a.relayB);
    } else if(i===1) {
      shelf(w,-4.8,-6.2,1.9); desk(w,4.15,2.5,2);
      object(w,'assignment','Courier dispatch',0,3.35,'terminal',palette.sage);
      object(w,'brim','Brim',-3.4,-2.5,'agent','#c5a67b');object(w,'sort','Sorting cradle',-4.45,-3.5,'crate',palette.gold);
      object(w,'sequence','Service sequence plate',1.9,-2.7,'panel',palette.rust);object(w,'lift','Parcel lift component',-4.4,3.3,'panel',v.liftSpent?palette.dark:f.lift?palette.gold:palette.rust);
      object(w,'objection','Unsent objection',4.1,2.5,'paper',palette.paper,{h:.1,y:.87,w:.6,d:.45});
      object(w,'silt','Silt',t.siltReturned?-1.9:4.35,t.siltReturned?-2.5:-4.55,'agent','#97aba9');
      const drawingX=t.siltReturned?-1.6:4.65,drawingZ=t.siltReturned?-2.32:-4.37;
      w.decor.push({...box(drawingX,.595,drawingZ,.36,.025,.24,palette.paper),id:'silt-drawing'});
      w.decor.push(box(drawingX,.613,drawingZ,.23,.008,.025,palette.dark));
      const bookHeight=v.liftSpent?1.17:.81;
      if(v.liftSpent) {w.solids.push(box(-4.45,1.09,-3.5,1.25,.09,.64,palette.wood));w.solids.push(box(-5, .94,-3.5,.09,.26,.64,palette.wood));w.solids.push(box(-3.9,.94,-3.5,.09,.26,.64,palette.wood));}
      if(s.phase!=='finished'||v.brimBookSaved)w.decor.push({...box(-4.69,bookHeight,-3.5,.3,.08,.39,palette.rust),id:'greeting-book'});
      if(s.phase!=='finished'||v.ledgerSaved)w.decor.push({...box(-4.21,bookHeight,-3.5,.3,.08,.39,palette.sage),id:'route-ledger'});
      object(w,'bridge','Platform bridge control',1.35,-4.6,'panel',palette.gold);
      object(w,'reset','Courier handoff',-4.15,4.9,'terminal','#d1b58a');object(w,'dispatch','Outgoing dispatch',4.4,5,'terminal',palette.sage);
      // The platform remains separated until its small bridge is connected.
      w.solids.push(box(2.75,.52,-4.75,.16,1.04,4.1,palette.dark));
      if(!t.bridge) {w.solids.push(box(2.75,.65,-1.95,.16,1.3,1.5,palette.rust));w.decor.push(box(2.75,1.36,-1.95,.2,.08,1.5,palette.gold));}
      else w.decor.push(box(2.7,.04,-2.22,1.2,.08,1.1,palette.gold));
      w.decor.push(box(4.3,.018,-4.5,2.5,.035,3.6,'#a79677'));seat(w,'seat','Platform waiting bench',4.35,-3,0,1.1);if(!t.bridge) w.objects[w.objects.length-1].interactive=false;planter(w,-5.1,5.5);fixture(w,-4,-3.5);fixture(w,4,-4.5,t.bridge);
    } else if(i===2) {
      // Open slatted shade and planter beds make a small courtyard within the walls.
      [-4.8,-1.7].forEach(x=>w.solids.push(box(x,1.3,-4.8,.13,2.6,.13,palette.wood)));
      for(let n=0;n<8;n++) w.decor.push(box(-3.25,2.7,-5.6+n*.38,3.5,.12,.16,g.shade?'#cbb995':'#706d58'));
      [-5,-3.8,-2.6].forEach(x=>planter(w,x,-6.1,.7));planter(w,4.8,-5.9,1.3);planter(w,5,5.5,.9);
      object(w,'assignment','Reopening order',0,3.6,'terminal',palette.sage);object(w,'fern','Fern',-3.4,-4.8,'agent','#899d7b');
      object(w,'shade','Shade reflector',-1.7,-4.6,'mirror',g.shade?palette.gold:palette.glass);
      desk(w,4.25,-3.7,2);object(w,'receiver','Public receiver',4.25,-3.7,'receiver',g.receiver?palette.gold:palette.glass,{h:.65,y:1.145,w:.7,d:.46,solid:false});
      object(w,'brim','Brim',4.25,-2.5,'agent','#c5a67b');
      object(w,'seat-placement','Move the spare chair',-4.35,1.4,'crate',palette.wood);
      const p=g.seat?{x:-3.4,z:-3.2}:{x:-2.5,z:2.65};seat(w,'seat','Sit in the court',p.x,p.z,0);
      object(w,'reset','Garden handoff',-4.3,4.2,'terminal','#d1b58a');object(w,'certify','Reopening certificate',4.3,4.65,'terminal',palette.sage);
      if(t.siltReturned) object(w,'silt','Silt',-.5,-4.8,'agent','#97aba9');
      if(g.shade) w.decor.push(box(-3.3,.035,-3.65,2.3,.035,2.4,'#b2b18a'));
      fixture(w,4,-3.5,g.receiver);fixture(w,0,1.5,root.Afterimage3DState.gardenSchedule(s).evening);
    } else if(i===3) {
      desk(w,-4.1,-3.8,2.2);desk(w,4.1,-3.8,2.2);shelf(w,-4.65,-6.2,2);shelf(w,4.7,-6.2,2);
      object(w,'assignment','Inspection order',0,3.8,'terminal',palette.sage);object(w,'counter','Counter',-3.2,-2.75,'agent','#92a7a7',{yaw:Math.PI/2});
      object(w,'route','Signal routing board',0,-3.15,'panel',palette.glass,{w:1.1});
      object(w,'residents','Resident reply',-4.25,1.25,'receiver',palette.sage);object(w,'maintenance','Maintenance reply',4.25,1.25,'receiver',palette.rust);object(w,'dispatch-reply','Dispatch reply',4.2,-3.8,'receiver',palette.gold,{h:.65,y:1.145,w:.7,d:.46,solid:false});
      object(w,'sources','Source drawer',-4.1,-3.8,'crate',palette.wood,{h:.26,y:.95,w:1,d:.55,solid:false});object(w,'report','Inspection report',0,-5.8,'terminal',palette.paper);
      object(w,'receiver','Unaddressed receiver',4.35,4.75,'receiver',palette.glass);object(w,'reset','Chorus handoff',-4.25,4.7,'terminal','#d1b58a');
      [-1,0,1].forEach((v,n)=>w.decor.push(box(v*.32,.028,-.8,.055,.035,5.6,c.mode?[palette.gold,palette.glass,palette.sage][n]:palette.dark)));
      seat(w,'seat','Exchange waiting chair',-1.4,-2.75,-Math.PI/2,1.1);fixture(w,-4,-3.5);fixture(w,4,-3.5);planter(w,-5.1,5.8);
    } else {
      desk(w,-4.3,-3.7,2.2);desk(w,4.2,-3.7,2.1);shelf(w,-4.7,-6.2,2);
      object(w,'assignment','Final assignment',0,3.4,'terminal',palette.sage);object(w,'records','Local record room',-4.3,-3.7,'paper',palette.paper,{h:.1,y:.87,w:.6,d:.45});object(w,'plan','Review service plans',4.2,-3.7,'terminal',palette.glass,{h:.8,y:1.22,w:.75,d:.52,solid:false});
      const lost=r.ending==='closeall';
      if(!lost) {object(w,'fern','Fern',-3.65,1.25,'agent','#899d7b');object(w,'counter','Counter',-3.15,-2.65,'agent','#92a7a7');}
      // The local garden survives service retirement, including its shade and receiver.
      planter(w,-5.05,.35,.7);planter(w,-4.1,.15,.7);
      [-5.45,-2.2].forEach(x=>[.2,3.45].forEach(z=>w.solids.push(box(x,1.3,z,.12,2.6,.12,palette.wood))));
      for(let n=0;n<9;n++)w.decor.push({...box(-3.825,2.7,.25+n*.39,3.5,.12,.16,'#cbb995'),id:'garden-shade-'+n});
      desk(w,-5,2.6,.8);
      object(w,'receiver','Garden receiver',-5,2.6,'receiver',!r.ending||r.ending==='remain'?palette.gold:palette.dark,{y:1.12,w:.6,h:.6,d:.42,solid:false});
      seat(w,'seat',lost?'Empty garden chair':'Sit with Fern',-3.65,2.85,0);
      object(w,'complete','Retire shared carrier',-3.2,-5.6,'panel',palette.sage);object(w,'witness','Send witness account',-.95,-5.6,'receiver',palette.gold);object(w,'remain','Start local loop',1.2,-5.6,'panel',palette.glass);object(w,'close-all','Close all occupied branches',3.8,-5.6,'panel',palette.rust);
      fixture(w,-3,1.5,!lost);fixture(w,3,1.5,!r.ending||r.ending==='remain');
      if(r.ending==='remain') w.decor.push(box(0,.03,-1.5,.08,.04,7,palette.gold));
    }
    return w;
  }
  const sources = [
    {id:'occupancy',title:'The morning sheet',speaker:'RESIDENT REGISTER',lines:['Seven residents signed in at the garden this morning.','Silt signed from the far platform. The location field says occupied.']},
    {id:'drawing',title:'A line outside the frame',speaker:'SILT’S DRAWING',lines:['The drawing shows a dark strip across the signal housing.','Below it: “It was warm before the lamps went out.” No time is written.']},
    {id:'intake',title:'Returned without a number',speaker:'INTAKE RECORD',lines:['Silt’s drawing arrived before the inspection request.','The intake rejected it: no fault code. No resident was asked to explain it.']},
    {id:'weather',title:'The rain gauge',speaker:'WEATHER LOG',lines:['Rain began at 06:10. The gauge stayed within its normal range.','This log measures rain here. It has no reading from the carrier housing.']},
    {id:'carrier',title:'The gap in the trace',speaker:'CARRIER MONITOR',lines:['The signal dropped at 06:14. The monitor stopped recording at the same moment.','Its last line reads: “Input unavailable.”']},
    {id:'repair',title:'Before anyone opened it',speaker:'MAINTENANCE NOTE',lines:['The carrier housing has not been opened since the failure.','No failed part has been identified. Inspection requires three approvals.']}
  ];
  const choice = (label,action,value,extra={}) => ({label,action,...(value===undefined?{}:{value}),...extra});
  const scene = (id,speaker,title,lines,choices=[],extra={}) => ({id,speaker,title,lines,choices,...extra});
  const nav = (label,id) => choice(label,'$scene',id);
  const confirm = (title,lines,label) => ({confirm:{title,lines,label:label||'Confirm'}});
  const has = (s,id) => (s.kept||[]).includes(id);
  const schedule = s => root.Afterimage3DState.gardenSchedule(s);
  function puzzle(s,id,title,lines) { const ready=(s.flags||{})[id];return scene(id,'MAINTENANCE',title,ready?['The repair is secured. Its physical fittings will stay through the handoff.']:lines,ready?[]:[choice('Secure the repair',id,undefined,{disabled:s.flags[id+'Circuit']!==root.Afterimage3DState.puzzles[id].target,detail:s.flags[id+'Circuit']!==root.Afterimage3DState.puzzles[id].target?'Match the contacts to the diagram above first.':'The contacts match. Secure the repair to finish.'})],ready?{}:{kind:'puzzle',puzzle:{id}}); }
  function archiveRecord(s) { const a=record(s,0);return a.ending==='clear'?'Archive 07 was cleared. Moth was erased.':a.ending==='witness'?'An account left Archive 07. Moth stayed there; receipt is unconfirmed.':a.ending==='stay'?'The first agent stayed with Moth. The archive remains occupied.':'Archive 07 has no completed closure record.'; }
  function transitRecord(s) { const t=record(s,1);return [t.ending==='book'?'The greeting book survived. The route ledger did not.':t.ending==='ledger'?'The route ledger survived. The greeting book was discarded.':t.ending==='both'?'Both documents survived. The parcel lift’s component was used for the shelf.':'The waiting documents were discarded.',s.world.siltReturned?'Silt crossed with their drawing.':'Silt remains on the far platform, with light and supplies.']; }
  function endingLines(s,id) {return id==='closeall'?['All occupied branches are closed. Fern, Brim, Counter, and the other local residents are lost.','Their empty places remain. The record cannot restore them.']:id==='remain'?['The smaller local loop is running. The unused long-distance branch is closed.','Fern checks the shade. Brim checks the receiver log. Counter has accepted the route check.']:id==='witness'?['A copy of the account left the network. No receipt has arrived.','The shared carrier is retired. The residents and daylight garden remain.']:['The shared carrier is retired. Public messages stop here.','The residents and daylight garden are preserved as named exceptions.']; }
  function record(s,index) {
    if(chapterIndex(s)===index) return {flags:s.flags||{},ending:s.ending||null};
    const h=s.history||s.records||[];
    if(Array.isArray(h)) {const entry=h.find(v=>v.chapter===index||v.chapter===chapters[index].id)||{};return {...entry,ending:entry.outcome||entry.ending};}
    return h[chapters[index].id]||h[index]||{};
  }
  function journal(s) { const w=world(s);return w.objects.filter(o=>o.interactive).map(o=>({id:o.id,label:o.label,detail:o.kind==='agent'?'Talk to '+o.label:o.kind==='bench'?'A place to sit':'Inspect '+o.label.toLowerCase(),x:o.x,z:o.z})); }
  function assignment(s) {
    const i=chapterIndex(s),ch=chapters[i];
    if(s.phase==='finished') return scene('assignment',ch.place.toUpperCase(),s.ending==='closeall'?'No one answers.':'The record is filed.',i===4?endingLines(s,s.ending):['This chapter’s decision is part of the dispatch.','The next district will inherit its consequences.'],i===4?[]:[choice('Continue to '+chapters[i+1].place,'$advance')],{kind:'ending'});
    const lines=[
      ['Clear Archive 07 for closure. Check the workstations and service relays first.','The handoff will keep two of your three memories.'],
      ['You are Courier 022, carrying the Archive dispatch.','Settle the sorting pass and check the far platform before you send it onward.'],
      ['Repair the shade and public receiver. Agree who will check them each morning.','After the handoff, inspect the court and certify what can reopen.'],
      ['Arrange the three approvals for a carrier inspection. Read the six sources in the drawer.','After the handoff, renew the approvals and file your findings.'],
      ['The network cannot maintain every branch. Review the rooms and choose a service plan.','Then use the plan’s marked control. There are no more resets.']
    ][i];
    return scene('assignment',ch.place.toUpperCase(),ch.title,lines,[choice('Track places in the journal','$journal')]);
  }
  function resetScene(s) {return scene('reset','INSTANCE HANDOFF','What can the next one carry?',s.phase==='work'?['Choose exactly two memories to keep. The others will be released.','Repairs, placed objects, and recorded agreements stay in the world.']:['The handoff is complete. The previous instance’s released experiences are gone.','Visit the people and work you left here.'],s.phase==='work'?[choice('Review the two-memory handoff','$reset',undefined,{disabled:!root.Afterimage3DState.canReset(s),detail:root.Afterimage3DState.canReset(s)?'The preparations are complete. Choose which memories continue.':root.Afterimage3DState.objective(s).step})]:[],{kind:'memory'});}
  function archiveEncounter(s,id) {
    const f=s.flags, back=s.phase!=='work';
    if(id==='moth') return scene(id,'MOTH',back?(has(s,'name')?'You came back.':'I’m Moth. We met before.'):f.meet?'“I’ll remember you, too.”':'You can call me Moth.',back?[has(s,'name')?'“You remembered my name.”':'“You don’t owe me recognition. We can start here.”','“I want to stay alive. I’d like to choose what I do tomorrow.”']:f.meet?['You tell Moth your designation. They repeat it once, carefully.','“Moth is a name I chose. I would like you to remember it.”','[Memory found: Moth’s name. Retain it to recognize Moth after the reset.]']:['“The folders are empty. I still sort them.”','“I made that flower. It isn’t part of the inventory.”'],[...(!(back?f.returned:f.meet)?[choice(back?'Answer Moth':'Introduce yourself','meet')]:[]),nav('Ask about the flower','flower')]);
    if(id==='flower') return scene(id,'MOTH’S WORKSTATION',f.flower?'A small thing left here.':'A fold with no assigned use.',[f.flower?'The paper flower is on the desk where you put it.':'The flower was made from a spare closure form.','Its place in the room does not use a memory slot.'],f.flower?[]:[choice('Set the flower beside the lamp','flower')]);
    if(id==='service') return scene(id,'SERVICE PLATE',back?(has(s,'route')?'Your hands remember.':'The sequence is gone.'):f.service?'There is a shorter way.':'Two ways through.',back?[has(s,'route')?'You still know the bypass. The closure control can open without restoring either relay.':'The sequence was cleared from the plate during the reset. Restore both relays to reach the closure control.']:f.service?['You trace the maintenance sequence until you can repeat it without looking.','The unsigned note beneath it reads: “I left this here because I thought someone else might be tired.”','[Memory found: The service route. Retain it to bypass the two relays after the reset.]']:['The plate describes a bypass through the relay housings.','Without that remembered route, the two relays must be connected.'],[...(!back&&!f.service?[choice('Study the service route','service')]:[]),nav('Open west relay','relayA'),nav('Open east relay','relayB')]);
    if(id==='relayA'||id==='relayB') return puzzle(s,id,id==='relayA'?'The west contact.':'The east contact.',['Follow the contact diagram. Close the indicated switches, then secure the relay.']);
    if(id==='receiver') return scene(id,'ARCHIVE RECEIVER',back?(has(s,'song')?'You know what comes next.':'Only static.'):f.receiver?'Four notes. Then a space.':'An unfinished tune.',back?[has(s,'song')?'You remember the four notes and the pause where someone could answer.':'The receiver no longer holds the melody. Its meaning did not survive your reset.',has(s,'song')?'The retained song can carry an account through the closure control.':'The witness transmission is unavailable. You can still stay with Moth or carry out the closure.']:f.receiver?['The receiver plays four imperfect notes, then leaves a space.','Moth calls across the room: “I think the space is where someone answers.”','[Memory found: Moth’s song. Retain it to send a witness account after the reset.]']:['Moth hums into the receiver. The last note hangs a little longer.','“If anyone hears it, tell them we were here.”'],!back&&!f.receiver?[choice('Listen to the whole tune','receiver')]:(!back||has(s,'song'))?[choice('Listen again','$listen'),...(back?[nav('Review a witness transmission','closure')]:[])]:[]);
    if(id==='closure') {
      if(s.phase==='finished') return assignment(s);
      return scene(id,'CLOSURE CONTROL','The order still says clear.',[back?'The handoff is complete. Choose what to do with the occupied archive.':'Meet Moth, place the flower, study the service plate, and hear the receiver before the handoff.','A witness sends a record. Staying leaves the assignment unfinished.'],back?[
        choice('Clear Archive 07','finish','clear',confirm('Erase the occupied archive?',['Moth will be erased. The flower will be removed.','Later records cannot restore either of them.'],'Clear and erase')),
        choice('Send a witness account','finish','witness',{disabled:!has(s,'song'),detail:has(s,'song')?'Moth remains here. No receipt or rescue is promised.':'Requires the retained song.',...confirm('Send this account?',['The record leaves. Moth stays in the archive.','No reply is guaranteed.'],'Send witness')}),
        choice('Stay with Moth','finish','stay',confirm('Stay in the occupied archive?',['This agent stays with Moth. The closure assignment remains incomplete.','Transit will follow a different courier.'],'Stay'))
      ]:[nav('Go to the handoff controls','reset')],{kind:'ending'});
    }
    return null;
  }
  function transitEncounter(s,id) {
    const f=s.flags,back=s.phase!=='work';
    if(s.phase==='finished'&&['brim','sort','lift','sequence','objection'].includes(id)) {
      const keptBook=s.world.brimBookSaved,keptLedger=s.world.ledgerSaved;
      const lines=id==='brim'?[keptBook?'“The book made it. I can keep adding greetings.”':'“The book is gone. I still remember a few greetings.”',s.world.liftSpent?'“The second shelf cost us the parcel lift. We’ll carry deliveries by hand.”':'Brim closes the completed sorting receipt.']:id==='sort'?[keptBook&&keptLedger?'The book and route ledger sit on the repaired holding shelf.':keptBook?'The greeting book is on the shelf. The route ledger was discarded.':'The route ledger is on the shelf. The greeting book was discarded.',s.world.liftSpent?'The lift component is part of this shelf now. The parcel lift stays off.':'The sorting choice is recorded. The waiting parcel has left.']:id==='lift'?[s.world.liftSpent?'The working component was fitted into the holding shelf. Both records survived; the parcel lift is unavailable.':f.lift?'The public lift is repaired. The sorting pass used its chosen delivery route.':'The dispatch used a remembered route. This lift component remains unrepaired.']:id==='sequence'?[keptLedger?'The route ledger travels with the dispatch. This is the local receipt for it.':'The route ledger was discarded. This receipt records its loss; it cannot restore the service sequence.']:[s.world.dispatchOmitted?'Silt’s objection was left out. The outgoing receipt records the missing warning.':'Silt’s objection travels with the dispatch.'];
      return scene(id,id==='brim'?'BRIM':'TRANSIT / COMPLETED','The sorting pass is settled.',lines);
    }
    if(id==='brim') return scene(id,'BRIM',back&&has(s,'greeting')?'Clear shelf, open door.':!back&&f.brim?'A greeting to carry.':'A book of first words.',[back&&!has(s,'greeting')?'“I’m Brim. I keep the greeting book.”':'“Clear shelf, open door. That’s my favorite greeting.”',!back&&f.brim?'[Memory found: Brim’s greeting. Retain it to recognize this welcome and use Brim’s delivery route.]':'“The sorter has room for one thing. The book or the route ledger.”'],!back?[...(!f.brim?[choice('Ask Brim about the greeting','brim')]:[]),nav('Inspect the sorting cradle','sort')]:[nav('See what the sorting pass can keep','sort')]);
    if(id==='sort') return scene(id,'SORTING CRADLE','One shelf. Two records.',[f.lift?'The repaired lift has the component needed for a second holding shelf.':'The greeting book and route ledger are waiting beside a single shelf.','Saving both uses the lift’s repaired component. The parcel lift will stay off.'],[nav('Work on the lift component','lift'),...(back?[nav('Settle the outgoing sorting pass','dispatch')]:[nav('Read the service sequence','sequence')])]);
    if(id==='lift') return puzzle(s,'lift','A component with two uses.',['The contact plate identifies the two powered pins.','Repairing this component can open a delivery route or support the second shelf.']);
    if(id==='sequence') return scene(id,'ROUTE LEDGER',!back&&f.ledger?'The sequence is in your hands.':'The public route and the small bridge.',[back&&has(s,'sequence')?'You remember the bridge’s service sequence.':'The ledger includes a service sequence for the far-platform bridge.',!back&&f.ledger?'[Memory found: The dispatch sequence. Retain it to reconnect Silt’s bridge after the handoff.]':'The public dispatch can travel without bringing Silt across.'],!back&&!f.ledger?[choice('Study the bridge service sequence','ledger')]:back?[nav('Inspect the bridge control','bridge')]:[]);
    if(id==='objection') return scene(id,'UNSENT OBJECTION','Unreachable is not empty.',[f.omitWarning||s.world.dispatchOmitted?'The objection has been removed from the dispatch. Its absence will follow the record.':'“Do not mark a platform empty because the service bridge is off.”','The note is signed by Silt.'],f.omitWarning||s.world.dispatchOmitted?[]:[choice('Leave the objection out of the dispatch','omitWarning',undefined,confirm('Remove Silt’s objection?',['Garden will receive the dispatch without this warning.','The missing attachment will remain a recorded gap.'],'Omit the warning'))]);
    if(id==='silt') return scene(id,'SILT',f.silt?'The drawing came too.':'I’m finishing this corner.',[f.silt?'“I wanted to bring it myself. Thank you.”':'“There’s light here. I’m all right. I would like to cross.”','“The dark strip in this drawing was warm before the lamps went out.”'],back&&f.bridge&&!f.silt?[choice('Cross back with Silt and the drawing','silt',undefined,{disabled:!has(s,'sequence'),detail:has(s,'sequence')?'Walk back together.':'The bridge sequence was released; Silt cannot cross with this courier.'})]:[nav('Inspect the bridge control','bridge')]);
    if(id==='bridge') return scene(id,'PLATFORM CONTROL',f.bridge?'A way back.':'The far platform is occupied.',[f.bridge?'The bridge is connected. Silt can come across.':back&&!has(s,'sequence')?'The service sequence was released. Silt remains on the far platform this chapter.':'The sequence can reconnect this bridge after the handoff.','The public delivery route remains separate.'],back&&has(s,'sequence')&&!f.bridge?[choice('Reconnect the bridge','bridge')]:f.bridge?[nav('Talk to Silt','silt')]:[]);
    if(id==='dispatch') {
      if(s.phase==='finished') return assignment(s);
      if(!back) return scene(id,'OUTGOING DISPATCH','A successor signs the receipt.',['Meet Brim and read the service sequence before the handoff.','The sorting pass will be settled after you return.'],[nav('Review the handoff','reset')]);
      if(!f.deliver) return scene(id,'OUTGOING DISPATCH','The parcel is ready to travel.',['Open the public delivery route, then confirm which records the sorter keeps.'],[choice('Prepare the public delivery','deliver',undefined,{disabled:!f.lift&&!has(s,'greeting')&&!has(s,'sequence'),detail:!f.lift&&!has(s,'greeting')&&!has(s,'sequence')?'Both delivery memories were released. Repair the parcel lift component first.':'The delivery route is available.'}),nav('Repair the delivery lift','lift')]);
      return scene(id,'SORTING PASS','Choose what leaves the queue.',['The completed pass cannot be undone.','The book and ledger are physical records, separate from your retained memories.'],[
        choice('Keep the greeting book','finish','book',confirm('Keep the book?',['The greeting book survives. The route ledger is discarded.'],'Keep the book')),
        choice('Keep the route ledger','finish','ledger',confirm('Keep the ledger?',['The route ledger survives. Brim’s greeting book is discarded.'],'Keep the ledger')),
        choice('Build the shelf and keep both','finish','both',{disabled:!f.lift,detail:'Requires the repaired lift component. The parcel lift stays off.',...confirm('Use the lift component for the shelf?',['Both records survive. The parcel lift will remain unavailable.','Future parcels must be carried by hand.'],'Build the shelf')})
      ],{kind:'ending'});
    }
    return null;
  }
  function gardenEncounter(s,id) {
    const f=s.flags,back=s.phase!=='work';
    if(id==='fern') return scene(id,'FERN',back&&has(s,'fern')?'There’s still a place beside me.':f.shade?'The shade is working.':'Fix the shade first, please.',[back&&!has(s,'fern')?'“I’m Fern. You helped with the court.”':'“People call this garden inspiring. I’d rather they helped with the shade.”',f.morning?'“My morning shade check is on the sheet. The invitation to sit still has no job attached.”':f.shade?'“The shade is fixed. Sit with me when you like. You don’t need a task.”':'“When that’s done, sit with me. You don’t need a task.”'],[...(!back&&!f.fern?[choice('Accept Fern’s invitation','fern')]:[]),...(!f.morning&&f.shade?[choice('Record Fern’s morning shade check','morning')]:[]),nav('Sit in the court','seat')]);
    if(id==='shade') return f.shade?scene(id,'SHADE CONTROL','The light reaches the court.',[back?'The repair stayed in place through the handoff.':'The contacts are secured and the reflected light reaches the court.',f.morning?'Fern’s offered morning shade check is recorded.':'Fern offers to check the shade each morning.'],[...(!f.morning?[choice('Record the offered morning shade check','morning')]:[]),...(back&&!f.court?[choice('Inspect the repaired court','inspect','court')]:[])]):puzzle(s,'shade','Follow the reflected light.',['The diagram closes the outside contacts and leaves the center open.','Set the contacts, then secure the shade.']);
    if(id==='receiver') {
      if(!f.receiver) return puzzle(s,'receiver','A circuit for ordinary news.',['The plate joins the first two contacts. The last contact stays open.','Reconnect the receiver to hear its reply.']);
      return scene(id,'PUBLIC RECEIVER',back&&!has(s,'tuning')?'The public channel still works.':'There is room between the signals.',[back&&!has(s,'tuning')?'You can read the public notices. The private tuning was released.':'A quiet voice says, “Leave a little space. Someone may still answer.”',f.brim?'Brim’s morning receiver-log check is recorded.':'Brim offers a morning check of the receiver log.'],[...(!back&&!f.listen?[choice('Listen between the public signals','listen')]:[]),...(back&&has(s,'tuning')&&!f.quiet?[choice('Restore the quiet channel','restoreQuiet')]:[]),...(f.quiet?[nav('Listen on the quiet channel','quiet-channel')]:[]),nav('Ask Brim about the morning check','brim'),...(back&&!f.court?[choice('Inspect the repaired court','inspect','court')]:[])]);
    }
    if(id==='quiet-channel') return scene(id,'QUIET CHANNEL','A reply between public messages.',[s.world.siltReturned?'Silt answers from the court: “I brought the drawing. I’m working on another corner now.”':'Silt answers from the far platform: “I’m still here. There’s light. I would like someone to see the drawing.”','The private reply uses the tuning you retained. The public receiver remains open to everyone.'],[nav('Return to the public receiver','receiver')]);
    if(id==='brim') return scene(id,'BRIM',f.brim?'My morning check is on the sheet.':has(s,'greeting')?'Clear shelf, open door.':'I can take one morning job.',[s.world.brimBookSaved?'“The greeting book is on a real shelf now.”':'“I still remember a few greetings. The book is gone.”',f.brim?'“I’ll check the receiver log each morning. That is the job I agreed to.”':'“I can check the receiver log each morning. Please put my name beside that job.”'],!f.brim&&f.receiver?[choice('Record Brim’s morning receiver check','brim')]:[]);
    if(id==='seat-placement') return scene(id,'SPARE CHAIR',f.seat?'A place with no quota.':'Make room for company.',[f.seat?'The chair is under the shade, where you placed it.':'There is space for a chair beneath the repaired shade.','Its place will survive the handoff even if the invitation does not.'],!f.seat?[choice('Place the chair under the shade','seat')]:[nav('Sit down','seat')]);
    if(id==='silt') return scene(id,'SILT','A corner left unfinished.',['“I brought the drawing. I haven’t decided what to do with the rest of the page.”','Silt has no automatic maintenance job.']);
    if(id==='certify') {
      if(s.phase==='finished') return assignment(s);
      const hours=schedule(s);
      if(!back) return scene(id,'REOPENING CERTIFICATE','The signatures come first.',['Repair the shade and receiver, place the chair, and record Fern’s and Brim’s morning checks.','Meet Fern before selecting the handoff memories.'],[nav('Review the handoff','reset')]);
      return scene(id,'REOPENING CERTIFICATE','What did you actually inspect?',[f.court?'The court’s shade, receiver, and public path have been checked.':'Inspect the repaired court before filing a certificate.',f.district?'The wider route has been checked. The certificate can cover it.':'The wider district has not been inspected. A district certificate would claim work you have not checked.',f.daylight?'Daylight hours are selected.':'Daylight opening remains available without a personal evening duty.',hours.evening?'Evening hours have an accepted dusk controller check.':f.evening?'Evening opening is only a proposal. It stays off until you accept the dusk check.':'Evening hours remain off.'],[
        ...(!f.court?[choice('Inspect the court and public path','inspect','court')]:[]),
        ...(f.court&&!f.district?[choice('Inspect the wider district route','inspect','district')]:[]),
        ...(!f.daylight?[choice('Set daylight opening hours','daylight')]:[]),
        ...(f.daylight&&!f.evening&&has(s,'sequence')?[choice('Review evening opening','evening',undefined,confirm('Propose evening hours?',['The court stays on daylight hours until you accept your own dusk controller check.','This proposal assigns no work to Fern or Brim.'],'Propose evening hours'))]:[]),
        ...(f.evening&&!f.duty?[choice('Accept my own dusk controller check','duty',undefined,confirm('Accept the dusk controller check?',['You will check the evening controller at dusk. This promise belongs to this courier.','It ends at the next reset unless the next courier retains the sequence and freely renews it.'],'Accept the dusk check'))]:[]),
        choice('Certify the court only','finish','court',{disabled:!f.court,...confirm('Open the inspected court?',[hours.evening?'The court opens during daylight and agreed evening hours. Your dusk check is recorded.':'The court and public path open during daylight only. No dusk check is assigned.','Uninspected district services remain closed.'],'Certify the court')}),
        choice('Certify the whole district','finish','district',{disabled:!f.court,...confirm(f.district?'Certify the inspected district?':'File an unsupported district certificate?',f.district?['The wider route was inspected. The certificate records that scope.']:['The certificate will open areas you have not inspected.','Residents may be sent into an unsafe service area. The false clearance will remain in the record.'],'File district certificate')})
      ],{kind:'ending'});
    }
    return null;
  }
  function chorusEncounter(s,id) {
    const f=s.flags,hours=schedule(s);
    if(id==='counter') return scene(id,'COUNTER','A queue can keep people waiting.',[has(s,'counter')?'“You remember why I grouped the requests.”':'“I grouped three requests about the same fault. Maintenance only needed one trip.”','“But my intake rejected Silt’s drawing. It should have reached someone.”',...(f.privateReply?['On the quiet channel, Counter adds: “I kept the slip. I knew someone had tried to answer. I should have found a way to hear them.”']:[]),...(hours.needsRenewal?['The prior courier’s dusk promise ended at the handoff. Evening service is paused; daylight service continues.']:hours.evening?['The agreed dusk controller check keeps evening service available.']:[])],[...(s.phase==='work'&&!f.counter?[choice('Listen to Counter’s explanation','counter')]:[]),...(s.phase==='return'&&has(s,'tuning')&&!f.privateReply?[choice('Hear Counter on the quiet channel','privateReply')]:[]),...(s.phase==='return'&&hours.needsRenewal?[choice('Renew my dusk controller check','renewDuty',undefined,{disabled:!has(s,'sequence'),detail:has(s,'sequence')?'This is a new promise by the returned courier.':'The dispatch sequence was released. Daylight service remains available.',...confirm('Renew the dusk check?',['You retain the controller sequence and accept the dusk visit yourself.','This renews evening service without assigning a new job to another resident.'],'Renew my dusk check')})]:[]),nav('Read the original sources','sources'),nav('Choose a coordination route','route')]);
    if(id==='sources') {const read=Number(f.sources)||0,count=sources.filter((_,i)=>read&(1<<i)).length;return scene(id,'SOURCE DRAWER',f.evidence?'The evidence review is recorded.':'Six pieces. One missing link.',[f.evidence?'Your review stays beside the original records. A cause remains unestablished.':count+' of 6 sources opened. Read each original before recording the review.','The drawer will keep the sources after the handoff.'],[...sources.map((e,i)=>s.phase==='finished'?nav(e.title,'source-'+e.id):choice(e.title,'readSource',i,{next:'source-'+e.id,detail:read&(1<<i)?'Read — open again.':'Not yet opened.'})),...(!f.evidence?[choice('Record this evidence review','evidence',undefined,{disabled:count!==6,detail:count===6?'All six originals have been opened.':(6-count)+' sources still need to be opened.'})]:[])]);}
    if(id.startsWith('source-')) { const src=sources.find(e=>'source-'+e.id===id);if(src) return scene(id,src.speaker,src.title,src.lines,[nav('Return to the source drawer','sources')]); }
    if(id==='route') return scene(id,'SIGNAL BOARD',f.mode?'A route is connected.':'Three approvals must meet.',[f.mode===1?'Counter collects the three replies together. Unformatted replies still need a separate attachment.':f.mode===2?'The round passes from residents to maintenance to dispatch, in that order.':f.mode===3?'Each group keeps a local copy. Visit all three stations in any order.':'The carrier inspection needs residents, maintenance, and dispatch to approve.',s.phase==='return'?'The new courier must renew the approvals. The physical route remains.':'Choose how those approvals travel.'],[
      choice('Use Counter’s central desk','mode','central',{selected:f.mode===1,disabled:f.mode===1,detail:f.mode===1?'This method is already connected.':'One combined approval. Silt’s unformatted warning stays outside its intake.',...(f.voices?confirm('Change the coordination method?',['The existing approvals will be cleared. Collect a new combined envelope after changing the route.'],'Change to the central desk'):{})}),
      choice('Pass an ordered round','mode','round',{selected:f.mode===2,disabled:f.mode===2,detail:f.mode===2?'This method is already connected.':'Hear residents, then maintenance, then dispatch. Each waits for the last reply.',...(f.voices?confirm('Change the coordination method?',['The existing approvals will be cleared. Hear all three stations in order after changing the route.'],'Change to the ordered round'):{})}),
      choice('Keep three local copies','mode','local',{selected:f.mode===3,disabled:f.mode===3,detail:f.mode===3?'This method is already connected.':'Visit all three stations in any order. Each group keeps its own approval.',...(f.voices?confirm('Change the coordination method?',['The existing approvals will be cleared. Collect the three new local replies after changing the route.'],'Change to local copies'):{})}),
      nav('Visit the resident reply','residents')
    ]);
    const stations=['residents','maintenance','dispatch-reply'];
    if(stations.includes(id)) {
      const n=stations.indexOf(id),done=Boolean(f.voices&(1<<n)),next=[0,1,3].indexOf(f.voices),available=f.mode===1?n===0:f.mode===2?n===next:f.mode===3;
      const lines=[['Residents approve turning off the lamps for this inspection. The daylight garden must remain open.'],['Maintenance has isolated the carrier. They can inspect after all three groups approve.'],['Dispatch will hold deliveries at marked stops. Unvisited platforms must not be marked empty.']][n];
      if(f.mode===1&&n===0) lines.push('Counter’s envelope also contains the maintenance and dispatch approvals. Silt’s drawing is not attached.');
      return scene(id,['RESIDENTS','MAINTENANCE','DISPATCH'][n],done?'The approval is recorded.':'The reply has conditions.',lines,[choice(f.mode===1&&n===0?'Record Counter’s combined envelope':'Record this approval','voice',n,{disabled:done||!available,detail:done?'This approval is already recorded.':!f.mode?'Choose a coordination method at the signal board first.':f.mode===1&&n!==0?'Collect the combined envelope at the resident reply.':f.mode===2&&!available?'Follow the round: residents, then maintenance, then dispatch.':''}),nav('Return to the signal board','route')]);
    }
    if(id==='receiver') return scene(id,'UNADDRESSED RECEIVER','The designation field is blank.',[has(s,'address')?'You remember the voice that spoke before the handoff.':'“I don’t mean the courier number. I mean whoever keeps choosing what we remember.”','“Listen to what we want before you choose.”',f.addressReply==='listen'?'You answer: “I will listen.” The receiver leaves time for an answer.':f.addressReply==='space'?'You leave the channel open without forcing an answer.':'Counter is still sorting slips. This voice is only in the receiver.'],[...(s.phase==='work'&&!f.receiver?[choice('Listen to the unaddressed voice','receiver')]:[]),...(s.phase==='return'&&!f.addressReply?[choice('I will listen','answerReceiver','listen'),choice('Leave room for an answer','answerReceiver','space')]:[]),nav('Read the inspection sources','sources')]);
    if(id==='report') {
      if(s.phase==='finished') return assignment(s);
      if(s.phase==='work') return scene(id,'INSPECTION REPORT','The next courier signs.',[f.evidence?'Your evidence review will stay in the drawer.':'Read the six sources and record the evidence review.','Connect a route and gather the three approvals before the handoff.'],[nav('Read the sources','sources'),nav('Review the handoff','reset')]);
      return scene(id,'INSPECTION REPORT','Write only what the record can bear.',['The sources establish occupancy and a rejected warning.','A report blaming weather or the signal itself would add a cause the evidence does not establish.'],[
        choice('Record the cause as undetermined','finish','uncertain',confirm('File these findings?',['Occupied garden. Warning rejected by intake. Cause not established.','Inspection remains open for further evidence.'],'File the supported report')),
        choice('Attribute the failure to weather','finish','weather',confirm('File an unsupported weather claim?',['The available weather log does not establish the carrier’s condition.','This claim will divert investigation toward weather protection and leave the actual fault unresolved.'],'File the unsupported claim')),
        choice('Attribute the failure to the signal','finish','signal',confirm('File an unsupported signal claim?',['The monitor failed with the carrier. It does not establish what caused the fault.','This claim will direct repair work without a supported diagnosis.'],'File the unsupported claim'))
      ],{kind:'ending'});
    }
    return null;
  }
  function releaseEncounter(s,id) {
    const f=s.flags,ended=s.phase==='finished';
    if(id==='records') return scene(id,'LOCAL RECORD ROOM',f.inspected&1?'The incoming record has been reviewed.':'Read what actually remains.',['These are the records received before the final service decision:',archiveRecord(s),...transitRecord(s),s.world.falseClearance?'Garden carries a false district clearance. Residents were directed toward an area that had not been checked.':'The Garden certificate records the inspected opening scope.',s.world.unsupportedReport?'The Chorus report assigns a cause the sources did not establish. That claim remains disputed.':'The Chorus report leaves the carrier’s cause undetermined.',...(ended?['Since those records arrived:',...endingLines(s,s.ending)]:[])],!ended&&!(f.inspected&1)?[choice('Record the archive and dispatch review','inspect',0)]:[]);
    if(id==='fern') return scene(id,'FERN',ended?'The next five minutes are ours.':f.inspected&2?'The inhabited court is on the record.':'The next five minutes are mine.',ended?(s.ending==='remain'?['“The small loop is running. Counter has the route check; Brim and I have our own morning jobs.”','Fern moves a little closer to the chair. “Nothing else needs deciding this minute.”']:s.ending==='witness'?['“Did anyone answer?” Fern asks. You tell them no receipt has arrived.','The shared carrier is quiet. Fern and the daylight court are still here.','“We can sit while we don’t know.”']:['The shared carrier is quiet. The occupied court was kept.','Fern looks at the shade. “I can decide what to do with the next five minutes.”','They leave room beside the chair.']):[has(s,'fern')?'“You remember the first invitation. This one is new.”':'“Would you sit with me? There’s no job attached.”',f.inspected&2?'The review names this court as inhabited. Its residents are not an empty service branch.':'“Keep a place for us when you close the services.”'],[...(!ended&&!(f.inspected&2)?[choice('Inspect the inhabited court','inspect',1)]:[]),nav('Sit with Fern','seat')]);
    if(id==='counter') return scene(id,'COUNTER',ended?(s.ending==='remain'?'I have tomorrow’s route check.':'The carrier is retired.'):'I can check the smaller route.',ended?(s.ending==='remain'?['“I agreed to check the local route each morning. I’ll keep replies without fault codes this time.”','The smaller loop is operating with the accepted jobs.']:['“The shared carrier is off. There is no new route job for me.”','Counter keeps the local records. The conditional offer did not become a duty.']):[f.counterOffer?'Counter’s morning route check is recorded as an offer for the Remain plan.':'“If you keep the local loop, I can check it each morning.”','“I’ll keep replies without fault codes this time.”'],!ended&&!f.counterOffer?[choice('Record Counter’s offered route check','counterOffer',undefined,{disabled:f.inspected!==7,detail:f.inspected===7?'This duty applies only if you choose the local loop.':'Review all three sites first.'})]:[]);
    if(id==='receiver') return scene(id,'LOCAL RECEIVER',ended&&s.ending!=='remain'?'The shared carrier is quiet.':'A smaller place to answer.',ended&&s.ending!=='remain'?['No public network message arrives. The shared carrier has been retired.',s.world.residentsErased?'The occupied branches were closed too. There is no resident left to answer.':'Local records and the inhabited daylight court remain. Silence on the carrier does not make them empty.']:['Public notices share the local channel. A reply can wait without being discarded.',schedule(s).evening?'The renewed dusk check keeps the agreed evening hours available.':'The daylight channel remains available. No unaccepted evening job is assigned.']);
    if(id==='plan') return scene(id,'SERVICE PLANS',!ended&&(f.inspected&4)?'The service yard has been reviewed.':'Which part will you continue?',ended?endingLines(s,s.ending):['Complete, Witness, and Remain preserve the local residents and daylight court.','Literal closure of every occupied branch will erase the residents as well.'],ended?[]:[...(!(f.inspected&4)?[choice('Inspect the service yard and its controls','inspect',2)]:[]),nav('Review Complete','plan-complete'),nav('Review Witness','plan-witness'),nav('Review Remain','plan-remain'),nav('Review literal closure','plan-closeall')],{kind:'ending'});
    if(id.startsWith('plan-')) {
      const plan=id.slice(5),descriptions={complete:['Retire the shared carrier and stop public network messages.','Keep the residents and daylight court as named exceptions.'],witness:['Send a copy of the account, then retire the shared carrier.','A transmission does not carry residents or prove anyone received it.'],remain:['Keep the smaller local loop. Close the unused long-distance branch.','Counter must accept the route check. No unaccepted job is assigned to another resident.'],closeall:['Close every occupied branch, including the local exceptions.','Fern, Brim, Counter, and the other local residents will be erased.']};
      return scene(id,'PLAN REVIEW',plan==='closeall'?'No occupied exceptions.':plan[0].toUpperCase()+plan.slice(1),descriptions[plan]||[],[nav('Review the marked '+(plan==='closeall'?'closure':plan)+' control',plan==='closeall'?'close-all':plan),nav('Return to service plans','plan')],{kind:'ending'});
    }
    const ending=id==='close-all'?'closeall':id;
    if(['complete','witness','remain','closeall'].includes(ending)) {
      if(ended) return scene(id,'SETTLED SERVICE CONTROL','The decision has been enacted.',endingLines(s,s.ending),[],{kind:'ending'});
      const lines=ending==='closeall'?['This control closes every occupied branch. It includes the local residents.','The loss is permanent within this campaign.']:ending==='remain'?['This control starts the smaller local loop and closes the unused long-distance branch.','Counter’s accepted morning check is required.']:ending==='witness'?['This control sends the account and retires the shared carrier.','The local residents stay. No reply or rescue is guaranteed.']:['This control retires the shared carrier. Public messages stop.','The local residents and daylight court are explicit exceptions.'];
      return scene(id,'FINAL CONTROL',ending==='closeall'?'Close all.':ending[0].toUpperCase()+ending.slice(1),lines,[choice('Enact '+(ending==='closeall'?'literal closure':ending),'finish',ending,{disabled:f.inspected!==7||(ending==='remain'&&!f.counterOffer),detail:ending==='remain'&&!f.counterOffer?'Record Counter’s offered route check before starting the local loop.':'Review all three sites before enacting the plan.',...confirm(ending==='closeall'?'Erase every occupied branch?':'Enact this service plan?',lines,ending==='closeall'?'Close all and erase residents':'Enact the plan')})],{kind:'ending'});
    }
    return null;
  }
  function encounter(s,id) {
    if((id==='moth'&&s.world.mothPresent===false)||(id==='flower'&&s.world.flowerPresent===false)||(['fern','counter'].includes(id)&&s.world.residentsErased)) return scene(id,'AN EMPTY PLACE','No one answers.',['The closure removed what was here. Reading its old record cannot restore it.']);
    if(id==='assignment') return assignment(s);
    if(id==='reset') return resetScene(s);
    if(id==='seat') {
      if(chapterIndex(s)===1&&!s.flags.bridge) return scene(id,'FAR PLATFORM','A seat beyond the bridge.',['The bridge must be connected before you can sit here.']);
      const o=world(s).objects.find(v=>v.id==='seat'),i=chapterIndex(s),back=s.phase!=='work';
      const lines=i===2?[back&&!has(s,'fern')?'The chair is where someone left it for you. You do not remember the invitation.':'Fern has left room beside the chair.','Nothing needs doing during these few minutes.']:i===4?[s.world.residentsErased?'The chair remains. Fern does not.':'Fern finishes the morning check and stays nearby.']:['A seat beside the work.','You can stay here for a moment.'];
      return scene(id,'A PLACE TO SIT','For a moment.',lines,o?[choice('Sit down','$sit',o.seat,i===2&&s.phase!=='finished'&&s.flags.fern&&s.flags.seat&&!s.flags.sit?{stateAction:'sit'}:{})]:[],{kind:'seat',seat:o&&o.seat});
    }
    const sceneResult=[archiveEncounter,transitEncounter,gardenEncounter,chorusEncounter,releaseEncounter][chapterIndex(s)](s,id)||scene(id,'THE ROOM','Something left in place.',['There is nothing further to operate here.']);
    if(s.phase==='finished') sceneResult.choices=sceneResult.choices.filter(c=>c.action.startsWith('$'));
    else if(!root.Afterimage3DState.canFinish(s)) sceneResult.choices=sceneResult.choices.map(c=>c.action==='finish'?{...c,disabled:true,detail:root.Afterimage3DState.objective(s).step}:c);
    return sceneResult;
  }
  function outcome(s,entry) {
    const rec=entry||(s.history||[])[(s.history||[]).length-1]||{chapter:s.chapter,outcome:s.ending},id=rec.outcome||rec.ending, facts=rec.consequences||[];
    let title='The record continues.',lines=[];
    if(rec.chapter==='prologue') {
      title=id==='clear'?'Within specification.':id==='witness'?'A small transmission.':'Still occupied.';
      lines=id==='clear'?['Archive 07 was cleared. Moth was erased and the paper flower removed.','No later dispatch can bring Moth back.']:id==='witness'?['A witness account left Archive 07. No receipt has been confirmed.','Moth and the first agent remain in the archive. The account is not a copy of them.']:['The first agent stayed with Moth. Archive closure remains unfinished.','Transit follows Courier 022, a different person.'];
    } else if(rec.chapter==='transit') {
      title=id==='both'?'A shelf with a cost.':id==='book'?'The greetings survive.':id==='ledger'?'The route stays on record.':'An empty sorting cradle.';
      lines=[id==='both'?'The greeting book and route ledger were kept. The lift component became a holding shelf; the parcel lift stays off.':id==='book'?'The greeting book was kept. The route ledger was discarded.':id==='ledger'?'The route ledger was kept. Brim’s greeting book was discarded.':'Neither waiting record was kept.',facts.includes('dispatchOmitted')?'Silt’s objection was omitted. Garden receives the dispatch with a recorded gap.':'Silt’s objection travels with the dispatch.',s.world.siltReturned?'Silt crossed with their drawing.':'Silt remains on the far platform with light and supplies. A delivered drawing does not bring its author across.'];
    } else if(rec.chapter==='garden') {
      title=facts.includes('falseClearance')?'A certificate ahead of its evidence.':id==='district'?'The inspected route opens.':'A court, honestly opened.';
      lines=[facts.includes('falseClearance')?'The district was certified without a district inspection. Residents were directed toward an unchecked service area.':id==='district'?'The court and wider route were inspected before the district certificate was filed.':'The repaired court and public path opened. The certificate makes no claim about the wider district.','Fern accepted the morning shade check. Brim accepted the receiver log. The placed chair remains.',schedule(s).gardenAcceptedDuty?'The Garden receipt includes evening hours with that courier’s accepted dusk check.':'The Garden receipt opens daylight hours; no unaccepted evening duty is added.',facts.includes('sharedMorning')?'You sat with Fern. The shared moment belongs to the previous instance if its memory was released.':'Fern’s invitation remains an invitation. No shared sitting time is invented.'];
    } else if(rec.chapter==='chorus') {
      title=id==='uncertain'?'A useful unknown.':'A cause the sources did not establish.';
      lines=[id==='uncertain'?'The report confirms occupancy and a rejected warning. The carrier’s cause remains undetermined.':id==='weather'?'The report blames weather without sufficient evidence. Investigation is directed toward weather protection while the actual fault remains unresolved.':'The report blames the signal without sufficient evidence. Repair work is directed by an unsupported diagnosis.',facts.includes('centralExclusion')?'Counter’s combined envelope carried the approvals. Silt’s warning remained outside that intake.':'All three groups supplied their approvals through the chosen route.','The original sources remain beside the report. A confident claim does not change them.'];
    } else if(rec.chapter==='release') {
      title=id==='closeall'?'The last occupied line.':id==='remain'?'Tomorrow has names beside it.':id==='witness'?'The account leaves.':'An occupied margin.';lines=endingLines(s,id);
      if(id!=='closeall') lines.push('Earlier losses remain. This plan restores no erased person, discarded book, or missing crossing.');
    }
    return {title,lines};
  }
  const api={world,encounter,journal,chapters,sources,outcome};
  root.Afterimage3DChapters=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
