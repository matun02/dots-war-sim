import { Application } from 'pixi.js';

export type { Application } from 'pixi.js';

let resizeHandler: (() => void) | null = null;
// World size (in px) the stage is currently fitted to, so resize can re-fit.
let fittedWorld: { width: number; height: number } | null = null;

/**
 * Scale + centre `app.stage` so a world of `worldWidth` x `worldHeight` px is
 * fully contained in the viewport, preserving aspect ratio (letterboxed).
 * Everything is drawn under app.stage, so one uniform transform keeps the map
 * composition unchanged while making it fill the available screen.
 */
function applyFit(app: Application): void {
  if (!fittedWorld) return;
  const sw = app.screen.width;
  const sh = app.screen.height;
  const scale = Math.min(sw / fittedWorld.width, sh / fittedWorld.height);
  app.stage.scale.set(scale);
  app.stage.position.set(
    Math.round((sw - fittedWorld.width * scale) / 2),
    Math.round((sh - fittedWorld.height * scale) / 2),
  );
}

export function fitStageToWorld(
  app: Application,
  worldWidth: number,
  worldHeight: number,
): void {
  fittedWorld = { width: worldWidth, height: worldHeight };
  applyFit(app);
}

export async function createStage(
  canvas: HTMLCanvasElement,
): Promise<Application> {
  const app = new Application();
  await app.init({
    canvas,
    background: '#1a1a1a',
    autoDensity: true,
    resolution: window.devicePixelRatio,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  resizeHandler = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    applyFit(app);
  };
  window.addEventListener('resize', resizeHandler);

  return app;
}

export function destroyStage(app: Application): void {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  fittedWorld = null;
  app.destroy();
}
