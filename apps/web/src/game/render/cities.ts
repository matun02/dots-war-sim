import { type Application, Container, Graphics } from 'pixi.js';
import type { City } from '@dots-war-sim/core';

const PLAYER_COLORS: Record<number, number> = {
  0: 0x4488ff, // blue
  1: 0xff8844, // orange
};

const NEUTRAL_COLOR = 0x888888;

export function createCityRenderer(
  app: Application,
  cellPx: number,
): {
  update(cities: readonly City[]): void;
  container: Container;
} {
  const container = new Container();
  const radius = cellPx * 0.4;
  const graphics: Graphics[] = [];

  app.stage.addChild(container);

  return {
    container,
    update(cities) {
      while (graphics.length < cities.length) {
        const g = new Graphics();
        container.addChild(g);
        graphics.push(g);
      }

      for (let i = 0; i < cities.length; i++) {
        const city = cities[i]!;
        const g = graphics[i]!;
        g.clear();

        const cx = city.pos.x * cellPx + cellPx / 2;
        const cy = city.pos.y * cellPx + cellPx / 2;

        const borderColor =
          city.owner !== null
            ? (PLAYER_COLORS[city.owner] ?? NEUTRAL_COLOR)
            : NEUTRAL_COLOR;

        g.circle(cx, cy, radius);
        g.fill(0xffffff);
        g.circle(cx, cy, radius);
        g.stroke({ width: 2, color: borderColor });
      }
    },
  };
}

/** @deprecated Use createCityRenderer instead */
export function drawCities(
  app: Application,
  cities: readonly City[],
  cellPx: number,
): Container {
  const renderer = createCityRenderer(app, cellPx);
  renderer.update(cities);
  return renderer.container;
}
