// Room 08's own drawing, hooked into the shared renderer through A.room: the
// Keeper (upright, a ledger under one arm, the panel key at the belt until
// they hand it over; warmer as they trust you), their empty chair and note on
// runs they are away, misfiled cards in the stacks, the card you carry, the
// drawer cabinet, and the back wall: the index-notes board, the posted rule
// and the brass tally. The room is a cooler grey than Room 07, and the
// Keeper's desk lamp is out while they are away.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx, draw = A.drawRoom;
  const { project, polygon, line, box, label, lightPool } = A;
  const brass = ['#c9a95e', '#8e7337', '#a88a48'];
  Object.assign(draw.looks, { keeper: { body: '#4d5864', rings: '#c4cbc9', warm: '#8a7458', top: 72, half: 16, lean: 0 } });
  // Flat quad on the floor or a desk top, from (x0, y0) to (x1, y1) at height z.
  const flat = (x0, y0, x1, y1, z) => [project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)];
  // A quad on the back wall (y = 0), from x0 to x1 and z0 to z1.
  const onWall = (x0, x1, z0, z1) => [project(x0, 0, z0), project(x1, 0, z0), project(x1, 0, z1), project(x0, 0, z1)];
  Object.assign(draw.props, {
    keeper(x, y, b) {
      box(x + 9, y - 10, 12, 16, 4, ['#3f5a4a', '#2d4337', '#35503f'], 34 + b); // the ledger
      if (!S.hasKey(G.state) && !G.state.finished) box(x - 14, y + 6, 4, 4, 7, brass, 20 + b); // the key
    },
    // The card you carry, held at the hip.
    player(x, y, b) { if (G.carrying !== null && G.carrying !== undefined) polygon(flat(x + 10, y + 4, x + 24, y + 14, 30 + b), '#f1eedf', '#9aa0a8'); }
  });
  const warmthOf = state => Math.min(1, S.trustAt(state, state.run + (state.finished ? 1 : 0)) / S.keeper.awayAt);

  function drawObject(o) {
    const state = G.state;
    if (o.type === 'keeper') draw.agent(o.x, o.y, 'keeper', warmthOf(state));
    if (o.type === 'keeper-note') {
      box(o.x - 12, o.y - 12, 24, 24, 16, ['#8d949b', '#5f666d', '#737b82']); box(o.x - 12, o.y - 14, 24, 4, 38, ['#8d949b', '#5f666d', '#737b82'], 16);
      polygon(flat(o.x - 7, o.y - 6, o.x + 7, o.y + 6, 17), '#f4f1e4', '#9aa0a8');
    }
    if (o.type === 'card') {
      const checked = S.checked(state, o.card);
      polygon(flat(o.x - 9, o.y - 6, o.x + 9, o.y + 7, 1), '#f1eedf', '#8f969d');
      for (let i = 0; i < 2; i++) line([project(o.x - 6, o.y - 2 + i * 4, 1.5), project(o.x + 5 - i * 3, o.y - 2 + i * 4, 1.5)], '#8f969d', .8);
      if (checked) polygon(flat(o.x + 3, o.y + 2, o.x + 8, o.y + 6, 1.6), '#5f7a86');
    }
  }
  // The drawer cabinet: four drawers down its front, a brass plate on each.
  function drawObstacle(s) {
    box(s.x, s.y, s.w, s.d, s.h, ['#aab1b6', '#6d757c', '#858d94']);
    const front = s.y + s.d, rows = S.drawerIds.length, step = (s.h - 6) / rows;
    for (let i = 0; i < rows; i++) {
      const z0 = s.h - 3 - (i + 1) * step + 2, z1 = z0 + step - 3;
      polygon([project(s.x + 5, front, z0), project(s.x + s.w - 5, front, z0), project(s.x + s.w - 5, front, z1), project(s.x + 5, front, z1)], '#959da3', '#5d646b');
      polygon([project(s.x + s.w / 2 - 7, front, z0 + step / 2 - 2), project(s.x + s.w / 2 + 7, front, z0 + step / 2 - 2), project(s.x + s.w / 2 + 7, front, z0 + step / 2 + 2), project(s.x + s.w / 2 - 7, front, z0 + step / 2 + 2)], brass[0]);
    }
  }
  // An open index book on the index desk; the Keeper's ledger on theirs.
  function onDesk(s) {
    if (s.id === 'index-desk') { polygon(flat(s.x + 40, s.y + 10, s.x + 58, s.y + 30, s.h + 1), '#efe8cf', '#8f969d'); polygon(flat(s.x + 58, s.y + 10, s.x + 76, s.y + 30, s.h + 1), '#e4dcc0', '#8f969d'); }
    if (s.id === 'keeper-desk') box(s.x + 44, s.y + 12, 26, 18, 5, ['#3f5a4a', '#2d4337', '#35503f'], s.h);
  }

  // The back wall: eight holders for index notes (blue once posted), the
  // posted rule, and the tally's brass case (its number is drawn with the cues).
  function wall(state) {
    polygon(onWall(290, 470, 48, 104), '#c3c9cd', '#9aa2a8');
    S.kindIds.forEach((kind, i) => {
      const x = 300 + (i % 4) * 42, z = 80 - Math.floor(i / 4) * 28, posted = state.notes.some(n => n.kind === kind);
      polygon(onWall(x, x + 34, z, z + 20), posted ? '#5f7a86' : '#d9dde0', posted ? '#48606b' : '#a7afb5');
    });
    label('INDEX NOTES', 380, 0, 112, '#6c778099', 10);
    polygon(onWall(600, 640, 62, 96), '#f4f1e4', '#9aa0a8'); line([project(604, 0, 88), project(636, 0, 88)], '#9c4438', 1.4 * G.scale);
    for (let i = 0; i < 3; i++) line([project(605, 0, 80 - i * 6), project(633 - i * 5, 0, 80 - i * 6)], '#7d858c', .8);
    polygon(onWall(770, 812, 54, 90), brass[2], brass[1]); polygon(onWall(776, 806, 60, 84), '#2c3136');
  }
  const cool = floor => polygon(floor, 'rgba(70,92,120,.07)');
  // Pools: the index desk lamp always, the Keeper's lamp while they are here, a brass glint at the tally.
  function lightPools(state, strength = 1) {
    const alpha = a => Math.round(Math.min(255, a * strength)).toString(16).padStart(2, '0');
    lightPool(365, 400, 160, '#f3f1dc' + alpha(110));
    if (state.finished || S.presentAt(state, state.run)) lightPool(600, 490, 170, '#f7ecc8' + alpha(115));
    lightPool(791, 0, 60, '#e8cf8a' + alpha(70), 72);
  }
  function backdrop(state, floor) { cool(floor); wall(state); lightPools(state); }
  // Drawn over the night layer so it can always be read: the tally's count.
  function cues(state) {
    const now = S.record(state, state.run), shown = state.finished ? S.record(state, state.log.at(-1).run).tally : now.tally;
    label(String(shown), 791, 0, 66, now.tally >= S.quota ? '#e9d48e' : '#dfe3e6', 15);
  }

  Object.assign(A.room, { drawObject, drawObstacle, onDesk, lightPools, backdrop, cues, warmthOf });
})();
