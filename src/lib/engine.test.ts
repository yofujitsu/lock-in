import { describe, it, expect } from 'vitest';
import { createEngine, handleKey, isPrintableKey } from './engine';

describe('isPrintableKey', () => {
  it('считает одиночные символы печатными, включая пробел', () => {
    expect(isPrintableKey('a')).toBe(true);
    expect(isPrintableKey(' ')).toBe(true);
    expect(isPrintableKey('я')).toBe(true);
  });

  it('не считает печатными модификаторы и служебные клавиши', () => {
    expect(isPrintableKey('Shift')).toBe(false);
    expect(isPrintableKey('Backspace')).toBe(false);
    expect(isPrintableKey('Enter')).toBe(false);
    expect(isPrintableKey('Tab')).toBe(false);
    expect(isPrintableKey('Control')).toBe(false);
  });
});

describe('handleKey', () => {
  it('сдвигает позицию и помечает correct на верный символ', () => {
    const s = handleKey(createEngine('abc'), 'a');
    expect(s.position).toBe(1);
    expect(s.charStates).toEqual(['correct', 'pending', 'pending']);
    expect(s.correct).toBe(1);
    expect(s.wrong).toBe(0);
    expect(s.finished).toBe(false);
  });

  it('оставляет позицию и помечает wrong на неверный символ', () => {
    const s = handleKey(createEngine('abc'), 'x');
    expect(s.position).toBe(0);
    expect(s.charStates).toEqual(['wrong', 'pending', 'pending']);
    expect(s.wrong).toBe(1);
    expect(s.correct).toBe(0);
  });

  it('после ошибки верный символ продвигает и исправляет статус', () => {
    let s = createEngine('abc');
    s = handleKey(s, 'x');
    s = handleKey(s, 'a');
    expect(s.position).toBe(1);
    expect(s.charStates).toEqual(['correct', 'pending', 'pending']);
    expect(s.correct).toBe(1);
    expect(s.wrong).toBe(1);
  });

  it('backspace возвращает позицию назад и сбрасывает статус в pending', () => {
    let s = handleKey(createEngine('abc'), 'a');
    s = handleKey(s, 'Backspace');
    expect(s.position).toBe(0);
    expect(s.charStates).toEqual(['pending', 'pending', 'pending']);
  });

  it('backspace на нулевой позиции — no-op', () => {
    const s = handleKey(createEngine('abc'), 'Backspace');
    expect(s).toEqual(createEngine('abc'));
  });

  it('пробел обрабатывается как обычный символ', () => {
    let s = handleKey(createEngine('a b'), 'a');
    s = handleKey(s, ' ');
    expect(s.position).toBe(2);
    expect(s.charStates[1]).toBe('correct');
  });

  it('игнорирует служебные клавиши', () => {
    const s = handleKey(createEngine('abc'), 'Shift');
    expect(s.position).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.wrong).toBe(0);
  });

  it('завершает текст после последнего символа и игнорирует дальнейший ввод', () => {
    let s = createEngine('a');
    s = handleKey(s, 'a');
    expect(s.finished).toBe(true);
    expect(s.position).toBe(1);

    const after = handleKey(s, 'b');
    expect(after).toEqual(s);
  });

  it('пустой текст сразу завершён', () => {
    const s = createEngine('');
    expect(s.finished).toBe(true);
  });
});
