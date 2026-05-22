export type {
  EntityId,
  CityId,
  PlayerId,
  Vec2,
  Terrain,
  UnitKind,
  Player,
  City,
  Unit,
  MapDef,
  GameState,
  GameResult,
  Command,
  InputFrame,
} from './types.js';

export { TERRAIN_INDEX } from './types.js';

export { tick } from './tick.js';
export { createInitialState } from './init.js';
export {
  TICK_RATE,
  SUPPLY_MAX,
  UNIT_STATS,
  ATTACK_RANGE,
  CAPTURE_NEUTRALIZE_TICKS,
  CAPTURE_CLAIM_TICKS,
  POST_CAPTURE_COOLDOWN_TICKS,
} from './constants.js';
export { SpatialHash } from './spatial-hash.js';
export { hashState } from './hash.js';
