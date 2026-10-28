import { SceneNode, TableColumn } from '../ast/types.js';
import { CharGrid } from './char-grid.js';

/**
 * Stamps tabs widget.
 * Variants:
 *  - 'boxed': [ Tab 1 ]  Tab 2  Tab 3
 *  - 'underlined': Row 0 has tab names, Row 1 (if h >= 2) has ────── under the active tab
 *  - 'pills': (• Tab 1 )  ( Tab 2 )  ( Tab 3 )
 */
export function stampTabs(grid: CharGrid, node: SceneNode): void {
  const tabs =
    node.meta?.tabs && node.meta.tabs.length > 0
      ? node.meta.tabs
      : ['Tab 1', 'Tab 2', 'Tab 3'];
  const activeTabIndex = node.meta?.activeTabIndex ?? 0;
  const variant = node.meta?.tabsVariant ?? 'boxed';
  const { x, y, w, h } = node.rect;
  const maxWidth = w > 0 ? w : undefined;

  if (variant === 'pills') {
    const str = tabs
      .map((tab, i) => (i === activeTabIndex ? `(• ${tab} )` : `( ${tab} )`))
      .join('  ');
    grid.writeText(x, y, str, maxWidth);
  } else if (variant === 'underlined') {
    // Row 0: tab names separated by 2 spaces
    const row0 = tabs.join('  ');
    grid.writeText(x, y, row0, maxWidth);

    // Row 1: underline under active tab (if h >= 2)
    if (h >= 2 && activeTabIndex >= 0 && activeTabIndex < tabs.length) {
      let offset = 0;
      for (let i = 0; i < activeTabIndex; i++) {
        offset += tabs[i].length + 2;
      }
      const activeTabLen = tabs[activeTabIndex].length;
      const underlineStr = '─'.repeat(activeTabLen);
      const underlineMaxW =
        maxWidth !== undefined ? Math.max(0, maxWidth - offset) : undefined;
      grid.writeText(x + offset, y + 1, underlineStr, underlineMaxW);
    }
  } else {
    // 'boxed' (default)
    const str = tabs
      .map((tab, i) => (i === activeTabIndex ? `[ ${tab} ]` : tab))
      .join('  ');
    grid.writeText(x, y, str, maxWidth);
  }
}

/**
 * Stamps breadcrumb navigation path.
 * Format: Home > Projects > Settings
 */
export function stampBreadcrumbs(grid: CharGrid, node: SceneNode): void {
  let items: string[] = [];

  if (node.meta?.breadcrumbItems && node.meta.breadcrumbItems.length > 0) {
    items = node.meta.breadcrumbItems;
  } else if (node.label && node.label.trim().length > 0) {
    if (node.label.includes('>')) {
      items = node.label
        .split('>')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (node.label.includes('/')) {
      items = node.label
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      items = [node.label.trim()];
    }
  }

  if (items.length === 0) {
    items = ['Home', 'Projects', 'Settings'];
  }

  const str = items.join(' > ');
  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

function formatCell(
  text: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
): string {
  if (width <= 0) return '';
  if (text.length >= width) {
    return text.slice(0, width);
  }

  if (align === 'right') {
    return (text + ' ').padStart(width, ' ');
  }

  if (align === 'center') {
    const extra = width - text.length;
    const padLeft = Math.floor(extra / 2);
    const padRight = extra - padLeft;
    return ' '.repeat(padLeft) + text + ' '.repeat(padRight);
  }

  // 'left' (default)
  return (' ' + text).padEnd(width, ' ');
}

/**
 * Stamps multi-column discrete table.
 * Top:      ┌──────┬──────────────┬──────────┐
 * Header:   │ ID   │ Name         │ Status   │
 * Divider:  ├──────┼──────────────┼──────────┤
 * Rows:     │ #101 │ John Doe     │ Active   │
 * Bottom:   └──────┴──────────────┴──────────┘
 */
export function stampTable(grid: CharGrid, node: SceneNode): void {
  const rawColumns: TableColumn[] =
    node.meta?.tableColumns && node.meta.tableColumns.length > 0
      ? node.meta.tableColumns
      : [
          { title: 'ID', width: 6 },
          { title: 'Name', width: 14 },
          { title: 'Status', width: 10 },
        ];

  const columns = rawColumns.map((col) => ({
    title: col.title ?? '',
    width:
      col.width && col.width > 0
        ? col.width
        : Math.max((col.title ?? '').length + 2, 6),
    align: col.align ?? 'left',
  }));

  const rows =
    node.meta?.tableRows !== undefined
      ? node.meta.tableRows
      : [
          ['#101', 'John Doe', 'Active'],
          ['#102', 'Jane Smith', 'Pending'],
        ];

  const topLine =
    '┌' + columns.map((c) => '─'.repeat(c.width)).join('┬') + '┐';
  const headerLine =
    '│' +
    columns.map((c) => formatCell(c.title, c.width, c.align)).join('│') +
    '│';
  const dividerLine =
    '├' + columns.map((c) => '─'.repeat(c.width)).join('┼') + '┤';
  const bottomLine =
    '└' + columns.map((c) => '─'.repeat(c.width)).join('┴') + '┘';

  const lines: string[] = [topLine, headerLine, dividerLine];
  for (const row of rows) {
    const rowLine =
      '│' +
      columns
        .map((c, i) => formatCell(row[i] ?? '', c.width, c.align))
        .join('│') +
      '│';
    lines.push(rowLine);
  }
  lines.push(bottomLine);

  const maxWidth = node.rect.w > 0 ? node.rect.w : undefined;
  for (let i = 0; i < lines.length; i++) {
    grid.writeText(node.rect.x, node.rect.y + i, lines[i], maxWidth);
  }
}
