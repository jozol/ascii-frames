import { SceneNode, ScreenConfig } from '../ast/types.js';
import { flattenNodes } from '../rasterizer/widget-stampers.js';

export function serializeToReactTailwind(
  nodes: SceneNode | SceneNode[],
  screen?: ScreenConfig
): string {
  const allNodes = flattenNodes(nodes);
  const title = screen ? screen.name.replace(/[^a-zA-Z0-9]/g, '') : 'WireframeComponent';
  const componentName = `${title}View`;

  const jsxElements = allNodes.map((node) => {
    const label = node.label ?? '';
    const actionAttr = node.meta?.action ? ` onClick={() => handleAction('${node.meta.action}')}` : '';
    const bindingAttr = node.meta?.binding ? ` data-binding="${node.meta.binding}"` : '';

    switch (node.type) {
      case 'container':
        return `        {/* ${node.id}: Container */}
        <div id="${node.id}" className="border border-stone-600 rounded-md p-4 bg-stone-900/60 shadow-sm">
          ${node.label ? `<h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">${node.label}</h3>` : ''}
        </div>`;

      case 'button':
        if (node.meta?.variant === 'primary') {
          return `        <button id="${node.id}"${actionAttr}${bindingAttr} className="px-4 py-2 bg-red-700 hover:bg-red-800 text-stone-50 font-medium rounded text-sm transition">
          ${label || 'Action'}
        </button>`;
        }
        return `        <button id="${node.id}"${actionAttr}${bindingAttr} className="px-4 py-2 border border-stone-600 hover:bg-stone-800 text-stone-200 font-medium rounded text-sm transition">
          ${label || 'Action'}
        </button>`;

      case 'input':
        return `        <input id="${node.id}" type="text" placeholder="${label || 'Type here...'}"${bindingAttr} className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-red-600" />`;

      case 'select':
        return `        <select id="${node.id}"${bindingAttr} className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded text-stone-100 text-sm">
          <option value="">${label || 'Select option...'}</option>
        </select>`;

      case 'checkbox':
        return `        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300">
          <input id="${node.id}" type="checkbox"${node.meta?.checked ? ' defaultChecked' : ''}${bindingAttr} className="rounded border-stone-700 text-red-600 focus:ring-red-500" />
          <span>${label || 'Option'}</span>
        </label>`;

      case 'radio':
        return `        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300">
          <input id="${node.id}" type="radio"${node.meta?.checked ? ' defaultChecked' : ''}${bindingAttr} name="group" className="border-stone-700 text-red-600 focus:ring-red-500" />
          <span>${label || 'Choice'}</span>
        </label>`;

      case 'toggle':
        return `        <button id="${node.id}" type="button" role="switch" aria-checked="${Boolean(node.meta?.checked)}"${bindingAttr} className="relative inline-flex h-6 w-11 items-center rounded-full transition ${node.meta?.checked ? 'bg-red-700' : 'bg-stone-700'}">
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition ${node.meta?.checked ? 'translate-x-6' : 'translate-x-1'}" />
          ${label ? `<span className="ml-14 text-sm text-stone-300 whitespace-nowrap">${label}</span>` : ''}
        </button>`;

      case 'table':
        const cols = node.meta?.tableColumns ?? [{ title: 'ID' }, { title: 'Name' }, { title: 'Status' }];
        const rows = node.meta?.tableRows ?? [['#1', 'Item 1', 'Active'], ['#2', 'Item 2', 'Pending']];
        return `        <table id="${node.id}" className="w-full text-left text-sm border-collapse border border-stone-700">
          <thead>
            <tr className="border-b border-stone-700 bg-stone-800/50">
              ${cols.map((c) => `<th className="p-2 font-medium text-stone-300">${c.title}</th>`).join('\n              ')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `<tr className="border-b border-stone-800">${r.map((cell) => `<td className="p-2 text-stone-400">${cell}</td>`).join('')}</tr>`).join('\n            ')}
          </tbody>
        </table>`;

      case 'tabs':
        const tabsList = node.meta?.tabs ?? ['Tab 1', 'Tab 2', 'Tab 3'];
        const activeTab = node.meta?.activeTabIndex ?? 0;
        return `        <div id="${node.id}" className="flex gap-2 border-b border-stone-700 pb-2">
          ${tabsList.map((t, i) => `<button className="px-3 py-1 text-sm font-medium rounded ${i === activeTab ? 'bg-stone-800 text-stone-50 border border-red-700' : 'text-stone-400 hover:text-stone-200'}">${t}</button>`).join('\n          ')}
        </div>`;

      case 'badge':
        return `        <span id="${node.id}" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-950 text-red-300 border border-red-800">
          ${label || 'Badge'}
        </span>`;

      case 'progress':
        const pct = node.meta?.progressValue ?? 50;
        return `        <div id="${node.id}" className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
          <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '${pct}%' }} />
        </div>`;

      case 'alert':
        return `        <div id="${node.id}" role="alert" className="p-3 border border-amber-600/60 bg-amber-950/30 rounded text-amber-200 text-sm">
          ${label || 'Alert message notice'}
        </div>`;

      case 'text':
      default:
        return `        <p id="${node.id}" className="text-stone-300 text-sm leading-relaxed">${label}</p>`;
    }
  });

  return `import React from 'react';

export function ${componentName}() {
  const handleAction = (actionName: string) => {
    console.log('[Action]', actionName);
  };

  return (
    <section className="p-6 max-w-4xl mx-auto flex flex-col gap-4 font-sans text-stone-100 bg-stone-950 border border-stone-800 rounded-xl">
${jsxElements.join('\n\n')}
    </section>
  );
}
`;
}

