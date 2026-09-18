import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { TypingTest } from './components/TypingTest';
import { EchoMode } from './components/EchoMode';
import {
  generateSentences,
  generateWords,
  type ContentType,
  type Language,
} from './lib/dictionary';
import { addHistoryEntry, loadHistory, type HistoryEntry } from './lib/history';

const DURATIONS = [15, 30, 60, 120, 300];

type Mode = 'echo' | 'free' | 'timed';

type Theme = 'light' | 'dark';

function loadTheme(): Theme {
  try {
    return localStorage.getItem('typing-trainer.theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function select(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    action();
    e.currentTarget.blur();
  };
}

function buildText(language: Language, contentType: ContentType, seconds: number | null): string {
  if (contentType === 'sentences') {
    const count = seconds === null ? 4 : Math.max(4, Math.ceil(seconds / 12));
    return generateSentences(language, count);
  }
  const count = seconds === null ? 80 : Math.max(80, Math.min(seconds * 2, 400));
  return generateWords(language, count);
}

export default function App() {
  const [mode, setMode] = useState<Mode>('timed');
  const [seconds, setSeconds] = useState(30);
  const [language, setLanguage] = useState<Language>('en');
  const [contentType, setContentType] = useState<ContentType>('words');
  const [nonce, setNonce] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('typing-trainer.theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const text = useMemo(
    () => buildText(language, contentType, mode === 'timed' ? seconds : null),
    [language, contentType, seconds, mode, nonce],
  );

  const handleFinish = useCallback((entry: HistoryEntry) => {
    setHistory(addHistoryEntry(entry));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const sessionSeconds = mode === 'timed' ? seconds : null;

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand">Typing Trainer</div>
        <div className="header-actions">
          {mode !== 'echo' && (
            <button onClick={select(() => setNonce((n) => n + 1))}>Другой текст</button>
          )}
          <button
            className="icon-btn"
            onClick={select(toggleTheme)}
            aria-label="Переключить тему"
            title="Светлая / тёмная тема"
          >
            {theme === 'light' ? (
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
        </div>
      </header>

      <div className="settings">
        <div className="group">
          <div className="group-label">Режим</div>
          <div className="seg">
            <button className={mode === 'echo' ? 'active' : ''} onClick={select(() => setMode('echo'))}>
              Эхо
            </button>
            <button className={mode === 'free' ? 'active' : ''} onClick={select(() => setMode('free'))}>
              Свободно
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
              <div className="group-label">Язык</div>
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
              <div className="group-label">Набор</div>
              <div className="seg">
                <button
                  className={contentType === 'words' ? 'active' : ''}
                  onClick={select(() => setContentType('words'))}
                >
                  Слова
                </button>
                <button
                  className={contentType === 'sentences' ? 'active' : ''}
                  onClick={select(() => setContentType('sentences'))}
                >
                  Предложения
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {mode === 'echo' ? (
        <EchoMode />
      ) : (
        <TypingTest
          text={text}
          seconds={sessionSeconds}
          language={language}
          contentType={contentType}
          history={history}
          onFinish={handleFinish}
        />
      )}
    </main>
  );
}
