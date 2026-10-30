import { describe, it, expect } from 'vitest';
import { CharGrid } from '../src/core/rasterizer/char-grid.js';
import {
  expandIconMacros,
  stampIcon,
  stampContainer,
  stampButton,
  rasterizeScene,
} from '../src/core/rasterizer/widget-stampers.js';
import { SceneNode } from '../src/core/ast/types.js';

describe('Icons & Surface Shading Suite', () => {
  describe('expandIconMacros', () => {
    it('expands canonical icon macros into monospace UTF-8 glyphs', () => {
      expect(expandIconMacros('{search}')).toBe('[⌕]');
      expect(expandIconMacros('{bell}')).toBe('[▲]');
      expect(expandIconMacros('{gear}')).toBe('[☼]');
      expect(expandIconMacros('{user}')).toBe('(@)');
      expect(expandIconMacros('{check}')).toBe('[✓]');
      expect(expandIconMacros('{close}')).toBe('[×]');
      expect(expandIconMacros('{star}')).toBe('[★]');
      expect(expandIconMacros('{heart}')).toBe('[♥]');
      expect(expandIconMacros('{menu}')).toBe('[≡]');
      expect(expandIconMacros('{arrow-right}')).toBe('─►');
      expect(expandIconMacros('{arrow-left}')).toBe('◄─');
      expect(expandIconMacros('{lock}')).toBe('[#]');
    });

    it('expands embedded icon macros in button labels', () => {
      const grid = new CharGrid(20, 1);
      const node: SceneNode = {
        id: 'btn-search',
        type: 'button',
        rect: { x: 0, y: 0, w: 16, h: 1 },
        zIndex: 1,
        label: '{search} Find',
      };
      stampButton(grid, node);
      expect(grid.renderToString()).toContain('[⌕] Find');
    });
  });

  describe('stampIcon', () => {
    it('stamps icon widget with macro expansion', () => {
      const grid = new CharGrid(10, 1);
      const node: SceneNode = {
        id: 'icon-gear',
        type: 'icon',
        rect: { x: 2, y: 0, w: 4, h: 1 },
        zIndex: 1,
        label: '{gear}',
      };
      stampIcon(grid, node);
      expect(grid.renderToString()).toBe('  [☼]');
    });
  });

  describe('Container Shading & Depth', () => {
    it('fills interior of container with halftone shading characters', () => {
      const grid = new CharGrid(8, 4);
      const node: SceneNode = {
        id: 'box-shaded',
        type: 'container',
        rect: { x: 0, y: 0, w: 8, h: 4 },
        zIndex: 0,
        meta: {
          fillShading: 'light',
        },
      };
      stampContainer(grid, node);
      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('┌──────┐');
      expect(lines[1]).toBe('│░░░░░░│');
      expect(lines[2]).toBe('│░░░░░░│');
      expect(lines[3]).toBe('└──────┘');
    });

    it('supports medium and dense shading', () => {
      const gridM = new CharGrid(6, 3);
      stampContainer(gridM, {
        id: 'box-m',
        type: 'container',
        rect: { x: 0, y: 0, w: 6, h: 3 },
        zIndex: 0,
        meta: { fillShading: 'medium' },
      });
      expect(gridM.renderToString().split('\n')[1]).toBe('│▒▒▒▒│');

      const gridD = new CharGrid(6, 3);
      stampContainer(gridD, {
        id: 'box-d',
        type: 'container',
        rect: { x: 0, y: 0, w: 6, h: 3 },
        zIndex: 0,
        meta: { fillShading: 'dense' },
      });
      expect(gridD.renderToString().split('\n')[1]).toBe('│▓▓▓▓│');
    });
  });
});
