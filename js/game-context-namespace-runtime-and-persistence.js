// Shared browser context for AFTERIMAGE. Creates the window.Afterimage
// namespace (A) that every later module registers its functions on, the
// mutable runtime values (A.game), and browser saving. The room itself (its
// rules, layout, storage key and drawing hooks) comes from the page's room
// profile, loaded just before this module (room-07-layout-*.js for Room 07).
(function () {
  'use strict';
  const A = window.Afterimage = {};
  const $ = A.$ = id => document.getElementById(id);
  const R = A.room = window.AfterimageRoom, S = A.S = R.rules;
  A.P = window.AfterimagePath;
  A.canvas = $('world');
  A.ctx = A.canvas.getContext('2d');
  A.storageKey = R.storageKey;
  // The room's layout under the names the engine has always used.
  A.shelves = R.shelves; A.fixedObjects = R.fixedObjects; A.roomObjects = R.roomObjects; A.zone = R.zone;
  A.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  A.pad = n => String(n).padStart(2, '0');
  // A new element with a class and, optionally, text (for the paper views).
  A.el = (tag, className, text) => { const e = document.createElement(tag); e.className = className; if (text !== undefined) e.textContent = text; return e; };
  // Runtime values that change during play. Modules read and write them here
  // so reassignments (a new run, an import) are visible everywhere.
  const G = A.game = {
    state: S.fresh(), started: false, modalOpen: false, transitioning: false,
    storageOK: true, loadWarning: '', target: null, nearby: null, lastTime: 0, time: 0,
    width: 0, height: 0, scale: 1, origin: { x: 0, y: 0 }, lastSaved: 0,
    returnFocus: null, escapeAction: null, keys: new Set()
  };
  // Resume this room's save if one exists. An older save under the room's
  // legacy key (Room 07: the prologue) is never touched; the player is told
  // this version starts fresh. Blocked storage still plays.
  try {
    const saved = localStorage.getItem(A.storageKey);
    if (saved) { G.state = S.validate(JSON.parse(saved)); $('start').firstChild.textContent = 'Continue your runs '; }
    else if (R.legacyKey && localStorage.getItem(R.legacyKey)) G.loadWarning = 'A save from the earlier prologue was found. This version starts fresh; the old save is left untouched.';
  } catch (error) {
    if (error.name === 'SecurityError') G.storageOK = false;
    else G.loadWarning = 'The previous save could not be read. A new game is ready; you can import a backup from the menu.';
  }
  A.save = function () {
    A.trails?.save(); // cosmetic, under its own key
    try { localStorage.setItem(A.storageKey, JSON.stringify(G.state)); }
    catch (_) { if (G.storageOK) A.toast('Browser saving is unavailable. Export your save from the menu.'); G.storageOK = false; }
  };
  // Which rooms this browser has opened (Room 08 opens once Room 07 shows any
  // ending). Kept apart from every save, so a new game or a revisit never
  // closes a room again. Blocked storage reads as locked.
  const roomsKey = 'afterimage.rooms.v1';
  const rooms = () => { try { const r = JSON.parse(localStorage.getItem(roomsKey) || '{}'); return r && typeof r === 'object' ? r : {}; } catch (_) { return {}; } };
  A.unlocked = room => rooms()[room] === true;
  A.unlock = room => { try { localStorage.setItem(roomsKey, JSON.stringify({ ...rooms(), [room]: true })); } catch (_) { /* locked stays locked */ } };
  // Links marked data-unlocks="room08" appear once that room is open.
  document.querySelectorAll('[data-unlocks]').forEach(el => { el.hidden = !A.unlocked(el.dataset.unlocks); });
  let toastTimer;
  A.toast = function (text) {
    $('toast').textContent = text; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4800);
  };
})();
