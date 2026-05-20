import type { GameState, InputFrame } from '../types.js';

export function applyInputs(
  state: GameState,
  inputs: readonly InputFrame[],
): void {
  for (const frame of inputs) {
    for (const cmd of frame.commands) {
      switch (cmd.type) {
        case 'move':
          for (const id of cmd.ids) {
            const unit = state.units.find(
              (u) => u.id === id && u.owner === cmd.player,
            );
            if (unit) {
              unit.goal = { x: cmd.to.x, y: cmd.to.y };
              unit.path = null;
            }
          }
          break;

        case 'select':
          // Selection is client-only; sim does nothing
          break;

        case 'line':
          // Not implemented in P1-T9
          break;
      }
    }
  }
}
