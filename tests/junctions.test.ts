import { describe, it, expect } from 'vitest';
import {
  NORTH,
  EAST,
  SOUTH,
  WEST,
  resolveJunction,
  JUNCTION_TABLE,
} from '../src/core/rasterizer/bitmask-junctions.js';
import { CharGrid } from '../src/core/rasterizer/char-grid.js';
import { stampDivider } from '../src/core/rasterizer/widget-stampers.js';
import { SceneNode } from '../src/core/ast/types.js';

describe('Bitmask Junction Resolution', () => {
  it('correctly maps 4-bit NESW to 16 UTF-8 characters', () => {
    expect(JUNCTION_TABLE[0]).toBe(' ');
    expect(JUNCTION_TABLE[NORTH]).toBe('╵');
    expect(JUNCTION_TABLE[EAST]).toBe('╶');
    expect(JUNCTION_TABLE[NORTH | EAST]).toBe('└');
    expect(JUNCTION_TABLE[SOUTH]).toBe('╷');
    expect(JUNCTION_TABLE[NORTH | SOUTH]).toBe('│');
    expect(JUNCTION_TABLE[EAST | SOUTH]).toBe('┌');
    expect(JUNCTION_TABLE[NORTH | EAST | SOUTH]).toBe('├');
    expect(JUNCTION_TABLE[WEST]).toBe('╴');
    expect(JUNCTION_TABLE[NORTH | WEST]).toBe('┘');
    expect(JUNCTION_TABLE[EAST | WEST]).toBe('─');
    expect(JUNCTION_TABLE[NORTH | EAST | WEST]).toBe('┴');
    expect(JUNCTION_TABLE[SOUTH | WEST]).toBe('┐');
    expect(JUNCTION_TABLE[NORTH | SOUTH | WEST]).toBe('┤');
    expect(JUNCTION_TABLE[EAST | SOUTH | WEST]).toBe('┬');
    expect(JUNCTION_TABLE[NORTH | EAST | SOUTH | WEST]).toBe('┼');
  });

  it('resolves junctions with bitwise OR', () => {
    expect(resolveJunction(NORTH | SOUTH, EAST)).toEqual({ char: '├', mask: 7 });
    expect(resolveJunction(NORTH | SOUTH, WEST)).toEqual({ char: '┤', mask: 13 });
    expect(resolveJunction(EAST | WEST, SOUTH)).toEqual({ char: '┬', mask: 14 });
    expect(resolveJunction(EAST | WEST, NORTH)).toEqual({ char: '┴', mask: 11 });
    expect(resolveJunction(NORTH | SOUTH, EAST | WEST)).toEqual({ char: '┼', mask: 15 });
  });
});

describe('CharGrid Corner and Junction Assertions', () => {
  it('asserts single box corners: (0,0)=┌, (w-1,0)=┐, (0,h-1)=└, (w-1,h-1)=┘', () => {
    const w = 10;
    const h = 5;
    const grid = new CharGrid(w, h);
    grid.drawBox({ x: 0, y: 0, w, h });

    // Top-left
    expect(grid.getChar(0, 0)).toBe('┌');
    // Top-right
    expect(grid.getChar(w - 1, 0)).toBe('┐');
    // Bottom-left
    expect(grid.getChar(0, h - 1)).toBe('└');
    // Bottom-right
    expect(grid.getChar(w - 1, h - 1)).toBe('┘');

    // Horizontal edges
    for (let x = 1; x < w - 1; x++) {
      expect(grid.getChar(x, 0)).toBe('─');
      expect(grid.getChar(x, h - 1)).toBe('─');
    }

    // Vertical edges
    for (let y = 1; y < h - 1; y++) {
      expect(grid.getChar(0, y)).toBe('│');
      expect(grid.getChar(w - 1, y)).toBe('│');
    }
  });

  it('asserts shared horizontal wall produces ├ and ┤', () => {
    const w = 10;
    const h = 5;
    // Two stacked boxes of height 5 sharing row 4
    const grid = new CharGrid(w, 9);
    grid.drawBox({ x: 0, y: 0, w, h: 5 });
    grid.drawBox({ x: 0, y: 4, w, h: 5 });

    // The shared wall is at y = 4
    expect(grid.getChar(0, 4)).toBe('├');
    expect(grid.getChar(w - 1, 4)).toBe('┤');

    // Inside the shared wall should remain ─
    for (let x = 1; x < w - 1; x++) {
      expect(grid.getChar(x, 4)).toBe('─');
    }
  });

  it('asserts T-junction produces ┬ and ┴', () => {
    const w = 6;
    const h = 5;
    // Two side-by-side boxes of width 6 sharing col 5
    const grid = new CharGrid(11, h);
    grid.drawBox({ x: 0, y: 0, w, h });
    grid.drawBox({ x: 5, y: 0, w, h });

    // The shared vertical wall is at x = 5
    // Top intersection: ┬
    expect(grid.getChar(5, 0)).toBe('┬');
    // Bottom intersection: ┴
    expect(grid.getChar(5, h - 1)).toBe('┴');

    // Vertical line between top and bottom: │
    for (let y = 1; y < h - 1; y++) {
      expect(grid.getChar(5, y)).toBe('│');
    }
  });

  it('asserts four-way intersection produces ┼', () => {
    // 4 boxes of 5x5 meeting at (4, 4)
    const grid = new CharGrid(9, 9);
    grid.drawBox({ x: 0, y: 0, w: 5, h: 5 });
    grid.drawBox({ x: 4, y: 0, w: 5, h: 5 });
    grid.drawBox({ x: 0, y: 4, w: 5, h: 5 });
    grid.drawBox({ x: 4, y: 4, w: 5, h: 5 });

    // Exact intersection at (4, 4)
    expect(grid.getChar(4, 4)).toBe('┼');

    // Surrounding T-junctions
    expect(grid.getChar(4, 0)).toBe('┬');
    expect(grid.getChar(4, 8)).toBe('┴');
    expect(grid.getChar(0, 4)).toBe('├');
    expect(grid.getChar(8, 4)).toBe('┤');
  });

  it('asserts divider meeting container borders produces ├ and ┤', () => {
    const grid = new CharGrid(12, 6);
    grid.drawBox({ x: 0, y: 0, w: 12, h: 6 });

    const dividerNode: SceneNode = {
      id: 'div-1',
      type: 'divider',
      rect: { x: 0, y: 2, w: 12, h: 1 },
      zIndex: 1,
    };

    stampDivider(grid, dividerNode);

    expect(grid.getChar(0, 2)).toBe('├');
    expect(grid.getChar(11, 2)).toBe('┤');
    for (let x = 1; x < 11; x++) {
      expect(grid.getChar(x, 2)).toBe('─');
    }
  });
});
