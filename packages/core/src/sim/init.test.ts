import { describe, expect, it } from 'vitest';
import { createInitialState } from './init.js';
import type { CityId, MapDef, Player, PlayerId } from './types.js';

function makeTestMap(): MapDef {
  return {
    id: 'test-4x4',
    width: 4,
    height: 4,
    terrain: Array.from({ length: 16 }, () => 0),
    cities: [
      { id: 0 as CityId, pos: { x: 1, y: 1 }, production: 'light' as const },
      { id: 1 as CityId, pos: { x: 3, y: 3 }, production: 'light' as const },
      { id: 2 as CityId, pos: { x: 2, y: 2 }, production: 'heavy' as const },
    ],
    spawns: [
      { player: 0 as PlayerId, cityId: 0 as CityId },
      { player: 1 as PlayerId, cityId: 1 as CityId },
    ],
  };
}

function makePlayers(): Player[] {
  return [
    { id: 0 as PlayerId, name: 'P1', color: 0x4488ff, alive: true },
    { id: 1 as PlayerId, name: 'P2', color: 0xff8844, alive: true },
  ];
}

describe('createInitialState', () => {
  it('returns a valid initial GameState', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    expect(state.tick).toBe(0);
    expect(state.seed).toBe(42);
    expect(state.result).toBeNull();
    expect(state.players).toHaveLength(2);
    expect(state.cities).toHaveLength(3);
  });

  it('sets owner on spawn cities', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    const city0 = state.cities.find((c) => c.id === (0 as CityId))!;
    const city1 = state.cities.find((c) => c.id === (1 as CityId))!;
    expect(city0.owner).toBe(0);
    expect(city1.owner).toBe(1);
  });

  it('leaves non-spawn cities as neutral (owner = null)', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    const city2 = state.cities.find((c) => c.id === (2 as CityId))!;
    expect(city2.owner).toBeNull();
  });

  it('starts with an empty units array', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    expect(state.units).toEqual([]);
  });

  it('starts nextEntityId at 0', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    expect(state.nextEntityId).toBe(0);
  });
});
