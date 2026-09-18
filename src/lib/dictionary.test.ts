import { describe, it, expect } from 'vitest';
import { DICTIONARIES, generateSentences, generateWords } from './dictionary';

const zeroRng = () => 0;
const lastRng = () => 0.999999;

describe('generateWords', () => {
  it('генерирует нужное количество слов через пробел', () => {
    expect(generateWords('en', 5, zeroRng).split(' ')).toHaveLength(5);
  });

  it('с rng=0 всегда берёт первое слово', () => {
    const first = DICTIONARIES.en.words[0];
    expect(generateWords('en', 3, zeroRng)).toBe(`${first} ${first} ${first}`);
  });

  it('с rng≈1 берёт последнее слово', () => {
    const list = DICTIONARIES.ru.words;
    const last = list[list.length - 1];
    expect(generateWords('ru', 2, lastRng)).toBe(`${last} ${last}`);
  });

  it('слова сами по себе не содержат пробелов', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const word of DICTIONARIES[lang].words) {
        expect(word).not.toContain(' ');
      }
    }
  });
});

describe('generateSentences', () => {
  it('соединяет предложения через пробел', () => {
    const s = DICTIONARIES.en.sentences[0];
    expect(generateSentences('en', 2, zeroRng)).toBe(`${s} ${s}`);
  });

  it('генерирует нужное количество предложений', () => {
    const s = DICTIONARIES.ru.sentences[0];
    expect(generateSentences('ru', 3, zeroRng)).toBe(`${s} ${s} ${s}`);
  });
});
