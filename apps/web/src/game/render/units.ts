import {
  type Application,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from 'pixi.js';
import type { EntityId, Unit } from '@war-of-dots/core';

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
    selectedIds?: readonly EntityId[],
  ): void;
  container: Container;
} {
  const container = new Container();
  const sprites: Sprite[] = [];

  const radius = cellPx * 0.25;
  const textures = new Map<number, Texture>();
  for (const [playerId, color] of Object.entries(PLAYER_COLORS)) {
    const g = new Graphics();
    g.circle(0, 0, radius);
    g.fill(color);
    const tex = app.renderer.generateTexture({
      target: g,
      resolution: 2,
    });
    textures.set(Number(playerId), tex);
    g.destroy();
  }

  const selectionRings = new Graphics();
  container.addChild(selectionRings);

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
    update(prevUnits, curUnits, alpha, selectedIds) {
      const selectedSet = selectedIds
        ? new Set<number>(selectedIds)
        : undefined;

      selectionRings.clear();

      for (let i = 0; i < curUnits.length; i++) {
        const cur = curUnits[i]!;
        const sprite = getOrCreateSprite(i);
        sprite.visible = true;
        sprite.texture =
          textures.get(cur.owner) ?? textures.values().next().value!;
        sprite.tint = PLAYER_COLORS[cur.owner] ?? FALLBACK_COLOR;

        const prev = prevUnits.find((u) => u.id === cur.id);
        let sx: number;
        let sy: number;
        if (prev) {
          sx = lerp(prev.pos.x, cur.pos.x, alpha) * cellPx;
          sy = lerp(prev.pos.y, cur.pos.y, alpha) * cellPx;
        } else {
          sx = cur.pos.x * cellPx;
          sy = cur.pos.y * cellPx;
        }
        sprite.x = sx;
        sprite.y = sy;

        if (selectedSet?.has(cur.id)) {
          selectionRings.circle(sx, sy, radius + 2);
          selectionRings.stroke({ color: 0xffffff, alpha: 0.8, width: 1.5 });
        }
      }

      for (let i = curUnits.length; i < sprites.length; i++) {
        sprites[i]!.visible = false;
      }
    },
  };
}
