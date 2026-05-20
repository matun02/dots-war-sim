import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLoop } from './loop';

const FRAME_DT = 1000 / 60;

let perfNow: number;
let pendingRaf: { id: number; cb: (now: number) => void } | null;
let nextRafId: number;

function triggerFrame(now: number): void {
  perfNow = now;
  if (pendingRaf) {
    const { cb } = pendingRaf;
    pendingRaf = null;
    cb(now);
  }
}

function triggerFrames(count: number, interval: number = FRAME_DT): void {
  const start = perfNow;
  for (let i = 1; i <= count; i++) {
    triggerFrame(start + i * interval);
  }
}

describe('createLoop', () => {
  beforeEach(() => {
    perfNow = 0;
    pendingRaf = null;
    nextRafId = 1;

    vi.stubGlobal('performance', { now: () => perfNow });
    vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
      const id = nextRafId++;
      pendingRaf = { id, cb };
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      if (pendingRaf && pendingRaf.id === id) {
        pendingRaf = null;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onTick 30 times in 1000ms at 30Hz', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrames(60);
    loop.stop();

    expect(onTick).toHaveBeenCalledTimes(30);
  });

  it('calls onTick 3 times in 100ms at 30Hz', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrames(6);
    loop.stop();

    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('does not call onTick while paused, resumes after resume()', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrames(6);
    const countBeforePause = onTick.mock.calls.length;
    expect(countBeforePause).toBe(3);

    loop.pause();
    triggerFrames(30);
    expect(onTick).toHaveBeenCalledTimes(countBeforePause);

    loop.resume();
    triggerFrames(6);
    loop.stop();

    expect(onTick).toHaveBeenCalledTimes(countBeforePause + 3);
  });

  it('does not call onTick or onRender after stop()', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrames(6);
    loop.stop();

    const tickCount = onTick.mock.calls.length;
    const renderCount = onRender.mock.calls.length;

    triggerFrames(30);

    expect(onTick).toHaveBeenCalledTimes(tickCount);
    expect(onRender).toHaveBeenCalledTimes(renderCount);
  });

  it('caps ticks per frame via MAX_FRAME_DT (spike protection)', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrame(500);
    loop.stop();

    // MAX_FRAME_DT=250ms caps dt, 250/33.33 ≈ 7
    expect(onTick).toHaveBeenCalledTimes(7);
  });

  it('passes alpha in [0, 1) range to onRender', () => {
    const onTick = vi.fn();
    const alphas: number[] = [];
    const onRender = vi.fn((alpha: number) => {
      alphas.push(alpha);
    });
    const loop = createLoop({ tickRateHz: 30, onTick, onRender });

    loop.start();
    triggerFrames(12);
    loop.stop();

    expect(alphas.length).toBeGreaterThan(0);
    for (const a of alphas) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
    }
  });
});
