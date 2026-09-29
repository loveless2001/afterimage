// Room 07's title screen, for a new game only: a faint figure walks in from
// the entrance, stops at the notice hall lamp until it glows, walks on behind
// the east stacks to the exit and fades, and the glow dies after it. Someone
// was here before you. Drawn only before the game starts (the frame loop calls
// A.room.coverScene); nothing is saved, and the lamp stays dark in the room
// you enter. Under reduced motion the figure stands by the lit lamp.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, ctx = A.ctx, draw = A.drawRoom, { project, lightPool } = A;
  const lamp = A.fixedObjects.find(o => o.id === 'lamp-hall'), stand = [lamp.x + 15, lamp.y + 33];
  // Up the open middle (clear of the stacks) to the lamp; then behind the east stacks to the exit.
  const toLamp = [[450, 600], [560, 420], [560, 250], stand], toExit = [stand, [700, 88], [885, 76]];
  const speed = 110, hold = 3, rest = 2.5, fade = .8, dim = 4; // room units a second; seconds
  const lengthOf = path => path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);
  const walkIn = lengthOf(toLamp) / speed, walkOut = lengthOf(toExit) / speed, leaves = walkIn + hold, period = leaves + walkOut + rest;
  // The point `d` room units along a path.
  function along(path, d) {
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i], leg = Math.hypot(bx - ax, by - ay);
      if (d <= leg) return { x: ax + (bx - ax) * d / leg, y: ay + (by - ay) * d / leg };
      d -= leg;
    }
    return { x: path.at(-1)[0], y: path.at(-1)[1] };
  }
  const clamp01 = v => Math.max(0, Math.min(1, v));

  A.room.coverScene = function (state) {
    if (!A.room.isNew(state)) return; // a returning player sees their own afterimages instead
    const t = A.reducedMotion ? walkIn + 1 : G.time % period, gone = leaves + walkOut;
    const at = t < walkIn ? along(toLamp, t * speed) : t < leaves ? { x: stand[0], y: stand[1] } : along(toExit, (t - leaves) * speed);
    const glow = t < walkIn ? 0 : t < leaves ? clamp01((t - walkIn) / fade) : clamp01(1 - (t - leaves) / dim);
    const seen = t > gone ? 0 : Math.min(clamp01(t / fade), clamp01((gone - t) / fade));
    if (glow) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      lightPool(lamp.x, lamp.y, 170, `rgba(251,239,194,${(.8 * glow).toFixed(3)})`);
      lightPool(lamp.x, lamp.y, 55, `rgba(255,243,200,${(.75 * glow).toFixed(3)})`, 66);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = glow;
      const bulb = project(lamp.x, lamp.y, 66); ctx.fillStyle = '#f3e2a4'; ctx.beginPath(); ctx.arc(bulb.x, bulb.y, 7 * G.scale, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (seen) draw.afterimage(at.x, at.y, .42 * seen);
  };
})();
