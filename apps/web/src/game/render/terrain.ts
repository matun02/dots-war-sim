import { type Application, Container, Graphics } from 'pixi.js';
import type { MapDef } from '@war-of-dots/core';

const TERRAIN_COLORS: Record<number, number> = {
  0: 0x1e2d1e, // plain
  1: 0x3a3a3a, // mountain
  2: 0x0e3a0e, // forest
  3: 0x0e2740, // water
};

export function drawTerrain(
  app: Application,
  map: MapDef,
  cellPx: number,
): Container {
  const container = new Container();
  const { width, height, terrain } = map;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = terrain[y * width + x] ?? 0;
      const color = TERRAIN_COLORS[val] ?? TERRAIN_COLORS[0]!;
      const g = new Graphics();
      g.rect(x * cellPx, y * cellPx, cellPx, cellPx);
      g.fill(color);
      container.addChild(g);
    }
  }

  app.stage.addChild(container);
  return container;
}
