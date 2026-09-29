// Room 07's own drawing, hooked into the shared renderer through A.room: the
// three residents (shapes, what each holds, and the warmth trust gives them),
// the notice wall and its cards, lamps, the notice hall, the pin board, the
// alcove bench, the room's light (a dimmer room for every dark lamp, warm
// pools for lit ones), and what endings leave behind: a closed log on the
// desk, a wall of cards kept blue, every pool brighter.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx, draw = A.drawRoom;
  const { project, polygon, line, box, label, lightPool } = A;
  // Pell is tall and thin, Juno low and wide, Wren hunched over the log. `warm`
  // is where trust takes each one (see warmthOf); blue stays for notes.
  Object.assign(draw.looks, {
    wren: { body: '#69745f', rings: '#bbc5a6', warm: '#8c7a4e', top: 60, half: 17, lean: 7 },
    juno: { body: '#7d6b4c', rings: '#d8c9a3', warm: '#a06c3c', top: 58, half: 21, lean: 0 },
    pell: { body: '#566a7a', rings: '#cfd0c2', warm: '#84677a', top: 76, half: 13, lean: 0 }
  });
  // What each resident holds, matching how strangers are labelled: Wren's log and
  // the pencil behind one ear, Juno's unlit lantern, and the card Pell is reading.
  const at = (c, s, dx, dy) => ({ x: c.x + dx * s, y: c.y + dy * s });
  Object.assign(draw.props, {
    wren(x, y, b, s) {
      // The log lies open and flat on Wren's arm, in the red of the closed log on the desk.
      const flat = (x0, y0, x1, y1, z) => [project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)], z = 24 + b, head = project(x + 7, y + 7, 60 + b);
      polygon(flat(x + 4, y + 10, x + 28, y + 24, z), '#7b4236');
      polygon(flat(x + 6, y + 12, x + 16, y + 22, z + 1), '#efe8cf'); polygon(flat(x + 16, y + 12, x + 26, y + 22, z + 1), '#e4dcc0');
      line([project(x + 16, y + 12, z + 1), project(x + 16, y + 22, z + 1)], '#7b4236', .8);
      line([at(head, s, 3, 6), at(head, s, 12, 1)], '#c9a247', 1.8 * s);
    },
    juno(x, y, b, s) {
      line([project(x - 19, y + 2, 30 + b), project(x - 14, y + 14, 30 + b), project(x - 14, y + 14, 22 + b)], '#5e5038', 1.2 * s);
      box(x - 18, y + 10, 8, 8, 10, ['#e6d9a8', '#b9a26c', '#cdb883'], 10 + b);
      box(x - 18, y + 10, 8, 8, 2, ['#9c8552', '#6d5c38', '#7f6b42'], 20 + b);
    },
    pell(x, y, b, s) {
      const c = project(x + 16, y - 8, 50 + b);
      polygon([at(c, s, -4, -6), at(c, s, 5, -7), at(c, s, 5, 5), at(c, s, -4, 6)], '#e4dcc4', '#7f7458');
      for (let i = 0; i < 3; i++) line([at(c, s, -2, -3 + i * 3), at(c, s, 3 - i, -3.5 + i * 3)], '#7f7458aa', .8);
    }
  });
  // Trust warms a resident: a first step when they trust you, one more for each
  // answer, so 0 (not trusted) then 1/4 up to 1. Like trust, it never goes back.
  // The body and rings shift warm with the figure; the glow is drawn with the light pools.
  const warmthOf = (state, id) => S.isTrusted(state, id) ? (1 + state.answers.filter(a => a.id === id).length) / 4 : 0;
  // Where a notice-wall card sits: twelve per row, the top row (slots 0–11) first.
  const slotAt = slot => ({ x: 250 + (slot % 12) * 33, z: 79 - Math.floor(slot / 12) * 34 });

  // Two rows of twelve card holders on the back wall, filled by posted notes.
  // This run's cards are blue (all of them, once the wall ending keeps them);
  // cards Pell found are old paper: someone else's, never blue.
  function noticeWall(state) {
    polygon([project(238, 0, 35), project(652, 0, 35), project(652, 0, 113), project(238, 0, 113)], '#c9cfbbd0', '#a9b39d');
    const bySlot = new Map(state.notes.filter(n => n.slot !== null).map(n => [n.slot, n]));
    for (let slot = 0; slot < S.wallSlots; slot++) {
      const { x, z } = slotAt(slot), note = bySlot.get(slot);
      if (note) draw.card(x, 0, z, note.run === state.run || state.ending === 'wall', !S.postedByYou(note));
      else polygon([project(x, 0, z), project(x + 24, 0, z), project(x + 24, 0, z + 24), project(x, 0, z + 24)], '#dfe2d3', '#aab39c');
    }
    label('NOTICE HALL', 445, 0, 122, '#71806199', 10);
  }
  // Room 07's object types (the gate and terminal are shared furniture).
  function drawObject(o) {
    const state = G.state;
    if (o.type === 'resident') draw.agent(o.x, o.y, o.resident, warmthOf(state, o.resident));
    if (o.type === 'hall') box(o.x - 22, o.y - 8, 44, 16, 18, ['#c9cfbb', '#8f9c83', '#a9b39b']);
    if (o.type === 'bench') { box(o.x - 34, o.y - 10, 68, 20, 12, ['#b9ae92', '#8f8568', '#a39a7d']); box(o.x - 34, o.y - 14, 68, 5, 30, ['#c4b99c', '#968b6d', '#aca283'], 12); }
    if (o.type === 'pin') {
      box(o.x - 3, o.y - 3, 6, 6, 40, ['#b6bfaa', '#7b8970', '#9aa68e']);
      box(o.x - 20, o.y - 2, 40, 4, 34, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 36);
      if (state.pinned !== null) { draw.card(o.x - 12, o.y + 2, 41, true); const p = project(o.x, o.y + 2, 63); ctx.fillStyle = '#9c4438'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * G.scale, 0, Math.PI * 2); ctx.fill(); }
    }
    if (o.type === 'lamp') {
      const lit = S.isLit(state, o.lamp);
      box(o.x - 6, o.y - 6, 12, 12, 58, ['#b6bfaa', '#7b8970', '#9aa68e']);
      const p = project(o.x, o.y, 66); ctx.fillStyle = lit ? '#f3e2a4' : '#86675b'; ctx.beginPath(); ctx.arc(p.x, p.y, (lit ? 7 : 4) * G.scale, 0, Math.PI * 2); ctx.fill();
    }
  }
  // The record ending closes the log on the central desk.
  const onDesk = s => { if (G.state.ending === 'record') box(s.x + 45, s.y + 10, 28, 20, 6, ['#8a4a3c', '#6d392e', '#7b4236'], s.h); };

  // Warm pools: the desk lamp always, each lit lamp, and the alcove: before the
  // turn it warms one faint step per secret hint heard, from the turn it glows.
  // The lights ending leaves every pool wider and brighter. Trusted residents
  // glow faintly at mid-body, a little more with each answer, so they shine at night.
  function lightPools(state, strength = 1) {
    const kept = state.ending === 'lights', alpha = a => Math.round(Math.min(255, a * strength * (kept ? 1.3 : 1))).toString(16).padStart(2, '0');
    lightPool(475, 330, 190, '#fbf7d6' + alpha(125));
    A.fixedObjects.filter(o => o.type === 'lamp' && S.isLit(state, o.lamp)).forEach(o => lightPool(o.x, o.y, kept ? 200 : 150, '#fbefc2' + alpha(110)));
    const heard = S.hintsHeard(state);
    if (state.run >= S.turnRun || state.ending === 'alcove') lightPool(110, 450, 110, '#f6dca4' + alpha(90));
    else if (heard) lightPool(110, 450, 70 + heard * 15, '#f6dca4' + alpha(30 + heard * 20));
    A.roomObjects().filter(o => o.type === 'resident').forEach(o => {
      const warmth = warmthOf(state, o.resident);
      if (warmth) lightPool(o.x, o.y, 44 + 30 * warmth, '#f4cf8c' + alpha(60 + 80 * warmth), 36);
    });
  }
  // Behind everything else: the notice wall, then every dark lamp dims the
  // room a little and every lit one adds a warm pool.
  function backdrop(state, floor) {
    noticeWall(state);
    const dark = Object.keys(S.lamps).filter(id => !S.isLit(state, id)).length;
    polygon(floor, `rgba(52,60,48,${(dark * .045).toFixed(3)})`);
    lightPools(state);
  }

  Object.assign(A.room, { drawObject, onDesk, lightPools, backdrop, slotAt });
})();
