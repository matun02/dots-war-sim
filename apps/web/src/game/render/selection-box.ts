import { type Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@war-of-dots/core';

const FILL_COLOR = 0x4488ff;
const FILL_ALPHA = 0.15;
const STROKE_COLOR = 0x4488ff;
const STROKE_ALPHA = 0.6;

export function createSelectionRenderer(
  _app: Application,
  cellPx: number,
): {
  show(startWorld: Vec2, endWorld: Vec2): void;
  hide(): void;
  container: Container;
} {
  const container = new Container();
  const gfx = new Graphics();
  container.addChild(gfx);
  gfx.visible = false;

  return {
    container,

    show(startWorld: Vec2, endWorld: Vec2): void {
      const x0 = Math.min(startWorld.x, endWorld.x) * cellPx;
      const y0 = Math.min(startWorld.y, endWorld.y) * cellPx;
      const w = Math.abs(endWorld.x - startWorld.x) * cellPx;
      const h = Math.abs(endWorld.y - startWorld.y) * cellPx;

      gfx.clear();
      gfx.rect(x0, y0, w, h);
      gfx.fill({ color: FILL_COLOR, alpha: FILL_ALPHA });
      gfx.stroke({ color: STROKE_COLOR, alpha: STROKE_ALPHA, width: 1 });
      gfx.visible = true;
    },

    hide(): void {
      gfx.clear();
      gfx.visible = false;
    },
  };
}
