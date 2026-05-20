import type { EntityId, GameState } from '../types.js';
import type { Rng } from '../../rng.js';
import { SUPPLY_MAX, UNIT_STATS } from '../constants.js';

export function produceUnits(state: GameState, _rng: Rng): void {
  for (const city of state.cities) {
    if (city.owner === null) continue;
    if (city.capturingPlayer !== null) continue;
    if (city.supplyUsed >= SUPPLY_MAX) continue;

    if (city.produceCooldownTicks > 0) {
      city.produceCooldownTicks--;
      continue;
    }

    const kind = city.production;
    const stats = UNIT_STATS[kind];

    state.units.push({
      id: state.nextEntityId++ as EntityId,
      owner: city.owner,
      kind,
      homeCity: city.id,
      pos: { x: city.pos.x, y: city.pos.y },
      hp: stats.hp,
      path: null,
      goal: null,
      attackCooldownTicks: 0,
    });

    city.supplyUsed++;
    city.produceCooldownTicks = stats.produceIntervalTicks;
  }
}
