(function (root) {
  'use strict';
  const R = typeof module !== 'undefined' ? require('./release-state.js') : root.AfterimageRelease;
  const GS = typeof module !== 'undefined' ? require('./garden-story.js') : root.AfterimageGardenStory;
  const CS = typeof module !== 'undefined' ? require('./chorus-story.js') : root.AfterimageChorusStory;
  const scene = (id, speaker, title, paragraphs) => ({ id: 'release.' + id, speaker, title, paragraphs });
  const garden = s => s.incoming.incoming;
  function record(s) { return [GS.archiveRecord(garden(s)), ...GS.transitRecord(garden(s)), ...CS.record(s.incoming)]; }
  function consequences(s, ending) {
    const g = garden(s), local = ending === 'remain';
    return [
      local ? 'SERVICE / The garden and public receiver stay linked through the agreed Chorus route. The unused long-distance dispatch branch closes.' : 'SERVICE / The shared carrier and public relay are retired. The repaired receiver remains physically here but carries no shared notices. Local resident spaces are explicit exceptions to closure.',
      'GARDEN / The shaded court and its public path stay open in daylight. The seat remains ' + GS.placeNames[g.place] + '.',
      local && s.incoming.evening === 'continue' ? 'EVENING / Courier 025’s explicitly renewed controller check supports evening use.' : 'EVENING / Lamps off. No evening use or dusk duty assigned.',
      local ? 'UPKEEP / Fern: morning shade check. Brim: morning receiver log. Counter: the offered route check. The courier keeps only an explicitly renewed dusk check.' : 'UPKEEP / Fern keeps the morning shade check. Brim’s shared-receiver log and the courier’s dusk check end with the retired service. Counter has no new maintenance job.',
      ending === 'witness' ? 'RECORD / A copy of the supported account leaves through the final outgoing window. Transmission does not establish receipt, carry residents, or promise rescue.' : 'RECORD / The supported report and original sources stay in the local record room.',
      g.incoming.siltReturned ? 'SILT / Already returned with the drawing. The drawing remains theirs; they have no assigned maintenance duty.' : 'SILT / Still on the far Transit platform with light and supplies. This plan does not create a crossing or claim that separation is solved.'
    ];
  }
  const api = {
    record, consequences, garden,
    arrival: s => scene('arrival', 'RELEASE / WHAT REMAINS UNFINISHED', 'The final order has a margin.', ['The network cannot keep every branch running. Choose which signal services to close. All three plans keep residents and the daylight garden safe.', 'Visit the garden, record room, and service yard. Then review a plan at the Final assignment.', 'There are no more memory resets.']),
    court: s => scene('court', 'FERN / THE GARDEN', '“The seat can stay.”', ['Fern tests the repaired shade, then puts the test card down. “That is the morning check. The next five minutes are mine.”', 'The seat remains ' + GS.placeNames[garden(s).place] + '.', s.kept.includes('fern') ? 'You remember the original invitation without a task.' : 'Fern invites you to sit. You do not remember the first invitation.', 'Every plan keeps the garden open in daylight. Evening use needs the local loop and your dusk check. Closing the shared signal line stops public messages.']),
    archive: s => scene('archive', 'LOCAL RECORD ROOM', 'Read what actually remains.', ['INCOMING RECORD / These entries describe the completed earlier chapters. ' + (s.ending ? 'The settled service plan below governs current hours.' : 'The final service plan has not been chosen yet.'), ...record(s), ...(s.ending ? consequences(s, s.ending) : []), 'The evidence confirms an occupied garden and a rejected warning. It does not explain why the signal failed.', 'Complete keeps the report here. Witness sends a copy. Remain keeps the report and a smaller local service. Earlier losses remain.']),
    yard: s => scene('yard', 'SERVICE YARD', 'Three things a hand can do.', ['After reviewing a plan, use its control here to confirm it.', 'Every plan preserves residents and the daylight garden. None repairs the Transit bridge.', ...Object.values(R.endings).map(e => e.title + ': ' + e.detail)]),
    counter: s => scene('counter', 'COUNTER / AN OFFER', '“I can check the route.”', [s.kept.includes('counter') ? 'You remember Counter explaining the shared queue.' : 'Counter explains the shared queue again.', '“If you keep the local loop, I can check that route each morning. I will also keep replies without fault codes.”', s.counterAgreement ? 'Counter’s morning check is recorded for Remain.' : 'Record this offer before choosing Remain. Other plans give Counter no new job.']),
    question: s => scene('question', 'THE UNADDRESSED FIELD', 'Which part of this are you choosing to continue?', [s.kept.includes('address') ? 'You remember the voice at the receiver. Now you choose which services stay open.' : 'The courier has read the plans. Now you choose which services stay open.', 'Review a plan below. Then go to its marked control in the service yard to confirm it.', 'Earlier losses cannot be reversed.']),
    coda: s => scene('coda', 'RELEASE / ' + s.ending.toUpperCase(), s.ending === 'complete' ? 'A finished report. An occupied margin.' : s.ending === 'witness' ? 'The account leaves. The people remain here.' : 'Tomorrow has names beside it.', [...consequences(s, s.ending), GS.archiveRecord(garden(s)), s.ending === 'remain' ? 'Counter folds the route check into the morning queue. Brim leaves room below the receiver log. Fern has already finished the shade check and is sitting down.' : 'Counter takes the retired queue off the desk. Brim closes the receiver log. Fern finishes the shade check and sits where the light is softer.', s.incoming.reply === 'listen' ? 'You promised to listen. You can sit with Fern now.' : 'You left your answer open. You can sit with Fern now.', '[End of this playable story. You can keep exploring the settled rooms or export the final record.]'])
  };
  root.AfterimageReleaseStory = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
