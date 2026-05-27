import { describe, expect, it } from 'vitest';
import { createInitialState } from './init.js';
import { UNIT_STATS } from './constants.js';
import type { CityId, MapDef, Player, PlayerId, Vec2 } from './types.js';

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

function makeExplicitPositionMap(): MapDef {
  const width = 64;
  const height = 36;
  const terrain = Array.from({ length: width * height }, () => 0);
  for (let y = 16; y <= 19; y++) {
    for (let x = 19; x <= 29; x++) terrain[y * width + x] = 1;
    for (let x = 33; x <= 42; x++) terrain[y * width + x] = 1;
  }
  const p0Positions: Vec2[] = [];
  const p1Positions: Vec2[] = [];
  for (let i = 0; i < 10; i++) {
    p0Positions.push({ x: 18 - i * 0.5, y: 10 + i * 1.5 });
    p1Positions.push({ x: 45 + i * 0.5, y: 12.5 + i * 1.5 });
  }
  return {
    id: 'test-explicit',
    width,
    height,
    terrain,
    cities: [
      { id: 0 as CityId, pos: { x: 10, y: 8 }, production: 'light' as const },
      { id: 1 as CityId, pos: { x: 54, y: 28 }, production: 'light' as const },
    ],
    spawns: [
      { player: 0 as PlayerId, cityId: 0 as CityId, unitPositions: p0Positions },
      { player: 1 as PlayerId, cityId: 1 as CityId, unitPositions: p1Positions },
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

  it('does not place units on mountain terrain', () => {
    const map = makeExplicitPositionMap();
    const state = createInitialState(map, makePlayers(), 99);
    for (const u of state.units) {
      const idx = Math.floor(u.pos.y) * map.width + Math.floor(u.pos.x);
      expect(map.terrain[idx]).not.toBe(1);
    }
  });

  it('sets supplyUsed on spawn cities to match placed unit count', () => {
    const state = createInitialState(makeExplicitPositionMap(), makePlayers(), 42);
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

  it('sets produceCooldownTicks > 0 for non-spawn cities', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    const nonSpawnCity = state.cities.find((c) => c.id === (2 as CityId))!;
    expect(nonSpawnCity.produceCooldownTicks).toBe(
      UNIT_STATS[nonSpawnCity.production].produceIntervalTicks,
    );
  });

  it('sets produceCooldownTicks = 0 for spawn cities', () => {
    const state = createInitialState(makeTestMap(), makePlayers(), 42);
    const spawnCity0 = state.cities.find((c) => c.id === (0 as CityId))!;
    const spawnCity1 = state.cities.find((c) => c.id === (1 as CityId))!;
    expect(spawnCity0.produceCooldownTicks).toBe(0);
    expect(spawnCity1.produceCooldownTicks).toBe(0);
  });

  describe('explicit unitPositions', () => {
    it('places units at exact positions from map data', () => {
      const map = makeExplicitPositionMap();
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      expect(p0Units).toHaveLength(10);
      for (let i = 0; i < p0Units.length; i++) {
        expect(p0Units[i]!.pos.x).toBe(map.spawns[0]!.unitPositions![i]!.x);
        expect(p0Units[i]!.pos.y).toBe(map.spawns[0]!.unitPositions![i]!.y);
      }
    });

    it('places 10 units per player', () => {
      const map = makeExplicitPositionMap();
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
      expect(p0Units).toHaveLength(10);
      expect(p1Units).toHaveLength(10);
    });

    it('P0 is left of P1', () => {
      const map = makeExplicitPositionMap();
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
      const p0AvgX = p0Units.reduce((s, u) => s + u.pos.x, 0) / p0Units.length;
      const p1AvgX = p1Units.reduce((s, u) => s + u.pos.x, 0) / p1Units.length;
      expect(p0AvgX).toBeLessThan(p1AvgX);
    });

    it('skips positions on impassable terrain', () => {
      const map = makeExplicitPositionMap();
      // Put one position on a mountain
      map.spawns[0]!.unitPositions = [
        { x: 25, y: 17 }, // mountain
        { x: 15, y: 10 }, // valid
      ];
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      expect(p0Units).toHaveLength(1);
      expect(p0Units[0]!.pos.x).toBe(15);
    });
  });

  describe('RNG fallback (no unitPositions)', () => {
    it('places units near spawn city', () => {
      const map = makeLargeTestMap();
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      const avgX = p0Units.reduce((s, u) => s + u.pos.x, 0) / p0Units.length;
      const avgY = p0Units.reduce((s, u) => s + u.pos.y, 0) / p0Units.length;
      // Should be near spawn (10, 8), within radius 5
      expect(avgX).toBeGreaterThan(5);
      expect(avgX).toBeLessThan(15);
      expect(avgY).toBeGreaterThan(3);
      expect(avgY).toBeLessThan(13);
    });

    it('places both players separately', () => {
      const map = makeLargeTestMap();
      const state = createInitialState(map, makePlayers(), 42);
      const p0Units = state.units.filter((u) => u.owner === (0 as PlayerId));
      const p1Units = state.units.filter((u) => u.owner === (1 as PlayerId));
      const p0AvgX = p0Units.reduce((s, u) => s + u.pos.x, 0) / p0Units.length;
      const p1AvgX = p1Units.reduce((s, u) => s + u.pos.x, 0) / p1Units.length;
      expect(p0AvgX).toBeLessThan(p1AvgX);
    });
  });
});
