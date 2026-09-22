import type { Language } from './dictionary';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const CACHE_KEY = 'ai.customLists';
const MAX_WORDS = 100;

const WORD_RE: Record<Language, RegExp> = {
  en: /[a-z]+/g,
  ru: /[а-яё]+/g,
};

/**
 * Превращает сырой ответ модели в чистый список слов: JSON-массив / объект
 * {"words": [...]} / просто текст. Нормализует: lowercase, одиночный токен,
 * алфавит языка, дедуп, cap 100.
 */
export function sanitizeWordList(raw: string, lang: Language): string[] {
  let text = raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.words)
          ? parsed.words
          : null;
      if (arr) text = arr.map((v) => (typeof v === 'string' ? v : '')).join(' ');
    } catch {
      // не JSON — обрабатываем как текст ниже
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.toLowerCase().matchAll(WORD_RE[lang])) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      out.push(m[0]);
    }
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

export type CustomLists = Record<string, string[]>;

export function customListKey(lang: Language, topic: string): string {
  return `${lang}:${topic}`;
}

export function loadCustomLists(storage: StorageLike = localStorage): CustomLists {
  try {
    const raw = storage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CustomLists) : {};
  } catch {
    return {};
  }
}

export function saveCustomLists(lists: CustomLists, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(lists));
  } catch {
    // ignore (private mode и т.п.)
  }
}

export function getCustomList(lang: Language, topic: string, storage: StorageLike = localStorage): string[] | null {
  return loadCustomLists(storage)[customListKey(lang, topic)] ?? null;
}

export function setCustomList(lang: Language, topic: string, words: string[], storage: StorageLike = localStorage): void {
  const lists = loadCustomLists(storage);
  lists[customListKey(lang, topic)] = words;
  saveCustomLists(lists, storage);
}
