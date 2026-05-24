import { describe, it, expect } from 'vitest';
import type {
  City,
  GameState,
  PlayerId,
  EntityId,
  CityId,
  MapDef,
  Unit,
  Player,
} from './types.js';
import { computeInfluenceMap, computeInfluenceDiff } from './influence-map.js';

const TEST_MAP: MapDef = {
  id: 'test',
  width: 8,
  height: 6,
  terrain: new Array(48).fill(0),
  cities: [],
  spawns: [],
};

function makePlayer(id: number): Player {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    color: 0xff0000,
    alive: true,
  };
}

function makeUnit(
  overrides: Partial<Unit> & { owner: PlayerId; pos: Unit['pos'] },
): Unit {
  return {
    id: 1 as EntityId,
    kind: 'light',
    homeCity: 0 as CityId,
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 0,
    seed: 42,
    map: TEST_MAP,
    players: [makePlayer(0), makePlayer(1)],
    cities: [],
    units: [],
    nextEntityId: 0,
    result: null,
    ...overrides,
  };
}

describe('computeInfluenceMap', () => {
  it('returns all zeros when no units exist', () => {
    const state = makeState();
    const data = computeInfluenceMap(state);

    expect(data.width).toBe(8);
    expect(data.height).toBe(6);
    expect(data.maps).toHaveLength(2);
    for (const map of data.maps) {
      for (let i = 0; i < map.length; i++) {
        expect(map[i]).toBe(0);
      }
    }
  });

  it('places light weight (100) at unit position and diffuses to neighbors', () => {
    const state = makeState({
      units: [
        makeUnit({ owner: 0 as PlayerId, pos: { x: 4, y: 3 } }),
      ],
    });
    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;
    const centerIdx = 3 * 8 + 4;
    const adjIdx = 3 * 8 + 5;

    expect(map0[centerIdx]).toBeGreaterThan(0);
    expect(map0[adjIdx]).toBeGreaterThan(0);
  });

  it('places heavy weight (200) which is larger than light', () => {
    const lightState = makeState({
      units: [
        makeUnit({
          owner: 0 as PlayerId,
          pos: { x: 4, y: 3 },
          kind: 'light',
        }),
      ],
    });
    const heavyState = makeState({
      units: [
        makeUnit({
          owner: 0 as PlayerId,
          pos: { x: 4, y: 3 },
          kind: 'heavy',
        }),
      ],
    });

    const lightData = computeInfluenceMap(lightState);
    const heavyData = computeInfluenceMap(heavyState);
    const centerIdx = 3 * 8 + 4;

    expect(heavyData.maps[0]![centerIdx]).toBeGreaterThan(
      lightData.maps[0]![centerIdx]!,
    );
  });

  it('diffuses values to neighbors with decay over distance', () => {
    const bigMap: MapDef = {
      id: 'test-decay',
      width: 32,
      height: 24,
      terrain: new Array(32 * 24).fill(0),
      cities: [],
      spawns: [],
    };
    const state = makeState({
      map: bigMap,
      units: [
        makeUnit({ owner: 0 as PlayerId, pos: { x: 16, y: 12 } }),
      ],
    });
    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;

    const center = map0[12 * 32 + 16]!;
    const adj = map0[12 * 32 + 17]!;
    const far = map0[12 * 32 + 28]!;

    expect(center).toBeGreaterThan(adj);
    expect(adj).toBeGreaterThan(far);
  });

  it('keeps player maps independent', () => {
    const state = makeState({
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 1, y: 1 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 1 as PlayerId,
          pos: { x: 6, y: 4 },
        }),
      ],
    });
    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;
    const map1 = data.maps[1]!;

    expect(map0[1 * 8 + 1]).toBeGreaterThan(0);
    expect(map0[1 * 8 + 1]).toBeGreaterThan(map1[1 * 8 + 1]!);

    expect(map1[4 * 8 + 6]).toBeGreaterThan(0);
    expect(map1[4 * 8 + 6]).toBeGreaterThan(map0[4 * 8 + 6]!);
  });

  it('is deterministic: same input produces same output', () => {
    const state = makeState({
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 3, y: 2 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 1 as PlayerId,
          pos: { x: 5, y: 4 },
          kind: 'heavy',
        }),
      ],
    });
    const data1 = computeInfluenceMap(state);
    const data2 = computeInfluenceMap(state);

    for (let p = 0; p < data1.maps.length; p++) {
      const m1 = data1.maps[p]!;
      const m2 = data2.maps[p]!;
      for (let i = 0; i < m1.length; i++) {
        expect(m1[i]).toBe(m2[i]);
      }
    }
  });

  it('handles units at map boundaries without out of bounds', () => {
    const state = makeState({
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 0, y: 0 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 7, y: 5 },
        }),
      ],
    });

    expect(() => computeInfluenceMap(state)).not.toThrow();

    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;
    expect(map0[0]).toBeGreaterThan(0);
    expect(map0[5 * 8 + 7]).toBeGreaterThan(0);
  });

  it('produces only integer values', () => {
    const state = makeState({
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 3, y: 2 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 1 as PlayerId,
          pos: { x: 5, y: 4 },
          kind: 'heavy',
        }),
      ],
    });
    const data = computeInfluenceMap(state);

    for (const map of data.maps) {
      for (let i = 0; i < map.length; i++) {
        expect(Number.isInteger(map[i])).toBe(true);
      }
    }
  });

  it('spreads influence to distant cells with 10 iterations', () => {
    const bigMap: MapDef = {
      id: 'test-big',
      width: 24,
      height: 16,
      terrain: new Array(24 * 16).fill(0),
      cities: [],
      spawns: [],
    };
    const state = makeState({
      map: bigMap,
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 12, y: 8 },
        }),
      ],
    });
    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;
    const dist5Idx = 8 * 24 + 7; // 5 cells away from center (12-5=7)
    expect(map0[dist5Idx]).toBeGreaterThan(0);
  });

  it('adds city weight to owner influence', () => {
    const city: City = {
      id: 0 as CityId,
      pos: { x: 4, y: 3 },
      owner: 0 as PlayerId,
      production: 'light',
      produceCooldownTicks: 0,
      captureProgressTicks: 0,
      capturingPlayer: null,
      supplyUsed: 0,
    };
    const stateWithCity = makeState({ cities: [city] });
    const stateWithout = makeState({ cities: [] });
    const dataWith = computeInfluenceMap(stateWithCity);
    const dataWithout = computeInfluenceMap(stateWithout);
    const centerIdx = 3 * 8 + 4;
    expect(dataWith.maps[0]![centerIdx]).toBeGreaterThan(
      dataWithout.maps[0]![centerIdx]!,
    );
  });

  it('does not add city weight for neutral cities', () => {
    const neutralCity: City = {
      id: 0 as CityId,
      pos: { x: 4, y: 3 },
      owner: null,
      production: 'light',
      produceCooldownTicks: 0,
      captureProgressTicks: 0,
      capturingPlayer: null,
      supplyUsed: 0,
    };
    const state = makeState({ cities: [neutralCity] });
    const data = computeInfluenceMap(state);
    const centerIdx = 3 * 8 + 4;
    expect(data.maps[0]![centerIdx]).toBe(0);
    expect(data.maps[1]![centerIdx]).toBe(0);
  });
});

