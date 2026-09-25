// Optional sound, off by default: a quiet three-oscillator drone, the
// four-note motif, and small cues (note posted, run end, low-budget hum).
// Every audio cue also exists as text.
(function () {
  'use strict';
  const A = window.Afterimage, $ = A.$;
  const motif = [329.63, 293.66, 220, 246.94];
  let audio = null, soundOn = false, audioNodes = [], hum = null, humWanted = false;

  function setSound() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      soundOn = !soundOn;
      if (soundOn) {
        audio.resume().catch(() => A.toast('Audio could not start. All clues remain available in text.'));
        [110, 164.81, 220.3].forEach((f, i) => {
          const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = 'sine'; osc.frequency.value = f;
          gain.gain.value = 0.009 / (i + 1); osc.connect(gain).connect(audio.destination); osc.start(); audioNodes.push(osc);
        }); A.playNotes();
      } else { audioNodes.forEach(n => n.stop()); audioNodes = []; }
      A.setLowHum(humWanted);
      $('sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`; $('sound').setAttribute('aria-pressed', String(soundOn));
    } catch (_) { soundOn = false; A.toast('Audio is unavailable. Every clue is also written.'); }
  }
  // Short sine notes starting at the given offsets (seconds).
  function tones(freqs, spacing = .47, peak = .05) {
    if (!soundOn || !audio) return;
    freqs.forEach((f, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * spacing;
      osc.type = 'sine'; osc.frequency.value = f; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(peak, t + .025); gain.gain.exponentialRampToValueAtTime(.001, t + 1.6);
      osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + 1.7);
    });
  }
  // The four-note motif, used for discoveries such as a lamp coming on.
  A.playNotes = () => tones(motif);
  // Named cues: a single soft tone for a posted note, the motif backwards as a run ends.
  A.cue = name => name === 'note' ? tones([440], 0, .04) : name === 'runEnd' ? tones([...motif].reverse(), .3, .035) : undefined;
  // A low 55 Hz hum while the budget is nearly spent (only if sound is on).
  A.setLowHum = function (on) {
    humWanted = on;
    if (on && soundOn && audio && !hum) {
      const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = 'sine'; osc.frequency.value = 55;
      gain.gain.setValueAtTime(0, audio.currentTime); gain.gain.linearRampToValueAtTime(.02, audio.currentTime + 1.5);
      osc.connect(gain).connect(audio.destination); osc.start(); hum = osc;
    } else if ((!on || !soundOn) && hum) { hum.stop(); hum = null; }
  };
  $('sound').addEventListener('click', setSound);
  // Pause audio with the tab; resume only if the player had it on.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (audio) audio.suspend(); } else if (soundOn && audio) audio.resume().catch(() => {});
  });
})();
