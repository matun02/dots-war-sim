import { describe, it, expect } from 'vitest';
import { evaluateGameEnd } from './evaluate-game-end.js';
import type {
  GameState,
  Unit,
  City,
  EntityId,
  PlayerId,
  CityId,
  MapDef,
} from '../types.js';
import { GAME_TIME_LIMIT_TICKS } from '../constants.js';

function eid(n: number): EntityId {
  return n as EntityId;
}
function pid(n: number): PlayerId {
  return n as PlayerId;
}
function cid(n: number): CityId {
  return n as CityId;
}

const dummyMap: MapDef = {
  id: 'test',
  width: 10,
  height: 10,
  terrain: Array.from({ length: 100 }, () => 0),
  cities: [],
  spawns: [],
};

function makeCity(
  overrides: Partial<City> & { id: CityId; owner: PlayerId },
): City {
  return {
    pos: { x: 0, y: 0 },
    production: 'light',
    produceCooldownTicks: 0,
    captureProgressTicks: 0,
    capturingPlayer: null,
    supplyUsed: 0,
    ...overrides,
  };
}

function makeUnit(
  overrides: Partial<Unit> & { id: EntityId; owner: PlayerId },
): Unit {
  return {
    kind: 'light',
    homeCity: cid(0),
    pos: { x: 0, y: 0 },
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(
  overrides: Partial<GameState> & { cities: City[]; units: Unit[] },
): GameState {
  return {
    tick: 0,
    seed: 1,
    map: dummyMap,
    players: [
      { id: pid(0), name: 'P0', color: 0x4488ff, alive: true },
      { id: pid(1), name: 'P1', color: 0xff8844, alive: true },
    ],
    nextEntityId: 0,
    result: null,
    ...overrides,
  };
}

describe('evaluateGameEnd', () => {
  it('marks player as dead when they have no cities and no units', () => {
    const state = makeState({
      cities: [makeCity({ id: cid(0), owner: pid(0) })],
      units: [makeUnit({ id: eid(0), owner: pid(0) })],
    });

    evaluateGameEnd(state);

    expect(state.players[0]!.alive).toBe(true);
    expect(state.players[1]!.alive).toBe(false);
  });

  it('keeps player alive if they have units but fewer cities', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.players[1]!.alive).toBe(true);
    expect(state.result).toBeNull();
  });

  it('triggers domination victory when one player owns all cities', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(0) }),
        makeCity({ id: cid(2), owner: pid(0) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toEqual({
      type: 'victory',
      winner: pid(0),
      reason: 'domination',
    });
  });

  it('triggers domination when last opponent loses all cities and units', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(0) }),
      ],
      units: [makeUnit({ id: eid(0), owner: pid(0) })],
    });

    evaluateGameEnd(state);

    expect(state.players[1]!.alive).toBe(false);
    expect(state.result).toEqual({
      type: 'victory',
      winner: pid(0),
      reason: 'domination',
    });
  });

  it('triggers timeout victory for player with more cities', () => {
    const state = makeState({
      tick: GAME_TIME_LIMIT_TICKS,
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(0) }),
        makeCity({ id: cid(2), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toEqual({
      type: 'victory',
      winner: pid(0),
      reason: 'timeout',
    });
  });

  it('triggers draw on timeout when city count is equal', () => {
    const state = makeState({
      tick: GAME_TIME_LIMIT_TICKS,
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toEqual({ type: 'draw' });
  });

  it('does not overwrite an existing result', () => {
    const existingResult = {
      type: 'victory' as const,
      winner: pid(0),
      reason: 'domination' as const,
    };
    const state = makeState({
      cities: [makeCity({ id: cid(0), owner: pid(1) })],
      units: [],
      result: existingResult,
    });

    evaluateGameEnd(state);

    expect(state.result).toBe(existingResult);
  });

  it('triggers domination victory at 80% city control (4 of 5)', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(0) }),
        makeCity({ id: cid(2), owner: pid(0) }),
        makeCity({ id: cid(3), owner: pid(0) }),
        makeCity({ id: cid(4), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toEqual({
      type: 'victory',
      winner: pid(0),
      reason: 'domination',
    });
  });

  it('does not trigger domination below 80% (3 of 5 = 60%)', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(0) }),
        makeCity({ id: cid(2), owner: pid(0) }),
        makeCity({ id: cid(3), owner: pid(1) }),
        makeCity({ id: cid(4), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toBeNull();
  });

  it('triggers domination at exactly 80% boundary (8 of 10)', () => {
    const state = makeState({
      cities: [
        ...Array.from({ length: 8 }, (_, i) =>
          makeCity({ id: cid(i), owner: pid(0) }),
        ),
        makeCity({ id: cid(8), owner: pid(1) }),
        makeCity({ id: cid(9), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toEqual({
      type: 'victory',
      winner: pid(0),
      reason: 'domination',
    });
  });

  it('does not trigger domination just below boundary (7 of 10 = 70%)', () => {
    const state = makeState({
      cities: [
        ...Array.from({ length: 7 }, (_, i) =>
          makeCity({ id: cid(i), owner: pid(0) }),
        ),
        makeCity({ id: cid(7), owner: pid(1) }),
        makeCity({ id: cid(8), owner: pid(1) }),
        makeCity({ id: cid(9), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toBeNull();
  });

  it('returns null result when game is still in progress', () => {
    const state = makeState({
      cities: [
        makeCity({ id: cid(0), owner: pid(0) }),
        makeCity({ id: cid(1), owner: pid(1) }),
      ],
      units: [
        makeUnit({ id: eid(0), owner: pid(0) }),
        makeUnit({ id: eid(1), owner: pid(1) }),
      ],
    });

    evaluateGameEnd(state);

    expect(state.result).toBeNull();
    expect(state.players[0]!.alive).toBe(true);
    expect(state.players[1]!.alive).toBe(true);
  });
});
