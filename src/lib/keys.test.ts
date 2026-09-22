import { describe, it, expect } from 'vitest';
import { isEditableTarget, keydownAction } from './keys';

describe('isEditableTarget', () => {
  it('определяет поля ввода и contentEditable', () => {
    expect(isEditableTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isEditableTarget({ isContentEditable: true })).toBe(true);
  });

  it('не считает полем ввода кнопки/div/null/строку', () => {
    expect(isEditableTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isEditableTarget({ tagName: 'DIV' })).toBe(false);
    expect(isEditableTarget({ tagName: 'BODY' })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget('text')).toBe(false);
  });
});

describe('keydownAction', () => {
  it('в поле ввода — ignore (не перехватываем ввод)', () => {
    const ev = { key: 'a', ctrlKey: false, metaKey: false, altKey: false };
    expect(keydownAction(ev, { tagName: 'INPUT' })).toBe('ignore');
  });

  it('печатный символ — input', () => {
    const ev = { key: 'a', ctrlKey: false, metaKey: false, altKey: false };
    expect(keydownAction(ev, { tagName: 'BODY' })).toBe('input');
  });

  it('Ctrl+Z / Ctrl+A / Ctrl+C / Ctrl+V — ignore (оставляем шорткаты браузеру)', () => {
    for (const key of ['z', 'a', 'c', 'v']) {
      expect(keydownAction({ key, ctrlKey: true, metaKey: false, altKey: false }, { tagName: 'BODY' })).toBe('ignore');
    }
  });

  it('Ctrl+Backspace — deleteWord', () => {
    expect(keydownAction({ key: 'Backspace', ctrlKey: true, metaKey: false, altKey: false }, { tagName: 'BODY' })).toBe('deleteWord');
  });

  it('Tab — skipWord; Escape/стрелки — ignore', () => {
    expect(keydownAction({ key: 'Tab', ctrlKey: false, metaKey: false, altKey: false }, { tagName: 'BODY' })).toBe('skipWord');
    expect(keydownAction({ key: 'Escape', ctrlKey: false, metaKey: false, altKey: false }, { tagName: 'BODY' })).toBe('ignore');
    expect(keydownAction({ key: 'ArrowLeft', ctrlKey: false, metaKey: false, altKey: false }, { tagName: 'BODY' })).toBe('ignore');
  });

  it('Meta/Alt — ignore', () => {
    expect(keydownAction({ key: 'a', ctrlKey: false, metaKey: true, altKey: false }, { tagName: 'BODY' })).toBe('ignore');
    expect(keydownAction({ key: 'a', ctrlKey: false, metaKey: false, altKey: true }, { tagName: 'BODY' })).toBe('ignore');
  });
});
