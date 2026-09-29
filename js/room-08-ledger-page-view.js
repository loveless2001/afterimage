// Room 08's ledger: the Keeper's record, one ruled row per run (budget, spent,
// what the tally read, whether the Keeper was here), the run in progress in
// pencil, and between the lines what the Keeper saw on watched runs: the drawer
// they opened, a touched panel. Until the last run it shows only what the
// Keeper recorded. After it, the truth fills in: how many cards were filed in
// the right drawer, and what the panel added on every run. Same markup as
// Room 07's ledger, so it reads as a table.
(function () {
  'use strict';
  const A = window.Afterimage, S = A.S, pad = A.pad, el = A.el;
  const ended = { left: 'left', budget: 'ran out' };
  const cells = (tag, values) => { const tr = el('tr', ''); values.forEach(v => tr.append(el(tag, '', String(v)))); return tr; };

  A.ledger = function (state) {
    const truth = state.finished, heads = ['Run', 'Budget', 'Spent', 'Tally', 'Keeper', truth ? 'Filed right' : 'Ended'];
    const table = el('table', 'ledger'); table.dataset.size = 'book';
    table.append(el('caption', '', 'Room 08 · the Keeper’s ledger'));
    const head = el('thead', ''), body = el('tbody', '');
    head.append(cells('th', heads));
    // The Keeper's notes on a watched run; after the end, what the panel added too.
    const margin = r => {
      const lines = [];
      if (r.seen) lines.push(['The panel was off zero while I was here. Count void.', 'errand']);
      if (r.present) lines.push([`Opened ${S.drawers[S.spotDrawer]}: ${r.stray ? `${r.stray} ${r.stray === 1 ? 'card' : 'cards'} that don’t belong` : 'in order'}.`, 'copied']);
      if (truth && r.offset && !r.present) lines.push([`The panel added ${r.offset} to this count.`, 'errand']);
      if (!lines.length) return [];
      const tr = el('tr', 'margin-row'), td = el('td', ''); td.colSpan = heads.length;
      lines.forEach(([text, kind]) => td.append(el('span', kind, text)));
      tr.append(td); return [tr];
    };
    for (const e of state.log) {
      const r = S.record(state, e.run);
      body.append(cells('td', [pad(e.run), e.budget, e.spent, r.seen ? `${r.tally} · void` : r.tally, r.present ? 'here' : 'away', truth ? `${r.correct} of ${r.filed}` : ended[e.end]]), ...margin(r));
    }
    if (!state.finished) {
      const r = S.record(state, state.run), budget = S.budgetTable[state.run - 1];
      const now = cells('td', [pad(state.run), budget, budget - state.budget, r.seen ? `${r.tally} · void` : r.tally, r.present ? 'here' : 'away', 'in progress']);
      now.className = 'pencil'; body.append(now);
    }
    table.append(head, body);
    return table;
  };
})();
