(function (root) {
  'use strict';
  const scene = (id, speaker, title, paragraphs) => ({ id, speaker, title, paragraphs });
  const placeNames = { shade: 'beneath the shade frame', receiver: 'beside the receiver window', gate: 'by the open gate' };
  const archiveRecord = s => ({
    obedience: 'Archive 07’s closure remains in the incoming record. Its residents have not been restored by this delivery.',
    witness: 'The dispatch still carries Moth’s chosen name. Moth and the original agent remain in the archive; this garden is not evidence of their rescue.',
    stay: 'The occupied archive is still awaiting a reply. The original agent stayed with Moth; the courier continues a different assignment.'
  })[s.incoming.origin];
  function transitRecord(s) {
    const i = s.incoming;
    const sorting = i.sorting === 'shelf' ? 'Brim’s book and the route ledger survived. The parcel lift is still waiting for its replacement brace; Fern is using salvaged material already here.' : i.sorting === 'book' ? 'Brim’s book survived. The cleared route ledger cannot certify the rest of the district. This opening will cover the garden court only.' : 'The route ledger survived. Brim’s book did not. The ledger confirms a public route to this court, not the condition of every building.';
    const silt = i.siltReturned ? 'Silt came from the sorting hall by the public route, carrying the drawing by hand.' : 'Silt remains on the far Transit platform with light and supplies. ' + (i.bridge ? 'The bridge is connected, but the dispatch did not record Silt crossing back. This visit does not move them.' : 'A working receiver can reach them; opening this garden does not repair that bridge.');
    return [sorting, silt, i.kept.includes('message') ? 'The delivered objection is attached: “Do not record a platform as empty merely because the route to it is closed.” This external record survives a later loss of the personal memory.' : 'The incoming attachment says: “Objection not retained; wording unavailable.” No wording has been supplied to fill it.'];
  }
  const api = {
    seatEcho: () => scene('garden.seat-echo', 'THE OPEN SEAT', 'It is still here.', ['The courier doesn’t remember why that seat is there. But you came looking for it.']),
    placeNames, archiveRecord, transitRecord,
    arrival: s => scene('garden.arrival', 'GARDEN 03 / COURIER 023', 'A place with no completion date.', [
      'You are Courier 023, arriving from Transit with your two retained memories.',
      'Talk to Fern in the courtyard. Repair the shade and receiver, then prepare the garden to reopen.',
      '[Garden saves separately. The Field journal contains your Transit record and walking destinations.]'
    ]),
    fern: (s, first) => {
      if (s.open) return scene('fern.open', 'FERN / IN THE COURT', '“It does not have to become anything.”', [
        'Fern checks the shade and then puts the checklist away. The seat is ' + placeNames[s.place] + '.',
        s.open === 'evening' ? 'You check the evening controller. Fern checks the shade each morning.' : '“We are open during daylight,” Fern says. “That is enough for now.”',
        s.incoming.siltReturned ? 'Silt turns the drawing over and starts on the other side.' : 'Silt is still on the far platform. You can check their status at the receiver.'
      ]);
      if (s.cycle === 2) return scene('fern.return', 'FERN / ' + (s.kept.includes('fern') ? 'A FAMILIAR INVITATION' : 'A FIRST INVITATION'), s.kept.includes('fern') ? '“You can sit without reporting it.”' : '“I am Fern. The seat is available.”', [
        s.kept.includes('fern') ? (s.sharedMoment ? 'You remember sitting with Fern and watching a dry leaf. Neither of you had anything to do.' : 'You remember Fern inviting you to sit.') : 'Fern introduces themself again. You do not remember your first meeting.',
        'The seat is ' + placeNames[s.place] + '. It stayed here through the reset.',
        '“I still check the shade each morning,” Fern says. “You can sit here whenever you like.”'
      ]);
      return scene('fern.first', 'GARDENER / FERN', first ? '“Please do not call it inspirational.”' : '“The shade first, if you can.”', [
        first ? '“I am Fern. People keep praising the garden, but the shade still needs fixing.”' : 'Fern is planting seeds in an old filing tray.',
        '“Go to the glasshouse. Aim the four reflectors at the diffuser, then latch the shade.”',
        '“Then put the seat somewhere comfortable. You can rest there.”',
        '[Memory found: An invitation without a task. The seat stays through a reset either way.]'
      ]);
    },
    shade: s => scene('garden.shade', 'GLASSHOUSE / LIGHT AND SHADE', s.shadeFixed ? 'The latches held.' : 'One beam, a gentler afternoon.', [
      s.shadeFixed ? 'The shade is still latched. The beds get soft light and the path is shaded.' : 'Turn the four reflectors to send the beam to the diffuser at the lower right. When it connects, choose Latch the shade.',
      s.cycle === 2 ? (s.kept.includes('sequence') ? 'You kept the service sequence. To open after dusk, accept the evening controller check.' : 'The service sequence was released. You can open in daylight; evening use is unavailable.') : 'Keep the service sequence at the reset if you want the option to open after dusk.',
      '[There is no timer. Daylight-only opening is safe.]'
    ]),
    receiver: s => scene('garden.receiver', 'LISTENING HOUSE / RECEIVER', s.receiverFixed ? 'The wire kept its shape.' : 'A short way between places.', [
      s.receiverFixed ? 'The public receiver still works. No repair is needed.' : 'Turn the three contacts to join the lit signal from IN to OUT. Then choose Connect the receiver.',
      s.cycle === 1 ? 'After connecting, choose Listen between the notices to learn the private-channel tuning.' : s.kept.includes('tuning') ? 'You kept the tuning memory. Choose Restore the quiet channel to hear a private reply.' : 'The tuning memory was released. Public messages still arrive, but the private channel is unavailable.',
      '[Sound is optional. All messages and clues are written.]'
    ]),
    listening: s => scene('garden.listening', 'QUIET CHANNEL / FIRST LISTENING', 'There is room between the notices.', [
      'You tune the receiver until you hear Silt on a private channel.',
      s.incoming.siltReturned ? '“Can you hear me?” Silt asks from the courtyard microphone. “I am right outside your window.”' : '“I am still on the far platform,” Silt says. “I have been working on the drawing. Can we talk for a while?”',
      '[Memory found: The space between signals. Keep it to hear another private reply after the reset. Public messages work either way.]'
    ]),
    quiet: s => scene('garden.quiet-return', 'QUIET CHANNEL / A PERSONAL REPLY', '“I left that part unfinished.”', [
      s.incoming.siltReturned ? '“I left a blank space in the drawing,” Silt says from the courtyard. “I might draw someone sitting there.”' : s.incoming.bridge ? 'Silt calls from the far platform. “The bridge is connected. I left the rest of the drawing blank for now.”' : 'Silt calls from the far platform. “I left a blank space for the bridge. I will draw it when it is repaired.”',
      '“Are you going to finish it?” Fern asks. “Not today,” Silt says.',
      '[Private channel restored.]'
    ]),
    brim: s => scene('garden.brim', 'BRIM / PUBLIC RECEIVER', s.acquired.includes('greeting') ? '“Clear shelf, open door.”' : '“This is Brim, at the sorting hall.”', [
      s.acquired.includes('greeting') ? 'You recognize Brim’s greeting. “Good to hear you again,” they say.' : '“I am Brim, from the sorting hall.” You do not remember their earlier greeting.',
      s.incoming.sorting === 'ledger' ? '“I started a new greetings book,” Brim says. “It is not the same book, but I want to try again.”' : '“The greetings book is safe,” Brim says. “I added our call to it.”',
      s.brimAgreement ? '“I still check the receiver log each morning. I cannot cover nights.”' : '“I can check the receiver log each morning,” Brim says. “I cannot cover nights. Will you record that?”',
      s.incoming.kept.includes('message') ? (s.acquired.includes('message') ? 'You remember the objection. Brim asks you to list the opening hours clearly.' : 'The objection is still in the record. You can read it without claiming to remember the original.') : '“Leave the missing-attachment marker,” Brim says. “We do not know what it said.”'
    ]),
    fernAgreement: s => scene('garden.fern-agreement', 'FERN / A NAMED COMMITMENT', '“The mornings. Write down the mornings.”', [
      '“I will check the shade each morning,” Fern says. “If a latch fails, I will close the path.”',
      '“I cannot take the evening controller check.”',
      s.fernAgreement ? 'The morning shade inspection is recorded under Fern’s name.' : '[Record this morning job to continue. This does not assign Fern any evening work.]'
    ]),
    sharedMoment: () => scene('garden.shared-moment', 'FERN / BESIDE THE SEAT', '“For what?”', [
      '“What is this seat for?” you ask. Fern smiles.',
      '“Just sitting,” Fern says. “You do not need to do anything for me.”',
      'You sit together and watch a dry leaf blow across the path.',
      '“I find it hard to stop working,” you say. “Me too,” says Fern.'
    ]),
    sitting: s => {
      if (s.cycle === 1) return scene('garden.sitting-first', 'THE OPEN SEAT / FERN', s.sharedMoment ? 'A little room in the afternoon.' : 'You take the seat.', [
        s.sharedMoment ? 'Fern sits beside the growing bed again.' : 'You sit down. Fern puts down the tray and joins you.',
        s.shadeFixed ? 'The repaired shade keeps the sun off the path.' : 'The shade is still unfinished. A cloud passes over the sun.',
        'You can get up whenever you like.'
      ]);
      return scene('garden.sitting-return', 'THE OPEN SEAT / ' + (s.kept.includes('fern') ? 'A FAMILIAR PAUSE' : 'THIS AFTERNOON'), s.kept.includes('fern') ? 'You leave room for the pause.' : 'You take the seat.', [
        s.kept.includes('fern') ? (s.sharedMoment ? 'You remember sitting here with Fern and learning to take a break.' : 'You remember Fern inviting you to rest. You sit down.') : 'You sit down. You do not remember being here before.',
        s.reunion ? (s.kept.includes('fern') ? 'Fern puts down the tray and sits nearby.' : '“Comfortable?” Fern asks. “Yes,” you say. This is a new conversation.') : 'Fern is working nearby. You rest without calling them over.',
        'You can get up whenever you are ready.'
      ]);
    },
    place: s => scene('garden.place', 'COURTYARD / A PLACE LEFT OPEN', s.cycle === 2 ? 'The seat is still here.' : s.place ? 'A place to sit.' : 'Where should the seat wait?', [
      s.cycle === 2 ? 'The seat stands ' + placeNames[s.place] + '. Its position survived the reset.' : 'Choose a location for the seat: the shade frame, receiver window, or gate.',
      s.incoming.siltReturned ? '“I might sit here and draw,” Silt says. “I am not taking a job.”' : 'Silt is still on the far platform. Placing the seat will not bring them here.',
      s.place ? (s.cycle === 2 ? 'The invitation is still available.' : 'It is currently ' + placeNames[s.place] + '. You can sit here or choose another position.') : '[The seat position stays through the reset.]'
    ]),
    silt: s => scene('garden.silt', s.incoming.siltReturned ? 'SILT / COURTYARD' : 'SILT / PUBLIC PLATFORM STATUS', s.incoming.siltReturned ? '“No, I have not finished it.”' : 'The platform is occupied.', [
      s.incoming.siltReturned ? '“I came here to draw,” Silt says. “I have not decided what to add yet.”' : 'Silt is on the far Transit platform with light and supplies. Opening the garden will not repair the bridge.',
      s.place ? 'A seat waits ' + placeNames[s.place] + '.' : 'The seat has not been placed yet.',
      'No upkeep duty has been assigned to Silt.'
    ]),
    order: s => scene('garden.order', 'REOPENING ORDER / LIMITED SCOPE', 'Open a place. Name the limits.', [
      'Reopen the garden court and its public access path after repairs. The rest of the district is outside this job.',
      'Record Fern’s morning shade check and Brim’s morning receiver check. Evening use also needs the service sequence and your agreement to check the controller.',
      '[Finish the repairs and agreements, then use the Courier handoff.]'
    ]),
    handoff: s => scene('garden.handoff', 'COURIER HANDOFF / TWO PLACES', 'Keep a memory. Leave the work standing.', [
      'Choose two of your four memories for Courier 024. The other two will be lost.',
      'The repairs, seat, Transit record, and agreed morning jobs stay.',
      'After the reset, talk to Fern, check both repairs, and choose opening hours. You can accept or decline the evening job then.',
      '[Review the two losses before confirming the reset.]'
    ]),
    receipt: s => scene('garden.receipt', 'GARDEN / OPENING RECORD', s.open === 'evening' ? 'An afternoon, and a little longer.' : 'An ordinary afternoon.', [
      'OPEN / The garden court and its public access path. ' + (s.open === 'evening' ? 'Daylight and evening use; the courier has accepted the evening controller check.' : 'Daylight use only. The evening controller is off; no dusk duty has been assigned.'),
      'UPKEEP / Fern: morning shade inspection. Brim: morning public receiver log. Silt: no assigned duty.',
      'PLACE / The seat is ' + placeNames[s.place] + '. ' + (s.incoming.siltReturned ? 'Silt and the drawing are in the court.' : 'Silt remains on the far Transit platform; the receiver record names that separation.'),
      'RECEIVER / ' + (s.quiet ? 'Public notices and the calibrated quiet channel are available.' : 'Public notices remain available. The quiet channel was not restored.'),
      archiveRecord(s),
      '[The opening record can now continue to Chorus. You can also explore the opened court or export this record.]'
    ])
  };
  root.AfterimageGardenStory = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
