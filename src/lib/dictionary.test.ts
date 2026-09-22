import { describe, it, expect } from 'vitest';
import {
  CONTENT_TYPES,
  DICTIONARIES,
  WORD_TOPICS,
  contentTypeLabel,
  generatePassages,
  generateQuotes,
  generateSentences,
  generateText,
  generateWords,
  wordTopicLabel,
} from './dictionary';

const zeroRng = () => 0;
const lastRng = () => 0.999999;

describe('generateWords', () => {
  it('генерирует нужное количество слов через пробел', () => {
    expect(generateWords('en', 5, zeroRng).split(' ')).toHaveLength(5);
  });

  it('с rng=0 всегда берёт первое слово темы', () => {
    const first = DICTIONARIES.en.words.general[0];
    expect(generateWords('en', 3, zeroRng)).toBe(`${first} ${first} ${first}`);
  });

  it('с rng≈1 берёт последнее слово темы', () => {
    const list = DICTIONARIES.ru.words.general;
    const last = list[list.length - 1];
    expect(generateWords('ru', 2, lastRng)).toBe(`${last} ${last}`);
  });

  it('тема programming берёт слова из тематического списка', () => {
    const first = DICTIONARIES.en.words.programming[0];
    expect(generateWords('en', 2, zeroRng, 'programming')).toBe(`${first} ${first}`);
  });

  it('слова всех тем не содержат пробелов', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const topic of WORD_TOPICS) {
        for (const word of DICTIONARIES[lang].words[topic]) {
          expect(word).not.toContain(' ');
        }
      }
    }
  });
});

describe('generateSentences', () => {
  it('соединяет предложения через пробел', () => {
    const s = DICTIONARIES.en.sentences[0];
    expect(generateSentences('en', 2, zeroRng)).toBe(`${s} ${s}`);
  });

  it('каждое предложение оканчивается пунктуацией', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const s of DICTIONARIES[lang].sentences) {
        expect(/[.!?…]$/.test(s)).toBe(true);
      }
    }
  });
});

describe('generateQuotes', () => {
  it('возвращает текст и атрибуцию', () => {
    const q = DICTIONARIES.en.quotes[0];
    const res = generateQuotes('en', 1, zeroRng);
    expect(res.text).toBe(q.text);
    expect(res.attribution).toBe(q.source);
  });

  it('соединяет несколько цитат через пробел и атрибуции через ·', () => {
    const q = DICTIONARIES.ru.quotes[0];
    const res = generateQuotes('ru', 2, zeroRng);
    expect(res.text).toBe(`${q.text} ${q.text}`);
    expect(res.attribution).toBe(`${q.source} · ${q.source}`);
  });
});

describe('generatePassages', () => {
  it('генерирует нужное количество отрывков', () => {
    const p = DICTIONARIES.en.passages[0];
    expect(generatePassages('en', 2, zeroRng)).toBe(`${p} ${p}`);
  });
});

describe('generateText', () => {
  it('quotes возвращает атрибуцию, words — нет', () => {
    expect(generateText('en', 'quotes', null).attribution).toBeTruthy();
    expect(generateText('en', 'words', null).attribution).toBeUndefined();
  });

  it('sentences: free даёт 4 предложения (одно и то же при rng=0)', () => {
    const s = DICTIONARIES.en.sentences[0];
    expect(generateText('en', 'sentences', null, 'general', zeroRng).text).toBe(
      `${s} ${s} ${s} ${s}`,
    );
  });

  it('quotes: timed 30s даёт 3 цитаты (одну и ту же при rng=0)', () => {
    const q = DICTIONARIES.en.quotes[0];
    const res = generateText('en', 'quotes', 30, 'general', zeroRng);
    expect(res.text).toBe(`${q.text} ${q.text} ${q.text}`);
    expect(res.attribution).toBe(`${q.source} · ${q.source} · ${q.source}`);
  });
});

describe('labels', () => {
  it('contentTypeLabel даёт подписи для всех типов', () => {
    expect(CONTENT_TYPES.map(contentTypeLabel)).toEqual(['Words', 'Sentences', 'Quotes', 'Passages']);
  });

  it('wordTopicLabel даёт подписи для тем', () => {
    expect(WORD_TOPICS.map(wordTopicLabel)).toEqual(['General', 'Programming', 'Tech']);
  });
});
