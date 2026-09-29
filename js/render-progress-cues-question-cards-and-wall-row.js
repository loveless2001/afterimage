// Room 07's progress cues (A.room.cues), drawn over the finished frame, after the night layer, so they
// stay readable at night. They keep the colour rule that blue marks what
// persists, and never move (nothing to switch off for reduced motion):
// - a card above a trusted resident whose question this run can still answer:
//   outlined while they wait for a note, solid once a note posted this run answers it;
// - the notice wall's top row, whose 12 slots are ending C's threshold (the
//   row fills first): empty slots outlined from 9 notes, a rule under it at 12.
// Trusted residents' warmth is drawn with the figures and light pools, and the alcove's
// warmth (one step per secret hint heard) with the light pools.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S, ctx = A.ctx;
  const { project, line } = A, slotAt = slot => A.room.slotAt(slot); // added by room-07-drawing-*.js
  const blue = '#5f7a86', nearFull = S.wallEndingNotes - 3;

  // Screen-space card just above the head, lifted over the name label when
  // the resident is nearby; kept legible on small screens where the room
  // scales down. The ready card's pale edge keeps it clear at night.
  function questionCard(o, state) {
    if (!S.canAnswerThisRun(state, o.resident)) return;
    const ready = S.answerNote(state, o.resident) >= 0, k = Math.max(G.scale, .6);
    const p = project(o.x, o.y, G.nearby?.id === o.id && !G.modalOpen ? 104 : 82);
    const w = 12 * k, h = 15 * k, left = p.x - w / 2, top = p.y - h;
    ctx.fillStyle = ready ? blue : '#e9e7dec0'; ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = ready ? '#e9e7de' : blue; ctx.lineWidth = 1.2; ctx.strokeRect(left, top, w, h);
    for (let i = 0; i < 3; i++) line([{ x: left + 2.5 * k, y: top + (4 + i * 3.5) * k }, { x: left + w - (2.5 + i * 1.5) * k, y: top + (4 + i * 3.5) * k }], ready ? '#dfe8ea' : blue, .9);
  }
  function wallRow(state) {
    const wall = S.onWall(state), count = wall.length;
    if (count < nearFull) return;
    if (count >= S.wallEndingNotes) {
      const first = slotAt(0), last = slotAt(S.wallEndingNotes - 1);
      return line([project(first.x - 4, 0, first.z - 5), project(last.x + 28, 0, last.z - 5)], blue, 1.6 * G.scale);
    }
    const filled = new Set(wall.map(i => state.notes[i].slot));
    for (let slot = 0; slot < S.wallEndingNotes; slot++) {
      if (filled.has(slot)) continue;
      const { x, z } = slotAt(slot);
      line([project(x, 0, z), project(x + 24, 0, z), project(x + 24, 0, z + 24), project(x, 0, z + 24), project(x, 0, z)], blue, 1.3);
    }
  }

  A.room.cues = function (state) {
    if (state.finished) return;
    wallRow(state);
    A.roomObjects().filter(o => o.type === 'resident').forEach(o => questionCard(o, state));
  };
})();
