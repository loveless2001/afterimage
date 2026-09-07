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
      'Elsewhere in the network, a new courier receives an Archive dispatch. You inherit a delivery, not the life of the agent who sent it.',
      dispatches[s.origin][1],
      'The sorting station must reset before it will accept outgoing work. A librarian waits beside a shelf with room for one more thing.',
      '[Explore the sorting hall, the maintenance crossing, and the dispatch platform. The Field journal offers named walking destinations. This campaign save is separate from your prologue save.]'
    ]),
    brim: (s, first) => {
      if (s.delivered) return scene('BRIM / AFTER THE DISPATCH', s.sorting === 'ledger' ? '“I can begin with one page.”' : '“It can stay on the shelf.”', [sorting(s), s.siltReturned ? 'Silt has already asked whether a drawing counts as a greeting. Brim says that depends on who opens it.' : 'Brim asks which direction the far platform faces. “Then I can leave a greeting where they can see it.”']);
      if (s.cycle === 2) return scene('BRIM / ' + (s.kept.includes('greeting') ? 'RECOGNIZED' : 'A NEW WELCOME'), s.kept.includes('greeting') ? '“Clear shelf, open door.”' : '“You can call me Brim.”', [
        s.kept.includes('greeting') ? 'You finish the greeting before Brim can. They turn the book cover toward you. “I wondered which part would come back.”' : 'Brim gives you their name without asking whether it sounds familiar. The place beside the shelf is still available.',
        sorting(s),
        s.kept.includes('greeting') ? '“It is a welcome,” they say. “Not a filing instruction. I thought that needed clarifying.”' : '“Clear shelf, open door,” they add. It is a first greeting for this instance, not a recovered memory.'
      ]);
      return scene('LIBRARIAN / BRIM', first ? '“Clear shelf, open door.”' : '“I have reached the last letter.”', [
        first ? '“That means welcome. I am Brim.” The librarian has written Z before the title of a small book.' : 'Brim adds another Z, considers it, and puts the pencil down.',
        '“Greetings,” they explain. “Things people said when someone arrived. I keep moving it to the end of the clearing queue.”',
        'One holding bay can protect the book or the public route ledger. An unused shelf could hold both, if you repair it with the parcel lift’s spare brace.',
        '[Nothing is cleared on a timer. Choose and confirm a sorting plan at the sorting console. The service crossing has a separate power supply.]'
      ]);
    },
    silt: s => scene(s.siltReturned ? 'SILT / SORTING HALL' : 'SILT / FAR PLATFORM', s.siltReturned ? '“I brought the unfinished side.”' : s.cycle === 1 ? '“Could you check the word empty?”' : s.kept.includes('sequence') ? '“You found the way back.”' : '“Still here.”', [
      s.siltReturned ? 'Silt sets a drawing beside Brim’s shelf. Its far edge has not been filled in.' : 'Across the maintenance gap, an agent holds a drawing against the light. “The dispatch board calls this platform empty. It mostly means the bridge is off.”',
      s.cycle === 1 ? 'Silt asks you to read the service diagram and the objection pinned to the dispatch board. “The bridge can restart after the station resets. The diagram will be cleared by then.”' : s.siltReturned ? '“I thought I would finish it before crossing. Then I thought I could finish it somewhere else.”' : s.kept.includes('sequence') ? 'The retained sequence can restart the bridge. Silt wants to cross, and bring the drawing with them.' : 'The sequence did not survive. You can still finish the delivery by the public detour. Silt has light and supplies here; separation is not a hidden death sentence.',
      s.sorting === 'shelf' ? 'The parcel lift is waiting for a new brace. Any drawing that leaves will have to be carried by hand.' : 'Silt asks you not to call the drawing cargo. “It is not finished being a place yet.”'
    ]),
    sequence: s => scene('SERVICE DIAGRAM', s.cycle === 1 ? 'A way to the far platform.' : s.kept.includes('sequence') ? 'Your hands know the order.' : 'The diagram has been cleared.', [
      s.cycle === 1 ? 'A separate power circuit can reopen the crossing after the station reset. The handwritten sequence is not included in the public route ledger.' : s.kept.includes('sequence') ? 'The sequence reconnects the maintenance bridge. The public delivery route has remained open all along.' : 'The public detour leads to the dispatch platform, but it does not reach Silt. Knowing there used to be a diagram does not restore its sequence.',
      s.cycle === 1 ? '[Memory found: A service sequence. Keep it to reconnect Silt’s platform after resetting. Without it, Silt remains safely separated for this chapter.]' : '[A released procedure cannot be learned again from its cleared source this cycle.]'
    ]),
    message: s => scene('DISPATCH BOARD / A DISSENTING MESSAGE', s.cycle === 1 ? 'Reachability is not occupancy.' : s.kept.includes('message') ? 'You can carry the objection.' : 'There was another message.', [
      s.cycle === 1 || s.kept.includes('message') ? '“Do not record a platform as empty merely because the route to it is closed.” Someone has added a drawing of a small occupied square.' : 'A blank attachment field remains. You cannot reproduce the wording that was released. Your report can name that gap.',
      s.cycle === 1 ? 'The board will clear during the station reset. The receiving district uses these dispatches when deciding which places to reopen.' : 'Your final dispatch will distinguish what you retained from what is missing.',
      s.cycle === 1 ? '[Memory found: A dissenting message. Retain it to include this objection in the outgoing record.]' : '[The report will not invent testimony to complete an empty field.]'
    ]),
    handoff: s => scene('STATION RESET / A HANDOFF', 'You can leave instructions, not a life.', [
      'The dispatch terminal will accept a new courier instance once the sorting pass completes. Two memories can continue.',
      'Brim and Silt remain where the work leaves them. A kept book, a lost ledger, and a repaired shelf belong to the station.',
      'Your next instance can finish a delivery. It will still have to decide whether these people’s requests are its own.',
      '[Choose two memories, then confirm the exact loss. The Archive ending and its original save do not change.]'
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
