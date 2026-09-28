// Modal conversation window: speaker, title, paragraphs and choice buttons.
// Paragraphs written as "[...]" render as system asides. An optional scene (a
// paper view such as the notice wall, see notice-board-and-pinned-card-views.js)
// sits above the paragraphs; its data-size ('wide' for the wall, 'book' for the
// run log) sets the dialog's width. While a dialog is
// open the rest of the page is inert, Tab stays inside it, and Escape runs
// the dialog's escape action (close by default).
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, $ = A.$;

  // choices: [{ label, detail?, primary?, selected?, toggle?, disabled?, run }]
  A.dialog = function (speaker, title, paragraphs, choices, onEscape, scene) {
    if (!G.modalOpen) G.returnFocus = document.activeElement;
    G.modalOpen = true; G.target = null; G.keys.clear(); G.escapeAction = onEscape || A.closeDialog;
    $('speaker').textContent = speaker; $('dialog-title').textContent = title;
    $('dialog-body').replaceChildren(...(scene ? [scene] : [])); $('choices').replaceChildren(); $('choices').className = '';
    const box = document.querySelector('.dialog'); box.classList.remove('wide', 'book'); if (scene?.dataset.size) box.classList.add(scene.dataset.size);
    paragraphs.forEach(text => {
      const p = document.createElement('p');
      if (text.startsWith('[')) { p.className = 'aside'; text = text.slice(1, -1); }
      p.textContent = text; $('dialog-body').append(p);
    });
    choices.forEach(choice => {
      const b = document.createElement('button'); b.textContent = choice.label;
      if (choice.detail) { const small = document.createElement('small'); small.textContent = choice.detail; b.append(small); }
      if (choice.primary) b.className = 'primary';
      if (choice.selected) { b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); }
      else if (choice.toggle) b.setAttribute('aria-pressed', 'false');
      b.disabled = Boolean(choice.disabled); b.addEventListener('click', choice.run); $('choices').append(b);
    });
    $('modal').hidden = false; $('hud').inert = true; document.querySelector('header').inert = true; $('cover').inert = true;
    // Cards in a scene come first when a choice is asked of them.
    $('modal').querySelector('#dialog-body button:not(:disabled), #choices button:not(:disabled)')?.focus();
  };
  A.closeDialog = function () {
    G.modalOpen = false; $('modal').hidden = true; $('hud').inert = false;
    document.querySelector('header').inert = false; $('cover').inert = false;
    G.returnFocus?.focus(); G.returnFocus = null; G.escapeAction = null; A.updateHUD();
    A.endRunIfSpent();
  };
  // The standard "walk away" choice that simply closes the dialog.
  A.leave = (label = 'Step away') => ({ label, run: A.closeDialog });

  // Keep keyboard focus cycling inside the open dialog.
  window.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !G.modalOpen) return;
    const buttons = [...$('modal').querySelectorAll('button:not(:disabled)')], first = buttons[0], last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  });
})();
