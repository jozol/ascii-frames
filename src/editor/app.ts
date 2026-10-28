import { EditorState, EditorTool, LeftPanelTab, RightPanelTab, TabType } from './editor-state.js';
import { SceneNode, WidgetType, Rect } from '../core/ast/types.js';
import { findNodeAt, findNode, addNode } from '../core/ast/mutations.js';

export class EditorApp {
  public state: EditorState;
  public root: Document | HTMLElement;

  // Header Elements
  public presetSelect!: HTMLSelectElement;
  public screenSelect!: HTMLSelectElement;
  public btnOrientation!: HTMLButtonElement;
  public orientationIcon!: HTMLElement;
  public themeToggle!: HTMLButtonElement;
  public themeIcon!: HTMLElement;
  public renderTimer!: HTMLElement;
  public btnUndo!: HTMLButtonElement;
  public btnRedo!: HTMLButtonElement;
  public btnDuplicate!: HTMLButtonElement;
  public btnClear!: HTMLButtonElement;

  // Tool Elements
  public toolButtons!: NodeListOf<HTMLButtonElement>;

  // Sidebar Elements
  public tabLayers!: HTMLButtonElement;
  public tabComponents!: HTMLButtonElement;
  public viewLayers!: HTMLElement;
  public viewComponents!: HTMLElement;
  public treeContainer!: HTMLElement;

  // Canvas Elements
  public canvasArea!: HTMLElement;
  public canvasViewport!: HTMLElement;
  public canvasStage!: HTMLElement;
  public artboard!: HTMLElement;
  public artboardHeader!: HTMLElement;
  public artboardIcon!: HTMLElement;
  public artboardTitle!: HTMLElement;
  public artboardDims!: HTMLElement;
  public asciiOutput!: HTMLElement;
  public selectionOverlay!: HTMLElement;
  public selectionPill!: HTMLElement;
  public drawPreview!: HTMLElement;
  public marqueeSelection?: HTMLElement;
  public multiSelectionContainer?: HTMLElement;

  // Screen Flow Bar Elements
  public screenFlowBar!: HTMLElement;
  public screenPillsList!: HTMLElement;
  public btnAddScreen!: HTMLButtonElement;

  // Canvas Zoom Elements & State
  public zoomControls!: HTMLElement;
  public btnZoomOut!: HTMLButtonElement;
  public btnZoomLevel!: HTMLButtonElement;
  public btnZoomIn!: HTMLButtonElement;
  public btnZoomFit!: HTMLButtonElement;
  public zoom: number = 1.0;

  // Right Inspector Elements
  public tabDesign!: HTMLButtonElement;
  public tabSpec!: HTMLButtonElement;
  public tabJson!: HTMLButtonElement;
  public viewDesign!: HTMLElement;
  public viewMarkdown!: HTMLElement;
  public viewJson!: HTMLElement;

  public noSelection!: HTMLElement;
  public inspectorForm!: HTMLElement;
  public selectionStatusBadge?: HTMLElement;
  public selectionCountText?: HTMLElement;
  public btnAlignLeft?: HTMLButtonElement;
  public btnAlignCenter?: HTMLButtonElement;
  public btnAlignRight?: HTMLButtonElement;
  public btnAlignTop?: HTMLButtonElement;
  public btnAlignMiddle?: HTMLButtonElement;
  public btnAlignBottom?: HTMLButtonElement;
  public btnDistributeH?: HTMLButtonElement;
  public btnDistributeV?: HTMLButtonElement;
  public propId!: HTMLInputElement;
  public propType!: HTMLSelectElement;
  public propLabel!: HTMLInputElement;
  public propX!: HTMLInputElement;
  public propY!: HTMLInputElement;
  public propW!: HTMLInputElement;
  public propH!: HTMLInputElement;
  public propVariant!: HTMLSelectElement;
  public propChecked!: HTMLInputElement;
  public propAction!: HTMLInputElement;
  public propBinding!: HTMLInputElement;
  public propLayout!: HTMLInputElement;
  public propTransition!: HTMLSelectElement;
  public metaVariantGroup!: HTMLElement;
  public metaCheckedGroup!: HTMLElement;
  public metaBorderStyleGroup!: HTMLElement;
  public propBorderStyle!: HTMLSelectElement;
  public metaLineGroup!: HTMLElement;
  public propLineEnding!: HTMLSelectElement;
  public propLineDirection!: HTMLSelectElement;

  public metaTabsGroup!: HTMLElement;
  public propTabsVariant!: HTMLSelectElement;
  public propTabsActive!: HTMLInputElement;

  public metaBadgeGroup!: HTMLElement;
  public propBadgeVariant!: HTMLSelectElement;

  public metaProgressGroup!: HTMLElement;
  public propProgressVariant!: HTMLSelectElement;
  public propProgressVal!: HTMLInputElement;

  public metaAlertGroup!: HTMLElement;
  public propAlertVariant!: HTMLSelectElement;

  public btnForward!: HTMLButtonElement;
  public btnBackward!: HTMLButtonElement;
  public btnDeleteNode!: HTMLButtonElement;

  public nudgeLeft!: HTMLButtonElement;
  public nudgeRight!: HTMLButtonElement;
  public nudgeUp!: HTMLButtonElement;
  public nudgeDown!: HTMLButtonElement;
  public resizeWMinus!: HTMLButtonElement;
  public resizeWPlus!: HTMLButtonElement;
  public resizeHMinus!: HTMLButtonElement;
  public resizeHPlus!: HTMLButtonElement;

  public markdownOutput!: HTMLTextAreaElement;
  public jsonInput!: HTMLTextAreaElement;
  public btnCopy!: HTMLButtonElement;
  public btnCopyAscii?: HTMLButtonElement;
  public btnDownload!: HTMLButtonElement;
  public btnApplyJson!: HTMLButtonElement;
  public btnToggleWide?: HTMLButtonElement;
  public btnFormatMd?: HTMLButtonElement;
  public btnFormatAscii?: HTMLButtonElement;
  public btnFormatSvg?: HTMLButtonElement;
  public btnExportSvg?: HTMLButtonElement;
  public btnExportPng?: HTMLButtonElement;
  public specFormat: 'md' | 'ascii' | 'svg' = 'md';
  public isWideMode = false;

  // Interaction State for Pointer Drag / Resize / Draw / Marquee
  private isPointerDown = false;
  private dragMode: 'move' | 'resize' | 'draw' | 'marquee' | null = null;
  private activeHandle: string | null = null;
  private startPoint = { clientX: 0, clientY: 0, cellX: 0, cellY: 0 };
  private initialRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  public currentDraggedComponent: string | null = null;

  // Canvas Panning State (Hand Tool, Space+Drag, Middle Click)
  public isPanning = false;
  public isSpacePressed = false;
  private panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

  private boundKeyHandler: (e: KeyboardEvent) => void;
  private boundKeyUpHandler: (e: KeyboardEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  constructor(root: Document | HTMLElement = document, state?: EditorState) {
    this.root = root;
    this.state = state ?? new EditorState('dashboard');
    this.bindElements();
    this.initTheme();
    this.attachEventListeners();
    this.state.subscribe(() => this.updateUI());
    this.updateUI();

    this.boundKeyHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.boundKeyUpHandler = (e: KeyboardEvent) => this.handleKeyUp(e);
    this.boundPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
    this.boundPointerUp = (e: PointerEvent) => this.handlePointerUp(e);

    window.addEventListener('keydown', this.boundKeyHandler);
    window.addEventListener('keyup', this.boundKeyUpHandler);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.boundKeyHandler);
    window.removeEventListener('keyup', this.boundKeyUpHandler);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
  }

  private query<T extends HTMLElement>(selector: string): T {
    const el = this.root.querySelector(selector) as T;
    if (!el) {
      throw new Error(`Editor element not found: ${selector}`);
    }
    return el;
  }

  private bindElements(): void {
    this.presetSelect = this.query<HTMLSelectElement>('#preset-select');
    this.screenSelect = this.query<HTMLSelectElement>('#screen-select');
    this.btnOrientation = this.query<HTMLButtonElement>('#btn-orientation');
    this.orientationIcon = this.query<HTMLElement>('#orientation-icon');
    this.themeToggle = this.query<HTMLButtonElement>('#theme-toggle');
    this.themeIcon = this.query<HTMLElement>('#theme-icon');
    this.renderTimer = this.query<HTMLElement>('#render-timer');
    this.btnUndo = this.query<HTMLButtonElement>('#btn-undo');
    this.btnRedo = this.query<HTMLButtonElement>('#btn-redo');
    this.btnDuplicate = this.query<HTMLButtonElement>('#btn-duplicate');
    this.btnClear = this.query<HTMLButtonElement>('#btn-clear');

    this.toolButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-tool]');

    this.tabLayers = this.query<HTMLButtonElement>('#tab-layers');
    this.tabComponents = this.query<HTMLButtonElement>('#tab-components');
    this.viewLayers = this.query<HTMLElement>('#view-layers');
    this.viewComponents = this.query<HTMLElement>('#view-components');
    this.treeContainer = this.query<HTMLElement>('#tree-container');

