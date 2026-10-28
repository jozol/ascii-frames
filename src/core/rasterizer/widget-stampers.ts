import { SceneNode } from '../ast/types.js';
import {
  NORTH,
  EAST,
  SOUTH,
  WEST,
} from './bitmask-junctions.js';
import { CharGrid } from './char-grid.js';
import {
  stampBadge,
  stampProgress,
  stampAlert,
} from './stampers-feedback.js';

export { stampBadge, stampProgress, stampAlert };
import {
  stampTabs,
  stampBreadcrumbs,
  stampTable,
} from './stampers-nav-data.js';
export { stampTabs, stampBreadcrumbs, stampTable };

export function stampContainer(grid: CharGrid, node: SceneNode): void {
  grid.drawBox(node.rect, node.label, node.meta?.borderStyle ?? 'single');
}

export function stampButton(grid: CharGrid, node: SceneNode): void {
  const isPrimary = node.meta?.variant === 'primary';
  const label = node.label ?? '';
  let str: string;

  if (isPrimary) {
    const minLen = label.length + 6; // '[# ' + label + ' #]'
    if (node.rect.w > minLen) {
      const extra = node.rect.w - 4 - label.length;
      const padLeft = Math.floor(extra / 2);
      const padRight = extra - padLeft;
      str = `[#${' '.repeat(padLeft)}${label}${' '.repeat(padRight)}#]`;
    } else {
      str = `[# ${label} #]`;
    }
  } else {
    const minLen = label.length + 4; // '[ ' + label + ' ]'
    if (node.rect.w > minLen) {
      const extra = node.rect.w - 2 - label.length;
      const padLeft = Math.floor(extra / 2);
      const padRight = extra - padLeft;
      str = `[${' '.repeat(padLeft)}${label}${' '.repeat(padRight)}]`;
    } else {
      str = `[ ${label} ]`;
    }
  }

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampInput(grid: CharGrid, node: SceneNode): void {
  const text = node.label ?? '';
  let str: string;

  if (node.rect.w > 0) {
    const innerSpace = node.rect.w - 2;
    if (innerSpace <= 0) {
      str = '[]';
    } else if (text.length >= innerSpace) {
      str = `[${text.slice(0, innerSpace)}]`;
    } else {
      const inner = (' ' + text).padEnd(innerSpace, ' ');
      str = `[${inner}]`;
    }
  } else {
    str = `[ ${text} ]`;
  }

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampSelect(grid: CharGrid, node: SceneNode): void {
  const value = node.label ?? '';
  let str: string;

  if (node.rect.w > 0) {
    const innerSpace = node.rect.w - 2;
    const prefix = ` ${value}`;
    const suffix = ' v ';
    if (prefix.length + suffix.length <= innerSpace) {
      const spaces = ' '.repeat(innerSpace - prefix.length - suffix.length);
      str = `[${prefix}${spaces}${suffix}]`;
    } else if (value.length + 5 <= innerSpace) {
      str = `[ ${value} v ]`;
    } else {
      str = `[${value.slice(0, Math.max(0, innerSpace - 4))} v ]`;
    }
  } else {
    str = `[ ${value} v ]`;
  }

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampCheckbox(grid: CharGrid, node: SceneNode): void {
  const isChecked = Boolean(node.meta?.checked);
  const box = isChecked ? '[x]' : '[ ]';
  const label = node.label ? ` ${node.label}` : '';
  const str = `${box}${label}`;

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampRadio(grid: CharGrid, node: SceneNode): void {
  const isChecked = Boolean(node.meta?.checked);
  const bullet = isChecked ? '(•)' : '( )';
  const label = node.label ? ` ${node.label}` : '';
  const str = `${bullet}${label}`;

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampToggle(grid: CharGrid, node: SceneNode): void {
  const isOn = Boolean(node.meta?.checked);
  const toggle = isOn ? '(─o)' : '(o─)';
  const label = node.label ? ` ${node.label}` : '';
  const str = `${toggle}${label}`;

  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampText(grid: CharGrid, node: SceneNode): void {
  const str = node.label ?? '';
  grid.writeText(
    node.rect.x,
    node.rect.y,
    str,
    node.rect.w > 0 ? node.rect.w : undefined
  );
}

export function stampDivider(grid: CharGrid, node: SceneNode): void {
  const y = node.rect.y;
  const x0 = node.rect.x;
  const x1 = node.rect.x + node.rect.w - 1;

  for (let x = x0; x <= x1; x++) {
    const curMask = grid.getMask(x, y);
    const hasVertical = (curMask & (NORTH | SOUTH)) !== 0;

    let segmentMask = EAST | WEST;
    if (x === x0 && hasVertical) {
      segmentMask = EAST;
    } else if (x === x1 && hasVertical) {
      segmentMask = WEST;
    }

    grid.addBorderSegment(x, y, segmentMask);
  }
}

export function stampCircle(grid: CharGrid, node: SceneNode): void {
  const { x, y, w, h } = node.rect;
  const label = node.label ?? '';

  if (h <= 0 || w <= 0) return;

  if (h === 1) {
    // Compact 1-line badge/avatar: ( Label ) or (@)
    let str: string;
    if (w <= 2) {
      str = '()';
    } else if (label.length === 0) {
      str = `(${' '.repeat(w - 2)})`;
    } else {
      const inner = w - 2;
      const centered =
        label.length > inner
          ? label.slice(0, inner)
          : label
              .padStart(Math.floor((inner + label.length) / 2), ' ')
              .padEnd(inner, ' ');
      str = `(${centered})`;
    }
    grid.writeText(x, y, str, w);
    return;
  }

  if (h === 2) {
    const inner = Math.max(0, w - 2);
    const centered =
      label.length > inner
        ? label.slice(0, inner)
        : label
            .padStart(Math.floor((inner + label.length) / 2), ' ')
            .padEnd(inner, ' ');
    grid.writeText(x, y, `(${centered})`, w);
    grid.writeText(x, y + 1, `(${' '.repeat(inner)})`, w);
    return;
  }

  // h >= 3: Rounded container / oval / circle
  if (w >= 6 && h >= 4) {
    // Tapered rounded circle
    const topInner = Math.max(1, w - 4);
    const topStr = ` ╭${'─'.repeat(topInner)}╮ `;
    grid.writeText(x, y, topStr, w);

    const botStr = ` ╰${'─'.repeat(topInner)}╯ `;
    grid.writeText(x, y + h - 1, botStr, w);

    const midRow = y + Math.floor(h / 2);
    for (let r = y + 1; r < y + h - 1; r++) {
      grid.setChar(x, r, '│');
      grid.setChar(x + w - 1, r, '│');
      if (r === midRow && label.trim().length > 0) {
        const innerW = w - 2;
        const trimmed = label.trim();
        const display = trimmed.length > innerW ? trimmed.slice(0, innerW) : trimmed;
        const padL = Math.floor((innerW - display.length) / 2);
        grid.writeText(x + 1 + padL, r, display);
      }
    }
  } else {
    // Standard 3x3 or compact rounded box
    const innerW = Math.max(1, w - 2);
    grid.writeText(x, y, `╭${'─'.repeat(innerW)}╮`, w);
    grid.writeText(x, y + h - 1, `╰${'─'.repeat(innerW)}╯`, w);

    const midRow = y + Math.floor(h / 2);
    for (let r = y + 1; r < y + h - 1; r++) {
      grid.setChar(x, r, '│');
      grid.setChar(x + w - 1, r, '│');
      if (r === midRow && label.trim().length > 0) {
        const trimmed = label.trim();
        const display = trimmed.length > innerW ? trimmed.slice(0, innerW) : trimmed;
        const padL = Math.floor((innerW - display.length) / 2);
        grid.writeText(x + 1 + padL, r, display);
      }
    }
  }
}

export function stampLine(grid: CharGrid, node: SceneNode): void {
  const { x, y, w, h } = node.rect;
  const label = node.label ?? '';
  const ending = node.meta?.lineEnding ?? 'arrow';
  const direction = node.meta?.lineDirection;

  if (w <= 0 || h <= 0) return;

  // 1. Diagonal Line Up: Bottom-Left to Top-Right
  if (direction === 'diagonal-up') {
    for (let i = 0; i < Math.max(w, h); i++) {
      const px = x + Math.round((i / Math.max(w - 1, 1)) * (w - 1));
      const py = y + (h - 1) - Math.round((i / Math.max(w - 1, 1)) * (h - 1));
      grid.setChar(px, py, '/');
    }
    if (label) {
      grid.writeText(x + Math.floor(w / 2), y + Math.floor(h / 2) - 1, label);
    }
    return;
  }

  // 2. Diagonal Line Down: Top-Left to Bottom-Right
  if (direction === 'diagonal-down') {
    for (let i = 0; i < Math.max(w, h); i++) {
      const px = x + Math.round((i / Math.max(w - 1, 1)) * (w - 1));
      const py = y + Math.round((i / Math.max(w - 1, 1)) * (h - 1));
      grid.setChar(px, py, '\\');
    }
    if (label) {
      grid.writeText(x + Math.floor(w / 2), y + Math.floor(h / 2) - 1, label);
    }
    return;
  }

  // 3. Elbow / Orthogonal Connector
  if (direction === 'elbow' && w > 1 && h > 1) {
    for (let cx = x; cx < x + w - 1; cx++) {
      grid.setChar(cx, y, '─');
    }
    grid.setChar(x + w - 1, y, '┐');
    for (let cy = y + 1; cy < y + h - 1; cy++) {
      grid.setChar(x + w - 1, cy, '│');
    }
    const endChar = ending === 'arrow' || ending === 'both' ? '▼' : '│';
    grid.setChar(x + w - 1, y + h - 1, endChar);
    if (label) {
      grid.writeText(x + 1, y, ` ${label} `);
    }
    return;
  }

  // 4. Vertical Line
  if (w === 1 || (h > w && direction !== 'horizontal')) {
    const startChar = ending === 'both' ? '▲' : '│';
    const endChar = ending === 'arrow' || ending === 'both' ? '▼' : '│';
    grid.setChar(x, y, startChar);
    for (let cy = y + 1; cy < y + h - 1; cy++) {
      grid.setChar(x, cy, '│');
    }
    if (h > 1) {
      grid.setChar(x, y + h - 1, endChar);
    }
    if (label && h >= 3) {
      grid.writeText(x + 2, y + Math.floor(h / 2), label);
    }
    return;
  }

  // 5. Horizontal Line (Default)
  const startChar = ending === 'both' ? '◄' : '─';
  const endChar = ending === 'arrow' || ending === 'both' ? '►' : '─';

  if (w === 1) {
    grid.setChar(x, y, endChar);
    return;
  }

  if (label && label.trim().length > 0 && w >= label.trim().length + 4) {
    const trimmed = label.trim();
    const remain = w - 2 - (trimmed.length + 2);
    const leftPad = Math.floor(remain / 2);
    const rightPad = remain - leftPad;
    const str = `${startChar}${'─'.repeat(Math.max(0, leftPad))} ${trimmed} ${'─'.repeat(Math.max(0, rightPad))}${endChar}`;
    grid.writeText(x, y, str, w);
  } else {
    const inner = Math.max(0, w - 2);
    const str = `${startChar}${'─'.repeat(inner)}${endChar}`;
    grid.writeText(x, y, str, w);
  }
}

export function stampNode(grid: CharGrid, node: SceneNode): void {
  switch (node.type) {
    case 'container':
      stampContainer(grid, node);
      break;
    case 'circle':
      stampCircle(grid, node);
      break;
    case 'line':
      stampLine(grid, node);
      break;
    case 'button':
      stampButton(grid, node);
      break;
    case 'input':
      stampInput(grid, node);
      break;
    case 'select':
      stampSelect(grid, node);
      break;
    case 'checkbox':
      stampCheckbox(grid, node);
      break;
    case 'radio':
      stampRadio(grid, node);
      break;
    case 'toggle':
      stampToggle(grid, node);
      break;
    case 'text':
      stampText(grid, node);
      break;
    case 'divider':
      stampDivider(grid, node);
      break;
    case 'tabs':
      stampTabs(grid, node);
      break;
    case 'breadcrumbs':
      stampBreadcrumbs(grid, node);
      break;
    case 'table':
      stampTable(grid, node);
      break;
    case 'badge':
      stampBadge(grid, node);
      break;
    case 'progress':
      stampProgress(grid, node);
      break;
    case 'alert':
      stampAlert(grid, node);
      break;
  }
}

export function flattenNodes(nodes: SceneNode | SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];
  function visit(n: SceneNode) {
    result.push(n);
    if (n.children) {
      for (const child of n.children) {
        visit(child);
      }
    }
  }
  if (Array.isArray(nodes)) {
    for (const n of nodes) visit(n);
  } else {
    visit(nodes);
  }
  return result;
}

export function rasterizeScene(
  nodes: SceneNode | SceneNode[],
  explicitWidth?: number,
  explicitHeight?: number
): CharGrid {
  const allNodes = flattenNodes(nodes);

  let w = explicitWidth ?? 0;
  let h = explicitHeight ?? 0;

  if (w <= 0 || h <= 0) {
    for (const n of allNodes) {
      w = Math.max(w, n.rect.x + n.rect.w);
      h = Math.max(h, n.rect.y + n.rect.h);
    }
    w = Math.max(w, 3);
    h = Math.max(h, 3);
  }

  const sorted = [...allNodes].sort((a, b) => {
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    if (a.type === 'container' && b.type !== 'container') return -1;
    if (a.type !== 'container' && b.type === 'container') return 1;
    return 0;
  });

  const grid = new CharGrid(w, h);
  for (const node of sorted) {
    stampNode(grid, node);
  }

  return grid;
}
