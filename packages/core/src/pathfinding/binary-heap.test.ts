import { describe, expect, it } from 'vitest';
import { BinaryHeap } from './binary-heap.js';

describe('BinaryHeap', () => {
  it('pops the minimum value first', () => {
    const heap = new BinaryHeap<number>((a, b) => a - b);
    heap.push(5);
    heap.push(1);
    heap.push(3);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(3);
    expect(heap.pop()).toBe(5);
  });

  it('returns undefined when popping from empty heap', () => {
    const heap = new BinaryHeap<number>((a, b) => a - b);
    expect(heap.pop()).toBeUndefined();
    expect(heap.peek()).toBeUndefined();
  });

  it('pops 100 random elements in ascending order', () => {
    const heap = new BinaryHeap<number>((a, b) => a - b);
    const values: number[] = [];
    for (let i = 0; i < 100; i++) {
      values.push(((i * 7919 + 13) % 1000) | 0);
    }
    for (const v of values) heap.push(v);
    values.sort((a, b) => a - b);

    const result: number[] = [];
    while (heap.size > 0) result.push(heap.pop()!);
    expect(result).toEqual(values);
  });

  it('tracks size correctly through push and pop', () => {
    const heap = new BinaryHeap<number>((a, b) => a - b);
    expect(heap.size).toBe(0);
    heap.push(10);
    heap.push(20);
    expect(heap.size).toBe(2);
    heap.pop();
    expect(heap.size).toBe(1);
    heap.pop();
    expect(heap.size).toBe(0);
  });
});
