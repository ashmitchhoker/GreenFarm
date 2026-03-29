/* ══════════════════════════════════════════════════════════
   GreenFarm — World objects  (interactables, trees, animals)
   ══════════════════════════════════════════════════════════ */

const Objects = (() => {
  // Build interactables from defs
  const interactables = INTERACTABLE_DEFS.map((d) => ({
    ...d,
    color: d.color || "#888",
    active: true,
    timer: 0,
  }));

  const barriers = BARRIER_DEFS.map((d) => ({ ...d }));
  const animals = ANIMAL_DEFS.map((d) => ({ ...d }));
  const trees = [];

  function getInteractRadius(obj) {
    return Math.max(obj.w, obj.h) + 50;
  }

  function generateTrees() {
    trees.length = 0;
    const avoid = [
      ...interactables,
      barriers[4],
      barriers[5],
      {
        x: CONFIG.WORLD_W / 2 - 60,
        y: CONFIG.WORLD_H / 2 - 60,
        w: 120,
        h: 120,
      },
    ];

    // Tree generation zones for a structured town
    const zones = [
      { x: 100, y: 800, w: 1200, h: 500, density: 25 }, // Forest buffer below the farm
      { x: 1300, y: 150, w: 500, h: 500, density: 15 }, // Park area
      { x: 2000, y: 800, w: 1000, h: 500, density: 30 }, // Another dense forest buffer above the river
      { x: 100, y: 1800, w: 2000, h: 500, density: 35 }, // South forest across the river
    ];

    for (const z of zones) {
      let zoneCurrent = 0;
      let attempts = 0;
      while (zoneCurrent < z.density && attempts < 200) {
        attempts++;
        const tx = z.x + Math.random() * z.w;
        const ty = z.y + Math.random() * z.h;
        const r = { x: tx, y: ty, w: 28, h: 36 };

        let ok = true;
        for (const a of avoid) {
          if (
            Utils.rectsOverlap(r, {
              x: a.x - 40,
              y: a.y - 40,
              w: (a.w || 0) + 80,
              h: (a.h || 0) + 80,
            })
          ) {
            ok = false;
            break;
          }
        }

        if (ok) {
          trees.push({ x: tx, y: ty, type: Math.floor(Math.random() * 3) });
          zoneCurrent++;
        }
      }
    }
  }

  function resetTimers() {
    for (const o of interactables) o.timer = 0;
  }

  return {
    interactables,
    barriers,
    animals,
    trees,
    getInteractRadius,
    generateTrees,
    resetTimers,
  };
})();
