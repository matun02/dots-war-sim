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
      { id: 2 as CityId, pos: { x: 2, y: 2 }, production: 'heavy' as const, owner: 0 as PlayerId },
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
      { id: 2 as CityId, pos: { x: 32, y: 5 }, production: 'light' as const, owner: 0 as PlayerId },
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

  it('assigns owner from map data for non-spawn cities', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    const city2 = state.cities.find((c) => c.id === (2 as CityId))!;
    expect(city2.owner).toBe(0);
  });

  it('assigns all cities an owner (no null)', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
    for (const city of state.cities) {
      expect(city.owner).not.toBeNull();
      expect(typeof city.owner).toBe('number');
    }
  });

  it('places initial units for each player', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
    expect(state.units.length).toBeGreaterThan(0);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
    const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
    expect(p0Units.length).toBeGreaterThan(0);
    expect(p1Units.length).toBeGreaterThan(0);
  });

  it('sets nextEntityId to total unit count', () => {
    const state = createInitialState(makeLargeTestMap(), makePlayers(), 42);
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

  it('uses ratio-based formation offset (40% of spawn-to-enemy distance)', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 42);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));

    // spawn(10,8) → enemy(54,28): dist ≈ 47.2, offset ≈ 18.9
    // center ≈ (10 + 0.93*18.9, 8 + 0.42*18.9) ≈ (27.6, 16.0)
    const avgX = p0Units.reduce((s, u) => s + u.pos.x, 0) / p0Units.length;
    const avgY = p0Units.reduce((s, u) => s + u.pos.y, 0) / p0Units.length;

    // Formation center should be ~40% of the way from spawn to enemy
    // Spawn at x=10, enemy at x=54 → 40% offset ≈ x=27.6
    expect(avgX).toBeGreaterThan(20);
    expect(avgX).toBeLessThan(35);
    expect(avgY).toBeGreaterThan(10);
    expect(avgY).toBeLessThan(22);
  });

  it('places units in a formation (approximately linear)', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 42);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));

    const ys = p0Units.map((u) => u.pos.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) {
      const gap = ys[i]! - ys[i - 1]!;
      expect(gap).toBeCloseTo(1.5, 0);
    }
  });

  it('places units in front of spawn city (toward enemy)', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 42);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));

    const avgX =
      p0Units.reduce((sum, u) => sum + u.pos.x, 0) / p0Units.length;
    expect(avgX).toBeGreaterThan(10);
  });

  it('places both players symmetrically (each toward center)', () => {
    const map = makeLargeTestMap();
    const state = createInitialState(map, makePlayers(), 42);
    const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
    const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));

    const p0AvgX =
      p0Units.reduce((sum, u) => sum + u.pos.x, 0) / p0Units.length;
    const p1AvgX =
      p1Units.reduce((sum, u) => sum + u.pos.x, 0) / p1Units.length;

    expect(p0AvgX).toBeLessThan(p1AvgX);
    expect(p0AvgX).toBeGreaterThan(10);
    expect(p1AvgX).toBeLessThan(54);
  });
});
