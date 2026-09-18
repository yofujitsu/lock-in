import { calculateMetrics, type TypingMetrics } from './metrics';
import { createEngine, handleKey, isPrintableKey, type EngineState } from './engine';
import { deleteCurrentWord, skipWord } from './wordops';

export type TypingMode =
  | { type: 'free' }
  | { type: 'timed'; seconds: number };

export interface SessionOptions {
  text: string;
  mode: TypingMode;
  /** Монотонные часы в мс. По умолчанию performance.now(). Инъекция для тестов. */
  now?: () => number;
}

export interface SessionSnapshot {
  engine: EngineState;
  metrics: TypingMetrics;
  /** Таймер запущен (был хотя бы один печатный символ). */
  started: boolean;
  startedAt: number | null;
  elapsedMs: number;
  /** Оставшееся время в мс; null для режима free. */
  timeLeftMs: number | null;
  /** Текст набран полностью ИЛИ (для timed) время вышло. */
  finished: boolean;
  timedOut: boolean;
}

export function createSession(options: SessionOptions) {
  const now = options.now ?? (() => performance.now());
  let engine = createEngine(options.text);
  let startedAt: number | null = null;
  /** Время завершения (мс от старта), фиксируется в момент finished. */
  let endedElapsedMs: number | null = null;

  const timedSeconds = options.mode.type === 'timed' ? options.mode.seconds : null;

  function snapshot(): SessionSnapshot {
    let elapsedMs: number;
    if (endedElapsedMs !== null) {
      elapsedMs = endedElapsedMs;
    } else if (startedAt === null) {
      elapsedMs = 0;
    } else {
      elapsedMs = now() - startedAt;
    }

    const timeLeftMs =
      timedSeconds === null ? null : Math.max(0, timedSeconds * 1000 - elapsedMs);
    const timedOut = timedSeconds !== null && elapsedMs >= timedSeconds * 1000;
    const finished = engine.finished || timedOut;

    // Фиксируем итоговое время в момент завершения, чтобы метрики не «плыли»
    // (иначе после finish elapsedMs продолжал бы расти и WPM падал).
    if (finished && endedElapsedMs === null && startedAt !== null) {
      endedElapsedMs = elapsedMs;
    }

    return {
      engine,
      metrics: calculateMetrics({
        correct: engine.correct,
        wrong: engine.wrong,
        elapsedMs,
      }),
      started: startedAt !== null,
      startedAt,
      elapsedMs,
      timeLeftMs,
      finished,
      timedOut,
    };
  }

  return {
    /** Обработать нажатие; таймер стартует с первого печатного символа. */
    input(key: string): SessionSnapshot {
      const current = snapshot();
      // После таймаута (в timed-режиме) дальнейший ввод игнорируется.
      if (current.timedOut) return current;

      if (startedAt === null && isPrintableKey(key)) {
        startedAt = now();
      }

      engine = handleKey(engine, key);
      return snapshot();
    },
    snapshot,
    restart(): SessionSnapshot {
      engine = createEngine(options.text);
      startedAt = null;
      endedElapsedMs = null;
      return snapshot();
    },
    /** Удалить текущее слово (Ctrl+Backspace). */
    deleteWord(): SessionSnapshot {
      const current = snapshot();
      if (current.finished) return current;
      engine = deleteCurrentWord(engine);
      return snapshot();
    },
    /** Пропустить текущее слово (Tab). */
    skipWord(): SessionSnapshot {
      const current = snapshot();
      if (current.finished) return current;
      engine = skipWord(engine);
      return snapshot();
    },
  };
}
