/**
 * Помощники для клавиатурного ввода тренажёра.
 * Чистые функции: без DOM-глобалов, тестируются в node.
 */

export interface KeyEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export type KeyAction = 'input' | 'deleteWord' | 'skipWord' | 'ignore';

/** Элемент формы, в который пользователь печатает текст (input/textarea/select/contentEditable). */
export function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as { isContentEditable?: boolean; tagName?: string };
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Что делать с нажатием клавиши в контексте набора текста.
 * - В полях ввода — ignore (браузер сам обрабатывает ввод).
 * - С модификаторами (Ctrl/Meta/Alt) — ignore, кроме Ctrl+Backspace.
 * - Tab — пропустить слово.
 * - Печатный символ / Backspace — ввод.
 */
export function keydownAction(e: KeyEventLike, target: unknown): KeyAction {
  if (isEditableTarget(target)) return 'ignore';
  if (e.metaKey || e.altKey || e.ctrlKey) {
    return e.key === 'Backspace' && e.ctrlKey ? 'deleteWord' : 'ignore';
  }
  if (e.key === 'Tab') return 'skipWord';
  if (e.key.length === 1 || e.key === 'Backspace') return 'input';
  return 'ignore';
}
