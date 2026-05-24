import { Rng } from '../rng.js';
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
  const midX = map.width / 2;

  for (const spawn of map.spawns) {
    const spawnCity = map.cities.find((c) => c.id === spawn.cityId);
    if (!spawnCity) continue;

    const isLeft = spawnCity.pos.x < midX;
    const candidates: { x: number; y: number }[] = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (isLeft ? x >= midX : x < midX) continue;
        if (map.terrain[y * map.width + x] === TERRAIN_MOUNTAIN) continue;
        candidates.push({ x, y });
      }
    }

    if (candidates.length === 0) continue;

    const placed = new Set<number>();
    let count = 0;
    const maxAttempts = UNITS_PER_PLAYER * 10;
    let attempts = 0;

    while (count < UNITS_PER_PLAYER && attempts < maxAttempts) {
      attempts++;
      const idx = rng.int(candidates.length);
      const key = candidates[idx]!.y * map.width + candidates[idx]!.x;
      if (placed.has(key)) continue;
      placed.add(key);

      units.push({
        id: nextId as EntityId,
        owner: spawn.player,
        kind: 'light',
        homeCity: spawn.cityId,
        pos: { x: candidates[idx]!.x, y: candidates[idx]!.y },
        hp: 1,
        path: null,
        goal: null,
        attackCooldownTicks: 0,
      });
      nextId++;
      count++;
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
