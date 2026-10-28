import {
  SceneNode,
  BadgeVariant,
  ProgressVariant,
  AlertVariant,
} from '../ast/types.js';
import { CharGrid } from './char-grid.js';

export function stampBadge(grid: CharGrid, node: SceneNode): void {
  const variant: BadgeVariant = node.meta?.badgeVariant ?? 'tag';
  const label = node.label ?? '';
  let str: string;

  switch (variant) {
    case 'pill':
      str = `( ${label} )`;
      break;
    case 'status':
      str = label ? `(*) ${label}` : '(*)';
      break;
    case 'counter':
      str = `( ${label} )`;
      break;
    case 'tag':
    default:
      str = `< ${label} >`;
      break;
  }

  const maxWidth = node.rect.w > 0 ? node.rect.w : undefined;
  grid.writeText(node.rect.x, node.rect.y, str, maxWidth);
}

export function stampProgress(grid: CharGrid, node: SceneNode): void {
  const rawValue = node.meta?.progressValue ?? 50;
  const max = Math.max(1, node.meta?.progressMax ?? 100);
  const clampedValue = Math.max(0, Math.min(rawValue, max));
  const pct = Math.round((clampedValue / max) * 100);

  const variant: ProgressVariant = node.meta?.progressVariant ?? 'bar';
  const suffix =
    node.label !== undefined && node.label.length > 0
      ? node.label
      : `${pct}%`;
  const suffixWithSpace = suffix.length > 0 ? ` ${suffix}` : '';

  let fullStr: string;

  if (variant === 'slider') {
    const knob = '(o)';
    const trackLen =
      node.rect.w > 0
        ? Math.max(3, node.rect.w - suffixWithSpace.length)
        : 20;
    const availDashes = Math.max(0, trackLen - 3);
    const knobOffset = Math.round((pct / 100) * availDashes);
    const leftDashes = '─'.repeat(knobOffset);
    const rightDashes = '─'.repeat(availDashes - knobOffset);
    fullStr = `${leftDashes}${knob}${rightDashes}${suffixWithSpace}`;
  } else {
    // 'bar' variant
    const innerTrackLen =
      node.rect.w > 0
        ? Math.max(1, node.rect.w - 2 - suffixWithSpace.length)
        : 20;
    const fillLen = Math.round((pct / 100) * innerTrackLen);

    let inner: string;
    if (fillLen <= 0) {
      inner = '-'.repeat(innerTrackLen);
    } else {
      const equalsCount = Math.max(0, fillLen - 1);
      const dashesCount = Math.max(0, innerTrackLen - fillLen);
      inner = `${'='.repeat(equalsCount)}>${'-'.repeat(dashesCount)}`;
    }
    fullStr = `[${inner}]${suffixWithSpace}`;
  }

  const maxWidth = node.rect.w > 0 ? node.rect.w : undefined;
  grid.writeText(node.rect.x, node.rect.y, fullStr, maxWidth);
}

function getAlertIcon(variant: AlertVariant): string {
  switch (variant) {
    case 'info':
      return '[i]';
    case 'success':
      return '[v]';
    case 'warning':
      return '[!]';
    case 'danger':
      return '[x]';
    default:
      return '[i]';
  }
}

function getAlertTitle(variant: AlertVariant): string {
  switch (variant) {
    case 'info':
      return 'Info';
    case 'success':
      return 'Success';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'Danger';
    default:
      return 'Info';
  }
}

export function stampAlert(grid: CharGrid, node: SceneNode): void {
  const variant: AlertVariant = node.meta?.alertVariant ?? 'info';
  const icon = getAlertIcon(variant);
  const variantTitle = getAlertTitle(variant);
  const label = node.label ?? '';

  if (node.rect.h >= 3 && node.rect.w >= 10) {
    // Multi-line bordered alert box
    const title = `${icon} ${variantTitle}`;
    grid.drawBox(node.rect, title, node.meta?.borderStyle ?? 'single');

    if (label.trim().length > 0) {
      const lines = label.split('\n');
      const maxLines = node.rect.h - 2;
      for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
        grid.writeText(
          node.rect.x + 2,
          node.rect.y + 1 + i,
          lines[i],
          Math.max(0, node.rect.w - 4)
        );
      }
    }
  } else {
    // Single-line banner alert
    const left =
      label.trim().length > 0
        ? `${icon} ${variantTitle}: ${label}`
        : `${icon} ${variantTitle}`;
    const right = '[x]';

    let str: string;
    if (node.rect.w > 0) {
      if (node.rect.w >= left.length + right.length) {
        const spaces = ' '.repeat(node.rect.w - left.length - right.length);
        str = `${left}${spaces}${right}`;
      } else if (node.rect.w > right.length + 1) {
        const truncatedLeft = left.slice(0, node.rect.w - right.length - 1);
        str = `${truncatedLeft} ${right}`;
      } else {
        str = left;
      }
    } else {
      str = `${left}  ${right}`;
    }

    const maxWidth = node.rect.w > 0 ? node.rect.w : undefined;
    grid.writeText(node.rect.x, node.rect.y, str, maxWidth);
  }
}
