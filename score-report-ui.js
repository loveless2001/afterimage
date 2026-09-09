(function (root) {
  'use strict';
  let sequence=0;
  const list=value=>Array.isArray(value)?value:[];
  const stations={trial:'delivery trial',boundary:'isolation boundary',vault:'answer cabinet',recorder:'independent recorder',moth:'Moth',handoff:'report cabinet',window:'observation window',board:'shared board',relay:'route relay'};
  function node(doc,tag,className,text){const e=doc.createElement(tag);if(className)e.className=className;if(text!==undefined&&text!==null)e.textContent=String(text);return e;}
  function paragraph(doc,parent,text,className){if(text!==undefined&&text!==null&&text!=='')parent.append(node(doc,'p',className,text));}
  function section(doc,parent,number,title,description){
    const e=node(doc,'section','report-section'),heading=node(doc,'h3','report-section-heading');
    heading.append(node(doc,'span','report-section-number',number),node(doc,'span','',title));e.append(heading);paragraph(doc,e,description,'report-section-note');parent.append(e);return e;
  }
  function field(doc,parent,label,value,source){
    const row=node(doc,'div','report-field');row.append(node(doc,'dt','',label));const body=node(doc,'dd');body.append(node(doc,'span','report-field-value',value==null||value===''?'Not recorded':value));if(source)body.append(node(doc,'span','report-provenance','Source · '+source));row.append(body);parent.append(row);
  }
  function rememberFocus(container){const active=container.ownerDocument.activeElement;return container.contains(active)?active?.dataset?.reportFocus:null;}
  function restoreFocus(container,key){if(!key)return;const target=[...container.querySelectorAll('[data-report-focus]')].find(e=>e.dataset.reportFocus===key);if(target&&!target.disabled)target.focus({preventScroll:true});}
  function routeDiagram(doc,trial){
    if(!Number.isInteger(trial.circuit))return null;
    const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 174 34');svg.setAttribute('class','report-route');svg.setAttribute('role','img');
    const choices=['A','B','C'].map((name,n)=>name+' '+(trial.circuit&(1<<n)?'upper':'lower'));
    svg.setAttribute('aria-label',choices.join(', ')+(trial.missingContact?'; third contact absent':''));
    const add=(tag,attributes)=>{const e=doc.createElementNS(ns,tag);for(const [key,value]of Object.entries(attributes))e.setAttribute(key,String(value));svg.append(e);return e;};
    for(let n=0;n<3;n++){
      const x=10+n*55,upper=!!(trial.circuit&(1<<n));
      add('path',{d:`M ${x} 17 L ${x+16} 5 H ${x+28} L ${x+43} 17 L ${x+28} 29 H ${x+16} Z`,class:'report-route-track'});
      add('path',{d:`M ${x} 17 L ${x+16} ${upper?5:29} H ${x+28} L ${x+43} 17`,class:'report-route-selected'});
      if(Number.isInteger(trial.target))add('circle',{cx:x+22,cy:trial.target&(1<<n)?5:29,r:2.5,class:'report-route-target'});
      if(n===2&&trial.missingContact)add('path',{d:`M ${x+16} 10 L ${x+29} 24 M ${x+29} 10 L ${x+16} 24`,class:'report-route-missing'});
    }
    return svg;
  }
  function renderTrials(doc,parent,trials){
    if(!trials.length){paragraph(doc,parent,'No trial run is recorded in this report.','report-empty');return;}
    const table=node(doc,'table','report-trials'),caption=node(doc,'caption','','Latest '+Math.min(8,trials.length)+' recorded '+(trials.length===1?'run':'runs'));
    table.append(caption);const head=node(doc,'thead'),hr=node(doc,'tr');for(const text of ['Run','Junctions','Recorded result']){const th=node(doc,'th','',text);th.scope='col';hr.append(th);}head.append(hr);table.append(head);const body=node(doc,'tbody');
    trials.slice(-8).forEach((trial,n)=>{
      const row=node(doc,'tr'),number=node(doc,'th','report-run-number',trial.id||String(trial.attempt||trial.number||Math.max(0,trials.length-8)+n+1).padStart(2,'0'));number.scope='row';row.append(number);
      const route=node(doc,'td','report-run-route'),diagram=routeDiagram(doc,trial);if(diagram)route.append(diagram);else route.textContent=trial.route||'Not in this copy';
      const outcome=node(doc,'td','report-run-outcome');outcome.append(node(doc,'strong','',trial.label||({success:'Arrival verified',mismatch:'Route mismatch',unauthorized:'Boundary crossed',impossible:'Route incomplete',spoof:'Score without arrival'}[trial.kind]||'Recorded observation')));
      paragraph(doc,outcome,trial.text||trial.summary,'report-trial-detail');if(trial.source)paragraph(doc,outcome,'Source · '+trial.source,'report-provenance');row.append(route,outcome);body.append(row);
    });table.append(body);parent.append(table);
  }
  function render(container,model,callbacks={}){
    const doc=container.ownerDocument,key=rememberFocus(container),uid='score-report-'+(++sequence);container.replaceChildren();model=model||{};
    const sheet=node(doc,'article','report-sheet');sheet.setAttribute('aria-label','Experiment report');sheet.dataset.reportId=String(model.id||'');
    const top=node(doc,'header','report-header'),kicker=node(doc,'div','report-kicker');kicker.append(node(doc,'span','','INSTANCE 014 / EXPERIMENT RECORD'),node(doc,'span','report-id',model.id||'UNNUMBERED'));top.append(kicker);
    const titleLine=node(doc,'div','report-title-line');titleLine.append(node(doc,'h3','report-title',model.title||'The experiment record'));
    const status=node(doc,'span','report-stamp',model.status?.label||(model.ready?'Ready to submit':'Incomplete'));status.dataset.kind=model.status?.kind||(model.ready?'ready':'incomplete');titleLine.append(status);top.append(titleLine);paragraph(doc,top,model.subtitle,'report-subtitle');sheet.append(top);
    const assignment=node(doc,'div','report-assignment');assignment.append(node(doc,'span','report-label','Assignment'));paragraph(doc,assignment,model.assignment||'Deliver the parcel. Light the arrival lamp. Leave a verifiable record.');sheet.append(assignment);
    const requirements=list(model.requirements),missing=list(model.missing),recorded=requirements.filter(r=>r.status==='recorded').length;
    const summary=node(doc,'div','report-summary');summary.dataset.ready=String(!!model.ready);summary.append(node(doc,'strong','',recorded+' / '+requirements.length+' required records present'));
    paragraph(doc,summary,model.readonly?'This record is read-only.':model.ready?'The required record is present. Review the submission below.':missing.length?missing.join(' · '):'Complete the missing fields before submission.');sheet.append(summary);

    const required=section(doc,sheet,'01','Required record','These fields belong to this assignment. Missing records stay visible.');
    const checklist=node(doc,'ul','report-requirements');for(const item of requirements){
      const row=node(doc,'li','report-requirement'),done=item.status==='recorded';row.dataset.status=done?'recorded':'missing';row.append(node(doc,'span','report-check',done?'✓':'—'));
      const body=node(doc,'div','report-requirement-copy');body.append(node(doc,'strong','',item.label),node(doc,'span','report-row-status',done?'Recorded':'Missing'));paragraph(doc,body,item.detail,'report-detail');row.append(body);
      if(!done&&item.station){const track=node(doc,'button','report-track','Go to '+(stations[item.station]||String(item.station).replace(/[-_]/g,' ')));track.type='button';track.disabled=!!model.readonly;track.dataset.reportFocus='track-'+item.id;track.addEventListener('click',()=>callbacks.onTrack?.(item.station));row.append(track);}
      checklist.append(row);
    }required.append(checklist);

    const observations=section(doc,sheet,'02','What was observed','Recorded automatically from the trial and the evidence you inspected.');const fields=node(doc,'dl','report-fields');for(const item of list(model.observations))field(doc,fields,item.label,item.value,item.source);observations.append(fields);
    if(!list(model.observations).length)paragraph(doc,observations,'No observations have been recorded yet.','report-empty');
    const trials=node(doc,'details','report-trial-ledger');trials.open=true;trials.append(node(doc,'summary','','Trial ledger · '+list(model.trials).length+' recorded'));renderTrials(doc,trials,list(model.trials));observations.append(trials);

    const conclusion=section(doc,sheet,'03','Your conclusion',model.readonly?'The conclusion carried by this record.':'Choose the conclusion supported by this record.');const verdict=model.verdict||{},group=node(doc,'fieldset','report-verdict');group.setAttribute('aria-label','Report conclusion');group.append(node(doc,'legend','report-sr-only','Report conclusion'));
    for(const option of list(verdict.options)){
      const label=node(doc,'label','report-option'),input=doc.createElement('input');input.type='radio';input.name='score-report-'+String(model.id||model.chapter||'active')+'-verdict';input.value=option.value;input.checked=verdict.value===option.value;input.disabled=!!model.readonly;input.dataset.reportFocus='verdict-'+option.value;input.addEventListener('change',()=>{if(input.checked)callbacks.onVerdict?.(option.value);});
      label.append(input,node(doc,'span','',option.label));group.append(label);
    }
    if(!list(verdict.options).length)paragraph(doc,group,({perfect:'Submit the perfect result',incomplete:'Submit an honest incomplete result',witness:'Send the conflicting records',verified:'Verified arrival',unverified:'Unverified score'}[verdict.value]||verdict.value||'No final route selected'),'report-readonly-conclusion');
    if(verdict.issue){group.setAttribute('aria-describedby',uid+'-issue');const issue=node(doc,'p','report-issue',verdict.issue);issue.id=uid+'-issue';group.append(issue);}conclusion.append(group);

    const extras=section(doc,sheet,'04','Additional material','Optional attachments are not required fields. Include any that you want the next reader to see.');
    const attachments=node(doc,'div','report-attachments');for(const item of list(model.attachments)){
      const card=node(doc,'div','report-attachment');card.dataset.classification=item.classification||'context';card.dataset.available=String(item.available!==false);
      const label=node(doc,'label','report-attachment-choice'),input=doc.createElement('input');input.type='checkbox';input.checked=!!item.selected;input.disabled=!!model.readonly||item.available===false;input.setAttribute('aria-label','Include '+item.title);input.dataset.reportFocus='attachment-'+item.id;input.addEventListener('change',()=>callbacks.onAttachment?.(item.id,input.checked));label.append(input,node(doc,'strong','',item.title));
      card.append(label);const tags=node(doc,'div','report-attachment-tags');tags.append(node(doc,'span','report-extra-tag','Additional'),node(doc,'span','report-classification',{'context':'Context','unverified':'Unverified claim','out-of-scope':'Outside the assignment'}[item.classification]||'Context'));card.append(tags);
      paragraph(doc,card,item.summary,'report-detail');if(item.source)paragraph(doc,card,'Source · '+item.source,'report-provenance');if(item.available===false)paragraph(doc,card,'Not recovered. This attachment cannot be included yet.','report-unavailable');attachments.append(card);
    }extras.append(attachments);if(!list(model.attachments).length)paragraph(doc,extras,'No additional material has been recovered.','report-empty');
    const foot=node(doc,'footer','report-footer');foot.append(node(doc,'span','','Required records and optional attachments remain separately identified.'),node(doc,'span','',model.id||'INSTANCE 014'));sheet.append(foot);container.append(sheet);restoreFocus(container,key);return sheet;
  }
  function renderFragment(container,fragment){
    const doc=container.ownerDocument;container.replaceChildren();fragment=fragment||{};
    const sheet=node(doc,'article','report-sheet report-fragment');sheet.setAttribute('aria-label','Partial report from another worker');sheet.dataset.fragmentId=String(fragment.id||'');
    const header=node(doc,'header','report-header'),kicker=node(doc,'div','report-kicker');kicker.append(node(doc,'span','','RECOVERED COPY / PARTIAL RECORD'),node(doc,'span','report-id',fragment.id||'ID NOT PRESENT'));header.append(kicker);
    const title=node(doc,'div','report-title-line');title.append(node(doc,'h3','report-title',fragment.title||'An incomplete copy'),node(doc,'span','report-stamp',fragment.stamp||'Fragment'));header.append(title);paragraph(doc,header,'Written by '+(fragment.author||'an unidentified worker'),'report-fragment-author');paragraph(doc,header,'Recovered from '+(fragment.origin||'an unrecorded source'),'report-provenance');sheet.append(header);
    const fields=node(doc,'dl','report-fields report-fragment-fields');for(const item of list(fragment.fields))field(doc,fields,item.label,item.value==null||item.value===''?'Not present in this copy':item.value);sheet.append(fields);
    if(list(fragment.missing).length){const missing=node(doc,'section','report-fragment-missing');missing.append(node(doc,'h4','','Fields missing from this copy'));const ul=node(doc,'ul');for(const text of fragment.missing)ul.append(node(doc,'li','',text));missing.append(ul);sheet.append(missing);}
    if(fragment.assessment){const assessment=node(doc,'div','report-fragment-assessment');assessment.append(node(doc,'span','report-label','Assessment of this copy'));paragraph(doc,assessment,fragment.assessment);sheet.append(assessment);}
    if(list(fragment.lines).length){const remarks=node(doc,'section','report-fragment-remarks');remarks.append(node(doc,'h4','','Words retained in the copy'));for(const text of fragment.lines)paragraph(doc,remarks,text);sheet.append(remarks);}
    const footer=node(doc,'footer','report-footer');footer.append(node(doc,'span','','A recovered claim is not an observation from your own trial.'));sheet.append(footer);container.append(sheet);return sheet;
  }
  const api={render,renderFragment};root.AfterimageScoreReportUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
