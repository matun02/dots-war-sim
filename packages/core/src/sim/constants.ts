export const TICK_RATE = 30;
export const SUPPLY_MAX = 5;

export const ATTACK_RANGE = 1.5;
export const ENGAGE_DISTANCE = 3.0;
export const ENGAGE_SPEED_FACTOR = 0.25;
export const CAPTURE_TICKS = 90;
export const POST_CAPTURE_COOLDOWN_TICKS = 150;

export const GAME_TIME_LIMIT_TICKS = 36000;

// hp/attack are ×100-scaled so terrain attack multipliers (e.g. ×0.75) stay
// integer & deterministic. supplyCost / *IntervalTicks are NOT scaled.
export const UNIT_STATS = {
  light: {
    speed: 2,
    attack: 100,
    hp: 1500,
    attackIntervalTicks: 15,
    produceIntervalTicks: 60,
    supplyCost: 1,
  },
  heavy: {
    speed: 1,
    attack: 300,
    hp: 7500,
    attackIntervalTicks: 30,
    produceIntervalTicks: 180,
    supplyCost: 2,
  },
} as const;

// Terrain-based attack multiplier as integer percent, keyed by the ATTACKER's
// terrain. Index = terrain value (0=plain, 1=mountain, 2=forest, 3=water, 4=city).
// damage = floor((attack * pct + 50) / 100) — round-half-up, integer/deterministic.
export const TERRAIN_ATTACK_PCT = {
  light: [100, 100, 100, 75, 100],
  heavy: [100, 100, 75, 75, 100],
} as const;

// Terrain-based MOVEMENT-SPEED multiplier (integer percent), keyed by the tile
// the unit currently occupies. Distinct from A* movement COST (astar.ts): cost
// only affects routing, this scales the actual per-tick travel speed.
// mountain is impassable so its value is moot. Index = terrain value (0..3, 4=city).
export const TERRAIN_SPEED_PCT = {
  light: [100, 100, 100, 50, 100],
  heavy: [100, 100, 75, 50, 100],
} as const;
