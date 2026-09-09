(function () {
  'use strict';
  const C = window.AfterimageChorus, Story = window.AfterimageChorusStory;
  const common = (id, label, x, y, type = 'terminal', extra = {}) => ({ id, label, x, y, type, ...extra });
  function objects(s) {
    if (s.room === 'commons') return [common('counter', 'Counter', 380, 270, 'agent', { color: '#738e98' }), common('handoff', 'Courier handoff', 655, 435), common('garden', 'Garden hours', 730, 235), common('occupancy', 'Fern’s account', 270, 425), common('warning', 'Silt’s drawing', 535, 210), common('relay', 'Signal room', 860, 510, 'door'), common('records', 'Record room', 90, 550, 'door')];
    if (s.room === 'relay') return [common('commons', 'Commons', 90, 555, 'door'), common('board', 'Signal board', 490, 220), common('operation', 'Inspection line', 720, 370), common('receiver', 'Unaddressed receiver', 300, 400), common('power', 'Power log', 730, 185), common('protocol', 'Intake protocol', 215, 215)];
    return [common('commons', 'Commons', 90, 555, 'door'), common('report', 'Evidence report', 500, 370), common('clock', 'Clock comparison', 290, 220), common('operations', 'Maintenance finding', 680, 200)];
  }
  function objective(s) {
    if (s.released) return ['An agreement can contain disagreement.', 'Continue to Release from the courier handoff.'];
    if (s.cycle === 1) {
      if (!s.metCounter) return ['Meet the coordinator.', 'Counter is in the commons.'];
      if (!s.wired) return ['Choose a way to listen.', 'Connect the signal board in the signal room. Each route has a different acknowledgement process.'];
      if (!s.operation) return ['Arrange one inspection window.', 'At the inspection line: request the pause, read the replies, then open the line.'];
      if (!s.heard) return ['Read the blank designation.', 'The unaddressed receiver is in the signal room.'];
      if (!C.supported(s)) return ['Write only what the records support.', 'Consult six sources across the three rooms. Complete three claims at the evidence report.'];
      return ['Choose what the next courier remembers.', 'Four experiences; two places. The commons handoff is ready.'];
    }
    if (!s.reunion) return ['Meet Counter after the handoff.', 'The chosen route stayed connected. Does the reason feel familiar?'];
    if (!s.reviewed) return ['Read the report that outlasted its author.', 'The evidence report is in the record room.'];
    if (!s.reply) return ['Leave an answer at the receiver.', 'The signal room holds the unaddressed response field.'];
    if (!s.evening) return ['Review the garden’s hours.', 'Use Garden hours in the commons. A previous courier’s duty is not a new agreement.'];
    return ['Carry an honest record onward.', 'Review the completed handoff in the commons.'];
  }
  function decorate(s, d) {
    if (s.room !== 'relay') return;
    const { project, line, box, label } = d;
    [0, 1, 2].forEach(i => { box(410 + i * 80, 130, 35, 22, 24, '#a7bcc0'); const to = (s.dials[i] + i) % 3; line([project(425 + i * 80, 155, 24), project(425 + to * 80, 300, 8)], s.wired ? '#60889a' : '#929d9b', 3); });
    label(s.wired ? C.modes[s.mode].title.toUpperCase() : 'THREE REPLIES / ONE WINDOW', 550, 330, 0, '#567581', 11);
  }
  function board(a) {
    const s = a.state;
    if (s.wired) return a.say('board-connected', 'SIGNAL BOARD', C.modes[s.mode].title, [C.modes[s.mode].detail, 'The physical route is connected. The inspection line holds the acknowledgement sequence.']);
    if (!s.mode) return chooseMode(a);
    a.say('board', 'SIGNAL BOARD / ' + C.modes[s.mode].title.toUpperCase(), 'Route each reply to its destination.', ['Turn each source to its target, then choose Connect this route. Align the route for me can help.'], [{ label: 'Connect this route', primary: true, disabled: !C.connected(s), run: () => { if (a.act('connect')) board(a); } }, { label: 'Align the route for me', run: () => { a.act('align'); board(a); } }, { label: 'Reconsider the structure', run: () => chooseMode(a) }, a.leave('Leave the board')]);
    const panel = document.createElement('div'); panel.className = 'chorus-board'; const names = ['Desk / residents', 'Maintenance', 'Dispatch'];
    [0, 1, 2].forEach(i => { const target = (C.modes[s.mode].solution[i] + i) % 3, output = (s.dials[i] + i) % 3; const row = document.createElement('div'); row.className = 'signal-route' + (target === output ? ' connected' : ''); const b = document.createElement('button'); b.textContent = 'Turn ' + C.groups[i] + ' → ' + names[output]; b.addEventListener('click', () => { a.act('dial', i); board(a); document.querySelectorAll('.signal-route button')[i].focus(); }); const detail = document.createElement('small'); detail.textContent = 'TARGET: ' + names[target] + (target === output ? ' / MATCHED' : ' / TURN TO MATCH'); row.append(b, detail); panel.append(row); });
    document.getElementById('dialog-body').append(panel);
  }
  function chooseMode(a) { a.say('route-choice', 'SIGNAL ROUTE', 'How will the three groups agree?', ['All three routes work. Compare them below. You can change your choice until you connect the route.'], [...Object.entries(C.modes).map(([id, m]) => ({ label: m.title, detail: m.detail, run: () => a.say('confirm-route', 'ROUTE / REVIEW', m.title, [m.detail, 'This selects the board’s targets. You can reconsider until you connect the route.'], [{ label: 'Set these routing targets', primary: true, run: () => { a.act('mode', id); board(a); } }, { label: 'Reconsider', run: () => chooseMode(a) }]) })), a.leave()]); }
  function operation(a) {
    const s = a.state;
    if (s.operation) return a.say('operation-done', 'INSPECTION LINE', 'The inspection window is open.', ['The carrier is isolated. Dispatch holds deliveries at marked stops. Residents agreed to this one pause.', 'The finding will join the evidence in the record room. The operation did not establish why the carrier failed.']);
    if (!s.wired) return a.say('operation-unwired', 'INSPECTION LINE', 'Give the replies a route first.', ['Choose and connect a structure at the signal board.']);
    if (!s.requested) return a.say('request', 'INSPECTION WINDOW', 'Ask for one bounded pause.', ['Ask the three groups to pause lamps, disconnect the signal line, and hold deliveries for one inspection. Record every reply before starting.'], [{ label: 'Request the inspection pause', primary: true, run: () => { a.act('request'); operation(a); } }, a.leave()]);
    const next = s.mode === 'central' ? s.acks.length ? [] : ['combined'] : C.groups.filter(g => !s.acks.includes(g));
    a.say('acknowledgements', 'INSPECTION WINDOW', s.acks.length + ' of 3 groups acknowledged.', [C.modes[s.mode].detail, s.acks.length === 3 ? 'All three groups agreed. Choose Open the inspection line to begin.' : 'Read each reply, then choose Record this acknowledgement.'], [...next.map(g => ({ label: 'Read ' + (g === 'combined' ? 'Counter’s combined envelope' : g + ' reply'), disabled: s.mode === 'round' && g !== C.groups[s.acks.length], run: () => a.show(Story.ack(s, g), [{ label: 'Record this acknowledgement', primary: true, run: () => { a.act('ack', g); operation(a); } }, { label: 'Back to the window', run: () => operation(a) }]) })), { label: 'Open the inspection line', primary: true, disabled: s.acks.length !== 3, run: () => { a.act('operate'); operation(a); } }, a.leave()]);
  }
  function report(a) {
    const s = a.state;
    if (s.cycle === 2) { a.act('review'); return a.say('report-return', 'SIGNED REPORT', 'The conclusions still have their sources.', Object.entries(C.claims).map(([id, c]) => c.title + ' ' + c.options[s.report[id]] + '. Sources: ' + c.sources.map(k => C.evidence[k].title).join(' + '))); }
    a.say('report', 'EVIDENCE / ' + s.read.length + ' OF 6 SOURCES', 'Three claims. One limit.', ['Read both sources for each question, then choose an answer. Correct any unsupported answers before the handoff.', C.supported(s) ? 'All three claims are supported. The report is ready.' : 'The evidence supports occupancy and a filtered warning. It does not establish the cause of carrier loss.'], [...Object.entries(C.claims).map(([id, c]) => ({ label: c.title, detail: s.report[id] ? c.options[s.report[id]] + (s.report[id] === c.answer ? ' / SUPPORTED' : ' / REVISE: NOT SUPPORTED') : 'No claim drafted', disabled: !c.sources.every(k => s.read.includes(k)), run: () => a.say('claim-' + id, 'REPORT / SOURCE COMPARISON', c.title, c.sources.map(k => C.evidence[k].title + ': ' + C.evidence[k].text), [...Object.entries(c.options).map(([answer, title]) => ({ label: title, run: () => { a.act('claim', { id, answer }); report(a); } })), { label: 'Back to report', run: () => report(a) }]) })), a.leave()]);
  }
  function receiver(a) {
    const s = a.state; if (s.cycle === 1) a.act('hear');
    a.show(Story.receiver(s), [...(s.cycle === 2 && !s.released ? [{ label: s.kept.includes('address') ? 'Answer: I will listen' : 'Leave an answer: I will listen', run: () => { a.act('reply', 'listen'); receiver(a); } }, { label: 'Leave room for an answer', run: () => { a.act('reply', 'space'); receiver(a); } }] : []), ...(s.kept.includes('tuning') ? [{ label: 'Tune a private reply from Counter', run: () => a.say('private-reply', 'QUIET CHANNEL / COUNTER', '“I like the slips when they are different sizes.”', ['“People wrote them by hand. I want to keep them that way.”', 'This personal reply adds no evidence to the carrier report.']) }] : []), a.leave()]);
  }
  function hours(a) {
    const s = a.state;
    a.say('garden-hours', 'GARDEN / HOURS', 'Who accepted the dusk check?', [Story.record(s)[1], s.kept.includes('fern') ? 'You remember Fern’s invitation to rest. Fern only agreed to the morning shade check.' : 'Fern’s morning shade inspection remains on the public agreement. No new job has been assigned to them.', s.kept.includes('greeting') ? 'You recognize Brim’s greeting on the log. They still agreed only to a morning check.' : 'Brim checks the log each morning. You do not remember their greeting.'], [...(s.cycle === 2 && !s.released ? s.incoming.open === 'daylight' ? [{ label: 'Confirm daylight hours', primary: true, run: () => { a.act('evening', 'none'); hours(a); } }] : [{ label: 'Pause evening use', detail: 'Daylight continues. The dusk check is unassigned.', run: () => { a.act('evening', 'pause'); hours(a); } }, { label: 'Renew the dusk commitment', disabled: !s.kept.includes('sequence'), detail: 'Requires the retained sequence. Courier 025 accepts the check personally.', run: () => a.say('renew-duty', 'COURIER 025 / AGREEMENT', 'Accept your own evening check?', ['At each evening session, you will inspect the controller before use. Fern and Brim retain their morning duties only. You can withdraw before the final Chorus handoff.'], [{ label: 'Accept the dusk check', primary: true, run: () => { a.act('evening', 'continue'); hours(a); } }, a.leave('Leave it unassigned')]) }] : []), a.leave()]);
  }
  function handoff(a, selected = []) {
    const s = a.state;
    if (s.released) return receipt(a);
    if (s.cycle === 2) {
      if (!C.returnReady(s)) return a.say('handoff-unready', 'HANDOFF', 'Read the work with your own eyes.', [objective(s).join(' ')]);
      return a.say('confirm-handoff', 'CHORUS / FINAL REVIEW', 'Carry this agreement onward?', [...Story.record(s), 'The report preserves the original disagreement and the unknown cause. The response field remains as you left it.', 'Confirm to finish Chorus. In Release, you will decide which network services to keep.'], [{ label: 'Confirm the Chorus handoff', primary: true, run: () => { if (a.act('release')) receipt(a); } }, a.leave('Reconsider')]);
    }
    if (!C.ready(s)) return a.say('handoff-unready', 'HANDOFF', 'Finish the work before choosing.', [objective(s).join(' ')]);
    a.show(Story.handoff(s), [...C.candidates(s).map(id => ({ label: C.memories[id].title, detail: C.memories[id].detail, toggle: true, selected: selected.includes(id), run: () => handoff(a, selected.includes(id) ? selected.filter(k => k !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]) })), { label: 'Review the two released memories', primary: true, disabled: selected.length !== 2, run: () => a.say('confirm-reset', 'CONFIRM COURIER HANDOFF', 'These experiences will not continue.', C.candidates(s).filter(id => !selected.includes(id)).map(id => C.memories[id].title + ': ' + C.memories[id].loss).concat('The route, evidence, and report remain. The next courier must choose their own response and hours.'), [{ label: 'Release Courier 024', primary: true, run: () => a.transition(C.reset(s, selected)) }, { label: 'Reconsider', run: () => handoff(a, selected) }], () => handoff(a, selected)) }, a.leave('Not yet')]);
  }
  function receipt(a) { a.show(Story.receipt(a.state), [{ label: 'Continue to Release', primary: true, run: () => { a.save(); location.href = 'release.html'; } }, a.leave('Continue exploring'), { label: 'Export Chorus record', run: a.exportSave }]); }
  window.AfterimageChapterFlow.create({ name: 'Chorus', model: C, previous: window.AfterimageGarden, previousName: 'Garden', previousURL: 'garden.html', rooms: { commons: 'THE COMMONS', relay: 'THE SIGNAL ROOM', records: 'THE RECORD ROOM' }, status: s => s.cycle === 1 ? 'COURIER 024' : 'COURIER 025', phase: s => s.cycle === 1 ? '/ FIRST VISIT' : '/ RETURN', objects, decorate, objective, record: Story.record, previewNames: { book: 'an evening garden', ledger: 'daylight and a distant platform', shelf: 'daylight and both documents' }, isNew: s => s.cycle === 1 && !s.metCounter, finished: s => s.released, arrival: a => a.show(Story.arrival(a.state), [a.leave('Enter the commons')]), receipt,
    interact(o, a) { if (Object.hasOwn(C.evidence, o.id)) { a.act('read', o.id); return a.say('evidence-' + o.id, 'SOURCE RECORD', C.evidence[o.id].title, [C.evidence[o.id].text]); } switch (o.id) { case 'counter': a.act('counter'); a.show(Story.counter(a.state), [a.leave()]); break; case 'board': board(a); break; case 'operation': operation(a); break; case 'report': report(a); break; case 'receiver': receiver(a); break; case 'garden': hours(a); break; case 'handoff': handoff(a); break; } }
  });
})();
