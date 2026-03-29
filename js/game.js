/* ══════════════════════════════════════════════════════════
   GreenFarm — Game Loop & State
   ══════════════════════════════════════════════════════════ */

const Game = (() => {
  let canvas, ctx, miniCanvas, miniCtx;
  let VW, VH;

  const state = {
    pollution: CONFIG.INITIAL_POLLUTION,
    gameOver: false,
    gameWon: false,
    score: 0,
    totalCleaned: 0,
    inventory: {
      trash: 0,
      grains: 0,
    },
    tasks: {
      trashRequired: 3,
      trashCollected: 0,
      treesRequired: 3,
      treesPlanted: 0,
      housesRequired: 1,
      housesBuilt: 0,
      solarRequired: 1,
      solarInstalled: 0,
    },
  };

  let lastTime = 0;

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    miniCanvas = document.getElementById("minimap");
    miniCtx = miniCanvas.getContext("2d");

    miniCanvas.width = Math.round(CONFIG.WORLD_W * CONFIG.MINI_SCALE);
    miniCanvas.height = Math.round(CONFIG.WORLD_H * CONFIG.MINI_SCALE);

    resize();
    window.addEventListener("resize", resize);

    Objects.generateTrees();
    Renderer.init(ctx, miniCtx, miniCanvas.width, miniCanvas.height);
    if (typeof Shop !== "undefined") Shop.init();

    // Input setup
    if (CONFIG.IS_TOUCH) Input.initTouch();
    Input.initPinchZoom(canvas);
    Input.initWheelZoom(canvas);

    // Zoom buttons (mobile)
    const zoomIn = document.getElementById("btn-zoom-in");
    const zoomOut = document.getElementById("btn-zoom-out");
    if (zoomIn)
      zoomIn.addEventListener("click", () =>
        Camera.adjustZoom(CONFIG.ZOOM_STEP),
      );
    if (zoomOut)
      zoomOut.addEventListener("click", () =>
        Camera.adjustZoom(-CONFIG.ZOOM_STEP),
      );

    // Start
    updateTaskUI();
    requestAnimationFrame(loop);
  }

  function resize() {
    VW = window.innerWidth;
    VH = window.innerHeight;
    canvas.width = VW;
    canvas.height = VH;
  }

  /* ── Main loop ──────────────────────────────────────── */
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (!state.gameOver && !state.gameWon) {
      Input.pollKeyboard();
    }

    // Always call update so the player death animation and particles can progress
    if (!state.gameWon) {
      update(dt);
    }

    Renderer.draw(state, VW, VH);

    // Draw placement preview if active item
    const activeItem =
      typeof Shop !== "undefined" ? Shop.getActiveItem() : null;
    if (activeItem && !state.gameWon && !state.gameOver) {
      if (Input.mousePos) {
        // Convert screen to world coord using camera offset and zoom
        const wx = Input.mousePos.x / Camera.zoom + Camera.x;
        const wy = Input.mousePos.y / Camera.zoom + Camera.y;

        ctx.save();
        ctx.globalAlpha = 0.5;
        // Since we are rendering the preview, apply world transform first
        Camera.applyTransform(ctx);

        const img = new Image();
        img.src = activeItem.icon;

        ctx.translate(wx, wy);
        ctx.drawImage(
          img,
          -activeItem.w / 2,
          -activeItem.h / 2,
          activeItem.w,
          activeItem.h,
        );
        ctx.restore();

        if (Input.mouseClicked) {
          // Place item
          const placedItem = {
            id: "placed_" + Date.now(),
            x: wx - activeItem.w / 2,
            y: wy - activeItem.h / 2,
            w: activeItem.w,
            h: activeItem.h,
            type: activeItem.type,
            sprite: activeItem.icon,
            assetPath: activeItem.icon,
          };

          if (activeItem.type === "tree") {
            Objects.trees.push({
              x: wx - 30,
              y: wy + 10,
              w: 60,
              h: 80,
              type: Math.floor(Math.random() * 3),
              isPlanted: true,
            });
            state.tasks.treesPlanted++;
            Particles.spawnFloat(wx, wy, "Tree Planted!", "#4ade80");
          } else {
            Objects.interactables.push({
              ...placedItem,
              active: true,
              timer: 0,
            });
            if (activeItem.type === "mud_house") {
              state.tasks.housesBuilt++;
              Particles.spawnFloat(wx, wy, "Mud House Built!", "#4ade80");
            } else if (activeItem.type === "solar_panel") {
              state.tasks.solarInstalled++;
              Particles.spawnFloat(wx, wy, "Solar Panel Installed!", "#4ade80");
            }
          }

          Shop.clearActiveItem();
          Input.consumeClick();

          updateTaskUI();
        }
      }
    }

    requestAnimationFrame(loop);
  }

  function updateTaskUI() {
    // Hide all tasks first
    document.getElementById("task-trash").style.display = "none";
    document.getElementById("task-plant").style.display = "none";
    document.getElementById("task-house").style.display = "none";
    document.getElementById("task-solar").style.display = "none";

    // Show task logically in sequence
    if (state.tasks.trashCollected < state.tasks.trashRequired) {
      const el = document.getElementById("task-trash");
      el.style.display = "block";
      el.textContent = `- Throw Trash in Bin: ${state.tasks.trashCollected}/${state.tasks.trashRequired}`;
    } else if (state.tasks.treesPlanted < state.tasks.treesRequired) {
      const el = document.getElementById("task-plant");
      el.style.display = "block";
      el.textContent = `- Plant Trees: ${state.tasks.treesPlanted}/${state.tasks.treesRequired}`;
    } else if (state.tasks.housesBuilt < state.tasks.housesRequired) {
      const el = document.getElementById("task-house");
      el.style.display = "block";
      el.textContent = `- Build Mud House: ${state.tasks.housesBuilt}/${state.tasks.housesRequired}`;
    } else if (state.tasks.solarInstalled < state.tasks.solarRequired) {
      const el = document.getElementById("task-solar");
      el.style.display = "block";
      el.textContent = `- Install Solar Panel: ${state.tasks.solarInstalled}/${state.tasks.solarRequired}`;
    }

    checkWinCondition();
  }

  function checkWinCondition() {
    if (
      state.tasks.trashCollected >= state.tasks.trashRequired &&
      state.tasks.treesPlanted >= state.tasks.treesRequired &&
      state.tasks.housesBuilt >= state.tasks.housesRequired &&
      state.tasks.solarInstalled >= state.tasks.solarRequired
    ) {
      state.gameWon = true;
      const overlay = document.getElementById("overlay");
      const overlayTitle = document.getElementById("overlay-title");
      const overlayMsg = document.getElementById("overlay-msg");
      overlayTitle.textContent = "🌿 Tasks Completed!";
      overlayTitle.style.color = "#4ade80";
      overlayMsg.textContent =
        "You cleaned the farm and built a green future! Score: " + state.score;
      overlay.classList.add("active");
    }
  }

  /* ── Update ─────────────────────────────────────────── */
  function update(dt) {
    if (state.gameOver) {
      // Just update player animation (for death sequence) and particles, then return
      Player.move(dt, Objects.barriers);
      Particles.update(dt);

      // Delay showing the overlay until the death animation finishes
      const arr = Player.state.currentSprite; // just accessing state
      if (Player.state.isDead) {
        // Find total frames for Dead
        // 9 is the max index since there are 10 dead frames
        if (Player.state.frameIndex === 9) {
          showGameOverScreen();
        }
      }
      return;
    }

    // Passive pollution from all sources
    for (const obj of Objects.interactables) {
      // Passive pollution removed for educational mode
      if (obj.timer > 0) obj.timer -= dt;
    }
    state.pollution = Math.max(0, Math.min(state.pollution, 100));

    // Player
    Player.move(dt, Objects.barriers);
    Camera.update(Player.state, VW, VH);

    // Nearest interactable
    const hintEl = document.getElementById("interaction-hint");
    let nearest = null,
      nearestDist = Infinity;
    for (const obj of Objects.interactables) {
      if (!obj.active && obj.type === "trashbag") continue; // skip picked up trash

      const d = Utils.centreDist(Player.state, obj);
      const ir = Objects.getInteractRadius(obj);
      if (d < ir && d < nearestDist) {
        nearest = obj;
        nearestDist = d;
      }
    }

    if (nearest && nearest.timer <= 0) {
      hintEl.classList.add("visible");

      let actionLabel = nearest.interactLabel;
      if (nearest.type === "trashcan") {
        if (state.inventory.trash > 0) {
          actionLabel = `Throw trash in bin (${state.inventory.trash} carrying)`;
        } else {
          actionLabel = `Bin is empty (Find trash on the ground!)`;
        }
      } else if (nearest.type === "trashbag") {
        actionLabel = "Pick up trash";
      }

      hintEl.innerHTML = CONFIG.IS_TOUCH
        ? `Tap <strong>E</strong> — ${actionLabel}`
        : `Press <strong>E</strong> — ${actionLabel}`;
    } else {
      hintEl.classList.remove("visible");
    }

    // Interaction
    if (Input.interact && nearest && nearest.timer <= 0) {
      if (nearest.type === "trashcan" && state.inventory.trash === 0) {
        // Can't interact with bin if no trash
        Input.consumeInteract();
      } else {
        const cx = nearest.x + nearest.w / 2;
        const cy = nearest.y + nearest.h / 2;
        let pts = nearest.interactEffect
          ? Math.abs(nearest.interactEffect) * 10
          : 0;

        if (nearest.type === "trashbag") {
          state.inventory.trash++;
          nearest.active = false; // "Remove" the trash
          pts = 10; // Give some points just for picking up
          Particles.spawnFloat(cx, cy - 20, "Trash picked up!", "#4ade80");
        } else if (nearest.type === "trashcan") {
          const thrown = state.inventory.trash;
          state.tasks.trashCollected += thrown;
          state.inventory.trash = 0;
          pts = thrown * 20; // 20 points per trash thrown in bin
          Particles.spawnFloat(cx, cy - 20, "+" + pts + " Points!", "#4ade80");
          updateTaskUI();
        } else if (nearest.type === "windmill") {
          if (!nearest.isOn) {
            nearest.isOn = true;
            nearest.timer = nearest.cooldown || 999999; // keep it on, prevent farming points
            pts = 50;
            Particles.spawnFloat(
              cx,
              cy - 20,
              "Windmill Active! +50",
              "#4ade80",
            );
          }
        } else {
          Particles.spawnFloat(cx, cy - 20, "+" + pts, "#4ade80");
        }

        nearest.timer = nearest.cooldown;
        Particles.spawnRipple(cx, cy, RIPPLE_COLORS[nearest.type] || "#fff");

        state.score += pts;
        state.totalCleaned++;

        Input.consumeInteract();
      }
    }

    // Factory smoke
    for (const obj of Objects.interactables) {
      if (obj.type === "factory" && obj.active) {
        if (Math.random() < (state.pollution / 60) * dt * 40) {
          Particles.spawnSmoke(obj.x, obj.y, obj.w);
        }
      }
    }

    Particles.update(dt);

    /*
    // Win / Lose removed for now - will be replaced with tasks
    if (state.pollution >= 100) {
      state.gameOver = true;
      Player.setDead();
      return;
    }

    if (state.pollution <= 0) {
      state.gameWon = true;
      const overlay = document.getElementById("overlay");
      const overlayTitle = document.getElementById("overlay-title");
      const overlayMsg = document.getElementById("overlay-msg");
      overlayTitle.textContent = "🌿 You Win!";
      overlayTitle.style.color = "#4ade80";
      overlayMsg.textContent =
        "Farm completely clean! Score: " +
        state.score +
        " · Cleanups: " +
        state.totalCleaned;
      overlay.classList.add("active");
    }
    */
  }

  function showGameOverScreen() {
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMsg = document.getElementById("overlay-msg");

    if (!overlay.classList.contains("active")) {
      overlayTitle.textContent = "💀 Game Over";
      overlayTitle.style.color = "#f87171";
      overlayMsg.textContent =
        "Pollution overwhelmed the farm! Score: " + state.score;
      overlay.classList.add("active");
    }
  }

  /* ── Restart ────────────────────────────────────────── */
  function restart() {
    state.pollution = CONFIG.INITIAL_POLLUTION;
    state.gameOver = false;
    state.gameWon = false;
    state.score = 0;
    state.totalCleaned = 0;
    state.tasks.trashCollected = 0;
    state.tasks.treesPlanted = 0;
    state.tasks.housesBuilt = 0;
    state.tasks.solarInstalled = 0;
    updateTaskUI();
    Particles.reset();
    Objects.resetTimers();
    Player.reset();
    document.getElementById("overlay").classList.remove("active");
  }

  return { init, restart };
})();
