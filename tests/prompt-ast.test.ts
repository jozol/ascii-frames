import { describe, it, expect } from 'vitest';
import { generateWireframeFromPrompt } from '../src/core/serializer/prompt-to-ast.js';

describe('Prompt-to-AST Synthesis Suite', () => {
  it('synthesizes login wireframe from natural language prompt', () => {
    const nodes = generateWireframeFromPrompt('Create a login screen with remember me and forgot password');
    expect(nodes.length).toBe(1); // root container
    expect(nodes[0].type).toBe('container');
    expect(nodes[0].label).toBe('Sign In');

    const children = nodes[0].children!;
    expect(children.some((c) => c.type === 'input')).toBe(true);
    expect(children.some((c) => c.type === 'checkbox')).toBe(true);
    expect(children.some((c) => c.type === 'button' && c.meta?.variant === 'primary')).toBe(true);
  });

  it('synthesizes settings wireframe with avatar and toggles', () => {
    const nodes = generateWireframeFromPrompt('Settings page with dark theme toggle and profile name');
    expect(nodes[0].label).toBe('Preferences');
    const children = nodes[0].children!;
    expect(children.some((c) => c.type === 'toggle')).toBe(true);
    expect(children.some((c) => c.type === 'circle')).toBe(true);
  });

  it('synthesizes data table wireframe with columns', () => {
    const nodes = generateWireframeFromPrompt('CRM customer table with status list');
    const tbl = nodes.find((n) => n.type === 'table');
    expect(tbl).toBeDefined();
    expect(tbl?.meta?.tableColumns?.length).toBe(3);
    expect(tbl?.meta?.tableRows?.length).toBe(3);
  });
});
