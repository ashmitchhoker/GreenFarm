/* ══════════════════════════════════════════════════════════
   GreenFarm — Config / Constants
   ══════════════════════════════════════════════════════════ */

const CONFIG = {
  // World
  WORLD_W: 3200,
  WORLD_H: 2400,

  // Minimap
  MINI_SCALE: 0.06,

  // Player
  PLAYER_W: 55,
  PLAYER_H: 55,
  PLAYER_SPEED: 260,
  PLAYER_COLOR: "#facc15",

  // Camera / Zoom
  ZOOM_MIN: 0.35,
  ZOOM_MAX: 1.2,
  ZOOM_DEFAULT_DESKTOP: 1.0,
  ZOOM_DEFAULT_MOBILE: 0.55,
  ZOOM_STEP: 0.08,
  ZOOM_PINCH_SENSITIVITY: 0.005,

  // Game pace
  INITIAL_POLLUTION: 12,

  // Detection
  IS_TOUCH: false, // set at runtime
};

// Detect touch device
CONFIG.IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;

/* ── Interactable definitions ─────────────────────────── */
const INTERACTABLE_DEFS = [
  // POLLUTION SOURCES (Industrial Zone - Top Right, and down bottom)
  {
    type: "trashbag",
    x: 500, // On bottom street (moved from top)
    y: 1170, // Placed on the green grass just above the 4th road
    w: 60,
    h: 50,
    pollRate: 0.14,
    interactEffect: -5,
    cooldown: 1.8,
    interactLabel: "Pick up trashbag (−5)",
    icon: "🗑️",
  },
  {
    type: "trashbag",
    x: 700, // On the second street
    y: 490, // Placed on the green grass just above the 2nd road
    w: 60,
    h: 50,
    pollRate: 0.14,
    interactEffect: -5,
    cooldown: 1.8,
    interactLabel: "Pick up trashbag (−5)",
    icon: "🗑️",
  },
  {
    type: "trashbag",
    x: 900, // On the third street
    y: 830, // Placed on the green grass just above the 3rd road
    w: 60,
    h: 50,
    pollRate: 0.12,
    interactEffect: -5,
    cooldown: 1.8,
    interactLabel: "Pick up trashbag (−5)",
    icon: "🗑️",
  },
  {
    type: "trashcan",
    x: 1800,
    y: 1400,
    w: 60,
    h: 60,
    pollRate: 0,
    interactEffect: -10,
    cooldown: 2.0,
    interactLabel: "Empty trashcan (−10)",
    icon: "♻️",
  },
  {
    type: "oil_spill",
    x: 2550,
    y: 650,
    w: 90,
    h: 40,
    pollRate: 0.2,
    interactEffect: -7,
    cooldown: 3.0,
    interactLabel: "Clean oil spill (−7)",
    icon: "🛢️",
  },
  {
    type: "oil_spill",
    x: 2850,
    y: 500,
    w: 120,
    h: 50,
    pollRate: 0.18,
    interactEffect: -7,
    cooldown: 3.0,
    interactLabel: "Clean oil spill (−7)",
    icon: "🛢️",
  },

  // CLEANUP SITES (Nature & Farm Zones)
  // River runs across the whole map horizontally!
  {
    type: "river",
    x: 0,
    y: 1550, // Shifted down to create a riverfront
    w: 3200,
    h: 250, // Extended downwards
    pollRate: -0.08,
  },
];

