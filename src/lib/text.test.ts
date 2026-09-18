import { describe, it, expect } from 'vitest';
import { tokenize } from './text';

describe('tokenize', () => {
  it('разбивает на слова и пробелы', () => {
    expect(tokenize('ab cd')).toEqual([
      { type: 'word', start: 0, chars: ['a', 'b'] },
      { type: 'space', start: 2, chars: [' '] },
      { type: 'word', start: 3, chars: ['c', 'd'] },
    ]);
  });

  it('пустой текст даёт пустой массив', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('несколько пробелов подряд', () => {
    const tokens = tokenize('a  b');
    expect(tokens.map((t) => t.type)).toEqual(['word', 'space', 'space', 'word']);
  });
});
