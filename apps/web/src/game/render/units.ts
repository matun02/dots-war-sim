import {
  type Application,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from 'pixi.js';
import type { EntityId, Unit, UnitKind } from '@dots-war-sim/core';

const PLAYER_COLORS: Record<number, number> = {
  0: 0x4488ff,
  1: 0xff8844,
};

const FALLBACK_COLOR = 0xcccccc;

const UNIT_RADIUS: Record<UnitKind, number> = {
  light: 0.25,
  heavy: 0.35,
};

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

  const textures = new Map<string, Texture>();
  for (const [playerId, color] of Object.entries(PLAYER_COLORS)) {
    for (const kind of ['light', 'heavy'] as const) {
      const radius = cellPx * UNIT_RADIUS[kind];
      const g = new Graphics();
      g.circle(0, 0, radius);
      g.fill(color);
      const tex = app.renderer.generateTexture({
        target: g,
        resolution: 2,
      });
      textures.set(`${playerId}-${kind}`, tex);
      g.destroy();
    }
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
        const texKey = `${cur.owner}-${cur.kind}`;
        sprite.texture =
          textures.get(texKey) ?? textures.values().next().value!;
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
          const r = cellPx * UNIT_RADIUS[cur.kind];
          selectionRings.circle(sx, sy, r + 2);
          selectionRings.stroke({ color: 0xffffff, alpha: 0.8, width: 1.5 });
        }
      }

      for (let i = curUnits.length; i < sprites.length; i++) {
        sprites[i]!.visible = false;
      }
    },
  };
}
