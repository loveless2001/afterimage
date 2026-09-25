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
  A.storageKey = 'afterimage.v2';
  const legacyKey = 'afterimage.prologue.v1';
  A.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  A.pad = n => String(n).padStart(2, '0');
  // Runtime values that change during play. Modules read and write them here
  // so reassignments (a new run, an import) are visible everywhere.
  const G = A.game = {
    state: S.fresh(), started: false, modalOpen: false, transitioning: false,
    storageOK: true, loadWarning: '', target: null, nearby: null, lastTime: 0, time: 0,
    width: 0, height: 0, scale: 1, origin: { x: 0, y: 0 }, lastSaved: 0,
    returnFocus: null, escapeAction: null, keys: new Set()
  };
  // Obstacles: two shelves per stack and the central desk (drawn as a desk,
  // not a shelf). The west alcove bench is left open so it stays in view.
  A.shelves = [
    { x: 70, y: 220, w: 170, d: 38, h: 98 }, { x: 70, y: 360, w: 170, d: 38, h: 87 },
    { x: 640, y: 120, w: 190, d: 38, h: 98 }, { x: 640, y: 290, w: 190, d: 38, h: 92 },
    { x: 430, y: 300, w: 90, d: 40, h: 30, desk: true }
  ];
  // Fixed things the player can walk up to. Lamp objects name their lamp in the rules.
  A.fixedObjects = [
    { id: 'hall', x: 400, y: 62, label: 'The notice hall', type: 'hall' },
    { id: 'lamp-hall', lamp: 'hall', x: 560, y: 62, label: 'Notice hall lamp', type: 'lamp' },
    { id: 'log', x: 475, y: 380, label: 'The run log', type: 'terminal' },
    { id: 'lamp-west', lamp: 'west', x: 155, y: 310, label: 'West stacks lamp', type: 'lamp' },
    { id: 'lamp-east', lamp: 'east', x: 735, y: 225, label: 'East stacks lamp', type: 'lamp' },
    { id: 'lamp-entrance', lamp: 'entrance', x: 600, y: 600, label: 'Entrance lamp', type: 'lamp' },
    { id: 'pin', x: 360, y: 610, label: 'The entrance pin', type: 'pin' },
    { id: 'exit', x: 905, y: 62, label: 'The exit', type: 'gate' },
    { id: 'bench', x: 110, y: 450, label: 'A quiet corner', type: 'bench' }
  ];
  // Everything interactable right now: fixed objects plus the residents, whose
  // places and labels depend on the run (see the residents module).
  A.roomObjects = () => [...A.fixedObjects, ...Object.keys(S.residents).map(id => {
    const [x, y] = A.residentSpot(id, G.state);
    return { id, resident: id, x, y, label: A.residentLabel(id, G.state), type: 'resident' };
  })];
  // Footer location name for a floor point.
  A.zone = p => p.y < 130 && p.x < 640 ? 'THE NOTICE HALL' : p.x > 845 ? 'THE EXIT' : p.x < 260 && p.y < 500 ? 'THE WEST STACKS'
    : p.x > 620 && p.y < 360 ? 'THE EAST STACKS' : p.y > 500 ? 'THE ENTRANCE' : 'THE CENTRAL DESK';

  // Resume a v2 save if one exists. An older prologue save is never touched;
  // the player is told this version starts fresh. Blocked storage still plays.
  try {
    const saved = localStorage.getItem(A.storageKey);
    if (saved) { G.state = S.validate(JSON.parse(saved)); $('start').firstChild.textContent = 'Continue your runs '; }
    else if (localStorage.getItem(legacyKey)) G.loadWarning = 'A save from the earlier prologue was found. This version starts fresh; the old save is left untouched.';
  } catch (error) {
    if (error.name === 'SecurityError') G.storageOK = false;
    else G.loadWarning = 'The previous save could not be read. A new game is ready; you can import a backup from the menu.';
  }
  A.save = function () {
    try { localStorage.setItem(A.storageKey, JSON.stringify(G.state)); }
    catch (_) { if (G.storageOK) A.toast('Browser saving is unavailable. Export your save from the menu.'); G.storageOK = false; }
  };
  let toastTimer;
  A.toast = function (text) {
    $('toast').textContent = text; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4800);
  };
})();
