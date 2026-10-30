import { describe, it, expect } from 'vitest';
import { SceneNode } from '../src/core/ast/types.js';
import { reflowStackContainer, applyStackLayout } from '../src/core/ast/mutations.js';

describe('Auto-Layout Stack Engine Suite', () => {
  it('arranges children in vertical stack with discrete gap', () => {
    const container: SceneNode = {
      id: 'frame-1',
      type: 'container',
      rect: { x: 5, y: 5, w: 20, h: 20 },
      zIndex: 0,
      meta: {
        layoutStack: 'vertical',
        stackGap: 2,
        stackPadding: 1,
      },
      children: [
        { id: 'c1', type: 'button', rect: { x: 0, y: 0, w: 10, h: 1 }, zIndex: 1 },
        { id: 'c2', type: 'input', rect: { x: 0, y: 0, w: 12, h: 1 }, zIndex: 1 },
        { id: 'c3', type: 'button', rect: { x: 0, y: 0, w: 8, h: 1 }, zIndex: 1 },
      ],
    };

    const reflowed = reflowStackContainer(container);
    const children = reflowed.children!;

    // Child 1 starts at container.y + padding = 5 + 1 = 6
    expect(children[0].rect.x).toBe(6);
    expect(children[0].rect.y).toBe(6);

    // Child 2 starts at child1.y + child1.h + gap = 6 + 1 + 2 = 9
    expect(children[1].rect.x).toBe(6);
    expect(children[1].rect.y).toBe(9);

    // Child 3 starts at child2.y + child2.h + gap = 9 + 1 + 2 = 12
    expect(children[2].rect.x).toBe(6);
    expect(children[2].rect.y).toBe(12);
  });

  it('arranges children in horizontal stack and handles autoResizeContainer', () => {
    const container: SceneNode = {
      id: 'frame-h',
      type: 'container',
      rect: { x: 2, y: 2, w: 10, h: 6 },
      zIndex: 0,
      meta: {
        layoutStack: 'horizontal',
        stackGap: 1,
        stackPadding: 1,
        autoResizeContainer: true,
      },
      children: [
        { id: 'btn1', type: 'button', rect: { x: 0, y: 0, w: 6, h: 1 }, zIndex: 1 },
        { id: 'btn2', type: 'button', rect: { x: 0, y: 0, w: 8, h: 1 }, zIndex: 1 },
      ],
    };

    const reflowed = reflowStackContainer(container);
    const children = reflowed.children!;

    // btn1 at 2 + 1 = 3
    expect(children[0].rect.x).toBe(3);
    expect(children[0].rect.y).toBe(3);

    // btn2 at 3 + 6 + 1 = 10
    expect(children[1].rect.x).toBe(10);
    expect(children[1].rect.y).toBe(3);

    // autoResizeContainer expands width to accommodate: 1 + 6 + 1 + 8 + 1 = 17
    expect(reflowed.rect.w).toBeGreaterThanOrEqual(17);
  });

  it('applies stack layout to nested container in AST tree', () => {
    const tree: SceneNode[] = [
      {
        id: 'root-card',
        type: 'container',
        rect: { x: 0, y: 0, w: 30, h: 15 },
        zIndex: 0,
        meta: {
          layoutStack: 'vertical',
          stackGap: 1,
          stackPadding: 1,
        },
        children: [
          { id: 'item-1', type: 'text', rect: { x: 99, y: 99, w: 10, h: 1 }, zIndex: 1 },
          { id: 'item-2', type: 'text', rect: { x: 99, y: 99, w: 10, h: 1 }, zIndex: 1 },
        ],
      },
    ];

    const result = applyStackLayout(tree, 'root-card');
    expect(result[0].children![0].rect.y).toBe(1);
    expect(result[0].children![1].rect.y).toBe(3);
  });
});
