import { describe, it, expect } from 'vitest';
import { SpatialHash } from './spatial-hash.js';
import type { EntityId } from './types.js';

function eid(n: number): EntityId {
  return n as EntityId;
}

describe('SpatialHash', () => {
  it('returns empty array when querying empty hash', () => {
    const hash = new SpatialHash(1, 10, 10);
    expect(hash.query(5, 5, 2)).toEqual([]);
  });

  it('returns inserted element within radius', () => {
    const hash = new SpatialHash(1, 10, 10);
    hash.insert(eid(1), 5, 5);
    const result = hash.query(5, 5, 1);
    expect(result).toEqual([eid(1)]);
  });

  it('excludes elements outside radius', () => {
    const hash = new SpatialHash(1, 20, 20);
    hash.insert(eid(1), 0, 0);
    hash.insert(eid(2), 15, 15);
    const result = hash.query(0, 0, 2);
    expect(result).toEqual([eid(1)]);
  });

  it('returns all elements in the same cell', () => {
    const hash = new SpatialHash(1, 10, 10);
    hash.insert(eid(1), 3.2, 4.7);
    hash.insert(eid(2), 3.8, 4.1);
    const result = hash.query(3.5, 4.5, 1);
    expect(result).toContain(eid(1));
    expect(result).toContain(eid(2));
  });

  it('returns results sorted by id ascending', () => {
    const hash = new SpatialHash(1, 10, 10);
    hash.insert(eid(5), 3, 3);
    hash.insert(eid(2), 3, 3);
    hash.insert(eid(9), 3, 3);
    hash.insert(eid(1), 3, 3);
    const result = hash.query(3, 3, 1);
    expect(result).toEqual([eid(1), eid(2), eid(5), eid(9)]);
  });
});
