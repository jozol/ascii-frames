import {
  SceneNode,
  WidgetType,
  Rect,
  ScreenConfig,
  SCREEN_PRESETS,
  ArtboardScreen,
} from '../core/ast/types.js';
import {
  addNode,
  updateNode,
  removeNode,
  moveNode,
  resizeNode,
  findNode,
  duplicateNode,
  reorderNode,
  alignNodes,
  distributeNodes,
  moveNodes,
  removeNodes,
  findNodesInRect,
  AlignmentType,
  DistributionAxis,
} from '../core/ast/mutations.js';
import { rasterizeScene } from '../core/rasterizer/widget-stampers.js';
import {
  serializeToWireframe,
  serializeMultiScreenWireframe,
} from '../core/serializer/wireframe-md.js';
import {
  serializeToSvg,
  SvgExportOptions,
} from '../core/serializer/wireframe-svg.js';
import { CharGrid } from '../core/rasterizer/char-grid.js';
import { PRESETS } from './presets.js';

export type TabType = 'preview' | 'markdown' | 'json';
export type EditorTool =
  | 'select'
  | 'hand'
  | 'container'
  | 'circle'
  | 'line'
  | 'button'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'divider'
  | 'text'
  | 'tabs'
  | 'breadcrumbs'
  | 'table'
  | 'badge'
  | 'progress'
  | 'alert';

export type LeftPanelTab = 'layers' | 'components';
export type RightPanelTab = 'design' | 'spec' | 'json';

export class EditorState {
  public nodes: SceneNode[];
  public selectedId: string | null = null;
  public selectedIds: Set<string> = new Set();
  public activeTool: EditorTool = 'select';
  public leftTab: LeftPanelTab = 'layers';
  public rightTab: RightPanelTab = 'design';
  public activeTab: TabType = 'preview';
  public lastRenderMs = 0;

  // Screen / Viewport State
  public currentScreen: ScreenConfig | null = null;
  public screenOrientation: 'portrait' | 'landscape' = 'portrait';

  // Multi-Artboard Screens
  public screens: ArtboardScreen[] = [];
  public activeScreenId: string = 'screen-1';

  public history: SceneNode[][] = [];
  public future: SceneNode[][] = [];
  private listeners: Array<() => void> = [];

