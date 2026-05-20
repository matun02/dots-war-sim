import type { GameState } from '../types.js';
import { TICK_RATE, UNIT_STATS } from '../constants.js';

export function moveUnits(state: GameState): void {
  for (const unit of state.units) {
    if (unit.goal === null) continue;

    const dx = unit.goal.x - unit.pos.x;
    const dy = unit.goal.y - unit.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.05) {
      unit.goal = null;
      unit.path = null;
      continue;
    }

    const speed = UNIT_STATS[unit.kind].speed / TICK_RATE;
    const stepSize = Math.min(speed, dist);

    unit.pos.x += (dx / dist) * stepSize;
    unit.pos.y += (dy / dist) * stepSize;
  }
}
