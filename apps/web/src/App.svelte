<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createStage, destroyStage, type Application } from './game/render/stage';
  import { drawGrid } from './game/render/grid';

  let canvasEl: HTMLCanvasElement;
  let app: Application | null = null;

  onMount(async () => {
    app = await createStage(canvasEl);
    drawGrid(app, 64, 36, 20);
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
