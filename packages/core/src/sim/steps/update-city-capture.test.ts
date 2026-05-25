import { describe, it, expect } from 'vitest';
import { updateCityCapture } from './update-city-capture.js';
import type {
  GameState,
  Unit,
  City,
  EntityId,
  PlayerId,
  CityId,
  MapDef,
} from '../types.js';
import {
  CAPTURE_TICKS,
  POST_CAPTURE_COOLDOWN_TICKS,
} from '../constants.js';

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

function makeCity(overrides: Partial<City> & { id: CityId }): City {
  return {
    pos: { x: 5, y: 5 },
    owner: pid(0),
    production: 'light',
    produceCooldownTicks: 0,
    captureProgressTicks: 0,
    capturingPlayer: null,
    supplyUsed: 0,
    ...overrides,
  };
}

function makeUnit(id: EntityId, owner: PlayerId, pos: { x: number; y: number }): Unit {
  return {
    id,
    owner,
    kind: 'light',
    homeCity: cid(0),
    pos,
    hp: 1,
    path: null,
    goal: null,
    attackCooldownTicks: 0,
  };
}

function makeState(cities: City[], units: Unit[]): GameState {
  return {
    tick: 0,
    seed: 1,
    map: dummyMap,
    players: [
      { id: pid(0), name: 'P0', color: 0xff0000, alive: true },
      { id: pid(1), name: 'P1', color: 0x0000ff, alive: true },
    ],
    cities,
    units,
    nextEntityId: units.length,
    result: null,
  };
}

describe('updateCityCapture', () => {
  it('captures enemy city after CAPTURE_TICKS (direct flip)', () => {
    const city = makeCity({ id: cid(0), owner: pid(0) });
    const unit = makeUnit(eid(0), pid(1), { x: 5, y: 5 });
    const state = makeState([city], [unit]);

    for (let i = 0; i < CAPTURE_TICKS; i++) {
      updateCityCapture(state);
    }

    expect(state.cities[0]!.owner).toBe(pid(1));
  });

  it('keeps original owner during capture progress (no intermediate state)', () => {
    const city = makeCity({ id: cid(0), owner: pid(0) });
    const unit = makeUnit(eid(0), pid(1), { x: 5, y: 5 });
    const state = makeState([city], [unit]);

    for (let i = 0; i < CAPTURE_TICKS - 1; i++) {
      updateCityCapture(state);
      expect(state.cities[0]!.owner).toBe(pid(0));
    }
  });

  it('sets produceCooldownTicks after capture', () => {
    const city = makeCity({ id: cid(0), owner: pid(0) });
    const unit = makeUnit(eid(0), pid(1), { x: 5, y: 5 });
    const state = makeState([city], [unit]);

    for (let i = 0; i < CAPTURE_TICKS; i++) {
      updateCityCapture(state);
    }

    expect(state.cities[0]!.produceCooldownTicks).toBe(POST_CAPTURE_COOLDOWN_TICKS);
  });

  it('resets progress when multiple factions are present', () => {
    const city = makeCity({ id: cid(0), owner: pid(0), captureProgressTicks: 30, capturingPlayer: pid(1) });
    const u0 = makeUnit(eid(0), pid(1), { x: 5, y: 5 });
    const u1 = makeUnit(eid(1), pid(0), { x: 5, y: 5 });
    const state = makeState([city], [u0, u1]);

    updateCityCapture(state);

    expect(state.cities[0]!.captureProgressTicks).toBe(0);
    expect(state.cities[0]!.capturingPlayer).toBeNull();
  });

  it('resets progress when units leave city', () => {
    const city = makeCity({ id: cid(0), owner: pid(0), captureProgressTicks: 30, capturingPlayer: pid(1) });
    const state = makeState([city], []);

    updateCityCapture(state);

    expect(state.cities[0]!.captureProgressTicks).toBe(0);
    expect(state.cities[0]!.capturingPlayer).toBeNull();
  });

  it('does not progress capture when only owner units are present', () => {
    const city = makeCity({ id: cid(0), owner: pid(0) });
    const unit = makeUnit(eid(0), pid(0), { x: 5, y: 5 });
    const state = makeState([city], [unit]);

    for (let i = 0; i < 100; i++) {
      updateCityCapture(state);
    }

    expect(state.cities[0]!.owner).toBe(pid(0));
    expect(state.cities[0]!.captureProgressTicks).toBe(0);
  });

  it('resets capture progress when owner units reclaim the tile', () => {
    const city = makeCity({
      id: cid(0),
      owner: pid(0),
      captureProgressTicks: 50,
      capturingPlayer: pid(1),
    });
    const unit = makeUnit(eid(0), pid(0), { x: 5, y: 5 });
    const state = makeState([city], [unit]);

    updateCityCapture(state);

    expect(state.cities[0]!.captureProgressTicks).toBe(0);
    expect(state.cities[0]!.capturingPlayer).toBeNull();
    expect(state.cities[0]!.owner).toBe(pid(0));
  });
});
