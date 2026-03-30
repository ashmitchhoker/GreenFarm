/* ══════════════════════════════════════════════════════════
   GreenFarm — Camera  (follow player + zoom)
   ══════════════════════════════════════════════════════════ */

const Camera = (() => {
  let x = 0,
    y = 0;
  let zoom = CONFIG.IS_TOUCH
    ? CONFIG.ZOOM_DEFAULT_MOBILE
    : CONFIG.ZOOM_DEFAULT_DESKTOP;

  function update(player, vw, vh) {
    // Visible world area at current zoom
    const visW = vw / zoom;
    const visH = vh / zoom;

    // Centre on player
    x = player.x + player.w / 2 - visW / 2;
    y = player.y + player.h / 2 - visH / 2;

    // Clamp
    x = Math.max(0, Math.min(x, CONFIG.WORLD_W - visW));
    y = Math.max(-200, Math.min(y, CONFIG.WORLD_H - visH)); // Allow negative Y to reveal the extended top canvas area
  }

  function adjustZoom(delta) {
    zoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, zoom + delta));
  }

  function applyTransform(ctx) {
    ctx.setTransform(zoom, 0, 0, zoom, -x * zoom, -y * zoom);
  }

  function resetTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return {
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get zoom() {
      return zoom;
    },
    update,
    adjustZoom,
    applyTransform,
    resetTransform,
  };
})();
