import type { GameState } from '../types.js';
import { TICK_RATE, UNIT_STATS } from '../constants.js';

const WAYPOINT_THRESHOLD = 0.3;

export function moveUnits(state: GameState): void {
  for (const unit of state.units) {
    if (unit.goal === null) continue;

    const speed = UNIT_STATS[unit.kind].speed / TICK_RATE;

    if (unit.path !== null && unit.path.length > 0) {
      let remaining = speed;

      while (remaining > 1e-9 && unit.path.length > 0) {
        const wp = unit.path[0]!;
        const tx = wp.x + 0.5;
        const ty = wp.y + 0.5;
        const dx = tx - unit.pos.x;
        const dy = ty - unit.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < WAYPOINT_THRESHOLD) {
          unit.path.shift();
          continue;
        }

        const stepSize = Math.min(remaining, dist);
        unit.pos.x += (dx / dist) * stepSize;
        unit.pos.y += (dy / dist) * stepSize;
        remaining -= stepSize;

        if (dist - stepSize < WAYPOINT_THRESHOLD) {
          unit.path.shift();
        }
      }

      if (unit.path.length === 0) {
        unit.goal = null;
        unit.path = null;
      }
    } else {
      const dx = unit.goal.x - unit.pos.x;
      const dy = unit.goal.y - unit.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.05) {
        unit.goal = null;
        unit.path = null;
        continue;
      }

      const stepSize = Math.min(speed, dist);
      unit.pos.x += (dx / dist) * stepSize;
      unit.pos.y += (dy / dist) * stepSize;
    }
  }
}
