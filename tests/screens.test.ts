import { describe, it, expect } from 'vitest';
import { SceneNode, SCREEN_PRESETS } from '../src/core/ast/types.js';
import { rasterizeScene } from '../src/core/rasterizer/widget-stampers.js';
import { serializeToWireframe } from '../src/core/serializer/wireframe-md.js';

describe('Screen Sizes & Viewport Rasterization', () => {
  const sampleMobileApp: SceneNode[] = [
    {
      id: 'phone-frame',
      type: 'container',
      rect: { x: 0, y: 0, w: 32, h: 30 },
      zIndex: 0,
      label: 'iPhone App',
      children: [
        {
          id: 'status-bar',
          type: 'text',
          rect: { x: 2, y: 1, w: 28, h: 1 },
          zIndex: 1,
          label: '9:41 AM          5G [100%]',
        },
        {
          id: 'nav-header',
          type: 'text',
          rect: { x: 2, y: 3, w: 28, h: 1 },
          zIndex: 1,
          label: 'My Account',
        },
        {
          id: 'balance-card',
          type: 'container',
          rect: { x: 2, y: 5, w: 28, h: 6 },
          zIndex: 1,
          label: 'Balance',
          children: [
            {
              id: 'balance-amt',
              type: 'text',
              rect: { x: 4, y: 7, w: 20, h: 1 },
              zIndex: 2,
              label: '$4,850.25',
              meta: { binding: 'account.balance' },
            },
            {
              id: 'btn-transfer',
              type: 'button',
              rect: { x: 4, y: 9, w: 14, h: 1 },
              zIndex: 2,
              label: 'Transfer',
              meta: { variant: 'primary', action: 'openTransfer' },
            },
          ],
        },
        {
          id: 'tab-bar',
          type: 'divider',
          rect: { x: 0, y: 26, w: 32, h: 1 },
          zIndex: 1,
        },
        {
          id: 'tab-items',
          type: 'text',
          rect: { x: 2, y: 27, w: 28, h: 1 },
          zIndex: 1,
          label: '[Home]  [Cards]  [Settings]',
        },
      ],
    },
  ];

  it('rasterizes exactly into mobile standard viewport (32×30)', () => {
    const mobileScreen = SCREEN_PRESETS.find((s) => s.id === 'mobile-standard')!;
    expect(mobileScreen).toBeDefined();

    const grid = rasterizeScene(sampleMobileApp, mobileScreen.width, mobileScreen.height);

    expect(grid.width).toBe(32);
    expect(grid.height).toBe(30);

    const rendered = grid.renderToString();
    expect(rendered).toContain('iPhone App');
    expect(rendered).toContain('9:41 AM');
    expect(rendered).toContain('$4,850.25');
    expect(rendered).toContain('[# Transfer #]');
    expect(rendered).toContain('[Home]  [Cards]  [Settings]');
  });

  it('rasterizes into desktop screen with padding', () => {
    const desktopScreen = SCREEN_PRESETS.find((s) => s.id === 'desktop-standard')!;
    expect(desktopScreen).toBeDefined();

    const grid = rasterizeScene(sampleMobileApp, desktopScreen.width, desktopScreen.height);
    expect(grid.width).toBe(84);
    expect(grid.height).toBe(34);
  });

  it('serializes to WIREFRAME.md with target viewport metadata', () => {
    const mobileScreen = SCREEN_PRESETS.find((s) => s.id === 'mobile-standard')!;
    const md = serializeToWireframe(sampleMobileApp, {
      title: 'Banking Mobile App',
      screen: mobileScreen,
    });

    expect(md).toContain('# Banking Mobile App');
    expect(md).toContain('> **Target Viewport:** Phone (Standard - 32×30) (32 × 30 cells) | Orientation: portrait');
    expect(md).toContain('## Annotations');
    expect(md).toContain('- **balance-amt** ($4,850.25): binding: account.balance');
    expect(md).toContain('- **btn-transfer** (Transfer): action: openTransfer');
  });

  it('supports orientation swap (portrait to landscape)', () => {
    const portrait = SCREEN_PRESETS.find((s) => s.id === 'tablet-portrait')!;
    expect(portrait.width).toBe(48);
    expect(portrait.height).toBe(36);

    // Swap to landscape
    const landscapeW = portrait.height;
    const landscapeH = portrait.width;

    const grid = rasterizeScene(sampleMobileApp, landscapeW, landscapeH);
    expect(grid.width).toBe(36);
    expect(grid.height).toBe(48);
  });
});
