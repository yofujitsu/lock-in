/**
 * Локальная история сессий (хранится в localStorage).
 * Хранилище инъектируется — так модуль легко тестировать и переиспользовать.
 */

export interface HistoryEntry {
  id: string;
  timestamp: number;
  wpm: number;
  cpm: number;
  /** Точность, доля 0..1. */
  accuracy: number;
  elapsedMs: number;
  language: string;
  contentType: string;
  seconds: number | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'typing-trainer.history';
const MAX_ENTRIES = 50;

export function loadHistory(storage: StorageLike = localStorage): HistoryEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[], storage: StorageLike = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // игнорируем ошибки записи (private mode и т.п.)
  }
}

/** Добавляет запись в начало истории и возвращает обновлённый список. */
export function addHistoryEntry(
  entry: HistoryEntry,
  storage: StorageLike = localStorage,
): HistoryEntry[] {
  const entries = [entry, ...loadHistory(storage)].slice(0, MAX_ENTRIES);
  saveHistory(entries, storage);
  return entries;
}
