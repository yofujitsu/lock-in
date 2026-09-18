import { useCallback, useEffect, useRef, useState } from 'react';
import { countWords, createEcho, echoInput, type EchoState } from '../lib/echo';
import { formatTime } from '../lib/format';

export function EchoMode() {
  const [state, setState] = useState<EchoState>(() => createEcho());
  const [stopped, setStopped] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    setStopped(true);
    if (startedAtRef.current !== null) {
      setElapsedMs(performance.now() - startedAtRef.current);
    }
  }, []);

  const restart = useCallback(() => {
    setState(createEcho());
    setStopped(false);
    setElapsedMs(0);
    startedAtRef.current = null;
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (stopped) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }
      if (e.key.length === 1 || e.key === 'Backspace') {
        e.preventDefault();
        if (startedAtRef.current === null) startedAtRef.current = performance.now();
        setState((s) => echoInput(s, e.key));
      }
    },
    [stop, stopped],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (stopped) {
    return (
      <div className="results">
        <h2>Эхо-режим завершён</h2>
        <div className="results-grid">
          <div className="stat">
            <div className="label">Символов</div>
            <div className="value">{state.text.length}</div>
          </div>
          <div className="stat">
            <div className="label">Слов</div>
            <div className="value">{countWords(state.text)}</div>
          </div>
          <div className="stat">
            <div className="label">Время</div>
            <div className="value">{formatTime(elapsedMs)}</div>
          </div>
        </div>
        <button onClick={restart}>↻ Начать заново</button>
      </div>
    );
  }

  return (
    <>
      <div className="echo-toolbar">
        <div className="echo-summary">
          <span>Символов {state.text.length}</span>
          <span>Слов {countWords(state.text)}</span>
        </div>
        <button onClick={stop}>Стоп</button>
      </div>
      <div className="echo-area">
        {state.text}
        <span className="caret" />
      </div>
      <p className="hint">
        <span>Печатайте что угодно — текст просто отображается.</span>
        <span className="kbd">Esc</span>
        <span>завершить</span>
      </p>
    </>
  );
}
