import { describe, expect, it } from 'vitest';
import { produceUnits } from './produce-units.js';
import { Rng } from '../../rng.js';
import { SUPPLY_MAX, UNIT_STATS } from '../constants.js';
import type { City, CityId, GameState, PlayerId } from '../types.js';

function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 0 as CityId,
    pos: { x: 5, y: 5 },
    owner: 0 as PlayerId,
    production: 'light',
    produceCooldownTicks: 0,
    captureProgressTicks: 0,
    capturingPlayer: null,
    supplyUsed: 0,
    ...overrides,
  };
}

function makeState(cities: City[]): GameState {
  return {
    tick: 0,
    seed: 42,
    map: {
      id: 'test',
      width: 10,
      height: 10,
      terrain: Array.from({ length: 100 }, () => 0),
      cities: [],
      spawns: [],
    },
    players: [],
    cities,
    units: [],
    nextEntityId: 0,
    result: null,
  };
}

describe('produceUnits', () => {
  const rng = new Rng(42);

  it('produces a light unit after 60 ticks (cooldown cycle)', () => {
    const city = makeCity();
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(1);
    expect(state.units[0]!.kind).toBe('light');

    for (let i = 0; i < UNIT_STATS.light.produceIntervalTicks; i++) {
      produceUnits(state, rng);
    }
    expect(state.units).toHaveLength(1);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(2);
  });

  it('stops production at supply cap', () => {
    const city = makeCity({ supplyUsed: SUPPLY_MAX });
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(0);
  });

  it('does not produce from neutral cities (owner = null)', () => {
    const city = makeCity({ owner: null });
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(0);
  });

  it('decrements produceCooldownTicks correctly', () => {
    const city = makeCity({ produceCooldownTicks: 3 });
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(city.produceCooldownTicks).toBe(2);
    expect(state.units).toHaveLength(0);
  });

  it('does not produce when capture is in progress', () => {
    const city = makeCity({ capturingPlayer: 1 as PlayerId });
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(0);
  });

  it('spawns unit at the city position', () => {
    const city = makeCity({ pos: { x: 7, y: 3 } });
    const state = makeState([city]);

    produceUnits(state, rng);
    expect(state.units[0]!.pos).toEqual({ x: 7, y: 3 });
  });

  it('increments nextEntityId for each produced unit', () => {
    const cities = [makeCity(), makeCity({ id: 1 as CityId })];
    const state = makeState(cities);

    produceUnits(state, rng);
    expect(state.units).toHaveLength(2);
    expect(state.units[0]!.id).toBe(0);
    expect(state.units[1]!.id).toBe(1);
    expect(state.nextEntityId).toBe(2);
  });
});
