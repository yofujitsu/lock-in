/**
 * Словари и генерация текста для набора.
 *
 * Списки слов загружены из публичных частотных наборов (см. src/data/README.md):
 * - EN: google-10000-english (first20hours/google-10000-english), топ-1500.
 * - RU: OpenSubtitles2018 frequency list (hermitdave/FrequencyWords), топ-1500.
 * Тематические тексты (цитаты/предложения/отрывки/темы слов) курируются вручную
 * и лежат в src/data/*.json (см. src/data/README.md).
 */

import enWords from '../data/words-en.json';
import ruWords from '../data/words-ru.json';
import enTopics from '../data/topics-en.json';
import ruTopics from '../data/topics-ru.json';
import enSentences from '../data/sentences-en.json';
import ruSentences from '../data/sentences-ru.json';
import enQuotes from '../data/quotes-en.json';
import ruQuotes from '../data/quotes-ru.json';
import enPassages from '../data/passages-en.json';
import ruPassages from '../data/passages-ru.json';

export type Language = 'en' | 'ru';
export type ContentType = 'words' | 'sentences' | 'quotes' | 'passages';
export type WordTopic = 'general' | 'programming' | 'tech';

export interface Quote {
  text: string;
  source: string;
}

export interface Dictionary {
  words: Record<WordTopic, string[]>;
  sentences: string[];
  quotes: Quote[];
  passages: string[];
}

export const WORD_TOPICS: WordTopic[] = ['general', 'programming', 'tech'];
export const CONTENT_TYPES: ContentType[] = ['words', 'sentences', 'quotes', 'passages'];

export function contentTypeLabel(type: ContentType): string {
  switch (type) {
    case 'words': return 'Words';
    case 'sentences': return 'Sentences';
    case 'quotes': return 'Quotes';
    case 'passages': return 'Passages';
  }
}

export function wordTopicLabel(topic: WordTopic): string {
  switch (topic) {
    case 'general': return 'General';
    case 'programming': return 'Programming';
    case 'tech': return 'Tech';
  }
}

export const DICTIONARIES: Record<Language, Dictionary> = {
  en: {
    words: { general: enWords, ...enTopics },
    sentences: enSentences,
    quotes: enQuotes,
    passages: enPassages,
  },
  ru: {
    words: { general: ruWords, ...ruTopics },
    sentences: ruSentences,
    quotes: ruQuotes,
    passages: ruPassages,
  },
};

export type Rng = () => number;

/** Источник текстов — точка расширения под будущий AI-генератор. */
export interface TextSource {
  words(lang: Language, topic: WordTopic): string[];
  sentences(lang: Language): string[];
  quotes(lang: Language): Quote[];
  passages(lang: Language): string[];
}

export const STATIC_SOURCE: TextSource = {
  words: (lang, topic) => DICTIONARIES[lang].words[topic],
  sentences: (lang) => DICTIONARIES[lang].sentences,
  quotes: (lang) => DICTIONARIES[lang].quotes,
  passages: (lang) => DICTIONARIES[lang].passages,
};

function pick<T>(list: T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)];
}

/** Генерирует текст из `count` случайных слов через пробел. */
export function generateWords(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  topic: WordTopic = 'general',
  source: TextSource = STATIC_SOURCE,
  customList?: string[],
): string {
  const words = customList ?? source.words(lang, topic);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(words, rng));
  return out.join(' ');
}

/** Генерирует текст из `count` случайных предложений. */
export function generateSentences(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): string {
  const sentences = source.sentences(lang);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(sentences, rng));
  return out.join(' ');
}

/** Генерирует текст из `count` случайных отрывков. */
export function generatePassages(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): string {
  const passages = source.passages(lang);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(passages, rng));
  return out.join(' ');
}

export interface GeneratedQuote {
  text: string;
  attribution: string;
}

/** Генерирует текст из `count` случайных цитат + строку атрибуции. */
export function generateQuotes(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): GeneratedQuote {
  const quotes = source.quotes(lang);
  const picked = Array.from({ length: count }, () => pick(quotes, rng));
  return {
    text: picked.map((q) => q.text).join(' '),
    attribution: picked.map((q) => q.source).join(' · '),
  };
}

export interface GeneratedText {
  text: string;
  attribution?: string;
}

/** Генерирует текст сессии по типу контента, длительности и теме слов. */
export function generateText(
  lang: Language,
  contentType: ContentType,
  seconds: number | null,
  wordTopic: WordTopic = 'general',
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
  customList?: string[],
): GeneratedText {
  switch (contentType) {
    case 'sentences': {
      const count = seconds === null ? 4 : Math.max(4, Math.ceil(seconds / 12));
      return { text: generateSentences(lang, count, rng, source) };
    }
    case 'quotes': {
      const count = seconds === null ? 3 : Math.max(3, Math.ceil(seconds / 20));
      return generateQuotes(lang, count, rng, source);
    }
    case 'passages': {
      const count = seconds === null ? 2 : Math.max(2, Math.ceil(seconds / 30));
      return { text: generatePassages(lang, count, rng, source) };
    }
    default: {
      const count = seconds === null ? 80 : Math.max(80, Math.min(seconds * 2, 400));
      return { text: generateWords(lang, count, rng, wordTopic, source, customList) };
    }
  }
}
