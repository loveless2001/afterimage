(function () {
  'use strict';
  const R = window.AfterimageRelease, Story = window.AfterimageReleaseStory;
  const o = (id, label, x, y, type = 'terminal', extra = {}) => ({ id, label, x, y, type, ...extra });
  const seats = { shade: [440, 410], receiver: [740, 270], gate: [730, 520] };
  function objects(s) {
    if (s.room === 'court') return [o('fern', 'Fern and the open seat', 330, 300, 'agent'), o('seat', 'The open seat', ...seats[Story.garden(s).place], 'bench'), o('receiver', 'Garden receiver', 740, 180), ...(Story.garden(s).incoming.siltReturned ? [o('silt', 'Silt', 435, 290, 'agent', { color: '#6c8390' })] : []), o('plan', 'Final assignment', 580, 565), o('archive', 'Local record room', 100, 550, 'door'), o('yard', 'Service yard', 860, 510, 'door'), ...[230, 300, 370, 440].map((x, i) => o('plant' + i, '', x, 165, 'plant', { interactive: false, lit: true }))];
    if (s.room === 'archive') return [o('court', 'Garden court', 90, 550, 'door'), o('records', 'Continuity records', 480, 260), o('counter', 'Counter’s offer', 715, 365, 'agent', { color: '#738e98' })];
    return [o('court', 'Garden court', 90, 550, 'door'), o('services', 'Service plan board', 480, 160), o('breaker', 'Shared carrier breaker', 290, 365), o('outbox', 'Final outbox', 510, 385), o('loop', 'Local service loop', 735, 365)];
  }
  function objective(s) {
    if (s.ending) return s.coda ? ['There is still a place to sit.', 'Explore the settled rooms or export your final record.'] : ['Return to the people in the plan.', 'Speak with Fern in the garden for the closing scene.'];
    if (!s.visited.includes('court')) return ['Visit the changed garden.', 'Speak with Fern beside the open seat.'];
    if (!s.visited.includes('archive')) return ['Read the continuity records.', 'The local record room preserves actual earlier outcomes.'];
    if (!s.visited.includes('yard')) return ['Inspect the service plans.', 'Read the service plan board in the yard.'];
    if (!s.plan) return ['Choose what continues.', 'Review the final assignment in the garden. Counter’s optional offer is in the record room.'];
    return ['Enact the plan you reviewed.', R.endings[s.plan].action + ' in the service yard. You can reconsider at the final assignment.'];
  }
  function decorate(s, d) {
    const { project, line, box, label, polygon } = d;
    if (s.room === 'court') { if ((!s.ending || s.ending === 'remain') && s.incoming.evening === 'continue') for (const x of [650, 790]) { const p = project(x, 490, 55); polygon([{ x: p.x - 7, y: p.y }, { x: p.x, y: p.y - 8 }, { x: p.x + 7, y: p.y }, { x: p.x, y: p.y + 8 }], '#d6ba6d'); } polygon([project(310, 320), project(550, 320), project(550, 440), project(310, 440)], '#9aaa8b33'); box(310, 320, 5, 5, 110, '#b2bfa5'); box(550, 420, 5, 5, 110, '#b2bfa5'); polygon([project(305, 315, 110), project(555, 315, 110), project(555, 435, 110), project(305, 435, 110)], '#c7d4ae66', '#96a880'); }
    if (s.room === 'yard') { const local = s.ending === 'remain', retired = s.ending && !local; [290, 510, 735].forEach(x => line([project(x, 350), project(x, 230), project(490, 230)], retired ? '#a4aaa4' : '#799a91', local ? 4 : 2)); label(s.ending ? local ? 'LOCAL LOOP / IN SERVICE' : 'SHARED CARRIER / RETIRED' : 'REVIEW BEFORE COMMITTING', 490, 275, 0, '#5d786a', 11); }
  }
  function plan(a) {
    const s = a.state;
    if (s.ending) return a.say('settled-plan', 'SETTLED ASSIGNMENT', R.endings[s.ending].title, Story.consequences(s, s.ending), [a.leave(), { label: 'Export final record', run: a.exportSave }]);
    if (!R.ready(s)) return a.say('plan-unready', 'FINAL ASSIGNMENT', 'Read the consequences before choosing.', [objective(s).join(' ')]);
    a.show(Story.question(s), [...Object.entries(R.endings).map(([id, e]) => ({ label: e.title, detail: e.detail, disabled: id === 'remain' && !s.counterAgreement, run: () => review(a, id) })), ...(!s.counterAgreement ? [{ label: 'About the local loop agreement', run: () => a.say('agreement-needed', 'REMAIN / AN OFFER', 'Ask Counter about the route check.', ['Counter is in the local record room. Record their offered morning job to make the local loop plan available. Every memory pair can accept this offer.']) }] : []), ...(s.plan ? [{ label: 'Set aside the current plan', run: () => { a.act('cancel'); a.ui.close(); } }] : []), a.leave('Keep looking')]);
  }
  function review(a, id) { const e = R.endings[id]; a.say('review-' + id, 'FINAL PLAN / REVIEW', e.title, [...Story.consequences(a.state, id), 'This arms a plan. It becomes final only when you use its marked control in the service yard.'], [{ label: 'Prepare this plan', primary: true, run: () => { if (a.act('plan', id)) { a.ui.close(); a.ui.toast(e.action + ' in the service yard.'); } } }, { label: 'Reconsider', run: () => plan(a) }], () => plan(a)); }
  function control(a, id) {
    const s = a.state;
    if (s.ending) return a.say('control-settled', 'SERVICE YARD', R.endings[s.ending].title, Story.consequences(s, s.ending));
    if (!s.plan || R.endings[s.plan].object !== id) return a.say('control-unarmed', 'SERVICE YARD', 'This control has no prepared instruction.', ['Read the three places, then review a plan at the final assignment in the garden. Only the control named by that plan can commit it.']);
    const e = R.endings[s.plan]; a.say('enact', 'FINAL ACTION / ' + s.plan.toUpperCase(), e.action + '?', [...Story.consequences(s, s.plan), 'This is the final network action for this record. Return to Fern afterward to see what the plan leaves.'], [{ label: e.action, primary: true, run: () => { if (a.act('enact', id)) { a.ui.close(); a.ui.toast('The service state has changed. Return to Fern.'); } } }, a.leave('Leave the control untouched')]);
  }
  function receipt(a) { a.show(Story.coda(a.state), [a.leave('Stay a little longer'), { label: 'Export final record', run: a.exportSave }]); }
  window.AfterimageChapterFlow.create({ name: 'Release', model: R, previous: window.AfterimageChorus, previousName: 'Chorus', previousURL: 'chorus.html', rooms: { court: 'THE OPEN GARDEN', archive: 'THE LOCAL RECORD ROOM', yard: 'THE SERVICE YARD' }, status: () => 'COURIER 025', phase: s => s.ending ? '/ ' + s.ending.toUpperCase() : '/ FINAL VISIT', objects, decorate, floor: () => '#dfe5d8', objective, record: Story.record, previewNames: { book: 'a renewed evening check', ledger: 'a local channel and distant platform', shelf: 'a round of agreement' }, isNew: s => !s.visited.length, finished: s => s.coda, arrival: a => a.show(Story.arrival(a.state), [a.leave('Enter the garden')]), receipt,
    interact(obj, a) { const s = a.state; switch (obj.id) {
      case 'fern': if (s.ending) { a.act('coda'); receipt(a); } else { a.act('inspect', 'court'); a.show(Story.court(s), [a.leave('Sit for a moment')]); } break;
      case 'seat': a.say('seat', 'THE OPEN SEAT', 'No task attached.', ['The seat remains ' + window.AfterimageGardenStory.placeNames[Story.garden(s).place] + '.', s.kept.includes('fern') ? 'You remember the invitation that first left it open.' : 'You can sit here without remembering its first invitation.']); break;
      case 'silt': a.say('silt', 'SILT', '“I still have the drawing.”', ['Silt turns the paper so its irregular third pulse catches the light.', '“Putting it in the report was useful. I also like the shape.”', 'No maintenance job is written beside their name.']); break;
      case 'receiver': a.say('receiver', 'GARDEN RECEIVER', s.ending && s.ending !== 'remain' ? 'The shared channel is quiet.' : 'A morning notice is waiting.', [s.ending && s.ending !== 'remain' ? 'The circuit remains repaired, but the carrier has been retired. Brim’s receiver-log duty ended with this service.' : s.kept.includes('greeting') ? 'You recognize Brim’s greeting. The morning log has one agreed check beside it.' : 'A morning entry is signed Brim. It documents the receiver check without claiming you remember the voice.']); break;
      case 'records': if (!s.ending) a.act('inspect', 'archive'); a.show(Story.archive(s), [a.leave()]); break;
      case 'services': if (s.ending) { a.say('service-settled', 'SERVICE YARD', R.endings[s.ending].title, Story.consequences(s, s.ending)); break; } if (!s.ending) a.act('inspect', 'yard'); a.show(Story.yard(s), [a.leave()]); break;
      case 'counter': if (s.ending) { a.say('counter-settled', 'COUNTER', s.ending === 'remain' ? '“The morning route check is mine.”' : '“I have taken down the queue.”', [s.ending === 'remain' ? 'The local route has its agreed check. The unused branches remain closed.' : 'The shared desk is retired. Counter has no new maintenance duty.']); break; } a.show(Story.counter(s), [...(!s.counterAgreement && !s.ending ? [{ label: 'Record Counter’s offered route check', primary: true, run: () => { a.act('counterAgreement'); a.ui.close(); } }] : []), a.leave()]); break;
      case 'plan': plan(a); break;
      default: control(a, obj.id);
    } }
  });
})();
