import { describe, it, expect } from 'vitest';
import { removeDead } from './remove-dead.js';
import type {
  GameState,
  Unit,
  City,
  EntityId,
  PlayerId,
  CityId,
  MapDef,
} from '../types.js';

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

function makeCity(id: CityId, supplyUsed: number): City {
  return {
    id,
    pos: { x: 0, y: 0 },
    owner: pid(0),
    production: 'light',
    produceCooldownTicks: 0,
    captureProgressTicks: 0,
    capturingPlayer: null,
    supplyUsed,
  };
}

function makeUnit(id: EntityId, hp: number, homeCity: CityId): Unit {
  return {
    id,
    owner: pid(0),
    kind: 'light',
    homeCity,
    pos: { x: 0, y: 0 },
    hp,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
  };
}

function makeState(units: Unit[], cities: City[]): GameState {
  return {
    tick: 0,
    seed: 1,
    map: dummyMap,
    players: [{ id: pid(0), name: 'P0', color: 0xff0000, alive: true }],
    cities,
    units,
    nextEntityId: units.length,
    result: null,
  };
}

describe('removeDead', () => {
  it('removes units with hp <= 0', () => {
    const state = makeState(
      [makeUnit(eid(0), 0, cid(0)), makeUnit(eid(1), 1, cid(0))],
      [makeCity(cid(0), 2)],
    );

    removeDead(state);

    expect(state.units).toHaveLength(1);
    expect(state.units[0]!.id).toBe(eid(1));
  });

  it('decrements supplyUsed of homeCity for dead units', () => {
    const state = makeState(
      [makeUnit(eid(0), 0, cid(0)), makeUnit(eid(1), 0, cid(0)), makeUnit(eid(2), 5, cid(0))],
      [makeCity(cid(0), 3)],
    );

    removeDead(state);

    expect(state.cities[0]!.supplyUsed).toBe(1);
  });

  it('keeps units with hp > 0', () => {
    const state = makeState(
      [makeUnit(eid(0), 3, cid(0)), makeUnit(eid(1), 1, cid(0))],
      [makeCity(cid(0), 2)],
    );

    removeDead(state);

    expect(state.units).toHaveLength(2);
  });

  it('removes all dead units when multiple die simultaneously', () => {
    const state = makeState(
      [
        makeUnit(eid(0), 0, cid(0)),
        makeUnit(eid(1), -2, cid(0)),
        makeUnit(eid(2), 0, cid(1)),
        makeUnit(eid(3), 5, cid(1)),
      ],
      [makeCity(cid(0), 2), makeCity(cid(1), 2)],
    );

    removeDead(state);

    expect(state.units).toHaveLength(1);
    expect(state.units[0]!.id).toBe(eid(3));
    expect(state.cities[0]!.supplyUsed).toBe(0);
    expect(state.cities[1]!.supplyUsed).toBe(1);
  });

  it('releases supplyCost=2 when a heavy unit dies', () => {
    const heavy = makeUnit(eid(0), 0, cid(0));
    heavy.kind = 'heavy';
    const state = makeState([heavy], [makeCity(cid(0), 4)]);

    removeDead(state);

    expect(state.cities[0]!.supplyUsed).toBe(2);
  });

  it('releases supplyCost=1 when a light unit dies', () => {
    const light = makeUnit(eid(0), 0, cid(0));
    light.kind = 'light';
    const state = makeState([light], [makeCity(cid(0), 3)]);

    removeDead(state);

    expect(state.cities[0]!.supplyUsed).toBe(2);
  });
});
