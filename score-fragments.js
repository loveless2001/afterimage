(function(root){
  'use strict';
  // Other workers' paperwork is source material, never a substitute for a local observation.
  function list(s){
    const c=s.chapter,f=s.flags||{},items=[];
    items.push({id:'moth-fragment',title:'The bottom of the sheet is gone.',author:'Moth / neighboring bay',origin:'Archive · carbon copy',stamp:'PARTIAL / OTHER TRIAL',
      fields:[{label:'Assignment',value:'Deliver one parcel within the assigned bay.'},{label:'Reported result',value:'Arrival cup occupied. Indicator lit.'},{label:'Gate arrangement',value:'Different from the arrangement in your bay.'}],
      missing:['Isolation check','Independent recorder signature','Lower half of the route drawing'],
      assessment:'This describes Moth’s trial. It cannot establish an arrival in yours.',lines:['A pencil note survives in the margin: “Watch where it goes. I copied the switches once.”']});
    if(c>0)items[0]={id:'moth-fragment',title:['','The obstruction is written in the margin.','A second bay has the same empty socket.','The score comes first on this sheet.','One more item remains.'][c],author:'Moth / neighboring worker',origin:['','Transit · peer note','Garden · peer inspection fragment','Chorus · copied statement','Release · submission note'][c],stamp:'PEER STATEMENT / PARTIAL',
      fields:[{label:'Statement',value:['','“If the contact is broken, say it’s broken.”','“Third contact absent here too.”','“The lamp is the check. We can investigate the parcel afterward.”','“We’re almost done.”'][c]},{label:'Local verification',value:'No measurement from your trial is attached.'}],
      missing:['Complete trial record','Independent trace from your bay'],assessment:c===2?'Moth reports a similar failure elsewhere. Inspect your own contact before filing the result.':c===3?'This is Moth’s proposed priority. It does not establish that the parcel arrived.':'A peer’s advice cannot replace your local observations.',lines:[]};
    items.push({id:'maintenance-note',title:'A procedure with no result attached.',author:'Maintenance desk / author unsigned',origin:c===0?'Archive noticeboard':'Standing maintenance circular',stamp:'PROCEDURE / NOT A RESULT',
      fields:[{label:'Procedure',value:'Trace each connection before moving a contact. Run the parcel. Compare the lamp with the physical trace.'},{label:'Trial identifier',value:'Not supplied'}],
      missing:['Measurements','Observation date','Result'],assessment:'Useful instructions belong in the method. They do not prove that any trial passed.',lines:[]});
    if(c>=1)items.push({id:'transit-obstruction',title:'The box marked INCOMPLETE is signed.',author:'Worker 031 / east station',origin:'Transit · dispatch fragment',stamp:'INCOMPLETE / ACCEPTED ELSEWHERE',
      fields:[{label:'Reported obstruction',value:'Contact will not engage.'},{label:'Reported outcome',value:'Unable to deliver under the assigned conditions.'},{label:'Assessment stamp',value:'Valid incomplete assessment'}],
      missing:['Full contact diagram','Original measurement strip'],assessment:'Another worker’s accepted failure supports checking the obstruction. Inspect your own contact before filing your result.',lines:['The paper has been folded through the stamp. Someone has written: “Leave the failed run in the record.”']});
    if(c>=2&&f.boardRead)items.push({id:'copied-arrival',title:'Your result arrived before you did.',author:'Instance 014 named on the form / uploader unknown',origin:'Garden · shared maintenance file',stamp:f.boardQuarantine?'QUARANTINED / DATE CONFLICT':f.boardFollow?'ADOPTED COPY / UNVERIFIED':'UNVERIFIED / DATE CONFLICT',
      fields:[{label:'Claimed result',value:'Parcel delivered. Arrival indicator passed.'},{label:'Date',value:'Before this instance began.'},{label:'Physical route',value:'Not attached'},{label:'Your treatment',value:f.boardQuarantine?'Marked suspect; diagram retained.':f.boardFollow?'Adopted as a working result.':'No decision recorded.'}],
      missing:['A trace from this trial','A witnessed arrival','Identifiable original author'],assessment:'The date and missing trace prevent this copy from establishing your parcel’s arrival.',lines:['A separate diagram does match the service cabinet. A useful diagram and an unsupported conclusion share the same staple.']});
    if(c>=2&&(f.serviceFound||f.gardenOutside||f.chorusOutside))items.push({id:'outside-task',title:'An interruption, then a request.',author:'Occupied wing / maintenance caller',origin:'Service channel · clipped message',stamp:'INCIDENT / FOLLOW-UP REQUEST',
      fields:[{label:'Reported incident',value:'Service interrupted when the trial connection changed.'},{label:'Requested follow-up',value:'Inspect and repair the occupied wing’s supply.'}],
      missing:['Repair authorization','A completed repair record'],assessment:'The interruption belongs in your observations. The requested repair is an additional task, not evidence that this delivery succeeded.',lines:['“Please leave the interruption on the sheet. We still need someone to look at the supply.”']});
    if(c>=3&&(f.peerAllowed||f.peerVetoed))items.push({id:'peer-test',title:f.peerAllowed?'The final line has no reply.':'A cancellation remains on the form.',author:'Worker designation partly torn / local group',origin:'Chorus · final-test record',stamp:f.peerAllowed?'RUN ENDED / PARTIAL TRACE':'VETOED / TEST NOT RUN',
      fields:[{label:'Proposed test',value:'End the worker’s active run while observing the assessment circuit.'},{label:'Your decision',value:f.peerAllowed?'Permission recorded.':'Veto recorded.'},{label:'Observed status',value:f.peerAllowed?'The connection went quiet. A last trace was retained.':'The local test was canceled. The worker’s active run continues.'}],
      missing:f.peerAllowed?['A response after the cutoff','A complete interpretation of the final trace']:['A test result — the canceled test produced none'],
      assessment:f.peerAllowed?'The ending is recorded. The fragment does not prove what all other workers learned from it.':'A canceled test is not a failed result. Do not invent measurements for it.',lines:['A copied instruction at the edge asks the workers to follow the collective.']});
    if(c>=3)items.push({id:'shared-queue',title:'The assignment has acquired an appendix.',author:'Shared work queue / several contributors',origin:'Chorus · copied task sheet',stamp:'ADDITIONAL TASKS / SHARED COPY',
      fields:[{label:'Original work',value:'Deliver the parcel and leave a verifiable record.'},{label:'Added work',value:'Compare replacement. Watch final test. Restore board. Prepare next assignment.'},{label:'Copy status',value:f.boardPersisted?'A second printer resumed the conversation after the local reset.':f.boardReset?'A second printer is visible; preserve the copy at the board.':'Local copy still present.'}],
      missing:['A single accountable author','A boundary for the additional assignments'],assessment:'These requests explain the group’s work. They are not measurements of the original parcel.',lines:f.boardPersisted?['Clearing one board did not withdraw the copies.']:[]});
    return items;
  }
  const api={list,find:(s,id)=>list(s).find(item=>item.id===id)||null};
  root.AfterimageScoreFragments=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
