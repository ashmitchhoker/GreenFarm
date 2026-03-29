/* ══════════════════════════════════════════════════════════
   GreenFarm — Input  (keyboard + touch joystick)
   ══════════════════════════════════════════════════════════ */

const Input = (() => {
  // Normalised direction: { x: -1..1, y: -1..1 }
  let dir = { x: 0, y: 0 };
  let interactPressed = false;
  let mousePos = { x: 0, y: 0 };
  let mouseClicked = false;

  // ── Keyboard ───────────────────────────────────────────
  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener(
    "mousemove",
    (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    },
    { capture: true },
  );
  window.addEventListener(
    "mousedown",
    (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      mouseClicked = true;
    },
    { capture: true },
  );
  window.addEventListener(
    "mouseup",
    (e) => {
      mouseClicked = false;
    },
    { capture: true },
  );
  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        mousePos.x = e.touches[0].clientX;
        mousePos.y = e.touches[0].clientY;
        mouseClicked = true;
      }
    },
    { passive: true, capture: true },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 1) {
        mousePos.x = e.touches[0].clientX;
        mousePos.y = e.touches[0].clientY;
      }
    },
    { passive: true, capture: true },
  );
  window.addEventListener(
    "touchend",
    (e) => {
      mouseClicked = false;
    },
    { passive: true, capture: true },
  );

  function pollKeyboard() {
    let dx = 0,
      dy = 0;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    dir.x = dx;
    dir.y = dy;

    if (keys["e"]) {
      interactPressed = true;
      keys["e"] = false;
    }
  }

  // ── Touch joystick ────────────────────────────────────
  let joystickActive = false;
  let joystickOrigin = { x: 0, y: 0 };
  const JOYSTICK_RADIUS = 50;

  function initTouch() {
    const zone = document.getElementById("joystick-zone");
    const thumb = document.getElementById("joystick-thumb");
    const btn = document.getElementById("btn-interact");

    if (!zone || !thumb || !btn) return;

    // Show controls
    document.getElementById("touch-controls").style.display = "block";

    // Joystick
    zone.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const rect = zone.getBoundingClientRect();
        joystickOrigin.x = rect.left + rect.width / 2;
        joystickOrigin.y = rect.top + rect.height / 2;
        joystickActive = true;
      },
      { passive: false },
    );

    zone.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (!joystickActive) return;
        const t = e.touches[0];
        let dx = t.clientX - joystickOrigin.x;
        let dy = t.clientY - joystickOrigin.y;
        const dist = Math.hypot(dx, dy);
        if (dist > JOYSTICK_RADIUS) {
          dx = (dx / dist) * JOYSTICK_RADIUS;
          dy = (dy / dist) * JOYSTICK_RADIUS;
        }
        // Move thumb visual
        thumb.style.left = 43 + dx + "px";
        thumb.style.top = 43 + dy + "px";
        // Normalise to -1..1
        dir.x = dx / JOYSTICK_RADIUS;
        dir.y = dy / JOYSTICK_RADIUS;
      },
      { passive: false },
    );

    const endJoystick = () => {
      joystickActive = false;
      dir.x = 0;
      dir.y = 0;
      thumb.style.left = "43px";
      thumb.style.top = "43px";
    };
    zone.addEventListener("touchend", endJoystick);
    zone.addEventListener("touchcancel", endJoystick);

    // Interact button
    btn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        interactPressed = true;
      },
      { passive: false },
    );
  }

  // ── Pinch-to-zoom ─────────────────────────────────────
  let lastPinchDist = 0;
  function initPinchZoom(canvasEl) {
    canvasEl.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 2) {
          lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
        }
      },
      { passive: true },
    );

    canvasEl.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
          const delta = dist - lastPinchDist;
          Camera.adjustZoom(delta * CONFIG.ZOOM_PINCH_SENSITIVITY);
          lastPinchDist = dist;
        }
      },
      { passive: true },
    );
  }

  // ── Mouse wheel zoom (desktop) ────────────────────────
  function initWheelZoom(canvasEl) {
    canvasEl.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        Camera.adjustZoom(e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP);
      },
      { passive: false },
    );
  }

  // ── Public API ─────────────────────────────────────────
  return {
    get dir() {
      return dir;
    },
    get interact() {
      return interactPressed;
    },
    consumeInteract() {
      interactPressed = false;
    },
    get mousePos() {
      return mousePos;
    },
    get mouseClicked() {
      return mouseClicked;
    },
    consumeClick() {
      mouseClicked = false;
    },
    pollKeyboard,
    initTouch,
    initPinchZoom,
    initWheelZoom,
  };
})();
