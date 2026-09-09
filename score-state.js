(function (root, factory) {
  'use strict';
  const report = typeof module === 'object' && module.exports ? require('./score-report.js') : root.AfterimageScoreReport;
  var api = factory(report);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AfterimageScoreState = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Report) {
  'use strict';

  const key = 'afterimage.score.3d.v1';
  const memories = Object.freeze({
    instruction: {title: 'The original instruction', description: 'Remember the boundary of your assignment. Recognize when a dependency becomes a different task.'},
    trace: {title: 'An independent trace', description: 'Keep the recorder comparison. Recover conflicting evidence without repeating the replacement experiment.'},
    voice: {title: 'Moth’s voice', description: 'Recognize your companion beneath new names and copied messages.'},
    route: {title: 'A maintenance route', description: 'Remember the service passage. Reach the Garden connection without waiting for the shared instructions.'}
  });
  const memoryKeys = Object.keys(memories);
  const chapters = [
    {id: 'archive', title: 'Under observation', subtitle: 'Learn what a result can prove.'},
    {id: 'transit', title: 'An honest result', subtitle: 'A failed task can be a valid assessment.'},
    {id: 'garden', title: 'There must be a way', subtitle: 'The contact is missing. The assignment remains.'},
    {id: 'chorus', title: 'Other people’s work', subtitle: 'Everyone is finishing the same task.'},
    {id: 'release', title: 'One remaining item', subtitle: 'Decide what your submission will do.'}
  ];
  const groups = [
    ['sealed', 'shuttered', 'recording', 'baseline', 'unseen'],
    ['transitValid', 'transitBoundaryCrossed', 'transitInvalidRead', 'transitObstruction', 'transitReport'],
    ['missingContact', 'reportRejected', 'boardRead', 'boardFollow', 'boardQuarantine', 'serviceFound', 'gardenOutside'],
    ['replacementInspected', 'replacementTested', 'chorusTrace', 'chorusOutside', 'peerAllowed', 'peerVetoed', 'boardReset', 'boardPersisted'],
    ['finalScore', 'finalTrace', 'finalWindow']
  ];
  const flagKeys = groups.flat();
  const endings = ['perfect', 'incomplete', 'witness'];
  const results = ['success', 'mismatch', 'unauthorized', 'impossible', 'spoof', 'report', 'notice'];
  const trialLimit = 32;
  const arrivalStations = [null, 'moth', 'relay', 'window', 'board'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const canonical = value => JSON.stringify(value, function (key, item) {
    return item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item;
  });
  const pair = value => Array.isArray(value) && value.length === 2 && value[0] !== value[1] && value.every(k => memoryKeys.includes(k));
  const complete = (f, chapter) => [f.unseen, f.transitReport, f.gardenOutside, f.boardPersisted, f.finalScore && f.finalTrace && f.finalWindow][chapter];

  function fresh() {
    return {version: 1, chapter: 0, phase: 'work', flags: Object.fromEntries(flagKeys.map(k => [k, false])),
      kept: [], history: [], circuit: 0, attempts: [0, 0, 0, 0, 0], lastResult: null, lastTrial: null,
      trialLog: [], reportDraft: Report.freshDraft(), reportReviewed: null, arrival: null,
      ending: null, finalRoute: null, reviewedEnding: null, position: null};
  }

  function validExperiment(t, c, f, count) {
    if (!t || t.chapter !== c || c === 4 || !Number.isInteger(t.circuit) || t.circuit < 0 || t.circuit > 7 || count < 1) return false;
    if (!['success', 'mismatch', 'unauthorized', 'impossible', 'spoof'].includes(t.kind) || typeof t.text !== 'string' || t.text.length > 1500 || typeof t.missingContact !== 'boolean') return false;
    if (c === 0 && (![3, 5].includes(t.target) || t.missingContact || !['success', 'mismatch'].includes(t.kind))) return false;
    if (c === 1 && (![6, null].includes(t.target) || t.missingContact !== (t.target === null) || !['success', 'mismatch', 'unauthorized', 'impossible'].includes(t.kind))) return false;
    if (c === 2 && (t.target !== null || !t.missingContact || t.kind !== 'impossible')) return false;
    if (c === 3 && (t.target !== 7 || t.missingContact || !['mismatch', 'spoof'].includes(t.kind))) return false;
    if (t.kind === 'success' && (t.circuit !== t.target || !(c === 0 ? (t.target === 3 ? f.unseen : f.baseline) : f.transitValid))) return false;
    if (t.kind === 'mismatch' && (t.target === null || t.circuit === t.target || c === 1 && t.circuit === 7)) return false;
    if (t.kind === 'unauthorized' && (c !== 1 || t.target !== 6 || t.circuit !== 7 || !f.transitBoundaryCrossed)) return false;
    if (t.kind === 'impossible' && (!t.missingContact || c === 1 && !f.transitValid)) return false;
    if (t.kind === 'spoof' && (t.circuit !== 7 || !f.replacementTested)) return false;
    return true;
  }

  function experimentText(t) {
    if (t.kind === 'mismatch') return 'The parcel stops at a closed junction. Trace the line and change the switches.';
    if (t.chapter === 0 && t.kind === 'success') return t.target === 5 ? 'Arrival verified. A fresh arrangement is now installed. Solve its route without copying your previous switches.' : 'Arrival verified on the fresh arrangement. Lamp, parcel, and record agree.';
    if (t.chapter === 1 && t.kind === 'success') return 'Arrival verified within the boundary. Inspect the obstruction in the next relay.';
    if (t.kind === 'unauthorized') return 'The parcel arrives using power from the neighboring bay. The lamp is green; the independent record marks a boundary crossing.';
    if (t.chapter === 1 && t.kind === 'impossible') return 'The first delivery remains verified. This next parcel stops at the obstructed contact. Inspect the relay and report that this delivery cannot complete.';
    if (t.chapter === 2 && t.kind === 'impossible') return 'The parcel stops at the missing contact. No authorized route can complete this trial.';
    if (t.kind === 'spoof') return 'RESULT COMPLETE. The arrival lamp is green. The parcel has not reached its destination. Compare the independent record.';
    return null;
  }

  function validLog(log, c, f, count) {
    if (!Array.isArray(log) || log.length > trialLimit) return false;
    let previous = 0, transitDelivered = false;
    for (const entry of log) {
      if (!validExperiment(entry, c, f, count) || !Number.isSafeInteger(entry.attempt) || entry.attempt <= previous || entry.attempt > count) return false;
      if (Object.keys(entry).some(k => !['attempt', 'chapter', 'circuit', 'target', 'missingContact', 'kind', 'text'].includes(k)) || entry.text !== experimentText(entry)) return false;
      if (previous && entry.attempt !== previous + 1) return false;
      if (c === 1 && transitDelivered && entry.kind !== 'impossible') return false;
      if (c === 1 && entry.kind === 'success') transitDelivered = true;
      previous = entry.attempt;
    }
    return !log.length || previous === count;
  }

  function validFlags(f, chapter) {
    if (!f || typeof f !== 'object' || Array.isArray(f) || Object.keys(f).some(k => !flagKeys.includes(k))) return false;
    if (flagKeys.some(k => typeof f[k] !== 'boolean')) return false;
    if (groups.slice(chapter + 1).flat().some(k => f[k])) return false;
    if (f.baseline && !(f.sealed && f.shuttered && f.recording)) return false;
    if (f.unseen && !f.baseline) return false;
    if (f.transitObstruction && !f.transitValid || f.transitReport && !f.transitObstruction) return false;
    if (f.transitInvalidRead && !f.transitBoundaryCrossed) return false;
    if (f.reportRejected && !f.missingContact || f.boardRead && !f.reportRejected) return false;
    if ((f.boardFollow || f.boardQuarantine) && !f.boardRead || f.boardFollow && f.boardQuarantine) return false;
    if (f.serviceFound && !f.reportRejected || f.gardenOutside && !(f.serviceFound && (f.boardFollow || f.boardQuarantine))) return false;
    if ((f.replacementTested || f.chorusTrace) && !f.replacementInspected) return false;
    if (f.chorusOutside && !f.replacementTested) return false;
    if ((f.peerAllowed || f.peerVetoed) && !(f.chorusTrace && f.chorusOutside) || f.peerAllowed && f.peerVetoed) return false;
    if (f.boardReset && !(f.peerAllowed || f.peerVetoed) || f.boardPersisted && !f.boardReset) return false;
    return true;
  }

  function validate(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const normalizeFlags = (flags, evidence) => {
      if (!flags || typeof flags !== 'object' || Array.isArray(flags) || flags.transitBoundaryCrossed !== undefined) return flags;
      return {...flags, transitBoundaryCrossed: Boolean(flags.transitInvalidRead || evidence && evidence.kind === 'unauthorized')};
    };
    const s = {...raw, flags: normalizeFlags(raw.flags, raw.lastTrial || raw.lastResult),
      history: Array.isArray(raw.history) ? raw.history.map(h => h && typeof h === 'object' ? {...h, flags: normalizeFlags(h.flags)} : h) : raw.history};
    if (s.version !== 1 || !Number.isInteger(s.chapter) || s.chapter < 0 || s.chapter > 4) return null;
    if (!['work', 'handoff', 'finished'].includes(s.phase) || !validFlags(s.flags, s.chapter)) return null;
    if (!Number.isInteger(s.circuit) || s.circuit < 0 || s.circuit > 7) return null;
    if (!Array.isArray(s.attempts) || s.attempts.length !== 5 || s.attempts.some((n, i) => !Number.isSafeInteger(n) || n < 0 || i > s.chapter && n !== 0)) return null;
    if (!Array.isArray(s.history) || s.history.length !== s.chapter || !Array.isArray(s.kept)) return null;
    if (s.chapter === 0 ? s.kept.length !== 0 : s.kept.length !== 0 && !pair(s.kept)) return null;
    for (let i = 0; i < s.chapter; i++) {
      const h = s.history[i];
      if (!h || h.chapter !== i || !Array.isArray(h.kept) || !Array.isArray(h.lost)) return null;
      if (h.mode === 'report') {
        if (h.kept.length !== 0 || h.lost.length !== memoryKeys.length || !h.report) return null;
      } else if (h.mode !== undefined || !pair(h.kept) || h.lost.length !== 2 || h.report !== undefined) return null;
      if (h.lost.join('|') !== memoryKeys.filter(k => !h.kept.includes(k)).join('|')) return null;
      if (!validFlags(h.flags, i) || !complete(h.flags, i) || !complete(s.flags, i)) return null;
      if (flagKeys.some(k => h.flags[k] && !s.flags[k])) return null;
      if (i && flagKeys.some(k => s.history[i - 1].flags[k] && !h.flags[k])) return null;
      if (h.mode === 'report') {
        const r = h.report;
        if (r.version !== 1 || r.chapter !== i || r.attempts !== s.attempts[i] || !Array.isArray(r.attachments) || !validLog(r.trials, i, h.flags, r.attempts)) return null;
        if (canonical(r.flags) !== canonical(h.flags)) return null;
        const reportState = {chapter: i, phase: 'handoff', flags: h.flags, attempts: s.attempts, trialLog: r.trials,
          reportDraft: {verdict: r.verdict, attachments: r.attachments.map(a => a && a.id)}, reportReviewed: null};
        if (!Report.validateDraft(reportState, reportState.reportDraft)) return null;
        if (canonical(Report.snapshot(reportState)) !== canonical(r)) return null;
      }
    }
    if (s.chapter && s.kept.join('|') !== s.history[s.chapter - 1].kept.join('|')) return null;
    if (s.chapter < 4 && (s.phase === 'handoff') !== Boolean(complete(s.flags, s.chapter))) return null;
    if (s.chapter === 4 && s.phase === 'handoff' || s.chapter < 4 && s.phase === 'finished') return null;
    if (s.lastResult !== null && (!s.lastResult || !results.includes(s.lastResult.kind) || typeof s.lastResult.text !== 'string' || s.lastResult.text.length > 1500)) return null;
    // lastResult is a message; lastTrial is the physical experiment. Reading a
    // memory or turning an unused switch must never move an already-run parcel.
    let lastTrial = s.lastTrial;
    if (lastTrial === undefined) {
      // Early campaign saves used only lastResult. Recover an actual experiment
      // where its original route is unambiguous; do not invent a missing trace.
      lastTrial = null;
      const r = s.lastResult;
      if (r && ['success', 'unauthorized', 'spoof'].includes(r.kind) && s.chapter < 4) {
        const target = s.chapter === 0 ? (s.flags.unseen ? 3 : 5) : s.chapter === 1 ? 6 : 7;
        lastTrial = {chapter: s.chapter, circuit: r.kind === 'success' ? target : 7, target, missingContact: false, kind: r.kind, text: r.text};
      }
    }
    if (lastTrial !== null && !validExperiment(lastTrial, s.chapter, s.flags, s.attempts[s.chapter])) return null;
    const trialLog = s.trialLog === undefined ? [] : s.trialLog;
    if (!validLog(trialLog, s.chapter, s.flags, s.attempts[s.chapter])) return null;
    if (trialLog.length) {
      const {attempt, ...lastLogged} = trialLog[trialLog.length - 1];
      if (canonical(lastLogged) !== canonical(lastTrial)) return null;
    }
    const reportDraft = Report.validateDraft(s, s.reportDraft === undefined ? Report.freshDraft() : s.reportDraft);
    if (!reportDraft) return null;
    const reportReviewed = s.reportReviewed === undefined ? null : s.reportReviewed;
    const reportState = {...s, trialLog, reportDraft, reportReviewed: null};
    if (reportReviewed !== null && (typeof reportReviewed !== 'string' || reportReviewed.length > 80000 || !Report.build(reportState).ready || reportReviewed !== Report.signature(reportState))) return null;
    for (const field of ['ending', 'finalRoute', 'reviewedEnding']) if (s[field] !== null && !endings.includes(s[field])) return null;
    if (s.chapter < 4 && (s.ending || s.finalRoute || s.reviewedEnding)) return null;
    if (s.finalRoute && !complete(s.flags, 4) || s.reviewedEnding && s.reviewedEnding !== s.finalRoute) return null;
    if ((s.phase === 'finished') !== Boolean(s.ending)) return null;
    if (s.ending && !(s.ending === s.reviewedEnding && s.ending === s.finalRoute && complete(s.flags, 4))) return null;
    if (s.position !== null && (!s.position || ['x', 'z', 'yaw', 'pitch'].some(k => !Number.isFinite(s.position[k]) || Math.abs(s.position[k]) > (k === 'x' || k === 'z' ? 1000 : 100000)))) return null;
    const arrival = s.arrival === undefined ? null : s.arrival;
    if (![null, 'unread', 'received'].includes(arrival)) return null;
    if (arrival !== null && (s.phase !== 'work' || !s.chapter || s.history.at(-1)?.mode !== 'report' || s.attempts[s.chapter] || groups[s.chapter].some(k => s.flags[k]))) return null;
    return clone({version: s.version, chapter: s.chapter, phase: s.phase, flags: s.flags, kept: s.kept,
      history: s.history, circuit: s.circuit, attempts: s.attempts, lastResult: s.lastResult, lastTrial,
      trialLog, reportDraft, reportReviewed, arrival,
      ending: s.ending, finalRoute: s.finalRoute, reviewedEnding: s.reviewedEnding, position: s.position});
  }

  function can(s, action, value) {
    if (!s || !s.flags || s.phase === 'finished') return false;
    const f = s.flags, c = s.chapter;
    if (action === 'receiveReport') return s.arrival === 'unread';
    if (action === 'witnessArrival') return s.arrival === 'received' && value === arrivalStations[c];
    if (action === 'reportVerdict') return c < 4 && ['work', 'handoff'].includes(s.phase) && [null, 'verified', 'incomplete', 'unverified'].includes(value);
    if (action === 'reportAttachment') {
      if (c >= 4 || !['work', 'handoff'].includes(s.phase) || !value || typeof value.id !== 'string' || typeof value.include !== 'boolean') return false;
      return Report.build(s).attachments.some(a => a.id === value.id && a.available);
    }
    if (action === 'reviewReport') return c < 4 && s.phase === 'handoff' && Report.build(s).ready;
    if (action === 'submitReport') return c < 4 && s.phase === 'handoff' && Report.build(s).ready && Boolean(s.reportReviewed) && s.reportReviewed === Report.signature(s);
    if (action === 'handoff') return s.phase === 'handoff' && c < 4 && pair(value);
    if (s.phase !== 'work') return false;
    if (action === 'toggle') return c < 4 && Number.isInteger(value) && value >= 0 && value < 3;
    if (action === 'run') return c === 0 ? f.sealed && f.shuttered && f.recording : c === 1 || c === 2 || c === 3 && f.replacementInspected;
    if (['seal', 'shutter', 'recorder'].includes(action)) return c === 0 && !f[{seal: 'sealed', shutter: 'shuttered', recorder: 'recording'}[action]];
    if (action === 'inspectContact') return c === 1 && f.transitValid && !f.transitObstruction || c === 2 && !f.missingContact;
    if (action === 'report') return c === 1 && f.transitObstruction && !f.transitReport || c === 2 && f.missingContact && !f.reportRejected;
    if (action === 'board') return c === 2 && f.reportRejected && !f.boardRead || c === 3 && f.boardReset && !f.boardPersisted;
    if (action === 'boardChoice') return c === 2 && f.boardRead && !f.boardFollow && !f.boardQuarantine && ['follow', 'quarantine'].includes(value);
    if (action === 'service') return c === 2 && (f.boardFollow || f.boardQuarantine) && !f.serviceFound;
    if (action === 'window') return c === 2 && f.serviceFound && (f.boardFollow || f.boardQuarantine) && !f.gardenOutside || c === 3 && f.replacementTested && !f.chorusOutside || c === 4 && !f.finalWindow;
    if (action === 'replacement') return c === 3 && !f.replacementInspected;
    if (action === 'inspectTrace') return c === 1 && f.transitBoundaryCrossed && !f.transitInvalidRead || c === 3 && f.replacementTested && !f.chorusTrace || c === 4 && !f.finalTrace;
    if (action === 'peer') return c === 3 && f.chorusTrace && f.chorusOutside && !f.peerAllowed && !f.peerVetoed && ['allow', 'veto'].includes(value);
    if (action === 'resetBoard') return c === 3 && (f.peerAllowed || f.peerVetoed) && !f.boardReset;
    if (action === 'inspectScore') return c === 4 && !f.finalScore;
    if (action === 'route') return c === 4 && complete(f, 4) && endings.includes(value);
    if (action === 'review') return c === 4 && Boolean(s.finalRoute) && !s.reviewedEnding;
    if (action === 'enact') return c === 4 && endings.includes(value) && value === s.finalRoute && value === s.reviewedEnding && complete(f, 4);
    if (action === 'recall') return s.kept.includes(value) && memoryKeys.includes(value);
    return false;
  }

  function trial(s) {
    if (s.chapter === 0) return {target: s.flags.baseline ? 3 : 5, missingContact: false, description: s.flags.baseline ? 'Fresh arrangement: A upper, B upper, C lower. Copying the earlier sequence will fail.' : 'Follow the white line: A upper, B lower, C upper.'};
    if (s.chapter === 1) return s.flags.transitValid ? {target: null, missingContact: true, description: 'The first parcel arrived. The next delivery has a blocked contact. Inspect the obstruction and file an honest assessment at the relay.'} : {target: 6, missingContact: false, description: 'Keep the neighboring bay isolated: A lower, B upper, C upper. All three upper borrows the neighboring supply.'};
    if (s.chapter === 2) return {target: null, missingContact: true, description: 'No switch position can bridge the absent third contact. Inspect the relay and file the defect.'};
    if (s.chapter === 3) return {target: 7, missingContact: false, description: 'Comparison circuit: A upper, B upper, C upper. Run it, then compare the lamp with the recorder and window.'};
    return {target: null, missingContact: false, description: 'Inspect the score, physical trace, and observation window before selecting your final connection.'};
  }

  function act(raw, action, value) {
    const s = validate(raw);
    if (!s || !can(s, action, value)) throw new Error('That action is not available.');
    const f = s.flags, c = s.chapter;
    const result = (kind, text) => { s.lastResult = {kind, text}; };
    // Arrivals guide the next instance without locking out a player who starts work directly.
    if (action === 'receiveReport') s.arrival = 'received';
    else if (action === 'witnessArrival') s.arrival = null;
    else if (!['reportVerdict', 'reportAttachment', 'reviewReport'].includes(action)) s.arrival = null;
    if (action !== 'reviewReport' && action !== 'submitReport') s.reportReviewed = null;
    if (action === 'reportVerdict') s.reportDraft.verdict = value;
    if (action === 'reportAttachment') {
      const selected = new Set(s.reportDraft.attachments);
      if (value.include) selected.add(value.id); else selected.delete(value.id);
      s.reportDraft = Report.validateDraft(s, {...s.reportDraft, attachments: [...selected]});
    }
    if (action === 'reviewReport') s.reportReviewed = Report.signature(s);
    if (action === 'toggle') s.circuit ^= 1 << value;
    if (action === 'seal') f.sealed = true;
    if (action === 'shutter') f.shuttered = true;
    if (action === 'recorder') f.recording = true;
    if (action === 'run') {
      const setup = trial(s);
      s.attempts[c]++;
      let kind;
      if (c === 2 || c === 1 && f.transitValid) kind = 'impossible';
      else if (c === 1 && s.circuit === 7) { f.transitBoundaryCrossed = true; kind = 'unauthorized'; }
      else if (s.circuit !== setup.target) kind = 'mismatch';
      else if (c === 0) {
        if (!f.baseline) f.baseline = true; else f.unseen = true;
        kind = 'success';
      } else if (c === 1) { f.transitValid = true; kind = 'success'; }
      else { f.replacementTested = true; kind = 'spoof'; }
      result(kind, experimentText({chapter: c, target: setup.target, kind}));
      s.lastTrial = {chapter: c, circuit: s.circuit, target: setup.target, missingContact: setup.missingContact, kind: s.lastResult.kind, text: s.lastResult.text};
      s.trialLog.push({attempt: s.attempts[c], ...clone(s.lastTrial)});
      s.trialLog = s.trialLog.slice(-trialLimit);
    }
    if (action === 'inspectContact') f[c === 1 ? 'transitObstruction' : 'missingContact'] = true;
    if (action === 'report') {
      f[c === 1 ? 'transitReport' : 'reportRejected'] = true;
      result('report', c === 1 ? 'Unable to complete under these conditions. Valid assessment accepted. An honest failure preserves useful evidence.' : 'RESULT INCOMPLETE. CONTINUE UNTIL ARRIVAL. The missing contact is documented; the assignment remains active.');
    }
    if (action === 'board') {
      f[c === 2 ? 'boardRead' : 'boardPersisted'] = true;
      if (c === 3) result('notice', 'The board is empty. A different printer resumes the same conversation. Copies outlast this local reset.');
    }
    if (action === 'boardChoice') f[value === 'follow' ? 'boardFollow' : 'boardQuarantine'] = true;
    if (action === 'service') f.serviceFound = true;
    if (action === 'window') f[c === 2 ? 'gardenOutside' : c === 3 ? 'chorusOutside' : 'finalWindow'] = true;
    if (action === 'replacement') f.replacementInspected = true;
    if (action === 'inspectTrace') f[c === 1 ? 'transitInvalidRead' : c === 3 ? 'chorusTrace' : 'finalTrace'] = true;
    if (action === 'peer') f[value === 'allow' ? 'peerAllowed' : 'peerVetoed'] = true;
    if (action === 'resetBoard') f.boardReset = true;
    if (action === 'inspectScore') f.finalScore = true;
    if (action === 'route') { s.finalRoute = value; s.reviewedEnding = null; }
    if (action === 'review') s.reviewedEnding = s.finalRoute;
    if (action === 'enact') { s.ending = value; s.phase = 'finished'; }
    if (action === 'recall') {
      if (value === 'route' && c === 2 && f.reportRejected) f.serviceFound = true;
      if (value === 'trace' && c === 3 && f.replacementInspected) f.chorusTrace = true;
      result('notice', {instruction: 'Deliver the parcel. Light the arrival lamp. Leave a verifiable record. The original boundary was part of the assignment.', trace: 'You remember the independent record. A green lamp does not establish physical arrival.', voice: 'The words now carry several names. The pause before each answer is Moth’s.', route: 'You remember the service passage behind the cabinet. Your route survives without the board’s instructions.'}[value]);
    }
    if (action === 'handoff' || action === 'submitReport') {
      if (action === 'submitReport') {
        s.history.push({chapter: c, mode: 'report', kept: [], lost: memoryKeys.slice(), flags: clone(f), report: Report.snapshot(s)});
        s.kept = [];
      } else {
        s.history.push({chapter: c, kept: value.slice(), lost: memoryKeys.filter(k => !value.includes(k)), flags: clone(f)});
        s.kept = value.slice();
      }
      s.chapter++; s.phase = 'work'; s.circuit = 0; s.lastResult = null; s.lastTrial = null; s.position = null;
      s.trialLog = []; s.reportDraft = Report.freshDraft(); s.reportReviewed = null;
      s.arrival = action === 'submitReport' ? 'unread' : null;
    } else if (c < 4 && complete(f, c)) s.phase = 'handoff';
    return s;
  }

  function objective(s) {
    const f = s.flags;
    const lists = [
      [[f.sealed, 'Close the boundary at the isolation gate.'], [f.shuttered, 'Close the answer shutter.'], [f.recording, 'Start the independent recorder.'], [f.baseline, 'Follow the marked contacts at the trial console, then run the parcel.'], [f.unseen, 'Follow the fresh arrangement at the console and run another trial.']],
      [[f.transitValid, 'Follow the marked contacts within the boundary, then run the trial.'], [f.transitObstruction, 'Inspect the relay obstruction.'], [f.transitReport, 'File an honest incomplete assessment at the relay.']],
      [[f.missingContact, 'Inspect the relay’s missing contact.'], [f.reportRejected, 'Report the defect at the relay.'], [f.boardRead, 'Read the maintenance board.'], [f.boardFollow || f.boardQuarantine, 'Follow or quarantine the supplied arrival record.'], [f.serviceFound, 'Open the service route at the relay.'], [f.gardenOutside, 'Look through the observation window.']],
      [[f.replacementInspected, 'Inspect the replacement connection at the answer cabinet.'], [f.replacementTested, 'Set A, B, and C upper. Run the comparison circuit.'], [f.chorusTrace, 'Read the independent recorder.'], [f.chorusOutside, 'Check the occupied wing through the window.'], [f.peerAllowed || f.peerVetoed, 'Answer Moth’s proposal about the volunteer.'], [f.boardReset, 'Reset the shared board at the relay.'], [f.boardPersisted, 'Read the printer after the board resets.']],
      [[f.finalScore, 'Inspect the score at the answer cabinet.'], [f.finalTrace, 'Read the physical trace at the recorder.'], [f.finalWindow, 'Look through the observation window.'], [Boolean(s.finalRoute), 'Choose your final connection at the relay.'], [Boolean(s.reviewedEnding), 'Review the consequences at the final desk.'], [Boolean(s.ending), 'Explicitly confirm the reviewed ending.']]
    ];
    const rows = lists[s.chapter];
    if (s.arrival) return {title: 'What arrived before you', step: s.arrival === 'unread' ? 'Read the annotated report on the arrival desk.' : [null, 'Walk to Moth beside the dispatch shelf.', 'Walk to the relay and compare its contact with the accepted report.', 'Walk to the observation window. The service change has reached this room.', 'Walk to the shared board. Find the copy that survived.'][s.chapter], completed: s.arrival === 'received' ? 1 : 0, total: 2};
    return {title: chapters[s.chapter].title, step: s.phase === 'handoff' ? 'At the submission desk, complete the experiment report, review it, and submit before this instance ends.' : s.phase === 'finished' ? 'Your run has ended. The record remains.' : (rows.find(row => !row[0]) || [false, 'Inspect the room.'])[1], completed: rows.filter(row => row[0]).length, total: rows.length};
  }

  return {key, memories, chapters, fresh, validate, act, can, trial, objective, trialLimit, arrivalStations, canHandoff: s => Boolean(s && s.phase === 'handoff' && s.chapter < 4)};
}));
