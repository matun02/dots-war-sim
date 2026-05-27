import { Rng } from '../rng.js';
import { UNIT_STATS } from './constants.js';
import type {
  City,
  EntityId,
  GameState,
  MapDef,
  Player,
  PlayerId,
  Unit,
} from './types.js';

const UNITS_PER_PLAYER = 10;
const TERRAIN_MOUNTAIN = 1;
const TERRAIN_WATER = 3;

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
    owner: spawnOwners.get(c.id) ?? c.owner ?? (0 as PlayerId),
    production: c.production,
    produceCooldownTicks: spawnOwners.has(c.id) ? 0 : UNIT_STATS[c.production].produceIntervalTicks,
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

    let count = 0;

    if (spawn.unitPositions && spawn.unitPositions.length > 0) {
      // Explicit positions from map data
      for (const pos of spawn.unitPositions) {
        if (!isValidPos(map, pos.x, pos.y)) continue;
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
        count++;
      }
    } else {
      // Fallback: scatter near spawn city using RNG
      const radius = 5;
      const needed = UNITS_PER_PLAYER;
      const candidates: { x: number; y: number }[] = [];
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (isImpassable(map.terrain[y * map.width + x]!)) continue;
          const dx = x - spawnCity.pos.x;
          const dy = y - spawnCity.pos.y;
          if (Math.sqrt(dx * dx + dy * dy) <= radius) {
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
