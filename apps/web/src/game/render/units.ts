import {
  type Application,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from 'pixi.js';
import type { Unit } from '@war-of-dots/core';

const PLAYER_COLORS: Record<number, number> = {
  0: 0x4488ff,
  1: 0xff8844,
};

const FALLBACK_COLOR = 0xcccccc;

export function createUnitRenderer(
  app: Application,
  cellPx: number,
): {
  update(
    prevUnits: readonly Unit[],
    curUnits: readonly Unit[],
    alpha: number,
  ): void;
  container: Container;
} {
  const container = new Container();
  const sprites: Sprite[] = [];

  const textures = new Map<number, Texture>();
  for (const [playerId, color] of Object.entries(PLAYER_COLORS)) {
    const g = new Graphics();
    const radius = cellPx * 0.25;
    g.circle(0, 0, radius);
    g.fill(color);
    const tex = app.renderer.generateTexture({
      target: g,
      resolution: 2,
    });
    textures.set(Number(playerId), tex);
    g.destroy();
  }

  function getOrCreateSprite(index: number): Sprite {
    while (sprites.length <= index) {
      const s = new Sprite();
      s.anchor.set(0.5);
      container.addChild(s);
      sprites.push(s);
    }
    return sprites[index]!;
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  return {
    container,
    update(prevUnits, curUnits, alpha) {
      for (let i = 0; i < curUnits.length; i++) {
        const cur = curUnits[i]!;
        const sprite = getOrCreateSprite(i);
        sprite.visible = true;
        sprite.texture =
          textures.get(cur.owner) ?? textures.values().next().value!;
        sprite.tint = PLAYER_COLORS[cur.owner] ?? FALLBACK_COLOR;

        const prev = prevUnits.find((u) => u.id === cur.id);
        if (prev) {
          sprite.x = lerp(prev.pos.x, cur.pos.x, alpha) * cellPx;
          sprite.y = lerp(prev.pos.y, cur.pos.y, alpha) * cellPx;
        } else {
          sprite.x = cur.pos.x * cellPx;
          sprite.y = cur.pos.y * cellPx;
        }
      }

      for (let i = curUnits.length; i < sprites.length; i++) {
        sprites[i]!.visible = false;
      }
    },
  };
}
