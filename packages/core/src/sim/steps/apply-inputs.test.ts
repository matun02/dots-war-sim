import { describe, expect, it } from 'vitest';
import type {
  City,
  CityId,
  EntityId,
  GameState,
  InputFrame,
  PlayerId,
  Unit,
  Vec2,
} from '../types.js';
import { applyInputs } from './apply-inputs.js';

function makeUnit(
  id: number,
  owner: number,
  pos: Vec2 = { x: 0, y: 0 },
): Unit {
  return {
    id: id as EntityId,
    owner: owner as PlayerId,
    kind: 'light',
    homeCity: 0 as never,
    pos,
    hp: 1,
    path: [{ x: 5, y: 5 }],
    goal: null,
    attackCooldownTicks: 0,
  };
}

function makeState(units: Unit[]): GameState {
  return {
    tick: 0,
    seed: 0,
    map: {
      id: 'test',
      width: 10,
      height: 10,
      terrain: [],
      cities: [],
      spawns: [],
    },
    players: [],
    cities: [],
    units,
    nextEntityId: units.length,
    result: null,
  };
}

describe('applyInputs', () => {
  it('move command updates target unit goal', () => {
    const state = makeState([makeUnit(0, 0), makeUnit(1, 0)]);
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'move',
          player: 0 as PlayerId,
          ids: [0 as EntityId],
          to: { x: 10, y: 20 },
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(state.units[0]!.goal).toEqual({ x: 10, y: 20 });
    expect(state.units[1]!.goal).toBeNull();
  });

  it('ignores non-existent unit ids without crashing', () => {
    const state = makeState([makeUnit(0, 0)]);
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'move',
          player: 0 as PlayerId,
          ids: [99 as EntityId],
          to: { x: 5, y: 5 },
        },
      ],
    };

    expect(() => applyInputs(state, [frame])).not.toThrow();
    expect(state.units[0]!.goal).toBeNull();
  });

  it('ignores move commands targeting another player units', () => {
    const state = makeState([makeUnit(0, 1)]);
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'move',
          player: 0 as PlayerId,
          ids: [0 as EntityId],
          to: { x: 5, y: 5 },
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(state.units[0]!.goal).toBeNull();
  });

  it('select command does not modify state', () => {
    const state = makeState([makeUnit(0, 0)]);
    const before = JSON.stringify(state);
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'select',
          player: 0 as PlayerId,
          ids: [0 as EntityId],
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(JSON.stringify(state)).toBe(before);
  });

  it('applies multiple InputFrames in order', () => {
    const state = makeState([makeUnit(0, 0)]);
    const frames: InputFrame[] = [
      {
        tick: 0,
        commands: [
          {
            type: 'move',
            player: 0 as PlayerId,
            ids: [0 as EntityId],
            to: { x: 1, y: 1 },
          },
        ],
      },
      {
        tick: 1,
        commands: [
          {
            type: 'move',
            player: 0 as PlayerId,
            ids: [0 as EntityId],
            to: { x: 99, y: 99 },
          },
        ],
      },
    ];

    applyInputs(state, frames);

    expect(state.units[0]!.goal).toEqual({ x: 99, y: 99 });
  });

  it('move command resets path to null', () => {
    const unit = makeUnit(0, 0);
    unit.path = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const state = makeState([unit]);
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'move',
          player: 0 as PlayerId,
          ids: [0 as EntityId],
          to: { x: 10, y: 10 },
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(state.units[0]!.path).toBeNull();
    expect(state.units[0]!.goal).toEqual({ x: 10, y: 10 });
  });

  it('set-production changes own city production', () => {
    const city: City = {
      id: 0 as CityId,
      pos: { x: 5, y: 5 },
      owner: 0 as PlayerId,
      production: 'light',
      produceCooldownTicks: 0,
      captureProgressTicks: 0,
      capturingPlayer: null,
      supplyUsed: 0,
    };
    const state = makeState([]);
    state.cities = [city];
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'set-production',
          player: 0 as PlayerId,
          cityId: 0 as CityId,
          production: 'heavy',
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(state.cities[0]!.production).toBe('heavy');
  });

  it('set-production ignores other player city', () => {
    const city: City = {
      id: 0 as CityId,
      pos: { x: 5, y: 5 },
      owner: 1 as PlayerId,
      production: 'light',
      produceCooldownTicks: 0,
      captureProgressTicks: 0,
      capturingPlayer: null,
      supplyUsed: 0,
    };
    const state = makeState([]);
    state.cities = [city];
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'set-production',
          player: 0 as PlayerId,
          cityId: 0 as CityId,
          production: 'heavy',
        },
      ],
    };

    applyInputs(state, [frame]);

    expect(state.cities[0]!.production).toBe('light');
  });

  it('set-production ignores non-existent cityId', () => {
    const state = makeState([]);
    state.cities = [];
    const frame: InputFrame = {
      tick: 0,
      commands: [
        {
          type: 'set-production',
          player: 0 as PlayerId,
          cityId: 99 as CityId,
          production: 'heavy',
        },
      ],
    };

    expect(() => applyInputs(state, [frame])).not.toThrow();
  });
});
