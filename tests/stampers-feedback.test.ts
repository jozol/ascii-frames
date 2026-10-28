import { describe, it, expect } from 'vitest';
import { CharGrid } from '../src/core/rasterizer/char-grid.js';
import {
  stampBadge,
  stampProgress,
  stampAlert,
} from '../src/core/rasterizer/stampers-feedback.js';
import { rasterizeScene } from '../src/core/rasterizer/widget-stampers.js';
import { SceneNode } from '../src/core/ast/types.js';

describe('Feedback & Controls Stampers', () => {
  describe('stampBadge', () => {
    it('stamps tag variant by default', () => {
      const grid = new CharGrid(20, 1);
      const node: SceneNode = {
        id: 'badge-tag-default',
        type: 'badge',
        rect: { x: 0, y: 0, w: 20, h: 1 },
        zIndex: 1,
        label: 'Active',
      };

      stampBadge(grid, node);
      expect(grid.cells[0].join('').trimEnd()).toBe('< Active >');
    });

    it('stamps explicit tag variant', () => {
      const grid = new CharGrid(20, 1);
      const node: SceneNode = {
        id: 'badge-tag',
        type: 'badge',
        rect: { x: 0, y: 0, w: 20, h: 1 },
        zIndex: 1,
        label: 'Beta',
        meta: { badgeVariant: 'tag' },
      };

      stampBadge(grid, node);
      expect(grid.cells[0].join('').trimEnd()).toBe('< Beta >');
    });

    it('stamps pill variant', () => {
      const grid = new CharGrid(20, 1);
      const node: SceneNode = {
        id: 'badge-pill',
        type: 'badge',
        rect: { x: 0, y: 0, w: 20, h: 1 },
        zIndex: 1,
        label: 'Admin',
        meta: { badgeVariant: 'pill' },
      };

      stampBadge(grid, node);
      expect(grid.cells[0].join('').trimEnd()).toBe('( Admin )');
    });

    it('stamps status variant with and without label', () => {
      const grid = new CharGrid(25, 2);
      const nodeWithLabel: SceneNode = {
        id: 'badge-status-1',
        type: 'badge',
        rect: { x: 0, y: 0, w: 25, h: 1 },
        zIndex: 1,
        label: 'Online',
        meta: { badgeVariant: 'status' },
      };
      const nodeWithoutLabel: SceneNode = {
        id: 'badge-status-2',
        type: 'badge',
        rect: { x: 0, y: 1, w: 25, h: 1 },
        zIndex: 1,
        meta: { badgeVariant: 'status' },
      };

      stampBadge(grid, nodeWithLabel);
      stampBadge(grid, nodeWithoutLabel);

      expect(grid.cells[0].join('').trimEnd()).toBe('(*) Online');
      expect(grid.cells[1].join('').trimEnd()).toBe('(*)');
    });

    it('stamps counter variant', () => {
      const grid = new CharGrid(15, 1);
      const node: SceneNode = {
        id: 'badge-counter',
        type: 'badge',
        rect: { x: 0, y: 0, w: 15, h: 1 },
        zIndex: 1,
        label: '12',
        meta: { badgeVariant: 'counter' },
      };

      stampBadge(grid, node);
      expect(grid.cells[0].join('').trimEnd()).toBe('( 12 )');
    });

    it('respects x, y offset and maxWidth clipping', () => {
      const grid = new CharGrid(20, 3);
      const node: SceneNode = {
        id: 'badge-offset',
        type: 'badge',
        rect: { x: 3, y: 1, w: 6, h: 1 },
        zIndex: 1,
        label: 'LongLabel',
        meta: { badgeVariant: 'tag' },
      };

      stampBadge(grid, node);
      // "< LongLabel >" is 13 chars, clipped to w=6 => "< Long"
      expect(grid.cells[1].slice(3, 9).join('')).toBe('< Long');
    });

    it('rasterizes through rasterizeScene', () => {
      const node: SceneNode = {
        id: 'badge-scene',
        type: 'badge',
        rect: { x: 0, y: 0, w: 15, h: 1 },
        zIndex: 1,
        label: 'New',
        meta: { badgeVariant: 'pill' },
      };

      const grid = rasterizeScene([node], 15, 1);
      expect(grid.renderToString()).toBe('( New )');
    });
  });

  describe('stampProgress', () => {
    it('stamps default progress bar at 50%', () => {
      const grid = new CharGrid(25, 1);
      const node: SceneNode = {
        id: 'prog-50',
        type: 'progress',
        rect: { x: 0, y: 0, w: 25, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'bar',
          progressValue: 50,
        },
      };

      stampProgress(grid, node);
      // w=25: suffix is " 50%" (4 chars), innerTrackLen = 25 - 2 - 4 = 19
      // fillLen = round(0.5 * 19) = 10 => 9 '=' + 1 '>' = 10, remaining 9 '-'
      expect(grid.cells[0].join('').trimEnd()).toBe('[=========>---------] 50%');
    });

    it('stamps progress bar at 0%', () => {
      const grid = new CharGrid(25, 1);
      const node: SceneNode = {
        id: 'prog-0',
        type: 'progress',
        rect: { x: 0, y: 0, w: 24, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'bar',
          progressValue: 0,
        },
      };

      stampProgress(grid, node);
      // w=24: suffix " 0%" (3 chars), innerTrackLen = 24 - 2 - 3 = 19
      expect(grid.cells[0].join('').trimEnd()).toBe('[-------------------] 0%');
    });

    it('stamps progress bar at 100%', () => {
      const grid = new CharGrid(26, 1);
      const node: SceneNode = {
        id: 'prog-100',
        type: 'progress',
        rect: { x: 0, y: 0, w: 26, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'bar',
          progressValue: 100,
        },
      };

      stampProgress(grid, node);
      // w=26: suffix " 100%" (5 chars), innerTrackLen = 26 - 2 - 5 = 19
      // fillLen = 19 => 18 '=' + 1 '>'
      expect(grid.cells[0].join('').trimEnd()).toBe('[==================>] 100%');
    });

    it('stamps progress bar with custom label', () => {
      const grid = new CharGrid(25, 1);
      const node: SceneNode = {
        id: 'prog-label',
        type: 'progress',
        rect: { x: 0, y: 0, w: 22, h: 1 },
        zIndex: 1,
        label: 'Halfway',
        meta: {
          progressValue: 50,
        },
      };

      stampProgress(grid, node);
      // suffix " Halfway" (8 chars), innerTrackLen = 22 - 2 - 8 = 12
      // fillLen = 6 => 5 '=' + 1 '>' + 6 '-'
      expect(grid.cells[0].join('').trimEnd()).toBe('[=====>------] Halfway');
    });

    it('calculates percentage correctly with custom progressMax and clamping', () => {
      const grid = new CharGrid(30, 2);
      const nodeCustomMax: SceneNode = {
        id: 'prog-max',
        type: 'progress',
        rect: { x: 0, y: 0, w: 25, h: 1 },
        zIndex: 1,
        meta: {
          progressValue: 50,
          progressMax: 200, // 50 / 200 = 25%
        },
      };

      const nodeOverMax: SceneNode = {
        id: 'prog-over',
        type: 'progress',
        rect: { x: 0, y: 1, w: 26, h: 1 },
        zIndex: 1,
        meta: {
          progressValue: 250,
          progressMax: 100, // clamped to 100%
        },
      };

      stampProgress(grid, nodeCustomMax);
      stampProgress(grid, nodeOverMax);

      expect(grid.cells[0].join('').trimEnd()).toContain('25%');
      expect(grid.cells[1].join('').trimEnd()).toContain('100%');
    });

    it('stamps slider variant at 50%', () => {
      const grid = new CharGrid(25, 1);
      const node: SceneNode = {
        id: 'slider-50',
        type: 'progress',
        rect: { x: 0, y: 0, w: 23, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'slider',
          progressValue: 50,
        },
      };

      stampProgress(grid, node);
      // w=23: suffix " 50%" (4 chars), trackLen = 19
      // knob takes 3, availDashes = 16 => offset = round(0.5 * 16) = 8
      // left 8, right 8 => "────────(o)──────── 50%"
      expect(grid.cells[0].join('').trimEnd()).toBe('────────(o)──────── 50%');
    });

    it('stamps slider variant at 0% and 100%', () => {
      const grid = new CharGrid(25, 2);
      const node0: SceneNode = {
        id: 'slider-0',
        type: 'progress',
        rect: { x: 0, y: 0, w: 22, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'slider',
          progressValue: 0,
        },
      };
      const node100: SceneNode = {
        id: 'slider-100',
        type: 'progress',
        rect: { x: 0, y: 1, w: 24, h: 1 },
        zIndex: 1,
        meta: {
          progressVariant: 'slider',
          progressValue: 100,
        },
      };

      stampProgress(grid, node0);
      stampProgress(grid, node100);

      // 0%: knob on the far left
      expect(grid.cells[0].join('').trimEnd()).toBe('(o)──────────────── 0%');
      // 100%: knob on the far right
      expect(grid.cells[1].join('').trimEnd()).toBe('────────────────(o) 100%');
    });

    it('stamps slider with custom label', () => {
      const grid = new CharGrid(25, 1);
      const node: SceneNode = {
        id: 'slider-label',
        type: 'progress',
        rect: { x: 0, y: 0, w: 23, h: 1 },
        zIndex: 1,
        label: 'Medium',
        meta: {
          progressVariant: 'slider',
          progressValue: 50,
        },
      };

      stampProgress(grid, node);
      expect(grid.cells[0].join('').trimEnd()).toContain('(o)');
      expect(grid.cells[0].join('').trimEnd()).toContain('Medium');
    });
  });

  describe('stampAlert', () => {
    describe('single-line banner (h < 3)', () => {
      it('stamps single-line banner for all 4 variants', () => {
        const grid = new CharGrid(40, 4);

        const infoNode: SceneNode = {
          id: 'alert-info',
          type: 'alert',
          rect: { x: 0, y: 0, w: 40, h: 1 },
          zIndex: 1,
          label: 'Checking status',
          meta: { alertVariant: 'info' },
        };
        const successNode: SceneNode = {
          id: 'alert-success',
          type: 'alert',
          rect: { x: 0, y: 1, w: 40, h: 1 },
          zIndex: 1,
          label: 'Saved successfully',
          meta: { alertVariant: 'success' },
        };
        const warningNode: SceneNode = {
          id: 'alert-warning',
          type: 'alert',
          rect: { x: 0, y: 2, w: 40, h: 1 },
          zIndex: 1,
          label: 'High memory usage',
          meta: { alertVariant: 'warning' },
        };
        const dangerNode: SceneNode = {
          id: 'alert-danger',
          type: 'alert',
          rect: { x: 0, y: 3, w: 40, h: 1 },
          zIndex: 1,
          label: 'System error',
          meta: { alertVariant: 'danger' },
        };

        stampAlert(grid, infoNode);
        stampAlert(grid, successNode);
        stampAlert(grid, warningNode);
        stampAlert(grid, dangerNode);

        expect(grid.cells[0].join('').trimEnd()).toBe(
          '[i] Info: Checking status            [x]'
        );
        expect(grid.cells[1].join('').trimEnd()).toBe(
          '[v] Success: Saved successfully      [x]'
        );
        expect(grid.cells[2].join('').trimEnd()).toBe(
          '[!] Warning: High memory usage       [x]'
        );
        expect(grid.cells[3].join('').trimEnd()).toBe(
          '[x] Danger: System error             [x]'
        );
      });

      it('stamps default variant as info when alertVariant is omitted', () => {
        const grid = new CharGrid(35, 1);
        const node: SceneNode = {
          id: 'alert-default',
          type: 'alert',
          rect: { x: 0, y: 0, w: 35, h: 1 },
          zIndex: 1,
          label: 'Default info',
        };

        stampAlert(grid, node);
        expect(grid.cells[0].join('').trimEnd()).toBe(
          '[i] Info: Default info          [x]'
        );
      });

      it('stamps single-line banner without label', () => {
        const grid = new CharGrid(30, 1);
        const node: SceneNode = {
          id: 'alert-no-label',
          type: 'alert',
          rect: { x: 0, y: 0, w: 30, h: 1 },
          zIndex: 1,
          meta: { alertVariant: 'warning' },
        };

        stampAlert(grid, node);
        expect(grid.cells[0].join('').trimEnd()).toBe(
          '[!] Warning                [x]'
        );
      });
    });

    describe('multi-line bordered box (h >= 3 && w >= 10)', () => {
      it('stamps warning alert box', () => {
        const grid = new CharGrid(36, 3);
        const node: SceneNode = {
          id: 'alert-box-warning',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 3 },
          zIndex: 1,
          label: 'Message text here',
          meta: { alertVariant: 'warning' },
        };

        stampAlert(grid, node);

        const rendered = grid.renderToString();
        const expected = [
          '┌─ [!] Warning ────────────────────┐',
          '│ Message text here                │',
          '└──────────────────────────────────┘',
        ].join('\n');

        expect(rendered).toBe(expected);
      });

      it('stamps info alert box', () => {
        const grid = new CharGrid(36, 3);
        const node: SceneNode = {
          id: 'alert-box-info',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 3 },
          zIndex: 1,
          label: 'System updated',
          meta: { alertVariant: 'info' },
        };

        stampAlert(grid, node);

        const rendered = grid.renderToString();
        const expected = [
          '┌─ [i] Info ───────────────────────┐',
          '│ System updated                   │',
          '└──────────────────────────────────┘',
        ].join('\n');

        expect(rendered).toBe(expected);
      });

      it('stamps success alert box', () => {
        const grid = new CharGrid(36, 3);
        const node: SceneNode = {
          id: 'alert-box-success',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 3 },
          zIndex: 1,
          label: 'Changes saved',
          meta: { alertVariant: 'success' },
        };

        stampAlert(grid, node);

        const rendered = grid.renderToString();
        const expected = [
          '┌─ [v] Success ────────────────────┐',
          '│ Changes saved                    │',
          '└──────────────────────────────────┘',
        ].join('\n');

        expect(rendered).toBe(expected);
      });

      it('stamps danger alert box', () => {
        const grid = new CharGrid(36, 3);
        const node: SceneNode = {
          id: 'alert-box-danger',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 3 },
          zIndex: 1,
          label: 'Fatal crash',
          meta: { alertVariant: 'danger' },
        };

        stampAlert(grid, node);

        const rendered = grid.renderToString();
        const expected = [
          '┌─ [x] Danger ─────────────────────┐',
          '│ Fatal crash                      │',
          '└──────────────────────────────────┘',
        ].join('\n');

        expect(rendered).toBe(expected);
      });

      it('stamps multi-line message inside taller box', () => {
        const grid = new CharGrid(36, 4);
        const node: SceneNode = {
          id: 'alert-box-multiline',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 4 },
          zIndex: 1,
          label: 'First alert line\nSecond alert line',
          meta: { alertVariant: 'warning' },
        };

        stampAlert(grid, node);

        const rendered = grid.renderToString();
        const expected = [
          '┌─ [!] Warning ────────────────────┐',
          '│ First alert line                 │',
          '│ Second alert line                │',
          '└──────────────────────────────────┘',
        ].join('\n');

        expect(rendered).toBe(expected);
      });

      it('rasterizes alert through rasterizeScene', () => {
        const node: SceneNode = {
          id: 'alert-scene',
          type: 'alert',
          rect: { x: 0, y: 0, w: 36, h: 3 },
          zIndex: 1,
          label: 'All checks passed',
          meta: { alertVariant: 'success' },
        };

        const grid = rasterizeScene([node], 36, 3);
        expect(grid.renderToString()).toBe(
          [
            '┌─ [v] Success ────────────────────┐',
            '│ All checks passed                │',
            '└──────────────────────────────────┘',
          ].join('\n')
        );
      });
    });
  });
});
