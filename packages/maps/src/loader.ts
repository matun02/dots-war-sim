import type { CityId, MapDef, PlayerId } from '@dots-war-sim/core';
import * as v from 'valibot';
import { MapJsonSchema } from './schema.js';

export function loadMap(json: unknown): MapDef {
  const parsed = v.parse(MapJsonSchema, json);

  const { width, height, terrain, cities, spawns } = parsed;

  if (terrain.length !== width * height) {
    throw new Error(
      `terrain length ${terrain.length} does not match ${width}x${height} = ${width * height}`,
    );
  }

  for (let i = 0; i < terrain.length; i++) {
    const val = terrain[i]!;
    if (val < 0 || val > 3 || !Number.isInteger(val)) {
      throw new Error(
        `terrain[${i}] = ${val} is out of range (must be 0..3)`,
      );
    }
  }

  const cityIds = new Set(cities.map((c) => c.id));

  for (const city of cities) {
    if (city.pos.x < 0 || city.pos.x >= width) {
      throw new Error(
        `city ${city.id} pos.x = ${city.pos.x} is out of map bounds (0..${width - 1})`,
      );
    }
    if (city.pos.y < 0 || city.pos.y >= height) {
      throw new Error(
        `city ${city.id} pos.y = ${city.pos.y} is out of map bounds (0..${height - 1})`,
      );
    }
  }

  for (const spawn of spawns) {
    if (!cityIds.has(spawn.cityId)) {
      throw new Error(
        `spawn references cityId ${spawn.cityId} which does not exist`,
      );
    }
  }

  return {
    id: parsed.id,
    width,
    height,
    terrain,
    cities: cities.map((c) => ({
      id: c.id as CityId,
      pos: c.pos,
      production: c.production,
    })),
    spawns: spawns.map((s) => ({
      player: s.player as PlayerId,
      cityId: s.cityId as CityId,
    })),
  };
}
