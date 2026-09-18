/**
 * Расчёт метрик скорости набора.
 *
 * - WPM (words per minute): (correct / 5) / minutes — стандарт: 1 слово = 5 символов.
 * - CPM (characters per minute): correct / minutes — верные символы в минуту.
 * - TPM (taps per minute): (correct + wrong) / minutes — все нажатия в минуту.
 * - Accuracy: correct / (correct + wrong), доля 0..1.
 *
 * Модуль чистый: на вход только счётчики и время, на выход — числа.
 */

export interface MetricsInput {
  correct: number;
  wrong: number;
  elapsedMs: number;
}

export interface TypingMetrics {
  /** Слова в минуту. */
  wpm: number;
  /** Верные символы в минуту. */
  cpm: number;
  /** Все нажатия в минуту. */
  tpm: number;
  /** «Скорость» — то же, что CPM (верные символы в минуту). */
  speed: number;
  /** Точность, доля 0..1. */
  accuracy: number;
  /** Точность в процентах, 0..100. */
  accuracyPercent: number;
  elapsedMs: number;
}

const MS_PER_MINUTE = 60_000;

export function calculateMetrics(input: MetricsInput): TypingMetrics {
  const { correct, wrong, elapsedMs } = input;
  const minutes = elapsedMs / MS_PER_MINUTE;
  const total = correct + wrong;

  const wpm = minutes > 0 ? correct / 5 / minutes : 0;
  const cpm = minutes > 0 ? correct / minutes : 0;
  const tpm = minutes > 0 ? total / minutes : 0;
  const accuracy = total > 0 ? correct / total : 1;

  return {
    wpm,
    cpm,
    tpm,
    speed: cpm,
    accuracy,
    accuracyPercent: accuracy * 100,
    elapsedMs,
  };
}
