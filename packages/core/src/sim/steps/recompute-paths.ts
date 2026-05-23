import type { GameState } from '../types.js';
import { findPath } from '../../pathfinding/astar.js';

const MAX_RECOMPUTE_PER_TICK = 8;

export function recomputePaths(state: GameState): void {
  let count = 0;

  const pending = state.units.filter(
    (u) => u.goal !== null && u.path === null,
  );
  pending.sort((a, b) => (a.id as number) - (b.id as number));

  for (const unit of pending) {
    if (count >= MAX_RECOMPUTE_PER_TICK) break;

    const path = findPath(state.map, unit.pos, unit.goal!, unit.kind);
    if (path === null) {
      unit.goal = null;
    } else {
      unit.path = path;
    }
    count++;
  }
}
