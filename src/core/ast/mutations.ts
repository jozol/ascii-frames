import { SceneNode, Rect } from './types.js';

export function findNode(nodes: SceneNode[], id: string): SceneNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function addNode(
  nodes: SceneNode[],
  newNode: SceneNode,
  parentId?: string
): SceneNode[] {
  if (!parentId) {
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), newNode],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNode(node.children, newNode, parentId),
      };
    }
    return node;
  });
}

export function updateNode(
  nodes: SceneNode[],
  id: string,
  updates: Partial<SceneNode>
): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      const mergedRect = updates.rect
        ? { ...node.rect, ...updates.rect }
        : node.rect;

      if (node.type === 'container') {
        mergedRect.w = Math.max(3, mergedRect.w);
        mergedRect.h = Math.max(3, mergedRect.h);
      } else {
        mergedRect.w = Math.max(1, mergedRect.w);
        mergedRect.h = Math.max(1, mergedRect.h);
      }

      return {
        ...node,
        ...updates,
        rect: mergedRect,
        meta: updates.meta
          ? { ...node.meta, ...updates.meta }
          : node.meta,
      };
    }

    if (node.children) {
      return {
        ...node,
        children: updateNode(node.children, id, updates),
      };
    }

    return node;
  });
}

export function removeNode(nodes: SceneNode[], id: string): SceneNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: removeNode(node.children, id),
        };
      }
      return node;
    });
}

export function findNodeAt(
  nodes: SceneNode[],
  x: number,
  y: number
): SceneNode | undefined {
  const matches: { node: SceneNode; index: number }[] = [];
  let flatIndex = 0;

  function check(n: SceneNode) {
    const curIndex = flatIndex++;
    if (
      x >= n.rect.x &&
      x < n.rect.x + n.rect.w &&
      y >= n.rect.y &&
      y < n.rect.y + n.rect.h
    ) {
      matches.push({ node: n, index: curIndex });
    }
    if (n.children) {
      for (const child of n.children) {
        check(child);
      }
    }
  }

  for (const n of nodes) {
    check(n);
  }

  if (matches.length === 0) return undefined;

  // Pick topmost:
  // 1. Higher zIndex first
  // 2. Non-container over container (e.g. button over container)
  // 3. Smaller area over larger area (e.g. inner card over outer screen container)
  // 4. Later in layer array (top of visual stack) over earlier
  matches.sort((itemA, itemB) => {
    const a = itemA.node;
    const b = itemB.node;
    if (a.zIndex !== b.zIndex) {
      return b.zIndex - a.zIndex; // descending zIndex
    }
    if (a.type !== 'container' && b.type === 'container') return -1;
    if (a.type === 'container' && b.type !== 'container') return 1;

    const areaA = a.rect.w * a.rect.h;
    const areaB = b.rect.w * b.rect.h;
    if (areaA !== areaB) {
      return areaA - areaB; // smaller area first
    }

    return itemB.index - itemA.index; // later in array first
  });

  return matches[0].node;
}

export function moveNode(
  nodes: SceneNode[],
  id: string,
  dx: number,
  dy: number,
  cascade = true
): SceneNode[] {
  const target = findNode(nodes, id);
  if (!target) return nodes;

  const newX = Math.max(0, target.rect.x + dx);
  const newY = Math.max(0, target.rect.y + dy);
  const effectiveDx = newX - target.rect.x;
  const effectiveDy = newY - target.rect.y;

  function shiftSubtree(node: SceneNode): SceneNode {
    return {
      ...node,
      rect: {
        ...node.rect,
        x: Math.max(0, node.rect.x + effectiveDx),
        y: Math.max(0, node.rect.y + effectiveDy),
      },
      children: node.children ? node.children.map(shiftSubtree) : undefined,
    };
  }

  return nodes.map((node) => {
    if (node.id === id) {
      if (cascade && node.children && node.children.length > 0) {
        return shiftSubtree(node);
      }
      return {
        ...node,
        rect: { ...node.rect, x: newX, y: newY },
      };
    }

    if (node.children) {
      return {
        ...node,
        children: moveNode(node.children, id, dx, dy, cascade),
      };
    }

    return node;
  });
}

