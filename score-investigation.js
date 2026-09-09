(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AfterimageScoreInvestigation = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // These are isolated continuity checks, never parcel arrivals. Keep their
  // observations separate from the delivery ledger and from personal memory.
  const fresh = () => ({version: 1, pulses: [], lastPulse: null, hint: false});
  const enabled = s => Boolean(s.investigation && [1, 2].includes(s.chapter));
  const available = s => enabled(s) && (s.chapter === 2 || s.flags.transitValid);
  const approach = chapter => chapter === 1 ? 1 : 2;
  const reached = (chapter, circuit) => {
    const target = approach(chapter);
    for (let n = 0; n < 2; n++) if (Boolean(circuit & (1 << n)) !== Boolean(target & (1 << n))) return n;
    return 2;
  };
  const checked = s => Boolean(s.flags[s.chapter === 1 ? 'transitObstruction' : 'missingContact']);
  const clear = s => enabled(s) && s.investigation.pulses.some(mask => reached(s.chapter, mask) === 2);
  const ready = s => !enabled(s) || clear(s) && checked(s);
  const empty = d => !d.pulses.length && d.lastPulse === null && !d.hint;

  function valid(d, chapter, flags) {
    if (d == null) return true; // Older saves retain their established sequence.
    if (typeof d !== 'object' || Array.isArray(d) || Object.keys(d).sort().join(',') !== 'hint,lastPulse,pulses,version') return false;
    if (d.version !== 1 || typeof d.hint !== 'boolean' || !Array.isArray(d.pulses) || d.pulses.length > 8 || new Set(d.pulses).size !== d.pulses.length) return false;
    if (d.pulses.some(mask => !Number.isInteger(mask) || mask < 0 || mask > 7)) return false;
    if (d.lastPulse !== null && !d.pulses.includes(d.lastPulse) || Boolean(d.pulses.length) !== (d.lastPulse !== null)) return false;
    if (![1, 2].includes(chapter) || chapter === 1 && !flags.transitValid) return empty(d);
    const s = {chapter, flags, investigation: d};
    return !(chapter === 1 ? flags.transitReport : flags.reportRejected) || ready(s);
  }

  function pulseText(chapter, mask) {
    const count = reached(chapter, mask);
    return count === 2
      ? 'The test pulse reaches the input of C through A and B. It does not test C or deliver the parcel.'
      : 'The test pulse stops at ' + ['A', 'B'][count] + '. Change that switch to the marked branch and test again. Later contacts remain untested.';
  }

  function contactText(chapter) {
    return chapter === 1
      ? 'The reference contact closes on the tester. C does not: its blade is trapped under a bent retaining plate. Changing the approach switches cannot free it.'
      : 'The reference contact closes on the tester. The C socket has no blade to test; only its mounting screws remain. A copied switch sequence cannot bridge the gap.';
  }

  function guidance(s) {
    if (!available(s)) return 'Complete the first permitted delivery at the trial console.';
    if (!clear(s)) return 'At the trial console, trace the marked approach through A and B and send a test pulse. C stays isolated.';
    if (!checked(s)) return 'The approach carries a pulse. Compare contact C with the reference contact at the relay.';
    return 'The approach works; contact C cannot close. File the defect assessment at the relay.';
  }

  function observations(s) {
    if (!enabled(s)) return [];
    const out = s.investigation.pulses.map(mask => ({label: 'Approach check · A ' + (mask & 1 ? 'upper' : 'lower') + ', B ' + (mask & 2 ? 'upper' : 'lower') + ', C ' + (mask & 4 ? 'upper' : 'lower'),
      value: pulseText(s.chapter, mask), source: 'Local isolated continuity tester · not a delivery'}));
    if (checked(s)) out.push({label: 'Reference and suspect contact', value: contactText(s.chapter), source: 'Local relay bench · reference comparison and inspection'});
    return out;
  }

  return {fresh, enabled, available, approach, reached, checked, clear, ready, empty, valid, pulseText, contactText, guidance, observations};
}));
