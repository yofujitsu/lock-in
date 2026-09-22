import { describe, it, expect } from 'vitest';
import {
  customListKey,
  getCustomList,
  loadCustomLists,
  sanitizeWordList,
  setCustomList,
} from './ai';
import type { StorageLike } from './ai';

function memStorage(init: Record<string, string> = {}): StorageLike {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('sanitizeWordList', () => {
  it('парсит JSON-массив и нормализует', () => {
    expect(sanitizeWordList('["Sail", "anchor", "sail"]', 'en')).toEqual(['sail', 'anchor']);
  });

  it('вынимает массив из JSON-объекта с полем words', () => {
    expect(sanitizeWordList('{"words": ["sail", "anchor"]}', 'en')).toEqual(['sail', 'anchor']);
  });

  it('извлекает слова из прозы и отбрасывает мусор', () => {
    expect(sanitizeWordList('Here are words: sail, anchor2, and -- boom!', 'en')).toEqual([
      'here', 'are', 'words', 'sail', 'anchor', 'and', 'boom',
    ]);
  });

  it('фильтрует по алфавиту языка', () => {
    expect(sanitizeWordList('sail 123 привет!', 'en')).toEqual(['sail']);
    expect(sanitizeWordList('sail 123 привет!', 'ru')).toEqual(['привет']);
  });

  it('дедуплицирует и ограничивает 100 словами', () => {
    const word = (i: number): string => {
      let s = '';
      let n = i;
      do {
        s = String.fromCharCode(97 + (n % 26)) + s;
        n = Math.floor(n / 26);
      } while (n > 0);
      return s;
    };
    const big = Array.from({ length: 150 }, (_, i) => word(i)).join(' ');
    const out = sanitizeWordList(big, 'en');
    expect(out.length).toBe(100);
    expect(new Set(out).size).toBe(100);
  });
});

describe('custom list cache', () => {
  it('round-trips через setCustomList/getCustomList', () => {
    const storage = memStorage();
    setCustomList('en', 'sailing', ['sail', 'anchor'], storage);
    expect(getCustomList('en', 'sailing', storage)).toEqual(['sail', 'anchor']);
  });

  it('ключ включает язык и тему', () => {
    expect(customListKey('ru', 'медицина')).toBe('ru:медицина');
  });

  it('loadCustomLists возвращает {} при битом JSON', () => {
    expect(loadCustomLists(memStorage({ 'ai.customLists': 'not-json' }))).toEqual({});
  });
});
