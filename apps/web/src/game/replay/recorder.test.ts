import { describe, it, expect } from 'vitest';
import type { InputFrame, PlayerId, EntityId } from '@dots-war-sim/core';
import { createReplayRecorder } from './recorder.js';

describe('ReplayRecorder', () => {
  it('accumulates recorded frames', () => {
    const recorder = createReplayRecorder();
    const f1: InputFrame = { tick: 0, commands: [] };
    const f2: InputFrame = {
      tick: 1,
      commands: [
        {
          type: 'move',
          player: 0 as PlayerId,
          ids: [1 as EntityId],
          to: { x: 5, y: 5 },
        },
      ],
    };
    recorder.record(f1);
    recorder.record(f2);
    expect(recorder.getFrames()).toHaveLength(2);
  });

  it('returns frames in recording order', () => {
    const recorder = createReplayRecorder();
    const f0: InputFrame = { tick: 0, commands: [] };
    const f1: InputFrame = { tick: 1, commands: [] };
    const f2: InputFrame = { tick: 2, commands: [] };
    recorder.record(f0);
    recorder.record(f1);
    recorder.record(f2);
    const frames = recorder.getFrames();
    expect(frames).toHaveLength(3);
    expect(frames[0]!.tick).toBe(0);
    expect(frames[1]!.tick).toBe(1);
    expect(frames[2]!.tick).toBe(2);
  });
});
