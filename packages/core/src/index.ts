/**
 * @war-of-dots/core
 *
 * Pure-TypeScript simulation, pathfinding, RNG, and shared types
 * for the War of Dots clone. Must remain free of DOM / Node / framework
 * dependencies (see CLAUDE.md §3.1, §4.3).
 */

export const VERSION = '0.0.0';
export { Rng } from './rng.js';
export * from './sim/index.js';
export { findPath, BinaryHeap } from './pathfinding/index.js';
export { REPLAY_VERSION } from './replay.js';
export type { Replay, ReplayPlayer } from './replay.js';
