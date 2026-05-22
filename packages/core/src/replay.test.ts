import { describe, it, expect } from 'vitest';
import type { PlayerId } from './sim/types.js';
import { REPLAY_VERSION, type Replay } from './replay.js';

describe('Replay', () => {
  it('REPLAY_VERSION is 1', () => {
    expect(REPLAY_VERSION).toBe(1);
  });

  it('can construct a Replay object', () => {
    const replay: Replay = {
      version: REPLAY_VERSION,
      seed: 42,
      mapId: 'first-blood',
      players: [
        { id: 0 as PlayerId, name: 'P1', type: 'human' },
        { id: 1 as PlayerId, name: 'P2', type: 'ai' },
      ],
      inputs: [{ tick: 0, commands: [] }],
      finalTick: 1,
      result: { type: 'draw' },
      createdAt: 1000,
    };
    expect(replay.version).toBe(1);
    expect(replay.players).toHaveLength(2);
    expect(replay.inputs).toHaveLength(1);
  });
});
