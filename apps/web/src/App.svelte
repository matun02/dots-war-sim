<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    type InputFrame,
    type GameResult,
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
  import { createCityRenderer } from './game/render/cities';
  import { createUnitRenderer } from './game/render/units';
  import { createSelectionRenderer } from './game/render/selection-box';
  import { createLoop, type LoopHandle } from './game/loop';
  import { createInputCollector } from './game/input/commands';
  import { unitsInRect, type SelectionBox } from './game/input/selection';
  import { createAIController } from './game/ai/controller';
  import Title from './ui/Title.svelte';
  import ResultDialog from './ui/ResultDialog.svelte';

  type Screen = 'title' | 'game' | 'result';

  let screen: Screen = $state('title');
  let canvasEl: HTMLCanvasElement;
  let app: Application | null = null;
  let loop: LoopHandle | null = null;
  let cleanupInput: (() => void) | null = null;
  let gameResult: GameResult | null = $state(null);

  const players: Player[] = [
    { id: 0 as PlayerId, name: 'Player 1', color: 0x4488ff, alive: true },
    { id: 1 as PlayerId, name: 'Player 2', color: 0xff8844, alive: true },
  ];

  const playerColors: Record<number, number> = {
    0: 0x4488ff,
    1: 0xff8844,
  };

  function cleanupGame(): void {
    if (cleanupInput) {
      cleanupInput();
      cleanupInput = null;
    }
    if (loop) {
      loop.stop();
      loop = null;
    }
    if (app) {
      destroyStage(app);
      app = null;
    }
    gameResult = null;
  }

  async function startGame(): Promise<void> {
    cleanupGame();
    screen = 'game';

    await new Promise<void>((r) => {
      requestAnimationFrame(() => r());
    });

    app = await createStage(canvasEl);
    const map = loadMap(firstBloodJson);

    const gamePlayers = players.map((p) => ({ ...p, alive: true }));
    let prev = createInitialState(map, gamePlayers, 42);
    let cur = structuredClone(prev);
    const rng = new Rng(42);
    const aiRng = new Rng(123);
    const aiController = createAIController(1 as PlayerId, 'normal', aiRng);

    const cellPx = 20;
    drawTerrain(app, map, cellPx);
    drawGrid(app, map.width, map.height, cellPx);
    const cityRenderer = createCityRenderer(app, cellPx);
    cityRenderer.update(cur.cities);

    const unitRenderer = createUnitRenderer(app, cellPx);
    app.stage.addChild(unitRenderer.container);

    const selectionRenderer = createSelectionRenderer(app, cellPx);
    app.stage.addChild(selectionRenderer.container);

    const inputCollector = createInputCollector(0 as PlayerId);

    let dragging = false;
    let selectionBox: SelectionBox | null = null;

    const canvas = canvasEl;

    function onMouseDown(e: MouseEvent): void {
      if (e.button !== 0) return;
      dragging = true;
      const wx = e.offsetX / cellPx;
      const wy = e.offsetY / cellPx;
      selectionBox = {
        startWorld: { x: wx, y: wy },
        endWorld: { x: wx, y: wy },
      };
    }

    function onMouseMove(e: MouseEvent): void {
      if (!dragging || !selectionBox) return;
      selectionBox.endWorld = {
        x: e.offsetX / cellPx,
        y: e.offsetY / cellPx,
      };
      selectionRenderer.show(selectionBox.startWorld, selectionBox.endWorld);
    }

    function onMouseUp(e: MouseEvent): void {
      if (e.button !== 0 || !dragging || !selectionBox) return;
      dragging = false;
      selectionBox.endWorld = {
        x: e.offsetX / cellPx,
        y: e.offsetY / cellPx,
      };

      const ids = unitsInRect(
        cur.units,
        0,
        selectionBox.startWorld,
        selectionBox.endWorld,
      );
      inputCollector.select(ids);

      selectionBox = null;
      selectionRenderer.hide();
    }

    function onContextMenu(e: MouseEvent): void {
      e.preventDefault();
      const wx = e.offsetX / cellPx;
      const wy = e.offsetY / cellPx;
      inputCollector.moveCommand({ x: wx, y: wy });
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    cleanupInput = () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };

    loop = createLoop({
      tickRateHz: 30,
      onTick: () => {
        prev = cur;
        const humanCommands = inputCollector.flush();
        const aiCommands = aiController.update(cur);
        const frame: InputFrame = {
          tick: cur.tick,
          commands: [...humanCommands, ...aiCommands],
        };
        cur = tick(prev, [frame], rng);
      },
      onRender: (alpha) => {
        cityRenderer.update(cur.cities);
        unitRenderer.update(prev.units, cur.units, alpha, inputCollector.selectedIds);

        if (cur.result !== null && screen === 'game') {
          gameResult = cur.result;
          screen = 'result';
        }
      },
    });
    loop.start();
  }

  function handleRematch(): void {
    startGame();
  }

  function handleTitle(): void {
    cleanupGame();
    screen = 'title';
  }

  onDestroy(() => {
    cleanupGame();
  });
</script>

{#if screen === 'title'}
  <Title onstart={startGame} />
{/if}

{#if screen === 'game' || screen === 'result'}
  <canvas bind:this={canvasEl}></canvas>
{/if}

{#if screen === 'result' && gameResult}
  <ResultDialog
    result={gameResult}
    {playerColors}
    onrematch={handleRematch}
    ontitle={handleTitle}
  />
{/if}

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
