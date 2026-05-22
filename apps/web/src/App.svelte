<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    type InputFrame,
    type GameResult,
    type Player,
    type PlayerId,
    type Replay,
    REPLAY_VERSION,
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
  import { createReplayRecorder } from './game/replay/recorder';
  import { createReplayPlayer, type ReplayPlayer } from './game/replay/player';
  import { saveReplay } from './game/replay/storage';
  import Title from './ui/Title.svelte';
  import ResultDialog from './ui/ResultDialog.svelte';

  type Screen = 'title' | 'game' | 'result' | 'replay';

  let screen: Screen = $state('title');
  let canvasEl: HTMLCanvasElement;
  let app: Application | null = null;
  let loop: LoopHandle | null = null;
  let cleanupInput: (() => void) | null = null;
  let gameResult: GameResult | null = $state(null);
  let lastReplay: Replay | null = $state(null);
  let replayPaused = $state(false);

  const players: Player[] = [
    { id: 0 as PlayerId, name: 'Player 1', color: 0x4488ff, alive: true },
    { id: 1 as PlayerId, name: 'Player 2', color: 0xff8844, alive: true },
  ];

  const playerColors: Record<number, number> = {
    0: 0x4488ff,
    1: 0xff8844,
  };

  function stopLoop(): void {
    if (cleanupInput) {
      cleanupInput();
      cleanupInput = null;
    }
    if (loop) {
      loop.stop();
      loop = null;
    }
  }

  function cleanupGame(): void {
    stopLoop();
    if (app) {
      destroyStage(app);
      app = null;
    }
    gameResult = null;
    replayPaused = false;
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
    const recorder = createReplayRecorder();

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
        recorder.record(frame);
        cur = tick(prev, [frame], rng);
      },
      onRender: (alpha) => {
        cityRenderer.update(cur.cities);
        unitRenderer.update(prev.units, cur.units, alpha, inputCollector.selectedIds);

        if (cur.result !== null && screen === 'game') {
          gameResult = cur.result;
          const replay: Replay = {
            version: REPLAY_VERSION,
            seed: 42,
            mapId: map.id,
            players: [
              { id: 0 as PlayerId, name: 'Player 1', type: 'human' },
              { id: 1 as PlayerId, name: 'Player 2', type: 'ai' },
            ],
            inputs: recorder.getFrames(),
            finalTick: cur.tick,
            result: cur.result,
            createdAt: Date.now(),
          };
          lastReplay = replay;
          saveReplay(replay);
          screen = 'result';
        }
      },
    });
    loop.start();
  }

  function startReplay(): void {
    if (!lastReplay || !app) return;
    stopLoop();
    screen = 'replay';

    app.stage.removeChildren();

    const map = loadMap(firstBloodJson);
    const cellPx = 20;
    drawTerrain(app, map, cellPx);
    drawGrid(app, map.width, map.height, cellPx);
    const cityRenderer = createCityRenderer(app, cellPx);
    const unitRenderer = createUnitRenderer(app, cellPx);
    app.stage.addChild(unitRenderer.container);

    const rp: ReplayPlayer = createReplayPlayer(lastReplay);
    let prevState = rp.state();
    let curState = rp.state();
    const savedResult = lastReplay.result;

    cityRenderer.update(curState.cities);

    loop = createLoop({
      tickRateHz: 30,
      onTick: () => {
        prevState = curState;
        const advanced = rp.step();
        curState = rp.state();
        if (!advanced && screen === 'replay') {
          gameResult = savedResult;
          screen = 'result';
          lastReplay = null;
        }
      },
      onRender: (alpha) => {
        cityRenderer.update(curState.cities);
        unitRenderer.update(prevState.units, curState.units, alpha, []);
      },
    });
    loop.start();
  }

  function toggleReplayPause(): void {
    if (!loop) return;
    if (replayPaused) {
      loop.resume();
      replayPaused = false;
    } else {
      loop.pause();
      replayPaused = true;
    }
  }

  function handleRematch(): void {
    lastReplay = null;
    startGame();
  }

  function handleTitle(): void {
    cleanupGame();
    lastReplay = null;
    screen = 'title';
  }

  function handleReplay(): void {
    startReplay();
  }

  onDestroy(() => {
    cleanupGame();
  });
</script>

{#if screen === 'title'}
  <Title onstart={startGame} />
{/if}

{#if screen === 'game' || screen === 'result' || screen === 'replay'}
  <canvas bind:this={canvasEl}></canvas>
{/if}

{#if screen === 'replay'}
  <div class="replay-controls">
    <span class="replay-label">REPLAY</span>
    <button class="replay-btn" onclick={toggleReplayPause}>
      {replayPaused ? 'Resume' : 'Pause'}
    </button>
  </div>
{/if}

{#if screen === 'result' && gameResult}
  <ResultDialog
    result={gameResult}
    {playerColors}
    onrematch={handleRematch}
    ontitle={handleTitle}
    onreplay={lastReplay ? handleReplay : undefined}
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

  .replay-controls {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.7);
    padding: 6px 16px;
    border-radius: 8px;
    z-index: 50;
  }

  .replay-label {
    color: #44aa66;
    font-family: system-ui, sans-serif;
    font-weight: bold;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
  }

  .replay-btn {
    padding: 4px 14px;
    font-size: 0.85rem;
    border: none;
    border-radius: 4px;
    background: #555;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .replay-btn:hover {
    background: #666;
  }
</style>
