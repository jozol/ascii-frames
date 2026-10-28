import { Rect, ContainerBorderStyle } from '../ast/types.js';
import {
  NORTH,
  EAST,
  SOUTH,
  WEST,
  resolveJunction,
} from './bitmask-junctions.js';

export class CharGrid {
  public readonly width: number;
  public readonly height: number;
  public readonly cells: string[][];
  public readonly masks: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ' ')
    );
    this.masks = new Uint8Array(width * height);
  }

  setChar(x: number, y: number, char: string): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[y][x] = char;
  }

  getChar(x: number, y: number): string {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return ' ';
    return this.cells[y][x];
  }

  getMask(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.masks[y * this.width + x];
  }

  addBorderSegment(x: number, y: number, bitmask: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = y * this.width + x;
    const currentMask = this.masks[idx];
    const { char, mask } = resolveJunction(currentMask, bitmask);
    this.masks[idx] = mask;
    this.cells[y][x] = char;
  }

  drawBox(rect: Rect, title?: string, style: ContainerBorderStyle = 'single'): void {
    if (rect.w < 2 || rect.h < 2) return;
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.w - 1;
    const y1 = rect.y + rect.h - 1;

    if (style === 'minimal') {
      // Minimalist header line only
      for (let x = x0; x <= x1; x++) {
        this.setChar(x, y0, '─');
      }
    } else if (style === 'rounded') {
      this.setChar(x0, y0, '╭');
      this.setChar(x1, y0, '╮');
      this.setChar(x0, y1, '╰');
      this.setChar(x1, y1, '╯');
      for (let x = x0 + 1; x < x1; x++) {
        this.setChar(x, y0, '─');
        this.setChar(x, y1, '─');
      }
      for (let y = y0 + 1; y < y1; y++) {
        this.setChar(x0, y, '│');
        this.setChar(x1, y, '│');
      }
    } else if (style === 'double') {
      this.setChar(x0, y0, '╔');
      this.setChar(x1, y0, '╗');
      this.setChar(x0, y1, '╚');
      this.setChar(x1, y1, '╝');
      for (let x = x0 + 1; x < x1; x++) {
        this.setChar(x, y0, '═');
        this.setChar(x, y1, '═');
      }
      for (let y = y0 + 1; y < y1; y++) {
        this.setChar(x0, y, '║');
        this.setChar(x1, y, '║');
      }
    } else if (style === 'dashed') {
      this.setChar(x0, y0, '+');
      this.setChar(x1, y0, '+');
      this.setChar(x0, y1, '+');
      this.setChar(x1, y1, '+');
      for (let x = x0 + 1; x < x1; x++) {
        this.setChar(x, y0, '-');
        this.setChar(x, y1, '-');
      }
      for (let y = y0 + 1; y < y1; y++) {
        this.setChar(x0, y, '|');
        this.setChar(x1, y, '|');
      }
    } else {
      // Default: 'single' with 4-bit NESW Bitmask Accumulation
      // 4 corners
      this.addBorderSegment(x0, y0, SOUTH | EAST);
      this.addBorderSegment(x1, y0, SOUTH | WEST);
      this.addBorderSegment(x0, y1, NORTH | EAST);
      this.addBorderSegment(x1, y1, NORTH | WEST);

      // Top & bottom horizontal edges
      for (let x = x0 + 1; x < x1; x++) {
        this.addBorderSegment(x, y0, EAST | WEST);
        this.addBorderSegment(x, y1, EAST | WEST);
      }

      // Left & right vertical edges
      for (let y = y0 + 1; y < y1; y++) {
        this.addBorderSegment(x0, y, NORTH | SOUTH);
        this.addBorderSegment(x1, y, NORTH | SOUTH);
      }
    }

    // Stamps title top-left: ┌─ Title ──┐ or ╭─ Title ──╮
    if (title && title.trim().length > 0) {
      const trimmed = title.trim();
      const maxTitleLen = rect.w - 5;
      if (maxTitleLen > 0) {
        const displayTitle =
          trimmed.length > maxTitleLen ? trimmed.slice(0, maxTitleLen) : trimmed;
        this.writeText(x0 + 2, y0, ` ${displayTitle} `);
      }
    }
  }

  writeText(x: number, y: number, text: string, maxWidth?: number): void {
    if (y < 0 || y >= this.height) return;
    let len = text.length;
    if (maxWidth !== undefined && maxWidth < len) {
      len = maxWidth;
    }
    const availableWidth = this.width - x;
    if (len > availableWidth) {
      len = availableWidth;
    }
    for (let i = 0; i < len; i++) {
      const curX = x + i;
      if (curX >= 0 && curX < this.width) {
        this.cells[y][curX] = text[i];
      }
    }
  }

  renderToString(): string {
    return this.cells.map((row) => row.join('').trimEnd()).join('\n');
  }
}