/* ── Barrier definitions ──────────────────────────────── */
const BARRIER_DEFS = [
  // walls
  { x: 0, y: -200, w: CONFIG.WORLD_W, h: 14 }, // Shifted top wall up to increase canvas space
  { x: 0, y: CONFIG.WORLD_H - 14, w: CONFIG.WORLD_W, h: 14 },
  { x: 0, y: -200, w: 14, h: CONFIG.WORLD_H + 200 },
  { x: CONFIG.WORLD_W - 14, y: -200, w: 14, h: CONFIG.WORLD_H + 200 },
  { type: "car", x: 2050, y: 20, w: 120, h: 60 }, // Parked at the petrol pump
  { type: "petrol_pump", x: 2000, y: -70, w: 350, h: 260 }, // Placed naturally above the road in the extended area
  { type: "mud_house_placeholder", x: 1330, y: 660, w: 240, h: 240 }, // Magnetic placeholder on the second street rightmost spot
  { type: "mud_house_placeholder", x: 1330, y: 1000, w: 240, h: 240 }, // Magnetic placeholder on the third street rightmost spot
];

// Dynamically generate colony houses on the left and a street trashcan ONLY at the top street
for (let y of [340, 680, 1020]) {
  for (let x = 100; x <= 1100; x += 250) {
    // Reduced max X from 1350 to 1100 so right-most spot is empty
    BARRIER_DEFS.push({
      type: Math.random() > 0.5 ? "house1" : "house2",
      x: x,
      y: y,
      w: 200,
      h: 200,
    });
  }

  // Only place the trash can street for the top row (y === 340)
  if (y === 340) {
    INTERACTABLE_DEFS.push({
      type: "trashcan_street",
      x: 1400, // Positioned on the right side of the street block
      y: y + 50, // Vertically centered to the house row
      w: 120,
      h: 140,
      pollRate: 0,
      interactEffect: -10,
      cooldown: 2.0,
      interactLabel: "Place trash in street bin",
      icon: "♻️",
    });
  }
}

// Place street lights along the vertical road
for (let y of [400, 750, 1100]) {
  INTERACTABLE_DEFS.push({
    type: "street_light",
    x: 1720, // Right side of the vertical road
    y: y,
    w: 50,
    h: 150,
    pollRate: 0.05,
    interactEffect: -5,
    cooldown: 1.0,
    interactLabel: "Turn off street light",
    isOn: true,
  });
}

// Garbage truck
INTERACTABLE_DEFS.push({
  type: "garbage_truck",
  x: 40,
  y: 200,
  w: 260,
  h: 165,
  interactLabel: "Call Garbage Truck",
  cooldown: 5.0,
  icon: "🚛",
});

// Dynamically generate factories and windmills on the right side
let fCount = 0;
for (let x = 1800; x <= 2800; x += 250) {
  // Top right: Factories (y: 350)
  INTERACTABLE_DEFS.push({
    type: "factory",
    x: x,
    y: 350,
    w: 200, // Scaled up by 25%
    h: 150, // Scaled up by 25%
    pollRate: 0.35,
    interactEffect: -8,
    cooldown: 2.5,
    interactLabel: "Shut down smokestacks (−8)",
    icon: "🏭",
    fIdx: fCount % 5,
  });

  // Middle right: Windmills (y: 690)
  INTERACTABLE_DEFS.push({
    type: "windmill",
    x: x,
    y: 690,
    w: 150, // Scaled up
    h: 150, // Scaled up
    isOn: false,
    interactLabel: "Turn on Windmill (+15)",
    interactEffect: -2,
    cooldown: 5.0,
  });
  fCount++;
}

// Generate Benches along the Riverfront (River is at y=1550, so benches around y=1420)
for (let x = 150; x <= 3000; x += 400) {
  // Avoid placing bench directly in the middle path if they are continuous, but doing 400 spacing is sparse.
  if (x > 1400 && x < 1800) continue; // Skip near the vertical road intersection
  BARRIER_DEFS.push({
    type: "bench",
    x: x,
    y: 1420, // Shifted up to match the river's new y=1550 location
    w: 120,
    h: 80,
  });
}

