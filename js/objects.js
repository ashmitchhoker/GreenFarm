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
    if (obj.type === "oil_spill") {
      return Math.max(obj.w, obj.h) + 10; // Very small distance requirement
    }
    return Math.max(obj.w, obj.h) + 50;
  }

  function generateTrees() {
    trees.length = 0;
    const avoid = [
      ...interactables,
      ...barriers,
      {
        x: CONFIG.WORLD_W / 2 - 60,
        y: CONFIG.WORLD_H / 2 - 60,
        w: 120,
        h: 120,
      },
      // Avoid the roads to prevent trees on them
      { x: 1560, y: 0, w: 140, h: 2400 }, // Full main vertical road
      { x: 0, y: 200, w: 3200, h: 140 }, // Horizontal road 1
      { x: 0, y: 540, w: 3200, h: 140 }, // Horizontal road 2
      { x: 0, y: 880, w: 3200, h: 140 }, // Horizontal road 3
      { x: 0, y: 1220, w: 3200, h: 140 }, // Horizontal road 4
    ];

    // Tree generation zones for a structured town
    const zones = [
      // Removed forest buffer right side and above the river, moving them below the river uniformly
      { x: 50, y: 1950, w: 3100, h: 350, density: 90 }, // South forest uniformly below the river
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
