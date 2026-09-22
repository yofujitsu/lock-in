import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import logoUrl from '../logo.png';
import { openUrl } from '@tauri-apps/plugin-opener';
import { TypingTest } from './components/TypingTest';
import { EchoMode } from './components/EchoMode';
import { Profile } from './components/Profile';
import { ChangelogModal } from './components/ChangelogModal';
import { StylePanel } from './components/StylePanel';
import { useStyle } from './hooks/useStyle';
import { useAiSettings } from './hooks/useAiSettings';
import { useAiWords } from './hooks/useAiWords';
import { resolveTheme } from './lib/style';
import {
  generateText,
  STATIC_SOURCE,
  wordTopicLabel,
  WORD_TOPICS,
  type ContentType,
  type Language,
  type WordTopic,
} from './lib/dictionary';
import { addHistoryEntry, clearHistory, loadHistory, type HistoryEntry } from './lib/history';
import { APP_VERSION } from './lib/changelog';

const DURATIONS = [15, 30, 60, 120, 300];

type Mode = 'echo' | 'free' | 'timed';
type View = 'practice' | 'profile';

function select(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    action();
    e.currentTarget.blur();
  };
}

function openExternal(url: string): void {
  if ('__TAURI_INTERNALS__' in window) {
    void openUrl(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function App() {
  const { style, update, selectPalette, reset } = useStyle();
  const [view, setView] = useState<View>('practice');
  const [mode, setMode] = useState<Mode>('timed');
  const [seconds, setSeconds] = useState(30);
  const [language, setLanguage] = useState<Language>('en');
  const [contentType, setContentType] = useState<ContentType>('words');
  const [wordTopic, setWordTopic] = useState<WordTopic>('general');
  const [customMode, setCustomMode] = useState(false);
  const aiSettings = useAiSettings();
  const ai = useAiWords();
  const [nonce, setNonce] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [styleOpen, setStyleOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const stylePanelRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef<HTMLButtonElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!styleOpen) return;
    const onDown = (e: Event) => {
      const t = e.target as Node;
      if (stylePanelRef.current?.contains(t) || styleButtonRef.current?.contains(t)) return;
      setStyleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStyleOpen(false);
        styleButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [styleOpen]);

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (styleOpen) stylePanelRef.current?.focus();
  }, [styleOpen]);

  const activeCustomList = customMode ? (ai.customList ?? undefined) : undefined;
  const text = useMemo(
    () =>
      generateText(
        language,
        contentType,
        mode === 'timed' ? seconds : null,
        wordTopic,
        Math.random,
        STATIC_SOURCE,
        activeCustomList,
      ),
    [language, contentType, seconds, mode, nonce, wordTopic, activeCustomList],
  );

  const handleFinish = useCallback((entry: HistoryEntry) => {
    setHistory(addHistoryEntry(entry));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const toggleTheme = useCallback(() => {
    const resolved = resolveTheme(style);
    update({ theme: resolved === 'light' ? 'dark' : 'light' });
  }, [style, update]);

  const sessionSeconds = mode === 'timed' ? seconds : null;

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand">
          <img src={logoUrl} alt="" className="brand-logo" />
          lock the f..k in
        </div>
        <nav className="nav">
          <button className={view === 'practice' ? 'active' : ''} onClick={select(() => setView('practice'))}>
            Practice
          </button>
          <button className={view === 'profile' ? 'active' : ''} onClick={select(() => setView('profile'))}>
            Profile
          </button>
        </nav>
        <div className="header-actions">
          {view === 'practice' && mode !== 'echo' && (
            <button className="btn-icon" onClick={select(() => setNonce((n) => n + 1))}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          )}
          <div className="style-popover">
            <button
              ref={styleButtonRef}
              className={`icon-btn${styleOpen ? ' active' : ''}`}
              onClick={() => setStyleOpen((o) => !o)}
              aria-label="Style settings"
              aria-expanded={styleOpen}
              aria-controls="style-panel"
              aria-haspopup="dialog"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
            {styleOpen && (
              <StylePanel
                ref={stylePanelRef}
                style={style}
                onUpdate={update}
                onSelectPalette={selectPalette}
                onReset={reset}
                aiSettings={aiSettings.settings}
                onUpdateAi={aiSettings.update}
              />
            )}
          </div>
          <button className="icon-btn" onClick={select(toggleTheme)} aria-label="Toggle theme" title="Light / dark theme">
            {resolveTheme(style) === 'light' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>
          <button
            className="icon-btn"
            onClick={select(() => openExternal('https://github.com/yofujitsu/lock-in'))}
            aria-label="GitHub repository"
            title="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </button>
          <button ref={versionRef} className="version-btn" onClick={() => setChangelogOpen(true)} aria-haspopup="dialog">
            v{APP_VERSION}
          </button>
        </div>
      </header>

      {view === 'practice' ? (
        <>
          <div className="settings">
            <div className="group">
              <div className="group-label">Mode</div>
              <div className="seg">
                <button className={mode === 'echo' ? 'active' : ''} onClick={select(() => setMode('echo'))}>
                  Echo
                </button>
                <button className={mode === 'free' ? 'active' : ''} onClick={select(() => setMode('free'))}>
                  Free
                </button>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={mode === 'timed' && seconds === d ? 'active' : ''}
                    onClick={select(() => {
                      setMode('timed');
                      setSeconds(d);
                    })}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {mode !== 'echo' && (
              <>
                <div className="group">
                  <div className="group-label">Language</div>
                  <div className="seg">
                    <button className={language === 'en' ? 'active' : ''} onClick={select(() => setLanguage('en'))}>
                      EN
                    </button>
                    <button className={language === 'ru' ? 'active' : ''} onClick={select(() => setLanguage('ru'))}>
                      RU
                    </button>
                  </div>
                </div>
                <div className="group">
                  <div className="group-label">Text</div>
                  <div className="seg">
                    <button
                      className={contentType === 'words' ? 'active' : ''}
                      onClick={select(() => setContentType('words'))}
                    >
                      Words
                    </button>
                    <button
                      className={contentType === 'sentences' ? 'active' : ''}
                      onClick={select(() => setContentType('sentences'))}
                    >
                      Sentences
                    </button>
                    <button
                      className={contentType === 'quotes' ? 'active' : ''}
                      onClick={select(() => setContentType('quotes'))}
                    >
                      Quotes
                    </button>
                    <button
                      className={contentType === 'passages' ? 'active' : ''}
                      onClick={select(() => setContentType('passages'))}
                    >
                      Passages
                    </button>
                  </div>
                </div>
                {contentType === 'words' && (
                  <>
                    <div className="group">
                      <div className="group-label">Topic</div>
                      <div className="seg">
                        {WORD_TOPICS.map((t) => (
                          <button
                            key={t}
                            className={!customMode && wordTopic === t ? 'active' : ''}
                            onClick={select(() => {
                              setCustomMode(false);
                              setWordTopic(t);
                            })}
                          >
                            {wordTopicLabel(t)}
                          </button>
                        ))}
                        <button
                          className={customMode ? 'active' : ''}
                          onClick={select(() => setCustomMode(true))}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                    {customMode && (
                      <div className="group">
                        <div className="group-label">Custom topic</div>
                        <div className="ai-row">
                          <input
                            className="ai-input"
                            type="text"
                            placeholder="e.g. sailing"
                            value={ai.customTopic}
                            onChange={(e) => ai.setCustomTopic(e.target.value)}
                          />
                          <button
                            className="ai-btn"
                            disabled={ai.busy || !ai.customTopic.trim()}
                            onClick={() => ai.generate(language, ai.customTopic.trim())}
                          >
                            {ai.busy ? '…' : 'Generate'}
                          </button>
                          {ai.customList && (
                            <button className="ai-btn" onClick={() => ai.generate(language, ai.customTopic.trim(), true)}>
                              Regenerate
                            </button>
                          )}
                        </div>
                        {ai.error && <p className="ai-error">{ai.error}</p>}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {mode === 'echo' ? (
            <EchoMode suspended={styleOpen} />
          ) : (
            <TypingTest
              text={text.text}
              attribution={text.attribution}
              seconds={sessionSeconds}
              language={language}
              contentType={contentType}
              history={history}
              onFinish={handleFinish}
              suspended={styleOpen}
            />
          )}
        </>
      ) : (
        <Profile history={history} onClear={handleClearHistory} />
      )}

      {changelogOpen && (
        <ChangelogModal
          onClose={() => {
            setChangelogOpen(false);
            versionRef.current?.focus();
          }}
        />
      )}
    </main>
  );
}
