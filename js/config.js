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
    type: "factory",
    x: 2700,
    y: 300,
    w: 160,
    h: 120,
    pollRate: 0.35,
    interactEffect: -8,
    cooldown: 2.5,
    interactLabel: "Shut down smokestacks (−8)",
    icon: "🏭",
  },
  {
    type: "factory",
    x: 2400,
    y: 250,
    w: 140,
    h: 110,
    pollRate: 0.25,
    interactEffect: -6,
    cooldown: 2.5,
    interactLabel: "Shut down smokestacks (−6)",
    icon: "🏭",
  },
  {
    type: "trashbag",
    x: 2200,
    y: 600,
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
    x: 2000,
    y: 1100,
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
    x: 1800,
    y: 1800,
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
  {
    type: "burning_waste",
    x: 2600,
    y: 1900,
    w: 90,
    h: 70,
    pollRate: 0.3,
    interactEffect: -9,
    cooldown: 3.0,
    interactLabel: "Extinguish burning waste (−9)",
    icon: "🔥",
  },

  // CLEANUP SITES (Nature & Farm Zones)
  // River runs across the whole map horizontally!
  {
    type: "river",
    x: 0,
    y: 1450,
    w: 3200,
    h: 180,
    pollRate: -0.08,
    interactEffect: -12,
    cooldown: 2.0,
    interactLabel: "Clean the river (−12)",
    icon: "🌊",
  },
  {
    type: "windmill",
    x: 1800,
    y: 600,
    w: 100,
    h: 100,
    isOn: false,
    interactLabel: "Turn on windmill (+10)",
  },
  {
    type: "windmill",
    x: 2200,
    y: 300,
    w: 100,
    h: 100,
    isOn: false,
    interactLabel: "Turn on windmill (+10)",
    icon: "💨",
  },
];

/* ── Barrier definitions ──────────────────────────────── */
const BARRIER_DEFS = [
  // walls
  { x: 0, y: 0, w: CONFIG.WORLD_W, h: 14 },
  { x: 0, y: CONFIG.WORLD_H - 14, w: CONFIG.WORLD_W, h: 14 },
  { x: 0, y: 0, w: 14, h: CONFIG.WORLD_H },
  { x: CONFIG.WORLD_W - 14, y: 0, w: 14, h: CONFIG.WORLD_H },
  { type: "car", x: 2300, y: 220, w: 120, h: 60 },
  { type: "petrol_pump", x: 2000, y: 30, w: 400, h: 300 },
];

// Dynamically generate colony houses on the left
for (let y of [340, 680, 1020]) {
  for (let x = 100; x <= 1350; x += 250) {
    BARRIER_DEFS.push({ type: (Math.random() > 0.5 ? "house1" : "house2"), x: x, y: y, w: 200, h: 200 });
  }
}

/* ── Animal definitions ───────────────────────────────── */
const ANIMAL_DEFS = [
  // Moved farm animals to the right side
  { x: 2400, y: 550, type: "cow" },
  { x: 2500, y: 600, type: "chicken" },
  { x: 2300, y: 400, type: "cow" },
  { x: 2200, y: 450, type: "chicken" },
  { x: 2700, y: 600, type: "cow" },
  { x: 2800, y: 750, type: "chicken" },
  // Wild / roaming animals (moved right)
  { x: 2500, y: 900, type: "cow" },
  { x: 1800, y: 800, type: "chicken" },
  // Animals across the river
  { x: 600, y: 1800, type: "cow" },
  { x: 1200, y: 1900, type: "chicken" },
  { x: 2100, y: 2000, type: "cow" },
  { x: 1800, y: 2100, type: "chicken" },
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
