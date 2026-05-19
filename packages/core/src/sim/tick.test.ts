import { describe, expect, it, vi } from 'vitest';
import { tick } from './tick.js';
import { Rng } from '../rng.js';
import type { GameState } from './types.js';
import * as applyInputsMod from './steps/apply-inputs.js';
import * as recomputePathsMod from './steps/recompute-paths.js';
import * as moveUnitsMod from './steps/move-units.js';
import * as resolveCombatMod from './steps/resolve-combat.js';
import * as removeDeadMod from './steps/remove-dead.js';
import * as updateCityCaptureMod from './steps/update-city-capture.js';
import * as produceUnitsMod from './steps/produce-units.js';
import * as evaluateGameEndMod from './steps/evaluate-game-end.js';

function makeEmptyState(): GameState {
  return {
    tick: 0,
    seed: 42,
    map: {
      id: 'test-4x4',
      width: 4,
      height: 4,
      terrain: Array.from({ length: 16 }, () => 0),
      cities: [],
      spawns: [],
    },
    players: [],
    cities: [],
    units: [],
    nextEntityId: 0,
    result: null,
  };
}

describe('tick', () => {
  it('survives 100 ticks with empty inputs without throwing', () => {
    let state = makeEmptyState();
    const rng = new Rng(42);
    for (let i = 0; i < 100; i++) {
      state = tick(state, [], rng);
    }
  });

  it('increments tick counter to 100 after 100 ticks', () => {
    let state = makeEmptyState();
    const rng = new Rng(42);
    for (let i = 0; i < 100; i++) {
      state = tick(state, [], rng);
    }
    expect(state.tick).toBe(100);
  });

  it('is deterministic: same state + inputs + seed produce identical JSON after 1000 ticks', () => {
    function run(): string {
      let state = makeEmptyState();
      const rng = new Rng(42);
      for (let i = 0; i < 1000; i++) {
        state = tick(state, [], rng);
      }
      return JSON.stringify(state);
    }
    expect(run()).toBe(run());
  });

  it('calls all 8 step functions on each tick', () => {
    const spies = [
      vi.spyOn(applyInputsMod, 'applyInputs'),
      vi.spyOn(recomputePathsMod, 'recomputePaths'),
      vi.spyOn(moveUnitsMod, 'moveUnits'),
      vi.spyOn(resolveCombatMod, 'resolveCombat'),
      vi.spyOn(removeDeadMod, 'removeDead'),
      vi.spyOn(updateCityCaptureMod, 'updateCityCapture'),
      vi.spyOn(produceUnitsMod, 'produceUnits'),
      vi.spyOn(evaluateGameEndMod, 'evaluateGameEnd'),
    ];

    const state = makeEmptyState();
    const rng = new Rng(42);
    tick(state, [], rng);

    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    }
  });

  it('does not mutate the original state (immutability)', () => {
    const state = makeEmptyState();
    const before = JSON.stringify(state);
    const rng = new Rng(42);
    tick(state, [], rng);
    expect(JSON.stringify(state)).toBe(before);
  });
});
