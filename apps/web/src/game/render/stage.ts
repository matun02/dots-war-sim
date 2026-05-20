import { Application } from 'pixi.js';

export type { Application } from 'pixi.js';

let resizeHandler: (() => void) | null = null;

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
  };
  window.addEventListener('resize', resizeHandler);

  return app;
}

export function destroyStage(app: Application): void {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  app.destroy();
}
