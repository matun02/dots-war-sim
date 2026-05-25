import { describe, expect, it } from 'vitest';
import firstBlood from './data/first-blood.json';
import { loadMap } from './loader.js';

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
