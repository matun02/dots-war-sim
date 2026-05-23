import { Container, Graphics } from 'pixi.js';
import {
  type InfluenceData,
  type PlayerId,
  computeInfluenceDiff,
} from '@dots-war-sim/core';

interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

type Edge = 'top' | 'right' | 'bottom' | 'left';

const EDGE_PAIRS: readonly (readonly [Edge, Edge])[][] = [
  /* 0  */ [],
  /* 1  */ [['left', 'bottom']],
  /* 2  */ [['bottom', 'right']],
  /* 3  */ [['left', 'right']],
  /* 4  */ [['right', 'top']],
  /* 5  */ [
    ['left', 'top'],
    ['bottom', 'right'],
  ],
  /* 6  */ [['bottom', 'top']],
  /* 7  */ [['left', 'top']],
  /* 8  */ [['top', 'left']],
  /* 9  */ [['top', 'bottom']],
  /* 10 */ [
    ['top', 'right'],
    ['left', 'bottom'],
  ],
  /* 11 */ [['top', 'right']],
  /* 12 */ [['right', 'left']],
  /* 13 */ [['right', 'bottom']],
  /* 14 */ [['bottom', 'left']],
  /* 15 */ [],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function edgePoint(
  edge: Edge,
  x: number,
  y: number,
  v0: number,
  v1: number,
  v2: number,
  v3: number,
): { px: number; py: number } {
  switch (edge) {
    case 'top': {
      const denom = v0 - v1;
      const t = denom === 0 ? 0.5 : v0 / denom;
      return { px: lerp(x, x + 1, t), py: y };
    }
    case 'right': {
      const denom = v1 - v2;
      const t = denom === 0 ? 0.5 : v1 / denom;
      return { px: x + 1, py: lerp(y, y + 1, t) };
    }
    case 'bottom': {
      const denom = v3 - v2;
      const t = denom === 0 ? 0.5 : v3 / denom;
      return { px: lerp(x, x + 1, t), py: y + 1 };
    }
    case 'left': {
      const denom = v0 - v3;
      const t = denom === 0 ? 0.5 : v0 / denom;
      return { px: x, py: lerp(y, y + 1, t) };
    }
  }
}

export function marchingSquares(
  diff: Int16Array,
  width: number,
  height: number,
): Segment[] {
  const segments: Segment[] = [];

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const v0 = diff[y * width + x]!;
      const v1 = diff[y * width + (x + 1)]!;
      const v2 = diff[(y + 1) * width + (x + 1)]!;
      const v3 = diff[(y + 1) * width + x]!;

      const caseIdx =
        (v0 > 0 ? 8 : 0) |
        (v1 > 0 ? 4 : 0) |
        (v2 > 0 ? 2 : 0) |
        (v3 > 0 ? 1 : 0);

      const pairs = EDGE_PAIRS[caseIdx]!;
      for (const [edgeA, edgeB] of pairs) {
        const a = edgePoint(edgeA, x, y, v0, v1, v2, v3);
        const b = edgePoint(edgeB, x, y, v0, v1, v2, v3);
        segments.push({ x0: a.px, y0: a.py, x1: b.px, y1: b.py });
      }
    }
  }

  return segments;
}

export function createFrontlineRenderer(cellPx: number): {
  update(data: InfluenceData, playerA: PlayerId, playerB: PlayerId): void;
  container: Container;
} {
  const container = new Container();
  const g = new Graphics();
  container.addChild(g);

  return {
    container,
    update(data: InfluenceData, playerA: PlayerId, playerB: PlayerId): void {
      const diff = computeInfluenceDiff(data, playerA, playerB);
      const segments = marchingSquares(diff, data.width, data.height);

      g.clear();
      for (const seg of segments) {
        g.moveTo(seg.x0 * cellPx, seg.y0 * cellPx);
        g.lineTo(seg.x1 * cellPx, seg.y1 * cellPx);
      }
      g.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
    },
  };
}
