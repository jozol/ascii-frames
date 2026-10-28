import { describe, it, expect } from 'vitest';
import { serializeToSvg } from '../src/core/serializer/wireframe-svg.js';

describe('SVG Wireframe Exporter', () => {
  const sampleAscii = `┌─ Sample Box ─┐
│ Hello World  │
│ <Button &>   │
└──────────────┘`;

  it('generates well-formed SVG with default dark theme', () => {
    const svg = serializeToSvg(sampleAscii);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('fill="#0d1117"'); // dark bg
    expect(svg).toContain('fill: #e6edf3;'); // dark fg
    expect(svg).toContain('┌─ Sample Box ─┐');
    expect(svg).toContain('│ Hello World  │');
    // Escaped XML chars
    expect(svg).toContain('&lt;Button &amp;&gt;');
    expect(svg).toContain('</svg>');
  });

  it('generates well-formed SVG with light theme and custom title header', () => {
    const svg = serializeToSvg(sampleAscii, {
      theme: 'light',
      title: 'Mobile App Wireframe',
    });
    expect(svg).toContain('fill="#ffffff"'); // light bg
    expect(svg).toContain('fill: #1f2328;'); // light fg
    expect(svg).toContain('Mobile App Wireframe');
    expect(svg).toContain('circle cx="16" cy="18"'); // 3 dots
  });

  it('calculates proportional dimensions based on line count and character length', () => {
    const shortSvg = serializeToSvg('abc');
    const longText = 'a'.repeat(60) + '\n' + 'b'.repeat(60) + '\n' + 'c'.repeat(60);
    const longSvg = serializeToSvg(longText);

    const getDimensions = (s: string) => {
      const wMatch = s.match(/width="(\d+)"/);
      const hMatch = s.match(/height="(\d+)"/);
      return {
        w: parseInt(wMatch?.[1] || '0', 10),
        h: parseInt(hMatch?.[1] || '0', 10),
      };
    };

    const shortDim = getDimensions(shortSvg);
    const longDim = getDimensions(longSvg);

    expect(longDim.w).toBeGreaterThan(shortDim.w);
    expect(longDim.h).toBeGreaterThan(shortDim.h);
  });
});
