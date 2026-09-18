import { describe, it, expect } from 'vitest';
import { createEcho, echoInput, countWords } from './echo';

describe('createEcho', () => {
  it('возвращает пустой текст', () => {
    expect(createEcho()).toEqual({ text: '' });
  });
});

describe('echoInput', () => {
  it('дописывает печатные символы', () => {
    let state = createEcho();
    state = echoInput(state, 'h');
    state = echoInput(state, 'i');
    expect(state.text).toBe('hi');
  });

  it('дописывает пробел', () => {
    let state = createEcho();
    state = echoInput(state, 'a');
    state = echoInput(state, ' ');
    state = echoInput(state, 'b');
    expect(state.text).toBe('a b');
  });

  it('Backspace удаляет последний символ', () => {
    let state = createEcho();
    state = echoInput(state, 'a');
    state = echoInput(state, 'b');
    state = echoInput(state, 'Backspace');
    expect(state.text).toBe('a');
  });

  it('Backspace на пустом состоянии — no-op', () => {
    const state = createEcho();
    const next = echoInput(state, 'Backspace');
    expect(next).toBe(state);
    expect(next.text).toBe('');
  });

  it('игнорирует модификаторы и служебные клавиши', () => {
    let state = createEcho();
    state = echoInput(state, 'a');
    for (const key of ['Shift', 'Enter', 'Tab', 'Control']) {
      state = echoInput(state, key);
    }
    expect(state.text).toBe('a');
  });

  it('возвращает новый объект только при изменении', () => {
    const state = createEcho();
    const appended = echoInput(state, 'x');
    expect(appended).not.toBe(state);

    const ignored = echoInput(state, 'Shift');
    expect(ignored).toBe(state);
  });
});

describe('countWords', () => {
  it('пустая строка → 0', () => {
    expect(countWords('')).toBe(0);
  });

  it('одно слово → 1', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('несколько слов → верное количество', () => {
    expect(countWords('the quick brown fox')).toBe(4);
  });

  it('обрабатывает лишние пробелы', () => {
    expect(countWords('  the   quick  brown   fox  ')).toBe(4);
  });
});
