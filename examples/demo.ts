import { serializeToWireframe, SceneNode } from '../src/index.js';

// Define a sample UI layout AST
const scene: SceneNode[] = [
  {
    id: 'sidebar',
    type: 'container',
    rect: { x: 0, y: 0, w: 16, h: 12 },
    zIndex: 0,
    label: 'Navigation',
    meta: { layoutRule: 'fixed-left' },
    children: [
      {
        id: 'link-home',
        type: 'text',
        rect: { x: 2, y: 2, w: 12, h: 1 },
        zIndex: 1,
        label: 'Dashboard',
      },
      {
        id: 'link-analytics',
        type: 'text',
        rect: { x: 2, y: 4, w: 12, h: 1 },
        zIndex: 1,
        label: 'Analytics',
      },
      {
        id: 'dark-toggle',
        type: 'toggle',
        rect: { x: 2, y: 7, w: 12, h: 1 },
        zIndex: 1,
        label: 'Dark Mode',
        meta: { checked: true, binding: 'theme.dark' },
      },
    ],
  },
  {
    id: 'header',
    type: 'container',
    rect: { x: 15, y: 0, w: 32, h: 4 },
    zIndex: 0,
    label: 'Header',
    meta: { layoutRule: 'sticky-top' },
    children: [
      {
        id: 'search',
        type: 'input',
        rect: { x: 17, y: 1, w: 18, h: 1 },
        zIndex: 1,
        label: 'Search...',
        meta: { binding: 'filterText' },
      },
      {
        id: 'btn-create',
        type: 'button',
        rect: { x: 36, y: 1, w: 9, h: 1 },
        zIndex: 1,
        label: 'New',
        meta: { variant: 'primary', action: 'openNewModal' },
      },
    ],
  },
  {
    id: 'content',
    type: 'container',
    rect: { x: 15, y: 3, w: 32, h: 9 },
    zIndex: 0,
    label: 'Overview',
    meta: { layoutRule: 'flex-1' },
    children: [
      {
        id: 'stat-label',
        type: 'text',
        rect: { x: 18, y: 5, w: 25, h: 1 },
        zIndex: 1,
        label: 'Active Users: 1,280',
        meta: { binding: 'stats.activeUsers' },
      },
      {
        id: 'opt-notifications',
        type: 'checkbox',
        rect: { x: 18, y: 7, w: 25, h: 1 },
        zIndex: 1,
        label: 'Email Notifications',
        meta: { checked: true, binding: 'user.notifications' },
      },
      {
        id: 'btn-refresh',
        type: 'button',
        rect: { x: 18, y: 9, w: 11, h: 1 },
        zIndex: 1,
        label: 'Refresh',
        meta: { variant: 'secondary', action: 'reloadStats' },
      },
    ],
  },
];

// Compile to WIREFRAME.md hybrid format
const output = serializeToWireframe(scene, { title: 'App Dashboard' });

console.log('=== Rendered WIREFRAME.md Specification ===\n');
console.log(output);
