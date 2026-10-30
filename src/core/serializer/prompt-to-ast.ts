import { SceneNode, ScreenConfig } from '../ast/types.js';

export function generateWireframeFromPrompt(
  prompt: string,
  screenConfig?: ScreenConfig
): SceneNode[] {
  const p = prompt.toLowerCase();
  const screenW = screenConfig?.width ?? 32;
  const screenH = screenConfig?.height ?? 30;

  // 1. Login / Sign In Intent
  if (p.includes('login') || p.includes('sign in') || p.includes('auth')) {
    const cardW = Math.min(screenW - 4, 28);
    const cardH = 14;
    const startX = Math.max(0, Math.floor((screenW - cardW) / 2));
    const startY = Math.max(1, Math.floor((screenH - cardH) / 2));

    return [
      {
        id: 'login-frame',
        type: 'container',
        rect: { x: startX, y: startY, w: cardW, h: cardH },
        zIndex: 0,
        label: 'Sign In',
        children: [
          {
            id: 'inp-email',
            type: 'input',
            rect: { x: startX + 2, y: startY + 2, w: cardW - 4, h: 1 },
            zIndex: 1,
            label: 'user@example.com',
            meta: { binding: 'auth.email' },
          },
          {
            id: 'inp-password',
            type: 'input',
            rect: { x: startX + 2, y: startY + 4, w: cardW - 4, h: 1 },
            zIndex: 1,
            label: '••••••••••••',
            meta: { binding: 'auth.password' },
          },
          {
            id: 'chk-remember',
            type: 'checkbox',
            rect: { x: startX + 2, y: startY + 6, w: 16, h: 1 },
            zIndex: 1,
            label: 'Remember me',
            meta: { checked: true, binding: 'auth.remember' },
          },
          {
            id: 'btn-submit',
            type: 'button',
            rect: { x: startX + 2, y: startY + 8, w: cardW - 4, h: 1 },
            zIndex: 1,
            label: 'Continue',
            meta: { variant: 'primary', action: 'submitLogin' },
          },
          {
            id: 'btn-forgot',
            type: 'button',
            rect: { x: startX + 2, y: startY + 10, w: cardW - 4, h: 1 },
            zIndex: 1,
            label: 'Forgot password?',
            meta: { variant: 'secondary', action: 'openResetModal' },
          },
        ],
      },
    ];
  }

  // 2. Settings / Preferences Intent
  if (p.includes('setting') || p.includes('preference') || p.includes('config')) {
    const cardW = Math.min(screenW - 2, 30);
    return [
      {
        id: 'settings-frame',
        type: 'container',
        rect: { x: 1, y: 1, w: cardW, h: 18 },
        zIndex: 0,
        label: 'Preferences',
        children: [
          {
            id: 'avatar-user',
            type: 'circle',
            rect: { x: 3, y: 3, w: 8, h: 4 },
            zIndex: 1,
            label: 'User',
          },
          {
            id: 'txt-name',
            type: 'text',
            rect: { x: 12, y: 4, w: 16, h: 1 },
            zIndex: 1,
            label: 'Alex Rivera',
            meta: { binding: 'profile.name' },
          },
          {
            id: 'div-sep',
            type: 'divider',
            rect: { x: 3, y: 8, w: cardW - 6, h: 1 },
            zIndex: 1,
          },
          {
            id: 'tog-dark',
            type: 'toggle',
            rect: { x: 3, y: 10, w: 18, h: 1 },
            zIndex: 1,
            label: 'Dark Theme',
            meta: { checked: true, action: 'toggleTheme' },
          },
          {
            id: 'tog-notifs',
            type: 'toggle',
            rect: { x: 3, y: 12, w: 18, h: 1 },
            zIndex: 1,
            label: 'Push Alerts',
            meta: { checked: false, action: 'toggleAlerts' },
          },
          {
            id: 'btn-save-prefs',
            type: 'button',
            rect: { x: 3, y: 14, w: cardW - 6, h: 1 },
            zIndex: 1,
            label: 'Save Changes',
            meta: { variant: 'primary', action: 'saveSettings' },
          },
        ],
      },
    ];
  }

  // 3. Table / Data Intent
  if (p.includes('table') || p.includes('data') || p.includes('list') || p.includes('crm')) {
    const tblW = Math.min(screenW - 2, 34);
    return [
      {
        id: 'inp-search',
        type: 'input',
        rect: { x: 1, y: 1, w: 20, h: 1 },
        zIndex: 1,
        label: '{search} Filter records...',
      },
      {
        id: 'btn-add-record',
        type: 'button',
        rect: { x: 22, y: 1, w: 10, h: 1 },
        zIndex: 1,
        label: '[+] Add',
        meta: { variant: 'primary', action: 'createRecord' },
      },
      {
        id: 'tbl-main',
        type: 'table',
        rect: { x: 1, y: 3, w: tblW, h: 6 },
        zIndex: 1,
        meta: {
          tableColumns: [
            { title: 'ID', width: 6, align: 'left' },
            { title: 'Customer', width: 14, align: 'left' },
            { title: 'Status', width: 10, align: 'center' },
          ],
          tableRows: [
            ['#101', 'Acme Corp', 'Active'],
            ['#102', 'Stark Ind', 'Active'],
            ['#103', 'Wayne Ent', 'Pending'],
          ],
        },
      },
    ];
  }

  // 4. Default: Modern Card Component
  return [
    {
      id: 'default-card',
      type: 'container',
      rect: { x: 2, y: 2, w: Math.min(screenW - 4, 28), h: 12 },
      zIndex: 0,
      label: 'Generated Component',
      children: [
        {
          id: 'card-title',
          type: 'text',
          rect: { x: 4, y: 4, w: 20, h: 1 },
          zIndex: 1,
          label: prompt.slice(0, 20),
        },
        {
          id: 'card-prog',
          type: 'progress',
          rect: { x: 4, y: 6, w: 20, h: 1 },
          zIndex: 1,
          meta: { progressValue: 65 },
        },
        {
          id: 'card-action',
          type: 'button',
          rect: { x: 4, y: 8, w: 14, h: 1 },
          zIndex: 1,
          label: 'Proceed',
          meta: { variant: 'primary', action: 'proceed' },
        },
      ],
    },
  ];
}
