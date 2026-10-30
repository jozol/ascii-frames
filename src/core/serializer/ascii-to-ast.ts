import { SceneNode, WidgetType, Rect } from '../ast/types.js';

export function parseAsciiToNodes(asciiText: string): SceneNode[] {
  if (!asciiText || asciiText.trim().length === 0) return [];

  const rawLines = asciiText.split('\n');
  const nodes: SceneNode[] = [];
  let nodeIdCounter = 1;

  // 1. Detect Box Containers: Find top borders with ┌, ╭, ╔, +
  const boxTopRegex = /^(\s*)([┌╭╔\+])([─═\-\s\w\d\.\,\:\(\)\[\]]+?)([┐╮╗\+])(\s*)$/;
  const boxBottomLeftChars = new Set(['└', '╰', '╚', '+']);
  const boxBottomRightChars = new Set(['┘', '╯', '╝', '+']);

  for (let r = 0; r < rawLines.length; r++) {
    const line = rawLines[r];
    const match = line.match(boxTopRegex);

    if (match) {
      const leadingSpace = match[1].length;
      const x = leadingSpace;
      const y = r;
      const w = match[2].length + match[3].length + match[4].length;

      // Check for title in top border: ┌── Title ──┐
      let title: string | undefined;
      const titleMatch = match[3].match(/[─═\-]+\s+([^─═\-]+?)\s+[─═\-]+/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      // Find bottom border
      let boxH = 0;
      for (let br = r + 1; br < rawLines.length; br++) {
        const bLine = rawLines[br];
        if (
          bLine.length >= x + w &&
          boxBottomLeftChars.has(bLine[x]) &&
          boxBottomRightChars.has(bLine[x + w - 1])
        ) {
          boxH = br - r + 1;
          break;
        }
      }

      if (boxH >= 3) {
        nodes.push({
          id: `container-${nodeIdCounter++}`,
          type: 'container',
          rect: { x, y, w, h: boxH },
          zIndex: 0,
          label: title,
        });
      }
    }
  }

  // 2. Scan each line for inline controls
  for (let y = 0; y < rawLines.length; y++) {
    const line = rawLines[y];

    // Primary Button: [# Label #]
    const primaryBtnRegex = /\[#\s*([^#]+?)\s*#\]/g;
    let match: RegExpExecArray | null;
    while ((match = primaryBtnRegex.exec(line)) !== null) {
      nodes.push({
        id: `btn-primary-${nodeIdCounter++}`,
        type: 'button',
        rect: { x: match.index, y, w: match[0].length, h: 1 },
        zIndex: 1,
        label: match[1].trim(),
        meta: { variant: 'primary' },
      });
    }

    // Toggle: (─o) or (o─)
    const toggleRegex = /\((o─|─o)\)(\s+[a-zA-Z0-9_\s]+)?/g;
    while ((match = toggleRegex.exec(line)) !== null) {
      const isChecked = match[1] === '─o';
      const label = match[2] ? match[2].trim() : '';
      nodes.push({
        id: `toggle-${nodeIdCounter++}`,
        type: 'toggle',
        rect: { x: match.index, y, w: match[0].length, h: 1 },
        zIndex: 1,
        label,
        meta: { checked: isChecked },
      });
    }

    // Checkbox: [x] Label or [ ] Label
    const checkRegex = /\[([ xX])\]\s+([a-zA-Z0-9_\s]+)/g;
    while ((match = checkRegex.exec(line)) !== null) {
      const isChecked = match[1].toLowerCase() === 'x';
      nodes.push({
        id: `checkbox-${nodeIdCounter++}`,
        type: 'checkbox',
        rect: { x: match.index, y, w: match[0].length, h: 1 },
        zIndex: 1,
        label: match[2].trim(),
        meta: { checked: isChecked },
      });
    }

    // Radio: (•) Label or ( ) Label
    const radioRegex = /\(([ •\*\.])\)\s+([a-zA-Z0-9_\s]+)/g;
    while ((match = radioRegex.exec(line)) !== null) {
      const isChecked = match[1] === '•' || match[1] === '*';
      nodes.push({
        id: `radio-${nodeIdCounter++}`,
        type: 'radio',
        rect: { x: match.index, y, w: match[0].length, h: 1 },
        zIndex: 1,
        label: match[2].trim(),
        meta: { checked: isChecked },
      });
    }

    // Dropdown Select: [ Value   v ]
    const selectRegex = /\[\s+([^\]]+?)\s+v\s*\]/g;
    while ((match = selectRegex.exec(line)) !== null) {
      nodes.push({
        id: `select-${nodeIdCounter++}`,
        type: 'select',
        rect: { x: match.index, y, w: match[0].length, h: 1 },
        zIndex: 1,
        label: match[1].trim(),
      });
    }

    // Secondary Button or Input: [ Label ]
    const generalBracketRegex = /\[\s+([^\]#]+?)\s+\]/g;
    while ((match = generalBracketRegex.exec(line)) !== null) {
      // If it looks like a placeholder with dots, treat as input
      const inner = match[1];
      const isInput = inner.includes('...') || inner.endsWith('_');
      const isSelect = inner.endsWith(' v');

      if (!isSelect) {
        nodes.push({
          id: `${isInput ? 'input' : 'button'}-${nodeIdCounter++}`,
          type: isInput ? 'input' : 'button',
          rect: { x: match.index, y, w: match[0].length, h: 1 },
          zIndex: 1,
          label: inner.trim(),
          meta: isInput ? undefined : { variant: 'secondary' },
        });
      }
    }
  }

  // Deduplicate overlapping nodes on exact coordinates
  const uniqueNodes: SceneNode[] = [];
  const seenPos = new Set<string>();

  for (const n of nodes) {
    const key = `${n.type}-${n.rect.x}-${n.rect.y}`;
    if (!seenPos.has(key)) {
      seenPos.add(key);
      uniqueNodes.push(n);
    }
  }

  return uniqueNodes;
}
