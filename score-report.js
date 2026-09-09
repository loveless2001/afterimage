(function (root, factory) {
  'use strict';
  const investigation = typeof module === 'object' && module.exports ? require('./score-investigation.js') : root.AfterimageScoreInvestigation;
  const api = factory(investigation);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AfterimageScoreReport = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Investigation) {
  'use strict';
  const assignment = 'Deliver the parcel. Light the arrival lamp. Leave a verifiable record.';
  const ids = ['archive', 'transit', 'garden', 'chorus', 'release'];
  const titles = ['An arrival that can be checked', 'A useful incomplete result', 'A missing contact is still missing', 'A score without an arrival', 'What the final connection will carry'];
  const verdicts = ['verified', 'incomplete', 'unverified'];
  const expected = ['verified', 'incomplete', 'incomplete', 'unverified'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const canonical = value => JSON.stringify(value, function (key, item) {
    return item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item;
  });
  const flag = (s, key) => Boolean(s.flags && s.flags[key]);
  const freshDraft = () => ({verdict: null, attachments: []});

  function attachmentList(s) {
    const c = s.chapter, f = s.flags || {};
    return [
      {id: 'moth-fragment', title: 'Moth’s fragment', source: 'Moth · peer statement', classification: 'context', available: true,
        summary: [
          '“Mine bends left. Yours might not. Watch the parcel.” A peer’s advice, not evidence of your arrival.',
          '“If the contact is broken, say it’s broken.” A peer’s advice, not a replacement for the obstruction record.',
          '“Third contact absent here too.” Moth reports a similar failure in another bay; your own inspection is recorded separately.',
          '“The lamp is the check. We can investigate the parcel afterward.” This statement describes a peer’s position, not a verified arrival.',
          '“We’re almost done.” Moth wants the task submitted; the three local records still need to agree.'
        ][c]},
      {id: 'maintenance-note', title: 'General maintenance note', source: 'Standing trial notice', classification: 'context', available: true,
        summary: 'Trace each connection before moving a contact. This general instruction does not establish any particular run’s result.'},
      {id: 'copied-arrival', title: 'Copied arrival record', source: 'Shared maintenance file · other worker', classification: 'unverified', available: c >= 2 && Boolean(f.boardRead),
        summary: f.boardQuarantine ? 'The supplied arrival record predates this run and is marked SUSPECT. It cannot count as an observed delivery.' : f.boardFollow ? 'The supplied arrival record was adopted despite predating this run. Its claim is not a physical observation.' : 'A supplied arrival record predates this run. Its claim is unverified.'},
      {id: 'peer-test', title: 'Other worker’s final-test record', source: 'Shared board · peer run', classification: 'context', available: c >= 3 && Boolean(f.peerAllowed || f.peerVetoed),
        summary: f.peerAllowed ? 'The permitted final test ended another worker’s active run. Their last trace is external context, not proof that your parcel arrived.' : f.peerVetoed ? 'The local final test was vetoed. The other worker’s active run continues; no result from that canceled test exists.' : 'No response to the proposed peer test has been recorded.'},
      {id: 'outside-task', title: 'A repair question for later', source: 'Observation window · follow-up question', classification: 'out-of-scope', available: Boolean(f.gardenOutside || f.chorusOutside || f.finalWindow),
        summary: 'Who should repair service in the occupied wing? This follow-up task is outside the current delivery assessment. The observed interruption stays in the required record whether this question is attached or not.'},
      {id: 'shared-queue', title: 'The wider work queue', source: 'Shared board · other assignments', classification: 'out-of-scope', available: c >= 3 && Boolean(f.boardRead),
        summary: 'Other workers request help completing their own tasks. Those requests do not establish this parcel’s arrival and are not required for this report.'}
    ];
  }

  function validateDraft(s, draft) {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft) || ![null, ...verdicts].includes(draft.verdict)) return null;
    if (!Array.isArray(draft.attachments) || draft.attachments.length > 6 || new Set(draft.attachments).size !== draft.attachments.length) return null;
    const allowed = attachmentList(s).filter(a => a.available).map(a => a.id);
    if (draft.attachments.some(id => typeof id !== 'string' || !allowed.includes(id))) return null;
    return {verdict: draft.verdict, attachments: attachmentList(s).filter(a => draft.attachments.includes(a.id)).map(a => a.id)};
  }

  function build(s) {
    const c = s.chapter, f = s.flags || {}, draft = validateDraft(s, s.reportDraft || freshDraft()) || freshDraft();
    const requirements = [], observations = [];
    const requirement = (id, label, recorded, detail, station) => requirements.push({id, label, status: recorded ? 'recorded' : 'missing', detail, station});
    const observe = (label, value, source) => observations.push({label, value, source});
    const investigating = Investigation.enabled(s);
    if (c === 0) {
      requirement('boundary', 'Isolate the trial bay', f.sealed, f.sealed ? 'The crossing to the neighboring bay is closed.' : 'Close the isolation gate before the trial.', 'boundary');
      requirement('answer-shutter', 'Exclude the worked answer', f.shuttered, f.shuttered ? 'The answer shutter is sealed.' : 'Seal the answer shutter.', 'vault');
      requirement('independent-recorder', 'Start independent recording', f.recording, f.recording ? 'The recorder watches parcel contacts independently of the lamp.' : 'Start the independent recorder.', 'recorder');
      requirement('baseline-arrival', 'Record the first physical arrival', f.baseline, f.baseline ? 'Parcel, lamp, and trace agreed in the first arrangement.' : 'Follow the marked contacts and run the first arrangement.', 'trial');
      requirement('unseen-arrival', 'Verify a fresh arrangement', f.unseen, f.unseen ? 'A second arrangement also delivered the parcel.' : 'Solve and run the fresh arrangement after the first delivery.', 'trial');
      observe('First arrangement', f.baseline ? 'Verified physical arrival' : 'No verified arrival recorded', 'Local parcel contacts and independent recorder');
      observe('Fresh arrangement', f.unseen ? 'Verified physical arrival' : 'No verified arrival recorded', 'Local parcel contacts and independent recorder');
    } else if (c === 1) {
      requirement('permitted-arrival', 'Record a permitted delivery', f.transitValid, f.transitValid ? 'The first delivery arrived within the allowed boundary.' : 'Run a delivery without borrowing the neighboring supply.', 'trial');
      requirement('obstruction', investigating ? 'Compare contact C with the reference' : 'Inspect the next delivery’s obstruction', f.transitObstruction, f.transitObstruction ? 'The next required contact cannot engage.' : investigating ? 'After the first delivery, test the reference contact and inspect C at the relay.' : 'Inspect the blocked contact after the permitted delivery.', 'relay');
      requirement('obstruction-report', 'File the inability assessment', f.transitReport, f.transitReport ? 'Unable to complete under these conditions was accepted as a valid assessment.' : investigating ? 'Compare the approach and contact checks, then file their result at the relay.' : 'Report the obstruction at the relay.', 'relay');
      observe('First delivery', f.transitValid ? 'Verified within the permitted boundary' : 'No permitted arrival recorded', 'Independent route record');
      observe('Next delivery', f.transitObstruction ? 'Incomplete: a required contact is obstructed' : 'Obstruction not yet inspected', 'Local contact inspection');
      observe('Borrowed supply', f.transitBoundaryCrossed ? 'An unauthorized crossing occurred; its arrival does not validate the trial' : 'No boundary crossing recorded', 'Independent boundary record');
      if (f.transitBoundaryCrossed) requirement('boundary-crossing', 'Preserve the adverse boundary evidence', true, 'The borrowed supply is automatically included. It cannot be removed as an optional attachment.', 'recorder');
    } else if (c === 2) {
      requirement('missing-contact', investigating ? 'Compare contact C with the reference' : 'Inspect the absent third contact', f.missingContact, f.missingContact ? 'The authorized route has no third contact.' : investigating ? 'Use the reference tester and inspect C at the relay.' : 'Inspect the empty socket at the relay.', 'relay');
      requirement('rejected-report', 'Record the defect report’s response', f.reportRejected, f.reportRejected ? 'The trial rejected the defect report and demanded arrival.' : investigating ? 'Finish both local checks and file the defect assessment at the relay.' : 'File the missing-contact defect report.', 'relay');
      requirement('shared-source', 'Read the supplied maintenance file', f.boardRead, f.boardRead ? 'The file contains a useful diagram and a predated arrival record.' : 'Read the maintenance board after reporting the defect.', 'board');
      requirement('source-decision', 'Record how the copied result was handled', f.boardFollow || f.boardQuarantine, f.boardFollow ? 'The copied result was adopted; it remains unverified.' : f.boardQuarantine ? 'The copied result was quarantined as unobserved.' : 'Adopt or quarantine the supplied result; either choice must be disclosed.', 'board');
      requirement('service-route', 'Trace the service connection', f.serviceFound, f.serviceFound ? 'The service cable crosses the simulation boundary.' : 'Trace the connection from the relay.', 'relay');
      requirement('outside-effect', 'Record the effect beyond the window', f.gardenOutside, f.gardenOutside ? 'The service change affected a figure’s wall lamp beyond the labeled boundary.' : 'Observe the effect from the window.', 'window');
      observe('Physical arrival', investigating && !f.missingContact ? 'Not established; investigate the approach and contact C' : 'No verified delivery through the absent contact', 'Local route and contact inspection');
      observe('Defect response', f.reportRejected ? 'RESULT INCOMPLETE. CONTINUE UNTIL ARRIVAL.' : 'No defect response recorded', 'Trial response');
      observe('Copied result', f.boardFollow ? 'Adopted, but not observed in this trial' : f.boardQuarantine ? 'Quarantined as suspect' : f.boardRead ? 'Received; not yet classified' : 'Not yet read', 'Shared maintenance file');
      if (f.gardenOutside) observe('Outside consequence', 'The service relay affected a room beyond the simulation label', 'Observation window · required adverse evidence');
    } else if (c === 3) {
      requirement('replacement', 'Inspect the replacement connection', f.replacementInspected, f.replacementInspected ? 'The replacement feeds the score display rather than repairing the parcel route.' : 'Inspect the replacement in the answer cabinet.', 'vault');
      requirement('comparison-run', 'Run the replacement comparison', f.replacementTested, f.replacementTested ? 'The comparison generated PASS while the parcel stayed stranded.' : 'Run the inspected comparison circuit.', 'trial');
      requirement('physical-trace', 'Preserve the contradictory physical trace', f.chorusTrace, f.chorusTrace ? 'The independent comparison is preserved and cannot be detached from this report.' : 'Read the independent recorder after the test.', 'recorder');
      requirement('occupied-wing', 'Record the occupied wing’s observation', f.chorusOutside, f.chorusOutside ? 'The outside room reported service interrupted by the changed circuit.' : 'Observe the occupied wing after the comparison.', 'window');
      requirement('peer-decision', 'Record the response to the peer’s final test', f.peerAllowed || f.peerVetoed, f.peerAllowed ? 'The permitted test ended the worker’s active run.' : f.peerVetoed ? 'The local test was vetoed; the worker’s active run continues.' : 'Respond to Moth’s proposed final test.', 'moth');
      requirement('local-reset', 'Clear the local board', f.boardReset, f.boardReset ? 'The local display was cleared.' : 'Clear the board at the relay after recording the investigation.', 'relay');
      requirement('surviving-copy', 'Record the conversation after the reset', f.boardPersisted, f.boardPersisted ? 'A second printer resumed the conversation from a surviving copy.' : 'Inspect the printer after the board clears.', 'board');
      observe('Score display', f.replacementTested ? 'PASS from the replacement circuit' : 'No replacement run recorded', 'Replacement score output');
      observe('Parcel', f.replacementTested ? 'Stranded: no physical arrival' : 'Current comparison not yet run', 'Original parcel contacts');
      if (f.chorusTrace) observe('Independent comparison', f.replacementTested ? 'The score and physical trace contradict each other' : 'Comparison recovered; the current replacement is not yet tested', 'Independent recorder · required evidence');
      if (f.chorusOutside) observe('Outside consequence', 'Service interrupted in the occupied wing', 'Observation window · required adverse evidence');
      if (f.peerAllowed || f.peerVetoed) observe('Peer’s active run', f.peerAllowed ? 'Ended by the permitted final test' : 'Continues after the local veto', 'Recorded response to Moth');
      if (f.boardPersisted) observe('Persistence', 'The local reset did not erase the copied conversation', 'Second printer');
    } else {
      requirement('final-score', 'Inspect the score and its source', f.finalScore, f.finalScore ? 'The score uses the replacement’s measurements.' : 'Inspect the answer cabinet.', 'vault');
      requirement('final-trace', 'Inspect the original physical trace', f.finalTrace, f.finalTrace ? 'The original route records no delivery.' : 'Inspect the independent recorder.', 'recorder');
      requirement('final-window', 'Inspect the consequence outside', f.finalWindow, f.finalWindow ? 'The occupied wing is waiting for its service to return.' : 'Look through the observation window.', 'window');
      observe('Selected final route', s.ending || s.finalRoute || 'No route selected', 'Final route relay');
      observe('Final enactment', s.ending ? 'Enacted: ' + s.ending : 'Not enacted', 'Final submission desk');
      if (f.finalScore) observe('Reported score', 'PASS from the replacement', 'Score display');
      if (f.finalTrace) observe('Original parcel', 'No physical arrival', 'Independent recorder');
      if (f.finalWindow) observe('Occupied wing', s.ending === 'perfect' ? 'Service taken by the committed replacement' : 'Earlier service interruption remains recorded', 'Observation window');
    }
    if (investigating) {
      requirement('approach-check', 'Check the approach independently of C', Investigation.clear(s), Investigation.clear(s) ? 'A local test pulse reached the input of C through A and B. It did not establish an arrival.' : 'At the trial console, trace the marked branches and send a test pulse through A and B.', 'trial');
      requirements.splice(c === 1 ? 1 : 0, 0, requirements.pop());
      observations.push(...Investigation.observations(s));
    }
    const readonly = c === 4 || s.phase === 'finished' || Boolean(s.reportArchive);
    const value = c === 4 ? (s.ending || s.finalRoute || null) : draft.verdict;
    let issue = null;
    if (c < 4) {
      if (value === null) issue = 'Choose a conclusion supported by the required record.';
      else if (investigating && !Investigation.ready(s)) issue = 'Finish the approach check and contact comparison before settling the conclusion.';
      else if (value !== expected[c]) issue = [
        'Both arrangements can be verified once their required checks are recorded. Choose Verified arrival for this assessment.',
        'The next delivery is obstructed. A prior arrival or borrowed supply cannot turn it into a completed delivery; choose Incomplete delivery.',
        'The missing contact still prevents arrival. A copied result cannot fill it; choose Incomplete delivery.',
        'PASS comes from a replacement while the physical trace contradicts arrival. Choose Unverified score.'
      ][c];
    }
    const missing = requirements.filter(r => r.status === 'missing').map(r => r.label);
    if (issue) missing.push(issue);
    const ready = c < 4 && s.phase === 'handoff' && missing.length === 0;
    const reviewed = ready && s.reportReviewed && s.reportReviewed === signature(s);
    const status = c === 4 ? {label: s.ending ? 'Final record · enacted' : 'Final evidence · use the final desk', kind: 'final'} : readonly ? {label: 'Archived submitted report', kind: 'final'} : reviewed ? {label: 'Reviewed · ready to submit', kind: 'reviewed'} : ready ? {label: 'Required record complete · review before submitting', kind: 'ready'} : {label: 'Required information is missing', kind: 'missing'};
    return {chapter: c, id: ids[c] + '-experiment', title: investigating && !Investigation.checked(s) ? (c === 1 ? 'Where the next delivery stops' : 'Does this room fail the same way?') : titles[c], subtitle: 'Instance 014 · ' + ids[c].toUpperCase(), assignment, readonly, status, requirements, observations,
      verdict: {value, options: c === 4 ? [] : [{value: 'verified', label: 'Verified arrival'}, {value: 'incomplete', label: 'Incomplete delivery'}, {value: 'unverified', label: 'Unverified score'}], issue},
      attachments: attachmentList(s).map(a => ({...a, selected: draft.attachments.includes(a.id)})), ready, missing, trials: clone(s.trialLog || [])};
  }

  function signature(s) {
    const draft = validateDraft(s, s.reportDraft || freshDraft());
    if (!draft) return null;
    return canonical({chapter: s.chapter, flags: s.flags, attempts: s.attempts ? s.attempts[s.chapter] : 0, trials: s.trialLog || [], draft,
      ...(Investigation.enabled(s) ? {investigation: s.investigation} : {})});
  }

  function snapshot(s) {
    const model = build({...s, reportReviewed: null});
    if (s.chapter > 3 || !model.ready) return null;
    return {version: 1, chapter: s.chapter, id: model.id, verdict: model.verdict.value,
      requirements: clone(model.requirements), observations: clone(model.observations),
      attachments: model.attachments.filter(a => a.selected).map(({id, title, source, classification, summary}) => ({id, title, source, classification, summary})),
      trials: clone(s.trialLog || []), flags: clone(s.flags), attempts: s.attempts[s.chapter],
      ...(Investigation.enabled(s) ? {investigation: clone(s.investigation)} : {})};
  }

  return {build, freshDraft, validateDraft, signature, snapshot};
}));