// Add riverfront recycling bins (Paper, Plastic, Non-recyclable)
INTERACTABLE_DEFS.push(
  {
    type: "trashcan_paper",
    x: 800,
    y: 1450,
    w: 80,
    h: 80,
    pollRate: 0,
    interactEffect: -10,
    cooldown: 2.0,
    interactLabel: "Empty paper bin (−10)",
    icon: "📄",
  },
  {
    type: "trashcan_plastic",
    x: 2000,
    y: 1450,
    w: 80,
    h: 80,
    pollRate: 0,
    interactEffect: -10,
    cooldown: 2.0,
    interactLabel: "Empty plastic bin (−10)",
    icon: "📦",
  },
  {
    type: "trashcan_non_recyclable",
    x: 2800,
    y: 1450,
    w: 80,
    h: 80,
    pollRate: 0,
    interactEffect: -10,
    cooldown: 2.0,
    interactLabel: "Empty general bin (−10)",
    icon: "🗑️",
  },
);

// Add hazardous/contaminated bins in the factory corner
INTERACTABLE_DEFS.push(
  {
    type: "trashcan_contaminated",
    x: 3100,
    y: 350,
    w: 80,
    h: 80,
    pollRate: 0.1,
    interactEffect: -15,
    cooldown: 3.0,
    interactLabel: "Empty contaminated waste (−15)",
    icon: "☣️",
  },
  {
    type: "trashcan_hazardous",
    x: 3100,
    y: 450,
    w: 80,
    h: 80,
    pollRate: 0.1,
    interactEffect: -15,
    cooldown: 3.0,
    interactLabel: "Empty hazardous waste (−15)",
    icon: "☢️",
  },
);

// Add plastic bottles near riverfront benches and water
for (let i = 0; i < 12; i++) {
  // Distribute along the river (y: 1450 to 1650), across the map (x: 200 to 2900)
  let bx = 200 + Math.random() * 2700;
  let by = 1480 + Math.random() * 120;
  INTERACTABLE_DEFS.push({
    type: Math.random() > 0.5 ? "plastic_bottle_1" : "plastic_bottle_2",
    x: bx,
    y: by,
    w: 30, // Much smaller than trashcans
    h: 30,
    pollRate: 0.05,
    interactEffect: -2,
    cooldown: 0.5, // Fast to pick up
    interactLabel: "Pick up plastic bottle (−2)",
    icon: "🧴",
  });
}

/* ── Animal definitions ───────────────────────────────── */
const ANIMAL_DEFS = [
  // Sea animals (in the river: y = 1550 to 1800)
  { x: 300, y: 1600, type: "shark" },
  { x: 800, y: 1700, type: "turtle" },
  { x: 1200, y: 1650, type: "octopus" },
  { x: 1800, y: 1720, type: "jellyfish" },
  { x: 2200, y: 1600, type: "shark" },
  { x: 2600, y: 1680, type: "turtle" },
  { x: 400, y: 1750, type: "jellyfish" },
  { x: 2800, y: 1650, type: "octopus" },

  // Land animals (below the river: y > 1800)
  { x: 600, y: 1950, type: "dog" },
  { x: 1200, y: 1900, type: "fox" },
  { x: 2100, y: 2000, type: "frog" },
  { x: 1800, y: 2100, type: "dog" },
  { x: 800, y: 2200, type: "fox" },
  { x: 1400, y: 1850, type: "frog" },
  { x: 2500, y: 1900, type: "dog" },
  { x: 2400, y: 2100, type: "fox" },
  { x: 2800, y: 1850, type: "frog" },
  { x: 2700, y: 2200, type: "dog" },
  { x: 1000, y: 2000, type: "fox" },
  { x: 1600, y: 2150, type: "frog" },
];

/* ── Ripple colours per type ──────────────────────────── */
const RIPPLE_COLORS = {
  factory: "#f87171",
  trash: "#a3e635",
  oil_spill: "#fbbf24",
  burning_waste: "#fb923c",
  river: "#38bdf8",
  solar_panel: "#facc15",
  windmill: "#93c5fd",
};
