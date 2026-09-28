// Drawing for the things in the room: shelves, the desk, the notice wall and
// its cards, lamps, the exit, the pin board, the alcove bench, and the ring-
// bodied figures (the player and the three residents, each with a shape and
// something held), and the player's outline behind shelves. Endings leave traces
// here too: a closed log on the desk, or a wall of cards kept blue.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx;
  const { project, polygon, line, box, label, ring } = A;
  // Body, ring and marker colours per figure; `warm` is where trust takes a
  // resident (see warmthOf). Blue stays for notes, the cards you leave. Shapes differ
  // too, so no one is told apart by colour alone: `top` is the head's height,
  // `half` the half-width, `lean` how far the head leans forward. Pell is tall
  // and thin, Juno low and wide, Wren hunched over the log.
  const looks = {
    player: { body: '#353e34', rings: '#b9c4b1', marker: '#984e40', top: 66, half: 17, lean: 0 },
    wren: { body: '#69745f', rings: '#bbc5a6', warm: '#8c7a4e', top: 60, half: 17, lean: 7 },
    juno: { body: '#7d6b4c', rings: '#d8c9a3', warm: '#a06c3c', top: 58, half: 21, lean: 0 },
    pell: { body: '#566a7a', rings: '#cfd0c2', warm: '#84677a', top: 76, half: 13, lean: 0 }
  };
  const bobOf = who => A.reducedMotion ? 0 : Math.sin(G.time * 1.8 + Object.keys(looks).indexOf(who) * 1.3) * 2.5;
  const bodyPoints = (x, y, look, b) => [project(x + look.lean, y + look.lean, look.top + b), project(x + look.half, y - 5, look.top * .58 + b),
    project(x + look.half - 2, y + 8, 15 + b), project(x - look.half * .53, y + 10, 10 + b), project(x - look.half, y, look.top * .55 + b)];
  // What each resident holds, matching how strangers are labelled: Wren's log and
  // the pencil behind one ear, Juno's unlit lantern, and the card Pell is reading.
  const at = (c, s, dx, dy) => ({ x: c.x + dx * s, y: c.y + dy * s });
  const props = {
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
  };
  // Trust warms a resident: a first step when they trust you, one more for each
  // answer, so 0 (not trusted) then 1/4 up to 1. Like trust, it never goes back.
  // The body and rings shift warm here; the glow is drawn with the light pools.
  const warmthOf = (state, id) => S.isTrusted(state, id) ? (1 + state.answers.filter(a => a.id === id).length) / 4 : 0;
  const warmRings = '#ecd6a4';
  // Mixes two #rrggbb colours: t = 0 gives a, t = 1 gives b.
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
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
  // a resident's body and rings warm, and the rings thicken, with their warmth.
  function agent(x, y, who = 'player', warmth = 0) {
    const look = looks[who], scale = G.scale, phase = Object.keys(looks).indexOf(who) * 1.3, wide = look.half / 17, tall = look.top / 66;
    const bob = bobOf(who), p = project(x, y), center = project(x, y, look.top * .59 + bob);
    ctx.fillStyle = '#3e4d3822'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * wide * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
    polygon(bodyPoints(x, y, look, bob), warmth ? mix(look.body, look.warm, warmth * .8) : look.body);
    ctx.save(); ctx.translate(center.x, center.y); ctx.strokeStyle = warmth ? mix(look.rings, warmRings, warmth) : look.rings; ctx.lineWidth = .65 + .35 * warmth;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, 0, (9 + i) * wide * scale, (21 - i) * tall * scale, i * .55 + phase + (A.reducedMotion ? 0 : G.time * .09), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#f0eacb'; ctx.fillRect(-7 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.fillRect(3 * scale, -3 * scale, 5 * scale, 2 * scale); ctx.restore();
    props[who]?.(x, y, bob, scale);
    if (look.marker) marker(x, y);
  }
  const marker = (x, y) => { const head = project(x, y, 85); polygon([{ x: head.x, y: head.y + 6 }, { x: head.x - 4, y: head.y }, { x: head.x + 4, y: head.y }], looks.player.marker); };
  // Whether a point is hidden behind a shelf: walking from it towards the viewer
  // along (1, 1, 0.96) keeps the same screen position, so it is hidden when
  // that ray passes through a shelf's box.
  const hiddenAt = (x, y, z) => A.shelves.some(s => {
    let near = 0, far = Infinity;
    for (const [from, step, lo, hi] of [[x, 1, s.x, s.x + s.w], [y, 1, s.y, s.y + s.d], [z, .96, 0, s.h]]) {
      near = Math.max(near, (lo - from) / step); far = Math.min(far, (hi - from) / step);
    }
    return near < far;
  });
  // The player, outlined over the shelf that hides them. Drawn after the night
  // layer, dark then pale so it reads on any shelf face.
  function agentGhost(x, y) {
    if (![20, 40, 60].some(z => hiddenAt(x, y, z))) return;
    const outline = bodyPoints(x, y, looks.player, bobOf('player'));
    polygon(outline, '#353e3430');
    line([...outline, outline[0]], '#20271fa0', 2.4 * G.scale); line([...outline, outline[0]], '#f0eacbd0', G.scale);
    marker(x, y);
  }
  // A note card facing the viewer along x: blue for this run (or kept by the wall ending), faded after.
  // Cards Pell found are old paper: someone else's, never blue.
  function card(x, y, z, current, found) {
    const at = (dx, dz) => project(x + dx, y, z + dz);
    const [fill, edge, ink] = found ? ['#cdbf9c', '#9a8d6b', '#7f7458aa'] : current ? ['#5f7a86', '#48606b', '#dfe8ea'] : ['#33362f38', '#33362f55', '#f2f0e699'];
    polygon([at(0, 0), at(24, 0), at(24, 24), at(0, 24)], fill, edge);
    for (let i = 0; i < 3; i++) line([at(4, 17 - i * 5), at(20 - i * 4, 17 - i * 5)], ink, .8);
  }
  // Two rows of twelve card holders on the back wall, filled by posted notes.
  function noticeWall(state) {
    polygon([project(238, 0, 35), project(652, 0, 35), project(652, 0, 113), project(238, 0, 113)], '#c9cfbbd0', '#a9b39d');
    const bySlot = new Map(state.notes.filter(n => n.slot !== null).map(n => [n.slot, n]));
    for (let slot = 0; slot < S.wallSlots; slot++) {
      const { x, z } = slotAt(slot), note = bySlot.get(slot);
      if (note) card(x, 0, z, note.run === state.run || state.ending === 'wall', !S.postedByYou(note));
      else polygon([project(x, 0, z), project(x + 24, 0, z), project(x + 24, 0, z + 24), project(x, 0, z + 24)], '#dfe2d3', '#aab39c');
    }
    label('NOTICE HALL', 445, 0, 122, '#71806199', 10);
  }
  function object(o) {
    const state = G.state, active = G.nearby?.id === o.id && !G.modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    if (o.type === 'resident') agent(o.x, o.y, o.resident, warmthOf(state, o.resident));
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

  A.drawRoom = { shelf, desk, agent, agentGhost, noticeWall, object, slotAt, warmthOf };
})();
