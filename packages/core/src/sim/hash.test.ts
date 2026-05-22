import { describe, it, expect } from 'vitest';
import type {
  GameState,
  PlayerId,
  EntityId,
  CityId,
  MapDef,
} from './types.js';
import { hashState } from './hash.js';

const EMPTY_MAP: MapDef = {
  id: 'test',
  width: 10,
  height: 10,
  terrain: new Array(100).fill(0),
  cities: [],
  spawns: [],
};

function makeState(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    tick: 0,
    seed: 42,
    map: EMPTY_MAP,
    players: [],
    cities: [],
    units: [],
    nextEntityId: 0,
    result: null,
    ...overrides,
  };
}

describe('hashState', () => {
  it('returns the same hash for the same state', () => {
    const s = makeState({
      tick: 10,
      units: [
        {
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          kind: 'light',
          homeCity: 0 as CityId,
          pos: { x: 3.14, y: 2.71 },
          hp: 1,
          path: null,
          goal: null,
          attackCooldownTicks: 0,
        },
      ],
      cities: [
        {
          id: 0 as CityId,
          pos: { x: 5, y: 5 },
          owner: 0 as PlayerId,
          production: 'light',
          produceCooldownTicks: 0,
          captureProgressTicks: 0,
          capturingPlayer: null,
          supplyUsed: 1,
        },
      ],
    });
    expect(hashState(s)).toBe(hashState(s));
  });

  it('returns different hash when unit position differs', () => {
    const base = {
      tick: 10,
      cities: [] as GameState['cities'],
    };
    const s1 = makeState({
      ...base,
      units: [
        {
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          kind: 'light',
          homeCity: 0 as CityId,
          pos: { x: 1, y: 1 },
          hp: 1,
          path: null,
          goal: null,
          attackCooldownTicks: 0,
        },
      ],
    });
    const s2 = makeState({
      ...base,
      units: [
        {
          id: 1 as EntityId,
          owner: 0 as PlayerId,
          kind: 'light',
          homeCity: 0 as CityId,
          pos: { x: 5, y: 5 },
          hp: 1,
          path: null,
          goal: null,
          attackCooldownTicks: 0,
        },
      ],
    });
    expect(hashState(s1)).not.toBe(hashState(s2));
  });

  it('is order-independent for units (sorted by id)', () => {
    const unitA = {
      id: 1 as EntityId,
      owner: 0 as PlayerId,
      kind: 'light' as const,
      homeCity: 0 as CityId,
      pos: { x: 1, y: 2 },
      hp: 1,
      path: null,
      goal: null,
      attackCooldownTicks: 0,
    };
    const unitB = {
      id: 2 as EntityId,
      owner: 1 as PlayerId,
      kind: 'light' as const,
      homeCity: 0 as CityId,
      pos: { x: 3, y: 4 },
      hp: 1,
      path: null,
      goal: null,
      attackCooldownTicks: 0,
    };
    const s1 = makeState({ units: [unitA, unitB] });
    const s2 = makeState({ units: [unitB, unitA] });
    expect(hashState(s1)).toBe(hashState(s2));
  });

  it('does not crash with empty units and cities', () => {
    const s = makeState();
    expect(typeof hashState(s)).toBe('number');
  });
});
