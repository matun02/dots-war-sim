import { describe, expect, it } from 'vitest';
import type {
  CityId,
  EntityId,
  GameState,
  MapDef,
  PlayerId,
} from './types.js';
import { TERRAIN_INDEX } from './types.js';

function makeEmptyState(): GameState {
  const map: MapDef = {
    id: 'test',
    width: 4,
    height: 4,
    terrain: Array.from<number>({ length: 16 }).fill(TERRAIN_INDEX.plain),
    cities: [],
    spawns: [],
  };
  return {
    tick: 0,
    seed: 42,
    map,
    players: [],
    cities: [],
    units: [],
    nextEntityId: 0,
    result: null,
  };
}

describe('GameState types', () => {
  it('round-trips through JSON.stringify / JSON.parse', () => {
    const state = makeEmptyState();
    const json = JSON.stringify(state);
    const parsed: GameState = JSON.parse(json) as GameState;
    expect(parsed).toEqual(state);
  });

  it('round-trips with populated data', () => {
    const state = makeEmptyState();
    state.players = [
      { id: 0 as PlayerId, name: 'Alice', color: 0x3399ff, alive: true },
      { id: 1 as PlayerId, name: 'Bob', color: 0xff6633, alive: true },
    ];
    state.cities = [
      {
        id: 0 as CityId,
        pos: { x: 1, y: 1 },
        owner: 0 as PlayerId,
        production: 'light',
        produceCooldownTicks: 60,
        captureProgressTicks: 0,
        capturingPlayer: null,
        supplyUsed: 2,
      },
    ];
    state.units = [
      {
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        kind: 'light',
        homeCity: 0 as CityId,
        pos: { x: 1.5, y: 2.0 },
        hp: 1,
        path: [
          { x: 2, y: 2 },
          { x: 3, y: 3 },
        ],
        goal: { x: 3, y: 3 },
        attackCooldownTicks: 0,
      },
    ];

    const json = JSON.stringify(state);
    const parsed: GameState = JSON.parse(json) as GameState;
    expect(parsed).toEqual(state);
  });

  it('round-trips GameResult victory', () => {
    const state = makeEmptyState();
    state.result = {
      type: 'victory',
      winner: 0 as PlayerId,
      reason: 'domination',
    };
    const parsed: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    expect(parsed.result).toEqual(state.result);
  });

  it('round-trips GameResult draw', () => {
    const state = makeEmptyState();
    state.result = { type: 'draw' };
    const parsed: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    expect(parsed.result).toEqual(state.result);
  });

  it('TERRAIN_INDEX maps all terrain types to distinct numbers', () => {
    const values = Object.values(TERRAIN_INDEX);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) {
      expect(typeof v).toBe('number');
    }
  });
});
