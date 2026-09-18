import { describe, it, expect } from 'vitest';
import { calculateMetrics } from './metrics';

describe('calculateMetrics', () => {
  it('считает wpm по стандарту 5 символов = 1 слово', () => {
    // 60 верных символов за 60 секунд → 12 слов/мин.
    const m = calculateMetrics({ correct: 60, wrong: 0, elapsedMs: 60_000 });
    expect(m.wpm).toBeCloseTo(12);
    expect(m.cpm).toBeCloseTo(60);
    expect(m.tpm).toBeCloseTo(60);
  });

  it('tpm учитывает ошибочные нажатия, cpm — только верные', () => {
    const m = calculateMetrics({ correct: 50, wrong: 10, elapsedMs: 30_000 });
    expect(m.cpm).toBeCloseTo(100); // 50 / 0.5 мин
    expect(m.tpm).toBeCloseTo(120); // 60 / 0.5 мин
  });

  it('считает accuracy как долю и в процентах', () => {
    const m = calculateMetrics({ correct: 90, wrong: 10, elapsedMs: 60_000 });
    expect(m.accuracy).toBeCloseTo(0.9);
    expect(m.accuracyPercent).toBeCloseTo(90);
  });

  it('accuracy = 1 при отсутствии нажатий', () => {
    const m = calculateMetrics({ correct: 0, wrong: 0, elapsedMs: 0 });
    expect(m.accuracy).toBe(1);
    expect(m.accuracyPercent).toBe(100);
  });

  it('при нулевом времени скорость = 0', () => {
    const m = calculateMetrics({ correct: 10, wrong: 0, elapsedMs: 0 });
    expect(m.wpm).toBe(0);
    expect(m.cpm).toBe(0);
  });

  it('speed — алиас cpm', () => {
    const m = calculateMetrics({ correct: 120, wrong: 0, elapsedMs: 60_000 });
    expect(m.speed).toBe(m.cpm);
  });
});
