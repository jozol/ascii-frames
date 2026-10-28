import { describe, it, expect } from 'vitest';
import { SceneNode } from '../src/core/ast/types.js';
import { serializeToWireframe } from '../src/core/serializer/wireframe-md.js';

describe('Dashboard Pipeline Verification', () => {
  it('constructs 2-column layout AST and compiles to WIREFRAME.md', () => {
    // 2-Column Layout: Sidebar (left column) + Header + 2 Cards + Action Button (right column)
    const sidebar: SceneNode = {
      id: 'sidebar',
      type: 'container',
      rect: { x: 0, y: 0, w: 14, h: 14 },
      zIndex: 0,
      label: 'Sidebar',
      meta: { layoutRule: 'fixed-left' },
      children: [
        {
          id: 'nav-dash',
          type: 'text',
          rect: { x: 2, y: 2, w: 9, h: 1 },
          zIndex: 1,
          label: 'Dashboard',
        },
        {
          id: 'nav-settings',
          type: 'text',
          rect: { x: 2, y: 4, w: 8, h: 1 },
          zIndex: 1,
          label: 'Settings',
        },
      ],
    };

    const header: SceneNode = {
      id: 'header',
      type: 'container',
      rect: { x: 13, y: 0, w: 28, h: 4 },
      zIndex: 0,
      label: 'Header',
      meta: { layoutRule: 'sticky-top' },
      children: [
        {
          id: 'search-input',
          type: 'input',
          rect: { x: 15, y: 1, w: 18, h: 1 },
          zIndex: 1,
          label: 'Search...',
          meta: { binding: 'searchQuery' },
        },
      ],
    };

    const card1: SceneNode = {
      id: 'card-1',
      type: 'container',
      rect: { x: 13, y: 3, w: 28, h: 5 },
      zIndex: 0,
      label: 'Metrics',
      meta: { layoutRule: 'flex-1' },
      children: [
        {
          id: 'metric-revenue',
          type: 'text',
          rect: { x: 15, y: 5, w: 20, h: 1 },
          zIndex: 1,
          label: 'Revenue: $12,450',
          meta: { binding: 'metrics.revenue' },
        },
      ],
    };

    const card2: SceneNode = {
      id: 'card-2',
      type: 'container',
      rect: { x: 13, y: 7, w: 28, h: 7 },
      zIndex: 0,
      label: 'Actions',
      meta: { layoutRule: 'flex-1' },
      children: [
        {
          id: 'auto-deploy-toggle',
          type: 'toggle',
          rect: { x: 15, y: 9, w: 20, h: 1 },
          zIndex: 1,
          label: 'Auto-deploy',
          meta: { checked: true, binding: 'settings.autoDeploy' },
        },
        {
          id: 'action-btn',
          type: 'button',
          rect: { x: 15, y: 11, w: 12, h: 1 },
          zIndex: 1,
          label: 'Deploy',
          meta: {
            variant: 'primary',
            action: 'triggerDeploy',
            layoutRule: 'align-right',
          },
        },
      ],
    };

    const ast: SceneNode[] = [sidebar, header, card1, card2];

    const wireframeMd = serializeToWireframe(ast, { title: 'Dashboard' });

    // Snapshot test exact multi-line string
    expect(wireframeMd).toMatchInlineSnapshot(`
      "# Dashboard

      \`\`\`text
      ┌─ Sidebar ──┬─ Header ─────────────────┐
      │            │ [ Search...      ]       │
      │ Dashboard  │                          │
      │            ├─ Metrics ────────────────┤
      │ Settings   │                          │
      │            │ Revenue: $12,450         │
      │            │                          │
      │            ├─ Actions ────────────────┤
      │            │                          │
      │            │ (─o) Auto-deploy         │
      │            │                          │
      │            │ [# Deploy #]             │
      │            │                          │
      └────────────┴──────────────────────────┘
      \`\`\`

      ## Annotations

      - **action-btn** (Deploy): action: triggerDeploy, layoutRule: align-right
      - **auto-deploy-toggle** (Auto-deploy): binding: settings.autoDeploy
      - **card-1** (Metrics): layoutRule: flex-1
      - **card-2** (Actions): layoutRule: flex-1
      - **header** (Header): layoutRule: sticky-top
      - **metric-revenue** (Revenue: $12,450): binding: metrics.revenue
      - **search-input** (Search...): binding: searchQuery
      - **sidebar** (Sidebar): layoutRule: fixed-left
      "
    `);
  });
});
