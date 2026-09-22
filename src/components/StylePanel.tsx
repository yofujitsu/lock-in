import { forwardRef } from 'react';
import {
  MAX_SIZE,
  MIN_SIZE,
  PALETTES,
  TEXT_FONTS,
  TEXT_FONT_STACKS,
  UI_FONTS,
  UI_FONT_STACKS,
  resolveTheme,
  type PaletteId,
  type StyleSettings,
  type ThemeMode,
} from '../lib/style';
import { type AiSettings } from '../lib/ai';

interface Props {
  style: StyleSettings;
  onUpdate: (patch: Partial<StyleSettings>) => void;
  onSelectPalette: (id: PaletteId) => void;
  onReset: () => void;
  aiSettings: AiSettings;
  onUpdateAi: (patch: Partial<AiSettings>) => void;
}

function swatches(p: (typeof PALETTES)[number], theme: ThemeMode): string[] {
  const c = theme === 'dark' ? p.dark : p.light;
  return [c.bg, c.card, c.untyped, c.typed, c.accent, c.err];
}

export const StylePanel = forwardRef<HTMLDivElement, Props>(function StylePanel(
  { style, onUpdate, onSelectPalette, onReset, aiSettings, onUpdateAi },
  ref,
) {
  const theme = resolveTheme(style);

  return (
    <div ref={ref} id="style-panel" className="style-panel" role="dialog" aria-label="Style settings" tabIndex={-1}>
      <section className="style-section">
        <div className="style-label">Palette</div>
        <div className="palette-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              className={`palette-card${style.palette === p.id ? ' active' : ''}`}
              aria-pressed={style.palette === p.id}
              onClick={() => onSelectPalette(p.id)}
            >
              <span className="palette-name">{p.name}</span>
              <span className="palette-swatches">
                {swatches(p, theme).map((c, i) => (
                  <span key={i} className="swatch" style={{ background: c }} />
                ))}
              </span>
              <span className="palette-desc">{p.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="style-section">
        <div className="style-label">Theme</div>
        <div className="seg" role="group" aria-label="Theme">
          <button className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => onUpdate({ theme: 'light' })}>
            Light
          </button>
          <button className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => onUpdate({ theme: 'dark' })}>
            Dark
          </button>
        </div>
      </section>

      <section className="style-section">
        <label className="style-label" htmlFor="ui-font">
          Interface font
        </label>
        <select id="ui-font" className="style-select" value={style.uiFont} onChange={(e) => onUpdate({ uiFont: e.target.value })}>
          {UI_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: UI_FONT_STACKS[f] }}>
              {f}
            </option>
          ))}
        </select>
      </section>

      <section className="style-section">
        <label className="style-label" htmlFor="text-font">
          Typing font
        </label>
        <select id="text-font" className="style-select" value={style.textFont} onChange={(e) => onUpdate({ textFont: e.target.value })}>
          {TEXT_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: TEXT_FONT_STACKS[f] }}>
              {f}
            </option>
          ))}
        </select>
      </section>

      <section className="style-section">
        <div className="style-label-row">
          <label className="style-label" htmlFor="text-size">
            Text size
          </label>
          <span className="style-value">{style.size}px</span>
        </div>
        <input
          id="text-size"
          className="style-range"
          type="range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          step={1}
          value={style.size}
          onChange={(e) => onUpdate({ size: Number(e.target.value) })}
        />
      </section>

      <section className="style-section">
        <div className="style-label">Show errors</div>
        <div className="seg" role="group" aria-label="Show errors">
          <button className={style.err === 'strong' ? 'active' : ''} aria-pressed={style.err === 'strong'} onClick={() => onUpdate({ err: 'strong' })}>
            Noticeable
          </button>
          <button className={style.err === 'soft' ? 'active' : ''} aria-pressed={style.err === 'soft'} onClick={() => onUpdate({ err: 'soft' })}>
            Soft
          </button>
          <button className={style.err === 'line' ? 'active' : ''} aria-pressed={style.err === 'line'} onClick={() => onUpdate({ err: 'line' })}>
            Underline
          </button>
        </div>
        <div className="style-hint">Type a wrong letter to see how it looks.</div>
      </section>

      <section className="style-section">
        <div className="style-label">AI word generator (optional)</div>
        <label className="style-label" htmlFor="ai-base">API base URL</label>
        <input id="ai-base" className="style-text" type="text" value={aiSettings.baseUrl} onChange={(e) => onUpdateAi({ baseUrl: e.target.value })} />
        <label className="style-label" htmlFor="ai-model">Model</label>
        <input id="ai-model" className="style-text" type="text" value={aiSettings.model} onChange={(e) => onUpdateAi({ model: e.target.value })} />
        <label className="style-label" htmlFor="ai-key">API key</label>
        <input id="ai-key" className="style-text" type="password" value={aiSettings.apiKey} onChange={(e) => onUpdateAi({ apiKey: e.target.value })} placeholder="sk-..." />
        <div className="style-hint">Stored locally; sent only to the base URL above.</div>
      </section>

      <button className="style-reset" onClick={onReset}>
        Reset style
      </button>
    </div>
  );
});
