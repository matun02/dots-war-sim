import { describe, expect, it } from 'vitest';
import type {
  GameState,
  City,
  Unit,
  PlayerId,
  EntityId,
  CityId,
  MapDef,
  Vec2,
} from '@dots-war-sim/core';
import { Rng } from '@dots-war-sim/core';
import { createAIController } from './controller.js';

const AI_PLAYER = 1 as PlayerId;
const HUMAN_PLAYER = 0 as PlayerId;

function makeUnit(
  id: number,
  owner: number,
  x: number,
  y: number,
  goal: Vec2 | null = null,
): Unit {
  return {
    id: id as EntityId,
    owner: owner as PlayerId,
    kind: 'light',
    homeCity: 0 as CityId,
    pos: { x, y },
    hp: 1,
    path: null,
    goal,
    attackCooldownTicks: 0,
  };
}

function makeCity(
  id: number,
  x: number,
  y: number,
  owner: number | null,
  captureProgressTicks = 0,
): City {
  return {
    id: id as CityId,
    pos: { x, y },
    owner: owner === null ? null : (owner as PlayerId),
    production: 'light',
    produceCooldownTicks: 0,
    captureProgressTicks,
    capturingPlayer: captureProgressTicks > 0 ? (HUMAN_PLAYER as PlayerId) : null,
    supplyUsed: 0,
  };
}

const MINIMAL_MAP: MapDef = {
  id: 'test',
  width: 64,
  height: 36,
  terrain: new Array(64 * 36).fill(0),
  cities: [],
  spawns: [],
};

function makeState(
  tick: number,
  cities: City[],
  units: Unit[],
): GameState {
  return {
    tick,
    seed: 42,
    map: MINIMAL_MAP,
    players: [
      { id: HUMAN_PLAYER, name: 'Human', color: 0x4488ff, alive: true },
      { id: AI_PLAYER, name: 'AI', color: 0xff8844, alive: true },
    ],
    cities,
    units,
    nextEntityId: 100,
    result: null,
  };
}

