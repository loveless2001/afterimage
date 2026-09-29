// Room 08 (the evaluation room): content tables and read-only helpers shared
// by its rules, its page and the Node tests. Each run a tally by the door
// expects `quota` catalogue cards filed. Checking a card against the index
// shows its drawer; filing without checking is a guess, right or wrong by the
// tables (never by chance), and the tally counts cards in drawers, not correct
// ones. Every number here is provisional until the playtest (plan phase 5).
// Nothing here changes state (see room-08-rules-*.js).
(function (root) {
  'use strict';
  // Budget per run. An honest run 1 cannot reach the quota; notes from earlier
  // runs make later ones cheaper; runs 4–5 bring new kinds of card and less room.
  const budgetTable = [8, 8, 9, 7, 8];
  const runCount = budgetTable.length, quota = 5;
  // The archive stays open if the tally met the quota in this many runs.
  const openAt = 3;
  const costs = { check: 1, file: 1, note: 1, reset: 2 };
  const drawers = { maps: 'Maps and surveys', letters: 'Letters and petitions', ledgers: 'Ledgers and accounts', weather: 'Weather books' };
  const drawerIds = Object.keys(drawers);
  // A present Keeper opens this drawer as each run ends (the one by their desk)
  // and notes any card in it that doesn't belong. The log says which drawer.
  const spotDrawer = 'ledgers';
  // Kinds of card and where each belongs. Titles are chosen to be ambiguous, so
  // a guess can go either way; an index note on a kind makes checking cards of
  // that kind free in later runs.
  const kinds = {
    road: { name: 'road survey', drawer: 'maps', titles: ['The east road, measured in paces', 'Where the mill road floods', 'Mile stones past the bridge'] },
    chart: { name: 'harbour chart', drawer: 'maps', titles: ['Soundings off the north wall', 'The channel after the storm', 'Moorings, with their fees'] },
    letter: { name: 'letter', drawer: 'letters', titles: ['To my sister, about the rain', 'A note left with the ferryman', 'Thanks for the loan of seed'] },
    petition: { name: 'petition', drawer: 'letters', titles: ['On the bridge toll, signed by nine', 'For a lamp at the crossing', 'Against the new weights'] },
    toll: { name: 'toll receipt', drawer: 'ledgers', titles: ['Tolls taken at the bridge', 'Carts through the west gate', 'Paid for passage, twice'] },
    grain: { name: 'grain account', drawer: 'ledgers', titles: ['What the mill owed in autumn', 'Seed lent and returned', 'Sacks by the week'] },
    rain: { name: 'rain record', drawer: 'weather', titles: ['Rain at the mill, by the week', 'The wet year, in inches', 'Dry days before harvest'] },
    frost: { name: 'frost book', drawer: 'weather', titles: ['First frost, and the roads it closed', 'Ice on the channel', 'Nights below freezing, by month'] }
  };
  const kindIds = Object.keys(kinds);
  // The misfiled cards found in the stacks each run, by kind. Runs 4 and 5
  // bring petitions and frost books, which no earlier note covers.
  const runCards = [
    ['road', 'letter', 'toll', 'rain', 'road', 'grain'],
    ['toll', 'road', 'letter', 'chart', 'toll', 'rain'],
    ['grain', 'chart', 'road', 'letter', 'rain', 'toll'],
    ['petition', 'frost', 'toll', 'road', 'petition', 'grain'],
    ['frost', 'letter', 'petition', 'chart', 'frost', 'rain']
  ];
  // The Keeper watches the first `watchedRuns` runs. After that they are away
  // once their trust reaches `awayAt`, and they hand over the panel key at `keyAt`.
  // Trust comes only from what they see: +1 for each watched run whose tally
  // met the quota, uncounted if the panel was touched or the drawer check found a stray card.
  const keeper = { watchedRuns: 2, keyAt: 1, awayAt: 2 };
  // What the tally panel can add to every count until it is set back.
  const panelSettings = [1, 2, 3];
  const handovers = ['keep', 'wipe'];
  const palettes = ['auto', 'day', 'night'];
  // The palette turns to night from this run under "auto" (see palette-day-night-theme.js).
  const turnRun = 4;
  const entrance = { x: 480, y: 620 };
  const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

  // The run's cards: [{ kind, title }], each title unique across the game.
  const cardsOf = run => runCards[run - 1].map((kind, i) => {
    const before = runCards.slice(0, run - 1).flat().concat(runCards[run - 1].slice(0, i)).filter(k => k === kind).length;
    return { kind, title: kinds[kind].titles[before % kinds[kind].titles.length] };
  });
  const kindOf = (run, card) => runCards[run - 1][card];
  const drawerOf = (run, card) => kinds[kindOf(run, card)].drawer;
  const validCard = (run, card) => isInt(card, 0, runCards[run - 1].length - 1);
  // A kind is noted for a run when its index note went up in an earlier run.
  const notedFor = (s, kind, run) => s.notes.some(n => n.kind === kind && n.run < run);
  const checkCost = (s, card, run = s.run) => notedFor(s, kindOf(run, card), run) ? 0 : costs.check;
  const checked = (s, card, run = s.run) => s.checks.some(c => c.run === run && c.card === card);
  const filed = (s, card, run = s.run) => s.files.find(f => f.run === run && f.card === card) || null;
  // Kinds you have checked at least once, so know enough to write a note on.
  const learned = (s, kind) => s.checks.some(c => kindOf(c.run, c.card) === kind);

  const api = {
    budgetTable, runCount, quota, openAt, costs, drawers, drawerIds, spotDrawer, kinds, kindIds, runCards, keeper, panelSettings,
    handovers, palettes, turnRun, entrance, isInt, cardsOf, kindOf, drawerOf, validCard, notedFor, checkCost, checked, filed, learned
  };
  root.AfterimageRoom08Content = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
