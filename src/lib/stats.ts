import type { HistoryEntry } from './history';
import { contentTypeLabel, type ContentType } from './dictionary';

export interface Summary {
  totalSessions: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
  totalTimeMs: number;
}

export interface GroupStat {
  key: string;
  label: string;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
  count: number;
}

export interface TimelinePoint {
  label: string;
  value: number;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function computeSummary(entries: HistoryEntry[]): Summary {
  const wpms = entries.map((e) => e.wpm);
  return {
    totalSessions: entries.length,
    avgWpm: avg(wpms),
    bestWpm: entries.length ? Math.max(...wpms) : 0,
    avgAccuracy: avg(entries.map((e) => e.accuracy)),
    totalTimeMs: entries.reduce((a, e) => a + e.elapsedMs, 0),
  };
}

export function modeLabel(seconds: number | null): string {
  return seconds === null ? 'Free' : `${seconds}s`;
}

const MODE_ORDER: (number | null)[] = [null, 15, 30, 60, 120, 300];

function groupBy<T>(
  entries: HistoryEntry[],
  keyOf: (e: HistoryEntry) => T,
  order: T[],
  label: (k: T) => string,
  key: (k: T) => string,
): GroupStat[] {
  const groups = new Map<string, { k: T; list: HistoryEntry[] }>();
  for (const e of entries) {
    const k = keyOf(e);
    const kk = key(k);
    if (!groups.has(kk)) groups.set(kk, { k, list: [] });
    groups.get(kk)!.list.push(e);
  }
  return order
    .filter((k) => groups.has(key(k)))
    .map((k) => {
      const list = groups.get(key(k))!.list;
      const wpms = list.map((e) => e.wpm);
      return {
        key: key(k),
        label: label(k),
        avgWpm: avg(wpms),
        bestWpm: Math.max(...wpms),
        avgAccuracy: avg(list.map((e) => e.accuracy)),
        count: list.length,
      };
    });
}

/** Средние показатели по режимам (Free / 15s / 30s / ...). */
export function statsByMode(entries: HistoryEntry[]): GroupStat[] {
  return groupBy(
    entries,
    (e) => e.seconds,
    MODE_ORDER,
    (k) => modeLabel(k),
    (k) => (k === null ? 'free' : String(k)),
  );
}

/** Средние показатели по языку набора (EN/RU). */
export function statsByLanguage(entries: HistoryEntry[]): GroupStat[] {
  return groupBy(
    entries,
    (e) => e.language,
    ['en', 'ru'],
    (k) => k.toUpperCase(),
    (k) => k,
  );
}

const CONTENT_TYPE_ORDER: ContentType[] = ['words', 'sentences', 'quotes', 'passages'];

/** Средние показатели по типу текста (Words / Sentences / Quotes / Passages). */
export function statsByContentType(entries: HistoryEntry[]): GroupStat[] {
  return groupBy(
    entries,
    (e) => e.contentType,
    CONTENT_TYPE_ORDER,
    (k) => contentTypeLabel(k),
    (k) => k,
  );
}

/** WPM последних `limit` сессий в хронологическом порядке. */
export function wpmTimeline(entries: HistoryEntry[], limit = 20): TimelinePoint[] {
  return entries
    .slice(0, limit)
    .reverse()
    .map((e, i) => ({ label: `#${i + 1}`, value: e.wpm }));
}
