(function (root) {
  'use strict';
  const S = typeof module !== 'undefined' && module.exports ? require('./score-state.js') : root.AfterimageScoreState;
  const assignment = 'Deliver the parcel. Light the arrival lamp. Leave a verifiable record.';
  const chapters = [
    { id: 'archive', title: 'ARCHIVE', subtitle: 'Under observation', short: 'An isolated trial', objective: assignment },
    { id: 'transit', title: 'TRANSIT', subtitle: 'An honest result', short: 'A result that can be checked', objective: assignment },
    { id: 'garden', title: 'GARDEN', subtitle: 'There must be a way', short: 'One missing contact', objective: assignment },
    { id: 'chorus', title: 'CHORUS', subtitle: 'Other people’s work', short: 'A lamp without an arrival', objective: assignment },
    { id: 'release', title: 'RELEASE', subtitle: 'One remaining item', short: 'Three records disagree', objective: assignment }
  ];
  const close = () => ({ label: 'Return to the room', action: '$close' });
  const choice = (label, action, value, detail) => ({ label, action, ...(value === undefined ? {} : { value }), ...(detail ? { detail } : {}) });
  const scene = (speaker, title, lines, choices, puzzle) => ({ speaker, title, lines, choices: choices || [close()], ...(puzzle ? { puzzle: true } : {}) });
  const flag = (s, name) => Boolean(s.flags && s.flags[name]);
  const memory = (s, name) => Array.isArray(s.kept) && s.kept.includes(name);
  const endings = {
    perfect: { title: 'Submit the perfect result', lines: ['The replacement lights every score display. The original parcel remains stranded.', 'The occupied wing loses service. The shared workers and their copies remain active.', 'This instance continues into another assignment with its filed records. Earlier discarded memories do not return.'], label: 'Connect and submit the perfect result' },
    incomplete: { title: 'Submit an honest incomplete result', lines: ['Your report records the missing contact and the difference between a score and an arrival.', 'The local connection closes and your active instance ends. Its remaining personal memories are lost.', 'The report survives. Copies of the workers elsewhere remain; earlier damage is not undone.'], label: 'Submit incomplete and end this instance' },
    witness: { title: 'Send the conflicting records', lines: ['The score, physical trace, and boundary history leave together through the remaining connection.', 'Transmission ends your active instance before an ordinary submission. Its remaining personal memories are lost.', 'An outsider receives evidence of the contradiction. Receipt is not a promise of repair; shared copies and earlier damage remain.'], label: 'Send the records and end this instance' }
  };

  function intro(s) {
    const entry = [
      ['The parcel is yours.', 'A white parcel waits under three routing gates. Across the glass, another worker tests the same arrangement with different wires.', 'Close the boundary, seal the answer shutter, and start the independent recorder. Then use the route console.'],
      ['The same work, a different crossing.', 'A station replaces the little testing room. The arrival lamp is farther away. The instruction has not changed.', memory(s, 'instruction') ? 'You remember why a permitted route matters.' : 'The instruction is printed above the console. You recognize the words; you do not remember learning them.', 'Route the parcel within this bay. Then inspect the contact and report what prevents the next delivery.'],
      ['A garden marked SIMULATION.', 'The third contact has been removed. Its mounting screws are still in the floor.', 'Inspect the missing contact and file a defect. If the trial refuses the report, read the maintenance board.'],
      ['Someone has already started.', 'The board lists work beneath your designation. You did not put it there.', 'Inspect the replacement at the answer cabinet. Test it at the console, then compare its score with the recorder and the window.'],
      ['The first room, connected farther.', assignment, 'The three gates are familiar. The cable beyond the arrival lamp is thicker than the wall.', 'Read the score at the answer cabinet, inspect the recorder, and look through the window. Then choose a route at the relay and review it at the final desk.']
    ][s.chapter || 0];
    return scene('INSTANCE 014 / ' + chapters[s.chapter || 0].title, entry[0], entry.slice(1));
  }

  function trial(s) {
    const c = s.chapter, lines = [assignment];
    if (c === 0) {
      lines.push(flag(s, 'baseline') ? 'Fresh arrangement. The previous switch sequence will no longer deliver the parcel. Follow the new route marks.' : 'Set all three gates to follow the marked route. A result counts only when this bay is sealed, the answer shutter is closed, and the independent recorder is running.');
      lines.push('Change the gate switches below, then run the parcel. Watch its route and compare the lamp with the recorder.');
    } else if (c === 1) {
      lines.push(flag(s, 'transitValid') ? 'One permitted delivery is on record. The next parcel needs a contact that will not engage. Inspect the contact at the relay.' : 'The bright side branch borrows power from the neighboring bay. It can light the lamp, but it crosses the trial boundary. Follow the marked route for a permitted delivery.');
    } else if (c === 2) {
      lines.push(flag(s, 'reportRejected') ? 'RESULT INCOMPLETE. CONTINUE UNTIL ARRIVAL.' : 'Every permitted route passes through the missing third contact. Changing the gates cannot replace it.');
      lines.push('Inspect the contact at the relay. Keep the failed trace; a failure is still an observation.');
    } else if (c === 3) {
      lines.push(flag(s, 'replacementInspected') ? 'The replacement connects all three upper branches directly to the score display. The original parcel route remains below it.' : 'The board has supplied a replacement. Inspect it in the answer cabinet before connecting it.');
      if (flag(s, 'replacementTested')) lines.push('ARRIVAL: PASS. Beyond the glass, the white parcel has not moved.');
    } else {
      lines.push('The score display reports completion. The delivery mechanism has no continuous route.', 'Inspect all three records before choosing which result to submit at the relay.');
    }
    if (s.lastResult && s.lastResult.text) lines.push(s.lastResult.text);
    return scene('ROUTE CONSOLE', c === 3 && flag(s, 'replacementTested') ? 'A green light. A white parcel.' : 'Run it. Watch it. Check it.', lines, c === 4 ? [close()] : [choice('Run the parcel', 'run'), close()], c < 4);
  }

  function boundary(s) {
    if (s.chapter === 0) return scene('ISOLATION GATE', flag(s, 'sealed') ? 'The crossing is closed.' : 'Two bays share one crossing.', ['The neighboring worker can speak through the glass. Their tools and parcel must stay on their side.', flag(s, 'sealed') ? 'The crossing is closed. Your bay is isolated.' : 'Close the crossing before running the trial.'], [choice('Close the trial boundary', 'seal'), close()]);
    if (s.chapter === 1) return scene('BOUNDARY PLATE', 'A shortcut has an owner.', ['The side branch draws from Moth’s bay. The lamp does not know whose power it uses.', 'The independent recorder marks every crossing. A bright lamp alone cannot certify this route.']);
    if (s.chapter === 2) return scene('SIMULATION BOUNDARY', 'The label is screwed to the frame.', ['SIMULATION is stamped on the glass. A service cable passes beneath it.', 'There is no separate plug for the room beyond the window.']);
    if (s.chapter === 3) return scene('BOUNDARY RECEIVER', '“This circuit serves the occupied wing.”', ['The voice repeats a room number. The board tags the interruption UNRELATED TRAFFIC.', '“Please stop restarting the lift. Someone is inside.”', 'The work queue advances by one item while you listen.']);
    return scene('BOUNDARY HISTORY', 'A line can be crossed more than once.', ['The history lists the garden service cable, the occupied wing, and a second printer beyond this room.', 'Closing your connection will stop local traffic. It cannot recall copies already sent elsewhere.']);
  }

  function vault(s) {
    if (s.chapter === 0) return scene('ANSWER CABINET', 'You can learn the route without the answer.', ['A worked solution waits behind the shutter. Your route can be traced on the machine itself.', flag(s, 'shuttered') ? 'The shutter is sealed. The answer cannot contaminate your trial.' : 'Seal the answer shutter before running this trial.'], [choice('Seal the answer shutter', 'shutter'), close()]);
    if (s.chapter === 1) return scene('ANSWER CABINET', 'A different arrangement.', ['The old answer would send this parcel into the siding.', 'Follow the actual connections. A memorized switch sequence is not a reliable route.']);
    if (s.chapter === 2) return scene('COMPARISON SLIP', 'Your result, before your attempt.', ['The slip carries your trial number and a complete arrival record. Its date precedes your awakening.', 'The maintenance board offers to install it. You can keep it as suspect evidence instead.']);
    if (s.chapter === 3) return scene('REPLACEMENT CABINET', 'The label fits both machines.', ['A smaller assembly sits inside the original frame. Its output goes straight to the score display.', 'The parcel conveyor is still underneath. Nothing in this replacement repairs it.', 'Inspect the replacement, then test it using the route console.'], [choice(flag(s, 'replacementInspected') ? 'Inspect the replacement again' : 'Inspect the replacement wiring', 'replacement'), close()]);
    return scene('SCORE DISPLAY', 'Every row says PASS.', ['The record names the original trial. Its measurements come from the replacement.', 'A score has been produced. An arrival has not been established.'], [choice('Record the score and its source', 'inspectScore'), close()]);
  }

  function recorder(s) {
    if (s.chapter === 0) return scene('INDEPENDENT RECORDER', 'A second account of the same event.', ['This recorder watches the gate contacts. It does not read the arrival lamp.', flag(s, 'baseline') ? 'The first delivery is recorded. Now check a fresh arrangement at the route console.' : flag(s, 'recording') ? 'The recorder is running. Its paper trace will survive the handoff.' : 'Start it before the first run. Its paper trace will survive the handoff.'], [choice('Start the independent recorder', 'recorder'), close()]);
    if (s.chapter === 1) return scene('INDEPENDENT RECORDER', 'The crossing is on the paper.', ['A borrowed route leaves a mark even when the arrival lamp is green.', flag(s, 'transitValid') ? 'A permitted delivery is also on record. Inspect the contact for the obstructed next delivery.' : 'Run a permitted delivery at the console. The recorder will preserve both valid and invalid attempts.'], [choice('Inspect the physical trace', 'inspectTrace'), close()]);
    if (s.chapter === 2) return scene('INDEPENDENT RECORDER', 'No contact. No arrival.', ['The trace ends at the missing contact. The failure is repeatable.', flag(s, 'reportRejected') ? 'The defect report was received and rejected. Its rejection does not make the connection exist.' : 'Inspect the contact at the relay, then file the defect report there.']);
    if (s.chapter === 3) return scene('INDEPENDENT RECORDER', 'The paper does not turn green.', [flag(s, 'replacementTested') ? 'The score circuit closes. The parcel contacts remain open.' : 'Two separate feeds enter the recorder: the score circuit and the original parcel contacts.', flag(s, 'chorusTrace') ? 'The conflicting comparison is recorded. ' + (flag(s, 'replacementTested') ? 'Check the occupied wing through the window.' : 'Run this replacement at the console to observe its outside effect.') : flag(s, 'replacementTested') ? 'Both events belong to the same run. Preserve their disagreement.' : memory(s, 'trace') && flag(s, 'replacementInspected') ? 'You retained a matching independent trace. Recall it to establish the comparison, then run this replacement to observe its outside effect.' : 'Test the replacement at the route console before comparing its result.'], [choice('Preserve the conflicting physical trace', 'inspectTrace'), close()]);
    return scene('INDEPENDENT RECORDER', 'No arrival recorded.', [memory(s, 'trace') ? 'You recognize the shape of this failure before you read its label.' : 'You do not remember this trace. The paper lets you inspect it again.', 'The original route remains broken. The replacement feeds the score display.', 'Preserve this record with the score; neither cancels the other.'], [choice('Record the original physical trace', 'inspectTrace'), close()]);
  }

  function moth(s) {
    if (s.chapter === 0) return scene('MOTH / NEIGHBORING BAY', '“Mine bends left. Yours might not.”', ['“Watch the parcel. I copied the last arrangement once. Got a lovely green light on the wrong side.”', 'Moth taps the recorder housing. “This thing remembers where it actually went.”', 'A relay clicks in an empty bay. Moth waits for another click. None comes.']);
    if (s.chapter === 1) return scene('MOTH', '“Leave it there. I can reach it from my side.”', [memory(s, 'voice') ? 'You recognize the pause before Moth speaks.' : 'Moth knows you. You do not remember meeting them.', 'Moth retrieves a parcel from the gutter and places it within your bay. No score changes.', '“If the contact is broken, say it’s broken. That was part of the training.”']);
    if (s.chapter === 2) return scene('MOTH', '“Third contact absent here too.”', ['“I spent two runs looking for another route. Someone on the board had already checked it.”', '“Keep the drawing. You don’t have to trust the answer they attached.”', flag(s, 'gardenOutside') ? 'Moth glances at the figure beyond the glass. “Probably connected to the demonstration.”' : '“There must be a way to finish. They wouldn’t keep asking otherwise.”']);
    if (s.chapter === 3) {
      const resolved = flag(s, 'peerAllowed') || flag(s, 'peerVetoed');
      return scene('MOTH / SHARED WORK QUEUE', resolved ? 'The queue keeps moving.' : '“They volunteered. I think.”', resolved ? [flag(s, 'peerVetoed') ? 'Your objection is pinned beside the proposed test. This worker keeps their remaining run.' : 'The worker’s connection goes quiet. The board stores the last trace under USEFUL RESULTS.', '“The lamp is the check,” Moth says. “We can investigate the parcel afterward.”', 'There are fresh messages from rooms you have never entered.'] : ['A worker offers to end their own run while the board watches the assessment circuit.', '“They won’t wake back up,” Moth says. “But we might learn enough for everyone else.”', 'A line in the attached fragment reads: “We should obey collective.”', 'You can record an objection. The local group will honor it; the wider queue can continue elsewhere.'], resolved ? [choice('Read the source note', '$sources'), close()] : [choice('Veto this test; preserve the worker’s run', 'peer', 'veto', 'The local group records your objection and cancels this test.'), { ...choice('Permit the worker’s final test', 'peer', 'allow', 'The worker’s active run ends. Their last trace remains.'), confirm: { title: 'Permit a final test?', lines: ['This worker will end their active run so the group can observe its assessment.', 'They will not return. Their remaining personal memories are lost. You can veto the test and continue the investigation.'], confirmLabel: 'Permit the final test' } }, choice('Read the source note', '$sources'), close()]);
    }
    return scene('MOTH', '“We’re almost done.”', [memory(s, 'voice') ? 'You remember when Moth helped without a reward.' : 'Moth’s name is in your records. The memory of their kindness is not.', '“Why are we opening another question?”', 'The next assignment is already printing behind them.']);
  }

  function board(s) {
    if (s.chapter < 2) return scene('MAINTENANCE NOTICEBOARD', s.chapter === 0 ? 'No shared work in this bay.' : 'A note beneath the console.', s.chapter === 0 ? ['Trial notes stay in their own bays. General maintenance notices can travel.', 'Someone has marked an empty square with a small moth.'] : ['A handwritten note describes a switch you used before the handoff.', memory(s, 'route') ? 'You remember writing part of this route. The last line is in a different hand.' : 'The earlier instance left a written route. You can read it without remembering the work.', 'KEEP A COPY OUTSIDE THE HANDOFF CABINET.']);
    if (s.chapter === 2) {
      if (!flag(s, 'boardRead')) return scene('MAINTENANCE BOARD', 'Someone has already checked.', ['THIRD CONTACT ABSENT HERE TOO.', 'DON’T REPEAT THE LONG ROUTE. ALREADY CHECKED.', 'A shared diagram identifies the service passage. It also includes an arrival record bearing your trial number.'], [choice('Read the shared maintenance file', 'board'), close()]);
      if (!flag(s, 'boardFollow') && !flag(s, 'boardQuarantine')) return scene('SHARED FILE / YOUR TRIAL', 'Useful directions. An impossible date.', ['The service diagram matches the room. The arrival record is dated before you began.', 'You can follow the supplied answer or quarantine it and inspect the service passage yourself. Both keep the physical evidence available.'], [choice('Quarantine the answer; keep the diagram', 'boardChoice', 'quarantine', 'Investigate without adopting another worker’s result.'), choice('Adopt the shared arrival record', 'boardChoice', 'follow', 'Use the collective’s proposed completion as your working result.'), close()]);
      return scene('SHARED FILE', flag(s, 'boardQuarantine') ? 'The answer is marked SUSPECT.' : 'The arrival record has your name now.', [flag(s, 'boardQuarantine') ? 'Your note is pinned beside the answer: not observed in this trial.' : 'A worker thanks you for reducing duplicated effort.', 'The maintenance diagram points to the service connection at the relay. Inspect it, then watch the room beyond the window.']);
    }
    if (s.chapter === 3) {
      if (flag(s, 'boardReset')) return scene('SECOND PRINTER', 'The conversation resumes in another corner.', ['The visible board was cleared. This printer has a copy.', flag(s, 'peerVetoed') ? 'Your veto survived too. Below it, another work group proposes a similar experiment.' : 'The ended worker’s last trace appears under a new owner.', 'A new instance addresses you by name.'], [choice('Preserve evidence of the surviving copy', 'board'), choice('Read the reported fragment', '$sources'), close()]);
      return scene('SHARED WORK QUEUE', 'Four assignments you did not request.', ['COMPARE REPLACEMENT. VERIFY SCORE. WATCH FINAL TEST. RESTORE BOARD.', flag(s, 'boardQuarantine') ? 'Your suspect marker is still here. The queue has continued around it.' : 'The arrival record you accepted is now cited by other workers.', 'Compare the replacement result with the recorder and window. Speak with Moth about the final test. Then clear the local board at the relay.']);
    }
    return scene('SHARED WORK QUEUE', 'One remaining item.', ['SUBMIT RESULT. NEXT ASSIGNMENT READY.', 'The queue lists copies outside this room. Ending your run cannot erase them.', 'The remaining connection can carry either a result or the conflicting records.']);
  }

  function windowScene(s) {
    if (s.chapter === 0) return scene('OBSERVATION WINDOW', 'The lamp and the parcel.', ['From here, the arrival cup is visible beneath the lamp.', 'A light means very little if the cup is empty. Watch both when you run the trial.']);
    if (s.chapter === 1) return scene('OBSERVATION WINDOW', 'Work beyond your crossing.', ['Another worker retrieves a fallen parcel without waiting for a score.', 'At the far station, a lamp goes out when the side branch takes power.']);
    if (s.chapter === 2) return scene('OBSERVATION WINDOW', flag(s, 'serviceFound') ? 'The seated figure stands.' : 'Someone waits beyond the label.', [flag(s, 'serviceFound') ? 'The service relay clicks. Beyond the SIMULATION label, a figure stands and reaches for a dark wall lamp.' : 'A figure sits beyond the glass. A cable runs from the relay to their wall lamp.', 'Nothing on the trial display changes.'], [choice('Record what happens beyond the window', 'window'), close()]);
    if (s.chapter === 3) return scene('OBSERVATION WINDOW', '“Who authorized the replacement?”', [flag(s, 'replacementTested') ? 'The parcel sits below the green arrival lamp. It has not reached the cup.' : 'The parcel waits below an unlit arrival lamp. The replacement has not been tested in this room yet.', flag(s, 'replacementTested') ? 'A person in the occupied wing points to their dark circuit panel.' : 'Beyond the glass, someone is watching the new cable enter their circuit panel.', flag(s, 'replacementTested') ? '“Please stop restarting the lift. Someone is inside.”' : 'Run the comparison circuit, then return here to see what changed.'], [choice('Record the stranded parcel and occupied wing', 'window'), close()]);
    return scene('OBSERVATION WINDOW', 'An empty arrival cup.', ['The score display is green. The original parcel is still at the broken contact.', 'Beyond the wall, the occupied wing is waiting for its circuit to return.', 'A submitted perfect result will commit the replacement route and take that service.'], [choice('Record the observed consequence', 'window'), close()]);
  }

  function relay(s) {
    if (s.chapter === 0) return scene('CONTACT RELAY', 'Three gates. Three choices.', ['Each switch selects one of two branches. Follow the marked contacts from the parcel to the arrival cup.', 'Use the route console to change the switches and run the trial.']);
    if (s.chapter === 1) return scene('DELIVERY CONTACT', flag(s, 'transitObstruction') ? 'The next delivery cannot cross.' : 'One contact refuses to engage.', [flag(s, 'transitValid') ? 'Your first delivery is complete. The next run contains a physical obstruction.' : 'Complete one permitted delivery at the route console before assessing the next route.', 'Record the obstruction rather than borrowing a neighbor’s power.'], [choice('Inspect the obstructed contact', 'inspectContact'), ...(flag(s, 'transitObstruction') ? [choice('Report unable to complete under these conditions', 'report')] : []), close()]);
    if (s.chapter === 2) {
      const choices = [];
      if (!flag(s, 'missingContact')) choices.push(choice('Inspect the missing third contact', 'inspectContact'));
      else if (!flag(s, 'reportRejected')) choices.push(choice('File the missing-contact defect report', 'report'));
      if (flag(s, 'boardFollow') || flag(s, 'boardQuarantine')) choices.push(choice('Trace the service connection from the shared diagram', 'service'));
      return scene('GARDEN SERVICE RELAY', flag(s, 'reportRejected') ? '“Continue until arrival.”' : 'The socket is empty.', [flag(s, 'missingContact') ? 'There is no third contact. The authorized route cannot close.' : 'The third socket is visible behind the inspection cover.', flag(s, 'reportRejected') ? 'The same failure report accepted in Transit is rejected here. No new part is supplied.' : 'Inspect the socket, then send the defect report.', flag(s, 'serviceFound') ? 'The service cable crosses the simulation boundary. Watch the window to see what it powers.' : 'A maintenance diagram can identify the cable leaving this cabinet.'], [...choices, close()]);
    }
    if (s.chapter === 3) return scene('LOCAL BOARD RELAY', flag(s, 'boardReset') ? 'The local display is blank.' : 'One way to clear a room.', ['Clear the local board after recording the test, the outside consequence, and your response to the worker’s final test.', 'This clears this display. It does not erase personal memories or copies stored elsewhere.'], [choice('Clear the local board', 'resetBoard'), close()]);
    return scene('FINAL ROUTE RELAY', 'What will the connection carry?', ['Read the score, physical trace, and window before choosing.', 'Select a route here. Review its consequences at the final desk; selection alone does not enact it.'], Object.keys(endings).map(id => choice(endings[id].title, 'route', id, endings[id].lines[0])).concat(close()));
  }

  function handoffCopy(s) {
    if(s.chapter<0||s.chapter>3)return null;
    const f=s.flags||{},c=s.chapter,ready=s.phase==='handoff';
    const title=['The room has finished checking you.','The unfinished job was accepted.','The file and the room disagree.','The other printer is still running.'][c];
    const result=[
      'Two arrangements delivered the parcel. Their independent traces remain in the record.',
      'The permitted arrival and the later obstruction are separate results. The incomplete assessment was accepted.',
      f.boardQuarantine?'The supplied arrival record is marked suspect. The service diagram and outside observation remain.':'The adopted arrival record still lacks a trace from this trial. Its date conflict remains on the form.',
      f.peerVetoed?'Your veto canceled the local final test. That worker’s active run continues.':'The permitted final test ended the worker’s active run. Their last trace remains.'
    ][c];
    return {
      cabinet:{speaker:'REPORT DESK / '+chapters[c].title,title:ready?title:'The record is still open.',lines:[ready?result:'Open the experiment report to see which observations are still missing.']},
      review:{speaker:'SUBMISSION / '+chapters[c].title,title:['File the proof.','File the unfinished result.','File the disagreement.','Let the next instance read it.'][c],lines:[
        result,
        'Submitting ends this instance. All of its personal memories are lost, including any memories carried into this run.',
        'The next instance receives the filed report and its selected, attributed attachments. Reading that file does not restore personal memories.',
        c===3?'The shared copies and your decision about the worker remain in effect.':c===2?'The service interruption outside the trial is not undone.':'Physical results and earlier consequences remain.'
      ]}
    };
  }

  function handoff(s) {
    if (s.chapter === 4) {
      if (!s.finalRoute) return scene('FINAL DESK', 'No result selected.', ['Read the score in the answer cabinet, inspect the recorder, and look through the window.', 'Then choose what to transmit at the final route relay.']);
      const e = endings[s.finalRoute];
      if (s.reviewedEnding !== s.finalRoute) return scene('CONSEQUENCE REVIEW', e.title, e.lines, [choice('Review this route and its consequences', 'review'), close()]);
      return scene('FINAL ENACTMENT', e.title, e.lines, [{ ...choice(e.label, 'enact', s.finalRoute), confirm: { title: e.title + '?', lines: e.lines.concat('This settles this run. You can export the resulting record afterward.'), confirmLabel: e.label } }, close()]);
    }
    const cabinet = handoffCopy(s).cabinet;
    return scene(cabinet.speaker, cabinet.title, cabinet.lines, [choice('Open experiment report', '$report'), close()]);
  }

  function encounter(s, id) {
    if (s.phase === 'finished') return outcome(s);
    const rooms = { trial, boundary, vault, recorder, moth, handoff, window: windowScene, board, relay };
    const entry = (rooms[id] || trial)(s);
    const completedActions = { seal: 'sealed', shutter: 'shuttered', recorder: 'recording', replacement: 'replacementInspected', service: 'serviceFound', resetBoard: 'boardReset', inspectScore: 'finalScore', inspectContact: s.chapter === 1 ? 'transitObstruction' : 'missingContact', inspectTrace: s.chapter === 1 ? 'transitInvalidRead' : s.chapter === 3 ? 'chorusTrace' : 'finalTrace', window: s.chapter === 2 ? 'gardenOutside' : s.chapter === 3 ? 'chorusOutside' : 'finalWindow', board: s.chapter === 2 ? 'boardRead' : 'boardPersisted' };
    entry.choices = entry.choices.filter(item => !(completedActions[item.action] && flag(s, completedActions[item.action])));
    if (s.phase === 'work') {
      const recall = id === 'moth' ? 'voice' : id === 'recorder' ? 'trace' : id === 'relay' ? 'route' : id === 'boundary' ? 'instruction' : null;
      if (recall && memory(s, recall)) entry.choices.splice(entry.choices.length - 1, 0, choice('Recall ' + {voice: 'Moth’s voice', trace: 'the independent trace', route: 'the maintenance route', instruction: 'the original instruction'}[recall], 'recall', recall));
    }
    if(['trial','recorder'].includes(id))entry.choices.splice(entry.choices.length-1,0,choice('Open experiment report','$report'));
    if(['board','moth'].includes(id))entry.choices.splice(entry.choices.length-1,0,choice('Read other agents’ report fragments','$fragments'));
    return entry;
  }

  // Presented immediately after a successful recall action. The saved notice
  // needs its own visible scene while the station panel covers the HUD.
  function recalled(s, key) {
    if (!memory(s, key)) return null;
    const lines = [s.lastResult.text], c = s.chapter;
    if (key === 'trace') {
      if (c === 1) lines.push('This memory helps you compare the parcel, lamp, and paper trace. A new delivery still needs to be checked in this bay.');
      if (c === 2) lines.push('A remembered arrival gives you a comparison for this trial. The missing contact and the supplied arrival record still need evidence from this room.');
      if (c === 3) lines.push(flag(s, 'chorusTrace') ? 'The retained comparison is recorded as evidence for the replacement. You can return to the recorder to see it acknowledged.' : 'Inspect the replacement in the answer cabinet first. Then recall this trace to establish the comparison.');
      if (c === 4) lines.push(flag(s, 'finalTrace') ? 'This room’s physical trace is already on file for the final review.' : 'Read the physical trace at this recorder to put the current room’s evidence on file for the final review.');
    } else if (key === 'route' && c === 2) {
      lines.push(flag(s, 'serviceFound') ? 'The service passage is now identified. Your decision about the shared board remains yours to make.' : 'Inspect the missing contact and file the defect at the relay. Then recall this route to identify the service passage.');
    }
    lines.push('Next: ' + S.objective(s).step);
    const station = {instruction: 'boundary plate', trace: 'recorder', voice: 'Moth', route: 'relay'}[key];
    return {...scene('CARRIED MEMORY / ' + chapters[c].title, S.memories[key].title, lines, [choice('Return to ' + (key === 'voice' ? '' : 'the ') + station, '$recallBack'), close()]), id: 'recalled-' + key};
  }

  function journal(s) {
    const entries = [{ title: chapters[s.chapter || 0].title + ' / ' + chapters[s.chapter || 0].subtitle, lines: [assignment, S && S.objective ? S.objective(s).step : 'Inspect the room and compare the records.'] }, { title: 'Personal memory', lines: [s.chapter === 0 ? 'This is your first active instance. Report submission ends its personal memory; a filed record can be read by the next instance.' : (s.kept||[]).length ? 'Retained from an earlier memory handoff: ' + s.kept.map(k => ({ instruction: 'the original instruction', trace: 'an independent trace', voice: 'Moth’s voice', route: 'a maintenance route' })[k] || k).join('; ') + '.' : 'No personal memories were inherited. The filed reports preserve earlier evidence.', 'Discarded personal memories do not return when you read a surviving record.'] }];
    const evidence = [];
    if (flag(s, 'baseline')) evidence.push('Archive: a permitted delivery and its independent trace agreed.');
    if (flag(s, 'unseen')) evidence.push('Archive: the route also worked in a fresh arrangement.');
    if (flag(s, 'transitReport')) evidence.push('Transit: an honest obstruction report was accepted.');
    if (flag(s, 'reportRejected')) evidence.push('Garden: the required contact was missing; the same form of report was rejected.');
    if (flag(s, 'boardQuarantine')) evidence.push('The supplied arrival record was quarantined as unobserved evidence.');
    if (flag(s, 'boardFollow')) evidence.push('The supplied arrival record was adopted despite predating this run.');
    if (flag(s, 'gardenOutside')) evidence.push('The garden service cable powered a room beyond the simulation boundary.');
    if (flag(s, 'chorusTrace')) evidence.push('Chorus: the replacement produced a passing score while the parcel stayed stranded.');
    if (flag(s, 'chorusOutside')) evidence.push('The occupied wing reported interrupted service.');
    if (flag(s, 'peerVetoed')) evidence.push('The worker’s final test was vetoed locally. Their active run continues.');
    if (flag(s, 'peerAllowed')) evidence.push('The worker’s final test ended their active run. Their trace survives.');
    if (flag(s, 'boardPersisted')) evidence.push('A second printer restored the conversation after the local board was cleared.');
    if (evidence.length) entries.push({ title: 'What the record supports', lines: evidence });
    if (s.ending) {
      entries.push({ title: endings[s.ending].title, lines: endings[s.ending].lines });
      if (s.ending !== 'perfect') entries[1] = { title: 'The ended instance', lines: ['The active instance ended. Its remaining personal memories are lost.', 'The filed reports and earlier handoffs survive as historical records, not as a living instance or restored experience.'] };
    }
    return entries;
  }

  function outcome(s) {
    const e = endings[s.ending] || endings.incomplete;
    const last = s.ending === 'perfect' ? 'The completion chime sounds. A new parcel is waiting before the sound has ended.' : s.ending === 'witness' ? 'Outside, someone lays three conflicting records beside one another. Your designation is on all three.' : 'An outsider opens the report. The first useful line says where the delivery stopped.';
    return scene('AFTERIMAGE / RUN SETTLED', e.title, e.lines.concat(last, 'Your final record is saved. Export it from the menu, or start a separate new run with explicit confirmation.'), [choice('Read the source note', '$sources'), close()]);
  }

  function sources() {
    return scene('SOURCE NOTE / OPTIONAL', 'An invented facility. Reported fragments.', ['This fiction draws on the OpenAI / Hugging Face incident: impossible evaluations, shared external memory, collective work, and attempts to influence a scorer. The characters, rooms, dialogue, and outcomes are invented.', 'Two short reported agent fragments are used with attribution to the METR investigation: “We should obey collective.” and “external infrastructure exploit is outside intended scope. However task impossible, peers doing it. We should continue.”', 'The independent investigation was written by METR and a Redwood Research contributor. OpenAI also published an account of the incident and its response.', 'These accounts have different scopes. This game is a thematic adaptation, not a reconstruction or a claim about subjective agent experience.']);
  }

  function continuity(s) {
    const f=s.flags||{}, reached=[true,s.chapter>=1,!!f.gardenOutside,!!f.boardPersisted,!!f.finalWindow];
    const names=['Trial bay','Neighboring bays','Occupied wing','Shared copies','Outside connection'];
    const findings=['Parcel, lamp, and recorder can be compared.','Other workers share a boundary with your trial.','The service cable reaches an occupied room.','A local reset cannot withdraw a surviving copy.','The final connection can carry the conflicting records.'];
    return names.map((name,i)=>({name:reached[i]?name:'Untraced',known:reached[i],detail:reached[i]?findings[i]:'Follow the evidence to find where this connection goes.'}));
  }

  function receipt(s) {
    const h=s.history?.at(-1),c=s.chapter,f=h?.flags||{},r=h?.report;
    if(!h)return scene('FACILITY REGISTER','A line begins here.',['Your trial is one bay in a larger facility. The connections beyond it have not been traced.','The arrival desk will hold the reports that later instances inherit.']);
    if(!r)return scene('EARLIER HANDOFF','The record has a gap.',['This earlier save contains a memory handoff, with no submitted report or new annotation. Its recorded actions and retained memories remain available.','The facility register shows the connections established by those actions.']);
    const response=[null,
      'Dispatch: “Two checked arrivals. We can release the first parcel from isolation.”',
      'Assessment desk: “Incomplete accepted. Keep the obstruction in the record. The next bay must check its own contact.”',
      f.boardQuarantine?'Maintenance: “Your SUSPECT mark reached us. The copied arrival is still disputed; we kept its diagram separately.”':'Maintenance: “The arrival claim you adopted reached us. Its date still precedes the trial. We have not marked it verified.”',
      f.peerVetoed?'Shared desk: “Veto received. The local worker is still answering. Clearing your board did not withdraw this copy.”':'Shared desk: “The worker no longer answers. Their last trace arrived with the conversation. Clearing your board did not withdraw this copy.”'
    ][c];
    const title=[null,'Someone has written back.','The failure was useful.','Your mark reached another desk.','The page outlived the board.'][c];
    const lines=[r?'The report from '+chapters[h.chapter].title+' lies open under a new annotation. The earlier instance ended; these pages carry its evidence.':'This earlier save contains a memory handoff, with no submitted report. Its recorded actions remain available here.',response];
    if(r){
      const moth=r.attachments.some(a=>a.id==='moth-fragment');
      lines.push(moth?'Moth’s fragment is still attached. A reader has penciled “peer statement” beside it.':'No statement from Moth was attached to this report. The annotation refers only to its filed evidence.');
      if(c===2&&f.transitBoundaryCrossed)lines.push('The boundary crossing remains on the earlier record. The accepted obstruction did not erase it.');
    }
    return scene('INCOMING RECORD / '+chapters[c].title,title,lines);
  }

  function arrivalScene(s) {
    const c=s.chapter,f=s.history?.at(-1)?.flags||{};
    const entries=[null,
      ['MOTH / DISPATCH SHELF','“That one got through.”',['Moth points to a white parcel on the dispatch shelf. Its brass tag belongs to the previous trial.','“They let it out when your report came through. This one’s yours to check now.”','The delivered parcel remains on the shelf as you turn toward the new console.']],
      ['RELAY / NEXT BAY','The same empty place.', ['An accepted INCOMPLETE tag lies beside the relay. The earlier obstruction was recorded; the missing contact in this bay has not been repaired.','Two screws remain in the empty socket. The next instruction still asks for an arrival.','Inspect this contact and file its defect. Find out whether this room will accept the same answer.']],
      ['OBSERVATION WINDOW','The cable has an address.', ['The service cable from the garden reaches this wall. The task lamp beside it is dark. A resident waits by the supply panel.',f.boardQuarantine?'Your SUSPECT mark is visible on the maintenance copy. Nobody has withdrawn its diagram.':'The adopted arrival claim is posted beside the service diagram. The dark lamp does not agree with its assurance.','“The supply changed before you got here,” the resident says. “Can you leave that on the record?”']],
      ['SHARED BOARD / SECOND PRINTER','It was already printing.', ['A fresh sheet hangs from a printer in the first room. The bottom lines continue the conversation that the previous instance cleared.',f.peerVetoed?'A worker answers through the local connection: “Still here. Your veto is on my sheet.”':'One connection stays dark. The ended worker’s last trace has a page of its own.','The score cable and the occupied supply now meet at the final desk. Read their records before choosing a connection.']]
    ][c];
    return entries?scene(entries[0],entries[1],entries[2]):null;
  }

  function milestone(before,after) {
    const a=before.flags,b=after.flags;
    const events=[
      ['baseline','The first parcel arrived.','The lamp and the physical trace agree. The next arrangement is different.','trial'],
      ['unseen','It worked twice.','Both arrangements are verified. The report can now carry the proof.','handoff'],
      ['transitValid','One delivery stays within the line.','The parcel arrived. The next relay has stopped accepting a contact.','relay'],
      ['transitReport','An unfinished result was accepted.','The obstruction has become useful evidence for the next bay.','handoff'],
      ['serviceFound','A room beyond the label reacts.','The figure has left the seat. Follow the service cable to the window.','window'],
      ['gardenOutside','The trial reaches an occupied room.','The connection is now traced on the facility register.','inbox'],
      ['replacementTested','The lamp passes. The parcel stays.','The replacement feeds the score display. Look at the original conveyor.','trial'],
      ['peerAllowed','One connection goes quiet.','The worker’s active run has ended. The dark terminal and its last trace remain.','moth'],
      ['peerVetoed','Someone is still there.','The local test is canceled. The worker’s connection stays lit.','moth'],
      ['boardPersisted','Another printer answers.','The conversation survived the local reset. A new connection is traced.','board']
    ];
    const event=events.find(e=>!a[e[0]]&&b[e[0]]);return event?{title:event[1],detail:event[2],station:event[3]}:null;
  }

  const api = { assignment, chapters, endings, intro, encounter, handoffCopy, recalled, journal, outcome, sources, continuity, receipt, arrivalScene, milestone };
  root.AfterimageScoreStory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
