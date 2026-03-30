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
        let wx = Input.mousePos.x / Camera.zoom + Camera.x;
        let wy = Input.mousePos.y / Camera.zoom + Camera.y;
        let renderW = activeItem.w;
        let renderH = activeItem.h;

        // Snapping logic for solar panel on house roofs
        if (activeItem.type === "solar_panel") {
          for (let b of Objects.barriers) {
            if (b.type === "house1" || b.type === "house2") {
              const roofX = b.x + b.w / 2;
              const roofY = b.y + b.h * 0.1; // Placed higher up on the roof, avoiding windows
              const dx = wx - roofX;
              const dy = wy - (b.y + b.h / 2); // Distance to center of house

              if (Math.hypot(dx, dy) < 140) {
                // Snap radius
                wx = roofX;
                wy = roofY;
                // Scale to fit visually on the roof
                renderW = Math.min(activeItem.w, b.w * 0.5);
                renderH = renderW * (activeItem.h / activeItem.w);
                break;
              }
            }
          }
        }

        // Snapping logic for mud house on magnetic placeholder
        if (activeItem.type === "mud_house") {
          for (let b of Objects.barriers) {
            if (b.type === "mud_house_placeholder" && !b.filled) {
              const cx = b.x + b.w / 2;
              const cy = b.y + b.h / 2;
              const dx = wx - cx;
              const dy = wy - cy;

              if (Math.hypot(dx, dy) < 200) {
                // Snap exactly to center of the placeholder
                wx = cx;
                wy = cy;
                break;
              }
            }
          }
        }

        ctx.save();
        ctx.globalAlpha = 0.5;
        // Since we are rendering the preview, apply world transform first
        Camera.applyTransform(ctx);

        const img = new Image();
        img.src = activeItem.icon;

        ctx.translate(wx, wy);
        ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
        ctx.restore();

        if (Input.mouseClicked) {
          // Place item
          const placedItem = {
            id: "placed_" + Date.now(),
            x: wx - renderW / 2,
            y: wy - renderH / 2,
            w: renderW,
            h: renderH,
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

              // Mark the nearest placeholder as filled so we don't snap to it anymore
              for (let b of Objects.barriers) {
                if (b.type === "mud_house_placeholder" && !b.filled) {
                  const cx = b.x + b.w / 2;
                  const cy = b.y + b.h / 2;
                  if (Math.hypot(wx - cx, wy - cy) < 50) {
                    // close enough to snap center
                    b.filled = true;
                  }
                }
              }
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
      if (
        !obj.active &&
        (obj.type === "trashbag" || obj.type.startsWith("plastic_bottle"))
      )
        continue; // skip picked up trash
      if (!obj.interactLabel) continue; // skip decorative placed items

      const d = Utils.centreDist(Player.state, obj);
      const ir = Objects.getInteractRadius(obj);
      if (d < ir && d < nearestDist) {
        nearest = obj;
        nearestDist = d;
      }
    }

    if (nearest && nearest.timer <= 0) {
      hintEl.classList.add("visible");

      hintEl.innerHTML = CONFIG.IS_TOUCH
        ? `Tap <strong>E</strong>`
        : `Press <strong>E</strong>`;
    } else {
      hintEl.classList.remove("visible");
    }

    // Interaction
    if (Input.interact && nearest && nearest.timer <= 0) {
      if (nearest.type.startsWith("trashcan") && state.inventory.trash === 0) {
        // Can't interact with bin if no trash
        Input.consumeInteract();
      } else {
        const cx = nearest.x + nearest.w / 2;
        const cy = nearest.y + nearest.h / 2;
        let pts = nearest.interactEffect
          ? Math.abs(nearest.interactEffect) * 10
          : 0;

        if (
          nearest.type === "trashbag" ||
          nearest.type.startsWith("plastic_bottle")
        ) {
          state.inventory.trash++;
          nearest.active = false; // "Remove" the trash
          pts = 10; // Give some points just for picking up
          Particles.spawnFloat(
            cx,
            cy - 20,
            nearest.type.startsWith("plastic_bottle")
              ? "Bottle picked up!"
              : "Trash picked up!",
            "#4ade80",
          );
        } else if (nearest.type === "garbage_truck") {
          const streetBin = Objects.interactables.find(
            (o) => o.type === "trashcan_street",
          );
          if (!nearest.isMoving) {
            if (streetBin && streetBin.trashCount > 0) {
              nearest.isMoving = true;
              nearest.actionState = "going";
              nearest.startX = nearest.x;
              nearest.targetX = streetBin.x - nearest.w + 40; // stop right at it
              pts = 50;
              Particles.spawnFloat(
                cx,
                cy - 20,
                "Truck Dispatched! +50",
                "#4ade80",
              );
            } else {
              pts = 0;
              Particles.spawnFloat(
                cx,
                cy - 20,
                "No trash on street!",
                "#ef4444",
              );
            }
          } else {
            pts = 0;
          }
        } else if (nearest.type.startsWith("trashcan")) {
          const thrown = state.inventory.trash;
          if (nearest.type === "trashcan_street") {
            nearest.trashCount = (nearest.trashCount || 0) + thrown;
          }
          state.tasks.trashCollected += thrown;
          state.inventory.trash = 0;
          pts = thrown * 20; // 20 points per trash thrown in bin
          Particles.spawnFloat(cx, cy - 20, "+" + pts + " Points!", "#4ade80");
          updateTaskUI();
        } else if (nearest.type === "windmill_controller") {
          if (!nearest.isOn) {
            nearest.isOn = true;
            nearest.timer = nearest.cooldown || 999999;
            nearest.interactLabel = ""; // Disable further interactions
            pts = 50;

            // Turn on all windmills
            Objects.interactables.forEach((obj) => {
              if (obj.type === "windmill") {
                obj.isOn = true;
                obj.timer = 999999;
                obj.interactLabel = "";
              }
            });

            Particles.spawnFloat(
              cx,
              cy - 20,
              "Windmills Active! +50",
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

    // Factory smoke and truck movement
    for (const obj of Objects.interactables) {
      if (obj.type === "factory" && obj.active) {
        if (Math.random() < (state.pollution / 60) * dt * 40) {
          Particles.spawnSmoke(obj.x, obj.y, obj.w);
        }
      } else if (obj.type === "garbage_truck" && obj.isMoving) {
        if (obj.actionState === "going") {
          obj.x += 250 * dt; // speed
          if (obj.x >= obj.targetX) {
            obj.x = obj.targetX;
            obj.actionState = "picking_up";
            obj.waitTime = 1.5; // wait 1.5s
          }
        } else if (obj.actionState === "picking_up") {
          obj.waitTime -= dt;
          if (obj.waitTime <= 0) {
            const streetBin = Objects.interactables.find(
              (o) => o.type === "trashcan_street",
            );
            if (streetBin) streetBin.trashCount = 0; // Empty the trash
            obj.actionState = "leaving";
          }
        } else if (obj.actionState === "leaving") {
          obj.x += 250 * dt;
          if (obj.x > 3200) {
            // Offscreen right
            // Reset to start
            obj.x = obj.startX;
            obj.isMoving = false;
            obj.actionState = "";
          }
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
