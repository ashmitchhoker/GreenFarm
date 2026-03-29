/* ══════════════════════════════════════════════════════════
   GreenFarm — Utility helpers
   ══════════════════════════════════════════════════════════ */

const Utils = {
  rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  },

  centreDist(a, b) {
    const ax = a.x + (a.w || 0) / 2, ay = a.y + (a.h || 0) / 2;
    const bx = b.x + (b.w || 0) / 2, by = b.y + (b.h || 0) / 2;
    return Math.hypot(ax - bx, ay - by);
  },

  lerpColor(a, b, t) {
    const p = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
    const [ar,ag,ab] = p(a);
    const [br,bg,bb] = p(b);
    return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
  },
};
