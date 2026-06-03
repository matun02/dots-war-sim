import type { GameState, PlayerId } from '../types.js';
import { GAME_TIME_LIMIT_TICKS } from '../constants.js';

export function evaluateGameEnd(state: GameState): void {
  if (state.result !== null) return;

  const alivePlayers: PlayerId[] = [];

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i]!;
    if (!p.alive) continue;

    const hasCities = state.cities.some((c) => c.owner === p.id);
    const hasUnits = state.units.some((u) => u.owner === p.id);

    if (!hasCities && !hasUnits) {
      p.alive = false;
      continue;
    }

    alivePlayers.push(p.id);
  }

  const totalCities = state.cities.length;
  for (let i = 0; i < alivePlayers.length; i++) {
    const pid = alivePlayers[i]!;
    let ownedCities = 0;
    for (let j = 0; j < state.cities.length; j++) {
      if (state.cities[j]!.owner === pid) ownedCities++;
    }
    // 80% 以上の都市を支配で domination 勝利。
    // ownedCities / totalCities >= 0.8 を整数演算で表現（浮動小数を避け決定論維持）。
    if (ownedCities * 5 >= totalCities * 4) {
      state.result = { type: 'victory', winner: pid, reason: 'domination' };
      return;
    }
  }

  if (alivePlayers.length === 1) {
    state.result = {
      type: 'victory',
      winner: alivePlayers[0]!,
      reason: 'annihilation',
    };
    return;
  }

  if (state.tick >= GAME_TIME_LIMIT_TICKS) {
    let bestPid = alivePlayers[0]!;
    let bestCount = 0;
    let tied = false;

    for (let i = 0; i < alivePlayers.length; i++) {
      const pid = alivePlayers[i]!;
      let count = 0;
      for (let j = 0; j < state.cities.length; j++) {
        if (state.cities[j]!.owner === pid) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        bestPid = pid;
        tied = false;
      } else if (count === bestCount) {
        tied = true;
      }
    }

    if (tied) {
      state.result = { type: 'draw' };
    } else {
      state.result = {
        type: 'victory',
        winner: bestPid,
        reason: 'timeout',
      };
    }
  }
}
