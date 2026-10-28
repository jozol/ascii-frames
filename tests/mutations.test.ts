import { describe, it, expect } from 'vitest';
import { SceneNode } from '../src/core/ast/types.js';
import {
  addNode,
  updateNode,
  removeNode,
  moveNode,
  resizeNode,
  findNode,
  findNodeAt,
  duplicateNode,
  reorderNode,
  alignNodes,
  distributeNodes,
  moveNodes,
  removeNodes,
  findNodesInRect,
} from '../src/core/ast/mutations.js';

describe('AST Mutation Functions', () => {
  const initialNodes: SceneNode[] = [
    {
      id: 'container-1',
      type: 'container',
      rect: { x: 0, y: 0, w: 20, h: 10 },
      zIndex: 0,
      label: 'Main Box',
      children: [
        {
          id: 'btn-1',
          type: 'button',
          rect: { x: 2, y: 2, w: 10, h: 1 },
          zIndex: 1,
          label: 'Submit',
        },
      ],
    },
  ];

  it('finds node by id', () => {
    expect(findNode(initialNodes, 'container-1')?.label).toBe('Main Box');
    expect(findNode(initialNodes, 'btn-1')?.label).toBe('Submit');
    expect(findNode(initialNodes, 'unknown')).toBeUndefined();
  });

  it('finds topmost node at discrete coordinate (x, y)', () => {
    // Coordinate (2, 2) is inside both container-1 and btn-1 -> btn-1 is topmost
    const hitBtn = findNodeAt(initialNodes, 2, 2);
    expect(hitBtn?.id).toBe('btn-1');

    // Coordinate (0, 0) is only on container-1 border
    const hitContainer = findNodeAt(initialNodes, 0, 0);
    expect(hitContainer?.id).toBe('container-1');

    // Coordinate (50, 50) is empty
    expect(findNodeAt(initialNodes, 50, 50)).toBeUndefined();
  });

  it('moves node with discrete integer clamping to 0 and cascades to children', () => {
    const moved = moveNode(initialNodes, 'container-1', 3, 2, true);
    const container = findNode(moved, 'container-1');
    const childBtn = findNode(moved, 'btn-1');

    // Container moved from (0, 0) to (3, 2)
    expect(container?.rect.x).toBe(3);
    expect(container?.rect.y).toBe(2);

    // Child button cascaded from (2, 2) to (5, 4)
    expect(childBtn?.rect.x).toBe(5);
    expect(childBtn?.rect.y).toBe(4);
  });

  it('adds node to root and to children', () => {
    const newBtn: SceneNode = {
      id: 'btn-2',
      type: 'button',
      rect: { x: 2, y: 4, w: 8, h: 1 },
      zIndex: 1,
      label: 'Cancel',
    };

    // Add to container child
    const withChild = addNode(initialNodes, newBtn, 'container-1');
    expect(withChild[0].children?.length).toBe(2);
    expect(withChild[0].children?.[1].id).toBe('btn-2');

    // Add to root
    const newContainer: SceneNode = {
      id: 'container-2',
      type: 'container',
      rect: { x: 20, y: 0, w: 10, h: 10 },
      zIndex: 0,
    };
    const withRoot = addNode(initialNodes, newContainer);
    expect(withRoot.length).toBe(2);
    expect(withRoot[1].id).toBe('container-2');
  });

  it('updates node properties and preserves children', () => {
    const updated = updateNode(initialNodes, 'btn-1', {
      label: 'Save Changes',
      meta: { variant: 'primary' },
    });
    const found = findNode(updated, 'btn-1');
    expect(found?.label).toBe('Save Changes');
    expect(found?.meta?.variant).toBe('primary');
  });

  it('removes node from root or child', () => {
    const removedChild = removeNode(initialNodes, 'btn-1');
    expect(removedChild[0].children?.length).toBe(0);

    const removedRoot = removeNode(initialNodes, 'container-1');
    expect(removedRoot.length).toBe(0);
  });

  it('moves node with discrete integer clamping to 0', () => {
    const moved = moveNode(initialNodes, 'btn-1', 3, 2);
    const found = findNode(moved, 'btn-1');
    expect(found?.rect.x).toBe(5);
    expect(found?.rect.y).toBe(4);

    // Negative move clamps to 0
    const clamped = moveNode(initialNodes, 'btn-1', -10, -10);
    const foundClamped = findNode(clamped, 'btn-1');
    expect(foundClamped?.rect.x).toBe(0);
    expect(foundClamped?.rect.y).toBe(0);
  });

  it('resizes node and enforces minimum container size w >= 3, h >= 3', () => {
    // Container resized below minimum is clamped to w=3, h=3
    const shrunkContainer = resizeNode(initialNodes, 'container-1', -19, -9);
    const container = findNode(shrunkContainer, 'container-1');
    expect(container?.rect.w).toBe(3);
    expect(container?.rect.h).toBe(3);

    // Button resized below 1 is clamped to 1
    const shrunkBtn = resizeNode(initialNodes, 'btn-1', -20, -5);
    const btn = findNode(shrunkBtn, 'btn-1');
    expect(btn?.rect.w).toBe(1);
    expect(btn?.rect.h).toBe(1);
  });

  it('duplicates node with offset and fresh unique IDs', () => {
    const dupResult = duplicateNode(initialNodes, 'btn-1', { dx: 3, dy: 3 });
    expect(dupResult).toBeDefined();
    const { nodes: withDup, newId } = dupResult!;

    expect(newId).not.toBe('btn-1');
    const original = findNode(withDup, 'btn-1');
    const duplicate = findNode(withDup, newId);

    expect(original).toBeDefined();
    expect(duplicate).toBeDefined();
    expect(duplicate?.label).toBe(original?.label);
    expect(duplicate?.rect.x).toBe(original!.rect.x + 3);
    expect(duplicate?.rect.y).toBe(original!.rect.y + 3);
  });

  it('reorders node zIndex: forward, backward, front, back', () => {
    const fwd = reorderNode(initialNodes, 'btn-1', 'forward');
    expect(findNode(fwd, 'btn-1')?.zIndex).toBe(2);

    const bwd = reorderNode(fwd, 'btn-1', 'backward');
    expect(findNode(bwd, 'btn-1')?.zIndex).toBe(1);

    const front = reorderNode(initialNodes, 'container-1', 'front');
    expect(findNode(front, 'container-1')?.zIndex).toBe(2);

    const back = reorderNode(front, 'container-1', 'back');
    expect(findNode(back, 'container-1')?.zIndex).toBe(0);
  });

  it('aligns multiple nodes: left, center, right, top, middle, bottom', () => {
    const testNodes: SceneNode[] = [
      { id: 'b1', type: 'button', rect: { x: 5, y: 10, w: 10, h: 2 }, zIndex: 1 },
      { id: 'b2', type: 'button', rect: { x: 20, y: 15, w: 6, h: 2 }, zIndex: 1 },
      { id: 'b3', type: 'button', rect: { x: 12, y: 25, w: 8, h: 2 }, zIndex: 1 },
    ];
    // Collective bounding box:
    // minX = 5, maxX = 26 (20 + 6), W = 21
    // minY = 10, maxY = 27 (25 + 2), H = 17

    // Align Left
    const alignedLeft = alignNodes(testNodes, ['b1', 'b2', 'b3'], 'left');
    expect(findNode(alignedLeft, 'b1')?.rect.x).toBe(5);
    expect(findNode(alignedLeft, 'b2')?.rect.x).toBe(5);
    expect(findNode(alignedLeft, 'b3')?.rect.x).toBe(5);

    // Align Right (maxX = 26)
    const alignedRight = alignNodes(testNodes, ['b1', 'b2', 'b3'], 'right');
    expect(findNode(alignedRight, 'b1')?.rect.x).toBe(26 - 10); // 16
    expect(findNode(alignedRight, 'b2')?.rect.x).toBe(26 - 6);  // 20
    expect(findNode(alignedRight, 'b3')?.rect.x).toBe(26 - 8);  // 18

    // Align Center (minX = 5, W = 21 -> center = 5 + (21 - w)/2)
    const alignedCenter = alignNodes(testNodes, ['b1', 'b2', 'b3'], 'center');
    expect(findNode(alignedCenter, 'b1')?.rect.x).toBe(Math.round(5 + (21 - 10) / 2)); // 11
    expect(findNode(alignedCenter, 'b2')?.rect.x).toBe(Math.round(5 + (21 - 6) / 2));  // 13

    // Align Top (minY = 10)
    const alignedTop = alignNodes(testNodes, ['b1', 'b2', 'b3'], 'top');
    expect(findNode(alignedTop, 'b1')?.rect.y).toBe(10);
    expect(findNode(alignedTop, 'b2')?.rect.y).toBe(10);
    expect(findNode(alignedTop, 'b3')?.rect.y).toBe(10);

    // Align Bottom (maxY = 27)
    const alignedBottom = alignNodes(testNodes, ['b1', 'b2', 'b3'], 'bottom');
    expect(findNode(alignedBottom, 'b1')?.rect.y).toBe(25); // 27 - 2
    expect(findNode(alignedBottom, 'b2')?.rect.y).toBe(25);

    // Align relative to reference container rect { x: 0, y: 0, w: 40, h: 30 }
    const refRect = { x: 0, y: 0, w: 40, h: 30 };
    const alignedRefCenter = alignNodes(testNodes, ['b1'], 'center', refRect);
    expect(findNode(alignedRefCenter, 'b1')?.rect.x).toBe(Math.round((40 - 10) / 2)); // 15
  });

  it('distributes nodes evenly along horizontal and vertical axes', () => {
    const hNodes: SceneNode[] = [
      { id: 'b1', type: 'button', rect: { x: 0, y: 0, w: 4, h: 1 }, zIndex: 1 },
      { id: 'b2', type: 'button', rect: { x: 5, y: 0, w: 4, h: 1 }, zIndex: 1 },
      { id: 'b3', type: 'button', rect: { x: 20, y: 0, w: 4, h: 1 }, zIndex: 1 },
    ];
    // first at x=0 (w=4), last at x=20 (w=4).
    // span = 24 - 0 = 24. item widths = 12. total gap = 12. gap = 12 / 2 = 6.
    // b1 at 0, b2 should be at 0 + 4 + 6 = 10, b3 at 20.
    const distH = distributeNodes(hNodes, ['b1', 'b2', 'b3'], 'horizontal');
    expect(findNode(distH, 'b1')?.rect.x).toBe(0);
    expect(findNode(distH, 'b2')?.rect.x).toBe(10);
    expect(findNode(distH, 'b3')?.rect.x).toBe(20);

    const vNodes: SceneNode[] = [
      { id: 'v1', type: 'button', rect: { x: 0, y: 2, w: 10, h: 2 }, zIndex: 1 },
      { id: 'v2', type: 'button', rect: { x: 0, y: 6, w: 10, h: 2 }, zIndex: 1 },
      { id: 'v3', type: 'button', rect: { x: 0, y: 16, w: 10, h: 2 }, zIndex: 1 },
    ];
    // v1 at y=2 (h=2), v3 at y=16 (h=2).
    // span = 18 - 2 = 16. item heights = 6. total gap = 10. gap = 5.
    // v1 at 2, v2 should be at 2 + 2 + 5 = 9, v3 at 16.
    const distV = distributeNodes(vNodes, ['v1', 'v2', 'v3'], 'vertical');
    expect(findNode(distV, 'v1')?.rect.y).toBe(2);
    expect(findNode(distV, 'v2')?.rect.y).toBe(9);
    expect(findNode(distV, 'v3')?.rect.y).toBe(16);
  });

  it('batch moves and removes nodes', () => {
    const nodes: SceneNode[] = [
      { id: 'c1', type: 'container', rect: { x: 0, y: 0, w: 20, h: 10 }, zIndex: 0, children: [
        { id: 'c1-b1', type: 'button', rect: { x: 2, y: 2, w: 6, h: 1 }, zIndex: 1 }
      ]},
      { id: 'b2', type: 'button', rect: { x: 25, y: 5, w: 8, h: 1 }, zIndex: 1 },
    ];

    // Batch move: c1 and b2
    const moved = moveNodes(nodes, ['c1', 'b2'], 3, 2);
    expect(findNode(moved, 'c1')?.rect.x).toBe(3);
    expect(findNode(moved, 'c1-b1')?.rect.x).toBe(5); // cascaded
    expect(findNode(moved, 'b2')?.rect.x).toBe(28);

    // Batch remove: removes both c1 and b2
    const removed = removeNodes(nodes, ['c1', 'b2']);
    expect(removed.length).toBe(0);
  });

  it('finds nodes overlapping a rectangular selection box', () => {
    const nodes: SceneNode[] = [
      { id: 'n1', type: 'button', rect: { x: 2, y: 2, w: 6, h: 2 }, zIndex: 1 },
      { id: 'n2', type: 'button', rect: { x: 10, y: 2, w: 6, h: 2 }, zIndex: 1 },
      { id: 'n3', type: 'button', rect: { x: 20, y: 20, w: 6, h: 2 }, zIndex: 1 },
    ];

    // Selection box covering n1 and n2
    const found = findNodesInRect(nodes, { x: 0, y: 0, w: 18, h: 10 });
    const ids = found.map((n) => n.id);
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).not.toContain('n3');
  });
});
