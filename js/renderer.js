/* ══════════════════════════════════════════════════════════
   GreenFarm — Renderer  (all draw logic)
   ══════════════════════════════════════════════════════════ */

const Renderer = (() => {
  let ctx, miniCtx, miniW, miniH;
  let groundPattern = null;
  let treeImages = [];
  let factoryImages = [];
  let waterPatterns = [];
  let garbageBagImg = new Image();
  let trashCanStreetImg = new Image();
  let trashCanPaperImg = new Image();
  let trashCanPlasticImg = new Image();
  let trashCanNonRecyclableImg = new Image();
  let trashCanContaminatedImg = new Image();
  let trashCanHazardousImg = new Image();
  let windmillBaseImg = new Image();
  let windmillFanImg = new Image();
  let roadImgs = { horiz: new Image(), vert: new Image() };
  let gardenImgs = {};

  let house1Img = new Image();
  let house2Img = new Image();
  let benchImg = new Image();
  let carImg = new Image();
  let fenceImg = new Image();
  let petrolPumpImg = new Image();
  let bottle1Img = new Image();
  let bottle2Img = new Image();
  let carParkImg = new Image();
  let garbageTruckImg = new Image();
  let streetLightOnImg = new Image();
  let streetLightOffImg = new Image();
  let oilSpillCanImg = new Image();
  let oilSpillPoolImg = new Image();
  let coinFrames = [];

  let animalFrames = {
    dog: [],
    fox: [],
    frog: [],
    jellyfish: [],
    shark: [],
    turtle: [],
  };

  const pickUpFrames = [];
  for (let i = 0; i <= 12; i++) {
    const img = new Image();
    img.src = `assets/garbage/garbage_truck_animation/pick up container/vehicle_pickUpContainer_${i.toString().padStart(2, "0")}.png`;
    pickUpFrames.push(img);
  }

  const gifElements = new Map();

  function updateGifOverlay(key, src, wx, wy, ww, wh) {
    const overlay = document.getElementById("gif-overlay");
    if (!overlay) return;
    let img = gifElements.get(key);
    if (!img) {
      img = document.createElement("img");
      img.src = src;
      img.style.position = "absolute";
      overlay.appendChild(img);
      gifElements.set(key, img);
    }
    // Convert world space to screen space based on Camera
    const sx = (wx - Camera.x) * Camera.zoom;
    const sy = (wy - Camera.y) * Camera.zoom;
    const sw = ww * Camera.zoom;
    const sh = wh * Camera.zoom;

    // Only update styles if they have changed (performance optimization)
    const leftPx = sx + "px";
    if (img.style.left !== leftPx) img.style.left = leftPx;

    const topPx = sy + "px";
    if (img.style.top !== topPx) img.style.top = topPx;

    const widthPx = sw + "px";
    if (img.style.width !== widthPx) img.style.width = widthPx;

    const heightPx = sh + "px";
    if (img.style.height !== heightPx) img.style.height = heightPx;

    img.dataset.lastSeen = Date.now();
  }

  function pruneGifs() {
    const now = Date.now();
    for (const [key, img] of gifElements.entries()) {
      if (now - parseInt(img.dataset.lastSeen, 10) > 100) {
        img.remove();
        gifElements.delete(key);
      }
    }
  }

  function init(mainCtx, mCtx, mw, mh) {
    ctx = mainCtx;
    miniCtx = mCtx;
    miniW = mw;
    miniH = mh;

    // Load grass texture pattern
    const grassImg = new Image();
    // Assuming you have grass/Cartoon_green_texture_grass.jpg based on terminal output
    grassImg.src = "assets/grass/Cartoon_green_texture_grass.jpg";
    grassImg.onload = () => {
      groundPattern = ctx.createPattern(grassImg, "repeat"); // Scale down the grass pattern since the original image is large
      const scale = 0.0525;
      groundPattern.setTransform(new DOMMatrix().scale(scale, scale));
    };

    // Load tree images
    for (let i = 1; i <= 3; i++) {
      const img = new Image();
      img.src = `assets/tree/Tree ${i}.png`;
      treeImages.push(img);
    }

    [
      "Bush 1 - GREEN.png",
      "Bush 2 - ORANGE.png",
      "Flower 1 - BLUE.png",
      "Flower 11 - RED.png",
      "Flower 12 - YELLOW.png",
      "Flower 2 - MAGENTA.png",
      "Flower 5 - BLUE.png",
      "Flower 7 - PINK 2.png",
      "Flower 8 - RED.png",
      "Flower Pot 1 - BLUE.png",
      "Flower Pot 2 - RED.png",
      "Flower Pot 2 - YELLOW.png",
      "Flower Pot 3 - PURPLE.png",
      "Flower Pot 4 - WHITE.png",
    ].forEach((fn) => {
      const img = new Image();
      img.src = `assets/garden/${fn}`;
      gardenImgs[fn] = img;
    });

    // Load factory images
    const factoryFiles = [
      "factory 1.png",
      "factory 2.png",
      "factory 3.gif",
      "factory 4.png",
      "factory 5.gif",
    ];
    factoryFiles.forEach((file) => {
      const img = new Image();
      img.src = `assets/factory/${file}`;
      factoryImages.push(img);
    });

    // Load animal frames
    for (let i = 1; i <= 8; i++) {
      const img = new Image();
      img.src = `assets/animals/dog/dog ${i}.png`;
      animalFrames.dog.push(img);
    }
    for (let i = 1; i <= 14; i++) {
      const img = new Image();
      img.src = `assets/animals/fox/walk ${i}.png`;
      animalFrames.fox.push(img);
    }
    for (let i = 1; i <= 20; i++) {
      const img = new Image();
      img.src = `assets/animals/frog/frog ${i}.png`;
      animalFrames.frog.push(img);
    }
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `assets/animals/jellyfish/jellyfish ${i}.png`;
      animalFrames.jellyfish.push(img);
    }
    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `assets/animals/shark/shark ${i}.png`;
      animalFrames.shark.push(img);
    }
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `assets/animals/turtle/turtle ${i}.png`;
      animalFrames.turtle.push(img);
    }

    garbageBagImg.src = "assets/garbage/garbage bag.png";
    trashCanStreetImg.src = "assets/garbage/trash_can_street.png";
    trashCanPaperImg.src = "assets/garbage/paper_trash.png";
    trashCanPlasticImg.src = "assets/garbage/plastic_trash.png";
    trashCanNonRecyclableImg.src = "assets/garbage/non_recyclable_trash.png";
    trashCanContaminatedImg.src = "assets/garbage/contaiminated_trash.png"; // typo intentionally matches fs
    trashCanHazardousImg.src = "assets/garbage/hazardous_trash.png";
    bottle1Img.src = "assets/plastic_bottles/bottle 1.png";
    bottle2Img.src = "assets/plastic_bottles/bottle 2.png";
    streetLightOnImg.src = "assets/street_light/streetlight_on.png";
    streetLightOffImg.src = "assets/street_light/streetlight_off.png";
    windmillBaseImg.src = "assets/windmill/windmill_nofan.png";
    windmillFanImg.src = "assets/windmill/fan.png";
    oilSpillCanImg.src = "assets/oilspill/oil can.png";
    oilSpillPoolImg.src = "assets/oilspill/spill.png";
    for(let i=1; i<=5; i++) {
        let cImg = new Image();
        cImg.src = `assets/coins/coin_${i}.png`;
        coinFrames.push(cImg);
    }

    // Load road patterns
    roadImgs.horiz.src = "assets/road/road_horizontal.png";
    roadImgs.vert.src = "assets/road/road_vertical.png";

    house1Img.src = "assets/house/house 1.png";
    house2Img.src = "assets/house/house 2.png";
    benchImg.src = "assets/house/bench.png";
    carImg.src = "assets/car/car_facing_right.png";
    fenceImg.src = "assets/house/fence.png";
    petrolPumpImg.src = "assets/petrol_pump.png";
    carParkImg.src = "assets/car_park/car_park.png"; // Load car park
    garbageTruckImg.src =
      "assets/garbage/garbage_truck_animation/in motion/vehicle_inMotion_00.png"; // Load truck

    // Load water images
    const waterFiles = [
      "water 1.png",
      "water 2.png",
      "water 3.png",
      "water 4.png",
      "water 5.png",
      "water 6.png",
      "water 7.png",
    ];
    waterFiles.forEach((file, index) => {
      const img = new Image();
      img.src = `assets/water/${file}`;
      img.onload = () => {
        const pat = ctx.createPattern(img, "repeat");
        // Scale down pattern incase it is too large
        pat.setTransform(new DOMMatrix().scale(0.8, 0.8));
        waterPatterns[index] = pat;
      };
      waterPatterns[index] = null;
    });
  }

  /* ── Main draw ──────────────────────────────────────── */
  function draw(gameState, vw, vh) {
    const t = gameState.pollution / 100;

    // Apply camera + zoom
    Camera.applyTransform(ctx);

    drawGround(t);
    drawPaths(t);
    drawTrees(t);
    drawBuildings(gameState);
    drawInteractables(t);
    drawAnimals(t);
    drawBorders();
    drawParticles();
    drawPlayer(gameState);

    // Reset to screen space
    Camera.resetTransform(ctx);

    pruneGifs();

    // HUD is handled in DOM
    updateHUD(gameState);
    drawMinimap(t, vw, vh);
  }

  /* ── Ground ─────────────────────────────────────────── */
  function drawGround(t) {
    if (groundPattern) {
      // Draw textured grass ground
      ctx.fillStyle = groundPattern;
      ctx.fillRect(0, -250, CONFIG.WORLD_W, CONFIG.WORLD_H + 250);

      // If there is pollution, overlay a brownish tint
      if (t > 0) {
        ctx.fillStyle = `rgba(120, 85, 43, ${t * 0.85})`; // Darker brown alpha based on pollution
        ctx.fillRect(0, -250, CONFIG.WORLD_W, CONFIG.WORLD_H + 250);
      }
    } else {
      // Fallback to solid color if image not loaded yet
      ctx.fillStyle = Utils.lerpColor("#4ade80", "#78552b", t);
      ctx.fillRect(0, -250, CONFIG.WORLD_W, CONFIG.WORLD_H + 250);
      if (t > 0.3) {
        ctx.fillStyle = `rgba(60,30,0,${(t - 0.3) * 0.35})`;
        ctx.fillRect(0, 0, CONFIG.WORLD_W, CONFIG.WORLD_H);
      }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < CONFIG.WORLD_W; gx += 80) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, CONFIG.WORLD_H);
      ctx.stroke();
    }
    for (let gy = 0; gy < CONFIG.WORLD_H; gy += 80) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(CONFIG.WORLD_W, gy);
      ctx.stroke();
    }
  }

  /* ── Paths ──────────────────────────────────────────── */
  function drawPaths(t) {
    const fallbackColor = Utils.lerpColor("#d6d3d1", "#78716c", t);

    function drawTiled(img, isHoriz, x, y, w, h) {
      if (!img || !img.complete || img.width === 0) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, w, h);
        return;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip(); // Ensure we don't draw outside bounds

      // Tile to maintain absolute aspect ratio
      if (isHoriz) {
        const scale = h / img.height;
        const drawW = img.width * scale;
        for (let curX = x; curX < x + w + 1; curX += drawW) {
          ctx.drawImage(img, curX, y, drawW, h);
        }
      } else {
        const scale = w / img.width;
        const drawH = img.height * scale;
        for (let curY = y; curY < y + h + 1; curY += drawH) {
          ctx.drawImage(img, x, curY, w, drawH);
        }
      }
      ctx.restore();
    }

    // Road width is widened to 140 for a better look
    const ROAD_W = 140;

    // Main vertical road dividing left colony and right side
    drawTiled(roadImgs.vert, false, 1560, 200, ROAD_W, 1160); // Ends at bottom horizontal road (1220 + 140)

    // Right-side horizontal roads
    drawTiled(
      roadImgs.horiz,
      true,
      1560 + ROAD_W,
      200,
      3200 - (1560 + ROAD_W),
      ROAD_W,
    );
    drawTiled(
      roadImgs.horiz,
      true,
      1560 + ROAD_W,
      540,
      3200 - (1560 + ROAD_W),
      ROAD_W,
    );
    drawTiled(
      roadImgs.horiz,
      true,
      1560 + ROAD_W,
      880,
      3200 - (1560 + ROAD_W),
      ROAD_W,
    );
    drawTiled(
      roadImgs.horiz,
      true,
      1560 + ROAD_W,
      1220,
      3200 - (1560 + ROAD_W),
      ROAD_W,
    );

    // Colony Horizontal Roads (Left side)
    drawTiled(roadImgs.horiz, true, 0, 200, 1560, ROAD_W); // Top
    drawTiled(roadImgs.horiz, true, 0, 540, 1560, ROAD_W);
    drawTiled(roadImgs.horiz, true, 0, 880, 1560, ROAD_W);
    drawTiled(roadImgs.horiz, true, 0, 1220, 1560, ROAD_W); // Bottom before river
  }

  /* ── Trees ──────────────────────────────────────────── */
  function drawTrees(t) {
    const alpha = Math.max(0, 1 - t * 1.5);
    const numGenerationTrees = Objects.trees.filter(
      (tr) => !tr.isPlanted,
    ).length;
    const visGeneration = Math.floor(numGenerationTrees * (1 - t));

    let genCount = 0;

    for (let i = 0; i < Objects.trees.length; i++) {
      const tr = Objects.trees[i];

      if (!tr.isPlanted) {
        genCount++;
        if (genCount > visGeneration) continue;
      }

      ctx.globalAlpha = tr.isPlanted ? 1 : alpha;

      const img = treeImages[tr.type];
      if (img && img.complete) {
        // Draw the image. Center it around the target location.
        // Assuming your images might be quite large, scale them down.
        const treeWidth = 140;
        const treeHeight = 180;

        ctx.drawImage(
          img,
          tr.x - treeWidth / 2 + 30, // 30 is half of the hitbox width (60)
          tr.y - treeHeight + 80, // offset upwards so the base matches the hitbox base (80)
          treeWidth,
          treeHeight,
        );
      } else {
        // Fallback to simple shapes if images aren't loaded yet
        ctx.fillStyle = "#92400e";
        ctx.fillRect(tr.x + 20, tr.y + 40, 20, 40);
        ctx.fillStyle = Utils.lerpColor("#16a34a", "#a16207", t);
        ctx.beginPath();
        ctx.arc(tr.x + 30, tr.y + 20, 36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ── Animals ────────────────────────────────────────── */
  function drawAnimals(t) {
    const vis = Math.floor(Objects.animals.length * (1 - t * 1.1));
    const now = performance.now();
    for (let i = 0; i < Math.max(0, vis); i++) {
      const a = Objects.animals[i];
      ctx.globalAlpha = Math.max(0, 1 - t * 1.3);

      const frames = animalFrames[a.type];
      if (frames && frames.length > 0) {
        // use an offset per animal to stagger animation based on their index
        const frameIndex = Math.floor(now / 150 + i * 5) % frames.length;
        const img = frames[frameIndex];
        // Give them a fixed size for now or aspect ratio preserved
        if (img && img.complete) {
          let w = 40,
            h = 40;
          if (a.type === "dog" || a.type === "fox") {
            w = 80;
            h = 80;
          } else if (
            a.type === "shark" ||
            a.type === "turtle" ||
            a.type === "jellyfish"
          ) {
            w = 60;
            h = 60;
          }

          let isFlipped = a.dir === -1;

          if (isFlipped) {
            ctx.save();
            // Translate to center of image, scale, then draw offset
            ctx.translate(a.x + w / 2, a.y + h / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
          } else {
            ctx.drawImage(img, a.x, a.y, w, h);
          }
        }
      } else if (a.type === "cow") {
        ctx.fillStyle = "#f5f5f4";
        ctx.fillRect(a.x, a.y, 34, 22);
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(a.x + 5, a.y + 4, 10, 7);
        ctx.fillRect(a.x + 20, a.y + 10, 7, 6);
        ctx.fillStyle = "#f5f5f4";
        ctx.fillRect(a.x + 34, a.y + 2, 12, 12);
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(a.x + 42, a.y + 5, 3, 3);
      } else {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(a.x + 10, a.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(a.x + 20, a.y + 8);
        ctx.lineTo(a.x + 28, a.y + 11);
        ctx.lineTo(a.x + 20, a.y + 14);
        ctx.fill();
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(a.x + 13, a.y + 6, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ── Interactables ──────────────────────────────────── */
  function drawInteractables(t) {
    for (const obj of Objects.interactables) {
      drawSingleInteractable(obj, t);
    }
  }

  function drawSingleInteractable(obj, t) {
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const now = Date.now();

    switch (obj.type) {
      case "factory":
        // Use a persistent index tied to the object's position so it doesn't flicker
        let fIdx =
          typeof obj.fIdx !== "undefined"
            ? obj.fIdx
            : Math.floor(obj.x / 100 + obj.y / 100) % factoryImages.length;

        const fImg = factoryImages[fIdx];
        if (fImg && fImg.complete) {
          // Adjust sizing depending on PNG dimensions. Keep aspect ratio.
          let fw = 250; // default w
          let fh = 200; // default h
          if (fImg.width && fImg.height) {
            const aspect = fImg.width / fImg.height;
            // Target specific visual size for balance, scaled up by 25%
            fh = 200;
            fw = fh * aspect;
          }

          if (fImg.src && fImg.src.includes(".gif")) {
            // For GIFs, we use the DOM overlay since canvas drawImage doesn't animate them
            updateGifOverlay(
              `factory_${obj.x}_${obj.y}`,
              fImg.src,
              cx - fw / 2,
              obj.y + obj.h - fh,
              fw,
              fh,
            );
          } else {
            ctx.drawImage(
              fImg,
              cx - fw / 2,
              obj.y + obj.h - fh, // Base aligns with the bottom of the hitbox
              fw,
              fh,
            );
          }
        } else {
          // Fallback shapes
          ctx.fillStyle = "#57534e";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
          ctx.fillStyle = "#44403c";
          ctx.fillRect(obj.x + 20, obj.y - 40, 22, 40);
          ctx.fillRect(obj.x + obj.w - 42, obj.y - 40, 22, 40);
          ctx.fillStyle = "#fbbf24";
          for (let i = 0; i < 3; i++)
            ctx.fillRect(obj.x + 14 + i * 38, obj.y + 30, 20, 14);
          ctx.fillStyle = "#292524";
          ctx.fillRect(obj.x + obj.w / 2 - 14, obj.y + obj.h - 46, 28, 46);
        }
        break;

      case "street_light":
        const slImg = obj.isOn ? streetLightOnImg : streetLightOffImg;
        if (slImg && slImg.complete) {
          ctx.drawImage(slImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = obj.isOn ? "#facc15" : "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;

      case "trashcan_street":
        if (trashCanStreetImg && trashCanStreetImg.complete) {
          ctx.drawImage(trashCanStreetImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        if (obj.trashCount > 0) {
          // Check if any garbage truck is currently picking up right next to this bin
          const truck = Objects.interactables.find(
            (t) =>
              t.type === "garbage_truck" &&
              t.actionState === "picking_up" &&
              t.waitTime > 0,
          );

          let offsetX = 0;
          let offsetY = 0;
          let hideBags = false;

          if (truck) {
            // Animate the bags sticking to the truck's container
            const totalFrames = 13;
            let frameIdx = Math.floor(
              ((1.5 - truck.waitTime) / 1.5) * totalFrames,
            );
            if (frameIdx < 0) frameIdx = 0;
            if (frameIdx >= totalFrames) frameIdx = totalFrames - 1;

            // Heuristic path of the container being lifted (x, y) relative to bin
            const path = [
              [0, 0], // 0
              [0, -10], // 1
              [-5, -30], // 2
              [-15, -50], // 3
              [-30, -80], // 4
              [-50, -100], // 5
              [-70, -100], // 6
              [-90, -90], // 7
              [-110, -70], // 8
              [-120, -40], // 9
              [0, 0], // 10 (hidden)
              [0, 0], // 11 (hidden)
              [0, 0], // 12 (hidden)
            ];

            if (frameIdx >= 10) {
              hideBags = true;
            } else {
              offsetX = path[frameIdx][0];
              offsetY = path[frameIdx][1];
            }
          }

          if (!hideBags) {
            for (let i = 0; i < obj.trashCount; i++) {
              if (garbageBagImg && garbageBagImg.complete) {
                ctx.drawImage(
                  garbageBagImg,
                  obj.x + 30 + (i % 2) * 20 + offsetX,
                  obj.y - 20 - Math.floor(i / 2) * 15 + offsetY,
                  40,
                  30,
                );
              }
            }
          }
        }
        break;
      case "trashcan_paper":
        if (trashCanPaperImg && trashCanPaperImg.complete) {
          ctx.drawImage(trashCanPaperImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;
      case "trashcan_plastic":
        if (trashCanPlasticImg && trashCanPlasticImg.complete) {
          ctx.drawImage(trashCanPlasticImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;
      case "trashcan_non_recyclable":
        if (trashCanNonRecyclableImg && trashCanNonRecyclableImg.complete) {
          ctx.drawImage(trashCanNonRecyclableImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;
      case "trashcan_contaminated":
        if (trashCanContaminatedImg && trashCanContaminatedImg.complete) {
          ctx.drawImage(trashCanContaminatedImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;
      case "trashcan_hazardous":
        if (trashCanHazardousImg && trashCanHazardousImg.complete) {
          ctx.drawImage(trashCanHazardousImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;

      case "windmill":
        if (windmillBaseImg && windmillBaseImg.complete) {
          // You might need to adjust aspect ratio, stretching to obj bounds for now
          ctx.drawImage(windmillBaseImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#ccc";
          ctx.fillRect(obj.x + 20, obj.y + 20, obj.w - 40, obj.h - 20);
        }

        if (windmillFanImg && windmillFanImg.complete) {
          ctx.save();
          // Calculate the pivot point. Usually top-center of the base.
          const pivotX = cx;
          const pivotY = obj.y + obj.h * 0.35; // Adjust this if the fan attaches lower/higher

          ctx.translate(pivotX, pivotY);

          if (obj.isOn) {
            // Rotate continuously. 3000ms for a full rotation.
            ctx.rotate(((now % 3000) / 3000) * Math.PI * 2);
          }

          const fanSizeH = obj.w * 1.5; // base height for fan
          const aspect = windmillFanImg.width / windmillFanImg.height;
          const fanSizeW = fanSizeH * aspect;

          ctx.drawImage(
            windmillFanImg,
            -fanSizeW / 2,
            -fanSizeH / 2,
            fanSizeW,
            fanSizeH,
          );

          ctx.restore();
        }
        break;

      case "garbage_truck":
        let currentTruckImg = garbageTruckImg;
        if (obj.actionState === "picking_up") {
          const totalFrames = 13;
          let frameIdx = Math.floor(((1.5 - obj.waitTime) / 1.5) * totalFrames);
          if (frameIdx < 0) frameIdx = 0;
          if (frameIdx >= totalFrames) frameIdx = totalFrames - 1;
          if (pickUpFrames[frameIdx] && pickUpFrames[frameIdx].complete) {
            currentTruckImg = pickUpFrames[frameIdx];
          }
        }

        if (
          currentTruckImg &&
          currentTruckImg.complete &&
          currentTruckImg.width > 0
        ) {
          ctx.drawImage(currentTruckImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#16a34a"; // green
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
          ctx.fillStyle = "#fff";
          ctx.fillText("TRUCK", obj.x + 20, obj.y + 30);
        }
        break;

      case "trashbag":
        if (!obj.active) break; // Don't draw if picked up
        if (garbageBagImg && garbageBagImg.complete) {
          ctx.drawImage(garbageBagImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#111";
          ctx.beginPath();
          ctx.arc(cx, cy, obj.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case "plastic_bottle_1":
      case "plastic_bottle_2":
        if (!obj.active) break; // Don't draw if picked up
        const bottleImg =
          obj.type === "plastic_bottle_1" ? bottle1Img : bottle2Img;
        if (bottleImg && bottleImg.complete) {
          ctx.drawImage(bottleImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#add8e6";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;

      case "trash":
        ctx.fillStyle = "#a1a1aa";
        ctx.fillRect(obj.x, obj.y + 10, obj.w, obj.h - 10);
        ctx.fillStyle = "#71717a";
        ctx.fillRect(obj.x + 8, obj.y, obj.w - 16, 18);
        ctx.fillStyle = "#52525b";
        ctx.fillRect(obj.x + 5, obj.y + 20, 15, 10);
        ctx.fillRect(obj.x + 30, obj.y + 15, 20, 12);
        break;

      case "oil_spill":
        if (!obj.active) break; // Don't draw if cleaned up
        if (oilSpillPoolImg.complete) {
          const pw = obj.w * 2;
          const ph = obj.h * 2;
          ctx.drawImage(oilSpillPoolImg, cx - pw / 2, cy - ph / 2, pw, ph);
        } else {
          ctx.fillStyle = `rgba(28,25,23,${0.7 + Math.sin(now / 800) * 0.1})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, obj.w / 2 + 10, obj.h / 2 + 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(168,85,247,${0.2 + Math.sin(now / 400) * 0.1})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx - 5, cy - 3, obj.w / 3, obj.h / 3, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case "burning_waste":
        ctx.fillStyle = "#78716c";
        ctx.fillRect(obj.x + 5, obj.y + 20, obj.w - 10, obj.h - 20);
        const fh = 20 + Math.sin(now / 150) * 8;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(obj.x + 10, obj.y + 20);
        ctx.lineTo(cx, obj.y + 20 - fh);
        ctx.lineTo(obj.x + obj.w - 10, obj.y + 20);
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.moveTo(obj.x + 15, obj.y + 20);
        ctx.lineTo(cx, obj.y + 20 - fh * 0.6);
        ctx.lineTo(obj.x + obj.w - 15, obj.y + 20);
        ctx.fill();
        break;

      case "river":
        let wIdx = Math.floor((now / 150) % 7);

        ctx.beginPath();
        ctx.roundRect(obj.x, obj.y, obj.w, obj.h, 14);

        // 1) Fill base color to hide any grass through transparency
        ctx.fillStyle = Utils.lerpColor("#38bdf8", "#6b5b3e", t);
        ctx.fill();

        // 2) Overlay the pattern
        if (waterPatterns && waterPatterns[wIdx]) {
          ctx.globalAlpha = 0.85; // Blend with base color
          ctx.fillStyle = waterPatterns[wIdx];
          const timeOffset = -(now / 150) % 1000;
          // Apply moving scroll
          waterPatterns[wIdx].setTransform(
            new DOMMatrix().scale(4.0, 4.0).translate(timeOffset, 0),
          );
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        ctx.strokeStyle = `rgba(255,255,255,${0.2 - t * 0.16})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < Math.floor(obj.w / 55); i++) {
          const sx = obj.x + 20 + i * 55,
            wy = obj.y + 30 + Math.sin(now / 500 + i) * 8;
          ctx.beginPath();
          ctx.moveTo(sx, wy);
          ctx.lineTo(sx + 28, wy);
          ctx.stroke();
        }
        for (let i = 0; i < Math.floor(obj.w / 55); i++) {
          const sx = obj.x + 40 + i * 55,
            wy = obj.y + 75 + Math.sin(now / 500 + i + 2) * 8;
          ctx.beginPath();
          ctx.moveTo(sx, wy);
          ctx.lineTo(sx + 28, wy);
          ctx.stroke();
        }
        break;

      case "solar_panel":
        if (obj.sprite) {
          if (!obj._img) {
            obj._img = new Image();
            obj._img.src = obj.sprite;
          }
          if (obj._img.complete) {
            ctx.drawImage(obj._img, obj.x, obj.y, obj.w, obj.h);
            break;
          }
        }

        ctx.fillStyle = "#1e3a5f";
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(obj.x + i * 25, obj.y);
          ctx.lineTo(obj.x + i * 25, obj.y + obj.h);
          ctx.stroke();
        }
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y + i * 20);
          ctx.lineTo(obj.x + obj.w, obj.y + i * 20);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(250,204,21,${0.15 + Math.sin(now / 600) * 0.1})`;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        break;

      case "mud_house":
        if (obj.sprite) {
          if (!obj._img) {
            obj._img = new Image();
            obj._img.src = obj.sprite;
          }
          if (obj._img.complete) {
            ctx.drawImage(obj._img, obj.x, obj.y, obj.w, obj.h);
          }
        } else {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        break;
    }

    // Proximity glow
    if (obj.interactLabel) {
      const d = Utils.centreDist(Player.state, obj);
      const ir = Objects.getInteractRadius(obj);
      if (d < ir + 40) {
        const ga = 0.25 + Math.sin(now / 300) * 0.1;
        ctx.strokeStyle =
          obj.pollRate > 0
            ? `rgba(248,113,113,${ga})`
            : `rgba(74,222,128,${ga})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, ir, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (obj.timer > 0) {
          ctx.strokeStyle = "rgba(255,255,255,.25)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            cx,
            cy,
            Math.max(obj.w, obj.h) / 2 + 8,
            -Math.PI / 2,
            -Math.PI / 2 + (1 - obj.timer / obj.cooldown) * Math.PI * 2,
          );
          ctx.stroke();
        }
      }
    }
  }

  /* ── Buildings (barn, shed) ─────────────────────────── */
  function drawBuildings(gameState) {
    // Draw building obstacles dynamically based on type
    for (const obj of Objects.barriers) {
      if (obj.type === "house1") {
        if (house1Img.complete && house1Img.width > 0) {
          ctx.drawImage(house1Img, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#b91c1c";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
      } else if (obj.type === "house2") {
        if (house2Img.complete && house2Img.width > 0) {
          ctx.drawImage(house2Img, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#78716c";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
      } else if (obj.type === "garden_grid") {
        let img = new Image();
        img.src =
          "assets/garden/Garden Grid with Flowers/Grid " + obj.variant + ".png";
        if (img.complete && img.width > 0)
          ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "garden_bush") {
        let img = gardenImgs[obj.assetName];
        if (img && img.complete && img.width > 0)
          ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "garden_pot") {
        let img = gardenImgs[obj.assetName];
        if (img && img.complete && img.width > 0)
          ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "garden_flower") {
        let img = gardenImgs[obj.assetName];
        if (img && img.complete && img.width > 0)
          ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "bench") {
        if (benchImg.complete && benchImg.width > 0) {
          ctx.drawImage(benchImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#A0522D";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
      } else if (obj.type === "car") {
        if (carImg.complete && carImg.width > 0) {
          ctx.drawImage(carImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#2563eb";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        if (
          gameState &&
          !gameState.gameWon &&
          gameState.tasks.housesBuilt >= gameState.tasks.housesRequired &&
          gameState.pucState === 0
        ) {
          const now = Date.now();
          ctx.save();
          ctx.strokeStyle = `rgba(74, 222, 128, ${0.5 + Math.sin(now / 200) * 0.5})`;
          ctx.lineWidth = 4;
          ctx.strokeRect(obj.x - 5, obj.y - 5, obj.w + 10, obj.h + 10);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 20px 'Comic Sans MS', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "Click to Drive!",
            obj.x + obj.w / 2,
            obj.y - 15 + Math.sin(now / 150) * 5,
          );
          ctx.restore();
        }
      } else if (obj.type === "petrol_pump") {
        if (petrolPumpImg.complete && petrolPumpImg.width > 0) {
          ctx.drawImage(petrolPumpImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
      } else if (obj.type === "car_park") {
        if (carParkImg.complete && carParkImg.width > 0) {
          ctx.drawImage(carParkImg, obj.x, obj.y, obj.w, obj.h);
        } else {
          ctx.fillStyle = "#475569";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
          ctx.fillStyle = "#fff";
          ctx.fillText("P", obj.x + 30, obj.y + 40);
        }
      }
    }
  }

  /* ── Border fences ──────────────────────────────────── */
  function drawBorders() {
    ctx.fillStyle = "#78716c";
    for (let i = 0; i < 4; i++) {
      const b = Objects.barriers[i];
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.fillStyle = "#a8a29e";
    for (let fx = 0; fx < CONFIG.WORLD_W; fx += 80) {
      ctx.fillRect(fx, -200, 6, 14); // Adjusted for new top map boundary
      ctx.fillRect(fx, CONFIG.WORLD_H - 14, 6, 14);
    }
    for (let fy = -200; fy < CONFIG.WORLD_H; fy += 80) {
      ctx.fillRect(0, fy, 14, 6);
      ctx.fillRect(CONFIG.WORLD_W - 14, fy, 14, 6);
    }
  }

  /* ── Particles ──────────────────────────────────────── */
  function drawParticles() {
    for (const p of Particles.smoke) {
      ctx.globalAlpha = p.life * p.alpha;
      ctx.fillStyle = "#a8a29e";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const r of Particles.ripples) {
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const f of Particles.floats) {
      ctx.globalAlpha = Math.max(0, f.life / 1.5);
      ctx.fillStyle = f.color;
      
      if (f.isCoin && coinFrames.length > 0) {
        ctx.font = "bold 36px sans-serif";
        const now = Date.now();
        const frameIdx = Math.floor(now / 100) % coinFrames.length;
        const cImg = coinFrames[frameIdx];

        if (cImg && cImg.complete) {
          ctx.textAlign = "left";
          const textWidth = ctx.measureText(f.text).width;
          const totalW = 80 + 15 + textWidth;
          const startX = f.x - totalW / 2;
          ctx.drawImage(cImg, startX, f.y - 60, 80, 80);
          // Dark drop-shadow for contrast
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          ctx.fillText(f.text, startX + 95, f.y);
          ctx.shadowColor = "transparent";
        } else {
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(f.text, f.x, f.y);
          ctx.shadowColor = "transparent";
        }
      } else {
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowColor = "transparent";
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ── Player ─────────────────────────────────────────── */
  function drawPlayer(gs) {
    const p = Player.state;

    const sprite = p.currentSprite;
    if (!sprite) {
      // Fallback plain shape if images aren't loaded yet
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(p.x + 11, p.y + 13, 5, 5);
      ctx.fillRect(p.x + 24, p.y + 13, 5, 5);
      return;
    }

    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    // Sprite scale might need adjustment depending on the PNG dimensions
    // For a typical sprite sheet we'll scale it slightly larger than hit-box.
    // Try adjusting 1.5 multiplier if your character looks too small or big.
    const sc = 2.8;
    const drawW = p.w * sc;
    const drawH = p.h * sc;

    ctx.save();
    ctx.translate(cx, cy);

    if (p.flipX) ctx.scale(-1, 1);

    // Some sprites have empty transparent space near top/bottom,
    // so we offset by half the drawn dimensions to center it.
    ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }

  /* ── HUD ────────────────────────────────────────────── */
  function updateHUD(gs) {
    const sc = document.getElementById("score-display");
    const ac = document.getElementById("actions-display");
    const inventory = document.getElementById("inventory");

    if (sc) sc.textContent = gs.score;
    if (ac) ac.textContent = "";

    if (inventory && gs.inventory) {
      let invText = [];
      if (gs.inventory.trash > 0) invText.push(`${gs.inventory.trash} Trash`);
      if (gs.inventory.bottles > 0)
        invText.push(`${gs.inventory.bottles} Bottles`);

      if (invText.length > 0) {
        inventory.textContent = `🎒 Carrying: ` + invText.join(", ");
      } else {
        inventory.textContent = `🎒 Carrying: Nothing`;
      }
    }
  }

  /* ── Minimap ────────────────────────────────────────── */
  function drawMinimap(t, vw, vh) {
    const s = CONFIG.MINI_SCALE;
    miniCtx.fillStyle = Utils.lerpColor("#4ade80", "#78552b", t);
    miniCtx.fillRect(0, 0, miniW, miniH);

    for (const o of Objects.interactables) {
      miniCtx.fillStyle = o.pollRate > 0 ? "#f87171" : "#38bdf8";
      miniCtx.fillRect(
        o.x * s,
        o.y * s,
        Math.max(o.w * s, 3),
        Math.max(o.h * s, 3),
      );
    }

    miniCtx.fillStyle = "#b91c1c";
    miniCtx.fillRect(
      Objects.barriers[4].x * s,
      Objects.barriers[4].y * s,
      Objects.barriers[4].w * s,
      Objects.barriers[4].h * s,
    );
    miniCtx.fillStyle = "#78716c";
    miniCtx.fillRect(
      Objects.barriers[5].x * s,
      Objects.barriers[5].y * s,
      Objects.barriers[5].w * s,
      Objects.barriers[5].h * s,
    );

    const vt = Math.floor(Objects.trees.length * (1 - t));
    miniCtx.fillStyle = "#16a34a";
    for (let i = 0; i < vt; i++)
      miniCtx.fillRect(Objects.trees[i].x * s, Objects.trees[i].y * s, 2, 2);

    miniCtx.fillStyle = "#facc15";
    miniCtx.fillRect(Player.state.x * s - 2, Player.state.y * s - 2, 5, 5);

    // Viewport rect (zoom-adjusted)
    const visW = vw / Camera.zoom;
    const visH = vh / Camera.zoom;
    miniCtx.strokeStyle = "rgba(255,255,255,.6)";
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(Camera.x * s, Camera.y * s, visW * s, visH * s);
  }

  return { init, draw };
})();
