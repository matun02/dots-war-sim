import type { EntityId } from './types.js';

export class SpatialHash {
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: EntityId[][];

  constructor(cellSize: number, width: number, height: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = [];
    for (let i = 0; i < this.cols * this.rows; i++) {
      this.cells.push([]);
    }
  }

  clear(): void {
    for (const cell of this.cells) {
      cell.length = 0;
    }
  }

  insert(id: EntityId, x: number, y: number): void {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const cell = this.cells[row * this.cols + col];
    if (cell) cell.push(id);
  }

  query(x: number, y: number, radius: number): EntityId[] {
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

    const result: EntityId[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this.cells[row * this.cols + col];
        if (cell) {
          for (const id of cell) {
            result.push(id);
          }
        }
      }
    }

    result.sort((a, b) => (a as number) - (b as number));
    return result;
  }
}
