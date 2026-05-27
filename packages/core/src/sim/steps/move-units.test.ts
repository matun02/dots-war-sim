import { describe, expect, it } from 'vitest';
import { moveUnits } from './move-units.js';
import { UNIT_STATS, ATTACK_RANGE, ENGAGE_DISTANCE, ENGAGE_SPEED_FACTOR } from '../constants.js';
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

  describe('engage stop', () => {
    it('stops when enemy is within ATTACK_RANGE', () => {
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: null,
      });
      const enemy = makeUnit({
        id: 1 as EntityId,
        owner: 1 as PlayerId,
        pos: { x: 5 + ATTACK_RANGE * 0.9, y: 5 },
        goal: null,
      });
      const state = makeState([mover, enemy]);

      moveUnits(state);

      expect(mover.pos.x).toBe(5);
      expect(mover.pos.y).toBe(5);
    });

    it('slows when enemy is within ENGAGE_DISTANCE but outside ATTACK_RANGE', () => {
      const dist = (ATTACK_RANGE + ENGAGE_DISTANCE) / 2;
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: null,
      });
      const enemy = makeUnit({
        id: 1 as EntityId,
        owner: 1 as PlayerId,
        pos: { x: 5 + dist, y: 5 },
        goal: null,
      });
      const state = makeState([mover, enemy]);

      moveUnits(state);

      const fullStep = UNIT_STATS.light.speed / 30;
      const slowStep = fullStep * ENGAGE_SPEED_FACTOR;
      const moved = mover.pos.x - 5;
      expect(moved).toBeCloseTo(slowStep, 5);
    });

    it('moves at full speed when no enemies nearby', () => {
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: null,
      });
      const enemy = makeUnit({
        id: 1 as EntityId,
        owner: 1 as PlayerId,
        pos: { x: 30, y: 5 },
        goal: null,
      });
      const state = makeState([mover, enemy]);

      moveUnits(state);

      const fullStep = UNIT_STATS.light.speed / 30;
      const moved = mover.pos.x - 5;
      expect(moved).toBeCloseTo(fullStep, 5);
    });

    it('does not slow for allied units within ENGAGE_DISTANCE', () => {
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: null,
      });
      const ally = makeUnit({
        id: 1 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 6, y: 5 },
        goal: null,
      });
      const state = makeState([mover, ally]);

      moveUnits(state);

      const fullStep = UNIT_STATS.light.speed / 30;
      const moved = mover.pos.x - 5;
      expect(moved).toBeCloseTo(fullStep, 5);
    });

    it('keeps goal and path when stopped by enemy proximity', () => {
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: [{ x: 10, y: 5 }, { x: 20, y: 5 }, { x: 30, y: 5 }],
      });
      const enemy = makeUnit({
        id: 1 as EntityId,
        owner: 1 as PlayerId,
        pos: { x: 5.5, y: 5 },
        goal: null,
      });
      const state = makeState([mover, enemy]);

      moveUnits(state);

      expect(mover.goal).not.toBeNull();
      expect(mover.path).not.toBeNull();
      expect(mover.path!.length).toBe(3);
    });

    it('resumes movement when enemy is removed', () => {
      const mover = makeUnit({
        id: 0 as EntityId,
        owner: 0 as PlayerId,
        pos: { x: 5, y: 5 },
        goal: { x: 30, y: 5 },
        path: null,
      });
      const enemy = makeUnit({
        id: 1 as EntityId,
        owner: 1 as PlayerId,
        pos: { x: 6, y: 5 },
        goal: null,
      });
      const state = makeState([mover, enemy]);

      moveUnits(state);
      expect(mover.pos.x).toBe(5);

      state.units = [mover];
      moveUnits(state);
      expect(mover.pos.x).toBeGreaterThan(5);
    });

    it('two opposing groups form distinct lines instead of mixing', () => {
      const p0Units: Unit[] = [];
      const p1Units: Unit[] = [];
      for (let i = 0; i < 5; i++) {
        p0Units.push(
          makeUnit({
            id: i as EntityId,
            owner: 0 as PlayerId,
            pos: { x: 10, y: 10 + i * 1.5 },
            goal: { x: 50, y: 15 },
            path: null,
          }),
        );
        p1Units.push(
          makeUnit({
            id: (i + 5) as EntityId,
            owner: 1 as PlayerId,
            pos: { x: 40, y: 10 + i * 1.5 },
            goal: { x: 5, y: 15 },
            path: null,
          }),
        );
      }
      const state = makeState([...p0Units, ...p1Units]);

      for (let t = 0; t < 300; t++) {
        moveUnits(state);
      }

      const p0Xs = p0Units.map((u) => u.pos.x);
      const p1Xs = p1Units.map((u) => u.pos.x);
      const p0MaxX = Math.max(...p0Xs);
      const p1MinX = Math.min(...p1Xs);

      expect(p0MaxX).toBeLessThan(p1MinX);
    });
  });
});
