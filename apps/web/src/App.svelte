<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    type Player,
    type PlayerId,
    Rng,
    createInitialState,
    tick,
  } from '@war-of-dots/core';
  import { loadMap, firstBloodJson } from '@war-of-dots/maps';
  import { createStage, destroyStage, type Application } from './game/render/stage';
  import { drawTerrain } from './game/render/terrain';
  import { drawGrid } from './game/render/grid';
  import { drawCities } from './game/render/cities';
  import { createUnitRenderer } from './game/render/units';
  import { createLoop, type LoopHandle } from './game/loop';

  let canvasEl: HTMLCanvasElement;
  let app: Application | null = null;
  let loop: LoopHandle | null = null;

  onMount(async () => {
    app = await createStage(canvasEl);
    const map = loadMap(firstBloodJson);

    const players: Player[] = [
      { id: 0 as PlayerId, name: 'Player 1', color: 0x4488ff, alive: true },
      { id: 1 as PlayerId, name: 'Player 2', color: 0xff8844, alive: true },
    ];
    let prev = createInitialState(map, players, 42);
    let cur = structuredClone(prev);
    const rng = new Rng(42);

    const cellPx = 20;
    drawTerrain(app, map, cellPx);
    drawGrid(app, map.width, map.height, cellPx);
    drawCities(app, cur.cities, cellPx);

    const unitRenderer = createUnitRenderer(app, cellPx);
    app.stage.addChild(unitRenderer.container);

    loop = createLoop({
      tickRateHz: 30,
      onTick: () => {
        prev = cur;
        for (const unit of cur.units) {
          if (unit.goal === null) {
            unit.goal = { x: 32, y: 18 };
          }
        }
        cur = tick(prev, [], rng);
      },
      onRender: (alpha) => {
        unitRenderer.update(prev.units, cur.units, alpha);
      },
    });
    loop.start();
  });

  onDestroy(() => {
    if (loop) {
      loop.stop();
      loop = null;
    }
    if (app) {
      destroyStage(app);
      app = null;
    }
  });
</script>

<canvas bind:this={canvasEl}></canvas>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #1a1a1a;
  }

  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
  }
</style>
