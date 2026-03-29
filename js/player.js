/* ══════════════════════════════════════════════════════════
   GreenFarm — Player
   ══════════════════════════════════════════════════════════ */

const Player = (() => {
  const PlayerSprites = {
    Idle: [],
    Run: [],
    Dead: [],
  };

  const SPRITE_COUNTS = {
    Idle: 10,
    Run: 8,
    Dead: 10,
  };

  let loadedCount = 0;
  const totalImages =
    SPRITE_COUNTS.Idle + SPRITE_COUNTS.Run + SPRITE_COUNTS.Dead;

  for (const [s, count] of Object.entries(SPRITE_COUNTS)) {
    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.src = `assets/character/${s} (${i}).png`;
      img.onload = () => loadedCount++;
      PlayerSprites[s].push(img);
    }
  }

  const state = {
    x: CONFIG.WORLD_W / 2 - CONFIG.PLAYER_W / 2,
    y: CONFIG.WORLD_H / 2 - CONFIG.PLAYER_H / 2,
    w: CONFIG.PLAYER_W,
    h: CONFIG.PLAYER_H,
    speed: CONFIG.PLAYER_SPEED,
    color: CONFIG.PLAYER_COLOR,

    animState: "Idle",
    frameIndex: 0,
    animTimer: 0,
    flipX: false,
    isDead: false,

    get imagesReady() {
      return loadedCount === totalImages;
    },
    get currentSprite() {
      if (!this.imagesReady) return null;
      const arr = PlayerSprites[this.animState];
      if (!arr) return null;
      return arr[this.frameIndex] || null;
    },
  };

  const ANIM_SPEED = 0.05; // Quick animation speed

  function setDead() {
    if (!state.isDead) {
      state.isDead = true;
      state.animState = "Dead";
      state.frameIndex = 0;
      state.animTimer = 0;
    }
  }

  function move(dt, barriers) {
    if (state.isDead) {
      // Allow animation to play until the last frame of "Dead"
      state.animTimer += dt;
      if (state.animTimer >= ANIM_SPEED) {
        state.animTimer = 0;
        const arr = PlayerSprites[state.animState];
        if (arr && state.frameIndex < arr.length - 1) {
          state.frameIndex++;
        }
      }
      return; // Do not allow controls or movement if dead
    }

    const d = Input.dir;
    const nx = state.x + d.x * state.speed * dt;
    const ny = state.y + d.y * state.speed * dt;

    const testX = { x: nx, y: state.y, w: state.w, h: state.h };
    const testY = { x: state.x, y: ny, w: state.w, h: state.h };

    let bX = false,
      bY = false;
    for (const b of barriers) {
      if (Utils.rectsOverlap(testX, b)) bX = true;
      if (Utils.rectsOverlap(testY, b)) bY = true;
    }
    if (!bX) state.x = nx;
    if (!bY) state.y = ny;

    // Animation Logic
    if (d.x !== 0 || d.y !== 0) {
      state.animState = "Run";
      if (d.x < 0) state.flipX = true;
      else if (d.x > 0) state.flipX = false;
    } else {
      state.animState = "Idle";
    }

    state.animTimer += dt;
    if (state.animTimer >= ANIM_SPEED) {
      state.animTimer = 0;
      const arr = PlayerSprites[state.animState];
      if (arr && arr.length > 0) {
        state.frameIndex = (state.frameIndex + 1) % arr.length;
      }
    }
  }

  function reset() {
    state.x = CONFIG.WORLD_W / 2 - CONFIG.PLAYER_W / 2;
    state.y = CONFIG.WORLD_H / 2 - CONFIG.PLAYER_H / 2;
    state.isDead = false;
    state.animState = "Idle";
    state.frameIndex = 0;
  }

  return { state, move, reset, setDead };
})();
