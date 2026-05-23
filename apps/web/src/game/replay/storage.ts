import { get, set, del, keys, type UseStore, createStore } from 'idb-keyval';
import type { Replay } from '@dots-war-sim/core';

const store: UseStore = createStore('dots-war-sim-replays', 'replays');

export async function saveReplay(replay: Replay): Promise<void> {
  await set(replay.createdAt, replay, store);
}

export async function listReplays(): Promise<Replay[]> {
  const allKeys = (await keys(store)) as number[];
  allKeys.sort((a, b) => b - a);
  const results: Replay[] = [];
  for (const key of allKeys) {
    const replay = await get<Replay>(key, store);
    if (replay) results.push(replay);
  }
  return results;
}

export async function getReplay(
  createdAt: number,
): Promise<Replay | undefined> {
  return get<Replay>(createdAt, store);
}

export async function deleteReplay(createdAt: number): Promise<void> {
  await del(createdAt, store);
}
