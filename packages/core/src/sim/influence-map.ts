import type { GameState, PlayerId } from './types.js';

export interface InfluenceData {
  maps: Int16Array[];
  width: number;
  height: number;
}

const LIGHT_WEIGHT = 100;
const HEAVY_WEIGHT = 200;
const DIFFUSION_ITERATIONS = 3;

export function computeInfluenceMap(state: GameState): InfluenceData {
  const { width, height } = state.map;
  const size = width * height;
  const playerCount = state.players.length;

  const maps: Int16Array[] = [];
  for (let p = 0; p < playerCount; p++) {
    maps.push(new Int16Array(size));
  }

  for (const unit of state.units) {
    const px = Math.floor(unit.pos.x);
    const py = Math.floor(unit.pos.y);
    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = py * width + px;
      const playerMap = maps[unit.owner as number]!;
      playerMap[idx]! += unit.kind === 'heavy' ? HEAVY_WEIGHT : LIGHT_WEIGHT;
    }
  }

  const next = new Int16Array(size);
  for (let p = 0; p < playerCount; p++) {
    for (let iter = 0; iter < DIFFUSION_ITERATIONS; iter++) {
      const current = maps[p]!;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              sum += current[ny * width + nx]!;
              count++;
            }
          }
          next[y * width + x] = Math.floor(sum / count) as Int16Array[number];
        }
      }
      maps[p] = new Int16Array(next);
      next.fill(0);
    }
  }

  return { maps, width, height };
}

export function computeInfluenceDiff(
  data: InfluenceData,
  playerA: PlayerId,
  playerB: PlayerId,
): Int16Array {
  const size = data.width * data.height;
  const diff = new Int16Array(size);
  const mapA = data.maps[playerA as number]!;
  const mapB = data.maps[playerB as number]!;
  for (let i = 0; i < size; i++) {
    diff[i] = (mapA[i]! - mapB[i]!) as Int16Array[number];
  }
  return diff;
}
