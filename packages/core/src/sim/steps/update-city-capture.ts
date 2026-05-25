import type { GameState, PlayerId } from '../types.js';
import {
  CAPTURE_TICKS,
  POST_CAPTURE_COOLDOWN_TICKS,
} from '../constants.js';

export function updateCityCapture(state: GameState): void {
  const { cities, units } = state;

  for (const city of cities) {
    const factions: PlayerId[] = [];
    const counts: number[] = [];

    for (const u of units) {
      if (
        Math.floor(u.pos.x) === city.pos.x &&
        Math.floor(u.pos.y) === city.pos.y
      ) {
        let found = false;
        for (let fi = 0; fi < factions.length; fi++) {
          if (factions[fi] === u.owner) {
            counts[fi]!++;
            found = true;
            break;
          }
        }
        if (!found) {
          factions.push(u.owner);
          counts.push(1);
        }
      }
    }

    if (factions.length === 0 || factions.length > 1) {
      city.captureProgressTicks = 0;
      city.capturingPlayer = null;
      continue;
    }

    const faction = factions[0]!;

    if (city.owner === faction) {
      city.captureProgressTicks = 0;
      city.capturingPlayer = null;
      continue;
    }

    if (city.capturingPlayer === faction) {
      city.captureProgressTicks++;
    } else {
      city.capturingPlayer = faction;
      city.captureProgressTicks = 1;
    }

    if (city.captureProgressTicks >= CAPTURE_TICKS) {
      city.owner = faction;
      city.capturingPlayer = null;
      city.captureProgressTicks = 0;
      city.produceCooldownTicks = POST_CAPTURE_COOLDOWN_TICKS;
    }
  }
}