describe('computeInfluenceDiff', () => {
  it('computes correct diff: positive = playerA dominant, negative = playerB', () => {
    const state = makeState({
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 1, y: 1 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 1 as PlayerId,
          pos: { x: 6, y: 4 },
        }),
      ],
    });
    const data = computeInfluenceMap(state);
    const diff = computeInfluenceDiff(data, 0 as PlayerId, 1 as PlayerId);

    expect(diff[1 * 8 + 1]).toBeGreaterThan(0);
    expect(diff[4 * 8 + 6]).toBeLessThan(0);

    const map0 = data.maps[0]!;
    const map1 = data.maps[1]!;
    for (let i = 0; i < diff.length; i++) {
      expect(diff[i]).toBe(map0[i]! - map1[i]!);
    }
  });

  it('produces zero contour near midpoint for symmetric opposing units on large map', () => {
    const bigMap: MapDef = {
      id: 'test-sym',
      width: 24,
      height: 12,
      terrain: new Array(24 * 12).fill(0),
      cities: [],
      spawns: [],
    };
    const state = makeState({
      map: bigMap,
      units: [
        makeUnit({
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          pos: { x: 4, y: 6 },
        }),
        makeUnit({
          id: 2 as EntityId,
          owner: 1 as PlayerId,
          pos: { x: 20, y: 6 },
        }),
      ],
    });
    const data = computeInfluenceMap(state);
    const diff = computeInfluenceDiff(data, 0 as PlayerId, 1 as PlayerId);
    const midIdx = 6 * 24 + 12;
    expect(Math.abs(diff[midIdx]!)).toBeLessThanOrEqual(1);
  });
});
