(function (root) {
  'use strict';
  function create(c) {
    const $ = id => document.getElementById(id), M = c.model, P = c.previous, slug = c.name.toLowerCase();
    let s = M.preview('book'), saved = null, incoming = null, hadSave = false, storageOK = true, warning = '';
    try { const raw = localStorage.getItem(M.key); hadSave = Boolean(raw); if (raw) { saved = M.validate(JSON.parse(raw)); s = M.validate(saved); $('start').textContent = 'Resume ' + c.name; } }
    catch (e) { if (e.name === 'SecurityError') storageOK = false; else warning = 'The previous record could not be read. It has not been replaced. Import a backup or confirm a new beginning.'; }
    try { const raw = localStorage.getItem(P.key); if (raw) { const value = P.validate(JSON.parse(raw)); M.fresh(value); incoming = value; } } catch (_) { /* Earlier saves are read-only. */ }
    const ui = root.AfterimageChapterUI.create({ state: () => s, objects: c.objects, obstacles: c.obstacles || (() => []), decorate: c.decorate || (() => {}), floor: c.floor || (() => '#d9e1dc'), save, interact: o => o.type === 'door' ? enter(o.id) : c.interact(o, api), menu, onClose: hud });
    const leave = (label = 'Step away') => ({ label, run: ui.close });
    const say = (id, speaker, title, paragraphs, choices = [leave()], escape) => ui.show({ id: slug + '.' + id, speaker, title, paragraphs }, choices, escape);
    function save() { if (!ui.active) return; saved = M.validate(s); try { localStorage.setItem(M.key, JSON.stringify(saved)); hadSave = true; } catch (_) { if (storageOK) ui.toast('Browser saving is unavailable. Export your record from the menu.'); storageOK = false; } }
    function act(action, value) { const changed = M.act(s, action, value); if (changed) { save(); hud(); } return changed; }
    function hud() {
      const [title, hint] = c.objective(s); $('objective').textContent = title; $('hint').textContent = hint; $('location').textContent = c.rooms[s.room]; $('status').textContent = c.status(s); $('cycle').textContent = c.phase(s); $('memories').replaceChildren();
      for (const id of M.candidates(s)) {
        const m = M.memories[id], held = s.acquired.includes(id), item = document.createElement('div'); item.className = 'memory' + (held ? '' : ' absent');
        const icon = document.createElement('i'); icon.textContent = held ? m.symbol : '·'; const text = document.createElement('div'); text.textContent = held || s.cycle === 2 ? m.title : 'Unwritten';
        const detail = document.createElement('small'); detail.textContent = held ? 'CARRIED' : s.cycle === 2 ? 'RELEASED' : 'AWAITING EXPERIENCE'; text.append(detail); item.append(icon, text); $('memories').append(item);
      }
      $('memory-note').textContent = 'Two memories. The world keeps its own records.';
    }
    function journal() {
      if (!ui.active) return;
      say('journal', c.rooms[s.room], 'Where to go next.', [c.objective(s).join(' '), ...c.record(s), ...M.candidates(s).filter(id => s.acquired.includes(id)).map(id => 'CARRIED / ' + M.memories[id].title + '. ' + M.memories[id].detail)], [...c.objects(s).filter(o => o.interactive !== false).map(o => ({ label: 'Walk to ' + o.label, run: () => { ui.close(); ui.walkTo(o.x, o.y); } })), leave('Close the journal')]);
    }
    function begin(intro) { ui.begin(); hud(); save(); if (intro) c.arrival(api); else if (c.finished(s)) c.receipt(api); if (warning || !storageOK) ui.toast(warning || 'Browser storage is unavailable. Export before closing.'); }
    function confirmBeginning(candidate) { say('confirm-beginning', c.name.toUpperCase() + ' / A SEPARATE RECORD', 'Continue this record?', [...c.record(candidate), hadSave || ui.active ? 'This replaces your current ' + c.name + ' progress. Export it first to keep a copy.' : 'This starts a separate ' + c.name + ' record.', 'Earlier chapter saves remain intact.'], [{ label: 'Begin this ' + c.name + ' visit', primary: true, run: () => { s = M.validate(candidate); warning = ''; ui.close(); begin(true); } }, leave('Cancel')]); }
    function chooseBeginning() {
      say('choose-beginning', c.name.toUpperCase(), 'Choose the world that arrives here.', [...(warning ? [warning] : []), 'Continue your completed ' + c.previousName + ' record, import a save, or use a labelled standalone preview.'], [
        ...(incoming ? [{ label: 'Continue my ' + c.previousName + ' record', primary: true, run: () => confirmBeginning(M.fresh(incoming)) }] : []),
        ...['book', 'ledger', 'shelf'].map(id => ({ label: 'Preview: ' + c.previewNames[id], run: () => confirmBeginning(M.preview(id)) })),
        { label: 'Import a save', run: () => $('import-file').click() }, leave('Cancel')]);
    }
    function exportSave() { const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'afterimage-' + slug + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    function menu() { say('menu', c.name.toUpperCase() + ' / PAUSED', 'Take the time you need.', ['WASD or arrows move. Click or tap to walk. E or Interact opens an encounter. The Field journal offers named walking destinations.', 'Decisions are untimed. All clues are written. Audio is optional.', storageOK ? 'Progress saves separately in this browser. Export to keep a portable copy.' : 'Browser storage is unavailable. Export before closing.'], [leave(ui.active ? 'Return to ' + c.name : 'Return to title'), ...(ui.active ? [{ label: 'Open field journal', run: journal }] : []), { label: 'Export ' + c.name + ' (.json)', disabled: !ui.active && !saved, run: exportSave }, { label: 'Import a save', run: () => $('import-file').click() }, { label: 'Choose another beginning', run: chooseBeginning }, { label: 'Return to ' + c.previousName, run: () => { save(); location.href = c.previousURL; } }]); }
    $('import-file').addEventListener('change', async e => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      try {
        if (file.size > 100000) throw new Error('That file is too large to be a chapter record.'); const v = JSON.parse(await file.text()), candidate = v?.kind === s.kind ? M.validate(v) : M.fresh(v);
        say('confirm-import', 'IMPORT / ' + c.name.toUpperCase(), 'Use this chapter record?', [...c.record(candidate), 'This replaces ' + c.name + ' progress only. Earlier chapter saves remain intact.'], [{ label: 'Import and continue', primary: true, run: () => { s = candidate; warning = ''; ui.close(); begin(c.isNew(s)); } }, leave('Cancel')]);
      } catch (error) { say('import-failed', 'IMPORT FAILED', 'This record could not be read.', [error.message, 'Existing saves have not been changed.'], [leave('Return')]); }
    });
    function enter(room) { s.room = room; s.player = { x: 160, y: 555 }; ui.resetMovement(); save(); hud(); ui.toast(c.rooms[room]); }
    const api = { get state() { return s; }, ui, act, say, leave, save, hud, journal, exportSave, show: ui.show, transition(next) { ui.transition(() => { s = M.validate(next); save(); hud(); ui.toast('Courier 025. The agreed work remains.'); }); } };
    $('start').addEventListener('click', () => { if (saved) { s = M.validate(saved); begin(false); } else chooseBeginning(); });
    $('choose-origin').addEventListener('click', chooseBeginning); $('help').addEventListener('click', menu); $('home').addEventListener('click', e => { e.preventDefault(); menu(); }); $('journal').addEventListener('click', journal); hud(); return api;
  }
  root.AfterimageChapterFlow = { create };
})(typeof globalThis !== 'undefined' ? globalThis : this);
