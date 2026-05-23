import {
  type GameState,
  type InputFrame,
  type Replay,
  Rng,
  createInitialState,
  tick,
} from '@dots-war-sim/core';
import { loadMap, firstBloodJson } from '@dots-war-sim/maps';

export interface ReplayPlayer {
  currentTick(): number;
  step(): boolean;
  state(): GameState;
  seekTo(tick: number): void;
}

export function createReplayPlayer(replay: Replay): ReplayPlayer {
  const map = loadMap(firstBloodJson);
  const players = replay.players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.id === (0 as never) ? 0x4488ff : 0xff8844,
    alive: true,
  }));
  let current = createInitialState(map, players, replay.seed);
  let rng = new Rng(replay.seed);

  const inputsByTick = new Map<number, InputFrame[]>();
  for (const frame of replay.inputs) {
    const existing = inputsByTick.get(frame.tick);
    if (existing) {
      existing.push(frame);
    } else {
      inputsByTick.set(frame.tick, [frame]);
    }
  }

  function resetToStart(): void {
    current = createInitialState(map, players, replay.seed);
    rng = new Rng(replay.seed);
  }

  return {
    currentTick(): number {
      return current.tick;
    },

    step(): boolean {
      if (current.tick >= replay.finalTick) return false;
      const frames = inputsByTick.get(current.tick) ?? [];
      current = tick(current, frames, rng);
      return true;
    },

    state(): GameState {
      return current;
    },

    seekTo(targetTick: number): void {
      if (targetTick <= current.tick) {
        resetToStart();
      }
      while (current.tick < targetTick) {
        const frames = inputsByTick.get(current.tick) ?? [];
        current = tick(current, frames, rng);
      }
    },
  };
}
