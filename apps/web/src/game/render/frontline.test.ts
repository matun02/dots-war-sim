import { describe, it, expect } from 'vitest';
import { marchingSquares } from './frontline';

function makeDiff(
  width: number,
  height: number,
  fill: number | ((x: number, y: number) => number),
): Int16Array {
  const data = new Int16Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = (
        typeof fill === 'number' ? fill : fill(x, y)
      ) as Int16Array[number];
    }
  }
  return data;
}

describe('marchingSquares', () => {
  it('generates no segments when all values are positive', () => {
    const diff = makeDiff(4, 4, 100);
    const segments = marchingSquares(diff, 4, 4);
    expect(segments).toHaveLength(0);
  });

  it('generates no segments when all values are negative', () => {
    const diff = makeDiff(4, 4, -50);
    const segments = marchingSquares(diff, 4, 4);
    expect(segments).toHaveLength(0);
  });

  it('generates no segments when all values are zero', () => {
    const diff = makeDiff(4, 4, 0);
    const segments = marchingSquares(diff, 4, 4);
    expect(segments).toHaveLength(0);
  });

  it('generates segments at a single-cell boundary', () => {
    const diff = makeDiff(3, 3, -100);
    diff[0] = 100 as Int16Array[number];

    const segments = marchingSquares(diff, 3, 3);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length).toBeLessThanOrEqual(4);
  });

  it('generates continuous segments for a horizontal boundary', () => {
    const width = 6;
    const height = 4;
    const diff = makeDiff(width, height, (_x, y) => (y <= 1 ? 100 : -100));

    const segments = marchingSquares(diff, width, height);
    expect(segments.length).toBe(width - 1);

    for (const seg of segments) {
      expect(seg.y0).toBeCloseTo(1.5, 5);
      expect(seg.y1).toBeCloseTo(1.5, 5);
    }
  });

  it('interpolates position based on value ratio', () => {
    const width = 3;
    const height = 2;
    const diff = new Int16Array(width * height);
    diff[0] = 300 as Int16Array[number];
    diff[1] = -100 as Int16Array[number];
    diff[2] = -100 as Int16Array[number];
    diff[3] = 300 as Int16Array[number];
    diff[4] = -100 as Int16Array[number];
    diff[5] = -100 as Int16Array[number];

    const segments = marchingSquares(diff, width, height);
    expect(segments.length).toBeGreaterThan(0);

    const topEdgeSeg = segments.find(
      (s) =>
        (s.y0 === 0 && Math.abs(s.x0 - 0.75) < 0.01) ||
        (s.y1 === 0 && Math.abs(s.x1 - 0.75) < 0.01),
    );
    expect(topEdgeSeg).toBeDefined();
  });

  it('does not crash when adjacent cells have equal diff values', () => {
    const width = 4;
    const height = 4;
    const diff = makeDiff(width, height, (_x, y) => (y < 2 ? 0 : -100));
    expect(() => marchingSquares(diff, width, height)).not.toThrow();

    const diff2 = makeDiff(width, height, 0);
    expect(() => marchingSquares(diff2, width, height)).not.toThrow();
  });

  it('handles a vertical boundary correctly', () => {
    const width = 4;
    const height = 6;
    const diff = makeDiff(width, height, (x) => (x <= 1 ? 100 : -100));

    const segments = marchingSquares(diff, width, height);
    expect(segments.length).toBe(height - 1);

    for (const seg of segments) {
      expect(seg.x0).toBeCloseTo(1.5, 5);
      expect(seg.x1).toBeCloseTo(1.5, 5);
    }
  });
});
