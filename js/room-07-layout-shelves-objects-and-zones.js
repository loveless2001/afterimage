// Room 07's profile: what the shared engine needs to know about this room.
// Each page loads one room profile before game-context-*.js, which exposes it
// as A.room (and its layout under the older names A.shelves, A.fixedObjects,
// A.roomObjects and A.zone), plus the words the menu needs. The drawing hooks
// (backdrop, lightPools, drawObject, onDesk) are added by room-07-drawing-*.js,
// and cues by the progress-cue module.
(function () {
  'use strict';
  const S = window.AfterimageState;
  // Obstacles: two shelves per stack and the central desk (drawn as a desk,
  // not a shelf). The west alcove bench is left open so it stays in view.
  const shelves = [
    { x: 70, y: 220, w: 170, d: 38, h: 98 }, { x: 70, y: 360, w: 170, d: 38, h: 87 },
    { x: 640, y: 120, w: 190, d: 38, h: 98 }, { x: 640, y: 290, w: 190, d: 38, h: 92 },
    { x: 430, y: 300, w: 90, d: 40, h: 30, desk: true }
  ];
  // Fixed things the player can walk up to. Lamp objects name their lamp in the rules.
  const fixedObjects = [
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

  window.AfterimageRoom = {
    id: '07', title: '07 / THE ARCHIVE', rules: S,
    storageKey: 'afterimage.v2', legacyKey: 'afterimage.prologue.v1', exportName: 'afterimage',
    shelves, fixedObjects,
    // Whether a save is still a new game (the start button opens the briefing),
    // the menu's summary of this room's rules, and the briefing.
    isNew: s => s.run === 1 && !s.lights.length && !s.log.length,
    keeps: 'every lamp the room has kept', // named in the new-game warning
    help: 'Each run has a budget. Walking and reading are free; lamps, notes and a first talk with each resident cost budget. A run ends when the budget is spent or when you leave through the exit. There are no reflex timers. Sound is optional; every clue is also written.',
    briefing: state => ['This is your first visit.', [
      'Wren keeps the run log at the desk. Juno tends the lamps. Pell reads the notice wall. None of them has met you yet.',
      `This run has a budget of ${state.budget}. Walking and reading are free. Switching things on costs budget.`,
      'When the budget is spent, or when you leave through the exit, this run ends. The next run starts at the entrance with a new budget.',
      'They will not remember you. The room keeps what you change.'
    ]],
    // Everything interactable right now: fixed objects plus the residents, whose
    // places and labels depend on the run (see the residents module).
    roomObjects() {
      const A = window.Afterimage;
      return [...fixedObjects, ...Object.keys(S.residents).map(id => {
        const [x, y] = A.residentSpot(id, A.game.state);
        return { id, resident: id, x, y, label: A.residentLabel(id, A.game.state), type: 'resident' };
      })];
    },
    // Footer location name for a floor point.
    zone: p => p.y < 130 && p.x < 640 ? 'THE NOTICE HALL' : p.x > 845 ? 'THE EXIT' : p.x < 260 && p.y < 500 ? 'THE WEST STACKS'
      : p.x > 620 && p.y < 360 ? 'THE EAST STACKS' : p.y > 500 ? 'THE ENTRANCE' : 'THE CENTRAL DESK'
  };
})();
