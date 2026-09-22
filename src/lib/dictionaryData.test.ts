import { describe, it, expect } from 'vitest';
import enQuotes from '../data/quotes-en.json';
import ruQuotes from '../data/quotes-ru.json';
import enSentences from '../data/sentences-en.json';
import ruSentences from '../data/sentences-ru.json';
import enPassages from '../data/passages-en.json';
import ruPassages from '../data/passages-ru.json';
import enTopics from '../data/topics-en.json';
import ruTopics from '../data/topics-ru.json';

// Последний символ не должен быть буквой/цифрой/пробелом (т.е. это пунктуация).
const ENDS_WITH_LETTER = /[\p{L}\p{N}\s]$/u;

function expectCleanText(s: string) {
  expect(s.trim()).toBe(s);
  expect(s).not.toMatch(/\s{2,}/);
  expect(ENDS_WITH_LETTER.test(s)).toBe(false);
}

describe('data: предложения', () => {
  it.each(['en', 'ru'] as const)('%s: непустой, пунктуация в конце', (lang) => {
    const list = lang === 'en' ? enSentences : ruSentences;
    expect(list.length).toBeGreaterThanOrEqual(60);
    for (const s of list) expectCleanText(s);
  });
});

describe('data: цитаты', () => {
  it.each(['en', 'ru'] as const)('%s: структура и пунктуация', (lang) => {
    const list = lang === 'en' ? enQuotes : ruQuotes;
    expect(list.length).toBeGreaterThanOrEqual(40);
    for (const q of list) {
      expect(typeof q.text).toBe('string');
      expect(typeof q.source).toBe('string');
      expect(q.source.length).toBeGreaterThan(0);
      expectCleanText(q.text);
    }
  });
});

describe('data: отрывки', () => {
  it.each(['en', 'ru'] as const)('%s: непустой, пунктуация в конце', (lang) => {
    const list = lang === 'en' ? enPassages : ruPassages;
    expect(list.length).toBeGreaterThanOrEqual(15);
    for (const s of list) expectCleanText(s);
  });
});

describe('data: темы слов', () => {
  it.each(['en', 'ru'] as const)('%s: темы programming/tech, одиночные токены', (lang) => {
    const topics = lang === 'en' ? enTopics : ruTopics;
    const re = lang === 'en' ? /^[a-z]+$/ : /^[а-яё]+$/;
    for (const topic of ['programming', 'tech'] as const) {
      const words = topics[topic];
      expect(words.length).toBeGreaterThanOrEqual(60);
      for (const w of words) expect(w).toMatch(re);
    }
  });
});
