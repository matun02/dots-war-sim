import type { InputFrame } from '@dots-war-sim/core';

export interface ReplayRecorder {
  record(frame: InputFrame): void;
  getFrames(): InputFrame[];
}

export function createReplayRecorder(): ReplayRecorder {
  const frames: InputFrame[] = [];

  return {
    record(frame: InputFrame): void {
      frames.push(frame);
    },
    getFrames(): InputFrame[] {
      return frames;
    },
  };
}