    this.canvasArea = this.query<HTMLElement>('#canvas-area');
    this.canvasViewport = this.query<HTMLElement>('#canvas-viewport');
    this.canvasStage = this.query<HTMLElement>('#canvas-stage');
    this.artboard = this.query<HTMLElement>('#artboard');
    this.artboardHeader = this.query<HTMLElement>('#artboard-header');
    this.artboardIcon = this.query<HTMLElement>('#artboard-icon');
    this.artboardTitle = this.query<HTMLElement>('#artboard-title');
    this.artboardDims = this.query<HTMLElement>('#artboard-dims');
    this.asciiOutput = this.query<HTMLElement>('#ascii-output');
    this.selectionOverlay = this.query<HTMLElement>('#selection-overlay');
    this.selectionPill = this.query<HTMLElement>('#selection-pill');
    this.drawPreview = this.query<HTMLElement>('#draw-preview');
    this.marqueeSelection = this.root.querySelector<HTMLElement>('#marquee-selection') ?? undefined;
    this.multiSelectionContainer = this.root.querySelector<HTMLElement>('#multi-selection-container') ?? undefined;

    this.screenFlowBar = this.query<HTMLElement>('#screen-flow-bar');
    this.screenPillsList = this.query<HTMLElement>('#screen-pills-list');
    this.btnAddScreen = this.query<HTMLButtonElement>('#btn-add-screen');

    this.zoomControls = this.query<HTMLElement>('#zoom-controls');
    this.btnZoomOut = this.query<HTMLButtonElement>('#btn-zoom-out');
    this.btnZoomLevel = this.query<HTMLButtonElement>('#btn-zoom-level');
    this.btnZoomIn = this.query<HTMLButtonElement>('#btn-zoom-in');
    this.btnZoomFit = this.query<HTMLButtonElement>('#btn-zoom-fit');

    this.tabDesign = this.query<HTMLButtonElement>('#tab-design');
    this.tabSpec = this.query<HTMLButtonElement>('#tab-spec');
    this.tabJson = this.query<HTMLButtonElement>('#tab-json');
    this.viewDesign = this.query<HTMLElement>('#view-design');
    this.viewMarkdown = this.query<HTMLElement>('#view-markdown');
    this.viewJson = this.query<HTMLElement>('#view-json');

    this.noSelection = this.query<HTMLElement>('#no-selection');
    this.inspectorForm = this.query<HTMLElement>('#inspector-form');
    this.selectionStatusBadge = this.root.querySelector<HTMLElement>('#selection-status-badge') ?? undefined;
    this.selectionCountText = this.root.querySelector<HTMLElement>('#selection-count-text') ?? undefined;
    this.btnAlignLeft = this.root.querySelector<HTMLButtonElement>('#btn-align-left') ?? undefined;
    this.btnAlignCenter = this.root.querySelector<HTMLButtonElement>('#btn-align-center') ?? undefined;
    this.btnAlignRight = this.root.querySelector<HTMLButtonElement>('#btn-align-right') ?? undefined;
    this.btnAlignTop = this.root.querySelector<HTMLButtonElement>('#btn-align-top') ?? undefined;
    this.btnAlignMiddle = this.root.querySelector<HTMLButtonElement>('#btn-align-middle') ?? undefined;
    this.btnAlignBottom = this.root.querySelector<HTMLButtonElement>('#btn-align-bottom') ?? undefined;
    this.btnDistributeH = this.root.querySelector<HTMLButtonElement>('#btn-distribute-h') ?? undefined;
    this.btnDistributeV = this.root.querySelector<HTMLButtonElement>('#btn-distribute-v') ?? undefined;
    this.propId = this.query<HTMLInputElement>('#prop-id');
    this.propType = this.query<HTMLSelectElement>('#prop-type');
    this.propLabel = this.query<HTMLInputElement>('#prop-label');
    this.propX = this.query<HTMLInputElement>('#prop-x');
    this.propY = this.query<HTMLInputElement>('#prop-y');
    this.propW = this.query<HTMLInputElement>('#prop-w');
    this.propH = this.query<HTMLInputElement>('#prop-h');
    this.propVariant = this.query<HTMLSelectElement>('#prop-variant');
    this.propChecked = this.query<HTMLInputElement>('#prop-checked');
    this.propAction = this.query<HTMLInputElement>('#prop-action');
    this.propBinding = this.query<HTMLInputElement>('#prop-binding');
    this.propLayout = this.query<HTMLInputElement>('#prop-layout');
    this.propTransition = this.query<HTMLSelectElement>('#prop-transition');
    this.metaVariantGroup = this.query<HTMLElement>('#meta-variant-group');
    this.metaCheckedGroup = this.query<HTMLElement>('#meta-checked-group');
    this.metaBorderStyleGroup = this.query<HTMLElement>('#meta-border-style-group');
    this.propBorderStyle = this.query<HTMLSelectElement>('#prop-border-style');
    this.metaLineGroup = this.query<HTMLElement>('#meta-line-group');
    this.propLineEnding = this.query<HTMLSelectElement>('#prop-line-ending');
    this.propLineDirection = this.query<HTMLSelectElement>('#prop-line-direction');

    this.metaTabsGroup = this.query<HTMLElement>('#meta-tabs-group');
    this.propTabsVariant = this.query<HTMLSelectElement>('#prop-tabs-variant');
    this.propTabsActive = this.query<HTMLInputElement>('#prop-tabs-active');

    this.metaBadgeGroup = this.query<HTMLElement>('#meta-badge-group');
    this.propBadgeVariant = this.query<HTMLSelectElement>('#prop-badge-variant');

    this.metaProgressGroup = this.query<HTMLElement>('#meta-progress-group');
    this.propProgressVariant = this.query<HTMLSelectElement>('#prop-progress-variant');
    this.propProgressVal = this.query<HTMLInputElement>('#prop-progress-val');

    this.metaAlertGroup = this.query<HTMLElement>('#meta-alert-group');
    this.propAlertVariant = this.query<HTMLSelectElement>('#prop-alert-variant');

    this.btnForward = this.query<HTMLButtonElement>('#btn-forward');
    this.btnBackward = this.query<HTMLButtonElement>('#btn-backward');
    this.btnDeleteNode = this.query<HTMLButtonElement>('#btn-delete-node');

    this.nudgeLeft = this.query<HTMLButtonElement>('#nudge-left');
    this.nudgeRight = this.query<HTMLButtonElement>('#nudge-right');
    this.nudgeUp = this.query<HTMLButtonElement>('#nudge-up');
    this.nudgeDown = this.query<HTMLButtonElement>('#nudge-down');
    this.resizeWMinus = this.query<HTMLButtonElement>('#resize-w-minus');
    this.resizeWPlus = this.query<HTMLButtonElement>('#resize-w-plus');
    this.resizeHMinus = this.query<HTMLButtonElement>('#resize-h-minus');
    this.resizeHPlus = this.query<HTMLButtonElement>('#resize-h-plus');

