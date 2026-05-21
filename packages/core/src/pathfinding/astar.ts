import type { MapDef, Vec2, UnitKind } from '../sim/types.js';
import { BinaryHeap } from './binary-heap.js';

const COST_STRAIGHT = 10;
const COST_DIAGONAL = 14;

const DIRS: readonly (readonly [number, number, number])[] = [
  [0, -1, COST_STRAIGHT],
  [1, 0, COST_STRAIGHT],
  [0, 1, COST_STRAIGHT],
  [-1, 0, COST_STRAIGHT],
  [1, -1, COST_DIAGONAL],
  [1, 1, COST_DIAGONAL],
  [-1, 1, COST_DIAGONAL],
  [-1, -1, COST_DIAGONAL],
];

const TERRAIN_COST_LIGHT: readonly number[] = [1, 3, 2, -1, 1];
const TERRAIN_COST_HEAVY: readonly number[] = [1, -1, -1, -1, 1];

interface Node {
  f: number;
  g: number;
  index: number;
}

function terrainCost(terrainValue: number, kind: UnitKind): number {
  const table = kind === 'light' ? TERRAIN_COST_LIGHT : TERRAIN_COST_HEAVY;
  const cost = table[terrainValue];
  return cost === undefined ? -1 : cost;
}

function octileH(x0: number, y0: number, x1: number, y1: number): number {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const mn = dx < dy ? dx : dy;
  const mx = dx < dy ? dy : dx;
  return COST_DIAGONAL * mn + COST_STRAIGHT * (mx - mn);
}

export function findPath(
  map: MapDef,
  start: Vec2,
  goal: Vec2,
  kind: UnitKind,
): Vec2[] | null {
  const { width, height, terrain } = map;

  const sx = Math.floor(start.x);
  const sy = Math.floor(start.y);
  const gx = Math.floor(goal.x);
  const gy = Math.floor(goal.y);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return null;
  if (gx < 0 || gx >= width || gy < 0 || gy >= height) return null;

  const goalIdx = gy * width + gx;

  if (terrainCost(terrain[goalIdx]!, kind) < 0) return null;

  const startIdx = sy * width + sx;

  if (startIdx === goalIdx) {
    return [{ x: sx, y: sy }];
  }

  const totalCells = width * height;
  const gScore = new Int32Array(totalCells).fill(0x7fffffff);
  const cameFrom = new Int32Array(totalCells).fill(-1);
  const closed = new Uint8Array(totalCells);

  gScore[startIdx] = 0;

  const open = new BinaryHeap<Node>((a, b) => {
    if (a.f !== b.f) return a.f - b.f;
    return a.index - b.index;
  });

  open.push({
    f: octileH(sx, sy, gx, gy),
    g: 0,
    index: startIdx,
  });

  while (open.size > 0) {
    const cur = open.pop()!;
    const ci = cur.index;

    if (ci === goalIdx) {
      return reconstructPath(cameFrom, ci, width);
    }

    if (closed[ci]) continue;
    closed[ci] = 1;

    if (cur.g > gScore[ci]!) continue;

    const cx = ci % width;
    const cy = (ci - cx) / width;

    for (let d = 0; d < 8; d++) {
      const dir = DIRS[d]!;
      const ddx = dir[0];
      const ddy = dir[1];
      const baseCost = dir[2];
      const nx = cx + ddx;
      const ny = cy + ddy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const ni = ny * width + nx;
      if (closed[ni]) continue;

      const tc = terrainCost(terrain[ni]!, kind);
      if (tc < 0) continue;

      if (d >= 4) {
        const adj1 = terrain[cy * width + nx]!;
        const adj2 = terrain[ny * width + cx]!;
        if (terrainCost(adj1, kind) < 0 || terrainCost(adj2, kind) < 0)
          continue;
      }

      const ng = cur.g + baseCost * tc;
      if (ng >= gScore[ni]!) continue;

      gScore[ni] = ng;
      cameFrom[ni] = ci;

      open.push({
        f: ng + octileH(nx, ny, gx, gy),
        g: ng,
        index: ni,
      });
    }
  }

  return null;
}

function reconstructPath(
  cameFrom: Int32Array,
  endIdx: number,
  width: number,
): Vec2[] {
  const path: Vec2[] = [];
  let idx = endIdx;
  while (idx !== -1) {
    const x = idx % width;
    const y = (idx - x) / width;
    path.push({ x, y });
    idx = cameFrom[idx]!;
  }
  path.reverse();
  return path;
}
