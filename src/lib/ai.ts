import { invoke } from '@tauri-apps/api/core';
import type { Language } from './dictionary';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage;
  return { getItem: () => null, setItem: () => {} };
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
      if (arr) text = arr.map((v: unknown) => (typeof v === 'string' ? v : '')).join(' ');
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

export function loadCustomLists(storage: StorageLike = defaultStorage()): CustomLists {
  try {
    const raw = storage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CustomLists) : {};
  } catch {
    return {};
  }
}

export function saveCustomLists(lists: CustomLists, storage: StorageLike = defaultStorage()): void {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(lists));
  } catch {
    // ignore (private mode и т.п.)
  }
}

export function getCustomList(lang: Language, topic: string, storage: StorageLike = defaultStorage()): string[] | null {
  return loadCustomLists(storage)[customListKey(lang, topic)] ?? null;
}

export function setCustomList(lang: Language, topic: string, words: string[], storage: StorageLike = defaultStorage()): void {
  const lists = loadCustomLists(storage);
  lists[customListKey(lang, topic)] = words;
  saveCustomLists(lists, storage);
}

/** Возвращает список, только если он был сгенерирован для (lang, topic). */
export function matchCustomList(
  generatedKey: string | null,
  list: string[] | null,
  lang: Language,
  topic: string,
): string[] | null {
  return generatedKey === customListKey(lang, topic) ? list : null;
}

export interface AiSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
};

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadAiSettings(
  invokeFn: typeof invoke = invoke,
): Promise<AiSettings> {
  if (!isTauri()) return { ...DEFAULT_AI_SETTINGS };
  return invokeFn<AiSettings>('get_ai_settings');
}

export async function saveAiSettings(
  settings: AiSettings,
  invokeFn: typeof invoke = invoke,
): Promise<void> {
  if (!isTauri()) return;
  await invokeFn('set_ai_settings', { settings });
}

export interface GenerateCustomWordsDeps {
  invokeFn?: typeof invoke;
  loadSettings?: () => Promise<AiSettings>;
  storage?: StorageLike;
  force?: boolean;
}

export async function generateCustomWords(
  lang: Language,
  topic: string,
  deps: GenerateCustomWordsDeps = {},
): Promise<string[]> {
  const invokeFn = deps.invokeFn ?? invoke;
  const loadSettings = deps.loadSettings ?? (() => loadAiSettings(invokeFn));
  const storage = deps.storage ?? defaultStorage();

  if (!deps.force) {
    const cached = getCustomList(lang, topic, storage);
    if (cached && cached.length > 0) return cached;
  }

  const settings = await loadSettings();
  if (!settings.apiKey.trim()) {
    throw new Error('Set your API key in the AI settings first.');
  }

  const raw = await invokeFn<string>('generate_word_list', { lang, topic });
  const words = sanitizeWordList(raw, lang);
  if (words.length === 0) throw new Error('The model returned no usable words.');
  setCustomList(lang, topic, words, storage);
  return words;
}
