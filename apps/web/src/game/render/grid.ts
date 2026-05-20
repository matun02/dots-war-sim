import { type Application, Container, Graphics } from 'pixi.js';

export function drawGrid(
  app: Application,
  width: number = 64,
  height: number = 36,
  cellPx: number = 20,
): Container {
  const container = new Container();
  const g = new Graphics();

  const totalW = width * cellPx;
  const totalH = height * cellPx;

  g.setStrokeStyle({ width: 1, color: 0x2a2a2a });

  for (let x = 0; x <= width; x++) {
    const px = x * cellPx;
    g.moveTo(px, 0);
    g.lineTo(px, totalH);
  }

  for (let y = 0; y <= height; y++) {
    const py = y * cellPx;
    g.moveTo(0, py);
    g.lineTo(totalW, py);
  }

  g.stroke();

  container.addChild(g);
  app.stage.addChild(container);

  return container;
}
