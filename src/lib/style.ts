export type PaletteId = 'dusk' | 'cocoa' | 'mocha-sage' | 'mushroom' | 'espresso';
export type ThemeMode = 'light' | 'dark';
export type ThemeChoice = 'light' | 'dark' | 'system';
export type ErrorMode = 'strong' | 'soft' | 'line';

export interface StyleSettings {
  palette: PaletteId;
  theme: ThemeChoice;
  uiFont: string;
  textFont: string;
  size: number;
  err: ErrorMode;
}

export interface PaletteColors {
  bg: string;
  card: string;
  line: string;
  untyped: string;
  typed: string;
  accent: string;
  err: string;
  onAccent: string;
}

export interface Palette {
  id: PaletteId;
  name: string;
  description: string;
  light: PaletteColors;
  dark: PaletteColors;
  uiFont: string;
  textFont: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Dusty lavender + slate',
    uiFont: 'Onest',
    textFont: 'IBM Plex Mono',
    light: { bg: '#F5F5F8', card: '#FFFFFF', line: '#E6E7EE', untyped: '#AEB2C2', typed: '#2B2D3A', accent: '#6C76C4', err: '#C4616F', onAccent: '#FFFFFF' },
    dark: { bg: '#15161C', card: '#1D1F27', line: '#2A2D38', untyped: '#565B6E', typed: '#D3D6E2', accent: '#A5AEE8', err: '#D98E9A', onAccent: '#15161C' },
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    description: 'Cocoa + caramel',
    uiFont: 'Nunito',
    textFont: 'Fira Mono',
    light: { bg: '#F9F4EE', card: '#FFFFFF', line: '#ECE2D8', untyped: '#B7A79A', typed: '#362A20', accent: '#A8722B', err: '#C4453D', onAccent: '#FFFFFF' },
    dark: { bg: '#1B1512', card: '#251D19', line: '#362B25', untyped: '#6F5F55', typed: '#EADFD5', accent: '#D9A566', err: '#E0736A', onAccent: '#1B1512' },
  },
  {
    id: 'mocha-sage',
    name: 'Mocha Sage',
    description: 'Mocha + sage',
    uiFont: 'Manrope',
    textFont: 'IBM Plex Mono',
    light: { bg: '#F6F3EC', card: '#FFFFFF', line: '#E9E4D8', untyped: '#B3AB9B', typed: '#2E2B22', accent: '#6B8358', err: '#C2483F', onAccent: '#FFFFFF' },
    dark: { bg: '#191612', card: '#221E19', line: '#322D26', untyped: '#6A6458', typed: '#E6E0D4', accent: '#A6B98F', err: '#E07A70', onAccent: '#191612' },
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    description: 'Warm taupe + dusty plum',
    uiFont: 'Onest',
    textFont: 'JetBrains Mono',
    light: { bg: '#F7F3F3', card: '#FFFFFF', line: '#EBE4E5', untyped: '#B5AAAE', typed: '#2F282B', accent: '#94667F', err: '#C4453D', onAccent: '#FFFFFF' },
    dark: { bg: '#191617', card: '#221E1F', line: '#322C2E', untyped: '#6B6266', typed: '#E8E0E1', accent: '#C7A6B8', err: '#E5796F', onAccent: '#191617' },
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Coffee + cream',
    uiFont: 'Golos Text',
    textFont: 'Roboto Mono',
    light: { bg: '#FAF6F1', card: '#FFFFFF', line: '#EEE5DB', untyped: '#BBAC9F', typed: '#2B211A', accent: '#7A5A44', err: '#C23B33', onAccent: '#FFFFFF' },
    dark: { bg: '#16110F', card: '#1F1917', line: '#2F2622', untyped: '#6B5D55', typed: '#EFE4DA', accent: '#E6D3BC', err: '#E5675E', onAccent: '#16110F' },
  },
];

export const UI_FONTS = ['Onest', 'Manrope', 'Nunito', 'Golos Text', 'Inter'] as const;
export const TEXT_FONTS = ['IBM Plex Mono', 'JetBrains Mono', 'Fira Mono', 'Roboto Mono'] as const;

export const UI_FONT_STACKS: Record<string, string> = {
  Onest: "'Onest', system-ui, sans-serif",
  Manrope: "'Manrope', system-ui, sans-serif",
  Nunito: "'Nunito', system-ui, sans-serif",
  'Golos Text': "'Golos Text', system-ui, sans-serif",
  Inter: "'Inter', system-ui, sans-serif",
};

export const TEXT_FONT_STACKS: Record<string, string> = {
  'IBM Plex Mono': "'IBM Plex Mono', ui-monospace, monospace",
  'JetBrains Mono': "'JetBrains Mono', ui-monospace, monospace",
  'Fira Mono': "'Fira Mono', ui-monospace, monospace",
  'Roboto Mono': "'Roboto Mono', ui-monospace, monospace",
};

export const DEFAULT_PALETTE: PaletteId = 'dusk';
export const DEFAULT_SIZE = 30;
export const DEFAULT_ERR: ErrorMode = 'strong';
export const MIN_SIZE = 20;
export const MAX_SIZE = 38;

const STORAGE_KEY = 'lockin-style';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function systemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(settings: Pick<StyleSettings, 'theme'>): ThemeMode {
  return settings.theme === 'system' ? systemTheme() : settings.theme;
}

export function paletteFonts(id: PaletteId): { uiFont: string; textFont: string } {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  return { uiFont: p.uiFont, textFont: p.textFont };
}

export function defaultSettings(): StyleSettings {
  const fonts = paletteFonts(DEFAULT_PALETTE);
  return {
    palette: DEFAULT_PALETTE,
    theme: 'system',
    uiFont: fonts.uiFont,
    textFont: fonts.textFont,
    size: DEFAULT_SIZE,
    err: DEFAULT_ERR,
  };
}

function sanitize(raw: unknown): StyleSettings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const palette = PALETTES.some((p) => p.id === r.palette) ? (r.palette as PaletteId) : d.palette;
  const theme =
    r.theme === 'light' || r.theme === 'dark' || r.theme === 'system'
      ? (r.theme as ThemeChoice)
      : d.theme;
  const err = r.err === 'strong' || r.err === 'soft' || r.err === 'line' ? (r.err as ErrorMode) : d.err;
  const size =
    typeof r.size === 'number' && r.size >= MIN_SIZE && r.size <= MAX_SIZE
      ? Math.round(r.size)
      : d.size;
  const uiFont =
    typeof r.uiFont === 'string' && (UI_FONTS as readonly string[]).includes(r.uiFont)
      ? r.uiFont
      : d.uiFont;
  const textFont =
    typeof r.textFont === 'string' && (TEXT_FONTS as readonly string[]).includes(r.textFont)
      ? r.textFont
      : d.textFont;
  return { palette, theme, uiFont, textFont, size, err };
}

export function loadStyle(storage: StorageLike = localStorage): StyleSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function saveStyle(settings: StyleSettings, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function applyStyle(settings: StyleSettings): void {
  const root = document.documentElement;
  root.dataset.palette = settings.palette;
  root.dataset.theme = resolveTheme(settings);
  root.dataset.err = settings.err;
  const style = root.style;
  style.setProperty('--font-ui', UI_FONT_STACKS[settings.uiFont] ?? UI_FONT_STACKS.Onest);
  style.setProperty('--font-text', TEXT_FONT_STACKS[settings.textFont] ?? TEXT_FONT_STACKS['IBM Plex Mono']);
  style.setProperty('--text-size', `${settings.size}px`);
}