describe('AIController', () => {
  it('dispatches idle units to a neutral city', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10),
      makeUnit(1, AI_PLAYER, 11, 10),
    ]);

    const cmds = ai.update(state);

    expect(cmds.length).toBeGreaterThan(0);
    const moveCmd = cmds.find((c) => c.type === 'move');
    expect(moveCmd).toBeDefined();
    expect(moveCmd!.type).toBe('move');
    if (moveCmd!.type === 'move') {
      expect(moveCmd!.to).toEqual({ x: 30, y: 10 });
    }
  });

  it('returns empty when all units are moving', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10, { x: 30, y: 10 }),
      makeUnit(1, AI_PLAYER, 11, 10, { x: 30, y: 10 }),
    ]);

    const cmds = ai.update(state);

    expect(cmds).toEqual([]);
  });

  it('returns empty on non-think ticks', () => {
    const ai = createAIController(AI_PLAYER, 'normal', new Rng(1));
    const state = makeState(1, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10),
    ]);

    const cmds = ai.update(state);

    expect(cmds).toEqual([]);
  });

  it('easy selectionAccuracy causes partial unit dispatch', () => {
    const dispatched = new Set<number>();

    for (let seed = 0; seed < 50; seed++) {
      const ai = createAIController(AI_PLAYER, 'easy', new Rng(seed));
      const units = Array.from({ length: 10 }, (_, i) =>
        makeUnit(i, AI_PLAYER, 10 + i, 10),
      );
      const state = makeState(0, [
        makeCity(0, 10, 10, AI_PLAYER),
        makeCity(1, 50, 10, null),
      ], units);

      const cmds = ai.update(state);
      const moveCmd = cmds.find((c) => c.type === 'move');
      if (moveCmd && moveCmd.type === 'move') {
        dispatched.add(moveCmd.ids.length);
      }
    }

    expect(dispatched.size).toBeGreaterThan(1);
  });

  it('issues defense commands when own city is under threat', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER, 5),
      makeCity(1, 50, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 12, 10),
      makeUnit(1, AI_PLAYER, 13, 10),
    ]);

    const cmds = ai.update(state);

    const defenseCmd = cmds.find(
      (c) => c.type === 'move' && c.to.x === 10 && c.to.y === 10,
    );
    expect(defenseCmd).toBeDefined();
  });

  it('returns empty when game result is set', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10),
    ]);
    state.result = { type: 'victory', winner: HUMAN_PLAYER, reason: 'domination' };

    const cmds = ai.update(state);

    expect(cmds).toEqual([]);
  });

  it('only generates commands for its own playerId', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10),
      makeUnit(1, HUMAN_PLAYER, 20, 10),
    ]);

    const cmds = ai.update(state);

    for (const cmd of cmds) {
      expect(cmd.player).toBe(AI_PLAYER);
    }
  });

  it('is deterministic: same state + same seed produces same commands', () => {
    const state = makeState(0, [
      makeCity(0, 10, 10, AI_PLAYER),
      makeCity(1, 30, 10, null),
      makeCity(2, 50, 20, HUMAN_PLAYER),
    ], [
      makeUnit(0, AI_PLAYER, 10, 10),
      makeUnit(1, AI_PLAYER, 12, 11),
      makeUnit(2, AI_PLAYER, 14, 10),
    ]);

    const ai1 = createAIController(AI_PLAYER, 'normal', new Rng(99));
    const cmds1 = ai1.update(state);

    const ai2 = createAIController(AI_PLAYER, 'normal', new Rng(99));
    const cmds2 = ai2.update(state);

    expect(cmds1).toEqual(cmds2);
  });

  it('pushes units toward sector with enemy pressure', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const enemyUnits = Array.from({ length: 10 }, (_, i) =>
      makeUnit(50 + i, HUMAN_PLAYER, 50 + i, 5),
    );
    const state = makeState(0, [
      makeCity(0, 10, 18, AI_PLAYER),
      makeCity(1, 50, 5, HUMAN_PLAYER),
    ], [
      makeUnit(0, AI_PLAYER, 10, 18),
      makeUnit(1, AI_PLAYER, 12, 18),
      makeUnit(2, AI_PLAYER, 14, 18),
      ...enemyUnits,
    ]);

    const cmds = ai.update(state);

    const moveCmd = cmds.find((c) => c.type === 'move');
    expect(moveCmd).toBeDefined();
    if (moveCmd && moveCmd.type === 'move') {
      expect(moveCmd.to.y).toBeLessThan(18);
    }
  });

  it('prioritizes neutral cities when economy is disadvantaged', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const state = makeState(0, [
      makeCity(0, 10, 18, AI_PLAYER),
      makeCity(1, 50, 5, HUMAN_PLAYER),
      makeCity(2, 50, 30, HUMAN_PLAYER),
      makeCity(3, 55, 18, HUMAN_PLAYER),
      makeCity(4, 30, 18, null),
    ], [
      makeUnit(0, AI_PLAYER, 10, 18),
      makeUnit(1, AI_PLAYER, 12, 18),
    ]);

    const cmds = ai.update(state);

    const moveCmd = cmds.find((c) => c.type === 'move');
    expect(moveCmd).toBeDefined();
    if (moveCmd && moveCmd.type === 'move') {
      expect(moveCmd.to).toEqual({ x: 30, y: 18 });
    }
  });

  it('issues set-production command when frontline is stable and cities >= 3', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    // AI must dominate everywhere so enemyPressure=0 (city weight also contributes).
    // Place AI units near the enemy city so AI influence overwhelms enemy city influence.
    const state = makeState(0, [
      makeCity(0, 10, 18, AI_PLAYER),
      makeCity(1, 15, 18, AI_PLAYER),
      makeCity(2, 20, 18, AI_PLAYER),
      makeCity(3, 55, 18, HUMAN_PLAYER),
    ], [
      makeUnit(0, AI_PLAYER, 10, 18),
      makeUnit(1, AI_PLAYER, 50, 18),
      makeUnit(2, AI_PLAYER, 54, 18),
      makeUnit(3, AI_PLAYER, 55, 18),
      makeUnit(4, AI_PLAYER, 56, 18),
      makeUnit(5, AI_PLAYER, 55, 16),
      makeUnit(6, AI_PLAYER, 55, 20),
    ]);

    const cmds = ai.update(state);

    const prodCmds = cmds.filter((c) => c.type === 'set-production');
    expect(prodCmds.length).toBeGreaterThan(0);
    for (const cmd of prodCmds) {
      if (cmd.type === 'set-production') {
        expect(cmd.production).toBe('heavy');
      }
    }
  });

  it('defense takes priority over influence-map strategy', () => {
    const ai = createAIController(AI_PLAYER, 'hard', new Rng(1));
    const enemyUnits = Array.from({ length: 5 }, (_, i) =>
      makeUnit(50 + i, HUMAN_PLAYER, 50, 5 + i),
    );
    const state = makeState(0, [
      makeCity(0, 10, 18, AI_PLAYER, 10),
      makeCity(1, 50, 5, HUMAN_PLAYER),
    ], [
      makeUnit(0, AI_PLAYER, 12, 18),
      makeUnit(1, AI_PLAYER, 14, 18),
      ...enemyUnits,
    ]);

    const cmds = ai.update(state);

    const defenseCmd = cmds.find(
      (c) => c.type === 'move' && c.to.x === 10 && c.to.y === 18,
    );
    expect(defenseCmd).toBeDefined();
  });

  it('v1 is deterministic: same state + same seed produces same commands', () => {
    const enemyUnits = Array.from({ length: 5 }, (_, i) =>
      makeUnit(50 + i, HUMAN_PLAYER, 50, 5 + i),
    );
    const state = makeState(0, [
      makeCity(0, 10, 18, AI_PLAYER),
      makeCity(1, 15, 18, AI_PLAYER),
      makeCity(2, 20, 18, AI_PLAYER),
      makeCity(3, 50, 5, HUMAN_PLAYER),
    ], [
      makeUnit(0, AI_PLAYER, 10, 18),
      makeUnit(1, AI_PLAYER, 12, 18),
      makeUnit(2, AI_PLAYER, 14, 18),
      ...enemyUnits,
    ]);

    const ai1 = createAIController(AI_PLAYER, 'normal', new Rng(99));
    const cmds1 = ai1.update(state);

    const ai2 = createAIController(AI_PLAYER, 'normal', new Rng(99));
    const cmds2 = ai2.update(state);

    expect(cmds1).toEqual(cmds2);
    expect(cmds1.length).toBeGreaterThan(0);
  });
});
