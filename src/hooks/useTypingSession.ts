import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, type SessionSnapshot, type TypingMode } from '../lib/session';

export interface UseTypingSessionOptions {
  text: string;
  /** null — свободный режим; число — длительность таймера в секундах. */
  seconds: number | null;
}

function toMode(seconds: number | null): TypingMode {
  return seconds === null ? { type: 'free' } : { type: 'timed', seconds };
}

export function useTypingSession({ text, seconds }: UseTypingSessionOptions) {
  const sessionRef = useRef(createSession({ text, mode: toMode(seconds) }));
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => sessionRef.current.snapshot());

  // Пересоздаём сессию при смене текста или режима.
  useEffect(() => {
    sessionRef.current = createSession({ text, mode: toMode(seconds) });
    setSnapshot(sessionRef.current.snapshot());
  }, [text, seconds]);

  const input = useCallback((key: string) => {
    setSnapshot(sessionRef.current.input(key));
  }, []);

  const restart = useCallback(() => {
    setSnapshot(sessionRef.current.restart());
  }, []);

  const deleteWord = useCallback(() => {
    setSnapshot(sessionRef.current.deleteWord());
  }, []);

  const skipWord = useCallback(() => {
    setSnapshot(sessionRef.current.skipWord());
  }, []);

  // Живой тик для таймера и метрик (WPM/CPM/accuracy).
  useEffect(() => {
    const id = setInterval(() => {
      setSnapshot(sessionRef.current.snapshot());
    }, 200);
    return () => clearInterval(id);
  }, []);

  return { snapshot, input, restart, deleteWord, skipWord };
}
