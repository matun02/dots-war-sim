import { Rng } from '../rng.js';
import { UNIT_STATS } from './constants.js';
import type {
  City,
  EntityId,
  GameState,
  MapDef,
  Player,
  Unit,
} from './types.js';

const UNITS_PER_PLAYER = 10;
const TERRAIN_MOUNTAIN = 1;
const TERRAIN_WATER = 3;
const FORMATION_OFFSET = 5;
const FORMATION_SPACING = 1.5;

function isImpassable(terrain: number): boolean {
  return terrain === TERRAIN_MOUNTAIN || terrain === TERRAIN_WATER;
}

function isValidPos(map: MapDef, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  const ix = Math.floor(y) * map.width + Math.floor(x);
  return !isImpassable(map.terrain[ix]!);
}

export function createInitialState(
  map: MapDef,
  players: Player[],
  seed: number,
): GameState {
  const spawnOwners = new Map(
    map.spawns.map((s) => [s.cityId, s.player]),
  );

  const cities: City[] = map.cities.map((c) => ({
    id: c.id,
    pos: { x: c.pos.x, y: c.pos.y },
    owner: spawnOwners.get(c.id) ?? null,
    production: c.production,
    produceCooldownTicks: 0,
    captureProgressTicks: 0,
    capturingPlayer: null,
    supplyUsed: 0,
  }));

  const rng = new Rng(seed);
  const units: Unit[] = [];
  let nextId = 0;

  for (const spawn of map.spawns) {
    const spawnCity = map.cities.find((c) => c.id === spawn.cityId);
    if (!spawnCity) continue;

    const enemySpawn = map.spawns.find((s) => s.player !== spawn.player);
    if (!enemySpawn) continue;
    const enemyCity = map.cities.find((c) => c.id === enemySpawn.cityId);
    if (!enemyCity) continue;

    const dx = enemyCity.pos.x - spawnCity.pos.x;
    const dy = enemyCity.pos.y - spawnCity.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 1;
    const dirY = dist > 0 ? dy / dist : 0;

    const perpX = -dirY;
    const perpY = dirX;

    const centerX = spawnCity.pos.x + dirX * FORMATION_OFFSET;
    const centerY = spawnCity.pos.y + dirY * FORMATION_OFFSET;

    let count = 0;
    const halfCount = (UNITS_PER_PLAYER - 1) / 2;

    for (let i = 0; i < UNITS_PER_PLAYER; i++) {
      const offset = (i - halfCount) * FORMATION_SPACING;
      const px = centerX + perpX * offset;
      const py = centerY + perpY * offset;

      if (isValidPos(map, px, py)) {
        units.push({
          id: nextId as EntityId,
          owner: spawn.player,
          kind: 'light',
          homeCity: spawn.cityId,
          pos: { x: px, y: py },
          hp: UNIT_STATS.light.hp,
          path: null,
          goal: null,
          attackCooldownTicks: 0,
        });
        nextId++;
        count++;
      }
    }

    // Fallback: if formation placement failed, use rng for remaining slots
    if (count < UNITS_PER_PLAYER) {
      const needed = UNITS_PER_PLAYER - count;
      const candidates: { x: number; y: number }[] = [];
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (isImpassable(map.terrain[y * map.width + x]!)) continue;
          const distToCenter = Math.sqrt(
            (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY),
          );
          if (distToCenter < FORMATION_OFFSET * 2) {
            candidates.push({ x, y });
          }
        }
      }

      let placed = 0;
      let attempts = 0;
      const maxAttempts = needed * 20;
      while (placed < needed && attempts < maxAttempts && candidates.length > 0) {
        attempts++;
        const idx = rng.int(candidates.length);
        const pos = candidates[idx]!;
        units.push({
          id: nextId as EntityId,
          owner: spawn.player,
          kind: 'light',
          homeCity: spawn.cityId,
          pos: { x: pos.x, y: pos.y },
          hp: UNIT_STATS.light.hp,
          path: null,
          goal: null,
          attackCooldownTicks: 0,
        });
        nextId++;
        placed++;
        count++;
        candidates.splice(idx, 1);
      }
    }

    const city = cities.find((c) => c.id === spawn.cityId);
    if (city) {
      city.supplyUsed = count;
    }
  }

  return {
    tick: 0,
    seed,
    map,
    players: structuredClone(players),
    cities,
    units,
    nextEntityId: nextId,
    result: null,
  };
}
