// Optional sound, off by default: a quiet three-oscillator drone and the
// four-note receiver motif. Every audio cue also exists as text.
(function () {
  'use strict';
  const A = window.Afterimage, $ = A.$;
  let audio = null, soundOn = false, audioNodes = [];

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
      $('sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`; $('sound').setAttribute('aria-pressed', String(soundOn));
    } catch (_) { soundOn = false; A.toast('Audio is unavailable. Every clue is also written.'); }
  }
  // The receiver's melody; silent unless the player turned sound on.
  A.playNotes = function () {
    if (!soundOn || !audio) return;
    [329.63, 293.66, 220, 246.94].forEach((f, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * .47;
      osc.type = 'sine'; osc.frequency.value = f; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.05, t + .025); gain.gain.exponentialRampToValueAtTime(.001, t + 1.6);
      osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + 1.7);
    });
  };
  $('sound').addEventListener('click', setSound);
  // Pause audio with the tab; resume only if the player had it on.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (audio) audio.suspend(); } else if (soundOn && audio) audio.resume().catch(() => {});
  });
})();
