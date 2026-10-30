import { describe, it, expect } from 'vitest';
import { SceneNode } from '../src/core/ast/types.js';
import {
  serializeToReactTailwind,
  serializeToHtmlCss,
  serializeToTerminalTUI,
} from '../src/core/serializer/wireframe-codegen.js';

describe('Multi-Target Code Generation Suite', () => {
  const sampleNodes: SceneNode[] = [
    {
      id: 'login-card',
      type: 'container',
      rect: { x: 0, y: 0, w: 24, h: 10 },
      zIndex: 0,
      label: 'Sign In',
      children: [
        {
          id: 'user-email',
          type: 'input',
          rect: { x: 2, y: 2, w: 20, h: 1 },
          zIndex: 1,
          label: 'Email',
          meta: { binding: 'user.email' },
        },
        {
          id: 'btn-submit',
          type: 'button',
          rect: { x: 2, y: 5, w: 12, h: 1 },
          zIndex: 1,
          label: 'Login',
          meta: { variant: 'primary', action: 'loginUser' },
        },
        {
          id: 'chk-agree',
          type: 'checkbox',
          rect: { x: 2, y: 7, w: 14, h: 1 },
          zIndex: 1,
          label: 'Agree to Terms',
          meta: { checked: true },
        },
      ],
    },
  ];

  it('generates React + Tailwind TSX component', () => {
    const code = serializeToReactTailwind(sampleNodes);
    expect(code).toContain("import React from 'react';");
    expect(code).toContain('className="border border-stone-600');
    expect(code).toContain("onClick={() => handleAction('loginUser')}");
    expect(code).toContain('data-binding="user.email"');
    expect(code).toContain('bg-red-700 hover:bg-red-800');
  });

  it('generates standalone HTML5 and CSS document', () => {
    const html = serializeToHtmlCss(sampleNodes);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<style>');
    expect(html).toContain('class="btn btn-primary"');
    expect(html).toContain('input type="text"');
  });

  it('generates Python Textual TUI code', () => {
    const py = serializeToTerminalTUI(sampleNodes, 'textual');
    expect(py).toContain('from textual.app import App');
    expect(py).toContain('class GeneratedApp(App):');
    expect(py).toContain('yield Button("Login", variant="primary", id="btn-submit")');
    expect(py).toContain('yield Input(placeholder="Email", id="user-email")');
  });

  it('generates Go Bubbletea TUI code', () => {
    const go = serializeToTerminalTUI(sampleNodes, 'bubbletea');
    expect(go).toContain('package main');
    expect(go).toContain('github.com/charmbracelet/bubbletea');
    expect(go).toContain('type model struct');
    expect(go).toContain('tea.NewProgram');
  });
});
