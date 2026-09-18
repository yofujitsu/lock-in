import { describe, it, expect } from 'vitest';
import { addHistoryEntry, loadHistory, type HistoryEntry, type StorageLike } from './history';

function makeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function entry(id: string): HistoryEntry {
  return {
    id,
    timestamp: 0,
    wpm: 10,
    cpm: 50,
    accuracy: 0.9,
    elapsedMs: 1000,
    language: 'en',
    contentType: 'words',
    seconds: 30,
  };
}

describe('history', () => {
  it('сохраняет и загружает записи', () => {
    const storage = makeStorage();
    addHistoryEntry(entry('a'), storage);
    expect(loadHistory(storage)).toHaveLength(1);
  });

  it('новые записи идут первыми', () => {
    const storage = makeStorage();
    addHistoryEntry(entry('a'), storage);
    addHistoryEntry(entry('b'), storage);
    const list = loadHistory(storage);
    expect(list[0].id).toBe('b');
    expect(list[1].id).toBe('a');
  });

  it('пустое хранилище даёт пустой список', () => {
    expect(loadHistory(makeStorage())).toEqual([]);
  });

  it('не падает на битых данных', () => {
    const storage = makeStorage();
    storage.setItem('typing-trainer.history', '{not json');
    expect(loadHistory(storage)).toEqual([]);
  });
});
