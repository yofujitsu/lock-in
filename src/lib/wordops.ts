/**
 * Словесные операции для тренажёра печати.
 *
 * Работают поверх `EngineState` и не мутируют исходное состояние:
 * возвращают новое (иммутабельно). Счётчики correct/wrong не трогаем —
 * меняем только позицию каретки и, при удалении, статусы символов.
 */

import type { EngineState } from './engine';

/**
 * Индекс первого символа слова, в котором сейчас находится каретка.
 * Если каретка стоит на пробеле или в самом начале текста — возвращаем
 * текущую позицию. Иначе отступаем влево, пока предыдущий символ не пробел.
 */
export function currentWordStart(state: EngineState): number {
  if (state.position === 0 || state.text[state.position] === ' ') {
    return state.position;
  }
  let start = state.position;
  while (start > 0 && state.text[start - 1] !== ' ') {
    start -= 1;
  }
  return start;
}

/**
 * Индекс первого символа СЛЕДУЮЩЕГО слова после каретки.
 * Идём вправо до первого пробела (конец текущего слова), затем мимо пробелов
 * до следующего непробельного символа. Если следующего слова нет —
 * возвращаем `state.text.length`.
 */
export function nextWordStart(state: EngineState): number {
  let i = state.position;
  // До конца текущего слова (первый пробел).
  while (i < state.text.length && state.text[i] !== ' ') {
    i += 1;
  }
  // Пропускаем пробелы до начала следующего слова.
  while (i < state.text.length && state.text[i] === ' ') {
    i += 1;
  }
  return i;
}

/**
 * Удаляет текущее незавершённое слово: сбрасывает набранные символы в
 * `'pending'` и возвращает каретку к началу слова. Если каретка уже в начале
 * слова (или на пробеле) — состояние возвращается без изменений. Счётчики
 * correct/wrong не меняются.
 */
export function deleteCurrentWord(state: EngineState): EngineState {
  const start = currentWordStart(state);
  if (start === state.position) {
    return state;
  }
  const charStates = state.charStates.slice();
  for (let i = start; i < state.position; i += 1) {
    charStates[i] = 'pending';
  }
  return { ...state, position: start, charStates, finished: false };
}

/**
 * Перемещает каретку к началу следующего слова. Если следующего слова нет
 * (каретка в конце текста) — состояние возвращается без изменений.
 * charStates и счётчики не меняются.
 */
export function skipWord(state: EngineState): EngineState {
  const next = nextWordStart(state);
  if (next <= state.position) {
    return state;
  }
  return { ...state, position: next, finished: next >= state.text.length };
}
