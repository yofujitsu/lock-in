/**
 * Словари и генерация текста для набора.
 *
 * Списки слов загружены из публичных частотных наборов (см. src/data/README.md):
 * - EN: google-10000-english (first20hours/google-10000-english), топ-1500.
 * - RU: OpenSubtitles2018 frequency list (hermitdave/FrequencyWords), топ-1500.
 * Перегенерируются скриптом scripts/fetch-dictionaries.mjs.
 */

import enWords from '../data/words-en.json';
import ruWords from '../data/words-ru.json';

export type Language = 'en' | 'ru';
export type ContentType = 'words' | 'sentences';

export interface Dictionary {
  words: string[];
  sentences: string[];
}

export const DICTIONARIES: Record<Language, Dictionary> = {
  en: {
    words: enWords,
    sentences: [
      'the quick brown fox jumps over the lazy dog',
      'practice makes perfect so keep typing every day',
      'a journey of a thousand miles begins with a single step',
      'all that glitters is not gold',
      'the early bird catches the worm',
    ],
  },
  ru: {
    words: ruWords,
    sentences: [
      'съешь же ещё этих мягких французских булок да выпей чаю',
      'на дворе трава на траве дрова не руби дрова',
      'без труда не вытащишь и рыбку из пруда',
      'делу время а потехе час',
      'повторение мать учения',
    ],
  },
};

export type Rng = () => number;

/** Генерирует текст из `count` случайных слов через пробел. */
export function generateWords(lang: Language, count: number, rng: Rng = Math.random): string {
  const words = DICTIONARIES[lang].words;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(words[Math.floor(rng() * words.length)]);
  }
  return out.join(' ');
}

/** Генерирует текст из `count` случайных предложений. */
export function generateSentences(lang: Language, count: number, rng: Rng = Math.random): string {
  const sentences = DICTIONARIES[lang].sentences;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(sentences[Math.floor(rng() * sentences.length)]);
  }
  return out.join(' ');
}
