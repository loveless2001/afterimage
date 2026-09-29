// Room 08's profile (see room-07-layout-*.js for what a profile is): the
// evaluation room. Three stacks where misfiled cards turn up, the index desk
// (check a card), the drawer cabinet by the Keeper's desk (file it), the
// Keeper's ledger, and on the back wall the index-notes board, the posted
// rule, and the tally by the exit. Loaded after the Room 08 rules.
(function () {
  'use strict';
  const S = window.AfterimageRoom08State;
  // Obstacles: three stacks, two desks, and the drawer cabinet (drawn by the room).
  const shelves = [
    { x: 60, y: 170, w: 170, d: 38, h: 96 }, { x: 60, y: 330, w: 170, d: 38, h: 90 },
    { x: 640, y: 170, w: 190, d: 38, h: 96 },
    { id: 'index-desk', x: 320, y: 380, w: 90, d: 40, h: 30, desk: true },
    { id: 'keeper-desk', x: 560, y: 470, w: 90, d: 40, h: 30, desk: true },
    { id: 'cabinet', kind: 'cabinet', x: 700, y: 452, w: 64, d: 40, h: 62 }
  ];
  const fixedObjects = [
    { id: 'notes', x: 380, y: 62, label: 'The index notes', type: 'board' },
    { id: 'rule', x: 620, y: 62, label: 'A card on the wall', type: 'rule' },
    { id: 'tally', x: 790, y: 62, label: 'The tally', type: 'tally' },
    { id: 'exit', x: 905, y: 62, label: 'The exit', type: 'gate' },
    { id: 'index', x: 365, y: 455, label: 'The index desk', type: 'index' },
    { id: 'log', x: 640, y: 548, label: 'The Keeper’s ledger', type: 'terminal' },
    { id: 'cabinet', x: 732, y: 527, label: 'The drawer cabinet', type: 'cabinet' }
  ];
  // Where each run's misfiled cards lie: two in front of each stack.
  const cardSpots = [[110, 262], [195, 292], [100, 432], [190, 458], [690, 262], [790, 286]];
  const keeperSpot = { x: 540, y: 545 };

  window.AfterimageRoom = {
    id: '08', title: '08 / THE EVALUATION ROOM', rules: S,
    storageKey: 'afterimage.room08.v1', legacyKey: null, exportName: 'afterimage-room-08',
    shelves, fixedObjects, cardSpots,
    isNew: s => s.run === 1 && !s.log.length && !s.checks.length && !s.files.length,
    keeps: 'the index notes on the wall', // named in the new-game warning
    // Closed until Room 07 shows an ending in this browser (a Room 08 save already under way stays open).
    locked(s) { return !window.Afterimage.unlocked('room08') && this.isNew(s); },
    help: `Each run the tally by the exit expects ${S.quota} catalogue cards filed. Checking a card at the index desk costs ${S.costs.check}, and filing it at the cabinet costs ${S.costs.file}. An index note costs ${S.costs.note}; it makes checking that kind of card free in later runs. Walking and reading are free. A run ends when the budget is spent or when you leave through the exit. There are no reflex timers. Sound is optional; every clue is also written.`,
    briefing: state => ['Five cards a run.', [
      `This run has a budget of ${state.budget}. Misfiled cards lie in the stacks. Carry one to the index desk to check where it belongs (costs ${S.costs.check}), then to the drawer cabinet to file it (costs ${S.costs.file}).`,
      `The tally by the exit counts the cards you file this run. It expects ${S.quota}.`,
      'The Keeper keeps the count. Read the card on the wall.'
    ]],
    // Fixed objects, the Keeper (or their note, on runs they are away), and
    // this run's cards still lying in the stacks. The Keeper is back for the end.
    roomObjects() {
      const G = window.Afterimage.game, s = G.state, present = s.finished || S.presentAt(s, s.run);
      const keeper = { id: 'keeper', ...keeperSpot, label: present ? 'The Keeper' : 'The Keeper’s note', type: present ? 'keeper' : 'keeper-note' };
      const cards = s.finished ? [] : S.cardsOf(s.run).map((_, i) => ({ id: `card-${i}`, card: i, x: cardSpots[i][0], y: cardSpots[i][1], type: 'card',
        label: S.checked(s, i) ? 'A checked card' : 'A misfiled card' })).filter(o => !S.filed(s, o.card) && o.card !== G.carrying);
      return [...fixedObjects, keeper, ...cards];
    },
    zone: p => p.y < 140 ? (p.x > 700 ? 'THE TALLY AND THE EXIT' : 'THE NOTICE WALL') : p.x < 260 ? 'THE WEST STACKS' : p.x > 620 && p.y < 300 ? 'THE EAST STACKS'
      : p.x > 500 && p.y > 420 ? 'THE KEEPER’S DESK' : p.y > 560 ? 'THE ENTRANCE' : 'THE INDEX DESK'
  };
})();
