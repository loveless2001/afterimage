// Day and night palettes (design §2.2). "auto" follows the system colour
// scheme and turns to night from the turn (run 6) as a sign the room has
// changed; "day" and "night" are manual overrides saved with the game.
// Sets <html data-theme> for the CSS tokens and G.night for the canvas.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  A.applyPalette = function () {
    const { palette, run } = G.state;
    G.night = palette === 'night' || (palette === 'auto' && (run >= S.turnRun || prefersDark.matches));
    document.documentElement.dataset.theme = G.night ? 'night' : 'day';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', G.night ? '#1f231e' : '#e7e5dc');
  };
  prefersDark.addEventListener?.('change', () => A.applyPalette());
  A.applyPalette();
})();
