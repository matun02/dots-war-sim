import type { GameState } from '../types.js';
import type { Rng } from '../../rng.js';
import { ATTACK_RANGE, UNIT_STATS } from '../constants.js';
import { SpatialHash } from '../spatial-hash.js';

export function resolveCombat(state: GameState, _rng: Rng): void {
  const { units, map } = state;
  if (units.length === 0) return;

  const hash = new SpatialHash(1, map.width, map.height);
  for (const u of units) {
    hash.insert(u.id, u.pos.x, u.pos.y);
  }

  const unitById: number[] = [];
  units.sort((a, b) => (a.id as number) - (b.id as number));
  for (let i = 0; i < units.length; i++) {
    const u = units[i]!;
    unitById[u.id as number] = i;
  }

  const rangeSquared = ATTACK_RANGE * ATTACK_RANGE;

  for (let i = 0; i < units.length; i++) {
    const attacker = units[i]!;

    if (attacker.attackCooldownTicks > 0) {
      attacker.attackCooldownTicks--;
    }
    if (attacker.attackCooldownTicks > 0) {
      continue;
    }

    const nearby = hash.query(attacker.pos.x, attacker.pos.y, ATTACK_RANGE);

    let bestIdx: number = -1;
    let bestDistSq = Infinity;
    let bestId = Infinity;

    for (const candidateId of nearby) {
      if (candidateId === attacker.id) continue;

      const idx = unitById[candidateId as number];
      if (idx === undefined) continue;
      const candidate = units[idx]!;
      if (candidate.owner === attacker.owner) continue;

      const dx = candidate.pos.x - attacker.pos.x;
      const dy = candidate.pos.y - attacker.pos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > rangeSquared) continue;

      if (
        distSq < bestDistSq ||
        (distSq === bestDistSq && (candidateId as number) < bestId)
      ) {
        bestDistSq = distSq;
        bestIdx = idx;
        bestId = candidateId as number;
      }
    }

    if (bestIdx === -1) continue;

    const target = units[bestIdx]!;
    target.hp -= UNIT_STATS[attacker.kind].attack;
    attacker.attackCooldownTicks = UNIT_STATS[attacker.kind].attackIntervalTicks;
  }
}