  constructor(initialPresetId = 'mobile-app') {
    const preset =
      PRESETS.find((p) => p.id === initialPresetId) ?? PRESETS[0];
    this.nodes = JSON.parse(JSON.stringify(preset.nodes));

    const matchedScreen = SCREEN_PRESETS.find((s) => s.id === preset.screenId);
    if (matchedScreen) {
      this.currentScreen = { ...matchedScreen };
      this.screenOrientation = matchedScreen.orientation ?? 'portrait';
    } else {
      this.currentScreen = { ...SCREEN_PRESETS[0] };
      this.screenOrientation = 'portrait';
    }

    this.screens = [
      {
        id: 'screen-1',
        name: preset.name || 'Screen 1',
        screenConfigId: preset.screenId || 'mobile-standard',
        orientation: this.screenOrientation,
        nodes: this.nodes,
      },
    ];
    this.activeScreenId = 'screen-1';
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setNodes(newNodes: SceneNode[], pushHistory = true): void {
    if (pushHistory) {
      this.history.push(JSON.parse(JSON.stringify(this.nodes)));
      this.future = [];
    }
    this.nodes = newNodes;
    const cur = this.screens.find((s) => s.id === this.activeScreenId);
    if (cur) {
      cur.nodes = newNodes;
    }
    this.notify();
  }

  public snapshotHistory(): void {
    this.history.push(JSON.parse(JSON.stringify(this.nodes)));
    this.future = [];
  }

  public popHistorySnapshot(): void {
    if (this.history.length > 0) {
      this.history.pop();
    }
  }

  public undo(): void {
    if (this.history.length === 0) return;
    const prev = this.history.pop()!;
    this.future.push(JSON.parse(JSON.stringify(this.nodes)));
    this.nodes = prev;
    this.notify();
  }

  public redo(): void {
    if (this.future.length === 0) return;
    const next = this.future.pop()!;
    this.history.push(JSON.parse(JSON.stringify(this.nodes)));
    this.nodes = next;
    this.notify();
  }

  public selectNode(id: string | null): void {
    this.selectedId = id;
    this.selectedIds = new Set(id ? [id] : []);
    this.notify();
  }

  public selectNodes(ids: string[]): void {
    this.selectedIds = new Set(ids);
    this.selectedId = ids.length > 0 ? ids[0] : null;
    this.notify();
  }

  public toggleNodeSelection(id: string, additive = false): void {
    if (additive) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        this.selectedId = this.selectedIds.size > 0 ? Array.from(this.selectedIds)[0] : null;
      } else {
        this.selectedIds.add(id);
        this.selectedId = id;
      }
    } else {
      this.selectNode(id);
      return;
    }
    this.notify();
  }

  public isNodeSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  public getSelectedNodes(): SceneNode[] {
    const list: SceneNode[] = [];
    for (const id of this.selectedIds) {
      const n = findNode(this.nodes, id);
      if (n) list.push(n);
    }
    return list;
  }

  public selectInRect(rect: Rect, additive = false): void {
    const matched = findNodesInRect(this.nodes, rect);
    const ids = matched.map((m) => m.id);
    if (additive) {
      for (const id of ids) {
        this.selectedIds.add(id);
      }
      this.selectedId = this.selectedIds.size > 0 ? Array.from(this.selectedIds)[0] : null;
      this.notify();
    } else {
      this.selectNodes(ids);
    }
  }

  public setTool(tool: EditorTool): void {
    this.activeTool = tool;
    this.notify();
  }

  public setLeftTab(tab: LeftPanelTab): void {
    this.leftTab = tab;
    this.notify();
  }

  public setRightTab(tab: RightPanelTab): void {
    this.rightTab = tab;
    if (tab === 'spec') this.activeTab = 'markdown';
    else if (tab === 'json') this.activeTab = 'json';
    else this.activeTab = 'preview';
    this.notify();
  }

  public setTab(tab: TabType): void {
    this.activeTab = tab;
    if (tab === 'markdown') this.rightTab = 'spec';
    else if (tab === 'json') this.rightTab = 'json';
    else this.rightTab = 'design';
    this.notify();
  }

  // Screen Management
  public setScreen(screenId: string, customW?: number, customH?: number): void {
    if (screenId === 'auto') {
      this.currentScreen = null;
    } else if (screenId === 'custom') {
      this.currentScreen = {
        id: 'custom',
        name: 'Custom Viewport',
        category: 'custom',
        width: Math.max(3, customW || 40),
        height: Math.max(3, customH || 25),
        orientation: this.screenOrientation,
      };
    } else {
      const preset = SCREEN_PRESETS.find((s) => s.id === screenId);
      if (preset) {
        this.currentScreen = { ...preset };
        this.screenOrientation = preset.orientation ?? 'portrait';
      }
    }

    const cur = this.screens.find((s) => s.id === this.activeScreenId);
    if (cur) {
      cur.screenConfigId = screenId;
      cur.orientation = this.screenOrientation;
    }

    this.notify();
  }

  public toggleOrientation(): void {
    this.screenOrientation =
      this.screenOrientation === 'portrait' ? 'landscape' : 'portrait';

    if (this.currentScreen && this.currentScreen.category !== 'auto') {
      const w = this.currentScreen.width;
      const h = this.currentScreen.height;
      this.currentScreen.width = h;
      this.currentScreen.height = w;
      this.currentScreen.orientation = this.screenOrientation;
    }

    const cur = this.screens.find((s) => s.id === this.activeScreenId);
    if (cur) {
      cur.orientation = this.screenOrientation;
    }

    this.notify();
  }

  // Multi-Screen / Artboard Flow Management
  public addScreen(name?: string, presetId?: string): string {
    const newIndex = this.screens.length + 1;
    const screenId = `screen-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const screenName = name || `Screen ${newIndex}`;

    let initialNodes: SceneNode[] = [];
    let screenConfigId = this.currentScreen?.id || 'mobile-standard';
    let orientation = this.screenOrientation;

    if (presetId) {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (preset) {
        initialNodes = JSON.parse(JSON.stringify(preset.nodes));
        if (preset.screenId) screenConfigId = preset.screenId;
      }
    } else {
      const w = Math.min(this.currentScreen?.width || 32, 32);
      const h = Math.min(this.currentScreen?.height || 20, 20);
      initialNodes = [
        {
          id: `container-${Date.now().toString(36)}`,
          type: 'container',
          rect: { x: 0, y: 0, w, h },
          zIndex: 0,
          label: screenName,
        },
      ];
    }

    const newScreen: ArtboardScreen = {
      id: screenId,
      name: screenName,
      screenConfigId,
      orientation,
      nodes: initialNodes,
    };

    this.screens.push(newScreen);
    this.switchScreen(screenId);
    return screenId;
  }

  public switchScreen(screenId: string): void {
    const target = this.screens.find((s) => s.id === screenId);
    if (!target) return;

    // Persist current active screen data
    const current = this.screens.find((s) => s.id === this.activeScreenId);
    if (current) {
      current.nodes = this.nodes;
      current.orientation = this.screenOrientation;
      if (this.currentScreen) current.screenConfigId = this.currentScreen.id;
    }

    this.activeScreenId = screenId;
    this.nodes = JSON.parse(JSON.stringify(target.nodes));
    this.selectedId = null;
    this.selectedIds.clear();
    this.history = [];
    this.future = [];

    // Apply target screen config if specified
    if (target.screenConfigId) {
      this.setScreen(target.screenConfigId);
    }
    if (target.orientation && target.orientation !== this.screenOrientation) {
      this.screenOrientation = target.orientation;
    }

    this.notify();
  }

  public removeScreen(screenId: string): boolean {
    if (this.screens.length <= 1) return false;
    const idx = this.screens.findIndex((s) => s.id === screenId);
    if (idx === -1) return false;

    this.screens.splice(idx, 1);
    if (this.activeScreenId === screenId) {
      const nextScreen = this.screens[Math.max(0, idx - 1)];
      this.switchScreen(nextScreen.id);
    } else {
      this.notify();
    }
    return true;
  }

  public duplicateScreen(screenId: string): string | undefined {
    const target = this.screens.find((s) => s.id === screenId);
    if (!target) return undefined;

    if (this.activeScreenId === screenId) {
      target.nodes = this.nodes;
    }

    const newId = `screen-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const duplicated: ArtboardScreen = {
      id: newId,
      name: `${target.name} (Copy)`,
      screenConfigId: target.screenConfigId,
      orientation: target.orientation,
      nodes: JSON.parse(JSON.stringify(target.nodes)),
    };

    const idx = this.screens.findIndex((s) => s.id === screenId);
    this.screens.splice(idx + 1, 0, duplicated);
    this.switchScreen(newId);
    return newId;
  }

  public renameScreen(screenId: string, newName: string): void {
    const target = this.screens.find((s) => s.id === screenId);
    if (target && newName.trim()) {
      target.name = newName.trim();
      this.notify();
    }
  }

  public getEffectiveScreen(): ScreenConfig | undefined {
    if (!this.currentScreen) return undefined;
    return {
      ...this.currentScreen,
      orientation: this.screenOrientation,
    };
  }

  public getSelectedNode(): SceneNode | undefined {
    if (!this.selectedId) return undefined;
    return findNode(this.nodes, this.selectedId);
  }

  public updateSelected(updates: Partial<SceneNode>, pushHistory = true): void {
    if (!this.selectedId) return;
    this.setNodes(updateNode(this.nodes, this.selectedId, updates), pushHistory);
  }

  public moveSelected(dx: number, dy: number, pushHistory = true): void {
    if (this.selectedIds.size > 1) {
      this.setNodes(moveNodes(this.nodes, Array.from(this.selectedIds), dx, dy), pushHistory);
    } else if (this.selectedId) {
      this.setNodes(moveNode(this.nodes, this.selectedId, dx, dy, true), pushHistory);
    }
  }

  public resizeSelected(dw: number, dh: number, pushHistory = true): void {
    if (!this.selectedId) return;
    this.setNodes(resizeNode(this.nodes, this.selectedId, dw, dh), pushHistory);
  }

  public removeSelected(): void {
    if (this.selectedIds.size > 1) {
      const idsToRemove = Array.from(this.selectedIds);
      this.selectedId = null;
      this.selectedIds.clear();
      this.setNodes(removeNodes(this.nodes, idsToRemove));
    } else if (this.selectedId) {
      const toRemove = this.selectedId;
      this.selectedId = null;
      this.selectedIds.clear();
      this.setNodes(removeNode(this.nodes, toRemove));
    }
  }

  public alignSelected(alignment: AlignmentType): void {
    if (this.selectedIds.size >= 2) {
      this.setNodes(alignNodes(this.nodes, Array.from(this.selectedIds), alignment));
    } else if (this.selectedId) {
      const effScreen = this.getEffectiveScreen();
      const refRect = effScreen
        ? { x: 0, y: 0, w: effScreen.width, h: effScreen.height }
        : undefined;
      this.setNodes(alignNodes(this.nodes, [this.selectedId], alignment, refRect));
    }
  }

  public distributeSelected(axis: DistributionAxis): void {
    if (this.selectedIds.size >= 3) {
      this.setNodes(distributeNodes(this.nodes, Array.from(this.selectedIds), axis));
    }
  }

  public duplicateSelected(): string | undefined {
    if (!this.selectedId) return undefined;
    const res = duplicateNode(this.nodes, this.selectedId, { dx: 2, dy: 2 });
    if (!res) return undefined;
    this.setNodes(res.nodes);
    this.selectNode(res.newId);
    return res.newId;
  }

  public reorderSelected(direction: 'forward' | 'backward' | 'front' | 'back'): void {
    if (!this.selectedId) return;
    this.setNodes(reorderNode(this.nodes, this.selectedId, direction));
  }

  public clearCanvas(): void {
    this.selectedId = null;
    this.selectedIds.clear();
    this.setNodes([]);
  }

  public addNewNode(type: SceneNode['type'], parentId?: string): string {
    const id = `${type}-${Date.now().toString(36)}`;
    let initialRect: Rect;
    let defaultLabel = type.charAt(0).toUpperCase() + type.slice(1);

    if (type === 'container') {
      initialRect = { x: 2, y: 2, w: 24, h: 10 };
    } else if (type === 'circle') {
      initialRect = { x: 4, y: 4, w: 8, h: 4 };
      defaultLabel = 'Avatar';
    } else if (type === 'line') {
      initialRect = { x: 4, y: 6, w: 12, h: 1 };
      defaultLabel = '';
    } else if (type === 'tabs') {
      initialRect = { x: 4, y: 4, w: 32, h: 1 };
      defaultLabel = '';
    } else if (type === 'breadcrumbs') {
      initialRect = { x: 4, y: 4, w: 28, h: 1 };
      defaultLabel = 'Home > Projects > Settings';
    } else if (type === 'table') {
      initialRect = { x: 4, y: 4, w: 36, h: 5 };
      defaultLabel = 'Data Table';
    } else if (type === 'badge') {
      initialRect = { x: 4, y: 4, w: 10, h: 1 };
      defaultLabel = 'Active';
    } else if (type === 'progress') {
      initialRect = { x: 4, y: 4, w: 24, h: 1 };
      defaultLabel = '';
    } else if (type === 'alert') {
      initialRect = { x: 4, y: 4, w: 34, h: 3 };
      defaultLabel = 'System update scheduled for midnight';
    } else {
      initialRect = { x: 4, y: 4, w: 14, h: 1 };
    }

    const newNode: SceneNode = {
      id,
      type,
      rect: initialRect,
      zIndex: type === 'container' ? 0 : 1,
      label: defaultLabel || undefined,
    };
    this.setNodes(addNode(this.nodes, newNode, parentId));
    this.selectNode(id);
    return id;
  }

  public createNodeAt(type: WidgetType, rect: Rect, parentId?: string): string {
    const id = `${type}-${Date.now().toString(36)}`;
    const isBox = type === 'container' || type === 'circle' || type === 'table' || type === 'alert';
    const minW = isBox ? 3 : 1;
    const minH = isBox ? 3 : 1;
    const clampedRect: Rect = {
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      w: Math.max(minW, Math.round(rect.w)),
      h: Math.max(minH, Math.round(rect.h)),
    };

    let defaultLabel = type.charAt(0).toUpperCase() + type.slice(1);
    if (type === 'divider') defaultLabel = '';
    if (type === 'line') defaultLabel = '';
    if (type === 'circle') defaultLabel = 'Avatar';
    if (type === 'button') defaultLabel = 'Button';
    if (type === 'input') defaultLabel = 'Placeholder...';
    if (type === 'select') defaultLabel = 'Select option';
    if (type === 'tabs') defaultLabel = '';
    if (type === 'breadcrumbs') defaultLabel = 'Home > Projects > Settings';
    if (type === 'table') defaultLabel = 'Data Table';
    if (type === 'badge') defaultLabel = 'Active';
    if (type === 'progress') defaultLabel = '';
    if (type === 'alert') defaultLabel = 'System update scheduled for midnight';

    const newNode: SceneNode = {
      id,
      type,
      rect: clampedRect,
      zIndex: type === 'container' ? 0 : 1,
      label: defaultLabel || undefined,
    };

    this.setNodes(addNode(this.nodes, newNode, parentId));
    this.selectNode(id);
    this.setTool('select');
    return id;
  }

  public loadPreset(id: string): void {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    this.selectedId = null;
    this.selectedIds.clear();
    this.setNodes(JSON.parse(JSON.stringify(preset.nodes)));

    const matchedScreen = SCREEN_PRESETS.find((s) => s.id === preset.screenId);
    if (matchedScreen) {
      this.currentScreen = { ...matchedScreen };
      this.screenOrientation = matchedScreen.orientation ?? 'portrait';
    }

    const cur = this.screens.find((s) => s.id === this.activeScreenId);
    if (cur) {
      cur.name = preset.name;
      cur.screenConfigId = preset.screenId;
      cur.orientation = this.screenOrientation;
      cur.nodes = this.nodes;
    }
  }

  public rasterize(): { grid: CharGrid; renderedText: string; renderMs: number } {
    const t0 = performance.now();

    const w = this.currentScreen ? this.currentScreen.width : undefined;
    const h = this.currentScreen ? this.currentScreen.height : undefined;

    const grid = rasterizeScene(this.nodes, w, h);
    const renderedText = grid.renderToString();
    const t1 = performance.now();
    this.lastRenderMs = t1 - t0;
    return { grid, renderedText, renderMs: this.lastRenderMs };
  }

  public getMarkdown(customTitle?: string): string {
    const cur = this.screens.find((s) => s.id === this.activeScreenId);
    if (cur) {
      cur.nodes = this.nodes;
      cur.orientation = this.screenOrientation;
      if (this.currentScreen) cur.screenConfigId = this.currentScreen.id;
    }

    if (this.screens.length > 1) {
      return serializeMultiScreenWireframe(this.screens, customTitle || 'Wireframe Flow Specification');
    }

    return serializeToWireframe(this.nodes, {
      title: customTitle || 'Wireframe Specification',
      screen: this.getEffectiveScreen(),
    });
  }

  public getSvg(options?: SvgExportOptions): string {
    const { renderedText } = this.rasterize();
    return serializeToSvg(renderedText, {
      title: options?.title || this.screens.find((s) => s.id === this.activeScreenId)?.name || 'Wireframe',
      ...options,
    });
  }
}
