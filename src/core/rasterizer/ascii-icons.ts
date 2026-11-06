import { Rect } from '../ast/types.js';

export interface AsciiIconSprite {
  name: string;
  title: string;
  aliases?: string[];
  keywords?: string[];
  glyph: string;
  art3: string[];
  art5?: string[];
}

export const ASCII_ICON_SAFE_CHARS = /^[\x20-\x7E\u2500-\u257F\u2580-\u259F]*$/;

export const ASCII_ICON_CATALOG: readonly AsciiIconSprite[] = [
  {
    name: 'user',
    title: 'User / Profile',
    aliases: ['profile', 'avatar', 'account'],
    keywords: ['user', 'profile', 'avatar', 'account', 'person', 'member', 'auth', 'login', 'me'],
    glyph: '(@)',
    art3: [
      '  ╭─╮  ',
      '  ╰┬╯  ',
      ' ╭─┴─╮ ',
    ],
    art5: [
      '   ╭───╮   ',
      '   │   │   ',
      '   ╰─┬─╯   ',
      ' ╭───┴───╮ ',
      ' │       │ ',
    ],
  },
  {
    name: 'search',
    title: 'Search / Find',
    aliases: ['find', 'lookup', 'query'],
    keywords: ['search', 'find', 'lookup', 'query', 'filter', 'explore', 'discover'],
    glyph: '[⌕]',
    art3: [
      ' ╭──╮  ',
      ' ╰──╯╲ ',
      '     ╲╲',
    ],
    art5: [
      '  ╭─────╮  ',
      '  │     │  ',
      '  ╰─────╯  ',
      '        ╲╲ ',
      '         ╲╲',
    ],
  },
  {
    name: 'lock',
    title: 'Lock / Security',
    aliases: ['security', 'secure', 'auth', 'password'],
    keywords: ['lock', 'security', 'secure', 'password', 'protect', 'private', 'auth'],
    glyph: '[#]',
    art3: [
      '  ╭─╮  ',
      ' ┌┴─┴┐ ',
      ' └─█─┘ ',
    ],
    art5: [
      '   ╭───╮   ',
      '   │   │   ',
      ' ┌─┴───┴─┐ ',
      ' │   █   │ ',
      ' └───────┘ ',
    ],
  },
  {
    name: 'gear',
    title: 'Settings / Config',
    aliases: ['settings', 'config', 'preferences', 'setup'],
    keywords: ['settings', 'gear', 'config', 'configure', 'setup', 'preferences', 'options', 'tuning'],
    glyph: '[☼]',
    art3: [
      ' ▖╭─╮▗ ',
      ' ─┤o├─ ',
      ' ▘╰─╯▝ ',
    ],
  },
  {
    name: 'bell',
    title: 'Notifications / Bell',
    aliases: ['notify', 'alert', 'notifications'],
    keywords: ['bell', 'notify', 'notification', 'notifications', 'alert', 'remind', 'alarm'],
    glyph: '[▲]',
    art3: [
      '  ╭─╮  ',
      ' ╱   ╲ ',
      ' ▔▔╹▔▔ ',
    ],
  },
  {
    name: 'chart',
    title: 'Chart / Analytics',
    aliases: ['analytics', 'stats', 'metrics', 'graph', 'report'],
    keywords: ['chart', 'analytics', 'stats', 'metrics', 'graph', 'report', 'revenue', 'overview', 'performance'],
    glyph: '[∐]',
    art3: [
      '│   ▃ █',
      '│ ▅ █ █',
      '└──────',
    ],
    art5: [
      '│        █ ',
      '│     ▆  █ ',
      '│  ▃  █  █ ',
      '│  █  █  █ ',
      '└─────────╴',
    ],
  },
  {
    name: 'cloud',
    title: 'Cloud / Deploy',
    aliases: ['deploy', 'server', 'hosting', 'upload'],
    keywords: ['cloud', 'deploy', 'deployment', 'server', 'hosting', 'cluster', 'upload', 'sync'],
    glyph: '[☁]',
    art3: [
      '  ╭──╮ ',
      '╭─╯  ╰╮',
      '╰─────╯',
    ],
    art5: [
      '    ╭───╮  ',
      '  ╭─╯   ╰╮ ',
      ' ╭╯      ╰╮',
      ' │        │',
      ' ╰────────╯',
    ],
  },
  {
    name: 'camera',
    title: 'Camera / Photo',
    aliases: ['photo', 'snapshot', 'capture'],
    keywords: ['camera', 'photo', 'snapshot', 'capture', 'picture', 'shot', 'lens'],
    glyph: '[📷]',
    art3: [
      '┌─┬─┬─┐',
      '│ (o) │',
      '└─────┘',
    ],
    art5: [
      '  ┌───┐    ',
      '┌─┴───┴───┐',
      '│  ╭───╮ ▀│',
      '│  ╰───╯  │',
      '└─────────┘',
    ],
  },
  {
    name: 'image',
    title: 'Image / Media',
    aliases: ['img', 'picture', 'artwork', 'media'],
    keywords: ['image', 'img', 'picture', 'artwork', 'media', 'gallery', 'wallpaper'],
    glyph: '[IMG]',
    art3: [
      '┌─────┐',
      '│ ╱╲o │',
      '└─────┘',
    ],
    art5: [
      '┌─────────┐',
      '│      o  │',
      '│  ╱╲     │',
      '│ ╱  ╲╱╲  │',
      '└─────────┘',
    ],
  },
  {
    name: 'mail',
    title: 'Mail / Inbox',
    aliases: ['email', 'inbox', 'message', 'letter'],
    keywords: ['mail', 'email', 'inbox', 'message', 'messages', 'letter', 'send', 'invite', 'contact'],
    glyph: '[✉]',
    art3: [
      '┌─────┐',
      '│╲___╱│',
      '└─────┘',
    ],
    art5: [
      '┌─────────┐',
      '│╲       ╱│',
      '│ ╲_____╱ │',
      '│         │',
      '└─────────┘',
    ],
  },
  {
    name: 'home',
    title: 'Home / Dashboard',
    aliases: ['main', 'start', 'house'],
    keywords: ['home', 'main', 'start', 'house', 'dashboard', 'root', 'landing'],
    glyph: '[⌂]',
    art3: [
      '  ╱╲  ',
      ' ╱  ╲ ',
      ' │▐▌│ ',
    ],
    art5: [
      '    ╱╲     ',
      '   ╱  ╲    ',
      '  ╱    ╲   ',
      '  │ ┌┐ │   ',
      '  └─┴┴─┘   ',
    ],
  },
  {
    name: 'folder',
    title: 'Folder / Directory',
    aliases: ['dir', 'directory', 'archive'],
    keywords: ['folder', 'dir', 'directory', 'archive', 'files', 'projects', 'categories'],
    glyph: '[+]',
    art3: [
      '╭──╮   ',
      '├──┴──╮',
      '╰─────╯',
    ],
  },
  {
    name: 'file',
    title: 'File / Document',
    aliases: ['doc', 'document', 'page'],
    keywords: ['file', 'doc', 'document', 'page', 'note', 'article', 'sheet'],
    glyph: '[-]',
    art3: [
      '┌────╮',
      '│ ══ │',
      '└────┘',
    ],
  },
  {
    name: 'heart',
    title: 'Heart / Favorite',
    aliases: ['fav', 'favorite', 'like', 'love'],
    keywords: ['heart', 'fav', 'favorite', 'like', 'love', 'health', 'bookmark'],
    glyph: '[♥]',
    art3: [
      ' ▄▄ ▄▄ ',
      ' ▀███▀ ',
      '   ▀   ',
    ],
  },
  {
    name: 'star',
    title: 'Star / Featured',
    aliases: ['featured', 'bookmark', 'rating'],
    keywords: ['star', 'featured', 'rating', 'badge', 'top', 'new', 'create', 'launch'],
    glyph: '[★]',
    art3: [
      '   ╻   ',
      ' ━━╋━━ ',
      '  ╱ ╲  ',
    ],
  },
  {
    name: 'cart',
    title: 'Cart / Shop',
    aliases: ['shop', 'checkout', 'basket', 'ecommerce'],
    keywords: ['cart', 'shop', 'shopping', 'checkout', 'basket', 'buy', 'order', 'purchase', 'pay', 'transfer'],
    glyph: '[🛒]',
    art3: [
      '╶╮     ',
      ' ╰▄▄▄▄╱',
      '  o  o ',
    ],
  },
  {
    name: 'terminal',
    title: 'Terminal / Code',
    aliases: ['cli', 'console', 'code', 'dev'],
    keywords: ['terminal', 'cli', 'console', 'code', 'dev', 'cmd', 'shell', 'bash', 'run'],
    glyph: '[>_]',
    art3: [
      '┌─────┐',
      '│ >_  │',
      '└─────┘',
    ],
  },
];

