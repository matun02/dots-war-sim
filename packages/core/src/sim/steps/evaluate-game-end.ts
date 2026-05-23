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

  for (let i = 0; i < alivePlayers.length; i++) {
    const pid = alivePlayers[i]!;
    if (state.cities.every((c) => c.owner === pid)) {
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
