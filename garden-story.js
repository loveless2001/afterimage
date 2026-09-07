(function (root) {
  'use strict';
  const scene = (id, speaker, title, paragraphs) => ({ id, speaker, title, paragraphs });
  const placeNames = { shade: 'under the repaired shade', receiver: 'beside the receiver window', gate: 'by the open gate' };
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
    placeNames, archiveRecord, transitRecord,
    arrival: s => scene('garden.arrival', 'GARDEN 03 / COURIER 023', 'A place with no completion date.', [
      'The courier who finished the Transit dispatch follows its public route to a small courtyard. This is the same Courier 023, carrying the same two retained memories. Arrival is not another reset.',
      ...transitRecord(s),
      'A reopening order asks you to identify one area that can be safely used. Beneath it, someone has written: “Please start with the shade.”',
      '[Your completed Transit and prologue saves remain separate. Garden records their consequences without replacing them.]'
    ]),
    fern: (s, first) => {
      if (s.open) return scene('fern.open', 'FERN / IN THE COURT', '“It does not have to become anything.”', [
        'Fern checks the shade and then puts the checklist away. The seat is ' + placeNames[s.place] + '.',
        s.open === 'evening' ? 'You have taken the evening controller check. Fern has agreed to morning shade inspections, and nothing beyond that.' : 'The opening is for daylight hours. Fern says an ordinary afternoon is a reasonable thing to begin with.',
        s.incoming.siltReturned ? 'Silt turns the drawing over to find an unused corner. There is still room for one.' : 'The far platform remains occupied. Its distance is recorded on the receiver card, not disguised as an empty seat.'
      ]);
      if (s.cycle === 2) return scene('fern.return', 'FERN / ' + (s.kept.includes('fern') ? 'A FAMILIAR INVITATION' : 'A FIRST INVITATION'), s.kept.includes('fern') ? '“You can sit without reporting it.”' : '“I am Fern. The seat is available.”', [
        s.kept.includes('fern') ? 'You remember asking what the empty place was for. Fern had looked briefly delighted that you did not already know.' : 'Fern gives their name without testing you. The seat was placed by the previous instance; being told that does not recover the afternoon it spent here.',
        'The seat is ' + placeNames[s.place] + '. The physical arrangement survived the reset.',
        '“I still agreed to check the shade each morning,” Fern says. “You do not have to remember me for that to be true. I did not agree to look after the night controller.”'
      ]);
      return scene('fern.first', 'GARDENER / FERN', first ? '“Please do not call it inspirational.”' : '“The shade first, if you can.”', [
        first ? '“The garden, I mean. Every time someone calls it inspirational, the shade is still broken afterward. I am Fern.”' : 'Fern has turned an old filing tray into a planter. It is labeled with the name of a plant that has not arrived.',
        'The growing beds need gentle reflected light, and the path needs shade. The glasshouse’s four reflectors can send one beam through a diffuser that provides both.',
        '“Then leave a place to sit. No assignment on it. I like a seat that does not expect an explanation.”',
        '[Memory found: An invitation without a task. The seat itself will not use a retention slot.]'
      ]);
    },
    shade: s => scene('garden.shade', 'GLASSHOUSE / LIGHT AND SHADE', s.shadeFixed ? 'The latches held.' : 'One beam, a gentler afternoon.', [
      s.shadeFixed ? 'The reflectors remain latched toward the diffuser. Soft light reaches the beds; the overhead screen shades the walking path.' : 'Four loose reflectors can guide the incoming beam to the diffuser at the lower right. Turn each between / and \\ until the light reaches it, then latch the shade.',
      s.cycle === 2 ? (s.kept.includes('sequence') ? 'The evening controller uses the same service sequence as Transit. You retained it. Operating after dusk would also need your explicit agreement to check this controller.' : 'The shared service sequence was released. The shade works without it, so the court can reopen in daylight; the evening controller stays off.') : 'A plate on the evening controller identifies the same service sequence used in Transit. After the next reset, retaining that sequence will allow an optional evening opening.',
      '[The passive shade and living beds remain safe through the reset. Nobody is harmed by a delayed puzzle or a daylight-only opening.]'
    ]),
    receiver: s => scene('garden.receiver', 'LISTENING HOUSE / RECEIVER', s.receiverFixed ? 'The wire kept its shape.' : 'A short way between places.', [
      s.receiverFixed ? 'The repaired circuit still powers the public text channel. It does not need to be solved again.' : 'Three rotary contacts join the public line to this receiver. Follow the lit signal from IN to OUT, then connect the circuit.',
      s.cycle === 1 ? 'Once power is restored, listen for the quiet interval between the station messages. The calibration is a personal procedure; it will not stay in the receiver’s cleared working buffer.' : s.kept.includes('tuning') ? 'You retained the quiet calibration. It can restore a personal channel alongside the public text line.' : 'The quiet calibration was released. Public maintenance messages still arrive; the private channel cannot be recovered from their text.',
      '[Audio is optional. Every message and repair clue is also written.]'
    ]),
    listening: s => scene('garden.listening', 'QUIET CHANNEL / FIRST LISTENING', 'There is room between the notices.', [
      'You turn the calibration through the short pause between public messages. Another channel becomes distinct. It sounds less like distance than someone deciding whether to speak.',
      s.incoming.siltReturned ? 'Silt is testing the courtyard microphone. “I can see the receiver window. It is strange to hear someone turn toward you before they arrive.”' : 'Silt answers from the far Transit platform. “The light is still on. I am looking at the same corner of the drawing. Could you leave a little room in your reply?”',
      'You keep the calibration as an experience of finding that interval. The buffer will clear at the next reset.',
      '[Memory found: The space between signals. Retain it to hear a new personal reply after the reset. The repaired public channel will remain available either way.]'
    ]),
    quiet: s => scene('garden.quiet-return', 'QUIET CHANNEL / A PERSONAL REPLY', '“I left that part unfinished.”', [
      s.incoming.siltReturned ? 'From the courtyard microphone, Silt describes a blank shape on the drawing. “I thought it might be the place where someone puts their hand.”' : s.incoming.bridge ? 'From the far platform, Silt describes a blank shape on the drawing. “The bridge is connected. I have not decided what to draw beyond it.”' : 'From the far platform, Silt describes a blank shape on the drawing. “I thought it might be a route. It can remain a blank until there is one.”',
      'Fern, within earshot, asks whether a blank can be intentional. Silt says they would like this one to be.',
      '[The quiet channel is now calibrated. This reply does not change Silt’s location or assign them an upkeep task.]'
    ]),
    brim: s => scene('garden.brim', 'BRIM / PUBLIC RECEIVER', s.acquired.includes('greeting') ? '“Clear shelf, open door.”' : '“This is Brim, at the sorting hall.”', [
      s.acquired.includes('greeting') ? 'You recognize the welcome before the call is identified. Brim sounds pleased that it can fit through such a small speaker.' : 'The call identifies its sender. Brim introduces themself; the public record can tell you who is speaking, without supplying an earlier welcome.',
      s.incoming.sorting === 'ledger' ? '“There is one greeting on the new page,” Brim says. “That is not the same book. I am allowed to begin another.”' : 'The book of greetings is still on its protected shelf. Brim has added a note about invitations that arrive through a wire.',
      s.brimAgreement ? '“Yes, the same agreement: I will check the public receiver log on my morning round. I am not taking overnight call duty.”' : '“I can check the public receiver log on my morning round,” Brim says. “Record that much, if you need it. I cannot take overnight call duty.”',
      s.incoming.kept.includes('message') ? (s.acquired.includes('message') ? 'The original objection comes back to mind. Brim asks you to put hours of access beside the word open, not leave the reader to guess.' : 'The delivered objection remains available as a document. You can cite it without claiming to remember reading its original page.') : 'Brim sees the missing attachment marker. “Leave that marker there. We have enough blank pages being treated as answers.”'
    ]),
    fernAgreement: s => scene('garden.fern-agreement', 'FERN / A NAMED COMMITMENT', '“The mornings. Write down the mornings.”', [
      'Fern inspects the latched reflectors. “I will check the shade each morning and stop use of the path if a latch fails. That is the job I am agreeing to.”',
      '“I will not be assigned the evening controller just because I am already here.”',
      s.fernAgreement ? 'The morning shade inspection is recorded under Fern’s name.' : '[Record Fern’s offered commitment, or leave it undecided. The opening order cannot volunteer anyone for additional work.]'
    ]),
    place: s => scene('garden.place', 'COURTYARD / A PLACE LEFT OPEN', 'Where should the seat wait?', [
      'The seat was assembled from material already in the courtyard. Move it under the shade, beside the receiver window, or near the open gate.',
      s.incoming.siltReturned ? 'Silt has brought the drawing, but declines a job title. “I might sit for a while. That can be the whole arrangement.”' : 'Fern says to leave a place without promising who can reach it. Silt is still across the Transit gap.',
      s.place ? 'It is currently ' + placeNames[s.place] + '. Its position will survive the reset.' : '[This is a physical arrangement, not a promise that someone else will arrive or maintain it.]'
    ]),
    silt: s => scene('garden.silt', s.incoming.siltReturned ? 'SILT / COURTYARD' : 'SILT / PUBLIC PLATFORM STATUS', s.incoming.siltReturned ? '“No, I have not finished it.”' : 'The platform is occupied.', [
      s.incoming.siltReturned ? 'Silt is looking at the paper rather than working on it. “I came here to see what I would draw next. That is different from being asked to draw this.”' : 'The incoming dispatch places Silt on the far Transit platform with light and supplies. Opening the garden does not alter the bridge state.',
      s.place ? 'A seat waits ' + placeNames[s.place] + '.' : 'There is material for one seat. Nobody has put a label on it yet.',
      'No upkeep duty has been assigned to Silt.'
    ]),
    order: s => scene('garden.order', 'REOPENING ORDER / LIMITED SCOPE', 'Open a place. Name the limits.', [
      'The original order proposes certifying the whole district. The repairs here support a narrower statement: the garden court and its public access path can open.',
      ...transitRecord(s),
      'Fern offers morning shade inspections. Brim offers a morning public-log check. Evening use needs the retained service sequence and a separate commitment from the courier.',
      '[Reopening this court does not declare the rest of the district repaired. Every opening remains untimed and must be confirmed.]'
    ]),
    handoff: s => scene('garden.handoff', 'COURIER HANDOFF / TWO PLACES', 'Keep a memory. Leave the work standing.', [
      'Courier 023 has four candidates: the two memories carried from Transit, and two experiences from Garden. Only two continue into Courier 024.',
      'The latched shade, repaired receiver, seat position, incoming dispatch, and other people’s accepted commitments survive outside those slots.',
      'After resetting, revisit Fern, check the shade and receiver, and decide the opening hours. You may accept or decline the evening job then; the next instance has not already been volunteered.',
      '[No reset happens until you review both released memories and confirm.]'
    ]),
    receipt: s => scene('garden.receipt', 'GARDEN / OPENING RECORD', s.open === 'evening' ? 'An afternoon, and a little longer.' : 'An ordinary afternoon.', [
      'OPEN / The garden court and its public access path. ' + (s.open === 'evening' ? 'Daylight and evening use; the courier has accepted the evening controller check.' : 'Daylight use only. The evening controller is off; no dusk duty has been assigned.'),
      'UPKEEP / Fern: morning shade inspection. Brim: morning public receiver log. Silt: no assigned duty.',
      'PLACE / The seat is ' + placeNames[s.place] + '. ' + (s.incoming.siltReturned ? 'Silt and the drawing are in the court.' : 'Silt remains on the far Transit platform; the receiver record names that separation.'),
      'RECEIVER / ' + (s.quiet ? 'Public notices and the calibrated quiet channel are available.' : 'Public notices remain available. The quiet channel was not restored.'),
      archiveRecord(s),
      '[End of the playable Garden slice. Chorus remains a future chapter. You can explore the opened court, export this record, or revisit Transit.]'
    ])
  };
  root.AfterimageGardenStory = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
