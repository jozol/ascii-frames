// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EditorApp } from '../src/editor/app.js';
import { EditorState } from '../src/editor/editor-state.js';

describe('Editor UI Realistic User Interaction Suite', () => {
  let app: EditorApp;
  let htmlTemplate: string;

  beforeEach(() => {
    // Read actual index.html to guarantee test fidelity
    const htmlPath = path.resolve(__dirname, '../index.html');
    const fullHtml = fs.readFileSync(htmlPath, 'utf-8');

    // Extract body contents without script tag
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const cleanHtml = (bodyMatch ? bodyMatch[1] : '').replace(
      /<script[\s\S]*?<\/script>/gi,
      ''
    );
    document.body.innerHTML = cleanHtml;

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock localStorage
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });

    // Boot App
    app = new EditorApp(document);
  });

  afterEach(() => {
    app.destroy();
  });

  it('Case 1: Browses and switches presets seamlessly', () => {
    // 1. Initial Dashboard preset
    expect(app.asciiOutput.textContent).toContain('┌─ Navigation ───┬─ Header');
    expect(app.asciiOutput.textContent).toContain('Revenue: $128,450');
    expect(app.asciiOutput.textContent).toContain('[# Deploy Build #]');

    // 2. User selects Authentication Dialog
    app.presetSelect.value = 'login-modal';
    app.presetSelect.dispatchEvent(new Event('change'));

    expect(app.asciiOutput.textContent).toContain('┌─ Sign In ────────────────────────┐');
    expect(app.asciiOutput.textContent).toContain('[ alex@company.com');
    expect(app.asciiOutput.textContent).toContain('[x] Remember me');
    expect(app.asciiOutput.textContent).toContain('[#  Log In  #]');

    // 3. User selects Smartwatch Glance
    app.presetSelect.value = 'watch-glance';
    app.presetSelect.dispatchEvent(new Event('change'));

    expect(app.asciiOutput.textContent).toContain('┌─ Heart Rate ─────┐');
    expect(app.asciiOutput.textContent).toContain('<3 76 BPM');
    expect(app.asciiOutput.textContent).toContain('Pause');
  });

  it('Case 2: Selects a widget and modifies properties with live re-rasterization', () => {
    // User clicks on deploy button in the hierarchy tree
    const deployItem = document.querySelector<HTMLElement>('[data-node-id="action-btn"]');
    expect(deployItem).not.toBeNull();
    deployItem!.click();

    // Inspector should now be visible and populated
    expect(app.inspectorForm.style.display).toBe('flex');
    expect(app.propId.value).toBe('action-btn');
    expect(app.propLabel.value).toBe('Deploy Build');
    expect(app.propVariant.value).toBe('primary');

    // User updates label to "Launch"
    app.propLabel.value = 'Launch';
    app.propLabel.dispatchEvent(new Event('input'));

    // Canvas immediately updates
    expect(app.asciiOutput.textContent).toContain('[#    Launch    #]');

    // User changes variant from primary to secondary
    app.propVariant.value = 'secondary';
    app.propVariant.dispatchEvent(new Event('change'));

    // Canvas immediately updates to secondary syntax
    expect(app.asciiOutput.textContent).toContain('Launch');

    // Auto-fit width test: user types a very long label "Launch Production Cluster"
    app.propLabel.value = 'Launch Production Cluster';
    app.propLabel.dispatchEvent(new Event('input'));
    expect(app.state.getSelectedNode()!.rect.w).toBeGreaterThanOrEqual(
      'Launch Production Cluster'.length + 4
    );
    expect(app.asciiOutput.textContent).toContain('Launch Production Cluster');
  });

  it('Case 2b: Selects widget directly by clicking on the ASCII Canvas', () => {
    // Mock clientToCell to click on action-btn (located at x: 53, y: 11)
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 55, cellY: 11 });

    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      })
    );

    // Selected node should now be action-btn
    expect(app.state.selectedId).toBe('action-btn');
    expect(app.propId.value).toBe('action-btn');
  });

  it('Case 3: Nudges and resizes widgets using buttons and keyboard shortcuts', () => {
    // Select action-btn
    app.state.selectNode('action-btn');
    const initialRect = { ...app.state.getSelectedNode()!.rect };

    // User clicks Nudge Right button
    app.nudgeRight.click();
    expect(app.state.getSelectedNode()!.rect.x).toBe(initialRect.x + 1);

    // User clicks Nudge Down button
    app.nudgeDown.click();
    expect(app.state.getSelectedNode()!.rect.y).toBe(initialRect.y + 1);

    // User presses ArrowLeft keyboard shortcut
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(app.state.getSelectedNode()!.rect.x).toBe(initialRect.x);

    // User resizes width (+W)
    app.resizeWPlus.click();
    expect(app.state.getSelectedNode()!.rect.w).toBe(initialRect.w + 1);

    // Clamping test: negative moves clamp to 0
    for (let i = 0; i < 70; i++) {
      app.nudgeLeft.click();
      app.nudgeUp.click();
    }
    expect(app.state.getSelectedNode()!.rect.x).toBe(0);
    expect(app.state.getSelectedNode()!.rect.y).toBe(0);

    // Clamping test: container resize respects minimum w >= 3, h >= 3
    app.state.selectNode('sidebar');
    for (let i = 0; i < 50; i++) {
      app.resizeWMinus.click();
      app.resizeHMinus.click();
    }
    expect(app.state.getSelectedNode()!.rect.w).toBeGreaterThanOrEqual(3);
    expect(app.state.getSelectedNode()!.rect.h).toBeGreaterThanOrEqual(3);
  });

  it('Case 4: Adds widgets from the component gallery and verifies canvas output', () => {
    // Switch to Components Gallery tab
    app.tabComponents.click();
    expect(app.viewComponents.style.display).toBe('block');

    // User clicks Primary Button from the gallery
    const addBtn = document.querySelector<HTMLElement>('[data-create-component="button-primary"]');
    expect(addBtn).not.toBeNull();
    addBtn!.click();

    // A new button should be added to the scene and selected
    const selected = app.state.getSelectedNode();
    expect(selected).toBeDefined();
    expect(selected?.type).toBe('button');
    expect(app.asciiOutput.textContent).toContain(selected?.label);

    // User clicks Input Field
    const addInput = document.querySelector<HTMLElement>('[data-create-component="input"]');
    addInput!.click();
    const selectedInput = app.state.getSelectedNode();
    expect(selectedInput?.type).toBe('input');
    expect(app.asciiOutput.textContent).toContain(`[ ${selectedInput?.label}`);

    // User clicks Container / Frame
    const addContainer = document.querySelector<HTMLElement>('[data-create-component="container"]');
    addContainer!.click();
    const selectedContainer = app.state.getSelectedNode();
    expect(selectedContainer?.type).toBe('container');
    expect(selectedContainer?.rect.w).toBeGreaterThanOrEqual(3);
    expect(selectedContainer?.rect.h).toBeGreaterThanOrEqual(3);
  });

  it('Case 5: Deletes widget and utilizes Undo / Redo history', () => {
    // Select action-btn
    app.state.selectNode('action-btn');
    expect(app.asciiOutput.textContent).toContain('[# Deploy Build #]');

    // User deletes widget
    app.btnDeleteNode.click();
    expect(app.state.getSelectedNode()).toBeUndefined();
    expect(app.asciiOutput.textContent).not.toContain('[# Deploy Build #]');

    // User realizes mistake and clicks Undo
    app.btnUndo.click();
    expect(app.asciiOutput.textContent).toContain('[# Deploy Build #]');

    // User clicks Redo
    app.btnRedo.click();
    expect(app.asciiOutput.textContent).not.toContain('[# Deploy Build #]');

    // Undo again with Cmd+Z
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    expect(app.asciiOutput.textContent).toContain('[# Deploy Build #]');
  });

  it('Case 6: Switches tabs, copies WIREFRAME.md, and edits AST JSON live', async () => {
    // Switch to Spec (Markdown) Tab
    app.tabSpec.click();

    expect(app.viewMarkdown.style.display).toBe('block');
    expect(app.viewDesign.style.display).toBe('none');
    expect(app.markdownOutput.value).toContain('# Wireframe Specification');
    expect(app.markdownOutput.value).toContain('## Annotations');
    expect(app.markdownOutput.value).toContain('- **action-btn** (Deploy Build): action: triggerDeploy');

    // Click Copy MD
    app.btnCopy.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(app.state.getMarkdown());

    // Switch to JSON Tab
    app.tabJson.click();

    expect(app.viewJson.style.display).toBe('block');
    const ast = JSON.parse(app.jsonInput.value);
    expect(Array.isArray(ast)).toBe(true);

    // User modifies JSON text
    ast[0].label = 'CustomNav';
    app.jsonInput.value = JSON.stringify(ast, null, 2);
    app.btnApplyJson.click();

    // Verify canvas updated
    expect(app.asciiOutput.textContent).toContain('CustomNav');

    // User types invalid JSON and applies
    app.jsonInput.value = 'INVALID_JSON_SYNTAX{{{';
    app.btnApplyJson.click();
    // App should not crash; toast shows error
    const toast = document.querySelector('.toast');
    expect(toast?.textContent).toContain('Invalid JSON');
  });

  it('Case 7: Toggles Dark / Light mode and persists preference', () => {
    // Initial theme
    expect(localStorage.getItem('ascii-frames-theme')).toBe('auto');

    // Click toggle -> switches to dark or light
    app.themeToggle.click();
    const theme1 = localStorage.getItem('ascii-frames-theme');
    expect(theme1).toMatch(/^(dark|light)$/);

    // Click toggle again -> switches to opposite
    app.themeToggle.click();
    const theme2 = localStorage.getItem('ascii-frames-theme');
    expect(theme2).not.toBe(theme1);
  });

  it('Case 8: Re-rasterization strictly satisfies the < 2ms performance budget', () => {
    // Warm-up JIT
    for (let w = 0; w < 10; w++) {
      app.state.rasterize();
    }

    const durations: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      app.nudgeRight.click();
      durations.push(app.state.lastRenderMs);
      app.nudgeLeft.click();
      durations.push(app.state.lastRenderMs);
    }

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avg).toBeLessThan(2.0); // Budget is < 2ms per frame
  });

  it('Case 9: Figma Drawing Tool & Drag-to-Draw Frame on Canvas', () => {
    // 1. Switch tool to Frame (F) via shortcut
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    expect(app.state.activeTool).toBe('container');

    // Mock cell metrics
    vi.spyOn(app, 'getCellMetrics').mockReturnValue({
      charW: 10,
      charH: 15,
      padLeft: 24,
      padTop: 24,
    });
    vi.spyOn(app, 'clientToCell')
      .mockReturnValueOnce({ cellX: 5, cellY: 5 }) // pointerdown
      .mockReturnValueOnce({ cellX: 25, cellY: 15 }); // pointerup

    // Simulate drag-to-draw
    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 74, clientY: 99, bubbles: true })
    );
    window.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 274, clientY: 249, bubbles: true })
    );

    // Container should be created at (5, 5, 21, 11) and selected
    const selected = app.state.getSelectedNode();
    expect(selected).toBeDefined();
    expect(selected?.type).toBe('container');
    expect(selected?.rect.x).toBe(5);
    expect(selected?.rect.y).toBe(5);
    expect(selected?.rect.w).toBe(21);
    expect(selected?.rect.h).toBe(11);
    expect(app.state.activeTool).toBe('select'); // Automatically returns to select tool
  });

  it('Case 9b: Drag-to-Resize handles (SE, W, N) with smooth snapping and single-step undo', () => {
    // 1. Select card-actions container (initial rect: x: 50, y: 3, w: 34, h: 12)
    app.state.selectNode('card-actions');
    const initialNode = app.state.getSelectedNode()!;
    expect(initialNode.rect).toEqual({ x: 50, y: 3, w: 34, h: 12 });

    // Mock cell metrics
    vi.spyOn(app, 'getCellMetrics').mockReturnValue({
      charW: 10,
      charH: 15,
      padLeft: 24,
      padTop: 24,
    });

    // 2. Test South-East Handle (SE)
    const seHandle = app.selectionOverlay.querySelector<HTMLElement>('.handle.se')!;
    expect(seHandle).not.toBeNull();
    expect(seHandle.dataset.handle).toBe('se');

    // Simulate pointerdown on SE handle at (100, 100)
    seHandle.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
    );

    // Drag +30px X (+3 cells) and +45px Y (+3 cells)
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 130, clientY: 145, bubbles: true })
    );

    let current = app.state.getSelectedNode()!;
    expect(current.rect.w).toBe(37); // 34 + 3
    expect(current.rect.h).toBe(15); // 12 + 3
    expect(current.rect.x).toBe(50);
    expect(current.rect.y).toBe(3);

    // End drag
    window.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 130, clientY: 145, bubbles: true })
    );

    // 3. Test Single-Step Undo
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    current = app.state.getSelectedNode()!;
    expect(current.rect).toEqual({ x: 50, y: 3, w: 34, h: 12 });

    // 4. Test West Handle (W) - Expands left, anchors right
    const wHandle = app.selectionOverlay.querySelector<HTMLElement>('.handle.w')!;
    expect(wHandle).not.toBeNull();
    expect(wHandle.dataset.handle).toBe('w');

    wHandle.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
    );

    // Drag -20px X (-2 cells) to the left
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 80, clientY: 100, bubbles: true })
    );

    current = app.state.getSelectedNode()!;
    expect(current.rect.x).toBe(48); // 50 - 2
    expect(current.rect.w).toBe(36); // 34 + 2 (right edge still at 48 + 36 = 84)
    expect(current.rect.y).toBe(3);
    expect(current.rect.h).toBe(12);

    window.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 80, clientY: 100, bubbles: true })
    );

    // 5. Test North Handle (N) - Expands up, anchors bottom
    const nHandle = app.selectionOverlay.querySelector<HTMLElement>('.handle.n')!;
    expect(nHandle).not.toBeNull();
    expect(nHandle.dataset.handle).toBe('n');

    nHandle.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
    );

    // Drag -15px Y (-1 cell) upwards
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 100, clientY: 85, bubbles: true })
    );

    current = app.state.getSelectedNode()!;
    expect(current.rect.y).toBe(2); // 3 - 1
    expect(current.rect.h).toBe(13); // 12 + 1 (bottom edge still at 2 + 13 = 15)

    window.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 100, clientY: 85, bubbles: true })
    );
  });

  it('Case 10: Duplicates layers with Cmd+D', () => {
    app.state.selectNode('sidebar');
    const initialCount = app.state.nodes.length;

    // Trigger Cmd+D
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true }));

    expect(app.state.nodes.length).toBe(initialCount + 1);
    const selected = app.state.getSelectedNode();
    expect(selected?.id).not.toBe('sidebar');
    expect(selected?.label).toBe('Navigation');
  });

  it('Case 11: Device Viewport Screen Size Selection and Orientation Toggling', () => {
    // 1. Initial dashboard preset is desktop-standard
    expect(app.screenSelect.value).toBe('desktop-standard');
    expect(app.artboardTitle.textContent).toContain('Web App - Desktop 1080p (84×34)');
    expect(app.artboardDims.textContent).toBe('84 × 34 cells');

    // 2. Switch to Mobile Phone (32 × 30)
    app.screenSelect.value = 'mobile-standard';
    app.screenSelect.dispatchEvent(new Event('change'));

    expect(app.state.currentScreen?.id).toBe('mobile-standard');
    expect(app.artboardIcon.textContent).toBe('[|]');
    expect(app.artboardTitle.textContent).toContain('Phone (Standard - 32×30)');
    expect(app.artboardDims.textContent).toBe('32 × 30 cells');

    // Markdown spec should have Target Viewport
    expect(app.markdownOutput.value).toContain('Phone (Standard - 32×30)');
    expect(app.markdownOutput.value).toContain('Target Viewport');

    // 3. Toggle Orientation (Portrait -> Landscape)
    app.btnOrientation.click();

    expect(app.state.screenOrientation).toBe('landscape');
    expect(app.artboardDims.textContent).toBe('30 × 32 cells');
    expect(app.artboardTitle.textContent).toContain('landscape');

    // 4. Switch to Smartwatch (20 × 14)
    app.screenSelect.value = 'watch-compact';
    app.screenSelect.dispatchEvent(new Event('change'));

    expect(app.artboardIcon.textContent).toBe('(o)');
    expect(app.artboardDims.textContent).toBe('20 × 14 cells');

    // 5. Switch to Dynamic Auto-Fit
    app.screenSelect.value = 'auto';
    app.screenSelect.dispatchEvent(new Event('change'));

    expect(app.state.currentScreen).toBeNull();
    expect(app.artboardIcon.textContent).toBe('[*]');
    expect(app.artboardTitle.textContent).toBe('Auto-Fit Content');
  });

  it('Case 12: Zen Copy Section, Wide Panel Expansion, and Canvas Non-Selectability', async () => {
    // 1. Verify canvas pointerdown calls preventDefault to block native text selection
    const pdEvent = new PointerEvent('pointerdown', { clientX: 200, clientY: 200, cancelable: true, bubbles: true });
    app.artboard.dispatchEvent(pdEvent);
    expect(pdEvent.defaultPrevented).toBe(true);

    // 2. Wide Panel View Toggle
    expect(app.btnToggleWide).toBeDefined();
    expect(app.isWideMode).toBe(false);

    app.btnToggleWide!.click();
    expect(app.isWideMode).toBe(true);
    const studioMain = document.querySelector('.studio-main');
    expect(studioMain?.classList.contains('wide-mode')).toBe(true);

    app.btnToggleWide!.click();
    expect(app.isWideMode).toBe(false);
    expect(studioMain?.classList.contains('wide-mode')).toBe(false);

    // 3. Spec / Output Copy Section
    app.tabSpec.click();
    expect(app.viewMarkdown.style.display).toBe('block');

    // Test Copy Raw ASCII
    expect(app.btnCopyAscii).toBeDefined();
    app.btnCopyAscii!.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(app.asciiOutput.textContent);

    // Test Format Pills Switcher
    expect(app.btnFormatAscii).toBeDefined();
    app.btnFormatAscii!.click();
    expect(app.specFormat).toBe('ascii');
    expect(app.markdownOutput.value).toBe(app.asciiOutput.textContent);
    expect(app.markdownOutput.value).not.toContain('# Wireframe Specification');

    // Switch back to WIREFRAME.md
    app.btnFormatMd!.click();
    expect(app.specFormat).toBe('md');
    expect(app.markdownOutput.value).toContain('# Wireframe Specification');
  });

  it('Case 15: Canvas Zoom in, Zoom out, Reset, Fit, Shortcuts, Wheel, and Coordinate Translation', () => {
    // 1. Initial zoom state
    expect(app.zoom).toBe(1.0);
    expect(app.btnZoomLevel.textContent).toBe('100%');

    // 2. Click Zoom In [+]
    app.btnZoomIn.click();
    expect(app.zoom).toBe(1.15);
    expect(app.btnZoomLevel.textContent).toBe('115%');
    expect(app.artboard.style.transform).toBe('scale(1.15)');

    // 3. Click Zoom Out [-] twice
    app.btnZoomOut.click();
    expect(app.zoom).toBe(1.0);
    expect(app.btnZoomLevel.textContent).toBe('100%');

    app.btnZoomOut.click();
    expect(app.zoom).toBe(0.85);
    expect(app.btnZoomLevel.textContent).toBe('85%');

    // 4. Click Zoom Level button to reset
    app.btnZoomLevel.click();
    expect(app.zoom).toBe(1.0);
    expect(app.btnZoomLevel.textContent).toBe('100%');

    // 5. Keyboard shortcuts: Cmd/Ctrl + '+', Cmd/Ctrl + '-', Cmd/Ctrl + '0'
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }));
    expect(app.zoom).toBe(1.15);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', metaKey: true }));
    expect(app.zoom).toBe(1.0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', metaKey: true }));
    expect(app.zoom).toBe(0.85);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', ctrlKey: true }));
    expect(app.zoom).toBe(1.0);

    // 6. Wheel event (pinch-to-zoom / ctrl + scroll)
    const target = app.canvasViewport || app.canvasArea;
    const wheelZoomIn = new WheelEvent('wheel', { bubbles: true });
    Object.defineProperty(wheelZoomIn, 'ctrlKey', { value: true });
    Object.defineProperty(wheelZoomIn, 'deltaY', { value: -100 });
    target.dispatchEvent(wheelZoomIn);
    expect(app.zoom).toBeGreaterThan(1.0);

    const wheelZoomOut = new WheelEvent('wheel', { bubbles: true });
    Object.defineProperty(wheelZoomOut, 'ctrlKey', { value: true });
    Object.defineProperty(wheelZoomOut, 'deltaY', { value: 200 });
    target.dispatchEvent(wheelZoomOut);
    expect(app.zoom).toBeLessThan(1.1);

    // Reset zoom
    app.setZoom(1.0);
    expect(app.zoom).toBe(1.0);

    // 7. Zoom to Fit
    expect(app.btnZoomFit).toBeDefined();
    app.btnZoomFit.click();
    expect(app.zoom).toBeGreaterThanOrEqual(0.25);
    expect(app.zoom).toBeLessThanOrEqual(3.0);

    // 8. Coordinate mapping under 200% zoom
    app.setZoom(2.0);
    vi.spyOn(app.asciiOutput, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 1600,
      height: 800,
      right: 1700,
      bottom: 850,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    vi.spyOn(app, 'getCellMetrics').mockReturnValue({
      charW: 10,
      charH: 15,
      padLeft: 20,
      padTop: 20,
    });

    // Screen point: left(100) + (padLeft(20) + 5 cells * 10 charW) * 2 zoom = 100 + 70 * 2 = 240
    // Screen point: top(50) + (padTop(20) + 3 cells * 15 charH) * 2 zoom = 50 + 65 * 2 = 180
    const cell = app.clientToCell(240, 180);
    expect(cell.cellX).toBe(5);
    expect(cell.cellY).toBe(3);

    // Clean up
    app.setZoom(1.0);
  });

  it('Case 16: Hand Tool & Canvas Panning with H shortcut, Space+Drag, and Middle Click', () => {
    // 1. Tool switching to Hand tool via button and keyboard shortcut
    const handBtn = document.querySelector<HTMLButtonElement>('#tool-hand');
    expect(handBtn).toBeDefined();
    handBtn!.click();
    expect(app.state.activeTool).toBe('hand');
    expect(handBtn!.classList.contains('active')).toBe(true);

    // Switch back to select
    app.state.setTool('select');
    expect(app.state.activeTool).toBe('select');

    // Press 'H' shortcut
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(app.state.activeTool).toBe('hand');

    // 2. Spacebar temporary pan mode
    app.state.setTool('select');
    expect(app.isSpacePressed).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    expect(app.isSpacePressed).toBe(true);
    expect(app.canvasViewport.style.cursor).toBe('grab');

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
    expect(app.isSpacePressed).toBe(false);
    expect(app.canvasViewport.style.cursor).toBe('default');

    // 3. Panning with Hand tool active
    app.state.setTool('hand');
    app.canvasViewport.scrollLeft = 100;
    app.canvasViewport.scrollTop = 50;

    // Pointer down starts panning
    app.canvasViewport.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true })
    );
    expect(app.isPanning).toBe(true);
    expect(app.canvasViewport.style.cursor).toBe('grabbing');

    // Pointer move scrolls viewport (e.g. dragged 50px left, 30px up => scroll increases)
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 150, clientY: 170 })
    );
    expect(app.canvasViewport.scrollLeft).toBe(150);
    expect(app.canvasViewport.scrollTop).toBe(80);

    // Pointer up ends panning
    window.dispatchEvent(new PointerEvent('pointerup', {}));
    expect(app.isPanning).toBe(false);
    expect(app.canvasViewport.style.cursor).toBe('grab');

    // 4. Middle mouse button (button === 1) CAD/Figma direct pan
    app.state.setTool('select');
    app.canvasViewport.scrollLeft = 200;
    app.canvasViewport.scrollTop = 150;

    app.canvasViewport.dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 1,
        clientX: 300,
        clientY: 300,
        bubbles: true,
      })
    );
    expect(app.isPanning).toBe(true);

    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 260, clientY: 250 })
    );
    expect(app.canvasViewport.scrollLeft).toBe(240);
    expect(app.canvasViewport.scrollTop).toBe(200);

    window.dispatchEvent(new PointerEvent('pointerup', {}));
    expect(app.isPanning).toBe(false);
    expect(app.canvasViewport.style.cursor).toBe('default');
  });

  it('Case 17: Multi-Artboard Screen Flows, Transitions & Interactive Mermaid Diagram Export', () => {
    // 1. Initial screen check
    expect(app.state.screens.length).toBe(1);
    expect(app.screenPillsList.querySelectorAll('.screen-pill').length).toBe(1);

    // 2. Add Screen 2 via UI button
    app.btnAddScreen.click();
    expect(app.state.screens.length).toBe(2);
    expect(app.state.activeScreenId).toBe(app.state.screens[1].id);

    const pills = app.screenPillsList.querySelectorAll<HTMLElement>('.screen-pill');
    expect(pills.length).toBe(2);
    expect(pills[1].classList.contains('active')).toBe(true);
    expect(pills[0].classList.contains('active')).toBe(false);

    // 3. Rename Screen 2
    const screen2Id = app.state.screens[1].id;
    app.state.renameScreen(screen2Id, 'Checkout View');
    expect(app.state.screens[1].name).toBe('Checkout View');

    // 4. Switch back to Screen 1 by clicking its pill
    pills[0].click();
    expect(app.state.activeScreenId).toBe(app.state.screens[0].id);

    // 5. Select a widget on Screen 1 and link transition to Screen 2
    const firstNode = app.state.nodes[0];
    expect(firstNode).toBeDefined();
    app.state.selectNode(firstNode.id);

    // Inspector transition dropdown should contain Screen 2 option
    expect(app.propTransition.options.length).toBeGreaterThanOrEqual(3); // None + Screen 1 + Checkout View
    app.propTransition.value = screen2Id;
    app.propTransition.dispatchEvent(new Event('change'));

    const updatedNode = app.state.getSelectedNode();
    expect(updatedNode?.meta?.transitionTarget).toBe(screen2Id);

    // 6. Multi-Screen WIREFRAME.md export validation
    const md = app.state.getMarkdown();
    expect(md).toContain('# Wireframe Flow Specification');
    expect(md).toContain('## User Journey Flow');
    expect(md).toContain('```mermaid');
    expect(md).toContain('flowchart LR');
    expect(md).toContain('Checkout View');
    expect(md).toContain('-->');
    expect(md).toContain('### Screen 1:');
    expect(md).toContain('### Screen 2: Checkout View');

    // 7. Duplicate Screen
    const dupId = app.state.duplicateScreen(screen2Id);
    expect(dupId).toBeDefined();
    expect(app.state.screens.length).toBe(3);

    // 8. Delete Screens and check invariant (cannot delete last screen)
    expect(app.state.removeScreen(dupId!)).toBe(true);
    expect(app.state.screens.length).toBe(2);

    expect(app.state.removeScreen(screen2Id)).toBe(true);
    expect(app.state.screens.length).toBe(1);

    // Attempting to remove the last screen must return false
    expect(app.state.removeScreen(app.state.screens[0].id)).toBe(false);
    expect(app.state.screens.length).toBe(1);
  });

  it('Case 18: Figma Vector Primitives (Circle [O], Line [L], and Container Border Styles)', () => {
    // 1. Tool switching via toolbar buttons
    const toolCircle = document.querySelector<HTMLButtonElement>('#tool-circle');
    const toolLine = document.querySelector<HTMLButtonElement>('#tool-line');
    expect(toolCircle).toBeDefined();
    expect(toolLine).toBeDefined();

    toolCircle!.click();
    expect(app.state.activeTool).toBe('circle');
    expect(toolCircle!.classList.contains('active')).toBe(true);

    toolLine!.click();
    expect(app.state.activeTool).toBe('line');
    expect(toolLine!.classList.contains('active')).toBe(true);

    // 2. Keyboard shortcuts (O and L)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
    expect(app.state.activeTool).toBe('select');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
    expect(app.state.activeTool).toBe('circle');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(app.state.activeTool).toBe('line');

    // 3. Adding Circle and Line from Component Palette
    const cardCircle = document.querySelector<HTMLElement>('[data-create-component="circle"]');
    const cardLine = document.querySelector<HTMLElement>('[data-create-component="line"]');
    expect(cardCircle).toBeDefined();
    expect(cardLine).toBeDefined();

    const nodeCountBefore = app.state.nodes.length;
    cardCircle!.click();
    expect(app.state.nodes.length).toBe(nodeCountBefore + 1);
    const addedCircle = app.state.getSelectedNode();
    expect(addedCircle?.type).toBe('circle');
    expect(addedCircle?.label).toBe('Avatar');

    cardLine!.click();
    expect(app.state.nodes.length).toBe(nodeCountBefore + 2);
    const addedLine = app.state.getSelectedNode();
    expect(addedLine?.type).toBe('line');

    // 4. Line Inspector Controls (Line Ending & Direction)
    expect(app.metaLineGroup.style.display).toBe('block');
    expect(app.metaBorderStyleGroup.style.display).toBe('none');

    app.propLineEnding.value = 'both';
    app.propLineEnding.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.lineEnding).toBe('both');

    app.propLineDirection.value = 'diagonal-up';
    app.propLineDirection.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.lineDirection).toBe('diagonal-up');

    // 5. Container Border Styles in Inspector
    app.state.clearCanvas();
    const containerId = app.state.addNewNode('container');
    app.state.selectNode(containerId);
    expect(app.metaBorderStyleGroup.style.display).toBe('block');
    expect(app.metaLineGroup.style.display).toBe('none');

    app.propBorderStyle.value = 'rounded';
    app.propBorderStyle.dispatchEvent(new Event('change'));
    const updatedContainer = app.state.getSelectedNode();
    expect(updatedContainer?.meta?.borderStyle).toBe('rounded');

    // Rasterize and assert rounded corners ╭ and ╰ appear on artboard
    const { renderedText } = app.state.rasterize();
    expect(renderedText).toContain('╭');
    expect(renderedText).toContain('╰');

    // Switch to double border
    app.propBorderStyle.value = 'double';
    app.propBorderStyle.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.borderStyle).toBe('double');
    const { renderedText: doubleText } = app.state.rasterize();
    expect(doubleText).toContain('╔');
    expect(doubleText).toContain('╚');
  });

  it('Case 19: Direct Palette Drag-and-Drop to Canvas & Accurate Selection of Overlapping/Nested Components', () => {
    // 1. Direct drop of component at specific canvas coordinate
    const droppedId = app.dropComponentAt('button-primary', 12, 6);
    expect(droppedId).toBeDefined();

    const droppedNode = app.state.getSelectedNode();
    expect(droppedNode).toBeDefined();
    expect(droppedNode?.id).toBe(droppedId);
    expect(droppedNode?.type).toBe('button');
    expect(droppedNode?.rect.x).toBe(12);
    expect(droppedNode?.rect.y).toBe(6);
    expect(droppedNode?.meta?.variant).toBe('primary');

    // 2. Overlapping container and inner widget hit-testing
    app.state.clearCanvas();

    // Large background container encompassing the canvas
    const bgContainerId = app.state.createNodeAt('container', { x: 0, y: 0, w: 40, h: 20 });

    // Inner smaller card container nested inside background container
    const innerCardId = app.state.createNodeAt('container', { x: 5, y: 3, w: 20, h: 10 });

    // Inner button nested inside the card container
    const innerBtnId = app.dropComponentAt('button-secondary', 8, 5);

    // Mock clientToCell to return (9, 5) which is inside:
    // - bgContainer (0,0 to 40,20)
    // - innerCard (5,3 to 25,13)
    // - innerBtn (8,5 to 20,6)
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 9, cellY: 5 });

    // Hit testing must pick the topmost, smallest non-container: innerBtn
    app.state.selectNode(null);
    expect(app.state.selectedId).toBeNull();

    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
    );
    expect(app.state.selectedId).toBe(innerBtnId);

    // 3. Dragging a selected component never accidentally grabs the background container
    // When innerBtn is selected, pointerdown inside its bounding box moves innerBtn
    expect(app.state.selectedId).toBe(innerBtnId);
    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
    );
    expect(app.state.selectedId).toBe(innerBtnId);

    // 4. Hit-testing between two containers (inner card vs giant background)
    // Click at (6, 4) which is inside innerCard and bgContainer, but not innerBtn
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 6, cellY: 4 });
    app.state.selectNode(null);

    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 80, clientY: 80, bubbles: true })
    );
    expect(app.state.selectedId).toBe(innerCardId);
  });

  it('Case 20: Figma-mapped components placement, palette clicks, and inspector controls', () => {
    app.state.clearCanvas();

    // 1. Drop all 6 Figma-mapped components
    const tabsId = app.dropComponentAt('tabs', 0, 0);
    const breadcrumbsId = app.dropComponentAt('breadcrumbs', 0, 2);
    const tableId = app.dropComponentAt('table', 0, 4);
    const badgeId = app.dropComponentAt('badge', 0, 10);
    const progressId = app.dropComponentAt('progress', 0, 12);
    const alertId = app.dropComponentAt('alert', 0, 14);

    expect(app.state.nodes.length).toBe(6);

    const tabsNode = app.state.nodes.find((n) => n.id === tabsId);
    expect(tabsNode?.type).toBe('tabs');
    expect(tabsNode?.rect.w).toBe(30);

    const breadNode = app.state.nodes.find((n) => n.id === breadcrumbsId);
    expect(breadNode?.type).toBe('breadcrumbs');
    expect(breadNode?.label).toContain('Home >');

    const tableNode = app.state.nodes.find((n) => n.id === tableId);
    expect(tableNode?.type).toBe('table');
    expect(tableNode?.rect.h).toBe(5);

    const badgeNode = app.state.nodes.find((n) => n.id === badgeId);
    expect(badgeNode?.type).toBe('badge');
    expect(badgeNode?.label).toBe('Active');

    const progNode = app.state.nodes.find((n) => n.id === progressId);
    expect(progNode?.type).toBe('progress');

    const alertNode = app.state.nodes.find((n) => n.id === alertId);
    expect(alertNode?.type).toBe('alert');
    expect(alertNode?.rect.h).toBe(3);

    // 2. Inspector controls for Tabs
    app.state.selectNode(tabsId);
    expect(app.metaTabsGroup.style.display).toBe('block');
    expect(app.metaBadgeGroup.style.display).toBe('none');
    expect(app.metaProgressGroup.style.display).toBe('none');
    expect(app.metaAlertGroup.style.display).toBe('none');

    app.propTabsVariant.value = 'pills';
    app.propTabsVariant.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.tabsVariant).toBe('pills');

    app.propTabsActive.value = '1';
    app.propTabsActive.dispatchEvent(new Event('input'));
    expect(app.state.getSelectedNode()?.meta?.activeTabIndex).toBe(1);

    // 3. Inspector controls for Badge
    app.state.selectNode(badgeId);
    expect(app.metaTabsGroup.style.display).toBe('none');
    expect(app.metaBadgeGroup.style.display).toBe('block');

    app.propBadgeVariant.value = 'status';
    app.propBadgeVariant.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.badgeVariant).toBe('status');

    // 4. Inspector controls for Progress
    app.state.selectNode(progressId);
    expect(app.metaBadgeGroup.style.display).toBe('none');
    expect(app.metaProgressGroup.style.display).toBe('block');

    app.propProgressVariant.value = 'slider';
    app.propProgressVariant.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.progressVariant).toBe('slider');

    app.propProgressVal.value = '80';
    app.propProgressVal.dispatchEvent(new Event('input'));
    expect(app.state.getSelectedNode()?.meta?.progressValue).toBe(80);

    // 5. Inspector controls for Alert
    app.state.selectNode(alertId);
    expect(app.metaProgressGroup.style.display).toBe('none');
    expect(app.metaAlertGroup.style.display).toBe('block');

    app.propAlertVariant.value = 'warning';
    app.propAlertVariant.dispatchEvent(new Event('change'));
    expect(app.state.getSelectedNode()?.meta?.alertVariant).toBe('warning');

    // 6. Test Palette click creation
    const prevCount = app.state.nodes.length;
    const tableCard = document.querySelector<HTMLElement>('[data-create-component="table"]');
    expect(tableCard).not.toBeNull();
    tableCard?.click();
    expect(app.state.nodes.length).toBe(prevCount + 1);
    expect(app.state.getSelectedNode()?.type).toBe('table');
  });

  it('Case 21: Dragging a component to canvas and moving it never creates a duplicate', () => {
    app.state.clearCanvas();
    expect(app.state.nodes.length).toBe(0);

    // 1. Drag component card from palette
    const card = document.querySelector<HTMLElement>('[data-create-component="button-primary"]');
    expect(card).not.toBeNull();

    const dataStore: Record<string, string> = {};
    const mockDataTransfer = {
      setData: (key: string, val: string) => { dataStore[key] = val; },
      getData: (key: string) => dataStore[key] || '',
      effectAllowed: 'copy',
      dropEffect: 'copy',
    };

    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    card?.dispatchEvent(dragStartEvent);

    expect(app.currentDraggedComponent).toBe('button-primary');

    // 2. Mock dropping on artboard (which bubbles to canvasViewport)
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 5, cellY: 5 });

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any;
    dropEvent.dataTransfer = mockDataTransfer;
    dropEvent.clientX = 120;
    dropEvent.clientY = 120;

    app.artboard.dispatchEvent(dropEvent);

    // CRITICAL: Exactly ONE node should be created, NOT two!
    expect(app.state.nodes.length).toBe(1);
    const placedNode = app.state.nodes[0];
    expect(placedNode.type).toBe('button');
    expect(placedNode.rect.x).toBe(5);
    expect(placedNode.rect.y).toBe(5);
    expect(app.state.selectedId).toBe(placedNode.id);
    expect(app.state.activeTool).toBe('select');

    // 3. Tap on the node to select and drag it to (10, 8)
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 5, cellY: 5 });
    app.artboard.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 120, clientY: 120, bubbles: true })
    );

    // Move by +5 in x, +3 in y
    vi.spyOn(app, 'clientToCell').mockReturnValue({ cellX: 10, cellY: 8 });
    const { charW, charH } = app.getCellMetrics();
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 120 + 5 * charW,
        clientY: 120 + 3 * charH,
        bubbles: true,
      })
    );

    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    // CRITICAL: Still exactly ONE node, moved to (10, 8), no duplicate left behind!
    expect(app.state.nodes.length).toBe(1);
    expect(app.state.nodes[0].rect.x).toBe(10);
    expect(app.state.nodes[0].rect.y).toBe(8);
  });

  it('Case 22: Multi-selects nodes via Shift+click and aligns them', () => {
    app.state.clearCanvas();
    const id1 = app.state.addNewNode('button');
    const id2 = app.state.addNewNode('input');
    app.state.setNodes([
      { id: id1, type: 'button', rect: { x: 5, y: 4, w: 10, h: 1 }, zIndex: 1 },
      { id: id2, type: 'input', rect: { x: 15, y: 10, w: 12, h: 1 }, zIndex: 1 },
    ]);

    // Multi-select via selectNodes or Shift-click in tree
    app.state.selectNodes([id1, id2]);
    expect(app.state.selectedIds.size).toBe(2);
    expect(app.selectionStatusBadge?.style.display).toBe('block');
    expect(app.selectionCountText?.textContent).toBe('2 widgets selected');

    // Click Align Left
    app.btnAlignLeft?.click();
    const n1 = app.state.nodes.find((n) => n.id === id1);
    const n2 = app.state.nodes.find((n) => n.id === id2);
    expect(n1?.rect.x).toBe(5);
    expect(n2?.rect.x).toBe(5);

    // Click Align Right (collective maxX = 5 + 12 = 17)
    app.btnAlignRight?.click();
    const r1 = app.state.nodes.find((n) => n.id === id1);
    const r2 = app.state.nodes.find((n) => n.id === id2);
    expect(r1?.rect.x).toBe(7); // 17 - 10
    expect(r2?.rect.x).toBe(5); // 17 - 12
  });

  it('Case 23: Distributes selected nodes evenly using distribution buttons', () => {
    app.state.clearCanvas();
    const id1 = 'b1';
    const id2 = 'b2';
    const id3 = 'b3';
    app.state.setNodes([
      { id: id1, type: 'button', rect: { x: 0, y: 2, w: 4, h: 1 }, zIndex: 1 },
      { id: id2, type: 'button', rect: { x: 5, y: 2, w: 4, h: 1 }, zIndex: 1 },
      { id: id3, type: 'button', rect: { x: 20, y: 2, w: 4, h: 1 }, zIndex: 1 },
    ]);

    app.state.selectNodes([id1, id2, id3]);
    app.btnDistributeH?.click();

    const d1 = app.state.nodes.find((n) => n.id === id1);
    const d2 = app.state.nodes.find((n) => n.id === id2);
    const d3 = app.state.nodes.find((n) => n.id === id3);
    expect(d1?.rect.x).toBe(0);
    expect(d2?.rect.x).toBe(10);
    expect(d3?.rect.x).toBe(20);
  });

  it('Case 24: Exports SVG and toggles vector SVG format tab', () => {
    expect(app.btnExportSvg).toBeDefined();
    expect(app.btnExportPng).toBeDefined();

    // Click Export SVG
    app.btnExportSvg?.click();
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    // Toggle Vector SVG code view
    app.btnFormatSvg?.click();
    expect(app.specFormat).toBe('svg');
    expect(app.markdownOutput.value).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
  });
});