    this.markdownOutput = this.query<HTMLTextAreaElement>('#markdown-output');
    this.jsonInput = this.query<HTMLTextAreaElement>('#json-input');
    this.btnCopy = this.query<HTMLButtonElement>('#btn-copy');
    this.btnCopyAscii = this.root.querySelector<HTMLButtonElement>('#btn-copy-ascii') ?? undefined;
    this.btnDownload = this.query<HTMLButtonElement>('#btn-download');
    this.btnApplyJson = this.query<HTMLButtonElement>('#btn-apply-json');
    this.btnToggleWide = this.root.querySelector<HTMLButtonElement>('#btn-toggle-wide') ?? undefined;
    this.btnFormatMd = this.root.querySelector<HTMLButtonElement>('#btn-format-md') ?? undefined;
    this.btnFormatAscii = this.root.querySelector<HTMLButtonElement>('#btn-format-ascii') ?? undefined;
    this.btnFormatSvg = this.root.querySelector<HTMLButtonElement>('#btn-format-svg') ?? undefined;
    this.btnExportSvg = this.root.querySelector<HTMLButtonElement>('#btn-export-svg') ?? undefined;
    this.btnExportPng = this.root.querySelector<HTMLButtonElement>('#btn-export-png') ?? undefined;
  }

  public initTheme(): void {
    const saved = localStorage.getItem('ascii-frames-theme') || 'auto';
    this.applyTheme(saved);
  }

  public applyTheme(theme: string): void {
    if (theme === 'dark') {
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
      this.themeIcon.textContent = '[*]';
    } else if (theme === 'light') {
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
      this.themeIcon.textContent = '[o]';
    } else {
      document.documentElement.style.colorScheme = 'light dark';
      document.documentElement.removeAttribute('data-theme');
      this.themeIcon.textContent = '[~]';
    }
    localStorage.setItem('ascii-frames-theme', theme);
  }

  public showToast(message: string): void {
    const doc = this.root instanceof Document ? this.root : document;
    const existing = doc.querySelector('.toast');
    if (existing) existing.remove();

    const toast = doc.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    doc.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  }

  // Calculate cell metrics from <pre> element
  public getCellMetrics(): { charW: number; charH: number; padLeft: number; padTop: number } {
    const pre = this.asciiOutput;
    const lines = (pre.textContent || '').split('\n');
    const cols = Math.max(...lines.map((l) => l.length), 1);
    const rows = Math.max(lines.length, 1);

    const rect = pre.getBoundingClientRect();
    const style = window.getComputedStyle ? window.getComputedStyle(pre) : ({} as any);
    const padLeft = parseFloat(style.paddingLeft || '24') || 24;
    const padTop = parseFloat(style.paddingTop || '24') || 24;

    const zoom = this.zoom || 1.0;
    const unscaledW = rect.width ? rect.width / zoom : (pre.clientWidth || 800);
    const unscaledH = rect.height ? rect.height / zoom : (pre.clientHeight || 400);

    const innerW = Math.max(1, unscaledW - padLeft * 2);
    const innerH = Math.max(1, unscaledH - padTop * 2);

    const charW = innerW / cols;
    const charH = innerH / rows;

    return { charW, charH, padLeft, padTop };
  }

  // Convert client pointer coordinate to discrete grid cell
  public clientToCell(clientX: number, clientY: number): { cellX: number; cellY: number } {
    const rect = this.asciiOutput.getBoundingClientRect();
    const { charW, charH, padLeft, padTop } = this.getCellMetrics();
    const zoom = this.zoom || 1.0;

    const screenOffsetX = clientX - rect.left;
    const screenOffsetY = clientY - rect.top;

    const localOffsetX = screenOffsetX / zoom;
    const localOffsetY = screenOffsetY / zoom;

    const cellX = Math.max(0, Math.floor((localOffsetX - padLeft) / charW));
    const cellY = Math.max(0, Math.floor((localOffsetY - padTop) / charH));

    return { cellX, cellY };
  }

  public getComponentDefaultDims(compType: string): { w: number; h: number } {
    if (compType === 'container') return { w: 24, h: 10 };
    if (compType === 'circle') return { w: 8, h: 4 };
    if (compType === 'line') return { w: 12, h: 1 };
    if (compType === 'button-primary') return { w: 14, h: 1 };
    if (compType === 'button-secondary') return { w: 12, h: 1 };
    if (compType === 'input') return { w: 16, h: 1 };
    if (compType === 'select') return { w: 16, h: 1 };
    if (compType === 'checkbox') return { w: 15, h: 1 };
    if (compType === 'radio') return { w: 15, h: 1 };
    if (compType === 'toggle') return { w: 14, h: 1 };
    if (compType === 'divider') return { w: 20, h: 1 };
    if (compType === 'text') return { w: 12, h: 1 };
    if (compType === 'tabs') return { w: 30, h: 1 };
    if (compType === 'breadcrumbs') return { w: 28, h: 1 };
    if (compType === 'table') return { w: 36, h: 5 };
    if (compType === 'badge') return { w: 10, h: 1 };
    if (compType === 'progress') return { w: 24, h: 1 };
    if (compType === 'alert') return { w: 34, h: 3 };
    return { w: 12, h: 1 };
  }

  public dropComponentAt(compType: string, cellX: number, cellY: number): string {
    let type: WidgetType = 'button';
    let variant: 'primary' | 'secondary' | undefined;
    let label: string | undefined;

    const dims = this.getComponentDefaultDims(compType);

    if (compType === 'container') {
      type = 'container';
      label = 'Container';
    } else if (compType === 'circle') {
      type = 'circle';
      label = 'Avatar';
    } else if (compType === 'line') {
      type = 'line';
      label = '';
    } else if (compType === 'button-primary') {
      type = 'button';
      variant = 'primary';
      label = 'Action';
    } else if (compType === 'button-secondary') {
      type = 'button';
      variant = 'secondary';
      label = 'Action';
    } else if (compType === 'input') {
      type = 'input';
      label = 'Placeholder...';
    } else if (compType === 'select') {
      type = 'select';
      label = 'Select option';
    } else if (compType === 'checkbox') {
      type = 'checkbox';
      label = 'Option';
    } else if (compType === 'radio') {
      type = 'radio';
      label = 'Option';
    } else if (compType === 'toggle') {
      type = 'toggle';
      label = 'Enabled';
    } else if (compType === 'divider') {
      type = 'divider';
      label = '';
    } else if (compType === 'text') {
      type = 'text';
      label = 'Text Label';
    } else if (compType === 'tabs') {
      type = 'tabs';
      label = '';
    } else if (compType === 'breadcrumbs') {
      type = 'breadcrumbs';
      label = 'Home > Projects > Settings';
    } else if (compType === 'table') {
      type = 'table';
      label = 'Data Table';
    } else if (compType === 'badge') {
      type = 'badge';
      label = 'Active';
    } else if (compType === 'progress') {
      type = 'progress';
      label = '';
    } else if (compType === 'alert') {
      type = 'alert';
      label = 'System update scheduled for midnight';
    }

    const id = `${type}-${Date.now().toString(36)}`;
    const newNode: SceneNode = {
      id,
      type,
      rect: {
        x: Math.max(0, cellX),
        y: Math.max(0, cellY),
        w: dims.w,
        h: dims.h,
      },
      zIndex: type === 'container' ? 0 : 1,
      label,
      meta: variant ? { variant } : undefined,
    };

    this.state.setNodes(addNode(this.state.nodes, newNode));
    this.state.selectNode(id);
    this.state.setTool('select');
    this.showToast(`Placed ${type} at (${newNode.rect.x}, ${newNode.rect.y})`);
    return id;
  }

  private renderTree(nodes: SceneNode[], depth = 0): HTMLElement {
    const doc = this.root instanceof Document ? this.root : document;
    const frag = doc.createElement('div');
    frag.style.display = 'flex';
    frag.style.flexDirection = 'column';
    frag.style.gap = '2px';

    for (const node of nodes) {
      const item = doc.createElement('div');
      item.className = 'layer-item';
      item.setAttribute('data-node-id', node.id);
      if (this.state.isNodeSelected(node.id)) {
        item.classList.add('selected');
      }
      item.style.paddingLeft = `${depth * 14 + 8}px`;

      const left = doc.createElement('div');
      left.className = 'layer-left';

      const icon = doc.createElement('span');
      icon.className = 'layer-icon';
      icon.textContent =
        node.type === 'container'
          ? '[#]'
          : node.type === 'button'
            ? '[B]'
            : node.type === 'input'
              ? '[_]'
              : node.type === 'divider'
                ? '--'
                : 'T';

      const label = doc.createElement('span');
      label.className = 'layer-label';
      label.textContent = node.label || node.id;

      left.appendChild(icon);
      left.appendChild(label);

      const coords = doc.createElement('span');
      coords.className = 'layer-coords';
      coords.textContent = `${node.rect.x},${node.rect.y}`;

      item.appendChild(left);
      item.appendChild(coords);

      item.addEventListener('click', (e) => {
        if (e.shiftKey) {
          this.state.toggleNodeSelection(node.id, true);
        } else {
          this.state.selectNode(node.id);
        }
      });

      frag.appendChild(item);

      if (node.children && node.children.length > 0) {
        frag.appendChild(this.renderTree(node.children, depth + 1));
      }
    }

    return frag;
  }

  public updateUI(): void {
    // 1. Rasterize CharGrid (< 2ms budget)
    const { grid, renderedText, renderMs } = this.state.rasterize();
    this.asciiOutput.textContent = renderedText;
    this.renderTimer.textContent = `${renderMs.toFixed(2)} ms (< 2ms)`;

    // Update Screen Selection Dropdown
    if (this.screenSelect) {
      this.screenSelect.value = this.state.currentScreen?.id ?? 'auto';
    }

    // Update Orientation Icon
    if (this.orientationIcon) {
      this.orientationIcon.textContent =
        this.state.screenOrientation === 'portrait' ? '[|]' : '[=]';
    }

    // Update Artboard Header
    if (this.artboardHeader) {
      const current = this.state.currentScreen;
      if (current) {
        let icon = '[|]';
        if (current.category === 'desktop') icon = '[=]';
        else if (current.category === 'tablet') icon = '[#]';
        else if (current.category === 'watch') icon = '(o)';
        else if (current.category === 'custom') icon = '[?]';

        this.artboardIcon.textContent = icon;
        this.artboardTitle.textContent = `${current.name} (${this.state.screenOrientation})`;
        this.artboardDims.textContent = `${grid.width} × ${grid.height} cells`;
      } else {
        this.artboardIcon.textContent = '[*]';
        this.artboardTitle.textContent = 'Auto-Fit Content';
        this.artboardDims.textContent = `${grid.width} × ${grid.height} cells`;
      }
    }

    // 2. Update Code Views
    const md = this.state.getMarkdown();
    if (this.specFormat === 'ascii') {
      this.markdownOutput.value = renderedText;
    } else if (this.specFormat === 'svg') {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      this.markdownOutput.value = this.state.getSvg({ theme: isLight ? 'light' : 'dark' });
    } else {
      this.markdownOutput.value = md;
    }

    if (this.btnFormatMd && this.btnFormatAscii) {
      this.btnFormatMd.classList.toggle('active', this.specFormat === 'md');
      this.btnFormatAscii.classList.toggle('active', this.specFormat === 'ascii');
      if (this.btnFormatSvg) {
        this.btnFormatSvg.classList.toggle('active', this.specFormat === 'svg');
      }
    }

    const doc = this.root instanceof Document ? this.root : document;
    if (doc.activeElement !== this.jsonInput) {
      this.jsonInput.value = JSON.stringify(this.state.nodes, null, 2);
    }

    // 3. Update Left Panel (Layers)
    this.treeContainer.innerHTML = '';
    this.treeContainer.appendChild(this.renderTree(this.state.nodes));

    this.tabLayers.classList.toggle('active', this.state.leftTab === 'layers');
    this.tabComponents.classList.toggle(
      'active',
      this.state.leftTab === 'components'
    );
    this.viewLayers.style.display =
      this.state.leftTab === 'layers' ? 'block' : 'none';
    this.viewComponents.style.display =
      this.state.leftTab === 'components' ? 'block' : 'none';

    // 4. Update Tool Buttons
    this.toolButtons.forEach((btn) => {
      const tool = btn.dataset.tool as EditorTool;
      btn.classList.toggle('active', this.state.activeTool === tool);
    });

    // 5. Update Inspector & Selection Overlay
    const selected = this.state.getSelectedNode();
    if (selected) {
      this.noSelection.style.display = 'none';
      this.inspectorForm.style.display = 'flex';

      if (this.selectionStatusBadge && this.selectionCountText) {
        if (this.state.selectedIds.size > 1) {
          this.selectionStatusBadge.style.display = 'block';
          this.selectionCountText.textContent = `${this.state.selectedIds.size} widgets selected`;
        } else {
          this.selectionStatusBadge.style.display = 'none';
        }
      }

      this.propId.value = selected.id;
      this.propType.value = selected.type;
      this.propLabel.value = selected.label ?? '';
      this.propX.value = selected.rect.x.toString();
      this.propY.value = selected.rect.y.toString();
      this.propW.value = selected.rect.w.toString();
      this.propH.value = selected.rect.h.toString();

      if (selected.type === 'button') {
        this.metaVariantGroup.style.display = 'block';
        this.propVariant.value = selected.meta?.variant ?? 'secondary';
      } else {
        this.metaVariantGroup.style.display = 'none';
      }

      if (
        selected.type === 'checkbox' ||
        selected.type === 'radio' ||
        selected.type === 'toggle'
      ) {
        this.metaCheckedGroup.style.display = 'block';
        this.propChecked.checked = Boolean(selected.meta?.checked);
      } else {
        this.metaCheckedGroup.style.display = 'none';
      }

      if (selected.type === 'container') {
        this.metaBorderStyleGroup.style.display = 'block';
        this.propBorderStyle.value = selected.meta?.borderStyle ?? 'single';
      } else {
        this.metaBorderStyleGroup.style.display = 'none';
      }

      if (selected.type === 'line') {
        this.metaLineGroup.style.display = 'block';
        this.propLineEnding.value = selected.meta?.lineEnding ?? 'arrow';
        this.propLineDirection.value =
          selected.meta?.lineDirection ??
          (selected.rect.h > selected.rect.w ? 'vertical' : 'horizontal');
      } else {
        this.metaLineGroup.style.display = 'none';
      }

      if (selected.type === 'tabs') {
        this.metaTabsGroup.style.display = 'block';
        this.propTabsVariant.value = selected.meta?.tabsVariant ?? 'boxed';
        this.propTabsActive.value = String(selected.meta?.activeTabIndex ?? 0);
      } else {
        this.metaTabsGroup.style.display = 'none';
      }

      if (selected.type === 'badge') {
        this.metaBadgeGroup.style.display = 'block';
        this.propBadgeVariant.value = selected.meta?.badgeVariant ?? 'tag';
      } else {
        this.metaBadgeGroup.style.display = 'none';
      }

      if (selected.type === 'progress') {
        this.metaProgressGroup.style.display = 'block';
        this.propProgressVariant.value = selected.meta?.progressVariant ?? 'bar';
        this.propProgressVal.value = String(selected.meta?.progressValue ?? 50);
      } else {
        this.metaProgressGroup.style.display = 'none';
      }

      if (selected.type === 'alert') {
        this.metaAlertGroup.style.display = 'block';
        this.propAlertVariant.value = selected.meta?.alertVariant ?? 'info';
      } else {
        this.metaAlertGroup.style.display = 'none';
      }

      this.propAction.value = selected.meta?.action ?? '';
      this.propBinding.value = selected.meta?.binding ?? '';
      this.propLayout.value = selected.meta?.layoutRule ?? '';
      this.updateTransitionOptions();
      this.propTransition.value = selected.meta?.transitionTarget ?? '';

      this.updateSelectionOverlay();
    } else {
      this.noSelection.style.display = 'block';
      this.inspectorForm.style.display = 'none';
      if (this.selectionOverlay) this.selectionOverlay.style.display = 'none';
    }

    // 6. Update Right Tabs
    this.tabDesign.classList.toggle('active', this.state.rightTab === 'design');
    this.tabSpec.classList.toggle('active', this.state.rightTab === 'spec');
    this.tabJson.classList.toggle('active', this.state.rightTab === 'json');

    this.viewDesign.style.display =
      this.state.rightTab === 'design' ? 'block' : 'none';
    this.viewMarkdown.style.display =
      this.state.rightTab === 'spec' ? 'block' : 'none';
    this.viewJson.style.display =
      this.state.rightTab === 'json' ? 'block' : 'none';

    // 7. Update Canvas Stage Dimensions for Zoom
    if (this.canvasStage && this.artboard) {
      const artW = this.artboard.offsetWidth || 0;
      const artH = this.artboard.offsetHeight || 0;
      if (artW > 0 && artH > 0) {
        this.canvasStage.style.width = `${Math.round(artW * this.zoom)}px`;
        this.canvasStage.style.height = `${Math.round(artH * this.zoom)}px`;
      }
    }

    // 8. Update Multi-Artboard Screen Flow Pills
    this.renderScreenPills();

    // 9. Update Cursor for Panning / Hand tool
    if (this.state.activeTool === 'hand' || this.isSpacePressed) {
      this.canvasViewport.style.cursor = this.isPanning ? 'grabbing' : 'grab';
      if (this.artboard) this.artboard.style.cursor = this.isPanning ? 'grabbing' : 'grab';
    } else if (!this.isPointerDown) {
      this.canvasViewport.style.cursor = 'default';
    }
  }

  public renderScreenPills(): void {
    if (!this.screenPillsList) return;
    this.screenPillsList.innerHTML = '';

    const doc = this.root instanceof Document ? this.root : document;

    this.state.screens.forEach((screen, index) => {
      const pill = doc.createElement('div');
      pill.className = `screen-pill ${screen.id === this.state.activeScreenId ? 'active' : ''}`;
      pill.dataset.screenId = screen.id;

      const badge = doc.createElement('span');
      badge.className = 'screen-pill-badge';
      badge.textContent = `${index + 1}.`;

      const nameSpan = doc.createElement('span');
      nameSpan.className = 'screen-pill-name';
      nameSpan.textContent = screen.name;
      nameSpan.title = 'Double click to rename';

      // Inline renaming via double click
      nameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const currentName = screen.name;
        const input = doc.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'coord-input';
        input.style.width = '100px';
        input.style.padding = '1px 4px';
        input.style.fontSize = '0.75rem';

        const finishRename = () => {
          const val = input.value.trim();
          if (val && val !== currentName) {
            this.state.renameScreen(screen.id, val);
          } else {
            nameSpan.textContent = currentName;
          }
        };

        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') finishRename();
          if (ev.key === 'Escape') nameSpan.textContent = currentName;
        });

        nameSpan.textContent = '';
        nameSpan.appendChild(input);
        input.focus();
        input.select();
      });

      pill.appendChild(badge);
      pill.appendChild(nameSpan);

      // Only show delete button if more than 1 screen exists
      if (this.state.screens.length > 1) {
        const closeBtn = doc.createElement('span');
        closeBtn.className = 'screen-pill-close';
        closeBtn.textContent = 'x';
        closeBtn.title = `Delete ${screen.name}`;
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removed = this.state.removeScreen(screen.id);
          if (removed) this.showToast(`Deleted ${screen.name}`);
        });
        pill.appendChild(closeBtn);
      }

      pill.addEventListener('click', () => {
        if (this.state.activeScreenId !== screen.id) {
          this.state.switchScreen(screen.id);
        }
      });

      this.screenPillsList.appendChild(pill);
    });
  }

  public updateTransitionOptions(): void {
    if (!this.propTransition) return;
    const doc = this.root instanceof Document ? this.root : document;
    this.propTransition.innerHTML = '<option value="">(None - No transition)</option>';

    this.state.screens.forEach((s) => {
      const opt = doc.createElement('option');
      opt.value = s.id;
      opt.textContent = `-> ${s.name}`;
      this.propTransition.appendChild(opt);
    });
  }

  public updateSelectionOverlay(): void {
    const selected = this.state.getSelectedNode();
    if (!selected) {
      if (this.selectionOverlay) this.selectionOverlay.style.display = 'none';
      if (this.multiSelectionContainer) this.multiSelectionContainer.innerHTML = '';
      return;
    }
    const { charW, charH, padLeft, padTop } = this.getCellMetrics();
    const offsetTop = this.asciiOutput.offsetTop || 0;
    const offsetLeft = this.asciiOutput.offsetLeft || 0;
    const leftPx = offsetLeft + padLeft + selected.rect.x * charW;
    const topPx = offsetTop + padTop + selected.rect.y * charH;
    const widthPx = selected.rect.w * charW;
    const heightPx = selected.rect.h * charH;

    this.selectionOverlay.style.display = 'block';
    this.selectionOverlay.style.left = `${leftPx}px`;
    this.selectionOverlay.style.top = `${topPx}px`;
    this.selectionOverlay.style.width = `${widthPx}px`;
    this.selectionOverlay.style.height = `${heightPx}px`;

    if (this.state.selectedIds.size > 1) {
      this.selectionPill.textContent = `${this.state.selectedIds.size} widgets selected`;
    } else {
      this.selectionPill.textContent = `${selected.type} • ${selected.rect.x}, ${selected.rect.y} • ${selected.rect.w} × ${selected.rect.h}`;
    }

    if (this.multiSelectionContainer) {
      this.multiSelectionContainer.innerHTML = '';
      if (this.state.selectedIds.size > 1) {
        const doc = this.root instanceof Document ? this.root : document;
        for (const id of this.state.selectedIds) {
          if (id === selected.id) continue;
          const other = findNode(this.state.nodes, id);
          if (!other) continue;
          const box = doc.createElement('div');
          box.className = 'multi-selection-box';
          box.style.left = `${offsetLeft + padLeft + other.rect.x * charW}px`;
          box.style.top = `${offsetTop + padTop + other.rect.y * charH}px`;
          box.style.width = `${other.rect.w * charW}px`;
          box.style.height = `${other.rect.h * charH}px`;
          this.multiSelectionContainer.appendChild(box);
        }
      }
    }
  }

  public setZoom(zoom: number): void {
    const clamped = Math.max(0.25, Math.min(3.0, Math.round(zoom * 100) / 100));
    this.zoom = clamped;

    if (this.artboard) {
      this.artboard.style.transform = `scale(${this.zoom})`;
      this.artboard.style.transformOrigin = 'center center';
    }

    if (this.canvasStage && this.artboard) {
      const artW = this.artboard.offsetWidth || 0;
      const artH = this.artboard.offsetHeight || 0;
      if (artW > 0 && artH > 0) {
        this.canvasStage.style.width = `${Math.round(artW * this.zoom)}px`;
        this.canvasStage.style.height = `${Math.round(artH * this.zoom)}px`;
      }
    }

    if (this.btnZoomLevel) {
      this.btnZoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    this.updateSelectionOverlay();
  }

  public zoomToFit(): void {
    const vp = this.canvasViewport || this.canvasArea;
    if (!vp || !this.artboard) {
      this.setZoom(1.0);
      return;
    }
    const areaW = vp.clientWidth - 128;
    const areaH = vp.clientHeight - 128;
    const artW = this.artboard.offsetWidth || 600;
    const artH = this.artboard.offsetHeight || 400;

    if (artW <= 0 || artH <= 0 || areaW <= 0 || areaH <= 0) {
      this.setZoom(1.0);
      return;
    }

    const fitRatio = Math.min(areaW / artW, areaH / artH, 1.5);
    const rounded = Math.max(0.25, Math.min(3.0, Math.round(fitRatio * 20) / 20));
    this.setZoom(rounded);
    this.showToast(`Fit to Screen (${Math.round(this.zoom * 100)}%)`);
  }

  private attachEventListeners(): void {
    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      const current = localStorage.getItem('ascii-frames-theme') || 'auto';
      const next = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
    });

    // Tool switcher
    this.toolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool as EditorTool;
        this.state.setTool(tool);
        this.showToast(`Tool: ${tool}`);
      });
    });

    // Sidebar Tab Switcher
    this.tabLayers.addEventListener('click', () =>
      this.state.setLeftTab('layers')
    );
    this.tabComponents.addEventListener('click', () =>
      this.state.setLeftTab('components')
    );

    // Inspector Tab Switcher
    this.tabDesign.addEventListener('click', () =>
      this.state.setRightTab('design')
    );
    this.tabSpec.addEventListener('click', () =>
      this.state.setRightTab('spec')
    );
    this.tabJson.addEventListener('click', () =>
      this.state.setRightTab('json')
    );

    // Screen Viewport Selector
    this.screenSelect.addEventListener('change', () => {
      this.state.setScreen(this.screenSelect.value);
      this.showToast(
        `Viewport: ${this.screenSelect.options[this.screenSelect.selectedIndex].text}`
      );
    });

    // Orientation toggle
    this.btnOrientation.addEventListener('click', () => {
      this.state.toggleOrientation();
      this.showToast(`Orientation: ${this.state.screenOrientation}`);
    });

    // Preset selector
    this.presetSelect.addEventListener('change', () => {
      if (this.presetSelect.value) {
        this.state.loadPreset(this.presetSelect.value);
        this.showToast(
          `Loaded ${this.presetSelect.options[this.presetSelect.selectedIndex].text}`
        );
      }
    });

    // Top actions
    this.btnUndo.addEventListener('click', () => this.state.undo());
    this.btnRedo.addEventListener('click', () => this.state.redo());
    this.btnDuplicate.addEventListener('click', () => {
      const newId = this.state.duplicateSelected();
      if (newId) this.showToast('Duplicated layer');
    });
    this.btnClear.addEventListener('click', () => {
      if (confirm('Clear the entire canvas?')) {
        this.state.clearCanvas();
        this.showToast('Canvas cleared');
      }
    });

    // Components Palette Click & Drag-and-Drop
    let isDraggingCard = false;
    let isDropping = false;

    this.root
      .querySelectorAll<HTMLElement>('[data-create-component]')
      .forEach((card) => {
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', (e: DragEvent) => {
          isDraggingCard = true;
          const compType = card.dataset.createComponent!;
          this.currentDraggedComponent = compType;
          if (e.dataTransfer) {
            e.dataTransfer.setData('application/x-ascii-component', compType);
            e.dataTransfer.setData('text/plain', compType);
            e.dataTransfer.effectAllowed = 'copy';
          }
          card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
          this.currentDraggedComponent = null;
          card.classList.remove('dragging');
          if (this.drawPreview) this.drawPreview.style.display = 'none';
          setTimeout(() => {
            isDraggingCard = false;
          }, 150);
        });

        card.addEventListener('click', (e) => {
          if (isDraggingCard) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          const compType = card.dataset.createComponent!;
          let type: WidgetType = 'button';
          let variant: 'primary' | 'secondary' | undefined;

          if (compType === 'container') type = 'container';
          else if (compType === 'circle') type = 'circle';
          else if (compType === 'line') type = 'line';
          else if (compType === 'button-primary') {
            type = 'button';
            variant = 'primary';
          } else if (compType === 'button-secondary') {
            type = 'button';
            variant = 'secondary';
          } else if (compType === 'input') type = 'input';
          else if (compType === 'select') type = 'select';
          else if (compType === 'checkbox') type = 'checkbox';
          else if (compType === 'radio') type = 'radio';
          else if (compType === 'toggle') type = 'toggle';
          else if (compType === 'divider') type = 'divider';
          else if (compType === 'text') type = 'text';
          else if (compType === 'tabs') type = 'tabs';
          else if (compType === 'breadcrumbs') type = 'breadcrumbs';
          else if (compType === 'table') type = 'table';
          else if (compType === 'badge') type = 'badge';
          else if (compType === 'progress') type = 'progress';
          else if (compType === 'alert') type = 'alert';

          const newId = this.state.addNewNode(type);
          if (variant) {
            this.state.updateSelected({ meta: { variant } });
          }
          this.state.setLeftTab('layers');
          this.showToast(`Added ${type}`);
        });
      });

    // Canvas Viewport Drag-and-Drop Handlers
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }

      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
      const { charW, charH, padLeft, padTop } = this.getCellMetrics();
      const offsetTop = this.asciiOutput.offsetTop || 0;
      const offsetLeft = this.asciiOutput.offsetLeft || 0;

      const compType = this.currentDraggedComponent || 'button';
      const dims = this.getComponentDefaultDims(compType);

      this.drawPreview.style.display = 'block';
      this.drawPreview.style.left = `${offsetLeft + padLeft + cellX * charW}px`;
      this.drawPreview.style.top = `${offsetTop + padTop + cellY * charH}px`;
      this.drawPreview.style.width = `${dims.w * charW}px`;
      this.drawPreview.style.height = `${dims.h * charH}px`;
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = this.canvasViewport.getBoundingClientRect();
      if (
        e.clientX <= rect.left ||
        e.clientX >= rect.right ||
        e.clientY <= rect.top ||
        e.clientY >= rect.bottom
      ) {
        if (this.drawPreview) this.drawPreview.style.display = 'none';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.drawPreview) {
        this.drawPreview.style.display = 'none';
      }

      if (isDropping) return;
      isDropping = true;
      setTimeout(() => {
        isDropping = false;
      }, 150);

      const compType =
        e.dataTransfer?.getData('application/x-ascii-component') ||
        this.currentDraggedComponent;

      this.currentDraggedComponent = null;

      if (!compType) return;
      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
      this.dropComponentAt(compType, cellX, cellY);
    };

    this.canvasViewport.addEventListener('dragover', handleDragOver);
    this.canvasViewport.addEventListener('dragleave', handleDragLeave);
    this.canvasViewport.addEventListener('drop', handleDrop);

    // Block native text/image drag on canvas viewport to prevent spurious drops
    this.canvasViewport.addEventListener('dragstart', (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-create-component]')) {
        e.preventDefault();
      }
    });

    // Screen Flow Bar Add Screen
    this.btnAddScreen.addEventListener('click', () => {
      const screenId = this.state.addScreen();
      this.showToast('Added new screen');
    });

    // Viewport direct panning (Hand tool, Space+Drag, or Middle Mouse Button)
    this.canvasViewport.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button === 1 || this.state.activeTool === 'hand' || this.isSpacePressed) {
        this.startPanning(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    // Canvas Pointerdown: Selection, Drag-to-Move, Drag-to-Resize, Drag-to-Draw, or Pan
    this.artboard.addEventListener('pointerdown', (e: PointerEvent) => {
      // 0. Check Hand tool, Space+Drag, or middle click for canvas panning
      if (e.button === 1 || this.state.activeTool === 'hand' || this.isSpacePressed) {
        this.startPanning(e.clientX, e.clientY);
        e.preventDefault();
        return;
      }

      const target = e.target as HTMLElement;

      // 1. Check if clicking on a resize handle
      if (target.classList.contains('handle')) {
        const selected = this.state.getSelectedNode();
        if (!selected) return;
        const handle = target.dataset.handle!;
        this.isPointerDown = true;
        this.dragMode = 'resize';
        this.activeHandle = handle;
        this.state.snapshotHistory();
        const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
        this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
        this.initialRect = { ...selected.rect };
        if (typeof target.setPointerCapture === 'function') {
          try {
            target.setPointerCapture(e.pointerId);
          } catch {}
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 2. Check if clicking inside selection overlay to drag-move
      if (
        target === this.selectionOverlay ||
        this.selectionOverlay.contains(target)
      ) {
        const selected = this.state.getSelectedNode();
        if (selected) {
          this.isPointerDown = true;
          this.dragMode = 'move';
          this.state.snapshotHistory();
          const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
          this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
          this.initialRect = { ...selected.rect };
          this.artboard.style.cursor = 'grabbing';
          e.preventDefault();
          return;
        }
      }

      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);

      // 2b. If clicking inside the currently selected node's bounding box, prioritize moving it!
      const curSelected = this.state.getSelectedNode();
      if (
        curSelected &&
        cellX >= curSelected.rect.x &&
        cellX < curSelected.rect.x + curSelected.rect.w &&
        cellY >= curSelected.rect.y &&
        cellY < curSelected.rect.y + curSelected.rect.h
      ) {
        this.isPointerDown = true;
        this.dragMode = 'move';
        this.state.snapshotHistory();
        this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
        this.initialRect = { ...curSelected.rect };
        this.artboard.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // 3. If active tool is a drawing tool (Container, Button, Input, Divider, Text)
      if (this.state.activeTool !== 'select') {
        this.isPointerDown = true;
        this.dragMode = 'draw';
        this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
        const { charW, charH, padLeft, padTop } = this.getCellMetrics();
        const offsetTop = this.asciiOutput.offsetTop || 0;
        const offsetLeft = this.asciiOutput.offsetLeft || 0;
        this.drawPreview.style.display = 'block';
        this.drawPreview.style.left = `${offsetLeft + padLeft + cellX * charW}px`;
        this.drawPreview.style.top = `${offsetTop + padTop + cellY * charH}px`;
        this.drawPreview.style.width = `${charW}px`;
        this.drawPreview.style.height = `${charH}px`;
        e.preventDefault();
        return;
      }

      // 4. In Select mode: Hit test for topmost node
      const hit = findNodeAt(this.state.nodes, cellX, cellY);
      if (hit) {
        if (e.shiftKey) {
          this.state.toggleNodeSelection(hit.id, true);
        } else if (!this.state.isNodeSelected(hit.id)) {
          this.state.selectNode(hit.id);
        }
        this.isPointerDown = true;
        this.dragMode = 'move';
        this.state.snapshotHistory();
        this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
        this.initialRect = { ...hit.rect };
        this.artboard.style.cursor = 'grabbing';
      } else {
        if (!e.shiftKey) {
          this.state.selectNode(null);
        }
        this.isPointerDown = true;
        this.dragMode = 'marquee';
        this.startPoint = { clientX: e.clientX, clientY: e.clientY, cellX, cellY };
        if (this.marqueeSelection) {
          const { charW, charH, padLeft, padTop } = this.getCellMetrics();
          const offsetTop = this.asciiOutput.offsetTop || 0;
          const offsetLeft = this.asciiOutput.offsetLeft || 0;
          this.marqueeSelection.style.display = 'block';
          this.marqueeSelection.style.left = `${offsetLeft + padLeft + cellX * charW}px`;
          this.marqueeSelection.style.top = `${offsetTop + padTop + cellY * charH}px`;
          this.marqueeSelection.style.width = '0px';
          this.marqueeSelection.style.height = '0px';
        }
      }
      e.preventDefault();
    });

    // Prevent native drag & selection on canvas artboard
    this.artboard.addEventListener('dragstart', (e) => e.preventDefault());

    // Dynamic Grab / Cursor hover in Select mode
    this.artboard.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.isPointerDown) return;
      if (this.state.activeTool !== 'select') {
        this.artboard.style.cursor = 'crosshair';
        return;
      }
      const target = e.target as HTMLElement;
      if (target.classList.contains('handle')) return;
      if (target === this.selectionOverlay || this.selectionOverlay.contains(target)) {
        this.artboard.style.cursor = 'grab';
        return;
      }
      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
      const curSelected = this.state.getSelectedNode();
      if (
        curSelected &&
        cellX >= curSelected.rect.x &&
        cellX < curSelected.rect.x + curSelected.rect.w &&
        cellY >= curSelected.rect.y &&
        cellY < curSelected.rect.y + curSelected.rect.h
      ) {
        this.artboard.style.cursor = 'grab';
        return;
      }
      const hit = findNodeAt(this.state.nodes, cellX, cellY);
      this.artboard.style.cursor = hit ? 'grab' : 'default';
    });

    // Inspector Property Inputs
    this.propLabel.addEventListener('input', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      const newLabel = this.propLabel.value;
      const updates: Partial<SceneNode> = { label: newLabel };

      let minW = 1;
      if (cur.type === 'button') {
        minW = newLabel.length + (cur.meta?.variant === 'primary' ? 6 : 4);
      } else if (cur.type === 'input') {
        minW = newLabel.length + 4;
      } else if (cur.type === 'container') {
        minW = Math.max(3, newLabel.length + 6);
      } else if (cur.type === 'select') {
        minW = newLabel.length + 6;
      }

      if (cur.rect.w < minW) {
        updates.rect = { ...cur.rect, w: minW };
        this.propW.value = minW.toString();
      }

      this.state.updateSelected(updates);
    });

    this.propType.addEventListener('change', () => {
      this.state.updateSelected({ type: this.propType.value as WidgetType });
    });

    this.propX.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        rect: { ...cur.rect, x: Math.max(0, parseInt(this.propX.value) || 0) },
      });
    });

    this.propY.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        rect: { ...cur.rect, y: Math.max(0, parseInt(this.propY.value) || 0) },
      });
    });

    this.propW.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        rect: { ...cur.rect, w: Math.max(1, parseInt(this.propW.value) || 1) },
      });
    });

    this.propH.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        rect: { ...cur.rect, h: Math.max(1, parseInt(this.propH.value) || 1) },
      });
    });

    this.propVariant.addEventListener('change', () => {
      this.state.updateSelected({
        meta: { variant: this.propVariant.value as 'primary' | 'secondary' },
      });
    });

    this.propChecked.addEventListener('change', () => {
      this.state.updateSelected({
        meta: { checked: this.propChecked.checked },
      });
    });

    this.propAction.addEventListener('input', () => {
      this.state.updateSelected({
        meta: { action: this.propAction.value.trim() || undefined },
      });
    });

    this.propBinding.addEventListener('input', () => {
      this.state.updateSelected({
        meta: { binding: this.propBinding.value.trim() || undefined },
      });
    });

    this.propLayout.addEventListener('input', () => {
      this.state.updateSelected({
        meta: { layoutRule: this.propLayout.value.trim() || undefined },
      });
    });

    this.propTransition.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      const target = this.propTransition.value || undefined;
      this.state.updateSelected({
        meta: { ...cur.meta, transitionTarget: target },
      });
    });

    this.propBorderStyle.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, borderStyle: this.propBorderStyle.value as any },
      });
    });

    this.propLineEnding.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, lineEnding: this.propLineEnding.value as any },
      });
    });

    this.propLineDirection.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, lineDirection: this.propLineDirection.value as any },
      });
    });

    this.propTabsVariant.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, tabsVariant: this.propTabsVariant.value as any },
      });
    });

    this.propTabsActive.addEventListener('input', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      const idx = parseInt(this.propTabsActive.value, 10);
      this.state.updateSelected({
        meta: { ...cur.meta, activeTabIndex: isNaN(idx) ? 0 : idx },
      });
    });

    this.propBadgeVariant.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, badgeVariant: this.propBadgeVariant.value as any },
      });
    });

    this.propProgressVariant.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, progressVariant: this.propProgressVariant.value as any },
      });
    });

    this.propProgressVal.addEventListener('input', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      const val = parseInt(this.propProgressVal.value, 10);
      this.state.updateSelected({
        meta: {
          ...cur.meta,
          progressValue: isNaN(val) ? 50 : Math.max(0, Math.min(100, val)),
        },
      });
    });

    this.propAlertVariant.addEventListener('change', () => {
      const cur = this.state.getSelectedNode();
      if (!cur) return;
      this.state.updateSelected({
        meta: { ...cur.meta, alertVariant: this.propAlertVariant.value as any },
      });
    });

    // Inspector Nudgers
    this.nudgeLeft.addEventListener('click', () => this.state.moveSelected(-1, 0));
    this.nudgeRight.addEventListener('click', () => this.state.moveSelected(1, 0));
    this.nudgeUp.addEventListener('click', () => this.state.moveSelected(0, -1));
    this.nudgeDown.addEventListener('click', () => this.state.moveSelected(0, 1));

    this.resizeWMinus.addEventListener('click', () =>
      this.state.resizeSelected(-1, 0)
    );
    this.resizeWPlus.addEventListener('click', () =>
      this.state.resizeSelected(1, 0)
    );
    this.resizeHMinus.addEventListener('click', () =>
      this.state.resizeSelected(0, -1)
    );
    this.resizeHPlus.addEventListener('click', () =>
      this.state.resizeSelected(0, 1)
    );

    // Alignment and Distribution
    this.btnAlignLeft?.addEventListener('click', () => {
      this.state.alignSelected('left');
      this.showToast('Aligned Left');
    });
    this.btnAlignCenter?.addEventListener('click', () => {
      this.state.alignSelected('center');
      this.showToast('Aligned Horizontal Center');
    });
    this.btnAlignRight?.addEventListener('click', () => {
      this.state.alignSelected('right');
      this.showToast('Aligned Right');
    });
    this.btnAlignTop?.addEventListener('click', () => {
      this.state.alignSelected('top');
      this.showToast('Aligned Top');
    });
    this.btnAlignMiddle?.addEventListener('click', () => {
      this.state.alignSelected('middle');
      this.showToast('Aligned Vertical Center');
    });
    this.btnAlignBottom?.addEventListener('click', () => {
      this.state.alignSelected('bottom');
      this.showToast('Aligned Bottom');
    });
    this.btnDistributeH?.addEventListener('click', () => {
      this.state.distributeSelected('horizontal');
      this.showToast('Distributed Horizontally');
    });
    this.btnDistributeV?.addEventListener('click', () => {
      this.state.distributeSelected('vertical');
      this.showToast('Distributed Vertically');
    });

    // Layer ordering & actions
    this.btnForward.addEventListener('click', () =>
      this.state.reorderSelected('forward')
    );
    this.btnBackward.addEventListener('click', () =>
      this.state.reorderSelected('backward')
    );
    this.btnDeleteNode.addEventListener('click', () => {
      this.state.removeSelected();
      this.showToast('Deleted node');
    });

    // Spec Copy & Download
    this.btnCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.state.getMarkdown());
        this.showToast('Copied WIREFRAME.md!');
      } catch (err) {
        this.showToast('Failed to copy');
      }
    });

    if (this.btnCopyAscii) {
      this.btnCopyAscii.addEventListener('click', async () => {
        try {
          const { renderedText } = this.state.rasterize();
          await navigator.clipboard.writeText(renderedText);
          this.showToast('Copied Raw ASCII Art!');
        } catch (err) {
          this.showToast('Failed to copy');
        }
      });
    }

    if (this.btnToggleWide) {
      this.btnToggleWide.addEventListener('click', () => {
        this.isWideMode = !this.isWideMode;
        const main = this.root.querySelector<HTMLElement>('.studio-main');
        if (main) main.classList.toggle('wide-mode', this.isWideMode);
        this.btnToggleWide!.classList.toggle('active', this.isWideMode);
        this.btnToggleWide!.textContent = this.isWideMode ? '><' : '<>';
        this.showToast(this.isWideMode ? 'Expanded Wide Panel (620px)' : 'Standard Panel (460px)');
      });
    }

    if (this.btnFormatMd) {
      this.btnFormatMd.addEventListener('click', () => {
        this.specFormat = 'md';
        this.updateUI();
      });
    }
    if (this.btnFormatAscii) {
      this.btnFormatAscii.addEventListener('click', () => {
        this.specFormat = 'ascii';
        this.updateUI();
      });
    }
    if (this.btnFormatSvg) {
      this.btnFormatSvg.addEventListener('click', () => {
        this.specFormat = 'svg';
        this.updateUI();
      });
    }

    if (this.btnExportSvg) {
      this.btnExportSvg.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const svg = this.state.getSvg({ theme: isLight ? 'light' : 'dark' });
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wireframe.svg';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Exported wireframe.svg');
      });
    }

    if (this.btnExportPng) {
      this.btnExportPng.addEventListener('click', () => {
        this.exportToPng();
      });
    }

    // Canvas Zoom Controls
    if (this.btnZoomIn) {
      this.btnZoomIn.addEventListener('click', () => {
        this.setZoom(this.zoom + 0.15);
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`);
      });
    }

    if (this.btnZoomOut) {
      this.btnZoomOut.addEventListener('click', () => {
        this.setZoom(this.zoom - 0.15);
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`);
      });
    }

    if (this.btnZoomLevel) {
      this.btnZoomLevel.addEventListener('click', () => {
        if (Math.abs(this.zoom - 1.0) < 0.05) {
          this.setZoom(1.5);
        } else {
          this.setZoom(1.0);
        }
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`);
      });
    }

    if (this.btnZoomFit) {
      this.btnZoomFit.addEventListener('click', () => {
        this.zoomToFit();
      });
    }

    // Ctrl/Cmd + Mouse Wheel / Trackpad Pinch Zoom
    const wheelTarget = this.canvasViewport || this.canvasArea;
    if (wheelTarget) {
      wheelTarget.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY === 0) return;
            const factor = e.deltaY < 0 ? 1.15 : 0.85;
            this.setZoom(this.zoom * factor);
          }
        },
        { passive: false }
      );
    }

    this.btnDownload.addEventListener('click', () => {
      const md = this.state.getMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WIREFRAME.md';
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Exported WIREFRAME.md');
    });

    // Apply JSON
    this.btnApplyJson.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(this.jsonInput.value);
        if (Array.isArray(parsed)) {
          this.state.setNodes(parsed);
          this.showToast('Applied AST changes');
        } else {
          this.showToast('Error: Root must be an array of SceneNodes');
        }
      } catch (err) {
        this.showToast(`Invalid JSON: ${(err as Error).message}`);
      }
    });
  }

  public startPanning(clientX: number, clientY: number): void {
    this.isPanning = true;
    this.panStart = {
      x: clientX,
      y: clientY,
      scrollLeft: this.canvasViewport.scrollLeft,
      scrollTop: this.canvasViewport.scrollTop,
    };
    this.canvasViewport.style.cursor = 'grabbing';
    if (this.artboard) this.artboard.style.cursor = 'grabbing';
  }

  public exportToPng(): void {
    const doc = this.root instanceof Document ? this.root : document;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const svgStr = this.state.getSvg({ theme: isLight ? 'light' : 'dark' });

    const wMatch = svgStr.match(/width="(\d+)"/);
    const hMatch = svgStr.match(/height="(\d+)"/);
    const width = wMatch ? parseInt(wMatch[1], 10) : 800;
    const height = hMatch ? parseInt(hMatch[1], 10) : 600;

    const canvas = doc.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.showToast('Canvas not available');
      return;
    }

    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const a = doc.createElement('a');
          a.href = pngUrl;
          a.download = 'wireframe.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
          this.showToast('Exported wireframe.png');
        }, 'image/png');
      } else {
        const a = doc.createElement('a');
        a.href = canvas.toDataURL?.('image/png') || url;
        a.download = 'wireframe.png';
        a.click();
        this.showToast('Exported wireframe.png');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.showToast('Failed to generate PNG');
    };
    img.src = url;
  }

  // Pointer Move (Drag, Resize, Draw, or Pan)
  public handlePointerMove(e: PointerEvent): void {
    if (this.isPanning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.canvasViewport.scrollLeft = this.panStart.scrollLeft - dx;
      this.canvasViewport.scrollTop = this.panStart.scrollTop - dy;
      return;
    }

    if (!this.isPointerDown) return;

    const { charW, charH } = this.getCellMetrics();
    const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
    const dx =
      charW > 0
        ? Math.round((e.clientX - this.startPoint.clientX) / charW)
        : cellX - this.startPoint.cellX;
    const dy =
      charH > 0
        ? Math.round((e.clientY - this.startPoint.clientY) / charH)
        : cellY - this.startPoint.cellY;

    if (this.dragMode === 'move') {
      if (dx !== 0 || dy !== 0) {
        const target = this.state.getSelectedNode();
        if (target) {
          const newX = Math.max(0, this.initialRect.x + dx);
          const newY = Math.max(0, this.initialRect.y + dy);
          const moveDx = newX - target.rect.x;
          const moveDy = newY - target.rect.y;

          if (moveDx !== 0 || moveDy !== 0) {
            this.state.moveSelected(moveDx, moveDy, false);
          }
        }
      }
    } else if (this.dragMode === 'resize') {
      const cur = this.state.getSelectedNode();
      if (!cur) return;

      const minW = cur.type === 'container' ? 3 : 1;
      const minH = cur.type === 'container' ? 3 : 1;

      let newX = this.initialRect.x;
      let newY = this.initialRect.y;
      let newW = this.initialRect.w;
      let newH = this.initialRect.h;

      // Horizontal resizing
      if (this.activeHandle?.includes('e')) {
        // East handles (e, ne, se): moves right edge
        newW = Math.max(minW, this.initialRect.w + dx);
      } else if (this.activeHandle?.includes('w')) {
        // West handles (w, nw, sw): moves left edge and updates x, right edge anchored
        const maxDx = this.initialRect.w - minW;
        const minDx = -this.initialRect.x;
        const clampedDx = Math.min(maxDx, Math.max(minDx, dx));
        newX = this.initialRect.x + clampedDx;
        newW = this.initialRect.w - clampedDx;
      }

      // Vertical resizing
      if (this.activeHandle?.includes('s')) {
        // South handles (s, se, sw): moves bottom edge
        newH = Math.max(minH, this.initialRect.h + dy);
      } else if (this.activeHandle?.includes('n')) {
        // North handles (n, ne, nw): moves top edge and updates y, bottom edge anchored
        const maxDy = this.initialRect.h - minH;
        const minDy = -this.initialRect.y;
        const clampedDy = Math.min(maxDy, Math.max(minDy, dy));
        newY = this.initialRect.y + clampedDy;
        newH = this.initialRect.h - clampedDy;
      }

      if (
        newX !== cur.rect.x ||
        newY !== cur.rect.y ||
        newW !== cur.rect.w ||
        newH !== cur.rect.h
      ) {
        this.state.updateSelected(
          {
            rect: { x: newX, y: newY, w: newW, h: newH },
          },
          false
        );
      }
    } else if (this.dragMode === 'draw') {
      const { padLeft, padTop } = this.getCellMetrics();
      const offsetTop = this.asciiOutput.offsetTop || 0;
      const offsetLeft = this.asciiOutput.offsetLeft || 0;
      const minCellX = Math.min(this.startPoint.cellX, cellX);
      const minCellY = Math.min(this.startPoint.cellY, cellY);
      const cellW = Math.max(1, Math.abs(cellX - this.startPoint.cellX) + 1);
      const cellH = Math.max(1, Math.abs(cellY - this.startPoint.cellY) + 1);

      this.drawPreview.style.left = `${offsetLeft + padLeft + minCellX * charW}px`;
      this.drawPreview.style.top = `${offsetTop + padTop + minCellY * charH}px`;
      this.drawPreview.style.width = `${cellW * charW}px`;
      this.drawPreview.style.height = `${cellH * charH}px`;
    } else if (this.dragMode === 'marquee') {
      if (this.marqueeSelection) {
        const { padLeft, padTop, charW, charH } = this.getCellMetrics();
        const offsetTop = this.asciiOutput.offsetTop || 0;
        const offsetLeft = this.asciiOutput.offsetLeft || 0;
        const minCellX = Math.min(this.startPoint.cellX, cellX);
        const minCellY = Math.min(this.startPoint.cellY, cellY);
        const cellW = Math.max(1, Math.abs(cellX - this.startPoint.cellX) + 1);
        const cellH = Math.max(1, Math.abs(cellY - this.startPoint.cellY) + 1);

        this.marqueeSelection.style.left = `${offsetLeft + padLeft + minCellX * charW}px`;
        this.marqueeSelection.style.top = `${offsetTop + padTop + minCellY * charH}px`;
        this.marqueeSelection.style.width = `${cellW * charW}px`;
        this.marqueeSelection.style.height = `${cellH * charH}px`;
      }
    }
  }

  // Pointer Up
  public handlePointerUp(e: PointerEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      const cursor =
        this.isSpacePressed || this.state.activeTool === 'hand' ? 'grab' : 'default';
      this.canvasViewport.style.cursor = cursor;
      if (this.artboard) this.artboard.style.cursor = cursor;
      return;
    }

    if (!this.isPointerDown) return;

    if (this.dragMode === 'draw') {
      this.drawPreview.style.display = 'none';
      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
      const minCellX = Math.min(this.startPoint.cellX, cellX);
      const minCellY = Math.min(this.startPoint.cellY, cellY);
      const cellW = Math.max(1, Math.abs(cellX - this.startPoint.cellX) + 1);
      const cellH = Math.max(1, Math.abs(cellY - this.startPoint.cellY) + 1);

      const tool = this.state.activeTool;
      const type: WidgetType = (tool === 'select' || tool === 'hand') ? 'container' : tool;
      this.state.createNodeAt(type, {
        x: minCellX,
        y: minCellY,
        w: cellW,
        h: cellH,
      });
      this.showToast(`Drawn ${type}`);
    } else if (this.dragMode === 'marquee') {
      if (this.marqueeSelection) {
        this.marqueeSelection.style.display = 'none';
      }
      const { cellX, cellY } = this.clientToCell(e.clientX, e.clientY);
      const minCellX = Math.min(this.startPoint.cellX, cellX);
      const minCellY = Math.min(this.startPoint.cellY, cellY);
      const cellW = Math.max(1, Math.abs(cellX - this.startPoint.cellX) + 1);
      const cellH = Math.max(1, Math.abs(cellY - this.startPoint.cellY) + 1);

      if (cellW > 1 || cellH > 1 || Math.abs(e.clientX - this.startPoint.clientX) > 5 || Math.abs(e.clientY - this.startPoint.clientY) > 5) {
        this.state.selectInRect({ x: minCellX, y: minCellY, w: cellW, h: cellH }, e.shiftKey);
      }
    } else if (this.dragMode === 'move' || this.dragMode === 'resize') {
      const cur = this.state.getSelectedNode();
      if (
        cur &&
        cur.rect.x === this.initialRect.x &&
        cur.rect.y === this.initialRect.y &&
        cur.rect.w === this.initialRect.w &&
        cur.rect.h === this.initialRect.h
      ) {
        // Discard snapshot if user merely clicked without moving/resizing
        this.state.popHistorySnapshot();
      }
    }

    if (e.target && typeof (e.target as any).releasePointerCapture === 'function') {
      try {
        (e.target as any).releasePointerCapture(e.pointerId);
      } catch {}
    }

    this.isPointerDown = false;
    this.dragMode = null;
    this.activeHandle = null;
    this.artboard.style.cursor = 'default';
  }

  // Keyboard Shortcuts
  public handleKeyDown(e: KeyboardEvent): void {
    const doc = this.root instanceof Document ? this.root : document;
    if (['INPUT', 'TEXTAREA'].includes((doc.activeElement as HTMLElement)?.tagName)) {
      return;
    }

    // Space bar hold for temporary canvas panning
    if (e.code === 'Space' || e.key === ' ') {
      if (!this.isSpacePressed) {
        this.isSpacePressed = true;
        this.canvasViewport.style.cursor = 'grab';
        if (this.artboard) this.artboard.style.cursor = 'grab';
      }
      e.preventDefault();
      return;
    }

    // Figma tool shortcuts
    if (!e.metaKey && !e.ctrlKey) {
      if (e.key === 'v' || e.key === 'V') {
        this.state.setTool('select');
        this.showToast('Tool: Select (V)');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        this.state.setTool('hand');
        this.showToast('Tool: Hand / Pan Canvas (H)');
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        this.state.setTool('container');
        this.showToast('Tool: Frame / Container (F)');
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        this.state.setTool('circle');
        this.showToast('Tool: Circle / Avatar (O)');
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        this.state.setTool('line');
        this.showToast('Tool: Line / Connector (L)');
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        this.state.setTool('button');
        this.showToast('Tool: Button (B)');
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        this.state.setTool('input');
        this.showToast('Tool: Input (I)');
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        this.state.setTool('divider');
        this.showToast('Tool: Divider (D)');
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        this.state.setTool('text');
        this.showToast('Tool: Text (T)');
        return;
      }
    }

    // Undo / Redo
    if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
      if (e.shiftKey) {
        this.state.redo();
      } else {
        this.state.undo();
      }
      e.preventDefault();
      return;
    }

    // Zoom shortcuts (Cmd/Ctrl + '+', Cmd/Ctrl + '-', Cmd/Ctrl + '0', Shift + '1')
    if (e.metaKey || e.ctrlKey) {
      if (e.key === '=' || e.key === '+') {
        this.setZoom(this.zoom + 0.15);
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`);
        e.preventDefault();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        this.setZoom(this.zoom - 0.15);
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`);
        e.preventDefault();
        return;
      }
      if (e.key === '0') {
        this.setZoom(1.0);
        this.showToast('Zoom: 100%');
        e.preventDefault();
        return;
      }
    }

    if (e.shiftKey && (e.key === '!' || e.key === '1')) {
      this.zoomToFit();
      e.preventDefault();
      return;
    }

    // Duplicate (Cmd+D)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D')) {
      const newId = this.state.duplicateSelected();
      if (newId) this.showToast('Duplicated layer (Cmd+D)');
      e.preventDefault();
      return;
    }

    // Nudging and Deleting Selected Node(s)
    if (this.state.selectedId || this.state.selectedIds.size > 0) {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') {
        this.state.moveSelected(-step, 0);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this.state.moveSelected(step, 0);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.state.moveSelected(0, -step);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.state.moveSelected(0, step);
        e.preventDefault();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.state.removeSelected();
        this.showToast('Deleted');
        e.preventDefault();
      }
    }
  }

  // Key Up (Space bar pan release)
  public handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.key === ' ') {
      this.isSpacePressed = false;
      if (!this.isPanning) {
        const cursor = this.state.activeTool === 'hand' ? 'grab' : 'default';
        this.canvasViewport.style.cursor = cursor;
        if (this.artboard) this.artboard.style.cursor = cursor;
      }
    }
  }
}
