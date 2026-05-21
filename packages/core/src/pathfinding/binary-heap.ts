export class BinaryHeap<T> {
  private readonly data: T[] = [];
  private readonly cmp: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.cmp = comparator;
  }

  get size(): number {
    return this.data.length;
  }

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    const { data } = this;
    if (data.length === 0) return undefined;
    const top = data[0]!;
    const last = data.pop() as T;
    if (data.length > 0) {
      data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  private bubbleUp(i: number): void {
    const { data, cmp } = this;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (cmp(data[i]!, data[parent]!) >= 0) break;
      const tmp = data[i]!;
      data[i] = data[parent]!;
      data[parent] = tmp;
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const { data, cmp } = this;
    const len = data.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < len && cmp(data[left]!, data[smallest]!) < 0) smallest = left;
      if (right < len && cmp(data[right]!, data[smallest]!) < 0)
        smallest = right;
      if (smallest === i) break;
      const tmp = data[i]!;
      data[i] = data[smallest]!;
      data[smallest] = tmp;
      i = smallest;
    }
  }
}
