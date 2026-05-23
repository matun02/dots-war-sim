export const TICK_RATE = 30;
export const SUPPLY_MAX = 5;

export const ATTACK_RANGE = 1.5;
export const CAPTURE_NEUTRALIZE_TICKS = 60;
export const CAPTURE_CLAIM_TICKS = 30;
export const POST_CAPTURE_COOLDOWN_TICKS = 150;

export const GAME_TIME_LIMIT_TICKS = 36000;

export const UNIT_STATS = {
  light: {
    speed: 4,
    attack: 1,
    hp: 1,
    attackIntervalTicks: 15,
    produceIntervalTicks: 60,
  },
  heavy: {
    speed: 2,
    attack: 3,
    hp: 5,
    attackIntervalTicks: 30,
    produceIntervalTicks: 180,
  },
} as const;
