import { useCallback, useEffect, useRef, useState } from 'react';
import { countWords, createEcho, echoInput, type EchoState } from '../lib/echo';
import { formatTime } from '../lib/format';

interface Props {
  suspended: boolean;
}

export function EchoMode({ suspended }: Props) {
  const [state, setState] = useState<EchoState>(() => createEcho());
  const [stopped, setStopped] = useState(false);
  const [started, setStarted] = useState(false);
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
    setStarted(false);
    setElapsedMs(0);
    startedAtRef.current = null;
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (suspended) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (stopped) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }
      if (e.key.length === 1 || e.key === 'Backspace') {
        e.preventDefault();
        if (startedAtRef.current === null) {
          startedAtRef.current = performance.now();
          setStarted(true);
        }
        setState((s) => echoInput(s, e.key));
      }
    },
    [suspended, stopped, stop],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (stopped) {
    return (
      <div className="results">
        <h2>Echo finished</h2>
        <div className="results-grid">
          <div className="stat">
            <div className="label">Characters</div>
            <div className="value">{state.text.length}</div>
          </div>
          <div className="stat">
            <div className="label">Words</div>
            <div className="value">{countWords(state.text)}</div>
          </div>
          <div className="stat">
            <div className="label">Time</div>
            <div className="value">{formatTime(elapsedMs)}</div>
          </div>
        </div>
        <button onClick={restart}>↻ Start over</button>
      </div>
    );
  }

  return (
    <>
      <div className="echo-toolbar">
        <div className="echo-summary">
          <span>Characters {state.text.length}</span>
          <span>Words {countWords(state.text)}</span>
        </div>
        <button onClick={stop}>Stop</button>
      </div>
      <div className="echo-area">
        {state.text}
        <span className={`caret${started ? ' caret-active' : ''}`} />
      </div>
      <p className="hint">
        <span>Type anything — it's just displayed.</span>
        <span className="kbd">Esc</span>
        <span>finish</span>
      </p>
    </>
  );
}
