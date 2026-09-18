import { useCallback, useEffect, useRef } from 'react';
import { TypingArea } from './TypingArea';
import { Results } from './Results';
import { useTypingSession } from '../hooks/useTypingSession';
import { formatTime } from '../lib/format';
import type { ContentType, Language } from '../lib/dictionary';
import type { HistoryEntry } from '../lib/history';

interface Props {
  text: string;
  seconds: number | null;
  language: Language;
  contentType: ContentType;
  history: HistoryEntry[];
  onFinish: (entry: HistoryEntry) => void;
}

export function TypingTest({ text, seconds, language, contentType, history, onFinish }: Props) {
  const { snapshot, input, restart, deleteWord, skipWord } = useTypingSession({ text, seconds });

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // После завершения отдаём клавишам обычное поведение (Tab/фокус по кнопкам).
      if (snapshot.finished) return;
      if (e.metaKey || e.altKey) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        skipWord();
        return;
      }
      if (e.key === 'Backspace' && e.ctrlKey) {
        e.preventDefault();
        deleteWord();
        return;
      }
      if (e.key.length === 1 || e.key === 'Backspace') {
        e.preventDefault();
        input(e.key);
      }
    },
    [snapshot.finished, input, deleteWord, skipWord],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Сохраняем результат в историю ровно один раз при завершении сессии.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (snapshot.finished && !recordedRef.current) {
      recordedRef.current = true;
      onFinish({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        wpm: snapshot.metrics.wpm,
        cpm: snapshot.metrics.cpm,
        accuracy: snapshot.metrics.accuracy,
        elapsedMs: snapshot.metrics.elapsedMs,
        language,
        contentType,
        seconds,
      });
    } else if (!snapshot.finished) {
      recordedRef.current = false;
    }
  }, [snapshot.finished]);

  const finished = snapshot.finished;

  return (
    <>
      <div className="stats">
        <div className="stat-item">
          <span className="stat-label">WPM</span>
          <span className="stat-value">{snapshot.metrics.wpm.toFixed(1)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">CPM</span>
          <span className="stat-value">{snapshot.metrics.cpm.toFixed(1)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Точность</span>
          <span className="stat-value">{snapshot.metrics.accuracyPercent.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Время</span>
          <span className="stat-value">{formatTime(snapshot.elapsedMs)}</span>
        </div>
        {seconds !== null && (
          <div className="stat-item">
            <span className="stat-label">Осталось</span>
            <span className="stat-value">{formatTime(snapshot.timeLeftMs ?? 0)}</span>
          </div>
        )}
      </div>

      {finished ? (
        <Results metrics={snapshot.metrics} onRestart={restart} history={history} />
      ) : (
        <TypingArea engine={snapshot.engine} />
      )}

      <p className="hint">
        <span className="kbd">Ctrl+Backspace</span>
        <span>стереть слово</span>
        <span className="kbd">Tab</span>
        <span>пропустить слово</span>
        <span className="kbd">Backspace</span>
        <span>назад</span>
      </p>
    </>
  );
}
