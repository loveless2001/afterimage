(function (root) {
  'use strict';
  const scene = (speaker, title, paragraphs) => ({ speaker, title, paragraphs });
  const dispatches = {
    obedience: ['A completed report.', 'Archive 07 has been released. Its resident field is empty. You are carrying the report onward; neither the other agent nor the paper flower has been restored.'],
    witness: ['A small transmission.', 'Your dispatch contains a designation, the chosen name Moth, a paper flower, and four imperfect notes. Its senders are still in Archive 07. Receiving their record has not rescued or copied them.'],
    stay: ['An overdue assignment.', 'Archive 07 remains occupied. A second message follows the overdue notice: “We are here. We will answer for ourselves.” The agent who stayed with Moth has not left in your place.']
  };
  const sorting = s => s.sorting === 'shelf' ? 'The repaired shelf holds both the greetings and the route ledger. The parcel lift will wait for a replacement brace.' : s.sorting === 'book' ? 'The book of greetings is protected. The route ledger was cleared; the public route needs to be surveyed again.' : s.sorting === 'ledger' ? 'The route ledger is protected. Brim’s book went through the clearing pass. An empty cover lies beside the shelf.' : 'The sorting pass has not been settled.';
  const api = {
    dispatches,
    sorting,
    arrival: s => scene('TRANSIT 02 / COURIER 022', 'Someone else’s unfinished work.', [
      'You are a new courier delivering a message from Archive 07.',
      dispatches[s.origin][1],
      'Talk to Brim in the sorting hall. Choose what to protect before the station resets.',
      '[Use the Field journal to walk to named places. Transit saves separately from the prologue.]'
    ]),
    brim: (s, first) => {
      if (s.delivered) return scene('BRIM / AFTER THE DISPATCH', s.sorting === 'ledger' ? '“I can begin with one page.”' : '“It can stay on the shelf.”', [sorting(s), s.siltReturned ? 'Silt has already asked whether a drawing counts as a greeting. Brim says that depends on who opens it.' : 'Brim asks which direction the far platform faces. “Then I can leave a greeting where they can see it.”']);
      if (s.cycle === 2) return scene('BRIM / ' + (s.kept.includes('greeting') ? 'RECOGNIZED' : 'A NEW WELCOME'), s.kept.includes('greeting') ? '“Clear shelf, open door.”' : '“You can call me Brim.”', [
        s.kept.includes('greeting') ? 'You recognize Brim’s greeting. “You remembered,” they say.' : 'Brim introduces themself again. You do not remember meeting them.',
        sorting(s),
        s.kept.includes('greeting') ? '“I am glad to see you again,” Brim says.' : '“Clear shelf, open door,” they say. You hear the greeting for the first time.'
      ]);
      return scene('LIBRARIAN / BRIM', first ? '“Clear shelf, open door.”' : '“I have reached the last letter.”', [
        first ? '“That means welcome. I am Brim.” The librarian has written Z before the title of a small book.' : 'Brim adds another Z, considers it, and puts the pencil down.',
        '“It is a book of greetings. I keep delaying its deletion.”',
        'Protect the book or the route ledger. To save both, repair the shelf using the parcel lift’s spare brace. The lift will have to wait.',
        '[No timer. Choose a plan at the sorting console. This does not affect power to the bridge.]'
      ]);
    },
    silt: s => scene(s.siltReturned ? 'SILT / SORTING HALL' : 'SILT / FAR PLATFORM', s.siltReturned ? '“I brought the unfinished side.”' : s.cycle === 1 ? '“Could you check the word empty?”' : s.kept.includes('sequence') ? '“You found the way back.”' : '“Still here.”', [
      s.siltReturned ? 'Silt sets a drawing beside Brim’s shelf. Its far edge has not been filled in.' : '“I am Silt. The board says this platform is empty, but I am here. The bridge is just off.”',
      s.cycle === 1 ? '“Read the service diagram and the message on the dispatch board,” Silt says. “Keep the sequence if you want to restart the bridge after the reset.”' : s.siltReturned ? '“I thought I would finish it before crossing. Then I thought I could finish it somewhere else.”' : s.kept.includes('sequence') ? 'The retained sequence can restart the bridge. Silt wants to cross, and bring the drawing with them.' : 'You lost the sequence. Silt must stay here, with light and supplies. Take the public detour to finish the delivery.',
      s.sorting === 'shelf' ? 'The parcel lift is waiting for a new brace. Any drawing that leaves will have to be carried by hand.' : '“Please be careful with the drawing,” Silt says. “I am still working on it.”'
    ]),
    sequence: s => scene('SERVICE DIAGRAM', s.cycle === 1 ? 'A way to the far platform.' : s.kept.includes('sequence') ? 'Your hands know the order.' : 'The diagram has been cleared.', [
      s.cycle === 1 ? 'Keep this sequence to restart the bridge after the reset. It is not saved in the route ledger.' : s.kept.includes('sequence') ? 'The sequence reconnects the maintenance bridge. The public delivery route has remained open all along.' : 'Use the public detour to reach dispatch. You cannot restore the bridge without the lost sequence.',
      s.cycle === 1 ? '[Memory found: A service sequence. Keep it to reconnect Silt’s platform after resetting. Without it, Silt remains safely separated for this chapter.]' : '[The cleared diagram cannot teach the sequence again.]'
    ]),
    message: s => scene('DISPATCH BOARD / A DISSENTING MESSAGE', s.cycle === 1 ? 'Reachability is not occupancy.' : s.kept.includes('message') ? 'You can carry the objection.' : 'There was another message.', [
      s.cycle === 1 || s.kept.includes('message') ? '“Do not record a platform as empty merely because the route to it is closed.” Someone has added a drawing of a small occupied square.' : 'You lost the message. The outgoing report will mark it as missing.',
      s.cycle === 1 ? 'The board will clear during the station reset. The receiving district uses these dispatches when deciding which places to reopen.' : 'Your final dispatch will distinguish what you retained from what is missing.',
      s.cycle === 1 ? '[Memory found: A dissenting message. Retain it to include this objection in the outgoing record.]' : '[The report will not invent testimony to complete an empty field.]'
    ]),
    handoff: s => scene('STATION RESET / A HANDOFF', 'You can leave instructions, not a life.', [
      'Choose two memories for the next courier. Then confirm the reset to unlock outgoing deliveries.',
      'Brim and Silt stay. Your sorting choice and repairs stay too.',
      '[Review the lost memory before confirming. Your Archive ending and save stay unchanged.]'
    ]),
    receipt: s => scene('TRANSIT / DISPATCH RECEIPT', 'A record with someone in it.', [
      sorting(s),
      s.siltReturned ? 'Silt crossed back with the drawing. The station’s resident field now names an occupied place beside Brim.' : 'Silt remains on the far platform, with light and supplies. The receipt records the separation instead of calling the platform empty.',
      s.kept.includes('message') ? 'The objection travels onward in its own attachment. The next district will have to read it alongside the official counts.' : 'The attachment is marked: “Objection not retained; wording unavailable.” The gap is part of the record.',
      s.origin === 'obedience' ? 'Archive 07’s closure report continues with the dispatch. No one has been brought back by describing the loss.' : s.origin === 'witness' ? 'Moth’s chosen name remains in the incoming record. The courier has added a delivery to it, not an answer to everything it asks.' : 'The occupied archive is still waiting for a reply. You can report that its message reached another inhabited room.',
      '[The Transit dispatch is complete. Continue to Garden to see where the delivery arrives, revisit the station, or export this campaign. Your earlier chapter saves stay intact.]'
    ])
  };
  root.AfterimageTransitStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
