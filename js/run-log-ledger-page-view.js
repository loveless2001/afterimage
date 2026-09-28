// The run log as an open ledger, shown in the dialog in place of a text list:
// one ruled row per run (budget, spent, notes you posted, how it ended), the
// run in progress in pencil, errands and Wren's copies of your answers to her
// written between the lines ("Wren copies it into the margin"), and the last
// entry on the bottom line, blank from the turn until it is written. It is a
// real table, so screen readers read it row by row.
(function () {
  'use strict';
  const A = window.Afterimage, S = A.S, pad = A.pad, el = A.el;
  const ended = { left: 'left', budget: 'ran out', ending: 'last entry' };
  const cells = (tag, values) => { const tr = el('tr', ''); values.forEach(v => tr.append(el(tag, '', v))); return tr; };

  A.ledger = function (state) {
    const posted = run => { const n = state.notes.filter(note => note.run === run && S.postedByYou(note)).length; return n ? `${n} ${n === 1 ? 'note' : 'notes'}` : '—'; };
    // What happened in a run besides the numbers: an errand, and what Wren copied in.
    const margin = run => {
      const lines = [...state.errands.filter(e => e.run === run).map(e => [`${S.residents[e.id].name} on an errand`, 'errand']),
        ...state.answers.filter(a => a.id === 'wren' && a.run === run).map(a => [`“${S.noteText(state.notes[a.note].parts)}”, copied by Wren`, 'copied'])];
      if (!lines.length) return [];
      const tr = el('tr', 'margin-row'), td = el('td', ''); td.colSpan = 5;
      lines.forEach(([text, kind]) => td.append(el('span', kind, text)));
      tr.append(td); return [tr];
    };
    const table = el('table', 'ledger'); table.dataset.size = 'book';
    table.append(el('caption', '', 'Room 07 · the run log'));
    const head = el('thead', ''), body = el('tbody', '');
    head.append(cells('th', ['Run', 'Budget', 'Spent', 'Notes', 'Ended']));
    for (const e of state.log) body.append(cells('td', [pad(e.run), e.budget, e.spent, posted(e.run), ended[e.end]]), ...margin(e.run));
    if (!state.finished) {
      const budget = S.budgetTable[state.run - 1], now = cells('td', [pad(state.run), budget, budget - state.budget, posted(state.run), 'in progress']);
      now.className = 'pencil'; body.append(now, ...margin(state.run));
    }
    // The bottom line: written once the runs end, blank and waiting from the turn.
    if (state.finished || state.run >= S.turnRun) {
      const tr = el('tr', 'last-entry' + (state.finished ? '' : ' blank')), td = el('td', ''); td.colSpan = 5;
      td.append(el('small', '', 'The last entry'), el('span', '', state.finished ? `${S.endings[state.ending].title}.` : ''));
      tr.append(td); body.append(tr);
    }
    table.append(head, body);
    return table;
  };
})();
