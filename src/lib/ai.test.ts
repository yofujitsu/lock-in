import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  customListKey,
  generateCustomWords,
  getCustomList,
  loadAiSettings,
  loadCustomLists,
  sanitizeWordList,
  saveAiSettings,
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

beforeEach(() => vi.stubGlobal('window', { __TAURI_INTERNALS__: {} }));
afterEach(() => vi.unstubAllGlobals());

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

const fakeInvoke = (impl: (cmd: string, args: unknown) => unknown) =>
  ((cmd: string, args: unknown) => Promise.resolve(impl(cmd, args))) as never;

describe('loadAiSettings / saveAiSettings', () => {
  it('loadAiSettings вызывает get_ai_settings и возвращает настройки', async () => {
    const invokeFn = fakeInvoke(() => ({ baseUrl: 'http://x/v1', model: 'm', apiKey: 'k' }));
    await expect(loadAiSettings(invokeFn)).resolves.toEqual({ baseUrl: 'http://x/v1', model: 'm', apiKey: 'k' });
  });

  it('saveAiSettings вызывает set_ai_settings', async () => {
    const calls: Array<[string, unknown]> = [];
    const invokeFn = fakeInvoke((cmd, args) => void calls.push([cmd, args]));
    await saveAiSettings({ baseUrl: 'b', model: 'm', apiKey: 'k' }, invokeFn);
    expect(calls[0][0]).toBe('set_ai_settings');
  });
});

describe('generateCustomWords', () => {
  it('бросает понятную ошибку при пустом ключе', async () => {
    const invokeFn = fakeInvoke(() => '["sail"]');
    await expect(
      generateCustomWords('en', 'sailing', {
        invokeFn,
        loadSettings: async () => ({ baseUrl: '', model: '', apiKey: '' }),
      }),
    ).rejects.toThrow(/API key/i);
  });

  it('санитизирует ответ и возвращает слова', async () => {
    const invokeFn = fakeInvoke(() => '["Sail", "anchor2", "sail"]');
    const words = await generateCustomWords('en', 'sailing', {
      invokeFn,
      loadSettings: async () => ({ baseUrl: '', model: '', apiKey: 'k' }),
    });
    expect(words).toEqual(['sail', 'anchor']);
  });

  it('переиспользует кеш и не зовёт модель повторно', async () => {
    const storage = memStorage({ 'ai.customLists': JSON.stringify({ 'en:sailing': ['sail'] }) });
    let called = false;
    const invokeFn = fakeInvoke(() => (called = true));
    const words = await generateCustomWords('en', 'sailing', {
      invokeFn,
      storage,
      loadSettings: async () => ({ baseUrl: '', model: '', apiKey: 'k' }),
    });
    expect(words).toEqual(['sail']);
    expect(called).toBe(false);
  });
});
