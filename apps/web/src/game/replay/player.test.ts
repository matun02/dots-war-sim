import { describe, it, expect } from 'vitest';
import type { PlayerId, Replay } from '@dots-war-sim/core';
import { REPLAY_VERSION, hashState } from '@dots-war-sim/core';
import { createReplayPlayer } from './player.js';

function makeReplay(finalTick: number): Replay {
  return {
    version: REPLAY_VERSION,
    seed: 42,
    mapId: 'first-blood',
    players: [
      { id: 0 as PlayerId, name: 'P1', type: 'human' },
      { id: 1 as PlayerId, name: 'P2', type: 'ai' },
    ],
    inputs: [],
    finalTick,
    result: { type: 'draw' },
    createdAt: 1000,
  };
}

describe('ReplayPlayer', () => {
  it('step() advances by 1 tick', () => {
    const rp = createReplayPlayer(makeReplay(10));
    expect(rp.currentTick()).toBe(0);
    rp.step();
    expect(rp.currentTick()).toBe(1);
  });

  it('replaying the same replay yields the same final state (determinism)', () => {
    const replay = makeReplay(30);
    const rp1 = createReplayPlayer(replay);
    const rp2 = createReplayPlayer(replay);
    while (rp1.step()) {
      /* advance */
    }
    while (rp2.step()) {
      /* advance */
    }
    expect(hashState(rp1.state())).toBe(hashState(rp2.state()));
  });

  it('seekTo(N) advances to tick N', () => {
    const rp = createReplayPlayer(makeReplay(20));
    rp.seekTo(15);
    expect(rp.currentTick()).toBe(15);
  });

  it('step() returns false at finalTick', () => {
    const rp = createReplayPlayer(makeReplay(3));
    expect(rp.step()).toBe(true);
    expect(rp.step()).toBe(true);
    expect(rp.step()).toBe(true);
    expect(rp.step()).toBe(false);
  });
});
