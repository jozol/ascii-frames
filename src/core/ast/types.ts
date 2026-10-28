export type WidgetType =
  | 'container'
  | 'button'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'text'
  | 'divider'
  | 'circle'
  | 'line'
  | 'tabs'
  | 'breadcrumbs'
  | 'table'
  | 'badge'
  | 'progress'
  | 'alert';

export type ContainerBorderStyle =
  | 'single'
  | 'rounded'
  | 'double'
  | 'dashed'
  | 'minimal';

export type LineEnding = 'none' | 'arrow' | 'both';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type LineDirection =
  | 'horizontal'
  | 'vertical'
  | 'diagonal-down'
  | 'diagonal-up'
  | 'elbow';

export type BadgeVariant = 'pill' | 'tag' | 'status' | 'counter';
export type TabsVariant = 'boxed' | 'underlined' | 'pills';
export type ProgressVariant = 'bar' | 'slider';
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface TableColumn {
  title: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NodeMeta {
  variant?: 'primary' | 'secondary';
  checked?: boolean;
  action?: string;
  binding?: string;
  layoutRule?: string;
  transitionTarget?: string;
  borderStyle?: ContainerBorderStyle;
  lineEnding?: LineEnding;
  lineStyle?: LineStyle;
  lineDirection?: LineDirection;
  // Tabs & Navigation
  tabs?: string[];
  activeTabIndex?: number;
  tabsVariant?: TabsVariant;
  breadcrumbItems?: string[];
  // Progress & Slider
  progressValue?: number; // 0 to 100
  progressMax?: number;
  progressVariant?: ProgressVariant;
  // Badge & Tag
  badgeVariant?: BadgeVariant;
  // Table
  tableColumns?: TableColumn[];
  tableRows?: string[][];
  // Alert
  alertVariant?: AlertVariant;
}

export interface ArtboardScreen {
  id: string;
  name: string;
  screenConfigId: string;
  orientation: 'portrait' | 'landscape';
  nodes: SceneNode[];
}

export interface SceneNode {
  id: string;
  type: WidgetType;
  rect: Rect;
  zIndex: number;
  label?: string;
  meta?: NodeMeta;
  children?: SceneNode[];
}

export type DeviceCategory =
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'watch'
  | 'custom'
  | 'auto';

export interface ScreenConfig {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number;
  height: number;
  orientation?: 'portrait' | 'landscape';
}

export const SCREEN_PRESETS: ScreenConfig[] = [
  {
    id: 'mobile-standard',
    name: 'Phone (Standard - 32×30)',
    category: 'mobile',
    width: 32,
    height: 30,
    orientation: 'portrait',
  },
  {
    id: 'mobile-compact',
    name: 'Phone (Compact - 28×24)',
    category: 'mobile',
    width: 28,
    height: 24,
    orientation: 'portrait',
  },
  {
    id: 'mobile-large',
    name: 'Phone (Max - 36×34)',
    category: 'mobile',
    width: 36,
    height: 34,
    orientation: 'portrait',
  },
  {
    id: 'tablet-portrait',
    name: 'Tablet Portrait (48×36)',
    category: 'tablet',
    width: 48,
    height: 36,
    orientation: 'portrait',
  },
  {
    id: 'tablet-landscape',
    name: 'Tablet Landscape (64×36)',
    category: 'tablet',
    width: 64,
    height: 36,
    orientation: 'landscape',
  },
  {
    id: 'desktop-compact',
    name: 'Web App - Laptop (72×28)',
    category: 'desktop',
    width: 72,
    height: 28,
    orientation: 'landscape',
  },
  {
    id: 'desktop-standard',
    name: 'Web App - Desktop 1080p (84×34)',
    category: 'desktop',
    width: 84,
    height: 34,
    orientation: 'landscape',
  },
  {
    id: 'desktop-wide',
    name: 'Web App - Ultrawide (96×40)',
    category: 'desktop',
    width: 96,
    height: 40,
    orientation: 'landscape',
  },
  {
    id: 'watch-compact',
    name: 'Smartwatch (20×14)',
    category: 'watch',
    width: 20,
    height: 14,
    orientation: 'portrait',
  },
];
