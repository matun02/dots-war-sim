export const TICK_RATE = 30;
export const SUPPLY_MAX = 5;

export const ATTACK_RANGE = 1.5;
export const ENGAGE_DISTANCE = 3.0;
export const ENGAGE_SPEED_FACTOR = 0.25;
export const CAPTURE_TICKS = 90;
export const POST_CAPTURE_COOLDOWN_TICKS = 150;

export const GAME_TIME_LIMIT_TICKS = 36000;

export const UNIT_STATS = {
  light: {
    speed: 4,
    attack: 1,
    hp: 15,
    attackIntervalTicks: 15,
    produceIntervalTicks: 60,
    supplyCost: 1,
  },
  heavy: {
    speed: 2,
    attack: 3,
    hp: 75,
    attackIntervalTicks: 30,
    produceIntervalTicks: 180,
    supplyCost: 2,
  },
} as const;
