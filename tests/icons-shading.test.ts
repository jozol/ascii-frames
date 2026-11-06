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

    it('stamps multi-line art3 icon sprite when h >= 3', () => {
      const grid = new CharGrid(12, 3);
      const node: SceneNode = {
        id: 'icon-user',
        type: 'icon',
        rect: { x: 0, y: 0, w: 9, h: 3 },
        zIndex: 1,
        meta: { iconName: 'user' },
      };
      stampIcon(grid, node);
      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('   ╭─╮');
      expect(lines[1]).toBe('   ╰┬╯');
      expect(lines[2]).toBe('  ╭─┴─╮');
    });

    it('stamps multi-line art5 icon sprite when h >= 5 and w >= 11', () => {
      const grid = new CharGrid(15, 5);
      const node: SceneNode = {
        id: 'icon-chart',
        type: 'icon',
        rect: { x: 2, y: 0, w: 12, h: 5 },
        zIndex: 1,
        meta: { iconName: 'chart' },
      };
      stampIcon(grid, node);
      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('  │        █');
      expect(lines[1]).toBe('  │     ▆  █');
      expect(lines[2]).toBe('  │  ▃  █  █');
      expect(lines[3]).toBe('  │  █  █  █');
      expect(lines[4]).toBe('  └─────────╴');
    });

    it('stamps sprite transparently without erasing container borders', () => {
      const grid = new CharGrid(13, 5);
      const container: SceneNode = {
        id: 'box',
        type: 'container',
        rect: { x: 0, y: 0, w: 13, h: 5 },
        zIndex: 0,
        label: 'Card',
      };
      const icon: SceneNode = {
        id: 'icon-search',
        type: 'icon',
        rect: { x: 2, y: 1, w: 9, h: 3 },
        zIndex: 1,
        meta: { iconName: 'search' },
      };
      stampContainer(grid, container);
      stampIcon(grid, icon);
      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('┌─ Card ────┐');
      expect(lines[1]).toContain('│');
      expect(lines[4]).toBe('└───────────┘');
    });
  });

  describe('Multi-line Action-Matched Buttons', () => {
    it('stamps 3-row button card with inferred icon from action', () => {
      const grid = new CharGrid(20, 6);
      const node: SceneNode = {
        id: 'btn-deploy',
        type: 'button',
        rect: { x: 0, y: 0, w: 16, h: 6 },
        zIndex: 1,
        label: 'Deploy Build',
        meta: { variant: 'primary', action: 'triggerDeploy' },
      };
      stampButton(grid, node);
      const rendered = grid.renderToString();
      expect(rendered).toContain('╔══════════════╗');
      expect(rendered).toContain('╭──╮'); // cloud art
      expect(rendered).toContain('Deploy Build');
      expect(rendered).toContain('╚══════════════╝');
    });

    it('stamps 1-row button with explicit icon glyph prefix', () => {
      const grid = new CharGrid(24, 1);
      const node: SceneNode = {
        id: 'btn-settings',
        type: 'button',
        rect: { x: 0, y: 0, w: 20, h: 1 },
        zIndex: 1,
        label: 'Settings',
        meta: { variant: 'secondary', iconName: 'gear' },
      };
      stampButton(grid, node);
      expect(grid.renderToString()).toContain('[☼] Settings');
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
