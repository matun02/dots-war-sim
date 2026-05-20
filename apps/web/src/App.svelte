<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { City, CityId, PlayerId } from '@war-of-dots/core';
  import { loadMap, firstBloodJson } from '@war-of-dots/maps';
  import { createStage, destroyStage, type Application } from './game/render/stage';
  import { drawTerrain } from './game/render/terrain';
  import { drawGrid } from './game/render/grid';
  import { drawCities } from './game/render/cities';

  let canvasEl: HTMLCanvasElement;
  let app: Application | null = null;

  onMount(async () => {
    app = await createStage(canvasEl);

    const map = loadMap(firstBloodJson);

    const cities: City[] = map.cities.map((c) => ({
      id: c.id,
      pos: c.pos,
      owner: null as PlayerId | null,
      production: c.production,
      produceCooldownTicks: 0,
      captureProgressTicks: 0,
      capturingPlayer: null,
      supplyUsed: 0,
    }));

    for (const spawn of map.spawns) {
      const city = cities.find((c) => c.id === (spawn.cityId as CityId));
      if (city) {
        city.owner = spawn.player;
      }
    }

    drawTerrain(app, map, 20);
    drawGrid(app, map.width, map.height, 20);
    drawCities(app, cities, 20);
  });

  onDestroy(() => {
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
