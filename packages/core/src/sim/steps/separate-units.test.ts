import { describe, expect, it } from 'vitest';
import { separateUnits } from './separate-units.js';
import type {
  CityId,
  EntityId,
  GameState,
  PlayerId,
  Unit,
} from '../types.js';

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 0 as EntityId,
    owner: 0 as PlayerId,
    kind: 'light',
    homeCity: 0 as CityId,
    pos: { x: 5, y: 5 },
    hp: 3,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(units: Unit[], terrain?: number[]): GameState {
  const width = 20;
  const height = 20;
  return {
    tick: 0,
    seed: 42,
    map: {
      id: 'test',
      width,
      height,
      terrain: terrain ?? Array.from({ length: width * height }, () => 0),
      cities: [],
      spawns: [],
    },
    players: [],
    cities: [],
    units,
    nextEntityId: units.length,
    result: null,
  };
}

describe('separateUnits', () => {
  it('separates two overlapping units', () => {
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 5.2, y: 5 } });
    const state = makeState([u0, u1]);

    separateUnits(state);

    const dist = Math.sqrt(
      (state.units[0]!.pos.x - state.units[1]!.pos.x) ** 2 +
        (state.units[0]!.pos.y - state.units[1]!.pos.y) ** 2,
    );
    expect(dist).toBeGreaterThanOrEqual(0.6 - 1e-9);
  });

  it('separates allies (same owner)', () => {
    const u0 = makeUnit({
      id: 0 as EntityId,
      owner: 0 as PlayerId,
      pos: { x: 5, y: 5 },
    });
    const u1 = makeUnit({
      id: 1 as EntityId,
      owner: 0 as PlayerId,
      pos: { x: 5.1, y: 5 },
    });
    const state = makeState([u0, u1]);

    separateUnits(state);

    const dist = Math.sqrt(
      (state.units[0]!.pos.x - state.units[1]!.pos.x) ** 2 +
        (state.units[0]!.pos.y - state.units[1]!.pos.y) ** 2,
    );
    expect(dist).toBeGreaterThanOrEqual(0.6 - 1e-9);
  });

  it('tie-breaks distance=0 by id (smaller id goes +x)', () => {
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 5, y: 5 } });
    const state = makeState([u0, u1]);

    separateUnits(state);

    // Smaller id (0) moves in -push direction, larger id (1) in +push direction
    // push direction is +x, so smaller goes -x, larger goes +x
    expect(state.units[0]!.pos.x).toBeLessThan(5);
    expect(state.units[1]!.pos.x).toBeGreaterThan(5);
  });

  it('clamps at map boundary', () => {
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 0.1, y: 5 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 0.1, y: 5 } });
    const state = makeState([u0, u1]);

    separateUnits(state);

    expect(state.units[0]!.pos.x).toBeGreaterThanOrEqual(0);
    expect(state.units[1]!.pos.x).toBeGreaterThanOrEqual(0);
  });

  it('does not push into impassable terrain', () => {
    const terrain = Array.from({ length: 400 }, () => 0);
    // Place mountain at cell (4, 5) — unit 0 should not be pushed there
    terrain[5 * 20 + 4] = 1;

    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 5, y: 5 } });
    const state = makeState([u0, u1], terrain);

    separateUnits(state);

    // u0 (smaller id) would normally go -x (toward x=4.7), which is cell (4,5) = mountain
    // So u0 should not move
    expect(state.units[0]!.pos.x).toBe(5);
    expect(state.units[0]!.pos.y).toBe(5);
    // u1 should still move +x
    expect(state.units[1]!.pos.x).toBeGreaterThan(5);
  });

  it('separates units on water (water is passable per terrain rules)', () => {
    const terrain = Array.from({ length: 400 }, () => 3); // all water
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 5.2, y: 5 } });
    const state = makeState([u0, u1], terrain);

    separateUnits(state);

    const dist = Math.sqrt(
      (state.units[0]!.pos.x - state.units[1]!.pos.x) ** 2 +
        (state.units[0]!.pos.y - state.units[1]!.pos.y) ** 2,
    );
    expect(dist).toBeGreaterThanOrEqual(0.6 - 1e-9);
  });

  it('does not affect units far apart', () => {
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 2, y: 2 } });
    const u1 = makeUnit({ id: 1 as EntityId, pos: { x: 10, y: 10 } });
    const state = makeState([u0, u1]);

    separateUnits(state);

    expect(state.units[0]!.pos.x).toBe(2);
    expect(state.units[0]!.pos.y).toBe(2);
    expect(state.units[1]!.pos.x).toBe(10);
    expect(state.units[1]!.pos.y).toBe(10);
  });

  it('is deterministic: same input produces same output', () => {
    const makeUnits = (): Unit[] => [
      makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } }),
      makeUnit({ id: 1 as EntityId, pos: { x: 5.3, y: 5.1 } }),
      makeUnit({ id: 2 as EntityId, pos: { x: 5.1, y: 5.3 } }),
    ];

    const state1 = makeState(makeUnits());
    const state2 = makeState(makeUnits());

    separateUnits(state1);
    separateUnits(state2);

    for (let i = 0; i < state1.units.length; i++) {
      expect(state1.units[i]!.pos.x).toBe(state2.units[i]!.pos.x);
      expect(state1.units[i]!.pos.y).toBe(state2.units[i]!.pos.y);
    }
  });

  it('handles single unit without error', () => {
    const u0 = makeUnit({ id: 0 as EntityId, pos: { x: 5, y: 5 } });
    const state = makeState([u0]);

    separateUnits(state);

    expect(state.units[0]!.pos.x).toBe(5);
    expect(state.units[0]!.pos.y).toBe(5);
  });
});
