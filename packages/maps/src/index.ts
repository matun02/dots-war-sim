export { loadMap } from './loader.js';
export { MapJsonSchema } from './schema.js';

import firstBloodJson from './data/first-blood.json';
import bridgeJson from './data/bridge.json';
import fourCornersJson from './data/four-corners.json';
import straitJson from './data/strait.json';
import corridorJson from './data/corridor.json';
import velnCorridorJson from './data/veln-corridor.json';

export {
  firstBloodJson,
  bridgeJson,
  fourCornersJson,
  straitJson,
  corridorJson,
  velnCorridorJson,
};

export interface MapCatalogEntry {
  id: string;
  name: string;
  size: string;
}

/** Selectable maps, in title-screen display order. */
export const MAP_CATALOG: readonly MapCatalogEntry[] = [
  { id: 'first-blood', name: 'First Blood', size: '64×36' },
  { id: 'bridge', name: 'Bridge', size: '48×36' },
  { id: 'four-corners', name: 'Four Corners', size: '48×48' },
  { id: 'strait', name: 'Strait', size: '64×36' },
  { id: 'corridor', name: 'Corridor', size: '64×36' },
  { id: 'veln-corridor', name: 'Veln Corridor', size: '64×36' },
];

const MAP_JSON: Record<string, unknown> = {
  'first-blood': firstBloodJson,
  bridge: bridgeJson,
  'four-corners': fourCornersJson,
  strait: straitJson,
  corridor: corridorJson,
  'veln-corridor': velnCorridorJson,
};

/**
 * Resolve a map id to its raw JSON (pass to `loadMap`). Unknown ids fall back
 * to first-blood so callers (UI selection, replay playback) never crash on a
 * stale or invalid id.
 */
export function getMapJson(id: string): unknown {
  return MAP_JSON[id] ?? firstBloodJson;
}
