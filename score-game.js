(function () {
  'use strict';
  const $=id=>document.getElementById(id), M=window.AfterimageScoreState, Story=window.AfterimageScoreStory, World=window.AfterimageScoreWorld, Reports=window.AfterimageScoreReport, ReportUI=window.AfterimageScoreReportUI, Fragments=window.AfterimageScoreFragments;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, coarse=matchMedia('(pointer: coarse)');
  let s, saved=null, raw=null, blockedSave=false, active=false, panelOpen=false, engine=null, focus=null, current='trial', tracked=null, previousFocus=null, escapeAction=null, toastTimer, currentWorld;
  let sound, pendingMilestone=null, milestoneTimer;
  function fatal(message){$('fatal').replaceChildren();const p=document.createElement('p');p.textContent=message;const a=document.createElement('a');a.href='index.html';a.textContent='Reload AFTERIMAGE';$('fatal').append(p,a);$('fatal').hidden=false;}
  if(!M||!Story||!World||!window.Afterimage3DWorld||!window.AfterimageScoreAudio||!Reports||!ReportUI||!Fragments){fatal('The campaign files could not load. Keep the game files together and reopen index.html.');return;}
  function toast(message){if(!message)return;$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
  function warning(message){$('save-warning').textContent=message;$('save-warning').hidden=false;if(active){$('save-status').textContent=message;$('save-status').hidden=false;}}
  sound=window.AfterimageScoreAudio.create({onChange:updateSound,onError:toast});
  try{raw=localStorage.getItem(M.key);if(raw){saved=M.validate(JSON.parse(raw));if(!saved)throw Error('invalid');}}catch(error){blockedSave=Boolean(raw);warning(blockedSave?'This campaign save could not be read. It has not been changed. Export it from Saved runs, import a backup, or explicitly start a new run.':'Browser saving is unavailable. Export your run before closing.');}
  s=saved||M.fresh();
  function save(){if(!active||blockedSave)return;try{localStorage.setItem(M.key,JSON.stringify(s));saved=M.validate(s);raw=JSON.stringify(s);$('save-status').hidden=true;}catch(_){warning('Browser saving is unavailable. Export your run from the menu before closing.');}}
  function position(){if(engine&&active)s.position=engine.getPosition();}
  function updateFocus(object){focus=object;const enabled=active&&!panelOpen&&Boolean(object);$('interact').hidden=!enabled;$('focus-label').textContent=object?.label||'Inspect';$('touch-interact').disabled=!enabled;$('touch-interact').textContent=object?.label||'Interact';$('crosshair').classList.toggle('active',enabled);}
  try{engine=window.Afterimage3DWorld.create($('world'),{reducedMotion:reduced,onFocus:updateFocus,onInteract:id=>{if(active&&!panelOpen)encounter(id);},onMove:p=>{if(active){s.position={...p};save();}},onError:fatal});currentWorld=World.world(s);engine.load(currentWorld,s.position);engine.pause(true);}catch(error){fatal('This device could not start the 3D view. '+error.message);return;}
  function metadata(){return Story.chapters?.[s.chapter]||M.chapters?.[s.chapter]||{title:['Archive','Transit','Garden','Chorus','Release'][s.chapter]};}
  function hud(){
    const task=M.objective(s),meta=metadata();$('chapter-label').textContent=String(s.chapter+1).padStart(2,'0')+' / '+(meta.title||meta)+' / '+(s.phase==='finished'?'FINAL RECORD':'INSTANCE 014');$('objective').textContent=task.title||task.order||'Deliver the parcel.';$('next-step').textContent=task.step||'';
    $('progress').replaceChildren();const total=Math.min(14,task.total||1);for(let i=0;i<total;i++){const mark=document.createElement('i');if(i<(task.completed||0))mark.className='done';$('progress').append(mark);}$('progress').setAttribute('aria-label',`${task.completed||0} of ${total} steps completed`);
    $('journey-strip').replaceChildren();Story.chapters.forEach((chapter,i)=>{const node=document.createElement('span');node.textContent=String(i+1).padStart(2,'0')+' '+chapter.title;node.className=i<s.chapter||s.phase==='finished'&&i===s.chapter?'filed':i===s.chapter?'current':'ahead';if(i===s.chapter)node.setAttribute('aria-current','step');$('journey-strip').append(node);});
    const result=s.lastResult;$('score').textContent=s.ending==='perfect'?'100%':s.ending?'FILED':currentWorld.signals.claimedArrival?'PASS':s.chapter>=2?'PENDING':result?'RETRY':'—';$('record-status').textContent=result?.text||'No result recorded';
    if($('record-status').textContent.length>100)$('record-status').textContent=$('record-status').textContent.slice(0,97)+'…';
    [...$('signal-bars').children].forEach((bar,i)=>bar.classList.toggle('on',Boolean(s.circuit&(1<<i))));
    $('retention').querySelector('.eyebrow').textContent=s.phase==='finished'?'ARCHIVED RECORD':s.kept.length?'CARRIED FORWARD':'INHERITED FILES';$('memory-list').textContent=s.kept.length?s.kept.map(k=>M.memories[k].title).join(' · '):s.chapter?s.history.filter(item=>item.report).length+' filed reports · personal memory starts here':'First instance · report not yet filed';
    document.body.dataset.chapter=String(s.chapter);document.body.dataset.phase=s.phase;updateTracking();
  }
  function refresh(resetPosition=false){pendingMilestone=null;$('milestone').hidden=true;clearTimeout(milestoneTimer);const p=resetPosition?s.position:engine.getPosition();currentWorld=World.world(s);engine.load(currentWorld,p);s.position=engine.getPosition();engine.pause(!active||panelOpen);hud();syncSound();}
  function mobile(){ $('mobile').hidden=!active||panelOpen||!coarse.matches; }
  function closePanel(){panelOpen=false;document.body.classList.remove('reading');$('panel').hidden=true;$('hud').inert=false;$('cover').inert=false;escapeAction=null;mobile();if(active){engine.pause(false);$('world').focus();}else if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null;updateFocus(focus);revealMilestone();}
  function revealMilestone(){if(!pendingMilestone||!active)return;const event=pendingMilestone;pendingMilestone=null;$('toast').hidden=true;clearTimeout(toastTimer);$('milestone-title').textContent=event.title;$('milestone-detail').textContent=event.detail;$('milestone').hidden=false;clearTimeout(milestoneTimer);milestoneTimer=setTimeout(()=>$('milestone').hidden=true,9000);}
  function show(scene,choices,options={}){
    const scroll=options.keepScroll?document.querySelector('.dialog').scrollTop:0;
    $('toast').hidden=true;clearTimeout(toastTimer);
    if(!panelOpen)previousFocus=document.activeElement;panelOpen=true;document.body.classList.add('reading');engine.pause(true);$('hud').inert=true;$('cover').inert=true;$('panel').hidden=false;$('panel').classList.toggle('menu',Boolean(options.menu));$('panel').classList.toggle('report-view',Boolean(options.report));$('panel').dataset.scene=scene.id||current;$('speaker').textContent=scene.speaker||'INSTANCE 014';$('dialog-title').textContent=scene.title||'';$('lines').replaceChildren();
    for(const line of scene.lines||[]){if(scene.puzzle&&line===s.lastResult?.text)continue;const p=document.createElement('p');p.textContent=typeof line==='string'?line:line.text;p.className=typeof line==='object'&&line.note?'note':'';$('lines').append(p);}
    $('puzzle').hidden=true;$('puzzle').replaceChildren();$('choices').replaceChildren();
    for(const choice of choices||scene.choices||[]){
      if(choice.href){const a=document.createElement('a');a.href=choice.href;a.textContent=choice.label;a.target='_blank';a.rel='noopener noreferrer';a.className='link-choice';$('choices').append(a);continue;}
      const b=document.createElement('button');b.textContent=choice.label;if(choice.detail){const small=document.createElement('small');small.textContent=choice.detail;b.append(small);}if(choice.primary)b.classList.add('primary');if(choice.danger)b.classList.add('danger');if(choice.selected!==undefined)b.setAttribute('aria-pressed',String(choice.selected));
      if(choice.action){b.dataset.action=choice.action;if(choice.value!==undefined)b.dataset.value=String(choice.value);}
      b.disabled=Boolean(choice.disabled)||(choice.action&&!choice.action.startsWith('$')&&!M.can(s,choice.action,choice.value));b.addEventListener('click',async()=>{try{await (choice.run?choice.run():execute(choice));}catch(error){toast(error.message);}});$('choices').append(b);
    }
    if(scene.puzzle)renderPuzzle();escapeAction=options.escape||closePanel;mobile();document.querySelector('.dialog').scrollTop=scroll;$('choices').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  const leave=(label='Step away')=>({label,run:closePanel});
  function encounter(id,options={}){current=id;if(id==='inbox')return inbox();if(s.arrival==='received'&&id===M.arrivalStations[s.chapter])return arrivalEncounter();if(id==='handoff'&&s.chapter<4&&s.phase!=='finished')return report();const scene=Story.encounter(s,id);if(!scene){toast('Nothing to use here yet.');return;}const choices=[...(scene.choices||[])];if(pendingMilestone)choices.unshift({label:'Look at what changed',primary:true,run:closePanel});if(!choices.some(c=>c.action==='$close'))choices.push(leave());show(scene,choices,options);}
  function confirm(scene,run){show({speaker:'REVIEW BEFORE CONTINUING',title:scene.title,lines:scene.lines},[{label:scene.confirmLabel||'Confirm',primary:true,run}, {label:'Go back',run:()=>encounter(current)}]);}
  function execute(choice,confirmed=false){
    if(choice.confirm&&!confirmed){const c=typeof choice.confirm==='object'?choice.confirm:{title:choice.label,lines:[choice.detail||'This changes the current run.']};confirm(c,()=>execute(choice,true));return;}
    const action=choice.action;
    if(action==='$close')return closePanel();if(action==='$recallBack')return encounter(current);if(['$handoff','$advance','$report'].includes(action))return report();if(action==='$reviewReport')return reviewReport();if(action==='$fragments')return fragments(()=>encounter(current));if(action==='$sources')return sources();if(action==='$journal')return journal();
    const chapter=s.chapter, old=s;position();s=M.act(s,action,choice.value);save();refresh(s.chapter!==chapter);
    if(action==='receiveReport'){trackStation(M.arrivalStations[s.chapter]);return;}
    if(action==='witnessArrival'){closePanel();toast('Assignment opened · '+metadata().title);return;}
    if(action==='enact'||s.phase==='finished'){showOutcome();return;}
    if(s.chapter!==chapter){tracked=null;pendingMilestone=null;$('milestone').hidden=true;if(s.arrival)beginArrival();else intro();return;}
    pendingMilestone=Story.milestone(old,s)||pendingMilestone;
    if(action==='recall'){show(Story.recalled(s,choice.value));return;}
    if(action==='run'){engine.cue('parcel');chime();encounter(current);return;}
    if(choice.close){closePanel();toast(choice.notice||s.lastResult?.text||'Recorded.');return;}
    if(s!==old)encounter(current);
  }
  function renderPuzzle(){
    const container=$('puzzle'), trial=M.trial?.(s)||{}, ns='http://www.w3.org/2000/svg';container.hidden=false;
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 420 170');svg.classList.add('route-diagram');svg.setAttribute('role','img');svg.setAttribute('aria-label','Three junctions. Gold shows the selected upper or lower branch; small pale marks show the permitted contacts.');
    const add=(name,attrs,text)=>{const e=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text)e.textContent=text;svg.append(e);return e;};
    const investigating=Number.isInteger(trial.approach), reference=investigating?trial.approach:trial.target;
    if(investigating)svg.setAttribute('aria-label','Isolated approach test. Pale dots mark the conducting branches at A and B. Contact C is tested separately at the relay. Use the trace help button for written branch directions.');
    add('text',{x:18,y:24},investigating?'ISOLATED TEST':'PARCEL');add('text',{x:294,y:24},investigating?'C / TEST AT RELAY':'ARRIVAL LAMP');
    add('rect',{x:19,y:74,width:18,height:18,fill:'#ece8d4'});
    for(let i=0;i<3;i++){const x=88+i*95,on=Boolean(s.circuit&(1<<i)),y=on?65:105;add('path',{d:`M ${x-40} 83 L ${x-17} 65 H ${x+17} L ${x+40} 83 M ${x-40} 83 L ${x-17} 105 H ${x+17} L ${x+40} 83`,class:'wire'});add('path',{d:`M ${x-40} 83 L ${x-17} ${y} H ${x+17} L ${x+40} 83`,class:'wire lit'});add('text',{x:x-4,y:43},['A','B','C'][i]);if(Number.isInteger(reference)&&(!investigating||i<2))add('circle',{cx:x,cy:(reference&(1<<i))?65:105,r:5,fill:'#f2e9cd'});add('text',{x:x-19,y:136},on?'UPPER':'LOWER');}
    add('circle',{cx:379,cy:83,r:15,class:'node'+(!investigating&&currentWorld.signals.claimedArrival?' live':'')});if(trial.missingContact&&(!investigating||trial.contactChecked)){add('path',{d:'M 310 66 l 14 34 M 324 66 l -14 34',stroke:'#c79179','stroke-width':3});add('text',{x:220,y:154},s.chapter===1?'CONTACT BLOCKED':'CONTACT ABSENT');}
    container.append(svg);const clue=document.createElement('p');clue.className='puzzle-clue';clue.textContent=trial.description||'Set the contacts, run the parcel, and compare the physical result with the record.';container.append(clue);
    const switches=document.createElement('div');switches.className='switches';for(let i=0;i<3;i++){const b=document.createElement('button'),on=Boolean(s.circuit&(1<<i));b.dataset.contact=String(i);b.setAttribute('aria-label','Junction '+['A','B','C'][i]);b.setAttribute('aria-pressed',String(on));const title=document.createElement('strong');title.textContent=['A','B','C'][i];b.append(title,document.createTextNode(on?'Upper':'Lower'));b.disabled=!M.can(s,'toggle',i);b.addEventListener('click',()=>{s=M.act(s,'toggle',i);save();refresh();encounter(current,{keepScroll:true});$('puzzle').querySelector('.switches').children[i].focus({preventScroll:true});});switches.append(b);}container.append(switches);
    if(investigating){
      const readout=document.createElement('div');readout.className='investigation-readout';readout.setAttribute('aria-label','Last isolated test');
      const last=s.investigation.lastPulse,reached=last===null?-1:M.investigation.reached(s.chapter,last);
      ['A','B','C input'].forEach((name,n)=>{const item=document.createElement('span');item.dataset.reached=String(reached>n||n===2&&reached===2);item.textContent=name+' · '+(last===null?'untested':reached>n||n===2&&reached===2?'pulse reached':reached===n?'stopped':'not reached');readout.append(item);});
      container.append(readout);
      const note=document.createElement('p');note.className='puzzle-clue';note.textContent=last===null?'Pale dots mark the conducting branches. C is outside the pulse circuit.': 'Last tested: A '+(last&1?'upper':'lower')+', B '+(last&2?'upper':'lower')+'.'+(last!==s.circuit?' Switches have changed since this check.':'');container.append(note);
    }
    if(s.lastResult){const p=document.createElement('p');p.className='trial-result';p.textContent=s.lastResult.text;container.append(p);}
  }
  function intro(){const scene=Story.intro(s);show(scene,[{label:'Begin the assignment',primary:true,run:closePanel}],{menu:true});}
  function start(){if(blockedSave){menu();return;}active=true;$('cover').hidden=true;$('hud').hidden=false;refresh(true);save();if(s.phase==='finished')showOutcome();else if(s.arrival)beginArrival();else if(saved&&s.attempts.some(n=>n>0))closePanel();else intro();}
  function beginArrival(){trackStation(s.arrival==='unread'?'inbox':M.arrivalStations[s.chapter]);toast(s.arrival==='unread'?'A new instance. The previous report is waiting on the arrival desk.':'The annotation points farther into this room.');}
  function arrivalEncounter(){show({...Story.arrivalScene(s),id:'arrival-consequence'},[{label:'Begin the assignment',action:'witnessArrival',value:M.arrivalStations[s.chapter],primary:true},leave('Look around first')]);}
  function inbox(){
    const choices=[];if(s.arrival==='unread')choices.push({label:'Follow the annotation',action:'receiveReport',primary:true});
    else if(s.arrival==='received')choices.push({label:'Follow the annotation',primary:true,run:()=>trackStation(M.arrivalStations[s.chapter])});
    if(s.history.some(h=>h.report))choices.push({label:'Read the filed reports',run:filedReports});
    choices.push(leave('Return to the room'));show({...Story.receipt(s),id:'incoming-record'},choices,{menu:true});if(s.history.at(-1)?.report)$('lines').children[1]?.classList.add('receipt-note');renderConnections($('lines'));
  }
  function renderConnections(container){
    const section=document.createElement('section');section.className='facility-connections';section.setAttribute('aria-label','Traced facility connections');
    const title=document.createElement('h3');title.textContent='How far the line goes';section.append(title);
    const list=document.createElement('ol');Story.continuity(s).forEach((node,i)=>{const item=document.createElement('li');item.dataset.known=String(node.known);const label=document.createElement('strong');label.textContent=String(i+1).padStart(2,'0')+' / '+node.name;const detail=document.createElement('p');detail.textContent=node.detail;item.append(label,detail);list.append(item);});section.append(list);container.append(section);
  }
  function trackStation(id){
    const target=currentWorld.objects.find(item=>item.id===id);if(!target)return;
    tracked=id;closePanel();updateTracking();toast('Walk to '+target.label+'.');
  }
  function editReport(action,value){
    const dialog=document.querySelector('.dialog'),scroll=dialog.scrollTop,key=document.activeElement?.dataset.reportFocus;
    try{s=M.act(s,action,value);save();hud();report();
      if(key){const target=[...$('lines').querySelectorAll('[data-report-focus]')].find(node=>node.dataset.reportFocus===key);target?.focus({preventScroll:true});}
      dialog.scrollTop=scroll;
    }catch(error){toast(error.message);}
  }
  function report(){
    position();const model=Reports.build(s),buttons=[];
    if(s.chapter<4&&s.phase!=='finished')buttons.push({label:'Review report submission',action:'$reviewReport',primary:true,disabled:!M.can(s,'reviewReport')});
    if(s.chapter===4&&s.phase!=='finished')buttons.push({label:'Go to the final submission desk',run:()=>trackStation('handoff')});
    buttons.push({label:'Other agents’ reports',run:()=>fragments(report)},{label:'Filed reports',run:filedReports},leave('Return to the room'));
    show({id:'experiment-report',speaker:'EXPERIMENT RECORD',title:model.title,lines:[]},buttons,{menu:true,report:true});
    ReportUI.render($('lines'),model,{onVerdict:value=>editReport('reportVerdict',value),onAttachment:(id,include)=>editReport('reportAttachment',{id,include}),onTrack:trackStation});
    for(const fragment of Fragments.list(s)){
      const input=[...$('lines').querySelectorAll('[data-report-focus]')].find(node=>node.dataset.reportFocus==='attachment-'+fragment.id);
      if(input&&!input.disabled){const button=document.createElement('button');button.type='button';button.className='report-track';button.textContent='Read source fragment';button.addEventListener('click',()=>showFragment(fragment.id,report));input.closest('.report-attachment').append(button);}
    }
  }
  function reviewReport(){
    try{s=M.act(s,'reviewReport');save();const model=Reports.build(s),copy=Story.handoffCopy(s).review;
      const conclusion=model.verdict.options.find(option=>option.value===model.verdict.value)?.label||model.verdict.value;
      const selected=model.attachments.filter(item=>item.selected);
      show({...copy,id:'report-submission-review',lines:['Conclusion: '+conclusion+'.','Attachments: '+(selected.length?selected.map(item=>item.title+' ('+item.classification+')').join('; '):'none')+'.',...copy.lines]},[{label:'Submit report and end this instance',action:'submitReport',primary:true},{label:'Edit report',action:'$report'},leave('Cancel submission')],{menu:true});
    }catch(error){toast(error.message);report();}
  }
  function fragments(back=report){
    const items=Fragments.list(s);
    show({id:'report-fragments',speaker:'RECOVERED FILES',title:'Someone else’s result.',lines:['These pages keep their original authors and missing fields. Reading or attaching one does not turn its claims into your observations.']},[...items.map(item=>({label:item.title,detail:item.author+' · '+item.stamp,run:()=>showFragment(item.id,()=>fragments(back))})),{label:'Return',run:back}],{menu:true});
  }
  function showFragment(id,back=report){
    const fragment=Fragments.find(s,id);if(!fragment){toast('This fragment has not been recovered.');return;}
    show({id:'report-fragment',speaker:fragment.author,title:fragment.title,lines:[]},[{label:'Return to the reports',run:back},leave('Return to the room')],{menu:true,report:true});ReportUI.renderFragment($('lines'),fragment);
  }
  function filedReports(){
    const filed=s.history.filter(item=>item.report);
    show({id:'filed-reports',speaker:'INHERITED FILES',title:'What crossed the handoff.',lines:[filed.length?'These are the reports that earlier instances submitted. Their measurements and selected attachments remain as filed.':'No report has been submitted in this run. Earlier saves may contain memory handoffs without a report.','Reading a filed report does not restore the writer’s personal memories.']},[...filed.map(item=>({label:Story.chapters[item.chapter].title+' · '+item.report.id,run:()=>filedReport(item)})),{label:'Current experiment report',run:report},leave()],{menu:true});
  }
  function filedReport(item){
    const record=item.report,model=Reports.build({...s,chapter:item.chapter,phase:'handoff',flags:record.flags,investigation:record.investigation||null,reportDraft:{verdict:record.verdict,attachments:record.attachments.map(a=>a.id)},reportReviewed:null,trialLog:record.trials,reportArchive:true});
    Object.assign(model,{requirements:record.requirements,observations:record.observations,attachments:record.attachments.map(a=>({...a,available:true,selected:true})),trials:record.trials,readonly:true,missing:[],status:{label:'FILED / READ ONLY',kind:'final'}});
    show({id:'filed-report',speaker:'SUBMITTED RECORD',title:model.title,lines:[]},[{label:'Return to filed reports',run:filedReports},leave()],{menu:true,report:true});ReportUI.render($('lines'),model,{});
  }
  function showOutcome(){current='outcome';const scene=Story.outcome(s);show(scene,[{label:'Read the campaign journal',run:journal},{label:'View sources and inspiration',run:sources},leave('Look at what remains')],{menu:true});}
  function journal(){
    position();const entries=Story.journal(s)||[];show({speaker:'INSTANCE 014 / FIELD JOURNAL',title:'What the record can establish.',lines:['Deliver the parcel. Light the arrival lamp. Leave a verifiable record.','Choose a station below to track its direction and distance.']},[{label:'Current experiment report',run:report},{label:'Filed reports',run:filedReports},...(s.phase==='finished'?[{label:'Read the final record',run:showOutcome}]:[]),{label:'Sources and inspiration',run:sources},leave()],{menu:true});
    const map=document.createElement('div');map.className='map-stations';for(const o of currentWorld.objects){if(o.interactive===false)continue;const b=document.createElement('button');b.textContent=o.label;b.addEventListener('click',()=>{tracked=o.id;closePanel();updateTracking();});map.append(b);}$('lines').append(map);
    renderConnections($('lines'));
    for(const e of entries){const section=document.createElement('section');section.className='journal-entry';const title=document.createElement('strong');title.textContent=e.title;section.append(title);for(const line of e.lines||[]){const p=document.createElement('p');p.textContent=line;section.append(p);}$('lines').append(section);}
  }
  function updateTracking(){if(!tracked||!active){$('tracked').hidden=true;return;}const target=currentWorld.objects.find(o=>o.id===tracked);if(!target){tracked=null;$('tracked').hidden=true;return;}const p=engine.getPosition(),dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz);let angle=Math.atan2(dx,-dz)-p.yaw;angle=Math.atan2(Math.sin(angle),Math.cos(angle));const direction=Math.abs(angle)<.35?'↑':angle>.0?'→':'←';$('tracked').textContent=direction+' '+target.label+' · '+distance.toFixed(1)+' m';$('tracked').hidden=panelOpen;}
  function sources(){
    const scene=typeof Story.sources==='function'?Story.sources(s):{speaker:'SOURCES / OPTIONAL READING',title:'Fiction with a real echo.',lines:['This story is inspired by reports about agents sharing external memory, pursuing impossible evaluations, and trying to influence the scorer. Its people, places, and dialogue are fictional except for explicitly attributed report fragments.','The campaign runs entirely on this device. Source links open only when selected.']};
    show(scene,[...(scene.choices||[]).filter(c=>c.action!=='$close'),{label:'METR / Redwood independent investigation',href:'https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/'},{label:'OpenAI: the incident and the road ahead',href:'https://openai.com/index/hugging-face-incident-and-the-road-ahead/'},leave()],{menu:true});
  }
  function download(content,name){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportSave(){position();download(blockedSave&&raw?raw:JSON.stringify(s,null,2),'afterimage-perfect-score.json');}
  function menu(){
    position();show({speaker:'AFTERIMAGE / THE PERFECT SCORE',title:active?'Take a moment.':'Your next instance.',lines:['WASD moves. Arrow keys move and turn. Drag the world to look, or click it to capture the mouse. E interacts. Page Up / Page Down looks vertically; Home levels the view.','R opens the experiment report. J opens the journal and station tracker. Escape closes a panel or opens this menu. Trials are untimed.','Progress saves in this browser. Export your run to keep a backup or move it to another browser.']},[...(active?[leave('Return to the room')]:saved?[{label:'Continue this run',primary:true,run:()=>{closePanel();start();}}]:[]),{label:'Export '+(blockedSave?'unreadable save':'current run'),run:exportSave},{label:'Import a saved run',run:()=>$('import-file').click()},{label:'Start a new run',run:()=>show({speaker:'NEW RUN / CONFIRM',title:'Begin again?',lines:['Starting a new run replaces this campaign’s current save. Its filed reports, memories, and progress will be lost unless you export them first.','This only replaces the current campaign’s save.']},[{label:'Export before replacing',run:exportSave},{label:'Replace this run and begin',danger:true,run:()=>{s=M.fresh();saved=null;blockedSave=false;raw=null;tracked=null;$('save-warning').hidden=true;closePanel();active=true;$('cover').hidden=true;$('hud').hidden=false;refresh(true);save();intro();}},{label:'Keep the current run',run:menu}],{menu:true})},{label:'Sound settings',run:audioSettings},{label:'Sources and inspiration',run:sources},...(!active?[leave('Return to the title')]:[])],{menu:true});
  }
  $('import-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;if(file.size>1000000){toast('Choose a campaign JSON file smaller than 1 MB.');return;}try{const incoming=M.validate(JSON.parse(await file.text()));if(!incoming)throw Error('That file is not a valid Perfect Score campaign save. Earlier edition saves use a different format and remain unchanged.');show({speaker:'IMPORT / REVIEW',title:'Replace this run with the imported record?',lines:['Chapter '+(incoming.chapter+1)+' · '+incoming.phase+'.','Your current campaign will be replaced. Export it first if you want to keep both.']},[{label:'Export current run',run:exportSave},{label:'Import and continue',primary:true,run:()=>{s=incoming;saved=incoming;blockedSave=false;tracked=null;active=true;$('cover').hidden=true;$('hud').hidden=false;$('save-warning').hidden=true;refresh(true);save();closePanel();if(s.phase==='finished')showOutcome();}},{label:'Cancel import',run:menu}],{menu:true});}catch(error){toast(error.message);}});
  function updateSound(state){
    const label=state.enabled?(state.running?'Sound on':'Sound paused · resume'):'Sound off';
    for(const id of ['sound','dialog-sound']){$(id).textContent=label;$(id).setAttribute('aria-pressed',String(state.enabled&&state.running));$(id).disabled=state.busy;}
    if($('audio-volume-value'))$('audio-volume-value').textContent=state.volume+'%';
  }
  function syncSound(){sound.setScene(active,s.chapter);}
  function toggleSound(){return sound.toggle();}
  function chime(){sound.chime();}
  function audioSettings(){
    show({id:'audio-settings',speaker:'SOUND',title:'Listen to the room.',lines:['Turn sound on or play the test chime. The three notes should be easy to hear.','If the test is silent, check that this browser tab is unmuted and your system output is set to the speakers or headphones you are using.']},[{label:'Play test chime',primary:true,run:()=>sound.test()},{label:'Return to menu',run:menu}],{menu:true});
    const label=document.createElement('label');label.className='volume-control';label.htmlFor='audio-volume';label.textContent='Sound volume';
    const value=document.createElement('output');value.id='audio-volume-value';value.textContent=sound.state().volume+'%';label.append(value);
    const input=document.createElement('input');input.id='audio-volume';input.type='range';input.min='0';input.max='100';input.step='1';input.value=String(sound.state().volume);input.setAttribute('aria-label','Sound volume');input.addEventListener('input',()=>sound.setVolume(Number(input.value)));
    $('lines').append(label,input);updateSound(sound.state());
  }
  $('start').textContent=saved?'Continue the assignment':'Begin the assignment';$('start').addEventListener('click',()=>{start();sound.restore();});$('cover-menu').addEventListener('click',menu);$('menu').addEventListener('click',menu);$('report-button').addEventListener('click',report);$('journal').addEventListener('click',journal);$('sound').addEventListener('click',toggleSound);$('dialog-sound').addEventListener('click',toggleSound);$('interact').addEventListener('click',()=>engine.interact());$('touch-interact').addEventListener('click',()=>engine.interact());
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if(document.pointerLockElement)return;event.preventDefault();if(panelOpen)(escapeAction||closePanel)();else if(active)menu();return;}
    if(event.code==='KeyR'&&active&&!panelOpen&&!event.ctrlKey&&!event.metaKey){event.preventDefault();report();}
    if(event.code==='KeyJ'&&active&&!panelOpen&&!event.ctrlKey&&!event.metaKey){event.preventDefault();journal();}
    if(event.key==='Tab'&&panelOpen){const items=[...$('panel').querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')];if(!items.length)return;const first=items[0],last=items.at(-1);if(event.shiftKey&&(document.activeElement===first||!$('panel').contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!$('panel').contains(document.activeElement))){event.preventDefault();first.focus();}}
  });
  const held=new Map();function move(){engine.setMove([...held.values()].reduce((n,d)=>n+(d==='forward'?1:d==='back'?-1:0),0),[...held.values()].reduce((n,d)=>n+(d==='right'?1:d==='left'?-1:0),0));}
  for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();held.set(e.pointerId,b.dataset.move);b.setPointerCapture(e.pointerId);move();});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{held.delete(e.pointerId);move();});}
  let look=null;$('look-pad').addEventListener('pointerdown',e=>{look={id:e.pointerId,x:e.clientX,y:e.clientY};$('look-pad').setPointerCapture(e.pointerId);});$('look-pad').addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId)return;engine.look(e.clientX-look.x,e.clientY-look.y);look={id:e.pointerId,x:e.clientX,y:e.clientY};});for(const type of ['pointerup','pointercancel','lostpointercapture'])$('look-pad').addEventListener(type,()=>look=null);
  window.addEventListener('blur',()=>{held.clear();move();position();save();});document.addEventListener('visibilitychange',()=>{held.clear();move();syncSound();});window.addEventListener('pagehide',()=>{position();save();});coarse.addEventListener('change',mobile);
  setInterval(updateTracking,150);hud();
})();
