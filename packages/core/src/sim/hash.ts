import type { GameState } from './types.js';

export function hashState(state: GameState): number {
  let h = 0;
  h ^= state.tick | 0;

  const sortedUnits = state.units.slice().sort((a, b) => a.id - b.id);
  for (const u of sortedUnits) {
    const px = Math.round(u.pos.x * 10) | 0;
    const py = Math.round(u.pos.y * 10) | 0;
    const hp = u.hp | 0;
    const owner = (u.owner as number) | 0;
    h ^= ((px * 73856093) ^ (py * 19349663) ^ (hp * 83492791) ^ (owner * 4256249)) | 0;
  }

  const sortedCities = state.cities.slice().sort((a, b) => a.id - b.id);
  for (const c of sortedCities) {
    const owner = c.owner === null ? -1 : (c.owner as number) | 0;
    const supply = c.supplyUsed | 0;
    h ^= ((owner * 56843189) ^ (supply * 15485863)) | 0;
  }

  return h | 0;
}
