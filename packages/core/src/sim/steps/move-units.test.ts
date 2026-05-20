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
  it('moves toward goal by speed/30 cells per tick', () => {
    const unit = makeUnit({
      pos: { x: 0, y: 0 },
      goal: { x: 30, y: 0 },
    });
    const state = makeState([unit]);

    moveUnits(state);

    const expectedStep = UNIT_STATS.light.speed / 30;
    expect(unit.pos.x).toBeCloseTo(expectedStep, 6);
    expect(unit.pos.y).toBeCloseTo(0, 6);
  });

  it('sets goal to null when distance < 0.05', () => {
    const unit = makeUnit({
      pos: { x: 10, y: 10 },
      goal: { x: 10.01, y: 10.01 },
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.goal).toBeNull();
    expect(unit.path).toBeNull();
  });

  it('does not move units with no goal', () => {
    const unit = makeUnit({ pos: { x: 5, y: 5 }, goal: null });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.pos.x).toBe(5);
    expect(unit.pos.y).toBe(5);
  });

  it('does not overshoot when remaining distance < step size', () => {
    const step = UNIT_STATS.light.speed / 30;
    const unit = makeUnit({
      pos: { x: 0, y: 0 },
      goal: { x: step * 0.5, y: 0 },
    });
    const state = makeState([unit]);

    moveUnits(state);

    expect(unit.pos.x).toBeCloseTo(step * 0.5, 6);
    expect(unit.pos.y).toBeCloseTo(0, 6);
  });

  it('light unit travels ~4 cells in 30 ticks (1 second)', () => {
    const unit = makeUnit({
      pos: { x: 0, y: 0 },
      goal: { x: 100, y: 0 },
    });
    const state = makeState([unit]);

    for (let i = 0; i < 30; i++) {
      moveUnits(state);
    }

    expect(unit.pos.x).toBeCloseTo(4, 1);
  });
});
