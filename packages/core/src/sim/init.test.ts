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

function makeLargeTestMap(): MapDef {
  const width = 64;
  const height = 36;
  const terrain = Array.from({ length: width * height }, () => 0);
  // Place mountains in center rows 16-19, columns 28-35 (terrain=1)
  for (let y = 16; y <= 19; y++) {
    for (let x = 28; x <= 35; x++) {
      terrain[y * width + x] = 1;
    }
  }
  return {
    id: 'test-large',
    width,
    height,
    terrain,
    cities: [
      { id: 0 as CityId, pos: { x: 10, y: 8 }, production: 'light' as const },
      { id: 1 as CityId, pos: { x: 54, y: 28 }, production: 'light' as const },
      { id: 2 as CityId, pos: { x: 32, y: 5 }, production: 'light' as const },
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

  it('places initial units for each player', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    expect(state.units.length).toBeGreaterThan(0);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
    const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
    expect(p0Units.length).toBeGreaterThan(0);
    expect(p1Units.length).toBeGreaterThan(0);
  });

  it('sets nextEntityId to total unit count', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    expect(state.nextEntityId).toBe(state.units.length);
  });

  it('assigns unique entity IDs to all units', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
    const ids = state.units.map((u) => u.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('places 10 units per player on a large map', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
    const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
    expect(p0Units).toHaveLength(10);
    expect(p1Units).toHaveLength(10);
  });

  it('places units only in own half of the map', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 42);
    const midX = map.width / 2;
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
    const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
    for (const u of p0Units) {
      expect(u.pos.x).toBeLessThan(midX);
    }
    for (const u of p1Units) {
      expect(u.pos.x).toBeGreaterThanOrEqual(midX);
    }
  });

  it('does not place units on mountain terrain', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 99);
    for (const u of state.units) {
      const idx = Math.floor(u.pos.y) * map.width + Math.floor(u.pos.x);
      expect(map.terrain[idx]).not.toBe(1);
    }
  });

  it('sets supplyUsed on spawn cities to match placed unit count', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
    for (const spawn of state.map.spawns) {
      const city = state.cities.find((c) => c.id === spawn.cityId)!;
      const unitCount = state.units.filter(
        (u) => u.owner === spawn.player,
      ).length;
      expect(city.supplyUsed).toBe(unitCount);
    }
  });

  it('is deterministic: same seed produces same placement', () => {
    const map = makeLargeTestMap();
    const players = makePlayers();
    const state1 = createInitialState(map, players, 123);
    const state2 = createInitialState(map, players, 123);
    expect(state1.units.length).toBe(state2.units.length);
    for (let i = 0; i < state1.units.length; i++) {
      expect(state1.units[i]!.pos.x).toBe(state2.units[i]!.pos.x);
      expect(state1.units[i]!.pos.y).toBe(state2.units[i]!.pos.y);
      expect(state1.units[i]!.owner).toBe(state2.units[i]!.owner);
    }
  });

  it('produces different placement with different seeds', () => {
    const map = makeLargeTestMap();
    const players = makePlayers();
    const state1 = createInitialState(map, players, 100);
    const state2 = createInitialState(map, players, 200);
    const positions1 = state1.units.map((u) => `${u.pos.x},${u.pos.y}`);
    const positions2 = state2.units.map((u) => `${u.pos.x},${u.pos.y}`);
    expect(positions1).not.toEqual(positions2);
  });
});
