import type {
  GameState,
  Command,
  PlayerId,
  City,
  Unit,
  Vec2,
  EntityId,
} from '@dots-war-sim/core';
import type { Rng } from '@dots-war-sim/core';

export type AIDifficulty = 'easy' | 'normal' | 'hard';

interface AIConfig {
  thinkIntervalTicks: number;
  selectionAccuracy: number;
}

const DIFFICULTY_CONFIG: Record<AIDifficulty, AIConfig> = {
  easy: { thinkIntervalTicks: 90, selectionAccuracy: 0.7 },
  normal: { thinkIntervalTicks: 30, selectionAccuracy: 0.85 },
  hard: { thinkIntervalTicks: 1, selectionAccuracy: 0.95 },
};

const DEFENSE_RADIUS = 15;
const NEUTRAL_WEIGHT = 1.5;
const ENEMY_WEIGHT = 1.0;

export interface AIController {
  update(state: GameState): Command[];
}

export function createAIController(
  playerId: PlayerId,
  difficulty: AIDifficulty,
  rng: Rng,
): AIController {
  const config = DIFFICULTY_CONFIG[difficulty];

  return {
    update(state: GameState): Command[] {
      if (state.result !== null) return [];
      if (state.tick % config.thinkIntervalTicks !== 0) return [];

      const myUnits = state.units.filter((u) => u.owner === playerId);
      const idleUnits = myUnits.filter((u) => u.goal === null);
      if (idleUnits.length === 0) return [];

      const commands: Command[] = [];
      let available = idleUnits;

      available = handleDefense(state, playerId, available, commands);
      if (available.length === 0) return commands;

      handleOffense(state, playerId, myUnits, available, config, rng, commands);

      return commands;
    },
  };
}

function handleDefense(
  state: GameState,
  playerId: PlayerId,
  idleUnits: Unit[],
  commands: Command[],
): Unit[] {
  const threatened = state.cities.filter(
    (c) => c.owner === playerId && c.captureProgressTicks > 0,
  );
  if (threatened.length === 0) return idleUnits;

  const usedIds = new Set<EntityId>();

  for (const city of threatened) {
    const defenders: EntityId[] = [];
    for (const u of idleUnits) {
      if (usedIds.has(u.id)) continue;
      const dist = Math.hypot(u.pos.x - city.pos.x, u.pos.y - city.pos.y);
      if (dist < DEFENSE_RADIUS) {
        defenders.push(u.id);
        usedIds.add(u.id);
      }
    }
    if (defenders.length > 0) {
      defenders.sort((a, b) => a - b);
      commands.push({
        type: 'move',
        player: playerId,
        ids: defenders,
        to: city.pos,
      });
    }
  }

  return idleUnits.filter((u) => !usedIds.has(u.id));
}

function handleOffense(
  state: GameState,
  playerId: PlayerId,
  myUnits: Unit[],
  idleUnits: Unit[],
  config: AIConfig,
  rng: Rng,
  commands: Command[],
): void {
  const avgPos = computeCenter(state, playerId, myUnits);
  if (avgPos === null) return;

  const targets = scoreTargets(state.cities, playerId, avgPos);
  const bestTarget = targets[0];
  if (bestTarget === undefined) return;

  const selectedIds: EntityId[] = [];
  for (const u of idleUnits) {
    if (rng.next() < config.selectionAccuracy) {
      selectedIds.push(u.id);
    }
  }

  if (selectedIds.length === 0) return;

  selectedIds.sort((a, b) => a - b);
  commands.push({
    type: 'move',
    player: playerId,
    ids: selectedIds,
    to: bestTarget.pos,
  });
}

function computeCenter(
  state: GameState,
  playerId: PlayerId,
  myUnits: Unit[],
): Vec2 | null {
  const myCities = state.cities.filter((c) => c.owner === playerId);
  if (myCities.length > 0) {
    return {
      x: myCities.reduce((s, c) => s + c.pos.x, 0) / myCities.length,
      y: myCities.reduce((s, c) => s + c.pos.y, 0) / myCities.length,
    };
  }
  if (myUnits.length > 0) {
    return {
      x: myUnits.reduce((s, u) => s + u.pos.x, 0) / myUnits.length,
      y: myUnits.reduce((s, u) => s + u.pos.y, 0) / myUnits.length,
    };
  }
  return null;
}

interface ScoredCity {
  pos: Vec2;
  score: number;
  id: number;
}

function scoreTargets(
  cities: City[],
  playerId: PlayerId,
  avgPos: Vec2,
): ScoredCity[] {
  const targets: ScoredCity[] = [];
  for (const c of cities) {
    if (c.owner === playerId) continue;
    const dist = Math.hypot(c.pos.x - avgPos.x, c.pos.y - avgPos.y);
    const weight = c.owner === null ? NEUTRAL_WEIGHT : ENEMY_WEIGHT;
    const score = dist > 0 ? (1 / dist) * weight : weight;
    targets.push({ pos: c.pos, score, id: c.id });
  }
  targets.sort((a, b) => b.score - a.score || a.id - b.id);
  return targets;
}
