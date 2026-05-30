import { describe, expect, it } from 'vitest';
import type { MapDef, PlayerId } from '@dots-war-sim/core';
import firstBlood from './data/first-blood.json';
import bridgeJson from './data/bridge.json';
import fourCornersJson from './data/four-corners.json';
import straitJson from './data/strait.json';
import corridorJson from './data/corridor.json';
import { loadMap } from './loader.js';
import { MAP_CATALOG, getMapJson } from './index.js';

function makeValidMap() {
  return {
    id: 'test-map',
    width: 4,
    height: 3,
    terrain: [
      0, 0, 0, 0,
      0, 1, 1, 0,
      0, 0, 0, 0,
    ],
    cities: [
      { id: 0, pos: { x: 0, y: 0 }, production: 'light' as const },
      { id: 1, pos: { x: 3, y: 2 }, production: 'light' as const },
    ],
    spawns: [
      { player: 0, cityId: 0 },
      { player: 1, cityId: 1 },
    ],
  };
}

describe('loadMap', () => {
  it('returns a valid MapDef from correct JSON', () => {
    const map = loadMap(makeValidMap());
    expect(map.id).toBe('test-map');
    expect(map.width).toBe(4);
    expect(map.height).toBe(3);
    expect(map.terrain).toHaveLength(12);
    expect(map.cities).toHaveLength(2);
    expect(map.spawns).toHaveLength(2);
  });

  it('loads first-blood.json successfully', () => {
    const map = loadMap(firstBlood);
    expect(map.id).toBe('first-blood');
    expect(map.width).toBe(64);
    expect(map.height).toBe(36);
    expect(map.terrain).toHaveLength(64 * 36);
    expect(map.cities).toHaveLength(8);
    expect(map.spawns).toHaveLength(2);
  });

  it('throws when terrain length does not match width*height', () => {
    const data = makeValidMap();
    data.terrain = [0, 0, 0];
    expect(() => loadMap(data)).toThrow('terrain length');
  });

  it('throws when terrain contains out-of-range values', () => {
    const data = makeValidMap();
    data.terrain[5] = 99;
    expect(() => loadMap(data)).toThrow('out of range');
  });

  it('throws when city pos is outside map bounds', () => {
    const data = makeValidMap();
    data.cities[0]!.pos = { x: 10, y: 0 };
    expect(() => loadMap(data)).toThrow('out of map bounds');
  });

  it('throws when spawn references non-existent cityId', () => {
    const data = makeValidMap();
    data.spawns[0]!.cityId = 999;
    expect(() => loadMap(data)).toThrow('does not exist');
  });

  it('throws when required fields are missing', () => {
    expect(() => loadMap({})).toThrow();
    expect(() => loadMap({ id: 'x' })).toThrow();
    expect(() => loadMap(null)).toThrow();
  });

  it('throws when terrain contains negative values', () => {
    const data = makeValidMap();
    data.terrain[0] = -1;
    expect(() => loadMap(data)).toThrow('out of range');
  });
});

// --- P2-T5: new maps -------------------------------------------------------

// Flood fill over plain-only cells (4-neighbour) — the terrain a heavy unit
// may traverse (mountain/forest/water are all impassable for heavy).
function heavyReachable(map: MapDef, sx: number, sy: number): Uint8Array {
  const { width, height, terrain } = map;
  const seen = new Uint8Array(width * height);
  const start = sy * width + sx;
  if (terrain[start] !== 0) return seen;
  seen[start] = 1;
  const stack: [number, number][] = [[sx, sy]];
  const nbr: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of nbr) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = ny * width + nx;
      if (seen[ni] || terrain[ni] !== 0) continue;
      seen[ni] = 1;
      stack.push([nx, ny]);
    }
  }
  return seen;
}

const NEW_MAPS = [
  { json: bridgeJson, id: 'bridge', width: 48, height: 36, cityCount: 6, sym: 'mirror' },
  { json: fourCornersJson, id: 'four-corners', width: 48, height: 48, cityCount: 8, sym: 'rot90' },
  { json: straitJson, id: 'strait', width: 64, height: 36, cityCount: 6, sym: 'mirror' },
  { json: corridorJson, id: 'corridor', width: 64, height: 36, cityCount: 6, sym: 'mirror' },
] as const;

describe.each(NEW_MAPS)('map $id', (spec) => {
  const map = loadMap(spec.json);

  it('loads with the expected dimensions', () => {
    expect(map.id).toBe(spec.id);
    expect(map.width).toBe(spec.width);
    expect(map.height).toBe(spec.height);
    expect(map.terrain).toHaveLength(spec.width * spec.height);
    expect(map.cities).toHaveLength(spec.cityCount);
    expect(map.spawns).toHaveLength(2);
  });

  it('has terrain values in 0..3', () => {
    for (const v of map.terrain) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  it('places every city in bounds and on plain', () => {
    for (const c of map.cities) {
      expect(c.pos.x).toBeGreaterThanOrEqual(0);
      expect(c.pos.x).toBeLessThan(map.width);
      expect(c.pos.y).toBeGreaterThanOrEqual(0);
      expect(c.pos.y).toBeLessThan(map.height);
      const idx = Math.floor(c.pos.y) * map.width + Math.floor(c.pos.x);
      expect(map.terrain[idx]).toBe(0);
    }
  });

  it('references existing cities from its spawns and splits cities evenly', () => {
    const ids = new Set(map.cities.map((c) => c.id));
    const spawnOwner = new Map(map.spawns.map((s) => [s.cityId, s.player]));
    for (const s of map.spawns) expect(ids.has(s.cityId)).toBe(true);
    let p0 = 0;
    let p1 = 0;
    for (const c of map.cities) {
      const owner = spawnOwner.get(c.id) ?? c.owner;
      if (owner === (0 as PlayerId)) p0++;
      else if (owner === (1 as PlayerId)) p1++;
    }
    expect(p0).toBe(spec.cityCount / 2);
    expect(p1).toBe(spec.cityCount / 2);
  });

  it(`is ${spec.sym}-symmetric (fair for both players)`, () => {
    const { width, height, terrain } = map;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mirrored =
          spec.sym === 'rot90'
            ? terrain[x * width + (width - 1 - y)] // 90° rotation (square map)
            : terrain[y * width + (width - 1 - x)]; // left/right mirror
        expect(terrain[y * width + x]).toBe(mirrored);
      }
    }
  });

  it('lets a heavy unit reach every city from each spawn (plain connectivity)', () => {
    for (const s of map.spawns) {
      const spawnCity = map.cities.find((c) => c.id === s.cityId)!;
      const seen = heavyReachable(
        map,
        Math.floor(spawnCity.pos.x),
        Math.floor(spawnCity.pos.y),
      );
      for (const c of map.cities) {
        const idx = Math.floor(c.pos.y) * map.width + Math.floor(c.pos.x);
        expect(seen[idx]).toBe(1);
      }
    }
  });
});

describe('MAP_CATALOG / getMapJson', () => {
  it('exposes all five selectable maps', () => {
    expect(MAP_CATALOG.map((m) => m.id)).toEqual([
      'first-blood',
      'bridge',
      'four-corners',
      'strait',
      'corridor',
    ]);
  });

  it('resolves every catalog id to a loadable map', () => {
    for (const entry of MAP_CATALOG) {
      const map = loadMap(getMapJson(entry.id));
      expect(map.id).toBe(entry.id);
    }
  });

  it('falls back to first-blood for an unknown id', () => {
    expect(loadMap(getMapJson('does-not-exist')).id).toBe('first-blood');
  });
});
