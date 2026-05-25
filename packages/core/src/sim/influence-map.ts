import type { GameState, PlayerId } from './types.js';

export interface InfluenceData {
  maps: Int16Array[];
  width: number;
  height: number;
}

const LIGHT_WEIGHT = 100;
const HEAVY_WEIGHT = 200;
const CITY_WEIGHT = 300;
const INFLUENCE_RADIUS = 10;
const INFLUENCE_RADIUS_SQ = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
const SMOOTH_ITERATIONS = 3;

function addCircularInfluence(
  map: Int16Array,
  cx: number,
  cy: number,
  weight: number,
  width: number,
  height: number,
): void {
  const minY = Math.max(0, cy - INFLUENCE_RADIUS);
  const maxY = Math.min(height - 1, cy + INFLUENCE_RADIUS);
  const minX = Math.max(0, cx - INFLUENCE_RADIUS);
  const maxX = Math.min(width - 1, cx + INFLUENCE_RADIUS);

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const distSq = dx * dx + dy * dy;
      if (distSq > INFLUENCE_RADIUS_SQ) continue;
      const falloff = Math.floor(
        (weight * (INFLUENCE_RADIUS_SQ - distSq)) / INFLUENCE_RADIUS_SQ,
      );
      map[y * width + x] = (map[y * width + x]! + falloff) as Int16Array[number];
    }
  }
}

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
      const w = unit.kind === 'heavy' ? HEAVY_WEIGHT : LIGHT_WEIGHT;
      addCircularInfluence(maps[unit.owner as number]!, px, py, w, width, height);
    }
  }

  for (const city of state.cities) {
    const cx = Math.floor(city.pos.x);
    const cy = Math.floor(city.pos.y);
    if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
      addCircularInfluence(maps[city.owner as number]!, cx, cy, CITY_WEIGHT, width, height);
    }
  }

  const next = new Int16Array(size);
  for (let p = 0; p < playerCount; p++) {
    for (let iter = 0; iter < SMOOTH_ITERATIONS; iter++) {
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
