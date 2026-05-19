import { describe, expect, it } from 'vitest';
import { Rng } from './rng.js';

describe('Rng (mulberry32)', () => {
  it('produces identical sequence from the same seed over 1000 calls', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('restores state and continues with identical sequence', () => {
    const original = new Rng(42);
    for (let i = 0; i < 500; i++) original.next();

    const saved = original.state();
    const restored = Rng.restore(saved);

    for (let i = 0; i < 500; i++) {
      expect(original.next()).toBe(restored.next());
    }
  });

  it('int(10) always returns integers in [0, 10)', () => {
    const rng = new Rng(99999);
    for (let i = 0; i < 10000; i++) {
      const v = rng.int(10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('int(1) always returns 0', () => {
    const rng = new Rng(77777);
    for (let i = 0; i < 1000; i++) {
      expect(rng.int(1)).toBe(0);
    }
  });

  it('next() always returns values in [0, 1)', () => {
    const rng = new Rng(55555);
    for (let i = 0; i < 10000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('handles large seeds (>= 2^31)', () => {
    expect(() => new Rng(2 ** 31).next()).not.toThrow();
    expect(() => new Rng(2 ** 32 - 1).next()).not.toThrow();
    expect(() => new Rng(2 ** 32).next()).not.toThrow();
  });

  it('handles negative seeds', () => {
    expect(() => new Rng(-1).next()).not.toThrow();
    expect(() => new Rng(-(2 ** 31)).next()).not.toThrow();
  });

  it('handles seed 0', () => {
    const rng = new Rng(0);
    const v = rng.next();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it('different seeds produce different sequences', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const aVals = Array.from({ length: 10 }, () => a.next());
    const bVals = Array.from({ length: 10 }, () => b.next());
    expect(aVals).not.toEqual(bVals);
  });

  it('state() returns a uint32 value', () => {
    const rng = new Rng(12345);
    for (let i = 0; i < 100; i++) {
      rng.next();
      const s = rng.state();
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});