export function serializeToHtmlCss(
  nodes: SceneNode | SceneNode[],
  screen?: ScreenConfig
): string {
  const allNodes = flattenNodes(nodes);
  const elements = allNodes.map((n) => {
    const label = n.label ?? '';
    switch (n.type) {
      case 'button':
        return `    <button class="btn ${n.meta?.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}">${label || 'Button'}</button>`;
      case 'input':
        return `    <input type="text" class="input" placeholder="${label || 'Input...'}" />`;
      case 'checkbox':
        return `    <label class="checkbox-label"><input type="checkbox"${n.meta?.checked ? ' checked' : ''} /> <span>${label || 'Option'}</span></label>`;
      case 'toggle':
        return `    <label class="switch"><input type="checkbox"${n.meta?.checked ? ' checked' : ''} /><span class="slider"></span> <span>${label}</span></label>`;
      case 'alert':
        return `    <div class="alert">${label || 'Alert Notice'}</div>`;
      case 'text':
      default:
        return `    <p class="text">${label}</p>`;
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${screen?.name || 'Wireframe'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0d0f; color: #eee; padding: 24px; }
    .btn { padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; border: 1px solid #444; }
    .btn-primary { background: #a82e20; color: #fff; border-color: #a82e20; }
    .btn-secondary { background: #1f2025; color: #eee; }
    .input { padding: 8px 12px; background: #16171a; border: 1px solid #333; color: #eee; border-radius: 4px; }
    .alert { padding: 12px; border: 1px solid #c97f24; background: #2b1f14; color: #f5cf8e; border-radius: 4px; }
    .text { margin: 4px 0; color: #ccc; }
    .layout-container { display: flex; flex-direction: column; gap: 12px; max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="layout-container">
${elements.join('\n')}
  </div>
</body>
</html>
`;
}

export function serializeToTerminalTUI(
  nodes: SceneNode | SceneNode[],
  target: 'textual' | 'bubbletea'
): string {
  const allNodes = flattenNodes(nodes);

  if (target === 'bubbletea') {
    return `package main

import (
    "fmt"
    "os"

    tea "github.com/charmbracelet/bubbletea"
)

type model struct {
    cursor int
    status string
}

func initialModel() model {
    return model{status: "Ready"}
}

func (m model) Init() tea.Cmd {
    return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "ctrl+c", "q":
            return m, tea.Quit
        case "enter":
            m.status = "Action triggered"
        }
    }
    return m, nil
}

func (m model) View() string {
    s := "=== ASCII-Frames Bubbletea TUI ===\\n\\n"
${allNodes.map((n) => `    s += fmt.Sprintf("[${n.type.toUpperCase()}] ${n.label || n.id}\\n")`).join('\n')}
    s += "\\nPress q to quit.\\n"
    return s
}

func main() {
    p := tea.NewProgram(initialModel())
    if _, err := p.Run(); err != nil {
        fmt.Printf("Error: %v", err)
        os.Exit(1)
    }
}
`;
  }

  // Target: 'textual' (Python)
  const textualWidgets = allNodes.map((n) => {
    const label = (n.label ?? '').replace(/"/g, '\\"');
    switch (n.type) {
      case 'button':
        const variant = n.meta?.variant === 'primary' ? 'primary' : 'default';
        return `        yield Button("${label || 'Action'}", variant="${variant}", id="${n.id}")`;
      case 'input':
        return `        yield Input(placeholder="${label || 'Type...'}", id="${n.id}")`;
      case 'checkbox':
        return `        yield Checkbox("${label || 'Option'}", value=${n.meta?.checked ? 'True' : 'False'}, id="${n.id}")`;
      case 'toggle':
        return `        yield Switch(value=${n.meta?.checked ? 'True' : 'False'}, id="${n.id}")`;
      default:
        return `        yield Static("${label || n.id}", id="${n.id}")`;
    }
  });

  return `from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Input, Static, Checkbox, Switch

class GeneratedApp(App):
    CSS = """
    Screen {
        background: $surface;
        padding: 2;
    }
    Button, Input, Static, Checkbox, Switch {
        margin: 1 0;
    }
    """

    def compose(self) -> ComposeResult:
        yield Header()
${textualWidgets.join('\n')}
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.notify(f"Pressed: {event.button.id}")

if __name__ == "__main__":
    app = GeneratedApp()
    app.run()
`;
}
