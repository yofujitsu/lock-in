/**
 * Режим «свободного эха» — набираемый текст без целевой строки.
 *
 * Соглашения:
 * - Работаем с `e.key` (фактический символ), а не `e.code`.
 * - Печатные символы (включая пробел) дописываются в конец текста.
 * - Backspace удаляет последний символ; на пустой строке — no-op.
 * - Модификаторы и служебные клавиши (Shift/Ctrl/Enter/Tab/…) игнорируются.
 * - Состояние неизменяемо: каждое изменение возвращает новый объект.
 *
 * Модуль чистый: без DOM, без React — удобно тестировать изолированно.
 */

/** Текст, набранный в режиме свободного эха. */
export interface EchoState {
  text: string;
}

/** Создаёт начальное пустое состояние. */
export function createEcho(): EchoState {
  return { text: '' };
}

/**
 * Обрабатывает одно нажатие и возвращает новое состояние (иммутабельно).
 * При отсутствии изменения возвращает то же самое состояние.
 */
export function echoInput(state: EchoState, key: string): EchoState {
  if (key === 'Backspace') {
    if (state.text === '') return state;
    return { text: state.text.slice(0, -1) };
  }

  // Печатный символ — ровно один (включая пробел).
  if (key.length === 1) {
    return { text: state.text + key };
  }

  return state;
}

/**
 * Количество слов в тексте: `text.trim().split(/\s+/).filter(Boolean).length`.
 * Пустая строка → 0.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
