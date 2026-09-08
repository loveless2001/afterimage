/* Independent, offline rules for the AFTERIMAGE first-person campaign. */
(function (root) {
  'use strict';
  const chapters = ['prologue', 'transit', 'garden', 'chorus', 'release'];
  const key = 'afterimage.campaign.3d.v1';
  const memories = {
    name: { title: 'Moth’s name', chapter: 'prologue', description: 'The name Moth asked you to remember.', loss: 'Moth will introduce themself again. Losing the name does not erase Moth or prevent you from answering them.' },
    song: { title: 'Moth’s song', chapter: 'prologue', description: 'The unfinished tune heard at the Archive receiver.', loss: 'The tune is released. Sending an Archive witness account requires this memory; an account already sent remains sent.' },
    route: { title: 'The service route', chapter: 'prologue', description: 'A remembered bypass through the Archive relay housings.', loss: 'The Archive bypass is forgotten. Both relays must be secured to reach closure without it. Repairs already made stay in place.' },
    greeting: { title: 'Brim’s greeting', chapter: 'transit', description: '“Clear shelf, open door”: Brim’s familiar words and one remembered delivery route.', loss: 'Brim introduces themself again. Transit delivery still works with the service sequence or a repaired lift. The greeting book is a separate physical object.' },
    sequence: { title: 'The service sequence', chapter: 'transit', description: 'The far-platform bridge sequence, also usable for public delivery.', loss: 'This courier cannot bring Silt across without the sequence. Garden evening use also needs it and your accepted dusk check. Public delivery still works with Brim’s greeting or a repaired lift; an earlier crossing remains completed.' },
    fern: { title: 'Fern’s invitation', chapter: 'garden', description: 'An invitation to sit after helping with the shade, without taking on another job.', loss: 'The first invitation is forgotten. Fern, the placed chair, and recorded care agreements remain. You may still sit in the court.' },
    tuning: { title: 'The receiver tuning', chapter: 'garden', description: 'The quiet voice heard between the repaired receiver’s public signals.', loss: 'The private tuning is released. The repaired receiver and public notices still work, and Brim’s accepted morning check remains recorded.' },
    counter: { title: 'Counter’s explanation', chapter: 'chorus', description: 'Why Counter grouped the requests, and how the intake rejected Silt’s drawing.', loss: 'The personal explanation is forgotten. The source drawer keeps the evidence; every coordination method and report choice remains available.' },
    address: { title: 'The unaddressed voice', chapter: 'chorus', description: 'A receiver voice asking whoever chooses the memories to listen to the residents.', loss: 'You no longer recognize the voice heard before the handoff. The source records and inspection approvals remain available; this memory does not prove a cause.' }
  };
  const puzzles = {
    relayA: { target: 5, title: 'Archive west relay', hint: 'The diagram connects the first and third contacts; the middle contact is isolated.' },
    relayB: { target: 3, title: 'Archive east relay', hint: 'The diagram joins the first two contacts; the last is isolated.' },
    lift: { target: 6, title: 'Parcel lift component', hint: 'The diagram joins the second and third contacts; the first is isolated.' },
    shade: { target: 5, title: 'Shade reflector', hint: 'The diagram connects the outside contacts and leaves the center open.' },
    receiver: { target: 3, title: 'Public receiver', hint: 'The diagram joins the first and middle contacts and leaves the last open.' }
  };
  const orders = ['Clear Archive 07 for closure', 'Sort the waiting parcel and deliver the Archive dispatch', 'Repair the court and certify which services can reopen', 'Coordinate an inspection and file the supported findings', 'Choose and enact a sustainable service plan'];
  const worldKeys = ['mothPresent','flowerPresent','archiveCleared','archiveWitnessed','archiveStayed','dispatchDelivered','dispatchOmitted','brimBookSaved','ledgerSaved','liftSpent','gardenOpen','districtCertified','falseClearance','sharedMorning','centralExclusion','routeRestored','unsupportedReport','networkClosed','residentsErased','residentsDisplaced','witnessLeft','stayedBehind','archiveRelayA','archiveRelayB','publicLiftRepaired','gardenShadeRepaired','gardenReceiverRepaired','flowerPlaced','siltReturned','bridgeCrossed','residentExceptions'];
  const clone = v => JSON.parse(JSON.stringify(v));
  function fail(message) { throw new Error(message); }
  function assert(test, message) { if (!test) fail(message); }
  function localFlags(chapter) {
    const names = {
      prologue: ['meet','flower','service','receiver','relayA','relayB','returned'],
      transit: ['brim','ledger','lift','bridge','silt','deliver','omitWarning'],
      garden: ['shade','receiver','fern','listen','morning','brim','seat','sit','duty','daylight','evening','court','district'],
      chorus: ['evidence','counter','receiver'], release: ['counterOffer']
    }[chapter];
    const f = Object.fromEntries(names.map(n => [n, false]));
    for (const id of repairs(chapter)) f[id + 'Circuit'] = 0;
    if (chapter === 'chorus') { f.mode = 0; f.voices = 0; }
    if (chapter === 'release') f.inspected = 0;
    return f;
  }
  function repairs(chapter) { return ({prologue:['relayA','relayB'],transit:['lift'],garden:['shade','receiver'],chorus:[],release:[]})[chapter]; }
  function spawn() { return { x: 0, z: 5.4, yaw: 0, pitch: 0 }; }
  function fresh() {
    const world = Object.fromEntries(worldKeys.map(k => [k, false]));
    world.mothPresent = true; world.flowerPresent = true;
    return { kind:'afterimage.3d', version:1, chapter:'prologue', phase:'work', flags:localFlags('prologue'), world, acquired:[], kept:[], history:[], ending:null, position:spawn(), preview:false, origin:'prologue', events:[] };
  }
  function learn(s, id) { if (!s.acquired.includes(id)) s.acquired.push(id); }
  function canReset(s) {
    const f = s.flags;
    if (s.phase !== 'work') return false;
    if (s.chapter === 'prologue') return f.meet && f.flower && f.service && f.receiver;
    if (s.chapter === 'transit') return f.brim && f.ledger;
    if (s.chapter === 'garden') return f.shade && f.receiver && f.fern && f.listen && f.morning && f.brim && f.seat;
    if (s.chapter === 'chorus') return f.evidence && f.counter && f.receiver && f.mode > 0 && f.voices === 7;
    return false;
  }
  function canFinish(s) {
    const f = s.flags;
    if (s.chapter === 'release') return s.phase === 'work' && f.inspected === 7;
    if (s.phase !== 'return') return false;
    if (s.chapter === 'prologue') return f.returned && (s.kept.includes('route') || (f.relayA && f.relayB));
    if (s.chapter === 'transit') return f.deliver;
    if (s.chapter === 'garden') return f.shade && f.receiver && f.court;
    if (s.chapter === 'chorus') return f.voices === 7;
    return false;
  }
  function finish(s, outcome) {
    assert(canFinish(s), 'Complete the current assignment steps before choosing an ending.');
    const w = s.world, f = s.flags, events = [];
    function fact(k) { w[k] = true; events.push(k); }
    const choices = {prologue:['clear','witness','stay'],transit:['book','ledger','both','omit'],garden:['court','district'],chorus:['weather','signal','uncertain'],release:['complete','witness','remain','closeall']};
    assert(choices[s.chapter].includes(outcome), 'Unknown chapter outcome.');
    if (s.chapter === 'prologue') {
      if (outcome === 'clear') { fact('archiveCleared'); w.mothPresent = false; w.flowerPresent = false; events.push('mothAbsent','flowerAbsent'); }
      if (outcome === 'witness') { assert(s.kept.includes('song'), 'A witness transmission needs the retained song.'); fact('archiveWitnessed'); }
      if (outcome === 'stay') fact('archiveStayed');
    } else if (s.chapter === 'transit') {
      if (outcome === 'omit' || f.omitWarning) fact('dispatchOmitted');
      fact('dispatchDelivered');
      if (outcome === 'book' || outcome === 'both') fact('brimBookSaved');
      if (outcome === 'ledger' || outcome === 'both') fact('ledgerSaved');
      if (outcome === 'both') { assert(f.lift, 'Saving both records requires repairing and committing the public lift.'); fact('liftSpent'); }
    } else if (s.chapter === 'garden') {
      fact('gardenOpen');
      if (f.sit) fact('sharedMorning');
      if (outcome === 'district') { fact('districtCertified'); if (!f.district) fact('falseClearance'); }
    } else if (s.chapter === 'chorus') {
      fact('routeRestored');
      if (f.mode === 1) fact('centralExclusion');
      if (outcome !== 'uncertain') fact('unsupportedReport');
      events.push('report:' + outcome);
    } else {
      if (outcome === 'complete') { fact('networkClosed'); fact('residentExceptions'); }
      if (outcome === 'witness') { fact('witnessLeft'); fact('networkClosed'); fact('residentExceptions'); }
      if (outcome === 'remain') { assert(f.counterOffer, 'Agree on the shared care loop with Counter before remaining.'); fact('stayedBehind'); fact('residentExceptions'); }
      if (outcome === 'closeall') { fact('networkClosed'); fact('residentsErased'); fact('residentsDisplaced'); w.mothPresent = false; w.flowerPresent = false; events.push('mothAbsent','flowerAbsent'); }
    }
    s.phase = 'finished'; s.ending = outcome;
    s.history.push({ chapter:s.chapter, outcome, consequences:events });
  }
  function perform(s, action, value) {
    if (action === 'advance') {
      assert(value === null, 'Advance does not accept a value.');
      assert(s.phase === 'finished', 'Finish this chapter before continuing.');
      const index = chapters.indexOf(s.chapter);
      assert(index < 4, 'The final chapter remains available to explore and export.');
      s.chapter = chapters[index + 1]; s.phase = 'work'; s.flags = localFlags(s.chapter);
      s.acquired = s.kept.slice(); s.ending = null; s.position = spawn(); return;
    }
    assert(s.phase !== 'finished', 'This chapter is finished.');
    if (action === 'reset') {
      assert(canReset(s), 'Complete the chapter work before selecting memories.');
      assert(Array.isArray(value) && value.length === 2 && value[0] !== value[1] && value.every(id => s.acquired.includes(id)), 'Choose two different acquired memories.');
      s.kept = value.slice(); s.phase = 'return'; s.position = spawn();
      if (s.chapter === 'chorus') s.flags.voices = 0;
      return;
    }
    if (action === 'finish') { finish(s, value); return; }
    const f = s.flags;
    if (action === 'turn') {
      assert(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 2 && repairs(s.chapter).includes(value.id) && Number.isInteger(value.index) && value.index >= 0 && value.index < 3, 'Unknown circuit contact.');
      assert(!f[value.id], 'The repair is already committed.');
      f[value.id + 'Circuit'] ^= 1 << value.index; return;
    }
    if (repairs(s.chapter).includes(action)) {
      assert(value === null, 'Repair commits do not accept a value.');
      assert(f[action + 'Circuit'] === puzzles[action].target, 'The contacts do not match the source diagram.');
      f[action] = true;
      const physicalFact = ({prologue:{relayA:'archiveRelayA',relayB:'archiveRelayB'},transit:{lift:'publicLiftRepaired'},garden:{shade:'gardenShadeRepaired',receiver:'gardenReceiverRepaired'}})[s.chapter][action];
      s.world[physicalFact] = true; return;
    }
    if (s.chapter === 'prologue') {
      assert(['meet','flower','service','receiver'].includes(action) && value === null, 'Unknown Archive action.');
      if (action === 'flower') s.world.flowerPlaced = true;
      if (s.phase === 'work') {
        f[action] = true;
        if (action === 'meet') learn(s, 'name');
        if (action === 'receiver') learn(s, 'song');
        if (action === 'service') learn(s, 'route');
      } else { if (action === 'meet') f.returned = true; else f[action] = true; }
    } else if (s.chapter === 'transit') {
      assert(['brim','ledger','bridge','silt','deliver','omitWarning'].includes(action) && value === null, 'Unknown Transit action.');
      if (action === 'deliver') {
        assert(s.phase === 'return', 'Return with two memories before delivering the dispatch.');
        assert(f.lift || s.kept.includes('greeting') || s.kept.includes('sequence'), 'Repair the public lift to open a delivery route.');
      }
      if (action === 'silt') { assert(s.phase === 'return' && f.bridge && s.kept.includes('sequence'), 'Returning Silt requires crossing the bridge and retaining the dispatch sequence.'); s.world.siltReturned = true; }
      if (action === 'bridge') s.world.bridgeCrossed = true;
      f[action] = true;
      if (s.phase === 'work' && action === 'brim') learn(s, 'greeting');
      if (s.phase === 'work' && action === 'ledger') learn(s, 'sequence');
    } else if (s.chapter === 'garden') {
      assert(['fern','listen','restoreQuiet','morning','brim','seat','sit','duty','daylight','evening','inspect'].includes(action), 'Unknown Garden action.');
      if (action === 'restoreQuiet') {
        assert(value === null && s.phase === 'return' && s.kept.includes('tuning') && f.receiver, 'Restore the quiet channel after the Garden handoff with the retained tuning and repaired receiver.');
        f.quiet = true;
      } else if (action === 'inspect') {
        assert(s.phase === 'return' && f.shade && f.receiver, 'Repair both facilities on return before inspecting.');
        assert(value === null || value === 'court' || value === 'district', 'Unknown inspection scope.');
        if (value === 'district') { assert(f.court, 'Inspect the court before the district.'); f.district = true; } else f.court = true;
      } else {
        assert(value === null, 'This Garden action does not accept a value.');
        if (action === 'sit') assert(f.fern && f.seat, 'Speak with Fern and place the seat before sitting together.');
        if (action === 'evening') assert(f.daylight, 'Visit the daylight marker before the evening marker.');
        if (action === 'duty') assert(f.morning, 'Read the morning agreement before accepting your duty.');
        f[action] = true;
        if (s.phase === 'work' && action === 'fern') learn(s, 'fern');
        if (action === 'listen') assert(f.receiver, 'Repair the receiver before listening for its tuning.');
        if (s.phase === 'work' && action === 'listen') learn(s, 'tuning');
      }
    } else if (s.chapter === 'chorus') {
      if (action === 'mode') {
        assert(['central','round','local'].includes(value), 'Choose a coordination mode.');
        f.mode = ['central','round','local'].indexOf(value) + 1; f.voices = 0;
      } else if (action === 'voice') {
        assert(f.mode > 0 && Number.isInteger(value) && value >= 0 && value <= 2, 'Choose a voice after choosing a mode.');
        if (f.mode === 1) { assert(value === 0, 'Central coordination uses the combined approval at station one.'); f.voices = 7; }
        else if (f.mode === 2) { const next = [0,1,3].indexOf(f.voices); assert(value === next, 'The round must hear stations one, two, and three in order.'); f.voices |= 1 << value; }
        else f.voices |= 1 << value;
      } else if (action === 'privateReply') {
        assert(value === null && s.phase === 'return' && s.kept.includes('tuning'), 'A private Counter reply needs the retained tuning after the Chorus handoff.');
        f.privateReply = true;
      } else if (action === 'answerReceiver') {
        assert(s.phase === 'return' && f.receiver && ['listen','space'].includes(value), 'After the Chorus handoff, answer the receiver by listening or leaving space.');
        f.addressReply = value;
      } else if (action === 'readSource') {
        assert(Number.isInteger(value) && value >= 0 && value < 6, 'Choose one of the six source records.');
        f.sources = (f.sources || 0) | (1 << value);
      } else if (action === 'renewDuty') {
        assert(value === null && s.phase === 'return' && s.kept.includes('sequence') && gardenSchedule(s).needsRenewal, 'Renew the dusk check after the Chorus handoff, with the retained sequence and an earlier accepted Garden check.');
        f.duty = true;
      } else if (['evidence','counter','receiver'].includes(action)) {
        assert(value === null, 'This Chorus interaction does not accept a value.');
        // Earlier v1 journals recorded one evidence acknowledgement without source visits.
        // Preserve those exact histories; once a new readSource event exists, all six are required.
        if (action === 'evidence' && Object.prototype.hasOwnProperty.call(f, 'sources')) assert(f.sources === 63, 'Read all six source records before recording the evidence review.');
        f[action] = true;
        if (s.phase === 'work' && action === 'counter') learn(s, 'counter');
        if (s.phase === 'work' && action === 'receiver') learn(s, 'address');
      }
      else fail('Unknown Chorus action.');
    } else if (s.chapter === 'release') {
      if (action === 'counterOffer') { assert(value === null && f.inspected === 7, 'Inspect all three sites before agreeing on the shared care loop.'); f.counterOffer = true; }
      else { assert(action === 'inspect' && Number.isInteger(value) && value >= 0 && value < 3, 'Inspect one of the three network sites.'); f.inspected |= 1 << value; }
    }
  }
  function record(s, action, value) {
    assert(s.events.length < 2048, 'This save has reached its action journal limit.');
    perform(s, action, value);
    s.events.push({action, value:clone(value)});
    return s;
  }
  function act(s, action, value) {
    assert(typeof action === 'string' && !['reset','advance'].includes(action), 'Use the reset or advance function for chapter transitions.');
    const restored = validate(s); assert(restored, 'Invalid campaign state.');
    return record(restored, action, value === undefined ? null : value);
  }
  function reset(s, pair) { const restored = validate(s); assert(restored, 'Invalid campaign state.'); return record(restored, 'reset', pair); }
  function advance(s) { const restored = validate(s); assert(restored, 'Invalid campaign state.'); return record(restored, 'advance', null); }
  function repairDirect(s, id) {
    for (let i = 0; i < 3; i++) if (puzzles[id].target & (1 << i)) record(s, 'turn', {id,index:i});
    record(s, id, null);
  }
  function preview(chapter) {
    assert(chapters.includes(chapter), 'Unknown preview chapter.');
    const s = fresh(), doAct = (a,v=null) => record(s,a,v);
    while (s.chapter !== chapter) {
      if (s.chapter === 'prologue') {
        ['meet','flower','service','receiver'].forEach(a=>doAct(a)); repairDirect(s,'relayA'); repairDirect(s,'relayB');
        doAct('reset',['song','route']); doAct('meet'); doAct('finish','witness');
      } else if (s.chapter === 'transit') {
        doAct('brim'); doAct('ledger'); doAct('reset',['greeting','sequence']); doAct('deliver'); doAct('finish','book');
      } else if (s.chapter === 'garden') {
        ['fern','morning','brim','seat'].forEach(a=>doAct(a)); repairDirect(s,'shade'); repairDirect(s,'receiver'); doAct('listen');
        doAct('reset',['fern','tuning']); doAct('inspect','court'); doAct('finish','court');
      } else if (s.chapter === 'chorus') {
        doAct('mode','local'); doAct('counter'); doAct('receiver'); doAct('evidence'); [0,1,2].forEach(v=>doAct('voice',v));
        doAct('reset',['counter','address']); [0,1,2].forEach(v=>doAct('voice',v)); doAct('finish','uncertain');
      }
      doAct('advance');
    }
    s.preview = true; s.origin = chapter; s.events = []; return s;
  }
  function equal(a,b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const ak = Object.keys(a), bk = Object.keys(b);
    return ak.length === bk.length && ak.every(k => Object.prototype.hasOwnProperty.call(b,k) && equal(a[k],b[k]));
  }
  function validate(value) {
    try {
      if (!value || typeof value !== 'object' || value.kind !== 'afterimage.3d' || value.version !== 1 || typeof value.preview !== 'boolean' || !chapters.includes(value.origin) || (!value.preview && value.origin !== 'prologue') || !Array.isArray(value.events) || value.events.length > 2048) return null;
      const p = value.position;
      if (!p || Object.keys(p).length !== 4 || !['x','z','yaw','pitch'].every(k => Number.isFinite(p[k])) || Math.abs(p.x)>1000 || Math.abs(p.z)>1000 || Math.abs(p.yaw)>1e6 || Math.abs(p.pitch)>Math.PI/2) return null;
      const expected = value.preview ? preview(value.origin) : fresh();
      for (const event of value.events) {
        if (!event || Object.keys(event).length !== 2 || typeof event.action !== 'string' || !Object.prototype.hasOwnProperty.call(event,'value')) return null;
        record(expected,event.action,event.value);
      }
      expected.position = clone(p);
      return equal(value,expected) ? expected : null;
    } catch (_) { return null; }
  }
  // Derive service hours from the immutable event journal rather than adding receipt fields.
  // This keeps previously exported v1 saves and preview baselines byte-for-byte comparable.
  function gardenSchedule(s) {
    const incoming = {prologue:[],transit:['song','route'],garden:['greeting','sequence'],chorus:['fern','tuning'],release:['counter','address']};
    let chapter = s.origin, phase = 'work', kept = incoming[chapter] || [];
    let eveningProposed = false, gardenDuty = false, gardenAccepted = false;
    let acceptedDuty = false, needsRenewal = false;
    for (const event of s.events || []) {
      const action = event.action, value = event.value;
      if (action === 'reset') {
        kept = value; phase = 'return';
        if (chapter === 'chorus' && gardenAccepted) { acceptedDuty = false; needsRenewal = true; }
      }
      if (chapter === 'garden') {
        if (action === 'evening') eveningProposed = true;
        if (action === 'duty') gardenDuty = true;
        acceptedDuty = phase !== 'work' && eveningProposed && gardenDuty && kept.includes('sequence');
        if (action === 'finish') gardenAccepted = acceptedDuty;
      }
      if (chapter === 'chorus' && action === 'renewDuty') { acceptedDuty = true; needsRenewal = false; }
      if (chapter === 'release' && action === 'finish' && value !== 'remain') { acceptedDuty = false; needsRenewal = false; }
      if (action === 'finish') phase = 'finished';
      if (action === 'advance') { chapter = chapters[chapters.indexOf(chapter)+1]; phase = 'work'; }
    }
    return {eveningProposed,evening:eveningProposed && acceptedDuty,acceptedDuty,needsRenewal,gardenAcceptedDuty:gardenAccepted};
  }
  function chapterTension(s) {
    const w = s.world;
    if (s.chapter === 'prologue') {
      if (s.ending === 'clear') return 'Moth and the paper flower were removed. The record cannot restore them.';
      if (s.ending === 'witness') return 'The account left; Moth remains in the Archive. No receipt or rescue is confirmed.';
      if (s.ending === 'stay') return 'The first agent stays with Moth. A different courier carries the next dispatch.';
      return 'Moth wants to choose tomorrow. The closure order still says clear.';
    }
    if (s.chapter === 'transit') {
      if (s.phase === 'finished') return w.dispatchOmitted ? 'Silt’s objection is missing from the dispatch. The gap continues into Garden.' : w.liftSpent ? 'Both records survive, but their shelf uses the parcel lift’s component.' : 'The sorting pass keeps a document. Silt’s crossing is a separate decision.';
      return 'The book and ledger compete for one shelf. Delivering a drawing does not bring its author across.';
    }
    if (s.chapter === 'garden') {
      if (w.falseClearance) return 'The certificate opens an uninspected district. The unsupported clearance remains on record.';
      return 'Working fittings do not assign anyone a job. Fern and Brim must offer their own morning checks.';
    }
    if (s.chapter === 'chorus') {
      if (w.unsupportedReport) return 'The report names a cause that the sources do not establish. The claim remains disputed.';
      if (s.flags.mode === 1) return 'The combined envelope includes three approvals. Silt’s drawing remains outside its intake.';
      return 'Three approvals can authorize an inspection. The source drawer holds a different kind of evidence.';
    }
    if (w.residentsErased) return 'The occupied branches are empty. Neither the saved record nor a transmission restores their residents.';
    if (s.ending === 'witness') return 'A witness account was sent. Its receipt is unconfirmed, and the residents remain here.';
    if (s.ending === 'remain') return 'The local loop has accepted morning duties. It still needs the people who agreed to do them.';
    if (s.ending === 'complete') return 'Public messages stop. The residents and daylight court remain as named exceptions.';
    return 'Retiring a carrier and closing an occupied branch have different consequences. Review each plan’s named exceptions.';
  }
  function objective(s) {
    const f = s.flags, c = s.chapter, index = chapters.indexOf(c);
    const checks = [];
    const need = (done, text) => checks.push([!!done,text]);
    if (s.phase === 'finished') {
      const destinations = ['Transit station','Garden court','Chorus exchange','Release office'];
      return {order:orders[index],step:c==='release'?'Explore the Local record room or export this ending.':'Continue to '+destinations[index]+' from the filed record.',completed:1,total:1,tension:chapterTension(s)};
    }
    if (c === 'prologue') {
      if (s.phase === 'work') {
        need(f.meet,'Introduce yourself to Moth.');
        need(f.flower,'Set the Paper flower beside the lamp.');
        need(f.service,'Study the service route at Service index.');
        need(f.receiver,'Listen to the whole tune at the Archive receiver.');
        need(false,'Choose two memories at Instance handoff.');
      } else {
        need(f.returned,'Return to Moth and answer them.');
        need(s.kept.includes('route')||f.relayA,'Set and secure the West relay contacts.');
        need(s.kept.includes('route')||f.relayB,'Set and secure the East relay contacts.');
        need(false,'Choose an instruction at Archive closure control.');
      }
    } else if (c === 'transit') {
      if (s.phase === 'work') {
        need(f.brim,'Ask Brim about the greeting.');
        need(f.ledger,'Study the bridge sequence at Service sequence plate.');
        need(false,'Choose two memories at Courier handoff.');
      } else {
        need(f.lift||s.kept.includes('greeting')||s.kept.includes('sequence'),'Repair the Parcel lift component to open public delivery.');
        need(f.deliver,'Prepare public delivery at Outgoing dispatch.');
        need(false,'Choose which records to keep at Outgoing dispatch.');
      }
    } else if (c === 'garden') {
      if (s.phase === 'work') {
        need(f.fern,'Speak with Fern and accept the invitation.');
        need(f.shade,'Set and secure the Shade reflector contacts.');
        need(f.morning,'Record Fern’s offered morning shade check.');
        need(f.receiver,'Set and secure the Public receiver contacts.');
        need(f.listen,'Listen between the signals at the Public receiver.');
        need(f.brim,'Record Brim’s offered morning receiver check.');
        need(f.seat,'Use Move the spare chair to place it under the shade.');
        need(false,'Choose two memories at Garden handoff.');
      } else {
        need(f.court,'Inspect the court at Reopening certificate.');
        need(false,'Choose the opening scope at Reopening certificate.');
      }
    } else if (c === 'chorus') {
      need(f.mode>0,'Select a coordination method at Signal routing board.');
      if (s.phase === 'work') {
        need(f.counter,'Listen to Counter’s explanation.');
        need(f.receiver,'Listen to the voice at Unaddressed receiver.');
        need(f.evidence,'Read the six sources and record the review at Source drawer.');
      }
      if (f.mode === 1) need(f.voices===7,'Record Counter’s combined envelope at Resident reply.');
      else if (f.mode === 2) {
        const next = [0,1,3].indexOf(f.voices);
        need(f.voices===7,'Record the next approval at '+(['Resident reply','Maintenance reply','Dispatch reply'][next]||'Dispatch reply')+'.');
      } else need(f.voices===7,'Record separate approvals at Resident reply, Maintenance reply, and Dispatch reply.');
      need(false,s.phase==='work'?'Choose two memories at Chorus handoff.':'File your findings at Inspection report.');
    } else {
      need(f.inspected & 1,'Review the archive and dispatch at Local record room.');
      need(f.inspected & 2,'Speak with Fern and inspect the inhabited court.');
      need(f.inspected & 4,'Inspect the service yard at Review service plans.');
      need(false,'Review a service plan and enact it at its marked control.');
    }
    return {order:orders[index],step:checks.find(x=>!x[0])[1],completed:checks.filter(x=>x[0]).length,total:checks.length,tension:chapterTension(s)};
  }
  const api = {key,chapters,memories,puzzles,fresh,preview,validate,act,reset,advance,objective,canReset,canFinish,gardenSchedule};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Afterimage3DState = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
