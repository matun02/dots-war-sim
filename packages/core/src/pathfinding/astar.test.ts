import { describe, expect, it } from 'vitest';
import { findPath } from './astar.js';
import type { MapDef } from '../sim/types.js';

function makeMap(
  width: number,
  height: number,
  blocked: [number, number, number][] = [],
): MapDef {
  const terrain = new Array<number>(width * height).fill(0);
  for (const [x, y, t] of blocked) {
    terrain[y * width + x] = t;
  }
  return {
    id: 'test',
    width,
    height,
    terrain,
    cities: [],
    spawns: [],
  };
}

describe('findPath (A*)', () => {
  it('returns a straight path with no obstacles', () => {
    const map = makeMap(10, 10);
    const path = findPath(map, { x: 0, y: 0 }, { x: 5, y: 0 }, 'light');
    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: 5, y: 0 });
  });

  it('detours around impassable mountain wall', () => {
    const blocked: [number, number, number][] = [];
    for (let y = 0; y < 9; y++) {
      blocked.push([5, y, 1]);
    }
    const map = makeMap(10, 10, blocked);
    const path = findPath(map, { x: 3, y: 4 }, { x: 7, y: 4 }, 'light');
    expect(path).not.toBeNull();

    for (const p of path!) {
      const t = map.terrain[p.y * map.width + p.x];
      expect(t).not.toBe(1);
    }
    expect(path![path!.length - 1]).toEqual({ x: 7, y: 4 });
  });

  it('returns null when goal is unreachable', () => {
    const blocked: [number, number, number][] = [];
    for (let x = 0; x < 10; x++) {
      blocked.push([x, 5, 1]);
    }
    const map = makeMap(10, 10, blocked);
    const path = findPath(map, { x: 3, y: 3 }, { x: 3, y: 7 }, 'light');
    expect(path).toBeNull();
  });

  it('produces deterministic results over 100 runs', () => {
    const blocked: [number, number, number][] = [];
    for (let y = 2; y < 8; y++) blocked.push([5, y, 1]);
    const map = makeMap(10, 10, blocked);

    const baseline = JSON.stringify(
      findPath(map, { x: 2, y: 4 }, { x: 8, y: 4 }, 'light'),
    );
    for (let i = 0; i < 100; i++) {
      const result = JSON.stringify(
        findPath(map, { x: 2, y: 4 }, { x: 8, y: 4 }, 'light'),
      );
      expect(result).toBe(baseline);
    }
  });

  it('heavy cannot traverse mountain, but can traverse forest', () => {
    // Mountain is a wall for heavy → detours around (5,0).
    const map2 = makeMap(10, 10, [[5, 0, 1]]);
    const pathMtn = findPath(map2, { x: 4, y: 0 }, { x: 6, y: 0 }, 'heavy');
    expect(pathMtn).not.toBeNull();
    for (const p of pathMtn!) {
      expect(p.x === 5 && p.y === 0).toBe(false);
    }

    // Forest is passable for heavy (cost 2): forced single-row corridor.
    const forestGap = makeMap(3, 1, [[1, 0, 2]]);
    const pathForest = findPath(forestGap, { x: 0, y: 0 }, { x: 2, y: 0 }, 'heavy');
    expect(pathForest).not.toBeNull();
    expect(pathForest!.some((p) => p.x === 1 && p.y === 0)).toBe(true);
  });

  it('returns a single-element path when start == goal', () => {
    const map = makeMap(10, 10);
    const path = findPath(map, { x: 3, y: 3 }, { x: 3, y: 3 }, 'light');
    expect(path).toEqual([{ x: 3, y: 3 }]);
  });

  it('uses diagonal movement correctly', () => {
    const map = makeMap(10, 10);
    const path = findPath(map, { x: 0, y: 0 }, { x: 3, y: 3 }, 'light');
    expect(path).not.toBeNull();
    expect(path!.length).toBeLessThanOrEqual(4);
    expect(path![path!.length - 1]).toEqual({ x: 3, y: 3 });
  });
});
