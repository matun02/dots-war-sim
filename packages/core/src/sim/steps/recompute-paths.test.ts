import { describe, expect, it } from 'vitest';
import { recomputePaths } from './recompute-paths.js';
import type {
  CityId,
  EntityId,
  GameState,
  PlayerId,
  Unit,
} from '../types.js';

function makeUnit(id: number, overrides: Partial<Unit> = {}): Unit {
  return {
    id: id as EntityId,
    owner: 0 as PlayerId,
    kind: 'light',
    homeCity: 0 as CityId,
    pos: { x: 1, y: 1 },
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(units: Unit[]): GameState {
  return {
    tick: 0,
    seed: 42,
    map: {
      id: 'test',
      width: 20,
      height: 20,
      terrain: Array.from({ length: 20 * 20 }, () => 0),
      cities: [],
      spawns: [],
    },
    players: [],
    cities: [],
    units,
    nextEntityId: 0,
    result: null,
  };
}

describe('recomputePaths', () => {
  it('computes path for unit with goal but no path', () => {
    const unit = makeUnit(1, { goal: { x: 10, y: 10 } });
    const state = makeState([unit]);

    recomputePaths(state);

    expect(unit.path).not.toBeNull();
    expect(unit.path!.length).toBeGreaterThan(0);
  });

  it('ignores units with no goal', () => {
    const unit = makeUnit(1, { goal: null, path: null });
    const state = makeState([unit]);

    recomputePaths(state);

    expect(unit.path).toBeNull();
  });

  it('does not recompute when path already exists', () => {
    const existingPath = [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ];
    const unit = makeUnit(1, {
      goal: { x: 5, y: 5 },
      path: existingPath,
    });
    const state = makeState([unit]);

    recomputePaths(state);

    expect(unit.path).toBe(existingPath);
  });

  it('limits recomputation to 8 per tick (9th is deferred)', () => {
    const units: Unit[] = [];
    for (let i = 0; i < 10; i++) {
      units.push(
        makeUnit(i, {
          pos: { x: 1, y: 1 },
          goal: { x: 15, y: 15 },
          path: null,
        }),
      );
    }
    const state = makeState(units);

    recomputePaths(state);

    let computed = 0;
    for (const u of units) {
      if (u.path !== null) computed++;
    }
    expect(computed).toBe(8);

    expect(units[8]!.path).toBeNull();
    expect(units[8]!.goal).not.toBeNull();
    expect(units[9]!.path).toBeNull();
    expect(units[9]!.goal).not.toBeNull();
  });

  it('resets goal to null when path is unreachable', () => {
    const terrain = Array.from({ length: 20 * 20 }, () => 0);
    for (let x = 0; x < 20; x++) {
      terrain[5 * 20 + x] = 3;
    }

    const unit = makeUnit(1, {
      pos: { x: 1, y: 1 },
      goal: { x: 1, y: 15 },
      path: null,
    });
    const state = makeState([unit]);
    state.map.terrain = terrain;

    recomputePaths(state);

    expect(unit.path).toBeNull();
    expect(unit.goal).toBeNull();
  });
});
