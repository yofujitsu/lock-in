import { describe, it, expect } from 'vitest';
import { createEngine, type EngineState } from './engine';
import {
  currentWordStart,
  deleteCurrentWord,
  nextWordStart,
  skipWord,
} from './wordops';

/** Создаёт состояние с кареткой на заданной позиции. */
function at(text: string, position: number): EngineState {
  return { ...createEngine(text), position };
}

describe('currentWordStart', () => {
  it('возвращает начало слова из его середины', () => {
    expect(currentWordStart(at('ab cd ef', 4))).toBe(3);
    expect(currentWordStart(at('ab cd ef', 1))).toBe(0);
  });

  it('возвращает ту же позицию, когда каретка в начале слова', () => {
    expect(currentWordStart(at('ab cd ef', 3))).toBe(3);
  });

  it('возвращает позицию пробела, когда каретка на пробеле', () => {
    expect(currentWordStart(at('ab cd ef', 2))).toBe(2);
  });

  it('возвращает 0 в начале текста', () => {
    expect(currentWordStart(at('ab cd ef', 0))).toBe(0);
  });
});

describe('nextWordStart', () => {
  it('возвращает начало следующего слова из середины слова', () => {
    expect(nextWordStart(at('ab cd ef', 0))).toBe(3);
    expect(nextWordStart(at('ab cd ef', 1))).toBe(3);
  });

  it('возвращает длину текста, если слово последнее', () => {
    expect(nextWordStart(at('ab cd ef', 6))).toBe(8);
    expect(nextWordStart(at('ab cd ef', 7))).toBe(8);
  });

  it('возвращает начало следующего слова, когда каретка на пробеле', () => {
    expect(nextWordStart(at('ab cd ef', 2))).toBe(3);
    expect(nextWordStart(at('ab cd ef', 5))).toBe(6);
  });
});

describe('deleteCurrentWord', () => {
  it('сбрасывает набранное слово в pending и возвращает каретку к его началу', () => {
    const s: EngineState = {
      ...createEngine('ab cd ef'),
      position: 4,
      charStates: ['correct', 'correct', 'correct', 'correct', 'wrong', 'pending', 'pending', 'pending'],
      correct: 5,
      wrong: 2,
    };
    const r = deleteCurrentWord(s);
    expect(r.position).toBe(3);
    expect(r.charStates).toEqual([
      'correct',
      'correct',
      'correct',
      'pending',
      'wrong',
      'pending',
      'pending',
      'pending',
    ]);
    expect(r.correct).toBe(5);
    expect(r.wrong).toBe(2);
  });

  it('на пробеле — no-op', () => {
    const s = at('ab cd ef', 2);
    expect(deleteCurrentWord(s)).toBe(s);
  });

  it('в позиции 0 — no-op', () => {
    const s = at('ab cd ef', 0);
    expect(deleteCurrentWord(s)).toBe(s);
  });
});

describe('skipWord', () => {
  it('перепрыгивает к началу следующего слова и помечает пропущенное', () => {
    const s = at('ab cd ef', 1);
    const r = skipWord(s);
    expect(r.position).toBe(3);
    expect(r.charStates[0]).toBe('pending');
    expect(r.charStates[1]).toBe('skipped');
    expect(r.charStates[2]).toBe('skipped');
    expect(r.charStates[3]).toBe('pending');
    expect(r.correct).toBe(0);
    expect(r.wrong).toBe(0);
  });

  it('из последнего слова переносит каретку в конец текста', () => {
    expect(skipWord(at('ab cd ef', 6)).position).toBe(8);
  });

  it('в конце текста (нет следующего слова) — no-op', () => {
    const s = at('ab cd ef', 8);
    expect(skipWord(s)).toBe(s);
  });
});
