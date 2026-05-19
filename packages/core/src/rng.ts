export class Rng {
  private _state: number;

  constructor(seed: number) {
    this._state = seed >>> 0;
  }

  next(): number {
    this._state = (this._state + 0x6d2b79f5) >>> 0;
    let t = this._state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  state(): number {
    return this._state;
  }

  static restore(s: number): Rng {
    return new Rng(s);
  }
}
