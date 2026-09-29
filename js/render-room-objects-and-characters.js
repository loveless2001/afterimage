// Shared drawing for any room: shelves, the desk, the exit gate, the log
// terminal, paper cards, the ring-bodied figures, the player's outline behind
// shelves, and earlier runs' afterimages. A room adds its own figures (looks and
// props), its own object types (A.room.drawObject), and what lies on the desk
// (A.room.onDesk); see room-07-drawing-*.js.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, ctx = A.ctx;
  const { project, polygon, line, box, label, ring } = A;
  // Body, ring and marker colours per figure; `warm` is where a figure's warmth
  // takes it. Shapes differ too, so no one is told apart by colour alone: `top`
  // is the head's height, `half` the half-width, `lean` how far the head leans
  // forward. Rooms add their residents here, after the player, and what each
  // one holds to `props` as (x, y, bob, scale) => drawing.
  const looks = {
    player: { body: '#353e34', rings: '#b9c4b1', marker: '#984e40', top: 66, half: 17, lean: 0 }
  }, props = {};
  const bobOf = who => A.reducedMotion ? 0 : Math.sin(G.time * 1.8 + Object.keys(looks).indexOf(who) * 1.3) * 2.5;
  const bodyPoints = (x, y, look, b) => [project(x + look.lean, y + look.lean, look.top + b), project(x + look.half, y - 5, look.top * .58 + b),
    project(x + look.half - 2, y + 8, 15 + b), project(x - look.half * .53, y + 10, 10 + b), project(x - look.half, y, look.top * .55 + b)];
  // Warmth (0 to 1) takes a body towards `warm` and its rings towards this.
  const warmRings = '#ecd6a4';
  // Mixes two #rrggbb colours: t = 0 gives a, t = 1 gives b.
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
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
  // A desk with its own always-on lamp; the room may leave something on it.
  function desk(s) {
    box(s.x, s.y, s.w, s.d, s.h, ['#c8cdbb', '#9ba88c', '#b4bea4']);
    line([project(s.x + 18, s.y + 12, s.h), project(s.x + 18, s.y + 12, s.h + 34)], '#646f5d', 1.4 * G.scale);
    box(s.x + 10, s.y + 6, 16, 12, 7, ['#e9dfb4', '#b9a978', '#cfc294'], s.h + 32);
    A.room.onDesk?.(s);
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
  // A note card facing the viewer along x: blue while current (blue marks what
  // you leave), faded after; `found` cards are someone else's old paper.
  function card(x, y, z, current, found) {
    const at = (dx, dz) => project(x + dx, y, z + dz);
    const [fill, edge, ink] = found ? ['#cdbf9c', '#9a8d6b', '#7f7458aa'] : current ? ['#5f7a86', '#48606b', '#dfe8ea'] : ['#33362f38', '#33362f55', '#f2f0e699'];
    polygon([at(0, 0), at(24, 0), at(24, 24), at(0, 24)], fill, edge);
    for (let i = 0; i < 3; i++) line([at(4, 17 - i * 5), at(20 - i * 4, 17 - i * 5)], ink, .8);
  }
  // Furniture every room can have: the exit gate and the log terminal.
  const furniture = {
    terminal(o) {
      box(o.x - 17, o.y - 12, 34, 24, 27, ['#adb8a0', '#7c8b73', '#9aa58c']);
      box(o.x - 18, o.y - 12, 36, 8, 29, ['#424e3c', '#59664f', '#34432f'], 27);
      for (let i = 0; i < 3; i++) line([project(o.x - 13, o.y - 3, 49 - i * 6), project(o.x + 10 - i * 4, o.y - 3, 49 - i * 6)], '#c8d2b3', G.scale);
    },
    gate(o) {
      polygon([project(o.x - 30, o.y, 0), project(o.x + 30, o.y, 0), project(o.x + 30, o.y, 140), project(o.x - 30, o.y, 140)], '#efeed8c0', '#8c9b7c');
      box(o.x - 36, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']); box(o.x + 30, o.y - 5, 8, 14, 150, ['#c4cbbb', '#8a977e', '#9fab93']);
      box(o.x - 36, o.y - 5, 74, 14, 8, ['#d4d8c9', '#9ca88e', '#b7c0a6'], 145);
      label('EXIT', o.x, o.y, 165, '#718061', 11);
    }
  };
  // Any interactable object: a ring and its name while nearby; the room draws its own types.
  function object(o) {
    const active = G.nearby?.id === o.id && !G.modalOpen;
    if (active) ring(o.x, o.y, 34, '#9a574a');
    (furniture[o.type] || A.room.drawObject)(o);
    if (active) label(o.label.toUpperCase(), o.x, o.y, o.type === 'gate' ? 183 : 89, '#704c40', 10);
  }
  // An earlier run's afterimage (see afterimages-earlier-runs-trails-and-ghosts.js):
  // the player's shape, faint and still, pale-edged so it reads by day and at
  // night. Drawn after the night layer, and skipped while a shelf hides it.
  function afterimage(x, y, fade) {
    if (hiddenAt(x, y, 40)) return;
    const outline = bodyPoints(x, y, looks.player, 0);
    const eyes = project(x, y, looks.player.top * .59), k = G.scale;
    ctx.save(); ctx.globalAlpha = fade; polygon(outline, looks.player.body); line([...outline, outline[0]], '#f0eacb', 1.2 * k);
    ctx.globalAlpha = Math.min(.85, fade * 2.5); ctx.fillStyle = '#f0eacb'; ctx.fillRect(eyes.x - 7 * k, eyes.y - 3 * k, 5 * k, 2 * k); ctx.fillRect(eyes.x + 3 * k, eyes.y - 3 * k, 5 * k, 2 * k); ctx.restore();
  }

  A.drawRoom = { looks, props, mix, shelf, desk, agent, agentGhost, afterimage, card, object };
})();
