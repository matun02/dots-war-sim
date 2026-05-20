import type { City, GameState, MapDef, Player } from './types.js';

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

  return {
    tick: 0,
    seed,
    map,
    players: structuredClone(players),
    cities,
    units: [],
    nextEntityId: 0,
    result: null,
  };
}
