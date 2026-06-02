import type { GameState } from '../types.js';
import { TICK_RATE, UNIT_STATS, ATTACK_RANGE, ENGAGE_DISTANCE, ENGAGE_SPEED_FACTOR, TERRAIN_SPEED_PCT } from '../constants.js';
import { SpatialHash } from '../spatial-hash.js';

const WAYPOINT_THRESHOLD = 0.3;

export function moveUnits(state: GameState): void {
  const { units, map } = state;

  const hash = new SpatialHash(1, map.width, map.height);
  for (const u of units) {
    hash.insert(u.id, u.pos.x, u.pos.y);
  }

  const unitById = new Map(units.map((u, i) => [u.id as number, i]));

  const engageDistSq = ENGAGE_DISTANCE * ENGAGE_DISTANCE;
  const attackRangeSq = ATTACK_RANGE * ATTACK_RANGE;

  for (const unit of units) {
    if (unit.goal === null) continue;

    let speedFactor = 1.0;
    const nearby = hash.query(unit.pos.x, unit.pos.y, ENGAGE_DISTANCE);

    for (const candidateId of nearby) {
      if (candidateId === unit.id) continue;
      const idx = unitById.get(candidateId as number);
      if (idx === undefined) continue;
      const candidate = units[idx]!;
      if (candidate.owner === unit.owner) continue;

      const dx = candidate.pos.x - unit.pos.x;
      const dy = candidate.pos.y - unit.pos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= attackRangeSq) {
        speedFactor = 0.0;
        break;
      }
      if (distSq <= engageDistSq && speedFactor > ENGAGE_SPEED_FACTOR) {
        speedFactor = ENGAGE_SPEED_FACTOR;
      }
    }

    // Terrain movement-speed multiplier from the tile the unit currently occupies
    // (distinct from A* routing cost). Stacks multiplicatively with engagement slowdown.
    const tx = Math.floor(unit.pos.x);
    const ty = Math.floor(unit.pos.y);
    const ti = ty * map.width + tx;
    const terrainPct =
      ti >= 0 && ti < map.terrain.length
        ? TERRAIN_SPEED_PCT[unit.kind][map.terrain[ti]!] ?? 100
        : 100;
    const speed =
      (UNIT_STATS[unit.kind].speed / TICK_RATE) * speedFactor * (terrainPct / 100);
    if (speed < 1e-9) continue;

    if (unit.path !== null && unit.path.length > 0) {
      let remaining = speed;

      while (remaining > 1e-9 && unit.path.length > 0) {
        const wp = unit.path[0]!;
        const tx = wp.x + 0.5;
        const ty = wp.y + 0.5;
        const dx = tx - unit.pos.x;
        const dy = ty - unit.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < WAYPOINT_THRESHOLD) {
          unit.path.shift();
          continue;
        }

        const stepSize = Math.min(remaining, dist);
        unit.pos.x += (dx / dist) * stepSize;
        unit.pos.y += (dy / dist) * stepSize;
        remaining -= stepSize;

        if (dist - stepSize < WAYPOINT_THRESHOLD) {
          unit.path.shift();
        }
      }

      if (unit.path.length === 0) {
        unit.goal = null;
        unit.path = null;
      }
    } else {
      const dx = unit.goal.x - unit.pos.x;
      const dy = unit.goal.y - unit.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.05) {
        unit.goal = null;
        unit.path = null;
        continue;
      }

      const stepSize = Math.min(speed, dist);
      unit.pos.x += (dx / dist) * stepSize;
      unit.pos.y += (dy / dist) * stepSize;
    }
  }
}
