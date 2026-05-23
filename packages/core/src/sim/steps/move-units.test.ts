import { describe, expect, it } from 'vitest';
import { moveUnits } from './move-units.js';
import { UNIT_STATS } from '../constants.js';
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
    pos: { x: 0, y: 0 },
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(units: Unit[]): GameState {
  return {
    tick: 0,
    seed: 42,
    map: {
      id: 'test',
      width: 64,
      height: 36,
      terrain: Array.from({ length: 64 * 36 }, () => 0),
      cities: [],
      spawns: [],
    },
    players: [],
    cities: [],
    units,
    nextEntityId: 0,
    result: null,
  };
}

describe('moveUnits', () => {
  it('follows path waypoints toward cell center', () => {
    const unit = makeUnit({
      pos: { x: 0.5, y: 0.5 },
      goal: { x: 3, y: 0 },
      path: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.pos.x).toBeGreaterThan(0.5);
  });

  it('advances to next waypoint when close enough', () => {
    const unit = makeUnit({
      pos: { x: 1.45, y: 0.5 },
      goal: { x: 3, y: 0 },
      path: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.path!.length).toBeLessThanOrEqual(2);
  });

  it('clears goal and path when path is completed', () => {
    const unit = makeUnit({
      pos: { x: 3.4, y: 0.5 },
      goal: { x: 3, y: 0 },
      path: [{ x: 3, y: 0 }],
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.goal).toBeNull();
    expect(unit.path).toBeNull();
  });

  it('falls back to direct movement when goal exists but path is null', () => {
    const unit = makeUnit({
      pos: { x: 0, y: 0 },
      goal: { x: 30, y: 0 },
      path: null,
    });
    const state = makeState([unit]);

    moveUnits(state);

    const expectedStep = UNIT_STATS.light.speed / 30;
    expect(unit.pos.x).toBeCloseTo(expectedStep, 6);
    expect(unit.pos.y).toBeCloseTo(0, 6);
  });

  it('does not move units with no goal', () => {
    const unit = makeUnit({ pos: { x: 5, y: 5 }, goal: null });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.pos.x).toBe(5);
    expect(unit.pos.y).toBe(5);
  });

  it('light unit travels ~4 cells in 30 ticks via fallback', () => {
    const unit = makeUnit({
      pos: { x: 0, y: 0 },
      goal: { x: 100, y: 0 },
      path: null,
    });
    const state = makeState([unit]);

    for (let i = 0; i < 30; i++) {
      moveUnits(state);
    }

    expect(unit.pos.x).toBeCloseTo(4, 1);
  });

  it('stops at goal when fallback distance < 0.05', () => {
    const unit = makeUnit({
      pos: { x: 10, y: 10 },
      goal: { x: 10.01, y: 10.01 },
      path: null,
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.goal).toBeNull();
    expect(unit.path).toBeNull();
  });
});
