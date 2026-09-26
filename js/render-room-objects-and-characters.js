// Drawing for the things in the room: shelves, the desk, the notice wall and
// its cards, lamps, the exit, the pin board, the alcove bench, and the ring-
// bodied figures (the player and the three residents). Endings leave traces
// here too: a closed log on the desk, or a wall of cards kept blue.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx;
  const { project, polygon, line, box, label, ring } = A;
  // Body, ring and marker colours per figure. Untrusted rings stay neutral so
  // that blue, the colour of what persists, only ever means trust.
  const looks = {
    player: { body: '#353e34', rings: '#b9c4b1', marker: '#984e40' },
    wren: { body: '#69745f', rings: '#bbc5a6' },
    juno: { body: '#7d6b4c', rings: '#d8c9a3' },
    pell: { body: '#566a7a', rings: '#cfd0c2' }
  };
  const trustedRings = '#a9c3cf';
  // Where a notice-wall card sits: twelve per row, the top row (slots 0–11) first.
  const slotAt = slot => ({ x: 250 + (slot % 12) * 33, z: 79 - Math.floor(slot / 12) * 34 });

  function shelf(s) {
    polygon([project(s.x, s.y + s.d), project(s.x + s.w, s.y + s.d), project(s.x + s.w + 40, s.y + s.d + 53), project(s.x + 40, s.y + s.d + 53)], '#626b5415');
    box(s.x, s.y, s.w, s.d, s.h, ['#b8bcae', '#818979', '#4d584c']);
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < Math.floor(s.w / 13); i++) {
        const bx = s.x + 7 + i * 13, bz = 6 + row * 28, bh = 17 + ((i * 7 + row * 3) % 8);
        const shade = ['#d4d7c9', '#a9b49e', '#c0c7b6', '#8e9e89'][(i + row) % 4];
        box(bx, s.y + s.d - 7, 8, 5, bh, [shade, '#8b9783', shade], bz);
        line([project(bx + 2, s.y + s.d - 1, bz + 6), project(bx + 6, s.y + s.d - 1, bz + 6)], '#55614c', .7);
      }
      line([project(s.x, s.y + s.d, row * 28 + 3), project(s.x + s.w, s.y + s.d, row * 28 + 3)], '#aab2a0', 2 * G.scale);
    }
  }
  // The central desk with its own always-on lamp; the record ending closes the log on it.
  function desk(s) {
    box(s.x, s.y, s.w, s.d, s.h, ['#c8cdbb', '#9ba88c', '#b4bea4']);
    line([project(s.x + 18, s.y + 12, s.h), project(s.x + 18, s.y + 12, s.h + 34)], '#646f5d', 1.4 * G.scale);
    box(s.x + 10, s.y + 6, 16, 12, 7, ['#e9dfb4', '#b9a978', '#cfc294'], s.h + 32);
    if (G.state.ending === 'record') box(s.x + 45, s.y + 10, 28, 20, 6, ['#8a4a3c', '#6d392e', '#7b4236'], s.h);
  }
  // A floating, ring-bodied figure. Only the player carries the red marker;
  // a resident who trusts you wears slightly heavier blue rings.
  function agent(x, y, who = 'player', trusted = false) {
    const look = looks[who], scale = G.scale, time = G.time, phase = Object.keys(looks).indexOf(who) * 1.3;
    const bob = A.reducedMotion ? 0 : Math.sin(time * 1.8 + phase) * 2.5, p = project(x, y), center = project(x, y, 39 + bob);
    ctx.fillStyle = '#3e4d3822'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
    polygon([project(x, y, 66 + bob), project(x + 17, y - 5, 38 + bob), project(x + 15, y + 8, 15 + bob), project(x - 9, y + 10, 10 + bob), project(x - 17, y, 36 + bob)], look.body);
    ctx.save(); ctx.translate(center.x, center.y); ctx.strokeStyle = trusted ? trustedRings : look.rings; ctx.lineWidth = trusted ? .9 : .65;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, (9 + i) * scale, (21 - i) * scale, i * .55 + phase + (A.reducedMotion ? 0 : time * .09), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#f0eacb'; ctx.fillRect(-7 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.fillRect(3 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.restore();
    if (look.marker) { const head = project(x, y, 85); polygon([{ x: head.x, y: head.y + 6 }, { x: head.x - 4, y: head.y }, { x: head.x + 4, y: head.y }], look.marker); }
  }
  // A note card facing the viewer along x: blue for this run (or kept by the wall ending), faded after.
  function card(x, y, z, current) {
    const at = (dx, dz) => project(x + dx, y, z + dz);
    polygon([at(0, 0), at(24, 0), at(24, 24), at(0, 24)], current ? '#5f7a86' : '#33362f38', current ? '#48606b' : '#33362f55');
    for (let i = 0; i < 3; i++) line([at(4, 17 - i * 5), at(20 - i * 4, 17 - i * 5)], current ? '#dfe8ea' : '#f2f0e699', .8);
  }
  // Two rows of twelve card holders on the back wall, filled by posted notes.
  function noticeWall(state) {
    polygon([project(238, 0, 35), project(652, 0, 35), project(652, 0, 113), project(238, 0, 113)], '#c9cfbbd0', '#a9b39d');
    const bySlot = new Map(state.notes.filter(n => n.slot !== null).map(n => [n.slot, n]));
    for (let slot = 0; slot < S.wallSlots; slot++) {
      const { x, z } = slotAt(slot), note = bySlot.get(slot);
      if (note) card(x, 0, z, note.run === state.run || state.ending === 'wall');
      else polygon([project(x, 0, z), project(x + 24, 0, z), project(x + 24, 0, z + 24), project(x, 0, z + 24)], '#dfe2d3', '#aab39c');
    }
    label('NOTICE HALL', 445, 0, 122, '#71806199', 10);
  }
  function object(o) {
    const state = G.state, active = G.nearby?.id === o.id && !G.modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    if (o.type === 'resident') agent(o.x, o.y, o.resident, S.isTrusted(state, o.resident));
    if (o.type === 'hall') box(o.x - 22, o.y - 8, 44, 16, 18, ['#c9cfbb', '#8f9c83', '#a9b39b']);
    if (o.type === 'bench') { box(o.x - 34, o.y - 10, 68, 20, 12, ['#b9ae92', '#8f8568', '#a39a7d']); box(o.x - 34, o.y - 14, 68, 5, 30, ['#c4b99c', '#968b6d', '#aca283'], 12); }
    if (o.type === 'pin') {
      box(o.x - 3, o.y - 3, 6, 6, 40, ['#b6bfaa', '#7b8970', '#9aa68e']);
      box(o.x - 20, o.y - 2, 40, 4, 34, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 36);
      if (state.pinned !== null) { card(o.x - 12, o.y + 2, 41, true); const p = project(o.x, o.y + 2, 63); ctx.fillStyle = '#9c4438'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * G.scale, 0, Math.PI * 2); ctx.fill(); }
    }
    if (o.type === 'terminal') {
      box(o.x - 17, o.y - 12, 34, 24, 27, ['#adb8a0', '#7c8b73', '#9aa58c']);
      box(o.x - 18, o.y - 12, 36, 8, 29, ['#424e3c', '#59664f', '#34432f'], 27);
      for (let i = 0; i < 3; i++) line([project(o.x - 13, o.y - 3, 49 - i * 6), project(o.x + 10 - i * 4, o.y - 3, 49 - i * 6)], '#c8d2b3', G.scale);
    }
    if (o.type === 'lamp') {
      const lit = S.isLit(state, o.lamp);
      box(o.x - 6, o.y - 6, 12, 12, 58, ['#b6bfaa', '#7b8970', '#9aa68e']);
      const p = project(o.x, o.y, 66); ctx.fillStyle = lit ? '#f3e2a4' : '#86675b'; ctx.beginPath(); ctx.arc(p.x, p.y, (lit ? 7 : 4) * G.scale, 0, Math.PI * 2); ctx.fill();
    }
    if (o.type === 'gate') {
      polygon([project(o.x - 30, o.y, 0), project(o.x + 30, o.y, 0), project(o.x + 30, o.y, 140), project(o.x - 30, o.y, 140)], '#efeed8c0', '#8c9b7c');
      box(o.x - 36, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']); box(o.x + 30, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']);
      box(o.x - 36, o.y - 5, 74, 14, 8, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 145);
      label('EXIT', o.x, o.y, 165, '#718061', 11);
    }
    if (active) label(o.label.toUpperCase(), o.x, o.y, o.type === 'gate' ? 183 : 89, '#704c40', 10);
  }

  A.drawRoom = { shelf, desk, agent, noticeWall, object, slotAt };
})();
