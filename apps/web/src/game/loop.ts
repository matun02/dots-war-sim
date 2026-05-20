export interface LoopOptions {
  tickRateHz: number;
  onTick: () => void;
  onRender: (alpha: number) => void;
}

export interface LoopHandle {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
}

const MAX_FRAME_DT = 250;

export function createLoop(opts: LoopOptions): LoopHandle {
  const TICK_DT = 1000 / opts.tickRateHz;

  let acc = 0;
  let last = 0;
  let rafId = 0;
  let running = false;
  let paused = false;

  function frame(now: number): void {
    if (!running) return;

    const dt = Math.min(now - last, MAX_FRAME_DT);
    last = now;

    if (!paused) {
      acc += dt;

      // 1e-6 ms epsilon guards against IEEE 754 boundary drift
      while (acc + 1e-6 >= TICK_DT) {
        opts.onTick();
        acc -= TICK_DT;
      }
      if (acc < 0) acc = 0;

      opts.onRender(acc / TICK_DT);
    }

    rafId = requestAnimationFrame(frame);
  }

  return {
    start(): void {
      if (running) return;
      running = true;
      paused = false;
      acc = 0;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    },

    stop(): void {
      running = false;
      paused = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      acc = 0;
      last = 0;
    },

    pause(): void {
      if (!running) return;
      paused = true;
    },

    resume(): void {
      if (!running || !paused) return;
      paused = false;
      acc = 0;
      last = performance.now();
    },
  };
}
