import type { GameState } from '../types.js';
import { SpatialHash } from '../spatial-hash.js';

const SEPARATION_DIST = 0.6;
const TERRAIN_MOUNTAIN = 1;

// 通行可否はコア地形ルールと統一: mountain のみ壁（water/forest は通行可）。
// 出典: pathfinding/astar.ts, sim/init.ts。
function isImpassable(terrain: number): boolean {
  return terrain === TERRAIN_MOUNTAIN;
}

export function separateUnits(state: GameState): void {
  const { units, map } = state;
  if (units.length < 2) return;

  const hash = new SpatialHash(1, map.width, map.height);
  for (const unit of units) {
    hash.insert(unit.id, unit.pos.x, unit.pos.y);
  }

  const unitById = new Map(units.map((u) => [u.id as number, u]));

  const processed = new Set<number>();

  for (const unit of units) {
    const neighbors = hash.query(unit.pos.x, unit.pos.y, SEPARATION_DIST);

    for (const neighborId of neighbors) {
      if ((neighborId as number) === (unit.id as number)) continue;

      const pairKey =
        (unit.id as number) < (neighborId as number)
          ? (unit.id as number) * 100000 + (neighborId as number)
          : (neighborId as number) * 100000 + (unit.id as number);

      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const neighbor = unitById.get(neighborId as number);
      if (!neighbor) continue;

      const dx = neighbor.pos.x - unit.pos.x;
      const dy = neighbor.pos.y - unit.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= SEPARATION_DIST) continue;

      let pushX: number;
      let pushY: number;

      if (dist < 1e-9) {
        // Distance zero: tie-break by id (smaller id goes +x)
        pushX = 1;
        pushY = 0;
      } else {
        pushX = dx / dist;
        pushY = dy / dist;
      }

      const pushAmount = (SEPARATION_DIST - dist) * 0.5;

      // Unit with smaller id moves in -push direction, larger in +push direction
      const smallerUnit =
        (unit.id as number) < (neighborId as number) ? unit : neighbor;
      const largerUnit =
        (unit.id as number) < (neighborId as number) ? neighbor : unit;

      const smallNewX = smallerUnit.pos.x - pushX * pushAmount;
      const smallNewY = smallerUnit.pos.y - pushY * pushAmount;

      if (
        smallNewX >= 0 &&
        smallNewX < map.width &&
        smallNewY >= 0 &&
        smallNewY < map.height
      ) {
        const ix = Math.floor(smallNewY) * map.width + Math.floor(smallNewX);
        if (!isImpassable(map.terrain[ix]!)) {
          smallerUnit.pos.x = smallNewX;
          smallerUnit.pos.y = smallNewY;
        }
      }

      const largeNewX = largerUnit.pos.x + pushX * pushAmount;
      const largeNewY = largerUnit.pos.y + pushY * pushAmount;

      if (
        largeNewX >= 0 &&
        largeNewX < map.width &&
        largeNewY >= 0 &&
        largeNewY < map.height
      ) {
        const ix = Math.floor(largeNewY) * map.width + Math.floor(largeNewX);
        if (!isImpassable(map.terrain[ix]!)) {
          largerUnit.pos.x = largeNewX;
          largerUnit.pos.y = largeNewY;
        }
      }
    }
  }
}
