import type { GameState, InputFrame } from './types.js';
import type { Rng } from '../rng.js';
import { applyInputs } from './steps/apply-inputs.js';
import { recomputePaths } from './steps/recompute-paths.js';
import { moveUnits } from './steps/move-units.js';
import { separateUnits } from './steps/separate-units.js';
import { resolveCombat } from './steps/resolve-combat.js';
import { removeDead } from './steps/remove-dead.js';
import { updateCityCapture } from './steps/update-city-capture.js';
import { produceUnits } from './steps/produce-units.js';
import { evaluateGameEnd } from './steps/evaluate-game-end.js';

export function tick(
  state: GameState,
  inputs: readonly InputFrame[],
  rng: Rng,
): GameState {
  const s: GameState = structuredClone(state);
  s.tick++;

  applyInputs(s, inputs);
  recomputePaths(s);
  moveUnits(s);
  separateUnits(s);
  resolveCombat(s, rng);
  removeDead(s);
  updateCityCapture(s);
  produceUnits(s, rng);
  evaluateGameEnd(s);

  return s;
}
