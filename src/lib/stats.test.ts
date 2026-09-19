import { describe, it, expect } from 'vitest';
import {
  computeSummary,
  modeLabel,
  statsByContentType,
  statsByLanguage,
  statsByMode,
  wpmTimeline,
} from './stats';
import type { HistoryEntry } from './history';

function entry(partial: Partial<HistoryEntry> & { id: string }): HistoryEntry {
  return {
    timestamp: 0,
    wpm: 50,
    cpm: 250,
    accuracy: 0.9,
    elapsedMs: 60_000,
    language: 'en',
    contentType: 'words',
    seconds: 30,
    ...partial,
  };
}

describe('computeSummary', () => {
  it('считает средние и максимум', () => {
    const s = computeSummary([
      entry({ id: 'a', wpm: 40, accuracy: 0.8 }),
      entry({ id: 'b', wpm: 60, accuracy: 1.0 }),
    ]);
    expect(s.totalSessions).toBe(2);
    expect(s.avgWpm).toBeCloseTo(50);
    expect(s.bestWpm).toBe(60);
    expect(s.avgAccuracy).toBeCloseTo(0.9);
  });

  it('пустой список даёт нули', () => {
    const s = computeSummary([]);
    expect(s.totalSessions).toBe(0);
    expect(s.avgWpm).toBe(0);
    expect(s.bestWpm).toBe(0);
    expect(s.avgAccuracy).toBe(0);
  });
});

describe('statsByMode', () => {
  it('группирует по длительности, Free для null', () => {
    const res = statsByMode([
      entry({ id: 'a', seconds: null, wpm: 40 }),
      entry({ id: 'b', seconds: null, wpm: 60 }),
      entry({ id: 'c', seconds: 30, wpm: 80 }),
    ]);
    const free = res.find((g) => g.key === 'free')!;
    expect(free.label).toBe('Free');
    expect(free.count).toBe(2);
    expect(free.avgWpm).toBeCloseTo(50);
    expect(res.find((g) => g.key === '30')!.avgWpm).toBe(80);
  });
});

describe('statsByLanguage / statsByContentType', () => {
  it('группирует и даёт понятные лейблы', () => {
    expect(statsByLanguage([entry({ id: 'a', language: 'ru' })])[0].label).toBe('RU');
    expect(statsByContentType([entry({ id: 'a', contentType: 'sentences' })])[0].label).toBe('Sentences');
  });
});

describe('wpmTimeline', () => {
  it('возвращает последние значения в хронологическом порядке', () => {
    const entries = [entry({ id: 'c', wpm: 70 }), entry({ id: 'b', wpm: 60 }), entry({ id: 'a', wpm: 50 })];
    expect(wpmTimeline(entries, 3).map((p) => p.value)).toEqual([50, 60, 70]);
  });
});

describe('modeLabel', () => {
  it('null → Free, иначе Ns', () => {
    expect(modeLabel(null)).toBe('Free');
    expect(modeLabel(30)).toBe('30s');
  });
});
