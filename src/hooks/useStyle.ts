import { useCallback, useEffect, useState } from 'react';
import {
  applyStyle,
  defaultSettings,
  loadStyle,
  paletteFonts,
  saveStyle,
  systemTheme,
  type PaletteId,
  type StyleSettings,
} from '../lib/style';

export function useStyle() {
  const [style, setStyle] = useState<StyleSettings>(() => loadStyle());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemTheme() === 'dark');

  // Follow OS theme changes while the user hasn't picked a theme manually.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyStyle(style);
    saveStyle(style);
  }, [style, systemDark]);

  const update = useCallback((patch: Partial<StyleSettings>) => {
    setStyle((s) => ({ ...s, ...patch }));
  }, []);

  const selectPalette = useCallback((palette: PaletteId) => {
    const fonts = paletteFonts(palette);
    setStyle((s) => ({ ...s, palette, uiFont: fonts.uiFont, textFont: fonts.textFont }));
  }, []);

  const reset = useCallback(() => {
    setStyle(defaultSettings());
  }, []);

  return { style, update, selectPalette, reset };
}
