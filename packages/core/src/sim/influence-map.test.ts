import { describe, it, expect } from 'vitest';
import type {
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
    const state = makeState({
      units: [
        makeUnit({ owner: 0 as PlayerId, pos: { x: 4, y: 3 } }),
      ],
    });
    const data = computeInfluenceMap(state);
    const map0 = data.maps[0]!;

    const center = map0[3 * 8 + 4]!;
    const adj = map0[3 * 8 + 5]!;
    const far = map0[3 * 8 + 7]!;

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
    expect(map1[1 * 8 + 1]).toBe(0);

    expect(map1[4 * 8 + 6]).toBeGreaterThan(0);
    expect(map0[4 * 8 + 6]).toBe(0);
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
});
