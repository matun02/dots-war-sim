import { describe, it, expect } from 'vitest';
import { resolveCombat } from './resolve-combat.js';
import { Rng } from '../../rng.js';
import type {
  GameState,
  Unit,
  EntityId,
  PlayerId,
  CityId,
  MapDef,
} from '../types.js';
import { UNIT_STATS } from '../constants.js';

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

function makeUnit(overrides: Partial<Unit> & { id: EntityId; owner: PlayerId }): Unit {
  return {
    kind: 'light',
    homeCity: cid(0),
    pos: { x: 0, y: 0 },
    hp: UNIT_STATS.light.hp,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
    ...overrides,
  };
}

function makeState(units: Unit[]): GameState {
  return {
    tick: 0,
    seed: 1,
    map: dummyMap,
    players: [
      { id: pid(0), name: 'P0', color: 0xff0000, alive: true },
      { id: pid(1), name: 'P1', color: 0x0000ff, alive: true },
    ],
    cities: [{ id: cid(0), pos: { x: 0, y: 0 }, owner: pid(0), production: 'light' as const, produceCooldownTicks: 0, captureProgressTicks: 0, capturingPlayer: null, supplyUsed: 0 }],
    units,
    nextEntityId: units.length,
    result: null,
  };
}

const rng = new Rng(42);

describe('resolveCombat', () => {
  it('deals damage to enemy within attack range', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5.5, y: 5 } });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    expect(state.units.find((u) => (u.id as number) === 1)!.hp).toBe(UNIT_STATS.light.hp - UNIT_STATS.light.attack);
    expect(state.units.find((u) => (u.id as number) === 0)!.hp).toBe(UNIT_STATS.light.hp - UNIT_STATS.light.attack);
  });

  it('does not attack enemy outside attack range', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 0, y: 0 } });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5, y: 5 } });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    expect(state.units.find((u) => (u.id as number) === 0)!.hp).toBe(UNIT_STATS.light.hp);
    expect(state.units.find((u) => (u.id as number) === 1)!.hp).toBe(UNIT_STATS.light.hp);
  });

  it('sets attackCooldownTicks after attacking', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5, y: 5 }, hp: 10 });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    expect(state.units.find((u) => (u.id as number) === 0)!.attackCooldownTicks).toBe(UNIT_STATS.light.attackIntervalTicks);
  });

  it('does not attack during cooldown', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 }, attackCooldownTicks: 5, hp: 10 });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5, y: 5 }, hp: 10 });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    const unit1 = state.units.find((u) => (u.id as number) === 1)!;
    const unit0 = state.units.find((u) => (u.id as number) === 0)!;
    expect(unit1.hp).toBe(10);
    expect(unit0.hp).toBe(10 - UNIT_STATS.light.attack);
    expect(unit0.attackCooldownTicks).toBe(4);
  });

  it('attacks again after cooldown reaches 0', () => {
    // cooldown=1 → decremented to 0 on this tick → unit attacks immediately
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 }, attackCooldownTicks: 1, hp: 10 });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5, y: 5 }, hp: 10 });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);
    const unit0a = state.units.find((u) => (u.id as number) === 0)!;
    const unit1a = state.units.find((u) => (u.id as number) === 1)!;
    // u0 cooldown was 1, decremented to 0, so u0 attacks this tick
    expect(unit0a.attackCooldownTicks).toBe(UNIT_STATS.light.attackIntervalTicks);
    expect(unit1a.hp).toBe(10 - UNIT_STATS.light.attack);
    // u1 also attacks u0
    expect(unit0a.hp).toBe(10 - UNIT_STATS.light.attack);
  });

  it('does not attack units of the same owner', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 } });
    const u1 = makeUnit({ id: eid(1), owner: pid(0), pos: { x: 5, y: 5 } });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    expect(state.units.find((u) => (u.id as number) === 0)!.hp).toBe(UNIT_STATS.light.hp);
    expect(state.units.find((u) => (u.id as number) === 1)!.hp).toBe(UNIT_STATS.light.hp);
  });

  it('targets closest enemy, tie-breaks by id ascending', () => {
    const attacker = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 }, hp: 10 });
    const far = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 6, y: 5 }, hp: 10 });
    const close2 = makeUnit({ id: eid(2), owner: pid(1), pos: { x: 5.5, y: 5 }, hp: 10 });
    const close1 = makeUnit({ id: eid(3), owner: pid(1), pos: { x: 5.5, y: 5 }, hp: 10 });
    const state = makeState([attacker, far, close2, close1]);

    resolveCombat(state, rng);

    const u2 = state.units.find((u) => (u.id as number) === 2)!;
    const u3 = state.units.find((u) => (u.id as number) === 3)!;
    expect(u2.hp).toBe(10 - UNIT_STATS.light.attack);
    expect(u3.hp).toBe(10);
  });

  it('allows mutual attacks in same tick (simultaneous combat)', () => {
    const u0 = makeUnit({ id: eid(0), owner: pid(0), pos: { x: 5, y: 5 }, hp: 1 });
    const u1 = makeUnit({ id: eid(1), owner: pid(1), pos: { x: 5, y: 5 }, hp: 1 });
    const state = makeState([u0, u1]);

    resolveCombat(state, rng);

    expect(state.units.find((u) => (u.id as number) === 0)!.hp).toBe(0);
    expect(state.units.find((u) => (u.id as number) === 1)!.hp).toBe(0);
  });
});
