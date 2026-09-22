/**
 * Typing engine — посимвольная машина состояний для тренажёра печати.
 *
 * Соглашения:
 * - Работаем с `e.key` (фактический символ), а не `e.code` — раскладка EN/RU не важна.
 * - Позиция сдвигается только на верный символ.
 * - Неверный символ помечается как ошибка, позиция остаётся, ждём следующего нажатия.
 * - Backspace возвращает на позицию назад и сбрасывает её статус в pending.
 * - Счётчики correct/wrong — накопительные («gross»): не уменьшаются при backspace,
 *   используются для расчёта метрик (WPM/accuracy).
 *
 * Модуль чистый: без DOM, без таймеров — удобно тестировать изолированно от UI.
 */

export type CharStatus = 'pending' | 'correct' | 'wrong' | 'skipped';

export interface EngineState {
  /** Целевой текст, который нужно набрать. */
  text: string;
  /** Индекс символа, который сейчас нужно набрать. */
  position: number;
  /** Статус каждого символа целевого текста (для отрисовки/подсветки). */
  charStates: CharStatus[];
  /** Количество верно набранных символов (накопительно). */
  correct: number;
  /** Количество ошибочных нажатий (накопительно). */
  wrong: number;
  /** Текст набран полностью. */
  finished: boolean;
}

export function createEngine(text: string): EngineState {
  return {
    text,
    position: 0,
    charStates: new Array<CharStatus>(text.length).fill('pending'),
    correct: 0,
    wrong: 0,
    finished: text.length === 0,
  };
}

/** Печатный ли символ (один символ, включая пробел). */
export function isPrintableKey(key: string): boolean {
  return key.length === 1;
}

const EQUIVALENTS: Record<string, string> = {
  '“': '"', '”': '"', '„': '"', '«': '"', '»': '"', // двойные кавычки → "
  '’': "'", '‘': "'",                                 // одинарные → '
  '–': '-', '—': '-',                                 // тире → -
};

/** Считает типографские кавычки/тире эквивалентными ASCII-нажатиям. */
export function equivalent(a: string, b: string): boolean {
  const norm = (c: string) => EQUIVALENTS[c] ?? c;
  return norm(a) === norm(b);
}

/**
 * Обрабатывает одно нажатие и возвращает новое состояние (иммутабельно).
 * Модификаторы и служебные клавиши (Shift/Ctrl/Enter/Tab/…) игнорируются.
 */
export function handleKey(state: EngineState, key: string): EngineState {
  if (state.finished) return state;

  if (key === 'Backspace') {
    if (state.position === 0) return state;
    const position = state.position - 1;
    const charStates = state.charStates.slice();
    charStates[position] = 'pending';
    return { ...state, position, charStates, finished: false };
  }

  if (!isPrintableKey(key)) return state;

  const expected = state.text[state.position];

  if (key === expected || equivalent(key, expected)) {
    const position = state.position + 1;
    const charStates = state.charStates.slice();
    charStates[state.position] = 'correct';
    return {
      ...state,
      position,
      charStates,
      correct: state.correct + 1,
      finished: position >= state.text.length,
    };
  }

  // Ошибка: помечаем текущий символ, позицию не двигаем.
  const charStates = state.charStates.slice();
  charStates[state.position] = 'wrong';
  return { ...state, charStates, wrong: state.wrong + 1 };
}
