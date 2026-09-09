(function () {
  'use strict';
  const $ = id => document.getElementById(id), M = window.Afterimage3DState, Story = window.Afterimage3DChapters;
  const names = {prologue:'Prologue',transit:'Transit',garden:'Garden',chorus:'Chorus',release:'Release'};
  const pages = {prologue:'index-3d.html',transit:'transit-3d.html',garden:'garden-3d.html',chorus:'chorus-3d.html',release:'release-3d.html'};
  const entry = document.body.dataset.chapter || 'prologue', reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s, saved = null, storedRaw = null, active = false, panelOpen = false, engine, focus = null, currentObject = null, escapeAction = null, focusReturn = null, tracked = null, toastTimer, audio = null, ambient = null, soundTexture = null, soundOn = false, soundBusy = false, soundWanted = false, melodyNodes = [], storageOK = true;
  function valid(value) { const result = M.validate(value); if (!result) throw new Error('This is not a valid 3D campaign save.'); return result; }
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500); }
  function fatal(message) { $('fatal').replaceChildren(); const p = document.createElement('p'); p.textContent = message; const a = document.createElement('a'); a.href = 'index.html'; a.textContent = 'Play the original edition'; $('fatal').append(p,a); $('fatal').hidden = false; }
  if (!M || !Story || !window.Afterimage3DWorld) { fatal('The 3D files could not load. Refresh the page, or open this edition through the local game server.'); return; }
  try { storedRaw = localStorage.getItem(M.key); if (storedRaw) saved = valid(JSON.parse(storedRaw)); } catch (error) { storageOK = error.name !== 'SecurityError'; $('save-warning').textContent = storageOK ? 'Your 3D save could not be read. It has not been replaced. Import a backup or choose a new beginning.' : 'Browser saving is unavailable. Export your progress from the menu before closing.'; $('save-warning').hidden = false; }
  s = saved?.chapter === entry ? valid(saved) : entry === 'prologue' ? M.fresh() : M.preview(entry);
  function save() { if (!active) return; try { localStorage.setItem(M.key, JSON.stringify(s)); saved = structuredClone(s); storedRaw = JSON.stringify(s); } catch (_) { if (storageOK) toast('Saving is unavailable. Export the 3D campaign from the menu.'); storageOK = false; } }
  function position() { if (engine && s.chapter === entry) s.position = engine.getPosition(); }
  function updateFocus(object) { if(object?.id==='service'&&focus?.id!=='service'&&object.routeRecall)engine?.cue('route');focus = object; const enabled = active && !panelOpen && Boolean(object); $('interact').hidden = !enabled; $('focus-label').textContent = object?.actionLabel || object?.label || 'Interact'; $('touch-interact').disabled = !enabled; $('touch-interact').textContent = object?.touchLabel || object?.actionLabel || object?.label || 'Interact'; $('crosshair').classList.toggle('active', enabled); }
  function interact(id) {
    if (!active || panelOpen) return;
    const scene = Story.encounter(s,id);
    const action = scene?.direct && scene.choices.find(choice => !choice.disabled && !choice.confirm && (choice.action === '$sit' || choice.close));
    if (action) { currentObject=id; execute(action); }
    else if (scene?.direct && scene.notice) toast(scene.notice);
    else encounter(id);
  }
  try { engine = window.Afterimage3DWorld.create($('world'), { reducedMotion:reduced, onFocus:updateFocus, onInteract:interact, onMove:p => { if (active && s.chapter === entry) { s.position = {...p}; save(); } }, onError:fatal }); engine.load(Story.world(s), s.position); engine.pause(true); } catch (error) { fatal('This device could not start the 3D view. ' + error.message); return; }
  function hud() {
    const task = M.objective(s); $('chapter-label').textContent = names[s.chapter] + ' / ' + (s.phase === 'return' ? 'AFTER THE RESET' : s.phase === 'finished' ? 'OUTCOME RECORDED' : 'YOUR ASSIGNMENT'); $('order').textContent = task.order || names[s.chapter]; $('step').textContent = task.step || ''; $('tension').textContent = ''; $('tension').hidden = true;
    $('progress').replaceChildren(); const total = Math.min(12,Math.max(0,Number(task.total)||0)), completed = Math.max(0,Number(task.completed)||0); for(let i=0;i<total;i++){const mark=document.createElement('i');if(i<completed)mark.className='done';$('progress').append(mark);}
    const held = s.phase === 'work' ? s.acquired : s.kept, lost=s.phase==='work'?[]:s.acquired.filter(id=>!s.kept.includes(id)); $('memory-caption').textContent = s.phase === 'work' ? held.length + ' memories found / 2 can continue' : '2 retained / '+lost.length+' released'; $('memory-list').textContent = held.map(id => M.memories[id]?.title || id).join(' · ') || 'No memories found yet';$('memory-list').title=lost.length?'Released: '+lost.map(id=>M.memories[id].title).join(', '):'';
  }
  function refreshWorld(useStatePosition = false) { const p = useStatePosition ? s.position : engine.getPosition(),world=Story.world(s); engine.load(world,p); syncAmbience(world.ambience); s.position = engine.getPosition(); hud(); updateTracking(); }
  function closePanel() { panelOpen=false; $('panel').hidden=true; $('panel').classList.remove('menu'); document.body.classList.remove('reading'); $('hud').inert=false; $('cover').inert=false; escapeAction=null; if(active)engine.pause(false); if(active)$('world').focus();else if(focusReturn?.isConnected)focusReturn.focus(); focusReturn=null; updateFocus(focus); }
  function show(scene, choices, options={}) {
    $('panel').classList.toggle('composition',Boolean(scene.composition));
    $('panel').classList.toggle('composition-left',scene.compositionSide==='left');
    if(!panelOpen)focusReturn=document.activeElement; panelOpen=true; engine.pause(true); updateFocus(null); document.body.classList.add('reading'); $('hud').inert=true; $('cover').inert=true; $('panel').hidden=false; $('panel').classList.toggle('menu',Boolean(options.menu)); $('panel').dataset.scene=scene.id||''; $('panel').classList.toggle('has-diagram',Boolean(scene.puzzle));$('panel').classList.toggle('has-exhibit',Boolean(scene.exhibit||scene.kind==='sources'));
    $('speaker').textContent=scene.speaker||names[s.chapter]; $('dialog-title').textContent=scene.title||''; $('lines').replaceChildren(); for(const line of scene.lines||scene.paragraphs||[]){const p=document.createElement('p');p.textContent=line.startsWith('[')?line.slice(1,-1):line;if(line.startsWith('['))p.className='note';$('lines').append(p);}
    sceneDetails(scene);
    $('puzzle').replaceChildren();$('puzzle').hidden=true; $('choices').replaceChildren(); $('choices').classList.toggle('compact',Boolean(options.compact));$('choices').classList.toggle('source-grid',scene.kind==='sources'); for(const choice of choices||[]){const button=document.createElement('button');button.textContent=choice.label;if(choice.source){button.classList.add('source-card');button.prepend(exhibit({kind:'source',id:choice.source},true));const stamp=document.createElement('small');stamp.textContent=choice.read?'Opened':'Unopened';button.append(stamp);}button.disabled=Boolean(choice.disabled);if(choice.describedBy)button.setAttribute('aria-describedby',choice.describedBy);if(choice.primary)button.classList.add('primary');if(choice.danger)button.classList.add('danger');if(choice.selected!==undefined)button.setAttribute('aria-pressed',String(choice.selected));if(choice.detail){const d=document.createElement('small');d.textContent=choice.detail;button.append(d);}button.addEventListener('click',()=>{try{choice.run?choice.run():execute(choice);}catch(e){toast(e.message);}});$('choices').append(button);}
    escapeAction=options.escape||closePanel; document.querySelector('.dialog').scrollTop=0; $('choices').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  const leave=(label='Step away')=>({label,run:closePanel});
  function encounter(id) { currentObject=id; const scene=Story.encounter(s,id); if(!scene)return toast('Nothing to use here yet.');const choices=[...(scene.choices||[])];if(!choices.some(c=>c.action==='$close'))choices.push(leave(scene.kind==='ending'?'Keep exploring':'Step away'));show({...scene,lines:(scene.lines||[]).filter(line=>!line.startsWith('[Memory found:'))},choices);if(scene.puzzle)renderPuzzle(scene.puzzle,id); }
  function exhibit(data, thumbnail=false) {
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 360 200');svg.classList.add('exhibit');svg.dataset.exhibit=data.kind==='source'?data.id:data.kind;
    const add=(tag,attrs={},text)=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
    const line=(x1,y1,x2,y2,extra={})=>add('line',{x1,y1,x2,y2,stroke:'currentColor','stroke-width':2,...extra});
    const box=(x,y,width,height,extra={})=>add('rect',{x,y,width,height,rx:3,fill:'none',stroke:'currentColor','stroke-width':2,...extra});
    const text=(x,y,value,size=14,extra={})=>add('text',{x,y,'font-size':size,fill:'currentColor',...extra},value);
    const center=(x,y,value,size=14)=>text(x,y,value,size,{'text-anchor':'middle'});
    let description='';
    if(data.kind==='silt-sketch')data={...data,id:'drawing'};
    if(data.kind==='source'||data.kind==='silt-sketch') {
      svg.classList.add('source-paper');description=Story.sources.find(source=>source.id===data.id).lines.join(' ');
      if(data.id==='occupancy') {
        text(20,27,'MORNING SIGN-IN',13);
        for(let i=0;i<7;i++){const x=42+i*46;add('circle',{cx:x,cy:58,r:8,fill:'none',stroke:'currentColor','stroke-width':2});line(x,66,x,92);line(x-9,77,x+9,77);}
        center(180,122,'7 SIGNED IN',24);center(180,149,'Silt · far platform');box(113,161,134,27);center(180,180,'OCCUPIED',14);
      }else if(data.id==='drawing') {
        box(70,27,220,103);line(88,36,85,119);line(273,35,277,119);
        add('path',{d:'M65 72 L287 67 L292 86 L70 92 Z',fill:'currentColor',opacity:.78});
        if(data.kind==='silt-sketch')line(73,93,289,87,{stroke:'#bd843a','stroke-width':4});
        text(23,158,'“Warm before the lamps went out.”',16);text(23,183,'Silt',14);text(244,183,'Time: —',13);
      }else if(data.id==='intake') {
        text(22,27,'DRAWING / SILT',14);text(22,51,'Arrived before inspection request',13);
        box(22,69,316,51);text(33,88,'FAULT CODE',11);line(130,93,315,93);
        text(62,121,'RETURNED',27,{transform:'rotate(-9 62 121)',class:'stamp-ink'});
        text(22,155,'No fault code.',16);text(22,180,'Resident follow-up: none',13);
      }else if(data.id==='weather') {
        box(30,35,49,117);add('rect',{x:31,y:70,width:47,height:38,fill:'currentColor',opacity:.15});line(19,70,88,70,{'stroke-dasharray':'3 3'});line(19,108,88,108,{'stroke-dasharray':'3 3'});line(40,89,70,89,{'stroke-width':5});
        text(109,50,'06:10 — rain begins',17);text(109,79,'Within normal range',14);text(109,107,'Gauge location: here',13);text(22,183,'Carrier housing: no reading',14);
      }else if(data.id==='carrier') {
        text(22,27,'CARRIER MONITOR',13);line(24,50,24,135);line(24,135,335,135);line(24,83,167,83,{'stroke-width':3});line(167,45,167,135,{'stroke-dasharray':'4 5'});add('circle',{cx:167,cy:83,r:5,fill:'currentColor'});
        text(187,80,'Input unavailable',15);text(187,103,'Monitor stopped',12);center(167,158,'06:14',15);text(22,185,'Signal lost. Trace ends here.',14);
      }else {
        box(80,28,200,100);for(const x of [90,270])for(const y of [38,118])add('circle',{cx:x,cy:y,r:3,fill:'currentColor'});
        box(115,61,130,33);center(180,83,'UNOPENED',17);for(let i=0;i<3;i++)box(90+i*65,145,18,18);
        center(180,185,'3 approvals to inspect',15);
      }
    }else if(data.kind==='route') {
      description=['No route selected.','Central desk: one envelope; Silt’s drawing is excluded.','Ordered round: residents, maintenance, then dispatch.','Local copies: visit all three in any order.'][data.mode];
      center(180,27,['Choose a route','Central desk','Ordered round','Local copies'][data.mode],20);
      if(data.mode===1){box(157,42,46,29);for(const x of [55,180,305])line(x,101,180,71);}
      if(data.mode===2){line(74,101,286,101);for(const x of [113,237])add('path',{d:'M'+(x-6)+' 95 L'+x+' 101 L'+(x-6)+' 107',fill:'none',stroke:'currentColor','stroke-width':2});}
      for(const [i,label] of ['Residents','Maintenance','Dispatch'].entries()){
        const x=55+i*125,done=Boolean(data.voices&(1<<i));if(data.mode===3)box(x-26,60,52,68);
        add('circle',{cx:x,cy:101,r:17,fill:done?'currentColor':'var(--paper)',stroke:'currentColor','stroke-width':2});
        if(done)add('path',{d:'M'+(x-8)+' 101 l6 6 l11 -13',fill:'none',stroke:'var(--paper)','stroke-width':3});
        center(x,152,label,13);center(x,174,done?'Signed':'Awaiting',12);description+=' '+label+': '+(done?'signed.':'awaiting approval.');
      }
      if(data.mode===1)center(180,195,'Silt’s drawing is outside the envelope.',11);
    }else {
      const local=data.plan==='remain',lost=data.plan==='closeall',settled=data.settled;
      description=lost?'All occupied branches close. Residents are permanently erased.':local?'The smaller local loop and residents remain. Counter’s morning route check is required.':data.plan==='witness'?'Send the account before retiring the carrier. Residents stay; no reply or rescue is guaranteed.':'Retire the shared carrier and stop network messages. Residents and the daylight court remain.';
      box(100,12,160,48);center(180,32,'Shared carrier',14);center(180,51,local?'Local only':settled?'Retired':'Retire',13);
      line(180,60,82,104,local?{}:{'stroke-dasharray':'5 5',opacity:.4});line(180,60,278,104,lost?{'stroke-dasharray':'5 5',opacity:.4}:{});
      box(12,105,140,55);box(208,105,140,55);center(82,126,'Local messages');center(82,149,local?'Continue':'Stop',18);center(278,126,'Residents');center(278,149,lost?(settled?'Erased':'Erase'):'Keep',18);
      center(180,190,lost?'Permanent loss':local?'Close unused long-distance branch':data.plan==='witness'?'Account only · no reply guaranteed':'Daylight court stays open',13);
    }
    if(thumbnail)svg.setAttribute('aria-hidden','true');
    else{svg.setAttribute('role','img');svg.setAttribute('aria-label',description);}
    return svg;
  }
  function sceneDetails(scene) {
    if(scene.exhibit)$('lines').append(exhibit(scene.exhibit));
    if(scene.facts){const list=document.createElement('dl');list.className='scene-facts';for(const [label,value] of scene.facts){const row=document.createElement('div'),term=document.createElement('dt'),fact=document.createElement('dd');term.textContent=label;fact.textContent=value;row.append(term,fact);list.append(row);}$('lines').append(list);}
    if(scene.record){const details=document.createElement('details'),summary=document.createElement('summary');details.className='scene-record';summary.textContent=scene.recordLabel||'Read the full record';details.append(summary);for(const line of scene.record){const p=document.createElement('p');p.textContent=line;details.append(p);}$('lines').append(details);}
  }
  function contactDiagram(key, config, bits, labels) {
    const ns='http://www.w3.org/2000/svg', node=(tag,attrs={},text)=>{const el=document.createElementNS(ns,tag);for(const [name,value] of Object.entries(attrs))el.setAttribute(name,String(value));if(text!==undefined)el.textContent=text;return el;};
    const describe=value=>labels.map((label,i)=>label+' '+(value&(1<<i)?'on (closed)':'off (open)')).join(', ');
    const svg=node('svg',{viewBox:'0 0 360 208',class:'contact-diagram',role:'img','aria-labelledby':'contact-title contact-description','data-puzzle':key,'data-target':config.target,'data-current':bits});
    svg.append(node('title',{id:'contact-title'},config.title+' contact diagram'),node('desc',{id:'contact-description'},'Source plate: '+describe(config.target)+'. Your controls: '+describe(bits)+'. Match each control to the source plate.'));
    svg.append(node('rect',{x:1,y:1,width:358,height:206,rx:5,class:'diagram-frame'}),node('line',{x1:12,y1:104,x2:348,y2:104,class:'diagram-divider'}));
    for(const [row,value,heading] of [['source',config.target,'SOURCE PLATE'],['current',bits,'YOUR CONTROLS']]){
      const top=row==='source'?0:104, group=node('g',{'data-row':row});svg.append(group);
      group.append(node('text',{x:14,y:top+20,class:'diagram-heading'},heading));
      labels.forEach((label,i)=>{
        const x=60+i*120,y=top+64,on=Boolean(value&(1<<i)),matches=Boolean(bits&(1<<i))===Boolean(config.target&(1<<i));
        const contact=node('g',{'data-contact':i,'data-on':on,'data-matched':row==='source'||matches,class:row==='source'?'diagram-source':matches?'diagram-matched':'diagram-unmatched'});group.append(contact);
        contact.append(node('text',{x,y:top+42,'text-anchor':'middle',class:'diagram-label'},label));
        contact.append(node('line',{x1:x-37,y1:y,x2:x-23,y2:y,class:'diagram-wire'}),node('line',{x1:x+23,y1:y,x2:x+37,y2:y,class:'diagram-wire'}));
        contact.append(node('line',{x1:x-23,y1:y,x2:on?x+23:x+14,y2:on?y:y-17,class:'diagram-wire diagram-switch'}));
        for(const cx of [x-23,x+23])contact.append(node('circle',{cx,cy:y,r:4,class:'diagram-terminal'}));
        contact.append(node('text',{x,y:top+91,'text-anchor':'middle',class:'diagram-state'},row==='source'?(on?'ON / closed':'OFF / open'):(on?'ON':'OFF')+' / '+(matches?'match':'change')));
      });
    }
    return svg;
  }
  function renderPuzzle(puzzle,id) {
    const key=puzzle.id||puzzle,config=M.puzzles[key],target=config.target,bits=s.flags[key+'Circuit']||0,labels=config.labels||['Left','Middle','Right'],readOnly=Boolean(puzzle.readOnly);
    $('puzzle').hidden=false;$('puzzle').append(contactDiagram(key,config,bits,labels));
    const status=document.createElement('p');status.className='circuit-status';status.id='puzzle-status';status.setAttribute('role','status');
    if(readOnly){status.textContent=key==='lift'&&s.world.liftSpent?'Component fitted to the shelf. Parcel lift off.':s.flags[key]?'Repair secured.':'Recorded contact positions.';$('puzzle').append(status);return;}
    const redraw=(index,change)=>{const scroll=document.querySelector('.dialog').scrollTop;try{change();save();refreshWorld();encounter(id);document.querySelector('.dialog').scrollTop=scroll;const button=index===null?$('puzzle').querySelector('.diagram-assist'):$('puzzle').querySelectorAll('.switches button')[index];button?.focus({preventScroll:true});}catch(e){toast(e.message);}};
    const row=document.createElement('div');row.className='switches';row.setAttribute('role','group');row.setAttribute('aria-label','Repair switches');
    for(let i=0;i<3;i++){
      const button=document.createElement('button');button.setAttribute('aria-pressed',String(Boolean(bits&(1<<i))));button.textContent=labels[i];
      const label=document.createElement('small');label.textContent=bits&(1<<i)?'ON':'OFF';button.append(label);
      button.addEventListener('click',()=>redraw(i,()=>{s=M.act(s,'turn',{id:key,index:i});}));row.append(button);
    }
    $('puzzle').append(row);status.textContent=bits===target?'Contacts match. Secure the repair.':'Match the controls to the source plate.';$('puzzle').append(status);
    const help=document.createElement('button');help.className='diagram-assist';help.textContent='Set the controls for me';help.addEventListener('click',()=>redraw(null,()=>{for(let i=0;i<3;i++)if(Boolean(s.flags[key+'Circuit']&(1<<i))!==Boolean(target&(1<<i)))s=M.act(s,'turn',{id:key,index:i});}));$('puzzle').append(help);
  }
  function execute(choice, confirmed=false) {
    if(choice.confirm&&!confirmed){const c=choice.confirm;show({id:'review-'+choice.action,speaker:'REVIEW YOUR DECISION',title:c.title||'Confirm this choice?',lines:c.lines||[]},[{label:c.label||'Confirm this choice',primary:true,danger:choice.danger,run:()=>execute(choice,true)},{label:'Reconsider',run:()=>encounter(currentObject)}],{menu:true,escape:()=>encounter(currentObject)});return;}
    switch(choice.action){case '$close':return closePanel();case '$listen':return listenAgain();case '$scene':{const destination=Story.world(s).objects.find(o=>o.id===choice.value);if(destination&&Math.hypot(destination.x-engine.getPosition().x,destination.z-engine.getPosition().z)>2.6){tracked=destination.id;closePanel();updateTracking();toast('Walk to '+destination.label+'.');return;}return encounter(choice.value);}case '$journal':return journal();case '$reset':return chooseMemories();case '$advance':return advance();case '$ending':return ending();case '$sit':{try{if(choice.stateAction){s=M.act(s,choice.stateAction,choice.stateValue);save();refreshWorld();}const seat=choice.value||Story.world(s).objects.find(o=>o.kind==='bench');closePanel();if(seat){engine.sit({...seat,yaw:seat.yaw??s.position.yaw,pitch:seat.pitch??0});$('stand').hidden=false;if(choice.notice)toast(choice.notice);}return;}catch(e){return toast(e.message);}}default:if(!choice.action)return;
    }
    try {
      position();
      const phase=s.phase, acquired=s.acquired.slice();
      s=M.act(s,choice.action,choice.value); save(); refreshWorld(phase!==s.phase);
      if(s.phase==='finished')return ending(true);
      const found=s.acquired.filter(id=>!acquired.includes(id));
      const notice=found.length?'Memory found: '+found.map(id=>M.memories[id].title).join(' · '):choice.notice;
      if(choice.close)closePanel();
      else encounter(choice.next||currentObject);
      if(notice)toast(notice);
      if(s.chapter==='prologue'&&choice.action==='service')engine.cue('route');
      if(s.chapter==='prologue'&&choice.action==='receiver'&&soundOn)playNotes();
    } catch(error) { toast(error.message); }
  }

  function chooseMemories(selected=[]) { if(!M.canReset(s))return toast(M.objective(s).step);const candidates=[...s.acquired];show({id:'choose-memories',speaker:'TWO MEMORIES CONTINUE',title:'What will you carry?',lines:['Keep two memories. You will lose the others. Objects, repairs, and other people keep their own history.']},[...candidates.map(id=>({label:M.memories[id]?.title||id,detail:M.memories[id]?.description||'',selected:selected.includes(id),run:()=>chooseMemories(selected.includes(id)?selected.filter(k=>k!==id):selected.length<2?[...selected,id]:[selected[1],id])})),{label:'Review what you will lose',primary:true,disabled:selected.length!==2,run:()=>reviewReset(selected)},leave('Not yet')],{menu:true}); }
  function reviewReset(pair) {
    const archive=s.chapter==='prologue',lost=s.acquired.filter(id=>!pair.includes(id));
    if(archive){engine.load(Story.world(s),Story.archiveView());$('stand').hidden=true;}
    show({id:'confirm-reset',composition:archive,speaker:'CONFIRM THE RESET',title:'These memories will not continue.',lines:lost.map(id=>(M.memories[id]?.title||id)+': '+(M.memories[id]?.loss||'You will no longer remember this experience.')).concat('Your next instance keeps only the two memories you selected.')},[
      {label:'Keep these two and reset',primary:true,run:()=>{try{
        const next=M.reset(s,pair);closePanel();engine.pause(true);$('fade').classList.add('on');
        setTimeout(()=>{
          s=next;if(archive)s.position=Story.archiveView();tracked=null;$('stand').hidden=true;refreshWorld(true);save();$('fade').classList.remove('on');engine.pause(false);
          if(archive){tracked='moth';updateTracking();toast(s.kept.includes('name')?'Moth. Beside the flower you left.':'“I’m Moth. We met before.”');}
          else toast(M.objective(s).step);
        },reduced?0:260);
      }catch(e){toast(e.message);}}},
      {label:'Reconsider',run:()=>chooseMemories(pair)}
    ],{menu:true,escape:()=>chooseMemories(pair)});
  }
  function ending(enacted=false) {
    const record=s.history[s.history.length-1],report=Story.outcome(s,record),final=s.chapter==='release',archive=s.chapter==='prologue',transit=s.chapter==='transit';
    if(archive){
      engine.load({...Story.world(s),minHorizontalFov:s.ending==='stay'?Math.PI/3:0},Story.archiveView(s.ending));
      if(s.ending==='stay')engine.sit(Story.archiveView('stay'));
      $('stand').hidden=s.ending!=='stay';position();save();
      if(enacted&&s.ending==='witness')engine.cue('witness');
    }
    if(transit){engine.load({...Story.world(s),minHorizontalFov:1.3},Story.transitView(innerWidth<=750));$('stand').hidden=true;position();save();}
    const composed=archive||transit;
    if(composed){clearTimeout(toastTimer);$('toast').hidden=true;}
    show({id:'chapter-outcome',composition:composed,compositionSide:transit?'left':'right',speaker:names[s.chapter].toUpperCase()+' / OUTCOME',title:report.title,lines:composed?[report.lines[0]]:[],record:composed?report.lines.slice(1):report.lines},[...(!final?[{label:'Continue to '+names[M.chapters[M.chapters.indexOf(s.chapter)+1]],primary:true,run:advance}]:[]),leave(final?'Stay in this place':'Look around before leaving'),{label:'Export the 3D campaign',run:exportSave}],{menu:composed});
  }
  function advance() { try{s=M.advance(s);save();location.href=pages[s.chapter];}catch(e){toast(e.message);} }
  function memoryNotes(){const held=s.phase==='work'?s.acquired:s.kept, lost=s.phase==='work'?[]:s.acquired.filter(id=>!s.kept.includes(id));return [...held.map(id=>(s.phase==='work'?'Memory found: ':'Retained: ')+M.memories[id].title+'. '+M.memories[id].description),...lost.map(id=>'Released: '+M.memories[id].title+'. '+M.memories[id].loss)];}
  function journal() { const task=M.objective(s),destinations=Story.journal(s);show({id:'field-journal',speaker:'FIELD JOURNAL / '+names[s.chapter].toUpperCase(),title:task.order,lines:[task.step,...(task.tension?[task.tension]:[]),...memoryNotes()]},[...destinations.map(d=>({label:'Track '+d.label,detail:d.detail||'',run:()=>{tracked=d.id;closePanel();updateTracking();}})),{label:'Read the campaign record',run:record},leave('Close the journal')],{menu:true}); }
  function record() { show({id:'campaign-record',speaker:'WHAT CARRIES FORWARD',title:'The record is still here.',lines:s.history.length?s.history.flatMap(r=>{const report=Story.outcome(s,r);return [names[r.chapter]+' / '+report.title,...report.lines];}):['No chapter has ended yet.']},[{label:'Back to journal',run:journal},leave()],{menu:true}); }
  function updateTracking() { if(!tracked||!active){$('tracked').hidden=true;return;}const obj=Story.world(s).objects.find(o=>o.id===tracked);if(!obj){tracked=null;$('tracked').hidden=true;return;}const p=engine.getPosition(),dx=obj.x-p.x,dz=obj.z-p.z;let angle=Math.atan2(dx,-dz)-p.yaw;angle=Math.atan2(Math.sin(angle),Math.cos(angle));const arrow=Math.abs(angle)<.25?'↑':Math.abs(angle)>2.6?'↶':angle>0?'→':'←';$('tracked').textContent=arrow+' '+obj.label+' · '+Math.hypot(dx,dz).toFixed(1)+' m';$('tracked').hidden=false; }
  setInterval(()=>{if(active&&!panelOpen)updateTracking();},300);
  function exportSave() { position();const data=active?s:saved||s;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='afterimage-'+data.chapter+'-3d.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function menu() { show({id:'menu',speaker:'AFTERIMAGE / FIRST PERSON',title:'Take the time you need.',lines:['WASD moves. Click or drag the scene to look. Arrow keys also work. Page Up / Down tilts the view; Home levels it. E interacts; J opens the journal.','Your assignment stays at the top left. Track a destination in the journal if you need help finding it.','This edition uses its own campaign save.']},[leave(active?'Return to the world':'Return to title'),...(active?[{label:'Field journal',run:journal},{label:'Return to the chapter entrance',detail:'Move back to the entrance with your memories, repairs, and decisions intact.',run:()=>{s.position=Story.world(s).spawn;refreshWorld(true);save();$('stand').hidden=true;closePanel();toast('Back at the entrance. Your progress is unchanged.');}},{label:'Review the chapter outcome',disabled:s.phase!=='finished',run:ending}]:[]),{label:'Export the 3D campaign',disabled:!active&&!saved,run:exportSave},{label:'Import a 3D campaign',run:()=>$('import-file').click()},{label:'Choose a chapter preview',run:previews},{label:'Start a new prologue',run:()=>confirmStart('prologue')}],{menu:true}); }
  function previews() { show({id:'chapter-previews',speaker:'FIRST-PERSON EDITION',title:'Choose a place to begin.',lines:['A chapter preview supplies a sample history for earlier chapters. Start at the prologue to make every choice yourself.']},M.chapters.map(chapter=>({label:chapter==='prologue'?'Start at the prologue':'Preview: '+names[chapter],run:()=>confirmStart(chapter)})).concat(leave('Cancel')),{menu:true}); }
  function confirmStart(chapter) { const candidate=chapter==='prologue'?M.fresh():M.preview(chapter);show({id:'confirm-start',speaker:'BEGIN A 3D CAMPAIGN',title:chapter==='prologue'?'Enter Archive 07?':'Preview '+names[chapter]+'?',lines:[...(active||storedRaw?['This replaces your current 3D campaign. Export it first if you want to keep it.']:[]),chapter==='prologue'?'You will begin at the first assignment.':'This preview uses a sample outcome from each earlier chapter.','The original edition has a separate save.']},[{label:'Begin '+names[chapter],primary:true,run:()=>{s=candidate;active=true;save();if(chapter!==entry){location.href=pages[chapter];return;}closePanel();begin(true);}},leave('Cancel')],{menu:true}); }
  function begin(intro=false) { active=true;if(soundWanted&&!soundOn)setSound(true,false);$('cover').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');refreshWorld(true);engine.pause(false);save();$('world').focus();if(s.phase==='finished')ending();else if(intro){const task=M.objective(s);show({id:'arrival',speaker:'ASSIGNMENT / '+names[s.chapter].toUpperCase(),title:task.order,lines:[task.step]},[leave('Begin the assignment')]);} }
  $('start').textContent=saved?'Continue '+names[saved.chapter]:entry==='prologue'?'Enter Archive 07':'Start '+names[entry]+' preview';$('cover-chapter').textContent=names[entry];
  $('start').addEventListener('click',()=>{if(saved){if(saved.chapter!==entry){location.href=pages[saved.chapter];return;}s=valid(saved);begin(false);}else confirmStart(entry);});$('previews').addEventListener('click',previews);$('menu-button').addEventListener('click',menu);$('journal').addEventListener('click',journal);$('interact').addEventListener('click',()=>engine.interact());$('touch-interact').addEventListener('click',()=>engine.interact());$('stand').addEventListener('click',()=>{engine.sit(null);$('stand').hidden=true;});
  $('import-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>1500000)throw new Error('This file is too large for a campaign save.');const candidate=valid(JSON.parse(await file.text()));show({id:'confirm-import',speaker:'IMPORT 3D CAMPAIGN',title:'Continue this campaign?',lines:[names[candidate.chapter]+' / '+candidate.phase,'This replaces your current 3D campaign. The original edition stays separate.']},[{label:'Import and continue',primary:true,run:()=>{s=candidate;active=true;save();if(s.chapter!==entry){location.href=pages[s.chapter];return;}closePanel();begin(false);}},leave('Cancel')],{menu:true});}catch(e){show({id:'invalid-import',speaker:'IMPORT FAILED',title:'The file could not be used.',lines:[e.message,'Your saved progress has not changed.']},[leave('Return')],{menu:true});}});
  document.addEventListener('keydown',event=>{if(panelOpen){if(event.key==='Escape'){event.preventDefault();escapeAction?.();}else if(event.key==='Tab'){const buttons=[...$('panel').querySelectorAll('button:not(:disabled), summary')];if(!buttons.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}return;}if(!active)return;if(event.key.toLowerCase()==='j'){event.preventDefault();journal();}else if(event.key==='Escape'&&!document.pointerLockElement){event.preventDefault();menu();}if(['w','a','s','d','ArrowUp','ArrowDown'].includes(event.key))$('stand').hidden=true;});
  const moves=new Map();function touchMove(){let forward=0,strafe=0;for(const value of moves.values()){if(value==='forward')forward++;if(value==='back')forward--;if(value==='right')strafe++;if(value==='left')strafe--;}engine.setMove(forward,strafe);if(forward||strafe)$('stand').hidden=true;}
  for(const eventName of ['contextmenu','selectstart','dragstart'])$('mobile').addEventListener(eventName,event=>event.preventDefault());
  for(const button of $('move-pad').querySelectorAll('button')){button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);moves.set(event.pointerId,button.dataset.move);touchMove();});for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,event=>{moves.delete(event.pointerId);touchMove();});}
  let lookPointer=null;$('look-pad').addEventListener('pointerdown',e=>{e.preventDefault();$('look-pad').setPointerCapture(e.pointerId);lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};});$('look-pad').addEventListener('pointermove',e=>{if(!lookPointer||lookPointer.id!==e.pointerId)return;engine.look(e.clientX-lookPointer.x,e.clientY-lookPointer.y);lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};});for(const eventName of ['pointerup','pointercancel','lostpointercapture'])$('look-pad').addEventListener(eventName,()=>lookPointer=null);
  // Match the original prologue's four-note phrase; all sound remains opt-in.
  const soundKey='afterimage.sound.3d.v1';
  try{soundWanted=localStorage.getItem(soundKey)==='on';}catch(_){}
  const dialogSound=document.createElement('button');dialogSound.id='dialog-sound';dialogSound.className='dialog-sound';$('speaker').after(dialogSound);
  function soundButtons(){for(const button of [$('sound'),dialogSound]){button.textContent=soundOn?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(soundOn));button.disabled=soundBusy;}}
  function stopNotes(){for(const node of melodyNodes){try{node.stop();}catch(_){}node.disconnect();}melodyNodes=[];}
  function syncAmbience(profile){
    if(!soundTexture||!profile)return;
    for(const [name,node] of Object.entries(soundTexture)){
      const [frequency,level]=profile[name],time=audio.currentTime;
      node.frequency.value=frequency;node.gain.gain.cancelScheduledValues(time);node.gain.gain.setTargetAtTime(level,time,.12);
    }
  }
  function createAmbience(){
    if(s.chapter==='prologue'){
      [110,164.81,220.3].forEach((hz,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.value=.009/(i+1);oscillator.connect(gain).connect(ambient);oscillator.start();});return;
    }
    const profile=Story.world(s).ambience,buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);
    let seed=7301;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),airGain=audio.createGain();
    source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.Q.value=.35;filter.frequency.value=profile.air[0];airGain.gain.value=profile.air[1];
    source.connect(filter).connect(airGain).connect(ambient);source.start();soundTexture={air:{frequency:filter.frequency,gain:airGain}};
    for(const name of ['room','work']){
      const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=name==='room'?'sine':'triangle';oscillator.frequency.value=profile[name][0];gain.gain.value=profile[name][1];
      oscillator.connect(gain).connect(ambient);oscillator.start();soundTexture[name]={frequency:oscillator.frequency,gain};
    }
  }
  function playNotes(){
    if(!soundOn||!audio||audio.state!=='running')return;
    stopNotes();
    [329.63,293.66,220,246.94].forEach((hz,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+i*.47;
      oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.05,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+1.6);
      oscillator.connect(gain).connect(ambient);oscillator.start(t);oscillator.stop(t+1.7);melodyNodes.push(oscillator);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();melodyNodes=melodyNodes.filter(n=>n!==oscillator);};
    });
  }
  async function setSound(enabled=!soundOn,preview=true){
    if(soundBusy)return;soundBusy=true;soundButtons();
    try{
      if(enabled){
        if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio is unavailable.');audio=new Audio();ambient=audio.createGain();ambient.gain.value=0;ambient.connect(audio.destination);
          createAmbience();
        }
        await audio.resume();if(audio.state!=='running')throw new Error('Audio could not start.');ambient.gain.value=1;soundOn=true;
        if(preview&&s.chapter==='prologue'&&(s.phase==='work'||s.kept.includes('song')))playNotes();
      }else{soundOn=false;stopNotes();if(ambient)ambient.gain.value=0;if(audio)await audio.suspend();}
      soundWanted=enabled;try{localStorage.setItem(soundKey,enabled?'on':'off');}catch(_){}
    }catch(error){soundOn=false;soundWanted=false;if(ambient)ambient.gain.value=0;toast(error.message+' All clues remain available in text.');}
    finally{soundBusy=false;soundButtons();}
  }
  async function listenAgain(){if(soundOn){try{await audio.resume();playNotes();}catch(error){toast('Audio could not resume. Toggle sound to try again.');}}else await setSound(true);}
  $('sound').addEventListener('click',()=>setSound());dialogSound.addEventListener('click',()=>setSound());soundButtons();
  window.addEventListener('blur',()=>{moves.clear();touchMove();position();save();});document.addEventListener('visibilitychange',()=>{if(document.hidden){position();save();audio?.suspend();}else if(soundOn)audio?.resume().catch(()=>{});});window.addEventListener('pagehide',()=>{position();save();});hud();
})();
