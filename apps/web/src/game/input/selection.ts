import type { EntityId, Unit, Vec2 } from '@dots-war-sim/core';

export interface SelectionBox {
  startWorld: Vec2;
  endWorld: Vec2;
}

export function unitsInRect(
  units: readonly Unit[],
  player: number,
  topLeft: Vec2,
  bottomRight: Vec2,
): EntityId[] {
  const minX = Math.min(topLeft.x, bottomRight.x);
  const maxX = Math.max(topLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, bottomRight.y);
  const maxY = Math.max(topLeft.y, bottomRight.y);

  const result: EntityId[] = [];
  for (const u of units) {
    if (
      u.owner === player &&
      u.pos.x >= minX &&
      u.pos.x <= maxX &&
      u.pos.y >= minY &&
      u.pos.y <= maxY
    ) {
      result.push(u.id);
    }
  }

  result.sort((a, b) => a - b);
  return result;
}
