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
      bottles: 0,
      grains: 0,
    },
    pucState: 0,
    tasks: {
      lightsRequired: 3,
      lightsTurnedOff: 0,
      trashRequired: 3,
      trashCollected: 0,
      truckRequired: 1,
      truckCalled: 0,
      bottlesRequired: 12,
      bottlesCollected: 0,
      oilSpillsRequired: 2,
      oilSpillsCleaned: 0,
      factoriesRequired: 5,
      factoriesServiced: 0,
      windmillsRequired: 5,
      windmillsStarted: 0,
      treesRequired: 3,
      treesPlanted: 0,
      housesRequired: 1,
      housesBuilt: 0,
      solarRequired: 1,
      solarInstalled: 0,
      pucRequired: 1,
      pucDone: 0,
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

    if (!state.gameOver) {
      Input.pollKeyboard();
    }

    // Always call update so the player death animation and particles can progress
    update(dt);

    Renderer.draw(state, VW, VH);

    // Draw placement preview if active item
    const activeItem =
      typeof Shop !== "undefined" ? Shop.getActiveItem() : null;
    if (activeItem && !state.gameOver) {
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
          // Check task gating for placement
          let canPlace = false;
          let warningMsg = "";

          if (activeItem.type === "tree") {
            if (
              state.tasks.windmillsStarted >= state.tasks.windmillsRequired &&
              state.tasks.treesPlanted < state.tasks.treesRequired
            ) {
              canPlace = true;
            } else {
              warningMsg = "Not time to plant trees yet!";
            }
          } else if (activeItem.type === "solar_panel") {
            if (
              state.tasks.treesPlanted >= state.tasks.treesRequired &&
              state.tasks.solarInstalled < state.tasks.solarRequired
            ) {
              canPlace = true;
            } else {
              warningMsg = "Not time to install solar panels yet!";
            }
          } else if (activeItem.type === "mud_house") {
            if (
              state.tasks.solarInstalled >= state.tasks.solarRequired &&
              state.tasks.housesBuilt < state.tasks.housesRequired
            ) {
              canPlace = true;
            } else {
              warningMsg = "Not time to build mud house yet!";
            }
          }

          if (state.gameWon) {
            canPlace = true; // allow placing anything after win
          }

          if (canPlace && activeItem.type === "mud_house") {
            // Find if there's a placeholder it snaps to
            let targetRect = {
              x: wx - renderW / 2,
              y: wy - renderH / 2,
              w: renderW,
              h: renderH,
            };
            for (let b of Objects.barriers) {
              if (b.type === "mud_house_placeholder" && !b.filled) {
                const cx = b.x + b.w / 2;
                const cy = b.y + b.h / 2;
                if (Math.hypot(wx - cx, wy - cy) < 50) {
                  // Placed exactly on placeholder, so placeholder will become solid
                  targetRect = { x: b.x, y: b.y, w: b.w, h: b.h };
                  break;
                }
              }
            }

            if (Utils.rectsOverlap(Player.state, targetRect)) {
              canPlace = false;
              warningMsg = "Can't build a house on yourself!";
            }
          }

          if (!canPlace) {
            Shop.clearActiveItem();
            Input.consumeClick();
            Particles.spawnFloat(
              wx,
              wy,
              warningMsg || "Cannot place this right now",
              "#ef4444",
            );
          } else {
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
                Particles.spawnFloat(
                  wx,
                  wy,
                  "Solar Panel Installed!",
                  "#4ade80",
                );
              }
            }

            Shop.clearActiveItem();
            Input.consumeClick();

            updateTaskUI();
          }
        }
      }
    }

    requestAnimationFrame(loop);
  }

  function updateTaskUI() {
    const taskSequence = [
      {
        id: "task-lights",
        label: "Turn Off Street Lights",
        key: "lightsTurnedOff",
        req: "lightsRequired",
      },
      {
        id: "task-trash",
        label: "Throw Garbage in Bin",
        key: "trashCollected",
        req: "trashRequired",
      },
      {
        id: "task-truck",
        label: "Call Garbage Truck",
        key: "truckCalled",
        req: "truckRequired",
      },
      {
        id: "task-bottle",
        label: "Collect Water Bottles",
        key: "bottlesCollected",
        req: "bottlesRequired",
      },
      {
        id: "task-oil",
        label: "Clean Oil Spill",
        key: "oilSpillsCleaned",
        req: "oilSpillsRequired",
      },
      {
        id: "task-factory",
        label: "Service Factories",
        key: "factoriesServiced",
        req: "factoriesRequired",
      },
      {
        id: "task-windmill",
        label: "Start Windmills",
        key: "windmillsStarted",
        req: "windmillsRequired",
      },
      {
        id: "task-plant",
        label: "Plant Trees",
        key: "treesPlanted",
        req: "treesRequired",
      },
      {
        id: "task-solar",
        label: "Install Solar Panel",
        key: "solarInstalled",
        req: "solarRequired",
      },
      {
        id: "task-house",
        label: "Build Mud House",
        key: "housesBuilt",
        req: "housesRequired",
      },
      {
        id: "task-puc",
        label: "Get PUC Done",
        key: "pucDone",
        req: "pucRequired",
      },
    ];

    let foundActive = false;

    for (const t of taskSequence) {
      const el = document.getElementById(t.id);
      const current = state.tasks[t.key];
      const req = state.tasks[t.req];

      if (current >= req) {
        // Task is complete, hide it so only one shows at a time
        el.style.display = "none";
      } else if (!foundActive) {
        // This is the active task
        el.style.display = "block";
        el.style.color = "#ffffff";
        el.textContent = `- ${t.label}: ${current}/${req}`;
        foundActive = true;
      } else {
        // This task is yet to be unlocked
        el.style.display = "none";
      }
    }

    const allDoneEl = document.getElementById("task-all-done");
    if (allDoneEl) {
      allDoneEl.style.display = !foundActive ? "block" : "none";
    }

    checkWinCondition();
  }

  function checkWinCondition() {
    if (state.gameWon) return; // Prevent triggering multiple times

    if (
      state.tasks.lightsTurnedOff >= state.tasks.lightsRequired &&
      state.tasks.trashCollected >= state.tasks.trashRequired &&
      state.tasks.truckCalled >= state.tasks.truckRequired &&
      state.tasks.bottlesCollected >= state.tasks.bottlesRequired &&
      state.tasks.oilSpillsCleaned >= state.tasks.oilSpillsRequired &&
      state.tasks.factoriesServiced >= state.tasks.factoriesRequired &&
      state.tasks.windmillsStarted >= state.tasks.windmillsRequired &&
      state.tasks.treesPlanted >= state.tasks.treesRequired &&
      state.tasks.solarInstalled >= state.tasks.solarRequired &&
      state.tasks.housesBuilt >= state.tasks.housesRequired &&
      state.tasks.pucDone >= state.tasks.pucRequired
    ) {
      state.gameWon = true;
      const overlay = document.getElementById("overlay");
      const overlayTitle = document.getElementById("overlay-title");
      const overlayMsg = document.getElementById("overlay-msg");
      const keepPlayingBtn = document.getElementById("btn-keep-playing");

      overlayTitle.textContent = "🏅 Environment Samaritan";
      overlayTitle.style.color = "#4ade80";
      overlayMsg.textContent =
        "All tasks completed! You cleaned the city and built a green future. Score: " +
        state.score;
      if (keepPlayingBtn) keepPlayingBtn.style.display = "block";
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

    // Update animal positions
    for (const a of Objects.animals) {
      if (["dog", "fox", "shark", "turtle", "jellyfish"].includes(a.type)) {
        if (a.speed === undefined) {
          if (a.type === "fox") {
            a.speed = 40 + Math.random() * 40; // fox faces right, move right
            a.dir = 1;
          } else if (a.type === "dog") {
            a.speed = -(40 + Math.random() * 40); // dog faces left, move left
            a.dir = 1;
          } else if (a.type === "shark") {
            a.speed = 50 + Math.random() * 40; // shark face right
            a.dir = 1;
          } else if (a.type === "turtle") {
            a.speed = -(15 + Math.random() * 15); // turtle slow left
            a.dir = -1;
          } else if (a.type === "jellyfish") {
            a.speed = -(10 + Math.random() * 10); // jellyfish very slow left
            a.dir = -1;
          }
        }

        a.x += a.speed * dt;

        // Add vertical bobbing for jellyfish
        if (a.type === "jellyfish") {
          if (a.startY === undefined) a.startY = a.y;
          a.y = a.startY + Math.sin(Date.now() / 300 + a.x) * 5;
        }

        // wrap around the map horizontally
        if (a.x < -150) {
          a.x = 3350;
        } else if (a.x > 3350) {
          a.x = -150;
        }
      }
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

    // Check if player is on a specific task or completed all tasks
    const isAllowedInteraction = (obj) => {
      if (state.gameWon) return true; // all tasks completed

      if (state.tasks.lightsTurnedOff < state.tasks.lightsRequired) {
        return obj.type === "street_light";
      }
      if (state.tasks.trashCollected < state.tasks.trashRequired) {
        return obj.type === "trashbag" || obj.type === "trashcan_street";
      }
      if (state.tasks.truckCalled < state.tasks.truckRequired) {
        return obj.type === "garbage_truck";
      }
      if (state.tasks.bottlesCollected < state.tasks.bottlesRequired) {
        return (
          obj.type.startsWith("plastic_bottle") ||
          obj.type === "trashcan_plastic"
        );
      }
      if (state.tasks.oilSpillsCleaned < state.tasks.oilSpillsRequired) {
        return obj.type === "oil_spill";
      }
      if (state.tasks.factoriesServiced < state.tasks.factoriesRequired) {
        return obj.type === "factory";
      }
      if (state.tasks.windmillsStarted < state.tasks.windmillsRequired) {
        return obj.type === "windmill";
      }
      if (state.tasks.treesPlanted < state.tasks.treesRequired) {
        return obj.type === "tree_placeholder";
      }
      if (state.tasks.solarInstalled < state.tasks.solarRequired) {
        return obj.type === "solar_panel_placeholder";
      }
      if (state.tasks.housesBuilt < state.tasks.housesRequired) {
        return obj.type === "mud_house_placeholder";
      }
      if (state.tasks.pucDone < state.tasks.pucRequired) {
        return obj.type === "petrol_pump" && state.pucState === 2;
      }

      return true; // default back to true if no task matched
    };

    let nearest = null,
      nearestDist = Infinity;
    for (const obj of Objects.interactables) {
      if (
        !obj.active &&
        (obj.type === "trashbag" || obj.type.startsWith("plastic_bottle"))
      )
        continue; // skip picked up trash
      if (!obj.interactLabel) continue; // skip decorative placed items
      if (!isAllowedInteraction(obj)) continue; // skip if not part of active task

      const d = Utils.centreDist(Player.state, obj);
      const ir = Objects.getInteractRadius(obj);
      if (d < ir && d < nearestDist) {
        nearest = obj;
        nearestDist = d;
      }
    }

    if (nearest && nearest.timer <= 0) {
      hintEl.classList.add("visible");

      let actionText = "";
      if (nearest.type === "trashbag") {
        actionText = " to collect garbage";
      } else if (nearest.type.startsWith("plastic_bottle")) {
        actionText = " to collect bottles";
      } else if (nearest.type === "trashcan_street") {
        actionText = " to throw garbage";
      } else if (nearest.type === "trashcan_plastic") {
        actionText = " to throw bottles";
      } else if (nearest.interactLabel) {
        actionText = " to " + nearest.interactLabel.toLowerCase();
      }

      hintEl.innerHTML = CONFIG.IS_TOUCH
        ? `Tap <strong>E</strong>${actionText}`
        : `Press <strong>E</strong>${actionText}`;
    } else {
      hintEl.classList.remove("visible");
    }

    // Interaction
    if (Input.interact) {
      if (nearest && nearest.timer <= 0) {
        if (
          (nearest.type === "trashcan_street" && state.inventory.trash === 0) ||
          (nearest.type === "trashcan_plastic" &&
            state.inventory.bottles === 0) ||
          (nearest.type.startsWith("trashcan") &&
            !["trashcan_street", "trashcan_plastic"].includes(nearest.type))
        ) {
          // Can't interact with bin if no trash/bottles or it's not the right bin
        } else {
          const cx = nearest.x + nearest.w / 2;
          const cy = nearest.y + nearest.h / 2;
          let pts = nearest.interactEffect
            ? Math.abs(nearest.interactEffect) * 10
            : 0;

          if (nearest.type === "trashbag") {
            state.inventory.trash++;
            nearest.active = false; // "Remove" the trash
            pts = 10;
            Particles.spawnFloat(cx, cy - 20, "Trash picked up!", "#4ade80");
          } else if (nearest.type.startsWith("plastic_bottle")) {
            state.inventory.bottles++;
            nearest.active = false; // "Remove" the bottle
            pts = 10;
            Particles.spawnFloat(cx, cy - 20, "Bottle picked up!", "#4ade80");
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
                state.tasks.truckCalled++;
                pts = 50;
                Particles.spawnFloat(
                  cx,
                  cy - 20,
                  "Truck Dispatched! +50",
                  "#4ade80",
                );
                updateTaskUI();
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
          } else if (nearest.type === "trashcan_street") {
            const thrown = state.inventory.trash;
            nearest.trashCount = (nearest.trashCount || 0) + thrown;
            state.tasks.trashCollected += thrown;
            state.inventory.trash = 0;
            pts = thrown * 20; // 20 points per trash thrown in bin
            Particles.spawnFloat(
              cx,
              cy - 20,
              "+" + pts + " Points!",
              "#4ade80",
            );
            updateTaskUI();
          } else if (nearest.type === "trashcan_plastic") {
            const thrown = state.inventory.bottles;
            nearest.trashCount = (nearest.trashCount || 0) + thrown; // Generic visual bin count if used
            state.tasks.bottlesCollected += thrown;
            state.inventory.bottles = 0;
            pts = thrown * 20;
            Particles.spawnFloat(
              cx,
              cy - 20,
              "+" + pts + " Points!",
              "#4ade80",
            );
            updateTaskUI();
          } else if (nearest.type === "windmill") {
            if (!nearest.isOn) {
              nearest.isOn = true;
              nearest.timer = nearest.cooldown || 999999;
              nearest.interactLabel = ""; // Disable further interactions
              state.tasks.windmillsStarted++;
              pts = 15;

              Particles.spawnFloat(
                cx,
                cy - 20,
                "Windmill Active! +15",
                "#4ade80",
              );
              updateTaskUI();
            }
          } else if (nearest.type === "factory") {
            if (nearest.active) {
              nearest.active = false;
              nearest.timer = 999999;
              nearest.interactLabel = ""; // Disabled further interactions
              state.tasks.factoriesServiced++;
              pts = 50;
              Particles.spawnFloat(
                cx,
                cy - 20,
                "Factory Serviced! +50",
                "#4ade80",
              );
              updateTaskUI();
            }
          } else if (nearest.type === "oil_spill") {
            if (nearest.active) {
              nearest.active = false;
              nearest.timer = 999999;
              nearest.interactLabel = "";
              state.tasks.oilSpillsCleaned++;
              pts = 30;
              Particles.spawnFloat(
                cx,
                cy - 20,
                "Spill Cleaned! +30",
                "#4ade80",
              );
              updateTaskUI();
            }
          } else if (nearest.type === "street_light") {
            if (nearest.isOn) {
              nearest.isOn = false;
              nearest.timer = 999999;
              nearest.interactLabel = ""; // Disabled further interactions
              state.tasks.lightsTurnedOff++;
              pts = 10;
              Particles.spawnFloat(
                cx,
                cy - 20,
                "Light turned off! +10",
                "#4ade80",
              );
              updateTaskUI();
            }
          } else if (nearest.type === "petrol_pump") {
            if (state.pucState === 2) {
              state.pucState = 3;
              state.tasks.pucDone++;
              nearest.timer = 999999;
              nearest.interactLabel = "";
              pts = 100;
              Particles.spawnFloat(cx, cy - 20, "PUC Done! +100", "#4ade80");
              updateTaskUI();
            } else {
              pts = 0;
            }
          } else {
            Particles.spawnFloat(cx, cy - 20, "+" + pts, "#4ade80");
          }

          nearest.timer = nearest.cooldown;
          Particles.spawnRipple(cx, cy, RIPPLE_COLORS[nearest.type] || "#fff");

          state.score += pts;
          state.totalCleaned++;
        }
      }
      Input.consumeInteract();
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

    // PUC Task Car Logic
    if (
      !state.gameWon &&
      state.tasks.housesBuilt >= state.tasks.housesRequired &&
      state.pucState < 3
    ) {
      const gCar = Objects.barriers.find((b) => b.type === "car");
      if (gCar) {
        if (state.pucState === 0) {
          const activeItem =
            typeof Shop !== "undefined" ? Shop.getActiveItem() : null;
          if (Input.mouseClicked && !activeItem) {
            let wx = Input.mousePos.x / Camera.zoom + Camera.x;
            let wy = Input.mousePos.y / Camera.zoom + Camera.y;
            if (
              wx >= gCar.x &&
              wx <= gCar.x + gCar.w &&
              wy >= gCar.y &&
              wy <= gCar.y + gCar.h
            ) {
              state.pucState = 1;
              Input.consumeClick();
              Particles.spawnFloat(
                gCar.x + gCar.w / 2,
                gCar.y,
                "Driving to Gas Station...",
                "#4ade80",
              );
            }
          }
        } else if (state.pucState === 1) {
          let speed = 250;
          if (gCar.x < 1580 && gCar.y > 500) {
            gCar.x += speed * dt;
          } else if (gCar.y > 220 && gCar.x >= 1580) {
            gCar.y -= speed * dt;
          } else if (gCar.x < 2000) {
            gCar.x += speed * dt;
            if (gCar.y > 50) gCar.y -= speed * dt * 0.5;
          } else {
            state.pucState = 2; // Arrived
            Particles.spawnFloat(
              gCar.x + gCar.w / 2,
              gCar.y,
              "Get PUC Done at Pump!",
              "#4ade80",
            );
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
    state.pucState = 0;
    state.tasks.pucDone = 0;
    const gCar = Objects.barriers.find((b) => b.type === "car");
    if (gCar) {
      gCar.x = 400;
      gCar.y = 560;
    }
    updateTaskUI();
    Particles.reset();
    Objects.resetTimers();
    Player.reset();
    document.getElementById("overlay").classList.remove("active");
  }

  function continuePlaying() {
    document.getElementById("overlay").classList.remove("active");
  }

  return { init, restart, continuePlaying };
})();
