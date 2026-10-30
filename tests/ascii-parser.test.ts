import { describe, it, expect } from 'vitest';
import { parseAsciiToNodes } from '../src/core/serializer/ascii-to-ast.js';

describe('Reverse ASCII Parser Suite', () => {
  it('parses ASCII container box with title and buttons', () => {
    const ascii = [
      '┌── User Login ──┐',
      '│ [ Text...    ] │',
      '│ [x] Remember   │',
      '│ [# Submit #]   │',
      '└────────────────┘',
    ].join('\n');

    const nodes = parseAsciiToNodes(ascii);
    expect(nodes.length).toBeGreaterThanOrEqual(3);

    const container = nodes.find((n) => n.type === 'container');
    expect(container).toBeDefined();
    expect(container?.label).toBe('User Login');
    expect(container?.rect.h).toBe(5);

    const btn = nodes.find((n) => n.type === 'button');
    expect(btn).toBeDefined();
    expect(btn?.label).toBe('Submit');
    expect(btn?.meta?.variant).toBe('primary');

    const chk = nodes.find((n) => n.type === 'checkbox');
    expect(chk).toBeDefined();
    expect(chk?.label).toBe('Remember');
    expect(chk?.meta?.checked).toBe(true);
  });

  it('parses toggles and dropdown selects', () => {
    const ascii = [
      '┌── Controls ────┐',
      '│ (─o) Dark Mode │',
      '│ [ Option A v ] │',
      '└────────────────┘',
    ].join('\n');

    const nodes = parseAsciiToNodes(ascii);
    const toggle = nodes.find((n) => n.type === 'toggle');
    expect(toggle).toBeDefined();
    expect(toggle?.label).toBe('Dark Mode');
    expect(toggle?.meta?.checked).toBe(true);

    const select = nodes.find((n) => n.type === 'select');
    expect(select).toBeDefined();
    expect(select?.label).toBe('Option A');
  });
});