export function getAsciiIconSprite(key: string): AsciiIconSprite {
  if (!key) return ASCII_ICON_CATALOG[3]; // default gear
  const norm = key.trim().toLowerCase().replace(/^icon:/, '').replace(/[{}\[\]]/g, '');
  for (const sprite of ASCII_ICON_CATALOG) {
    if (sprite.name === norm) return sprite;
    if (sprite.aliases && sprite.aliases.includes(norm)) return sprite;
  }
  return ASCII_ICON_CATALOG[3]; // fallback to gear
}

export function resolveIconKey(raw: string | undefined): { iconKey: string; caption?: string } {
  if (!raw || !raw.trim()) {
    return { iconKey: 'gear' };
  }
  const text = raw.trim();
  // Check {name} or {icon:name}
  const macroMatch = text.match(/^\{([a-z0-9_-]+)(?::([a-z0-9_-]+))?\}(.*)$/i);
  if (macroMatch) {
    const rawKey = macroMatch[2] ? macroMatch[2] : macroMatch[1];
    const rest = macroMatch[3].trim();
    return {
      iconKey: rawKey.toLowerCase(),
      caption: rest || undefined,
    };
  }

  // Check if first word is an icon name
  const parts = text.split(/\s+/);
  const candidate = parts[0].toLowerCase();
  for (const s of ASCII_ICON_CATALOG) {
    if (s.name === candidate || (s.aliases && s.aliases.includes(candidate))) {
      const rest = parts.slice(1).join(' ').trim();
      return {
        iconKey: s.name,
        caption: rest || undefined,
      };
    }
  }

  return { iconKey: text.toLowerCase(), caption: undefined };
}

