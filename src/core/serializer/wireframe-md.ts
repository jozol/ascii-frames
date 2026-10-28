import { SceneNode, ScreenConfig, ArtboardScreen, SCREEN_PRESETS } from '../ast/types.js';
import { flattenNodes, rasterizeScene } from '../rasterizer/widget-stampers.js';

export interface WireframeOptions {
  title?: string;
  width?: number;
  height?: number;
  screen?: ScreenConfig;
}

export function serializeToWireframe(
  nodes: SceneNode | SceneNode[],
  options?: WireframeOptions
): string {
  const targetW = options?.width ?? options?.screen?.width;
  const targetH = options?.height ?? options?.screen?.height;

  const grid = rasterizeScene(nodes, targetW, targetH);
  const asciiGrid = grid.renderToString();

  const allNodes = flattenNodes(nodes);

  // Extract nodes with meta annotations (actions, bindings, layout rules, transitions)
  const annotatedNodes = allNodes.filter((node) => {
    const meta = node.meta;
    return Boolean(
      meta &&
        (meta.action ||
          meta.binding ||
          meta.layoutRule ||
          meta.transitionTarget)
    );
  });

  // Sort deterministically keyed by ID
  annotatedNodes.sort((a, b) => a.id.localeCompare(b.id));

  const sections: string[] = [];

  const title = options?.title !== undefined ? options.title : 'Wireframe';
  if (title) {
    sections.push(`# ${title}`);
  }

  if (options?.screen) {
    const orient = options.screen.orientation
      ? ` | Orientation: ${options.screen.orientation}`
      : '';
    sections.push(
      `> **Target Viewport:** ${options.screen.name} (${grid.width} × ${grid.height} cells)${orient}`
    );
  }

  sections.push('```text\n' + asciiGrid + '\n```');

  if (annotatedNodes.length > 0) {
    const listItems = annotatedNodes.map((node) => {
      const meta = node.meta!;
      const details: string[] = [];
      if (meta.action) details.push(`action: ${meta.action}`);
      if (meta.binding) details.push(`binding: ${meta.binding}`);
      if (meta.layoutRule) details.push(`layoutRule: ${meta.layoutRule}`);
      if (meta.transitionTarget) details.push(`navigatesTo: ${meta.transitionTarget}`);

      const labelPart = node.label ? ` (${node.label})` : '';
      return `- **${node.id}**${labelPart}: ${details.join(', ')}`;
    });

    sections.push('## Annotations\n\n' + listItems.join('\n'));
  }

  return sections.join('\n\n') + '\n';
}

export function serializeMultiScreenWireframe(
  screens: ArtboardScreen[],
  title = 'Multi-Screen Wireframe Specification'
): string {
  if (screens.length <= 1) {
    const s = screens[0];
    if (!s) return '';
    const screenPreset = SCREEN_PRESETS.find((p) => p.id === s.screenConfigId);
    return serializeToWireframe(s.nodes, {
      title: s.name || 'Wireframe Specification',
      screen: screenPreset ? { ...screenPreset, orientation: s.orientation } : undefined,
    });
  }

  const sections: string[] = [];
  sections.push(`# ${title}`);

  // 1. Mermaid Flow Diagram
  const mermaidLines: string[] = ['```mermaid', 'flowchart LR'];
  let hasExplicitTransitions = false;

  screens.forEach((s, idx) => {
    const cleanId = s.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeName = s.name.replace(/"/g, "'");
    mermaidLines.push(`  ${cleanId}["${idx + 1}: ${safeName}"]`);
  });

  screens.forEach((s) => {
    const cleanSourceId = s.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const nodesWithTransitions = flattenNodes(s.nodes).filter(
      (n) => n.meta?.transitionTarget
    );
    nodesWithTransitions.forEach((n) => {
      const targetScreen = screens.find(
        (sc) =>
          sc.id === n.meta!.transitionTarget || sc.name === n.meta!.transitionTarget
      );
      if (targetScreen) {
        hasExplicitTransitions = true;
        const cleanTargetId = targetScreen.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const edgeLabel = n.label || n.meta?.action || n.id;
        mermaidLines.push(`  ${cleanSourceId} -->|"${edgeLabel}"| ${cleanTargetId}`);
      }
    });
  });

  // If no explicit transitions between screens, link them sequentially
  if (!hasExplicitTransitions && screens.length > 1) {
    for (let i = 0; i < screens.length - 1; i++) {
      const from = screens[i].id.replace(/[^a-zA-Z0-9_]/g, '_');
      const to = screens[i + 1].id.replace(/[^a-zA-Z0-9_]/g, '_');
      mermaidLines.push(`  ${from} -.->|"next"| ${to}`);
    }
  }

  mermaidLines.push('```');
  sections.push('## User Journey Flow\n\n' + mermaidLines.join('\n'));

  // 2. Each Screen Section
  screens.forEach((s, idx) => {
    const screenPreset = SCREEN_PRESETS.find((p) => p.id === s.screenConfigId);
    const screenDoc = serializeToWireframe(s.nodes, {
      title: `Screen ${idx + 1}: ${s.name}`,
      screen: screenPreset ? { ...screenPreset, orientation: s.orientation } : undefined,
    });
    // Adjust top level headings for nested structure
    const adjustedDoc = screenDoc
      .replace(/^# (.*)$/gm, '### $1')
      .replace(/^## (.*)$/gm, '#### $1');
    sections.push(adjustedDoc.trim());
  });

  return sections.join('\n\n') + '\n';
}
