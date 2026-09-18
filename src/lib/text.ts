/**
 * Разбивка текста на токены (слова и пробелы) для отрисовки.
 * Пробел — отдельный токен, чтобы его тоже можно было подсвечивать/красить.
 */

export interface TextToken {
  type: 'word' | 'space';
  /** Индекс первого символа токена в исходной строке. */
  start: number;
  chars: string[];
}

export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;
  while (i < text.length) {
    const start = i;
    if (text[i] === ' ') {
      tokens.push({ type: 'space', start, chars: [' '] });
      i += 1;
    } else {
      const chars: string[] = [];
      while (i < text.length && text[i] !== ' ') {
        chars.push(text[i]);
        i += 1;
      }
      tokens.push({ type: 'word', start, chars });
    }
  }
  return tokens;
}
