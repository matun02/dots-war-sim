import type { PlayerId, GameResult, InputFrame } from './sim/types.js';

export const REPLAY_VERSION = 1;

export interface ReplayPlayer {
  id: PlayerId;
  name: string;
  type: 'human' | 'ai';
}

export interface Replay {
  version: number;
  seed: number;
  mapId: string;
  players: ReplayPlayer[];
  inputs: InputFrame[];
  finalTick: number;
  result: GameResult;
  createdAt: number;
}