export function inferIconFromActionOrLabel(action?: string, label?: string): AsciiIconSprite | null {
  const haystack = `${action || ''} ${label || ''}`.toLowerCase();
  if (!haystack.trim()) return null;

  for (const sprite of ASCII_ICON_CATALOG) {
    if (sprite.keywords) {
      for (const kw of sprite.keywords) {
        // Word boundary match or substring in lower
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(haystack)) {
          return sprite;
        }
      }
    }
  }
  return null;
}

export function pickIconTier(
  sprite: AsciiIconSprite,
  w: number,
  h: number,
  hasCaption: boolean
): { rows: string[]; captionFits: boolean } | null {
  if (h < 3) return null;

  // 1. Try art5 tier if available
  if (sprite.art5) {
    const art5W = sprite.art5[0].length;
    const art5H = sprite.art5.length;
    const reqHWithCap = hasCaption ? art5H + 1 : art5H;
    if (w >= art5W && h >= reqHWithCap) {
      return { rows: sprite.art5, captionFits: hasCaption };
    }
    if (w >= art5W && h >= art5H) {
      return { rows: sprite.art5, captionFits: false };
    }
  }

  // 2. Try art3 tier
  const art3W = sprite.art3[0].length;
  const art3H = sprite.art3.length;
  const reqHWithCap = hasCaption ? art3H + 1 : art3H;
  if (w >= art3W && h >= reqHWithCap) {
    return { rows: sprite.art3, captionFits: hasCaption };
  }
  if (w >= art3W && h >= art3H) {
    return { rows: sprite.art3, captionFits: false };
  }

  return null;
}
