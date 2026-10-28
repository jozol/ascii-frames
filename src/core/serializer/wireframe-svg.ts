export interface SvgExportOptions {
  theme?: 'dark' | 'light';
  title?: string;
  fontSize?: number;
  lineHeight?: number;
  charWidth?: number;
  padding?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeToSvg(
  renderedText: string,
  options: SvgExportOptions = {}
): string {
  const theme = options.theme || 'dark';
  const fontSize = options.fontSize || 14;
  const lineHeight = options.lineHeight || 20;
  // Standard character width for 14px monospace font (~8.43px per char)
  const charWidth = options.charWidth || Math.round(fontSize * 0.602 * 10) / 10;
  const padding = options.padding !== undefined ? options.padding : 20;
  const title = options.title;

  const isDark = theme === 'dark';
  const bg = options.backgroundColor || (isDark ? '#0d1117' : '#ffffff');
  const fg = options.textColor || (isDark ? '#e6edf3' : '#1f2328');
  const border = options.borderColor || (isDark ? '#30363d' : '#d0d7de');
  const headerBg = isDark ? '#161b22' : '#f6f8fa';
  const titleColor = isDark ? '#8b949e' : '#656d76';

  const lines = renderedText.split('\n');
  let maxCols = 0;
  for (const line of lines) {
    if (line.length > maxCols) {
      maxCols = line.length;
    }
  }

  const contentW = Math.max(100, Math.ceil(maxCols * charWidth));
  const contentH = lines.length * lineHeight;

  const headerH = title ? 36 : 0;
  const totalW = contentW + padding * 2;
  const totalH = contentH + padding * 2 + headerH;

  const textStartY = headerH + padding + fontSize;

  let textElements = '';
  for (let i = 0; i < lines.length; i++) {
    const y = textStartY + i * lineHeight;
    const escaped = escapeXml(lines[i]);
    textElements += `    <text x="${padding}" y="${y}">${escaped}</text>\n`;
  }

  let headerElement = '';
  if (title) {
    headerElement = `
  <!-- Window Header -->
  <path d="M 0,10 A 10,10 0 0,1 10,0 L ${totalW - 10},0 A 10,10 0 0,1 ${totalW},10 L ${totalW},${headerH} L 0,${headerH} Z" fill="${headerBg}" />
  <circle cx="16" cy="18" r="5" fill="#ff5f56" />
  <circle cx="32" cy="18" r="5" fill="#ffbd2e" />
  <circle cx="48" cy="18" r="5" fill="#27c93f" />
  <text x="${totalW / 2}" y="22" font-size="12" font-weight="600" fill="${titleColor}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${escapeXml(title)}</text>
  <line x1="0" y1="${headerH}" x2="${totalW}" y2="${headerH}" stroke="${border}" stroke-width="1" />
`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
  <style>
    text {
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace;
      font-size: ${fontSize}px;
      fill: ${fg};
      white-space: pre;
    }
  </style>
  <!-- Background Frame -->
  <rect width="${totalW}" height="${totalH}" rx="10" ry="10" fill="${bg}" stroke="${border}" stroke-width="1" />
${headerElement}
  <!-- ASCII Content -->
  <g xml:space="preserve">
${textElements}  </g>
</svg>
`;
}
