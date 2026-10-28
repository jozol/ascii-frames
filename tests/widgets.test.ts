import { describe, it, expect } from 'vitest';
import { CharGrid } from '../src/core/rasterizer/char-grid.js';
import {
  stampButton,
  stampInput,
  stampSelect,
  stampCheckbox,
  stampRadio,
  stampToggle,
  stampText,
  stampContainer,
  stampCircle,
  stampLine,
} from '../src/core/rasterizer/widget-stampers.js';
import { SceneNode } from '../src/core/ast/types.js';

describe('Widget Stampers DSL Compliance', () => {
  it('stamps secondary and primary buttons correctly', () => {
    const grid = new CharGrid(25, 4);

    const btnSec: SceneNode = {
      id: 'btn-1',
      type: 'button',
      rect: { x: 0, y: 0, w: 10, h: 1 },
      zIndex: 1,
      label: 'Save',
    };

    const btnPrim: SceneNode = {
      id: 'btn-2',
      type: 'button',
      rect: { x: 0, y: 2, w: 14, h: 1 },
      zIndex: 1,
      label: 'Submit',
      meta: { variant: 'primary' },
    };

    stampButton(grid, btnSec);
    stampButton(grid, btnPrim);

    expect(grid.cells[0].join('').trimEnd()).toBe('[  Save  ]');
    expect(grid.cells[2].join('').trimEnd()).toBe('[#  Submit  #]');
  });

  it('stamps input field with placeholder and padding', () => {
    const grid = new CharGrid(25, 2);

    const inputNode: SceneNode = {
      id: 'input-1',
      type: 'input',
      rect: { x: 0, y: 0, w: 20, h: 1 },
      zIndex: 1,
      label: 'Placeholder...',
    };

    stampInput(grid, inputNode);

    // Expected format: '[ Placeholder...   ]'
    expect(grid.cells[0].join('').trimEnd()).toBe('[ Placeholder...   ]');
  });

  it('stamps select dropdown with value and trailing indicator', () => {
    const grid = new CharGrid(25, 2);

    const selectNode: SceneNode = {
      id: 'select-1',
      type: 'select',
      rect: { x: 0, y: 0, w: 22, h: 1 },
      zIndex: 1,
      label: 'Value',
    };

    stampSelect(grid, selectNode);

    // Expected format: '[ Value          v ]'
    expect(grid.cells[0].join('').trimEnd()).toBe('[ Value            v ]');
  });

  it('stamps checked and unchecked checkboxes', () => {
    const grid = new CharGrid(20, 2);

    const check1: SceneNode = {
      id: 'chk-1',
      type: 'checkbox',
      rect: { x: 0, y: 0, w: 20, h: 1 },
      zIndex: 1,
      label: 'Remember me',
      meta: { checked: false },
    };

    const check2: SceneNode = {
      id: 'chk-2',
      type: 'checkbox',
      rect: { x: 0, y: 1, w: 20, h: 1 },
      zIndex: 1,
      label: 'Accept terms',
      meta: { checked: true },
    };

    stampCheckbox(grid, check1);
    stampCheckbox(grid, check2);

    expect(grid.cells[0].join('').trimEnd()).toBe('[ ] Remember me');
    expect(grid.cells[1].join('').trimEnd()).toBe('[x] Accept terms');
  });

  it('stamps selected and unselected radio buttons', () => {
    const grid = new CharGrid(20, 2);

    const r1: SceneNode = {
      id: 'rad-1',
      type: 'radio',
      rect: { x: 0, y: 0, w: 12, h: 1 },
      zIndex: 1,
      label: 'Option A',
      meta: { checked: false },
    };

    const r2: SceneNode = {
      id: 'rad-2',
      type: 'radio',
      rect: { x: 0, y: 1, w: 12, h: 1 },
      zIndex: 1,
      label: 'Option B',
      meta: { checked: true },
    };

    stampRadio(grid, r1);
    stampRadio(grid, r2);

    expect(grid.cells[0].join('').trimEnd()).toBe('( ) Option A');
    expect(grid.cells[1].join('').trimEnd()).toBe('(•) Option B');
  });

  it('stamps on and off toggles', () => {
    const grid = new CharGrid(20, 2);

    const tOff: SceneNode = {
      id: 'tog-1',
      type: 'toggle',
      rect: { x: 0, y: 0, w: 20, h: 1 },
      zIndex: 1,
      label: 'Dark Mode',
      meta: { checked: false },
    };

    const tOn: SceneNode = {
      id: 'tog-2',
      type: 'toggle',
      rect: { x: 0, y: 1, w: 20, h: 1 },
      zIndex: 1,
      label: 'Notifications',
      meta: { checked: true },
    };

    stampToggle(grid, tOff);
    stampToggle(grid, tOn);

    expect(grid.cells[0].join('').trimEnd()).toBe('(o─) Dark Mode');
    expect(grid.cells[1].join('').trimEnd()).toBe('(─o) Notifications');
  });

  it('stamps text label and clamps to width', () => {
    const grid = new CharGrid(20, 2);

    const textNode: SceneNode = {
      id: 'txt-1',
      type: 'text',
      rect: { x: 2, y: 0, w: 10, h: 1 },
      zIndex: 1,
      label: 'Hello World and Universe',
    };

    stampText(grid, textNode);

    expect(grid.cells[0].slice(2, 12).join('')).toBe('Hello Worl');
  });

  it('stamps container with title at top-left', () => {
    const grid = new CharGrid(16, 4);

    const containerNode: SceneNode = {
      id: 'c-1',
      type: 'container',
      rect: { x: 0, y: 0, w: 16, h: 4 },
      zIndex: 0,
      label: 'Settings',
    };

    stampContainer(grid, containerNode);

    const lines = grid.renderToString().split('\n');
    expect(lines[0]).toBe('┌─ Settings ───┐');
    expect(lines[1]).toBe('│              │');
    expect(lines[2]).toBe('│              │');
    expect(lines[3]).toBe('└──────────────┘');
  });

  it('stamps containers with custom border styles (rounded, double, dashed, minimal)', () => {
    // 1. Rounded
    const gridR = new CharGrid(12, 3);
    stampContainer(gridR, {
      id: 'c-rnd',
      type: 'container',
      rect: { x: 0, y: 0, w: 12, h: 3 },
      zIndex: 0,
      label: 'Card',
      meta: { borderStyle: 'rounded' },
    });
    const linesR = gridR.renderToString().split('\n');
    expect(linesR[0]).toBe('╭─ Card ───╮');
    expect(linesR[1]).toBe('│          │');
    expect(linesR[2]).toBe('╰──────────╯');

    // 2. Double
    const gridD = new CharGrid(12, 3);
    stampContainer(gridD, {
      id: 'c-dbl',
      type: 'container',
      rect: { x: 0, y: 0, w: 12, h: 3 },
      zIndex: 0,
      label: 'Modal',
      meta: { borderStyle: 'double' },
    });
    const linesD = gridD.renderToString().split('\n');
    expect(linesD[0]).toBe('╔═ Modal ══╗');
    expect(linesD[1]).toBe('║          ║');
    expect(linesD[2]).toBe('╚══════════╝');

    // 3. Dashed
    const gridDash = new CharGrid(12, 3);
    stampContainer(gridDash, {
      id: 'c-dsh',
      type: 'container',
      rect: { x: 0, y: 0, w: 12, h: 3 },
      zIndex: 0,
      label: 'Slot',
      meta: { borderStyle: 'dashed' },
    });
    const linesDash = gridDash.renderToString().split('\n');
    expect(linesDash[0]).toBe('+- Slot ---+');
    expect(linesDash[1]).toBe('|          |');
    expect(linesDash[2]).toBe('+----------+');

    // 4. Minimal
    const gridMin = new CharGrid(14, 2);
    stampContainer(gridMin, {
      id: 'c-min',
      type: 'container',
      rect: { x: 0, y: 0, w: 14, h: 2 },
      zIndex: 0,
      label: 'Section',
      meta: { borderStyle: 'minimal' },
    });
    const linesMin = gridMin.renderToString().split('\n');
    expect(linesMin[0]).toBe('── Section ───');
    expect(linesMin[1]).toBe('');
  });

  it('stamps circle and avatar widgets with proper curve geometry', () => {
    // 1. Compact 1-line Avatar: ( Label )
    const grid1 = new CharGrid(10, 1);
    stampCircle(grid1, {
      id: 'circ-1',
      type: 'circle',
      rect: { x: 0, y: 0, w: 10, h: 1 },
      zIndex: 1,
      label: 'JD',
    });
    expect(grid1.renderToString().trimEnd()).toBe('(   JD   )');

    // 2. 3x3 Smooth Avatar Icon
    const grid3 = new CharGrid(6, 3);
    stampCircle(grid3, {
      id: 'circ-3',
      type: 'circle',
      rect: { x: 0, y: 0, w: 6, h: 3 },
      zIndex: 1,
      label: 'JD',
    });
    const lines3 = grid3.renderToString().split('\n');
    expect(lines3[0]).toBe('╭────╮');
    expect(lines3[1]).toBe('│ JD │');
    expect(lines3[2]).toBe('╰────╯');

    // 3. Tapered 8x4 Circle
    const grid4 = new CharGrid(8, 4);
    stampCircle(grid4, {
      id: 'circ-4',
      type: 'circle',
      rect: { x: 0, y: 0, w: 8, h: 4 },
      zIndex: 1,
      label: 'User',
    });
    const lines4 = grid4.renderToString().split('\n');
    expect(lines4[0]).toBe(' ╭────╮');
    expect(lines4[1]).toBe('│      │');
    expect(lines4[2]).toBe('│ User │');
    expect(lines4[3]).toBe(' ╰────╯');
  });

  it('stamps lines, connectors, arrows, and diagonal slopes', () => {
    // 1. Horizontal Arrow Connector
    const gridH = new CharGrid(10, 1);
    stampLine(gridH, {
      id: 'l-1',
      type: 'line',
      rect: { x: 0, y: 0, w: 10, h: 1 },
      zIndex: 1,
      meta: { lineEnding: 'arrow' },
    });
    expect(gridH.renderToString().trimEnd()).toBe('─────────►');

    // 2. Horizontal Line with Label
    const gridHL = new CharGrid(12, 1);
    stampLine(gridHL, {
      id: 'l-2',
      type: 'line',
      rect: { x: 0, y: 0, w: 12, h: 1 },
      zIndex: 1,
      label: 'click',
      meta: { lineEnding: 'arrow' },
    });
    expect(gridHL.renderToString().trimEnd()).toBe('── click ──►');

    // 3. Vertical Connector
    const gridV = new CharGrid(3, 4);
    stampLine(gridV, {
      id: 'l-3',
      type: 'line',
      rect: { x: 1, y: 0, w: 1, h: 4 },
      zIndex: 1,
      meta: { lineEnding: 'arrow' },
    });
    const linesV = gridV.renderToString().split('\n');
    expect(linesV[0]).toBe(' │');
    expect(linesV[1]).toBe(' │');
    expect(linesV[2]).toBe(' │');
    expect(linesV[3]).toBe(' ▼');

    // 4. Diagonal Up (/)
    const gridUp = new CharGrid(4, 4);
    stampLine(gridUp, {
      id: 'l-up',
      type: 'line',
      rect: { x: 0, y: 0, w: 4, h: 4 },
      zIndex: 1,
      meta: { lineDirection: 'diagonal-up' },
    });
    const linesUp = gridUp.renderToString().split('\n');
    expect(linesUp[0]).toBe('   /');
    expect(linesUp[1]).toBe('  /');
    expect(linesUp[2]).toBe(' /');
    expect(linesUp[3]).toBe('/');

    // 5. Diagonal Down (\)
    const gridDown = new CharGrid(4, 4);
    stampLine(gridDown, {
      id: 'l-down',
      type: 'line',
      rect: { x: 0, y: 0, w: 4, h: 4 },
      zIndex: 1,
      meta: { lineDirection: 'diagonal-down' },
    });
    const linesDown = gridDown.renderToString().split('\n');
    expect(linesDown[0]).toBe('\\');
    expect(linesDown[1]).toBe(' \\');
    expect(linesDown[2]).toBe('  \\');
    expect(linesDown[3]).toBe('   \\');

    // 6. Elbow / Orthogonal Connector
    const gridElbow = new CharGrid(6, 4);
    stampLine(gridElbow, {
      id: 'l-elbow',
      type: 'line',
      rect: { x: 0, y: 0, w: 6, h: 4 },
      zIndex: 1,
      meta: { lineDirection: 'elbow', lineEnding: 'arrow' },
    });
    const linesElbow = gridElbow.renderToString().split('\n');
    expect(linesElbow[0]).toBe('─────┐');
    expect(linesElbow[1]).toBe('     │');
    expect(linesElbow[2]).toBe('     │');
    expect(linesElbow[3]).toBe('     ▼');
  });
});
