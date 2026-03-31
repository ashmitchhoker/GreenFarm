/* ══════════════════════════════════════════════════════════
   GreenFarm — Particles  (smoke, ripples, floating text)
   ══════════════════════════════════════════════════════════ */

const Particles = (() => {
  let smoke = [];
  let ripples = [];
  let floats = [];

  function spawnSmoke(fx, fy, fw) {
    smoke.push({
      x: fx + fw / 2 + (Math.random() - .5) * 50,
      y: fy - 6,
      r: 5 + Math.random() * 8,
      life: 1,
      vx: (Math.random() - .5) * 24,
      vy: -40 - Math.random() * 30,
      alpha: .55 + Math.random() * .3,
    });
  }

  function spawnRipple(x, y, color) {
    ripples.push({ x, y, r: 14, alpha: .7, color });
  }

  function spawnFloat(x, y, text, color, isCoin=false) {
    floats.push({ x, y, text, color, life: 1.5, vy: -50, isCoin });
  }

  function update(dt) {
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .5;
      if (p.life <= 0) smoke.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += 140 * dt; r.alpha -= dt;
      if (r.alpha <= 0) ripples.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.y += f.vy * dt; f.life -= dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
  }

  function reset() { smoke = []; ripples = []; floats = []; }

  return {
    get smoke()   { return smoke; },
    get ripples() { return ripples; },
    get floats()  { return floats; },
    spawnSmoke, spawnRipple, spawnFloat, update, reset,
  };
})();
