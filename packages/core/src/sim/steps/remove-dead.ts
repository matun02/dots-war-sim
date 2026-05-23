import type { GameState } from '../types.js';
import { UNIT_STATS } from '../constants.js';

export function removeDead(state: GameState): void {
  const { units, cities } = state;

  for (const unit of units) {
    if (unit.hp <= 0) {
      for (const city of cities) {
        if (city.id === unit.homeCity) {
          city.supplyUsed -= UNIT_STATS[unit.kind].supplyCost;
          break;
        }
      }
    }
  }

  state.units = units.filter((u) => u.hp > 0);
}
