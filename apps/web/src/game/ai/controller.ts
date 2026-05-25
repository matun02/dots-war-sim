import type {
  GameState,
  Command,
  PlayerId,
  City,
  Unit,
  Vec2,
  EntityId,
} from '@dots-war-sim/core';
import {
  computeInfluenceMap,
  computeInfluenceDiff,
  type InfluenceData,
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
const INFLUENCE_INTERVAL = 5;
const ECONOMY_DISADVANTAGE_THRESHOLD = 0.4;
const HEAVY_PRODUCTION_MIN_CITIES = 3;

export interface AIController {
  update(state: GameState): Command[];
}

export function createAIController(
  playerId: PlayerId,
  difficulty: AIDifficulty,
  rng: Rng,
): AIController {
  const config = DIFFICULTY_CONFIG[difficulty];
  let cachedInfluence: InfluenceData | null = null;
  let lastInfluenceTick = -Infinity;

  function getInfluence(state: GameState): InfluenceData {
    if (state.tick - lastInfluenceTick >= INFLUENCE_INTERVAL) {
      cachedInfluence = computeInfluenceMap(state);
      lastInfluenceTick = state.tick;
    }
    return cachedInfluence!;
  }

  function findEnemyId(state: GameState): PlayerId | null {
    for (const p of state.players) {
      if (p.id !== playerId && p.alive) return p.id;
    }
    return null;
  }

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

      const enemyId = findEnemyId(state);
      if (enemyId === null) {
        handleOffense(state, playerId, myUnits, available, config, rng, commands);
        return commands;
      }

      const influence = getInfluence(state);
      const myCities = state.cities.filter((c) => c.owner === playerId);
      const enemyCities = state.cities.filter((c) => c.owner === enemyId);
      const economyRatio =
        myCities.length + enemyCities.length > 0
          ? myCities.length / (myCities.length + enemyCities.length)
          : 0.5;

      if (economyRatio < ECONOMY_DISADVANTAGE_THRESHOLD) {
        handleOffense(state, playerId, myUnits, available, config, rng, commands);
      } else {
        handleFrontlinePush(
          state,
          playerId,
          enemyId,
          influence,
          myUnits,
          available,
          config,
          rng,
          commands,
        );
      }

      handleHeavyProduction(state, playerId, enemyId, influence, myCities, commands);

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

  const selectedIds = selectUnits(idleUnits, config, rng);
  if (selectedIds.length === 0) return;

  commands.push({
    type: 'move',
    player: playerId,
    ids: selectedIds,
    to: bestTarget.pos,
  });
}

function handleFrontlinePush(
  state: GameState,
  playerId: PlayerId,
  enemyId: PlayerId,
  influence: InfluenceData,
  myUnits: Unit[],
  idleUnits: Unit[],
  config: AIConfig,
  rng: Rng,
  commands: Command[],
): void {
  const diff = computeInfluenceDiff(influence, enemyId, playerId);
  const { width, height } = influence;
  const midX = width / 2;
  const midY = height / 2;

  let topSum = 0;
  let bottomSum = 0;
  let leftSum = 0;
  let rightSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = diff[y * width + x]!;
      if (val <= 0) continue;
      if (y < midY) topSum += val;
      if (y >= midY) bottomSum += val;
      if (x < midX) leftSum += val;
      if (x >= midX) rightSum += val;
    }
  }
  const sectorSums = [topSum, bottomSum, leftSum, rightSum];

  let maxSector = 0;
  for (let i = 1; i < 4; i++) {
    if (sectorSums[i]! > sectorSums[maxSector]!) maxSector = i;
  }

  const hasEnemyPressure = sectorSums[maxSector]! > 0;

  if (hasEnemyPressure) {
    const targetPos = getSectorTarget(state, playerId, maxSector, width, height);
    const selectedIds = selectUnits(idleUnits, config, rng);
    if (selectedIds.length === 0) return;

    commands.push({
      type: 'move',
      player: playerId,
      ids: selectedIds,
      to: targetPos,
    });
  } else {
    handleOffense(state, playerId, myUnits, idleUnits, config, rng, commands);
  }
}

function getSectorTarget(
  state: GameState,
  playerId: PlayerId,
  sector: number,
  mapWidth: number,
  mapHeight: number,
): Vec2 {
  const enemyCitiesInSector = state.cities.filter((c) => {
    if (c.owner === playerId) return false;
    const midX = mapWidth / 2;
    const midY = mapHeight / 2;
    switch (sector) {
      case 0:
        return c.pos.y < midY;
      case 1:
        return c.pos.y >= midY;
      case 2:
        return c.pos.x < midX;
      case 3:
        return c.pos.x >= midX;
      default:
        return false;
    }
  });

  if (enemyCitiesInSector.length > 0) {
    enemyCitiesInSector.sort((a, b) => a.id - b.id);
    return enemyCitiesInSector[0]!.pos;
  }

  const midX = mapWidth / 2;
  const midY = mapHeight / 2;
  switch (sector) {
    case 0:
      return { x: midX, y: Math.floor(midY * 0.5) };
    case 1:
      return { x: midX, y: Math.floor(midY * 1.5) };
    case 2:
      return { x: Math.floor(midX * 0.5), y: midY };
    case 3:
      return { x: Math.floor(midX * 1.5), y: midY };
    default:
      return { x: midX, y: midY };
  }
}

function handleHeavyProduction(
  state: GameState,
  playerId: PlayerId,
  enemyId: PlayerId,
  influence: InfluenceData,
  myCities: City[],
  commands: Command[],
): void {
  if (myCities.length < HEAVY_PRODUCTION_MIN_CITIES) {
    for (const city of myCities) {
      if (city.production === 'heavy') {
        commands.push({
          type: 'set-production',
          player: playerId,
          cityId: city.id,
          production: 'light',
        });
      }
    }
    return;
  }

  const diff = computeInfluenceDiff(influence, enemyId, playerId);
  let enemyPressure = 0;
  for (let i = 0; i < diff.length; i++) {
    if (diff[i]! > 0) enemyPressure += diff[i]!;
  }
  const frontlineStable = enemyPressure === 0;

  const targetProduction = frontlineStable ? 'heavy' : 'light';
  for (const city of myCities) {
    if (city.production !== targetProduction) {
      commands.push({
        type: 'set-production',
        player: playerId,
        cityId: city.id,
        production: targetProduction,
      });
    }
  }
}

function selectUnits(idleUnits: Unit[], config: AIConfig, rng: Rng): EntityId[] {
  const selectedIds: EntityId[] = [];
  for (const u of idleUnits) {
    if (rng.next() < config.selectionAccuracy) {
      selectedIds.push(u.id);
    }
  }
  selectedIds.sort((a, b) => a - b);
  return selectedIds;
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
    const score = dist > 0 ? 1 / dist : 1;
    targets.push({ pos: c.pos, score, id: c.id });
  }
  targets.sort((a, b) => b.score - a.score || a.id - b.id);
  return targets;
}
