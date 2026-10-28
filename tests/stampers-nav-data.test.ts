import { describe, it, expect } from 'vitest';
import { CharGrid } from '../src/core/rasterizer/char-grid.js';
import {
  stampTabs,
  stampBreadcrumbs,
  stampTable,
} from '../src/core/rasterizer/stampers-nav-data.js';
import { rasterizeScene } from '../src/core/rasterizer/widget-stampers.js';
import { SceneNode } from '../src/core/ast/types.js';

describe('Navigation & Data Stampers', () => {
  describe('stampTabs', () => {
    it('stamps default boxed tabs', () => {
      const grid = new CharGrid(30, 2);
      const node: SceneNode = {
        id: 'tabs-1',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 30, h: 1 },
        zIndex: 1,
      };

      stampTabs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('[ Tab 1 ]  Tab 2  Tab 3');
    });

    it('stamps boxed tabs with custom items and active tab', () => {
      const grid = new CharGrid(40, 1);
      const node: SceneNode = {
        id: 'tabs-custom',
        type: 'tabs',
        rect: { x: 2, y: 0, w: 38, h: 1 },
        zIndex: 1,
        meta: {
          tabsVariant: 'boxed',
          tabs: ['Overview', 'Details', 'Settings'],
          activeTabIndex: 1,
        },
      };

      stampTabs(grid, node);

      expect(grid.renderToString()).toBe('  Overview  [ Details ]  Settings');
    });

    it('stamps underlined tabs on 2 rows', () => {
      const grid = new CharGrid(30, 3);
      const node: SceneNode = {
        id: 'tabs-und',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 30, h: 2 },
        zIndex: 1,
        meta: {
          tabsVariant: 'underlined',
          activeTabIndex: 0,
        },
      };

      stampTabs(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('Tab 1  Tab 2  Tab 3');
      expect(lines[1]).toBe('─────');
    });

    it('stamps underlined tabs with second tab active', () => {
      const grid = new CharGrid(30, 3);
      const node: SceneNode = {
        id: 'tabs-und-2',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 30, h: 2 },
        zIndex: 1,
        meta: {
          tabsVariant: 'underlined',
          tabs: ['Home', 'Profile', 'Billing'],
          activeTabIndex: 1,
        },
      };

      stampTabs(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('Home  Profile  Billing');
      // Home is 4 chars + 2 spaces = offset 6. Profile is 7 chars.
      expect(lines[1]).toBe('      ───────');
    });

    it('omits underline if h < 2', () => {
      const grid = new CharGrid(30, 1);
      const node: SceneNode = {
        id: 'tabs-und-flat',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 30, h: 1 },
        zIndex: 1,
        meta: {
          tabsVariant: 'underlined',
          activeTabIndex: 0,
        },
      };

      stampTabs(grid, node);

      expect(grid.renderToString()).toBe('Tab 1  Tab 2  Tab 3');
    });

    it('stamps pills variant correctly', () => {
      const grid = new CharGrid(40, 2);
      const node: SceneNode = {
        id: 'tabs-pills',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 40, h: 1 },
        zIndex: 1,
        meta: {
          tabsVariant: 'pills',
          activeTabIndex: 0,
        },
      };

      stampTabs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('(• Tab 1 )  ( Tab 2 )  ( Tab 3 )');
    });

    it('stamps pills with active tab index 2', () => {
      const grid = new CharGrid(40, 2);
      const node: SceneNode = {
        id: 'tabs-pills-2',
        type: 'tabs',
        rect: { x: 0, y: 0, w: 40, h: 1 },
        zIndex: 1,
        meta: {
          tabsVariant: 'pills',
          activeTabIndex: 2,
        },
      };

      stampTabs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('( Tab 1 )  ( Tab 2 )  (• Tab 3 )');
    });
  });

  describe('stampBreadcrumbs', () => {
    it('stamps default breadcrumb path', () => {
      const grid = new CharGrid(30, 2);
      const node: SceneNode = {
        id: 'bc-default',
        type: 'breadcrumbs',
        rect: { x: 0, y: 0, w: 30, h: 1 },
        zIndex: 1,
      };

      stampBreadcrumbs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('Home > Projects > Settings');
    });

    it('stamps breadcrumbs from node.meta.breadcrumbItems', () => {
      const grid = new CharGrid(40, 2);
      const node: SceneNode = {
        id: 'bc-items',
        type: 'breadcrumbs',
        rect: { x: 0, y: 0, w: 40, h: 1 },
        zIndex: 1,
        meta: {
          breadcrumbItems: ['Dashboard', 'Analytics', 'Reports', '2026'],
        },
      };

      stampBreadcrumbs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('Dashboard > Analytics > Reports > 2026');
    });

    it('stamps breadcrumbs parsed from label with > separator', () => {
      const grid = new CharGrid(40, 2);
      const node: SceneNode = {
        id: 'bc-label-gt',
        type: 'breadcrumbs',
        rect: { x: 0, y: 0, w: 40, h: 1 },
        zIndex: 1,
        label: 'Store > Electronics > Laptops',
      };

      stampBreadcrumbs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('Store > Electronics > Laptops');
    });

    it('stamps breadcrumbs parsed from label with / separator', () => {
      const grid = new CharGrid(40, 2);
      const node: SceneNode = {
        id: 'bc-label-slash',
        type: 'breadcrumbs',
        rect: { x: 0, y: 0, w: 40, h: 1 },
        zIndex: 1,
        label: 'Users / Profile / Edit',
      };

      stampBreadcrumbs(grid, node);

      expect(grid.cells[0].join('').trimEnd()).toBe('Users > Profile > Edit');
    });

    it('honors node.rect.x, node.rect.y and width clamping', () => {
      const grid = new CharGrid(30, 3);
      const node: SceneNode = {
        id: 'bc-offset',
        type: 'breadcrumbs',
        rect: { x: 3, y: 1, w: 12, h: 1 },
        zIndex: 1,
        label: 'Home > Store > Shoes',
      };

      stampBreadcrumbs(grid, node);

      // Total string 'Home > Store > Shoes' clamped to 12 chars: 'Home > Store'
      expect(grid.cells[1].slice(3, 15).join('')).toBe('Home > Store');
    });
  });

  describe('stampTable', () => {
    it('stamps default multi-column table with sample data', () => {
      const grid = new CharGrid(35, 6);
      const node: SceneNode = {
        id: 'tbl-1',
        type: 'table',
        rect: { x: 0, y: 0, w: 35, h: 5 },
        zIndex: 1,
      };

      stampTable(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('┌──────┬──────────────┬──────────┐');
      expect(lines[1]).toBe('│ ID   │ Name         │ Status   │');
      expect(lines[2]).toBe('├──────┼──────────────┼──────────┤');
      expect(lines[3]).toBe('│ #101 │ John Doe     │ Active   │');
      expect(lines[4]).toBe('│ #102 │ Jane Smith   │ Pending  │');
      expect(lines[5]).toBe('└──────┴──────────────┴──────────┘');
    });

    it('stamps custom columns with left, center, right alignments', () => {
      const grid = new CharGrid(32, 6);
      const node: SceneNode = {
        id: 'tbl-custom',
        type: 'table',
        rect: { x: 0, y: 0, w: 32, h: 5 },
        zIndex: 1,
        meta: {
          tableColumns: [
            { title: 'SKU', width: 8, align: 'left' },
            { title: 'Price', width: 10, align: 'right' },
            { title: 'Stock', width: 8, align: 'center' },
          ],
          tableRows: [
            ['A-12', '$19.99', '120'],
            ['B-99', '$4.50', '0'],
          ],
        },
      };

      stampTable(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('┌────────┬──────────┬────────┐');
      expect(lines[1]).toBe('│ SKU    │    Price │ Stock  │');
      expect(lines[2]).toBe('├────────┼──────────┼────────┤');
      expect(lines[3]).toBe('│ A-12   │   $19.99 │  120   │');
      expect(lines[4]).toBe('│ B-99   │    $4.50 │   0    │');
      expect(lines[5]).toBe('└────────┴──────────┴────────┘');
    });

    it('stamps empty table with 0 data rows', () => {
      const grid = new CharGrid(35, 4);
      const node: SceneNode = {
        id: 'tbl-empty',
        type: 'table',
        rect: { x: 0, y: 0, w: 35, h: 4 },
        zIndex: 1,
        meta: {
          tableRows: [],
        },
      };

      stampTable(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('┌──────┬──────────────┬──────────┐');
      expect(lines[1]).toBe('│ ID   │ Name         │ Status   │');
      expect(lines[2]).toBe('├──────┼──────────────┼──────────┤');
      expect(lines[3]).toBe('└──────┴──────────────┴──────────┘');
    });

    it('honors node.rect.x and node.rect.y coordinate offset', () => {
      const grid = new CharGrid(40, 8);
      const node: SceneNode = {
        id: 'tbl-offset',
        type: 'table',
        rect: { x: 3, y: 1, w: 35, h: 5 },
        zIndex: 1,
        meta: {
          tableRows: [['#1', 'Alice', 'OK']],
        },
      };

      stampTable(grid, node);

      const lines = grid.renderToString().split('\n');
      expect(lines[0]).toBe('');
      expect(lines[1]).toBe('   ┌──────┬──────────────┬──────────┐');
      expect(lines[2]).toBe('   │ ID   │ Name         │ Status   │');
      expect(lines[3]).toBe('   ├──────┼──────────────┼──────────┤');
      expect(lines[4]).toBe('   │ #1   │ Alice        │ OK       │');
      expect(lines[5]).toBe('   └──────┴──────────────┴──────────┘');
    });
  });

  describe('Integration with rasterizeScene', () => {
    it('rasterizes scene containing tabs, breadcrumbs, and table', () => {
      const scene: SceneNode[] = [
        {
          id: 'bc-1',
          type: 'breadcrumbs',
          rect: { x: 0, y: 0, w: 35, h: 1 },
          zIndex: 1,
        },
        {
          id: 'tabs-1',
          type: 'tabs',
          rect: { x: 0, y: 2, w: 35, h: 1 },
          zIndex: 1,
        },
        {
          id: 'tbl-1',
          type: 'table',
          rect: { x: 0, y: 4, w: 35, h: 5 },
          zIndex: 1,
        },
      ];

      const grid = rasterizeScene(scene);
      const output = grid.renderToString();

      expect(output).toContain('Home > Projects > Settings');
      expect(output).toContain('[ Tab 1 ]  Tab 2  Tab 3');
      expect(output).toContain('┌──────┬──────────────┬──────────┐');
      expect(output).toContain('│ ID   │ Name         │ Status   │');
    });
  });
});
