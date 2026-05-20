import { type Application, Container, Graphics } from 'pixi.js';
import type { City } from '@war-of-dots/core';

const PLAYER_COLORS: Record<number, number> = {
  0: 0x4488ff, // blue
  1: 0xff8844, // orange
};

const NEUTRAL_COLOR = 0x888888;

export function drawCities(
  app: Application,
  cities: readonly City[],
  cellPx: number,
): Container {
  const container = new Container();
  const radius = cellPx * 0.4;

  for (const city of cities) {
    const cx = city.pos.x * cellPx + cellPx / 2;
    const cy = city.pos.y * cellPx + cellPx / 2;

    const g = new Graphics();

    const borderColor =
      city.owner !== null
        ? (PLAYER_COLORS[city.owner] ?? NEUTRAL_COLOR)
        : NEUTRAL_COLOR;

    g.circle(cx, cy, radius);
    g.fill(0xffffff);
    g.circle(cx, cy, radius);
    g.stroke({ width: 2, color: borderColor });

    container.addChild(g);
  }

  app.stage.addChild(container);
  return container;
}
