// The ending's long exposure: the room darkens, every run's route is traced in
// light at once (the newest brightest, a bright point wherever something was
// used), then the lamps the room kept come on, and it settles into one picture
// with a caption. "Keep this picture" saves it as a PNG with the caption drawn
// in. Input waits while it plays (G.transitioning), any key or click skips to
// the settled picture, and under reduced motion the last frame shows at once. A room calls A.longExposure.play({ eyebrow, title,
// detail, file, done }); the frame loop draws it over the room.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, ctx = A.ctx, $ = A.$, { project } = A;
  const dark = .8, traced = 5.5, lit = 6.5, settled = 6.9; // seconds into the exposure
  const clamp01 = v => Math.max(0, Math.min(1, v));
  let caption = null;

  // One run's route in light: older runs amber and faint, the newest pale and bright.
  function route(trail, f, age) {
    const points = A.trails.upTo(trail, f).map(p => project(p[0], p[1], 3)), k = G.scale;
    const color = age ? `rgba(226,178,98,${(.62 - .08 * Math.min(age, 5)).toFixed(2)})` : 'rgba(255,241,199,.95)';
    ctx.lineWidth = (age ? 2 : 3) * k; ctx.lineJoin = ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10 * k;
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    ctx.fillStyle = color;
    A.trails.upTo(trail, f).forEach(p => { if (p[2]) { const q = project(p[0], p[1], 3); ctx.beginPath(); ctx.arc(q.x, q.y, 3.2 * k, 0, Math.PI * 2); ctx.fill(); } });
    if (f < 1) { const head = points.at(-1); ctx.fillStyle = '#fff8e2'; ctx.beginPath(); ctx.arc(head.x, head.y, 3.5 * k, 0, Math.PI * 2); ctx.fill(); }
  }

  // Any key, click or tap while it plays jumps to the settled picture.
  function skip(event) {
    if (!G.exposure || caption) return;
    if (event.type === 'keydown') event.preventDefault();
    G.exposure.start = performance.now() - settled * 1000;
  }
  document.addEventListener('keydown', skip); A.canvas.addEventListener('pointerdown', skip);

  A.longExposure = {
    play(options) {
      G.transitioning = true; G.target = null; G.exposure = { ...options, start: performance.now() };
      document.body.classList.add('exposure');
    },
    // Called by the frame loop after the room is drawn.
    draw() {
      const x = G.exposure, t = A.reducedMotion ? settled : (performance.now() - x.start) / 1000, state = G.state;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(38,44,58,${(.8 * clamp01(t / dark)).toFixed(3)})`; ctx.fillRect(0, 0, G.width, G.height);
      ctx.globalCompositeOperation = 'lighter';
      const trails = A.trails.all(state), runs = Object.keys(trails).map(Number), newest = Math.max(...runs);
      runs.forEach(run => route(trails[run], clamp01((t - dark) / (traced - dark)), newest - run));
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'screen';
      if (t > traced) A.room.lightPools(state, .55 * clamp01((t - traced) / (lit - traced)));
      ctx.restore();
      if (t >= settled && !caption) showCaption(x, runs.length);
    }
  };

  function showCaption(x, routes) {
    caption = document.createElement('section'); caption.className = 'exposure-caption';
    caption.setAttribute('role', 'dialog'); caption.setAttribute('aria-labelledby', 'exposure-title'); caption.setAttribute('aria-describedby', 'exposure-detail exposure-alt');
    const text = (tag, className, value) => { const el = document.createElement(tag); if (className) el.className = className; el.textContent = value; return el; };
    const title = text('h2', '', x.title); title.id = 'exposure-title';
    const described = routes ? `${routes} ${routes === 1 ? 'route' : 'routes'} drawn in light over the room, and the lamps it kept.` : 'No routes were kept in this browser, only the lamps.';
    const detail = text('p', 'exposure-detail', x.detail), alt = text('p', 'exposure-alt', described), status = text('p', 'exposure-status', '');
    detail.id = 'exposure-detail'; alt.id = 'exposure-alt'; status.setAttribute('role', 'status');
    const keep = text('button', '', 'Keep this picture'), next = text('button', 'primary', 'Continue');
    keep.addEventListener('click', () => keepPicture(x, keep, status)); next.addEventListener('click', () => finish(x));
    const buttons = document.createElement('div'); buttons.className = 'exposure-choices'; buttons.append(keep, next);
    caption.append(text('p', 'eyebrow', x.eyebrow), title, detail, alt, buttons, status);
    document.body.append(caption); next.focus();
  }
  function finish(x) {
    if (!caption) return;
    caption.remove(); caption = null; G.exposure = null; G.transitioning = false;
    document.body.classList.remove('exposure'); x.done();
  }
  // The canvas as it stands, with the caption in a band below it.
  function keepPicture(x, button, status) {
    const failed = () => { button.disabled = false; status.textContent = 'This browser could not save the picture.'; };
    button.disabled = true; status.textContent = 'Saving the picture…';
    try {
      const source = A.canvas, band = Math.round(source.width * .085), out = document.createElement('canvas');
      out.width = source.width; out.height = source.height + band;
      const c = out.getContext('2d'), u = band / 100;
      c.fillStyle = '#1b1f1a'; c.fillRect(0, 0, out.width, out.height); c.drawImage(source, 0, 0);
      c.fillStyle = '#d27a6a'; c.font = `${Math.round(13 * u)}px monospace`; c.fillText(x.eyebrow, 36 * u, source.height + 32 * u);
      c.fillStyle = '#e4e2d6'; c.font = `italic ${Math.round(30 * u)}px Georgia, serif`; c.fillText(x.title, 36 * u, source.height + 68 * u);
      c.fillStyle = '#a3a697'; c.font = `${Math.round(13 * u)}px monospace`; c.fillText(x.detail, 36 * u, source.height + 90 * u);
      c.textAlign = 'right'; c.fillText('AFTERIMAGE', out.width - 36 * u, source.height + 90 * u);
      out.toBlob(blob => {
        if (!blob) return failed();
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = x.file;
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 60000);
        button.disabled = false; status.textContent = `Saved as ${x.file}.`;
      }, 'image/png');
    } catch (_) { failed(); }
  }
})();
