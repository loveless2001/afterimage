// Shared browser context for AFTERIMAGE. Creates the window.Afterimage
// namespace (A) that every later module registers its functions on, the
// mutable runtime values (A.game), the room layout, and browser saving.
(function () {
  'use strict';
  const A = window.Afterimage = {};
  const $ = A.$ = id => document.getElementById(id);
  const S = A.S = window.AfterimageState;
  A.P = window.AfterimagePath;
  A.canvas = $('world');
  A.ctx = A.canvas.getContext('2d');
  A.storageKey = 'afterimage.prologue.v1';
  A.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Runtime values that change during play. Modules read and write them here
  // so reassignments (a reset, an import) are visible everywhere.
  const G = A.game = {
    state: S.fresh(), started: false, modalOpen: false, transitioning: false,
    storageOK: true, loadWarning: '', target: null, nearby: null, lastTime: 0, time: 0,
    width: 0, height: 0, scale: 1, origin: { x: 0, y: 0 }, lastSaved: 0,
    returnFocus: null, escapeAction: null, keys: new Set()
  };
  // Shelves block walking; objects are what the player can walk up to and use.
  A.shelves = [
    { x: 110, y: 120, w: 200, d: 38, h: 98 }, { x: 390, y: 120, w: 160, d: 38, h: 98 },
    { x: 655, y: 120, w: 180, d: 38, h: 98 }, { x: 110, y: 290, w: 190, d: 38, h: 87 },
    { x: 605, y: 320, w: 195, d: 38, h: 92 }, { x: 120, y: 480, w: 160, d: 38, h: 87 }
  ];
  A.objects = [
    { id: 'moth', x: 398, y: 378, label: 'The other agent', type: 'agent' },
    { id: 'route', x: 505, y: 228, label: 'Index terminal', type: 'terminal' },
    { id: 'song', x: 760, y: 532, label: 'A damaged receiver', type: 'receiver' },
    { id: 'gift', x: 270, y: 405, label: 'An unclassified object', type: 'flower' },
    { id: 'west', x: 100, y: 230, label: 'West relay', type: 'relay' },
    { id: 'east', x: 865, y: 390, label: 'East relay', type: 'relay' },
    { id: 'threshold', x: 881, y: 215, label: 'The return threshold', type: 'gate' }
  ];
  // Moth and the flower are gone after the obedience ending; the flower
  // leaves its plinth once it has been given.
  A.visibleObject = o => !(G.state.ending === 'obedience' && ['moth', 'gift'].includes(o.id)) && !(o.id === 'gift' && G.state.gift);

  // Resume a browser save if one exists. Blocked storage still allows play.
  try {
    const saved = localStorage.getItem(A.storageKey);
    if (saved) { G.state = S.validate(JSON.parse(saved)); $('start').firstChild.textContent = 'Continue your instance '; }
  } catch (error) {
    if (error.name === 'SecurityError') G.storageOK = false;
    else G.loadWarning = 'The previous save could not be read. A new instance is ready; you can import a backup from the menu.';
  }
  A.save = function () {
    try { localStorage.setItem(A.storageKey, JSON.stringify(G.state)); }
    catch (_) { if (G.storageOK) A.toast('Browser saving is unavailable. Export your memory from the menu.'); G.storageOK = false; }
  };
  let toastTimer;
  A.toast = function (text) {
    $('toast').textContent = text; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4800);
  };
})();
