import { describe, expect, it } from 'vitest';
import type { EntityId, PlayerId, Unit } from '@dots-war-sim/core';
import { unitsInRect } from './selection.js';

function makeUnit(
  id: number,
  owner: number,
  x: number,
  y: number,
): Unit {
  return {
    id: id as EntityId,
    owner: owner as PlayerId,
    kind: 'light',
    homeCity: 0 as never,
    pos: { x, y },
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
  };
}

describe('unitsInRect', () => {
  it('returns only units inside the AABB', () => {
    const units: Unit[] = [
      makeUnit(0, 0, 5, 5),
      makeUnit(1, 0, 15, 15),
      makeUnit(2, 0, 10, 10),
    ];

    const result = unitsInRect(units, 0, { x: 4, y: 4 }, { x: 11, y: 11 });

    expect(result).toEqual([0, 2]);
  });

  it('excludes units belonging to another player', () => {
    const units: Unit[] = [
      makeUnit(0, 0, 5, 5),
      makeUnit(1, 1, 5, 5),
    ];

    const result = unitsInRect(units, 0, { x: 0, y: 0 }, { x: 10, y: 10 });

    expect(result).toEqual([0]);
  });

  it('returns ids sorted in ascending order', () => {
    const units: Unit[] = [
      makeUnit(5, 0, 1, 1),
      makeUnit(2, 0, 2, 2),
      makeUnit(8, 0, 3, 3),
      makeUnit(1, 0, 4, 4),
    ];

    const result = unitsInRect(units, 0, { x: 0, y: 0 }, { x: 10, y: 10 });

    expect(result).toEqual([1, 2, 5, 8]);
  });
});