export function duplicateNode(
  nodes: SceneNode[],
  id: string,
  offset = { dx: 2, dy: 2 }
): { nodes: SceneNode[]; newId: string } | undefined {
  const target = findNode(nodes, id);
  if (!target) return undefined;

  let rootNewId = '';
  function cloneWithNewIds(node: SceneNode, isRoot = false): SceneNode {
    const newId = `${node.type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    if (isRoot) rootNewId = newId;
    return {
      ...node,
      id: newId,
      rect: isRoot
        ? {
            ...node.rect,
            x: Math.max(0, node.rect.x + offset.dx),
            y: Math.max(0, node.rect.y + offset.dy),
          }
        : { ...node.rect },
      children: node.children
        ? node.children.map((c) => cloneWithNewIds(c, false))
        : undefined,
    };
  }

  const duplicated = cloneWithNewIds(target, true);

  function insertDuplicated(list: SceneNode[]): SceneNode[] {
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      const copy = [...list];
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    }
    return list.map((n) => {
      if (n.children) {
        return {
          ...n,
          children: insertDuplicated(n.children),
        };
      }
      return n;
    });
  }

  return {
    nodes: insertDuplicated(nodes),
    newId: rootNewId,
  };
}

export function reorderNode(
  nodes: SceneNode[],
  id: string,
  direction: 'forward' | 'backward' | 'front' | 'back'
): SceneNode[] {
  const target = findNode(nodes, id);
  if (!target) return nodes;

  let newZ = target.zIndex;
  if (direction === 'forward') {
    newZ += 1;
  } else if (direction === 'backward') {
    newZ = Math.max(0, newZ - 1);
  } else if (direction === 'front') {
    let maxZ = 0;
    function scan(n: SceneNode) {
      maxZ = Math.max(maxZ, n.zIndex);
      if (n.children) n.children.forEach(scan);
    }
    nodes.forEach(scan);
    newZ = maxZ + 1;
  } else if (direction === 'back') {
    newZ = 0;
  }

  return updateNode(nodes, id, { zIndex: newZ });
}

export function resizeNode(
  nodes: SceneNode[],
  id: string,
  dw: number,
  dh: number
): SceneNode[] {
  const target = findNode(nodes, id);
  if (!target) return nodes;

  const minW = target.type === 'container' ? 3 : 1;
  const minH = target.type === 'container' ? 3 : 1;

  const newW = Math.max(minW, target.rect.w + dw);
  const newH = Math.max(minH, target.rect.h + dh);

  return updateNode(nodes, id, {
    rect: {
      ...target.rect,
      w: newW,
      h: newH,
    },
  });
}

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom';

export type DistributionAxis = 'horizontal' | 'vertical';

export function alignNodes(
  nodes: SceneNode[],
  ids: string[],
  alignment: AlignmentType,
  referenceRect?: Rect
): SceneNode[] {
  if (ids.length === 0) return nodes;

  const targetNodes: SceneNode[] = [];
  for (const id of ids) {
    const node = findNode(nodes, id);
    if (node) targetNodes.push(node);
  }
  if (targetNodes.length === 0) return nodes;

  let minX = referenceRect ? referenceRect.x : Infinity;
  let maxX = referenceRect ? referenceRect.x + referenceRect.w : -Infinity;
  let minY = referenceRect ? referenceRect.y : Infinity;
  let maxY = referenceRect ? referenceRect.y + referenceRect.h : -Infinity;

  if (!referenceRect) {
    for (const n of targetNodes) {
      if (n.rect.x < minX) minX = n.rect.x;
      if (n.rect.x + n.rect.w > maxX) maxX = n.rect.x + n.rect.w;
      if (n.rect.y < minY) minY = n.rect.y;
      if (n.rect.y + n.rect.h > maxY) maxY = n.rect.y + n.rect.h;
    }
  }

  const boxW = maxX - minX;
  const boxH = maxY - minY;

  let updated = nodes;
  for (const n of targetNodes) {
    let newX = n.rect.x;
    let newY = n.rect.y;

    switch (alignment) {
      case 'left':
        newX = minX;
        break;
      case 'center':
        newX = Math.round(minX + (boxW - n.rect.w) / 2);
        break;
      case 'right':
        newX = maxX - n.rect.w;
        break;
      case 'top':
        newY = minY;
        break;
      case 'middle':
        newY = Math.round(minY + (boxH - n.rect.h) / 2);
        break;
      case 'bottom':
        newY = maxY - n.rect.h;
        break;
    }

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    const dx = newX - n.rect.x;
    const dy = newY - n.rect.y;
    if (dx !== 0 || dy !== 0) {
      updated = moveNode(updated, n.id, dx, dy, true);
    }
  }

  return updated;
}

export function distributeNodes(
  nodes: SceneNode[],
  ids: string[],
  axis: DistributionAxis
): SceneNode[] {
  if (ids.length < 3) return nodes;

  const targetNodes: SceneNode[] = [];
  for (const id of ids) {
    const node = findNode(nodes, id);
    if (node) targetNodes.push(node);
  }
  if (targetNodes.length < 3) return nodes;

  let updated = nodes;

  if (axis === 'horizontal') {
    const sorted = [...targetNodes].sort((a, b) => a.rect.x - b.rect.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalSpan = last.rect.x + last.rect.w - first.rect.x;
    const totalItemWidth = sorted.reduce((sum, n) => sum + n.rect.w, 0);
    const totalGap = totalSpan - totalItemWidth;

    if (totalGap > 0) {
      const avgGap = totalGap / (sorted.length - 1);
      let curX = first.rect.x;
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        if (i > 0 && i < sorted.length - 1) {
          const targetX = Math.round(curX);
          const dx = targetX - item.rect.x;
          if (dx !== 0) {
            updated = moveNode(updated, item.id, dx, 0, true);
          }
          curX += item.rect.w + avgGap;
        } else if (i === 0) {
          curX += item.rect.w + avgGap;
        }
      }
    }
  } else {
    const sorted = [...targetNodes].sort((a, b) => a.rect.y - b.rect.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalSpan = last.rect.y + last.rect.h - first.rect.y;
    const totalItemHeight = sorted.reduce((sum, n) => sum + n.rect.h, 0);
    const totalGap = totalSpan - totalItemHeight;

    if (totalGap > 0) {
      const avgGap = totalGap / (sorted.length - 1);
      let curY = first.rect.y;
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        if (i > 0 && i < sorted.length - 1) {
          const targetY = Math.round(curY);
          const dy = targetY - item.rect.y;
          if (dy !== 0) {
            updated = moveNode(updated, item.id, 0, dy, true);
          }
          curY += item.rect.h + avgGap;
        } else if (i === 0) {
          curY += item.rect.h + avgGap;
        }
      }
    }
  }

  return updated;
}

export function moveNodes(
  nodes: SceneNode[],
  ids: string[],
  dx: number,
  dy: number
): SceneNode[] {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return nodes;
  const idSet = new Set(ids);

  const rootsToMove: string[] = [];
  function collectTopmost(list: SceneNode[]) {
    for (const n of list) {
      if (idSet.has(n.id)) {
        rootsToMove.push(n.id);
      } else if (n.children) {
        collectTopmost(n.children);
      }
    }
  }
  collectTopmost(nodes);

  let updated = nodes;
  for (const id of rootsToMove) {
    updated = moveNode(updated, id, dx, dy, true);
  }
  return updated;
}

export function removeNodes(nodes: SceneNode[], ids: string[]): SceneNode[] {
  if (ids.length === 0) return nodes;
  const idSet = new Set(ids);

  function filterTree(list: SceneNode[]): SceneNode[] {
    return list
      .filter((n) => !idSet.has(n.id))
      .map((n) => {
        if (n.children) {
          return {
            ...n,
            children: filterTree(n.children),
          };
        }
        return n;
      });
  }

  return filterTree(nodes);
}

export function findNodesInRect(
  nodes: SceneNode[],
  selectionRect: Rect
): SceneNode[] {
  const minX = Math.min(selectionRect.x, selectionRect.x + selectionRect.w);
  const maxX = Math.max(selectionRect.x, selectionRect.x + selectionRect.w);
  const minY = Math.min(selectionRect.y, selectionRect.y + selectionRect.h);
  const maxY = Math.max(selectionRect.y, selectionRect.y + selectionRect.h);

  const matched: SceneNode[] = [];

  function check(n: SceneNode) {
    const nMinX = n.rect.x;
    const nMaxX = n.rect.x + n.rect.w;
    const nMinY = n.rect.y;
    const nMaxY = n.rect.y + n.rect.h;

    const overlaps =
      nMinX < maxX &&
      nMaxX > minX &&
      nMinY < maxY &&
      nMaxY > minY;

    if (overlaps) {
      matched.push(n);
    }
    if (n.children) {
      for (const child of n.children) {
        check(child);
      }
    }
  }

  for (const n of nodes) {
    check(n);
  }

  return matched;
}
