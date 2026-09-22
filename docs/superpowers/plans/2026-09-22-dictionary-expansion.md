# Dictionary Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add thematic typing content (quotes, punctuation-rich sentences, passages, thematic word lists) and a clean seam for a future AI generator.

**Architecture:** Extend `ContentType` to `words | sentences | quotes | passages`, add a `WordTopic` dimension for words, source curated offline JSON behind a single `TextSource` object, and add punctuation normalization in the engine so typographic characters (`—`, `«…»`, `“…”`, `’`) are typeable with ordinary keys.

**Tech Stack:** Tauri 2, React 18, TypeScript, Vite, Vitest (TDD).

**Spec:** `tasks/dictionary-expansion-spec.md`

## Global Constraints

- Version bump `0.3.0 → 0.4.0` in exactly 4 files: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src/lib/changelog.ts` (plus `CHANGELOG.md`).
- All new content files go in `src/data/` and are imported as JSON.
- `ContentType = 'words' | 'sentences' | 'quotes' | 'passages'`; `WordTopic = 'general' | 'programming' | 'tech'`.
- Sentences/quotes/passages must end with punctuation; no double spaces; no leading/trailing whitespace.
- Topic word lists obey the same constraints as `words-en.json`/`words-ru.json`: lowercase, single token, `[a-z]+` (EN) / `[а-яё]+` (RU).
- UI copy is English-only (labels: Words, Sentences, Quotes, Passages; topics: General, Programming, Tech).
- Echo mode is untouched.
- Existing ASCII engine tests must keep passing.
- Every task ends green on `pnpm test` (targeted) and, where noted, `pnpm typecheck`.

## Review Focus

The five failure modes the spec implies but no task's tests would otherwise exercise:

1. Typographic punctuation (`—`, `«…»`, `“…”`, `’`) must be typeable with ASCII keys — pinned by Task 1 tests.
2. Quote attribution must never be part of the typed text (must not distort WPM) — pinned by Task 3 `generateQuotes`/`generateText` tests.
3. New content types must appear in Profile/history stats, not collapse into "Words" — pinned by Task 4 tests.
4. Data quality: every sentence/quote/passage ends with punctuation, no double spaces — pinned by Task 2 data tests.
5. Topic selector shows only for `words`; switching content type never leaves a stale topic — enforced in Task 5 by conditional render + typecheck.

---

### Task 1: Punctuation normalization in the engine

**Files:**
- Modify: `src/lib/engine.ts`
- Test: `src/lib/engine.test.ts`

**Interfaces:**
- Produces: `equivalent(a: string, b: string): boolean` (exported); `handleKey` accepts typographic chars as equivalent to their ASCII counterparts.

- [ ] **Step 1: Write the failing tests**

In `src/lib/engine.test.ts`, change the import on line 2 to include `equivalent`:

```ts
import { createEngine, equivalent, handleKey, isPrintableKey } from './engine';
```

Append two new describe blocks at the end of the file:

```ts
describe('equivalent', () => {
  it('считает типографские кавычки эквивалентными ASCII', () => {
    expect(equivalent('"', '“')).toBe(true);
    expect(equivalent('"', '”')).toBe(true);
    expect(equivalent('"', '«')).toBe(true);
    expect(equivalent('"', '»')).toBe(true);
    expect(equivalent("'", '’')).toBe(true);
  });

  it('считает тире эквивалентными дефису', () => {
    expect(equivalent('-', '–')).toBe(true);
    expect(equivalent('-', '—')).toBe(true);
  });

  it('различает обычные символы', () => {
    expect(equivalent('a', 'b')).toBe(false);
    expect(equivalent('ё', 'е')).toBe(false);
  });
});

describe('handleKey: типографская пунктуация', () => {
  it('нажатие ASCII-кавычки принимает «ёлочку» как correct', () => {
    const s = handleKey(createEngine('«Привет»'), '"');
    expect(s.position).toBe(1);
    expect(s.charStates[0]).toBe('correct');
    expect(s.correct).toBe(1);
  });

  it('нажатие дефиса принимает длинное тире как correct и завершает текст', () => {
    const s = handleKey(createEngine('—'), '-');
    expect(s.finished).toBe(true);
    expect(s.charStates).toEqual(['correct']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/engine.test.ts`
Expected: FAIL — `equivalent` is not exported (import error / undefined).

- [ ] **Step 3: Write the minimal implementation**

In `src/lib/engine.ts`, add the equivalence table and function after `isPrintableKey` (after line 46):

```ts
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
```

Change the comparison in `handleKey` (currently line 67):

```ts
  if (key === expected) {
```

to:

```ts
  if (key === expected || equivalent(key, expected)) {
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/engine.test.ts`
Expected: PASS (all existing + new tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine.ts src/lib/engine.test.ts
git commit -m "feat(engine): accept typographic quotes/dashes via ASCII keys"
```

---

### Task 2: Curated data files + README + data-quality tests

**Files:**
- Create: `src/data/quotes-en.json`, `src/data/quotes-ru.json`, `src/data/sentences-en.json`, `src/data/sentences-ru.json`, `src/data/passages-en.json`, `src/data/passages-ru.json`, `src/data/topics-en.json`, `src/data/topics-ru.json`
- Modify: `src/data/README.md`
- Test: `src/lib/dictionaryData.test.ts`

**Interfaces:**
- Produces JSON consumed by Task 3:
  - quotes: `Array<{ text: string; source: string }>`
  - sentences: `string[]`
  - passages: `string[]`
  - topics: `{ programming: string[]; tech: string[] }` (top-level keys; `general` comes from the existing `words-*.json`)

- [ ] **Step 1: Create the data files**

Each file is valid JSON (UTF-8, no BOM). Content rules: sentences/quotes/passages end with punctuation (`. ! ? …` or a closing quote `» ”`), single spaces only, no leading/trailing whitespace. Use typographic punctuation freely (`—`, `«…»`, `“…”`, `’`) — Task 1 makes it typeable.

`src/data/quotes-en.json` — 40–60 entries, shape `{"text": "...", "source": "..."}`, public-domain authors/proverbs. Start with these and continue in the same style:

```json
[
  { "text": "The secret of getting ahead is getting started.", "source": "Mark Twain" },
  { "text": "Be yourself; everyone else is already taken.", "source": "Oscar Wilde" },
  { "text": "To be, or not to be: that is the question.", "source": "William Shakespeare" },
  { "text": "It does not matter how slowly you go as long as you do not stop.", "source": "Confucius" },
  { "text": "Simplicity is the ultimate sophistication.", "source": "Leonardo da Vinci" }
]
```

`src/data/quotes-ru.json` — 40–60 entries, Russian classics (public domain) and proverbs:

```json
[
  { "text": "Краткость — сестра таланта.", "source": "Антон Чехов" },
  { "text": "Тише едешь — дальше будешь.", "source": "Пословица" },
  { "text": "Век живи — век учись.", "source": "Пословица" },
  { "text": "Безумству храбрых поём мы песню.", "source": "Максим Горький" },
  { "text": "Мы в ответе за тех, кого приручили.", "source": "Антуан де Сент-Экзюпери" }
]
```

`src/data/sentences-en.json` — 60–100 natural sentences:

```json
[
  "Practice makes perfect, so keep typing every day.",
  "A journey of a thousand miles begins with a single step.",
  "The early bird catches the worm, but the second mouse gets the cheese.",
  "Well begun is half done.",
  "Actions speak louder than words."
]
```

`src/data/sentences-ru.json` — 60–100 natural sentences:

```json
[
  "Съешь же ещё этих мягких французских булок, да выпей чаю.",
  "Без труда не вытащишь и рыбку из пруда.",
  "Семь раз отмерь — один раз отрежь.",
  "Делу время, потехе час.",
  "Повторение — мать учения."
]
```

`src/data/passages-en.json` — 15–25 short passages (2–4 sentences each):

```json
[
  "Typing is a skill that rewards steady practice. A little time each day builds muscle memory faster than occasional long sessions. Focus on accuracy first, and speed will follow on its own.",
  "The best way to learn is to do. Make mistakes, correct them, and try again. Progress is rarely a straight line, but it always moves forward for those who keep going."
]
```

`src/data/passages-ru.json` — 15–25 short passages:

```json
[
  "Слепая печать развивается только с практикой. Короткие ежедневные занятия дают больше, чем редкие и долгие. Сначала точность, потом скорость.",
  "Лучший способ научиться — делать. Ошибайся, исправляй и пробуй снова. Прогресс редко бывает прямой линией, но он всегда движется вперёд для тех, кто продолжает."
]
```

`src/data/topics-en.json` — 60–120 lowercase single tokens per topic:

```json
{
  "programming": ["array", "async", "binary", "boolean", "buffer", "class", "closure", "compiler", "constant", "debug", "deploy", "function", "integer", "interface", "iterator", "loop", "method", "module", "object", "pointer", "queue", "recursion", "refactor", "runtime", "scope", "stack", "syntax", "thread", "variable", "vector"],
  "tech": ["algorithm", "bandwidth", "browser", "cloud", "console", "database", "desktop", "digital", "encryption", "firewall", "firmware", "hardware", "kernel", "keyboard", "laptop", "memory", "monitor", "network", "protocol", "router", "screen", "server", "software", "storage", "system", "terminal", "update", "upload", "wireless", "workstation"]
}
```

`src/data/topics-ru.json` — 60–120 lowercase single tokens per topic:

```json
{
  "programming": ["алгоритм", "массив", "буфер", "переменная", "функция", "класс", "объект", "цикл", "очередь", "стек", "синтаксис", "отладка", "компилятор", "интерфейс", "модуль", "метод", "рекурсия", "указатель", "константа", "поток", "двоичный", "логика", "строка", "число", "список", "словарь", "кортеж", "ветвление", "итерация", "рефакторинг"],
  "tech": ["браузер", "сервер", "сеть", "экран", "клавиатура", "ноутбук", "монитор", "протокол", "роутер", "программа", "хранение", "система", "терминал", "обновление", "загрузка", "шифрование", "брандмауэр", "прошивка", "ядро", "память", "данные", "цифровой", "облако", "консоль", "база", "файл", "папка", "ссылка", "почта", "устройство"]
}
```

- [ ] **Step 2: Write the data-quality test**

Create `src/lib/dictionaryData.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import enQuotes from '../data/quotes-en.json';
import ruQuotes from '../data/quotes-ru.json';
import enSentences from '../data/sentences-en.json';
import ruSentences from '../data/sentences-ru.json';
import enPassages from '../data/passages-en.json';
import ruPassages from '../data/passages-ru.json';
import enTopics from '../data/topics-en.json';
import ruTopics from '../data/topics-ru.json';

// Последний символ не должен быть буквой/цифрой/пробелом (т.е. это пунктуация).
const ENDS_WITH_LETTER = /[\p{L}\p{N}\s]$/u;

function expectCleanText(s: string) {
  expect(s.trim()).toBe(s);
  expect(s).not.toMatch(/\s{2,}/);
  expect(ENDS_WITH_LETTER.test(s)).toBe(false);
}

describe('data: предложения', () => {
  it.each(['en', 'ru'] as const)('%s: непустой, пунктуация в конце', (lang) => {
    const list = lang === 'en' ? enSentences : ruSentences;
    expect(list.length).toBeGreaterThanOrEqual(60);
    for (const s of list) expectCleanText(s);
  });
});

describe('data: цитаты', () => {
  it.each(['en', 'ru'] as const)('%s: структура и пунктуация', (lang) => {
    const list = lang === 'en' ? enQuotes : ruQuotes;
    expect(list.length).toBeGreaterThanOrEqual(40);
    for (const q of list) {
      expect(typeof q.text).toBe('string');
      expect(typeof q.source).toBe('string');
      expect(q.source.length).toBeGreaterThan(0);
      expectCleanText(q.text);
    }
  });
});

describe('data: отрывки', () => {
  it.each(['en', 'ru'] as const)('%s: непустой, пунктуация в конце', (lang) => {
    const list = lang === 'en' ? enPassages : ruPassages;
    expect(list.length).toBeGreaterThanOrEqual(15);
    for (const s of list) expectCleanText(s);
  });
});

describe('data: темы слов', () => {
  it.each(['en', 'ru'] as const)('%s: темы programming/tech, одиночные токены', (lang) => {
    const topics = lang === 'en' ? enTopics : ruTopics;
    const re = lang === 'en' ? /^[a-z]+$/ : /^[а-яё]+$/;
    for (const topic of ['programming', 'tech'] as const) {
      const words = topics[topic];
      expect(words.length).toBeGreaterThanOrEqual(60);
      for (const w of words) expect(w).toMatch(re);
    }
  });
});
```

- [ ] **Step 3: Run the data test**

Run: `pnpm test src/lib/dictionaryData.test.ts`
Expected: PASS.

- [ ] **Step 4: Document sources in `src/data/README.md`**

Append a new section after the existing word-list section (after line 64):

```markdown
# Thematic texts (`quotes-*.json`, `sentences-*.json`, `passages-*.json`, `topics-*.json`)

Curated offline content for the quotes / sentences / passages modes and the
thematic word topics. All text is public-domain (classical authors, proverbs,
folklore) or original prose written for this project; no material is copied
from copyrighted works.

| File | Language | Content | Notes |
| --- | --- | --- | --- |
| `quotes-en.json` | English | `[{text, source}]` | public-domain authors & proverbs, attributed |
| `quotes-ru.json` | Russian | `[{text, source}]` | Russian classics (public domain) & proverbs |
| `sentences-en.json` | English | `string[]` | natural sentences, hand-curated |
| `sentences-ru.json` | Russian | `string[]` | natural sentences, hand-curated |
| `passages-en.json` | English | `string[]` | original 2–4 sentence passages |
| `passages-ru.json` | Russian | `string[]` | original 2–4 sentence passages |
| `topics-en.json` | English | `{programming, tech}` | hand-curated lowercase single tokens |
| `topics-ru.json` | Russian | `{programming, tech}` | hand-curated lowercase single tokens |

Constraints: sentences/quotes/passages end with punctuation and contain no
double spaces; topic words match `[a-z]+` (EN) / `[а-яё]+` (RU), lowercase,
single token. Verified by `src/lib/dictionaryData.test.ts`.
```

- [ ] **Step 5: Commit**

```bash
git add src/data/quotes-en.json src/data/quotes-ru.json src/data/sentences-en.json src/data/sentences-ru.json src/data/passages-en.json src/data/passages-ru.json src/data/topics-en.json src/data/topics-ru.json src/data/README.md src/lib/dictionaryData.test.ts
git commit -m "feat(data): add curated thematic quotes, sentences, passages, and word topics"
```

---

### Task 3: Dictionary module refactor

**Files:**
- Modify: `src/lib/dictionary.ts` (full rewrite)
- Test: `src/lib/dictionary.test.ts` (full rewrite)

**Interfaces:**
- Consumes: JSON files from Task 2.
- Produces (consumed by Tasks 4–5):
  - `type ContentType = 'words' | 'sentences' | 'quotes' | 'passages'`
  - `type WordTopic = 'general' | 'programming' | 'tech'`
  - `interface Quote { text: string; source: string }`
  - `interface Dictionary { words: Record<WordTopic, string[]>; sentences: string[]; quotes: Quote[]; passages: string[] }`
  - `const DICTIONARIES: Record<Language, Dictionary>`
  - `const WORD_TOPICS: WordTopic[]`
  - `const CONTENT_TYPES: ContentType[]`
  - `contentTypeLabel(type: ContentType): string`
  - `wordTopicLabel(topic: WordTopic): string`
  - `interface TextSource { words(lang, topic): string[]; sentences(lang): string[]; quotes(lang): Quote[]; passages(lang): string[] }`
  - `const STATIC_SOURCE: TextSource`
  - `generateWords(lang, count, rng?, topic?, source?): string`
  - `generateSentences(lang, count, rng?, source?): string`
  - `generatePassages(lang, count, rng?, source?): string`
  - `generateQuotes(lang, count, rng?, source?): { text: string; attribution: string }`
  - `generateText(lang, contentType, seconds, wordTopic?, rng?, source?): { text: string; attribution?: string }`

- [ ] **Step 1: Write the failing test file**

Replace the entire contents of `src/lib/dictionary.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import {
  CONTENT_TYPES,
  DICTIONARIES,
  WORD_TOPICS,
  contentTypeLabel,
  generatePassages,
  generateQuotes,
  generateSentences,
  generateText,
  generateWords,
  wordTopicLabel,
} from './dictionary';

const zeroRng = () => 0;
const lastRng = () => 0.999999;

describe('generateWords', () => {
  it('генерирует нужное количество слов через пробел', () => {
    expect(generateWords('en', 5, zeroRng).split(' ')).toHaveLength(5);
  });

  it('с rng=0 всегда берёт первое слово темы', () => {
    const first = DICTIONARIES.en.words.general[0];
    expect(generateWords('en', 3, zeroRng)).toBe(`${first} ${first} ${first}`);
  });

  it('с rng≈1 берёт последнее слово темы', () => {
    const list = DICTIONARIES.ru.words.general;
    const last = list[list.length - 1];
    expect(generateWords('ru', 2, lastRng)).toBe(`${last} ${last}`);
  });

  it('тема programming берёт слова из тематического списка', () => {
    const first = DICTIONARIES.en.words.programming[0];
    expect(generateWords('en', 2, zeroRng, 'programming')).toBe(`${first} ${first}`);
  });

  it('слова всех тем не содержат пробелов', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const topic of WORD_TOPICS) {
        for (const word of DICTIONARIES[lang].words[topic]) {
          expect(word).not.toContain(' ');
        }
      }
    }
  });
});

describe('generateSentences', () => {
  it('соединяет предложения через пробел', () => {
    const s = DICTIONARIES.en.sentences[0];
    expect(generateSentences('en', 2, zeroRng)).toBe(`${s} ${s}`);
  });

  it('каждое предложение оканчивается пунктуацией', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const s of DICTIONARIES[lang].sentences) {
        expect(/[.!?…]$/.test(s)).toBe(true);
      }
    }
  });
});

describe('generateQuotes', () => {
  it('возвращает текст и атрибуцию', () => {
    const q = DICTIONARIES.en.quotes[0];
    const res = generateQuotes('en', 1, zeroRng);
    expect(res.text).toBe(q.text);
    expect(res.attribution).toBe(q.source);
  });

  it('соединяет несколько цитат через пробел и атрибуции через ·', () => {
    const q = DICTIONARIES.ru.quotes[0];
    const res = generateQuotes('ru', 2, zeroRng);
    expect(res.text).toBe(`${q.text} ${q.text}`);
    expect(res.attribution).toBe(`${q.source} · ${q.source}`);
  });
});

describe('generatePassages', () => {
  it('генерирует нужное количество отрывков', () => {
    const p = DICTIONARIES.en.passages[0];
    expect(generatePassages('en', 2, zeroRng)).toBe(`${p} ${p}`);
  });
});

describe('generateText', () => {
  it('quotes возвращает атрибуцию, words — нет', () => {
    expect(generateText('en', 'quotes', null).attribution).toBeTruthy();
    expect(generateText('en', 'words', null).attribution).toBeUndefined();
  });

  it('sentences: free даёт 4 предложения (одно и то же при rng=0)', () => {
    const s = DICTIONARIES.en.sentences[0];
    expect(generateText('en', 'sentences', null, 'general', zeroRng).text).toBe(
      `${s} ${s} ${s} ${s}`,
    );
  });

  it('quotes: timed 30s даёт 3 цитаты (одну и ту же при rng=0)', () => {
    const q = DICTIONARIES.en.quotes[0];
    const res = generateText('en', 'quotes', 30, 'general', zeroRng);
    expect(res.text).toBe(`${q.text} ${q.text} ${q.text}`);
    expect(res.attribution).toBe(`${q.source} · ${q.source} · ${q.source}`);
  });
});

describe('labels', () => {
  it('contentTypeLabel даёт подписи для всех типов', () => {
    expect(CONTENT_TYPES.map(contentTypeLabel)).toEqual(['Words', 'Sentences', 'Quotes', 'Passages']);
  });

  it('wordTopicLabel даёт подписи для тем', () => {
    expect(WORD_TOPICS.map(wordTopicLabel)).toEqual(['General', 'Programming', 'Tech']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/dictionary.test.ts`
Expected: FAIL — named exports (`generateQuotes`, `CONTENT_TYPES`, etc.) do not exist.

- [ ] **Step 3: Write the full implementation**

Replace the entire contents of `src/lib/dictionary.ts` with:

```ts
/**
 * Словари и генерация текста для набора.
 *
 * Списки слов загружены из публичных частотных наборов (см. src/data/README.md):
 * - EN: google-10000-english (first20hours/google-10000-english), топ-1500.
 * - RU: OpenSubtitles2018 frequency list (hermitdave/FrequencyWords), топ-1500.
 * Тематические тексты (цитаты/предложения/отрывки/темы слов) курируются вручную
 * и лежат в src/data/*.json (см. src/data/README.md).
 */

import enWords from '../data/words-en.json';
import ruWords from '../data/words-ru.json';
import enTopics from '../data/topics-en.json';
import ruTopics from '../data/topics-ru.json';
import enSentences from '../data/sentences-en.json';
import ruSentences from '../data/sentences-ru.json';
import enQuotes from '../data/quotes-en.json';
import ruQuotes from '../data/quotes-ru.json';
import enPassages from '../data/passages-en.json';
import ruPassages from '../data/passages-ru.json';

export type Language = 'en' | 'ru';
export type ContentType = 'words' | 'sentences' | 'quotes' | 'passages';
export type WordTopic = 'general' | 'programming' | 'tech';

export interface Quote {
  text: string;
  source: string;
}

export interface Dictionary {
  words: Record<WordTopic, string[]>;
  sentences: string[];
  quotes: Quote[];
  passages: string[];
}

export const WORD_TOPICS: WordTopic[] = ['general', 'programming', 'tech'];
export const CONTENT_TYPES: ContentType[] = ['words', 'sentences', 'quotes', 'passages'];

export function contentTypeLabel(type: ContentType): string {
  switch (type) {
    case 'words': return 'Words';
    case 'sentences': return 'Sentences';
    case 'quotes': return 'Quotes';
    case 'passages': return 'Passages';
  }
}

export function wordTopicLabel(topic: WordTopic): string {
  switch (topic) {
    case 'general': return 'General';
    case 'programming': return 'Programming';
    case 'tech': return 'Tech';
  }
}

export const DICTIONARIES: Record<Language, Dictionary> = {
  en: {
    words: { general: enWords, ...enTopics },
    sentences: enSentences,
    quotes: enQuotes,
    passages: enPassages,
  },
  ru: {
    words: { general: ruWords, ...ruTopics },
    sentences: ruSentences,
    quotes: ruQuotes,
    passages: ruPassages,
  },
};

export type Rng = () => number;

/** Источник текстов — точка расширения под будущий AI-генератор. */
export interface TextSource {
  words(lang: Language, topic: WordTopic): string[];
  sentences(lang: Language): string[];
  quotes(lang: Language): Quote[];
  passages(lang: Language): string[];
}

export const STATIC_SOURCE: TextSource = {
  words: (lang, topic) => DICTIONARIES[lang].words[topic],
  sentences: (lang) => DICTIONARIES[lang].sentences,
  quotes: (lang) => DICTIONARIES[lang].quotes,
  passages: (lang) => DICTIONARIES[lang].passages,
};

function pick<T>(list: T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)];
}

/** Генерирует текст из `count` случайных слов через пробел. */
export function generateWords(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  topic: WordTopic = 'general',
  source: TextSource = STATIC_SOURCE,
): string {
  const words = source.words(lang, topic);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(words, rng));
  return out.join(' ');
}

/** Генерирует текст из `count` случайных предложений. */
export function generateSentences(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): string {
  const sentences = source.sentences(lang);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(sentences, rng));
  return out.join(' ');
}

/** Генерирует текст из `count` случайных отрывков. */
export function generatePassages(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): string {
  const passages = source.passages(lang);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(passages, rng));
  return out.join(' ');
}

export interface GeneratedQuote {
  text: string;
  attribution: string;
}

/** Генерирует текст из `count` случайных цитат + строку атрибуции. */
export function generateQuotes(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): GeneratedQuote {
  const quotes = source.quotes(lang);
  const picked = Array.from({ length: count }, () => pick(quotes, rng));
  return {
    text: picked.map((q) => q.text).join(' '),
    attribution: picked.map((q) => q.source).join(' · '),
  };
}

export interface GeneratedText {
  text: string;
  attribution?: string;
}

/** Генерирует текст сессии по типу контента, длительности и теме слов. */
export function generateText(
  lang: Language,
  contentType: ContentType,
  seconds: number | null,
  wordTopic: WordTopic = 'general',
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
): GeneratedText {
  switch (contentType) {
    case 'sentences': {
      const count = seconds === null ? 4 : Math.max(4, Math.ceil(seconds / 12));
      return { text: generateSentences(lang, count, rng, source) };
    }
    case 'quotes': {
      const count = seconds === null ? 3 : Math.max(3, Math.ceil(seconds / 20));
      return generateQuotes(lang, count, rng, source);
    }
    case 'passages': {
      const count = seconds === null ? 2 : Math.max(2, Math.ceil(seconds / 30));
      return { text: generatePassages(lang, count, rng, source) };
    }
    default: {
      const count = seconds === null ? 80 : Math.max(80, Math.min(seconds * 2, 400));
      return { text: generateWords(lang, count, rng, wordTopic, source) };
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/dictionary.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dictionary.ts src/lib/dictionary.test.ts
git commit -m "feat(dictionary): add quotes/passages/topics, TextSource seam, and generateText"
```

---

### Task 4: Stats content-type labels + typed history field

**Files:**
- Modify: `src/lib/history.ts:6-17`
- Modify: `src/lib/stats.ts:96-107`
- Test: `src/lib/stats.test.ts:62-67`

**Interfaces:**
- Consumes: `contentTypeLabel`, `ContentType` from Task 3.
- Produces: `statsByContentType` covering all four types; `HistoryEntry.contentType: ContentType`.

- [ ] **Step 1: Write the failing test**

In `src/lib/stats.test.ts`, replace the combined describe block on lines 62–67 with:

```ts
describe('statsByLanguage', () => {
  it('группирует и даёт лейбл', () => {
    expect(statsByLanguage([entry({ id: 'a', language: 'ru' })])[0].label).toBe('RU');
  });
});

describe('statsByContentType', () => {
  it('группирует по всем типам с подписями', () => {
    const res = statsByContentType([
      entry({ id: 'a', contentType: 'words', wpm: 40 }),
      entry({ id: 'b', contentType: 'sentences', wpm: 50 }),
      entry({ id: 'c', contentType: 'quotes', wpm: 60 }),
      entry({ id: 'd', contentType: 'passages', wpm: 70 }),
    ]);
    expect(res.map((g) => g.label)).toEqual(['Words', 'Sentences', 'Quotes', 'Passages']);
    expect(res.find((g) => g.key === 'quotes')!.avgWpm).toBe(60);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/stats.test.ts`
Expected: FAIL — `quotes`/`passages` entries are dropped (labels array has only `['Words','Sentences']`).

- [ ] **Step 3: Type `HistoryEntry.contentType`**

In `src/lib/history.ts`, add an import at the top and narrow the field:

```ts
import type { ContentType } from './dictionary';
```

Change (line 15):

```ts
  contentType: string;
```

to:

```ts
  contentType: ContentType;
```

- [ ] **Step 4: Extend `statsByContentType`**

In `src/lib/stats.ts`, add imports (line 1) and rewrite the function (lines 98–107):

```ts
import type { HistoryEntry } from './history';
import { contentTypeLabel, type ContentType } from './dictionary';
```

```ts
const CONTENT_TYPE_ORDER: ContentType[] = ['words', 'sentences', 'quotes', 'passages'];

/** Средние показатели по типу текста (Words / Sentences / Quotes / Passages). */
export function statsByContentType(entries: HistoryEntry[]): GroupStat[] {
  return groupBy(
    entries,
    (e) => e.contentType,
    CONTENT_TYPE_ORDER,
    (k) => contentTypeLabel(k),
    (k) => k,
  );
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test src/lib/stats.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/history.ts src/lib/stats.ts src/lib/stats.test.ts
git commit -m "feat(stats): report quotes and passages in content-type stats"
```

---

### Task 5: UI wiring

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TypingTest.tsx`
- Modify: `src/components/Results.tsx`
- Modify: `src/components/Profile.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `generateText`, `wordTopicLabel`, `WORD_TOPICS`, `type ContentType`, `type Language`, `type WordTopic` (Task 3); `contentTypeLabel` (Task 3) used in Results/Profile.

- [ ] **Step 1: Update `src/App.tsx`**

Replace the import block (lines 11–16):

```ts
import {
  generateSentences,
  generateWords,
  type ContentType,
  type Language,
} from './lib/dictionary';
```

with:

```ts
import {
  generateText,
  wordTopicLabel,
  WORD_TOPICS,
  type ContentType,
  type Language,
  type WordTopic,
} from './lib/dictionary';
```

Delete the `buildText` function (lines 40–47).

Add word-topic state after the `contentType` state (line 55):

```ts
  const [wordTopic, setWordTopic] = useState<WordTopic>('general');
```

Replace the `text` useMemo (lines 92–95):

```ts
  const text = useMemo(
    () => generateText(language, contentType, mode === 'timed' ? seconds : null, wordTopic),
    [language, contentType, seconds, mode, nonce, wordTopic],
  );
```

Replace the Text group (lines 233–249) with a 4-button Text segment plus a Topic segment shown only for words:

```tsx
                <div className="group">
                  <div className="group-label">Text</div>
                  <div className="seg">
                    <button
                      className={contentType === 'words' ? 'active' : ''}
                      onClick={select(() => setContentType('words'))}
                    >
                      Words
                    </button>
                    <button
                      className={contentType === 'sentences' ? 'active' : ''}
                      onClick={select(() => setContentType('sentences'))}
                    >
                      Sentences
                    </button>
                    <button
                      className={contentType === 'quotes' ? 'active' : ''}
                      onClick={select(() => setContentType('quotes'))}
                    >
                      Quotes
                    </button>
                    <button
                      className={contentType === 'passages' ? 'active' : ''}
                      onClick={select(() => setContentType('passages'))}
                    >
                      Passages
                    </button>
                  </div>
                </div>
                {contentType === 'words' && (
                  <div className="group">
                    <div className="group-label">Topic</div>
                    <div className="seg">
                      {WORD_TOPICS.map((t) => (
                        <button
                          key={t}
                          className={wordTopic === t ? 'active' : ''}
                          onClick={select(() => setWordTopic(t))}
                        >
                          {wordTopicLabel(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
```

Update the `<TypingTest>` usage (lines 257–266):

```tsx
            <TypingTest
              text={text.text}
              attribution={text.attribution}
              seconds={sessionSeconds}
              language={language}
              contentType={contentType}
              history={history}
              onFinish={handleFinish}
              suspended={styleOpen}
            />
```

- [ ] **Step 2: Update `src/components/TypingTest.tsx`**

Add `attribution` to the props and destructure it:

```ts
interface Props {
  text: string;
  attribution?: string;
  seconds: number | null;
  language: Language;
  contentType: ContentType;
  history: HistoryEntry[];
  onFinish: (entry: HistoryEntry) => void;
  suspended: boolean;
}

export function TypingTest({ text, attribution, seconds, language, contentType, history, onFinish, suspended }: Props) {
```

Insert the attribution caption between the `.stats` div and the `{finished ? ...}` block (after line 113):

```tsx
      {attribution && <p className="attribution">{attribution}</p>}
```

- [ ] **Step 3: Update `src/components/Results.tsx`**

Add an import (line 3 area):

```ts
import { contentTypeLabel } from '../lib/dictionary';
```

Replace line 58:

```tsx
                  <td>{h.contentType === 'sentences' ? 'Sentences' : 'Words'}</td>
```

with:

```tsx
                  <td>{contentTypeLabel(h.contentType)}</td>
```

- [ ] **Step 4: Update `src/components/Profile.tsx`**

Add an import (line 12 area):

```ts
import { contentTypeLabel } from '../lib/dictionary';
```

Replace line 101:

```tsx
                <td>{h.contentType === 'sentences' ? 'Sentences' : 'Words'}</td>
```

with:

```tsx
                <td>{contentTypeLabel(h.contentType)}</td>
```

- [ ] **Step 5: Add the `.attribution` style**

In `src/index.css`, insert after the `.hint { ... }` rule (after line 616):

```css
.attribution {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 8px;
}
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all PASS; `dist/` builds without error. Manually confirm (in `pnpm dev`) that: Words shows a Topic selector, Sentences/Quotes/Passages do not; Quotes shows the author line under the text; Profile and Results show the new labels.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/TypingTest.tsx src/components/Results.tsx src/components/Profile.tsx src/index.css
git commit -m "feat(ui): add quotes/passages modes, word topics, and attribution caption"
```

---

### Task 6: Version bump and changelog

**Files:**
- Modify: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src/lib/changelog.ts`, `CHANGELOG.md`

- [ ] **Step 1: Bump version**

Set `"version"` to `"0.4.0"` in exactly these three files:
- `package.json` (line 4)
- `src-tauri/tauri.conf.json` (line 4)
- `src-tauri/Cargo.toml` (line 3)

- [ ] **Step 2: Add the changelog entry**

In `src/lib/changelog.ts`, insert a new first entry before the `0.3.0` entry (after line 16):

```ts
  {
    version: '0.4.0',
    date: '2026-09-22',
    changes: [
      {
        type: 'Added',
        items: [
          'Thematic typing content: quotes, passages, and thematic word lists (programming, tech).',
          'Punctuation in sentences, quotes, and passages; typographic quotes and dashes are typeable with standard keys.',
        ],
      },
    ],
  },
```

`APP_VERSION` (line 95) reads `CHANGELOG[0].version`, so it becomes `0.4.0` automatically — no change needed there.

In `CHANGELOG.md`, insert a new section after line 7 (before `## [0.3.0]`):

```markdown
## [0.4.0] - 2026-09-22

### Added

- Thematic typing content: quotes, passages, and thematic word lists (programming, tech).
- Punctuation in sentences, quotes, and passages; typographic quotes and dashes are typeable with standard keys.
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. (Full desktop build is optional here: `pnpm tauri build`.)

- [ ] **Step 4: Commit**

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src/lib/changelog.ts CHANGELOG.md
git commit -m "chore(release): bump to 0.4.0"
```

---

## Self-review notes

- Spec coverage: §3 (types/Quote/Dictionary) → Task 3; §4 (data files + sources) → Task 2; §5 (normalization) → Task 1; §6 (generators + `generateText` lengths) → Task 3; §7 (UI) → Task 5; §8 (history/stats) → Task 4; §9 (TextSource seam) → Task 3; §11 (version) → Task 6; §12 (AI generator out of scope) → satisfied (only `TextSource` seam, no AI code).
- Placeholder scan: no TBD/TODO; all code steps contain full code; data files contain concrete samples + explicit rules + validation test.
- Type consistency: `ContentType`/`WordTopic`/`Quote`/`TextSource`/`generateText` signatures are identical across Tasks 3, 4, 5; `contentTypeLabel`/`wordTopicLabel` names match.
- Review Focus: item 1 → Task 1; item 2 → Task 3 (`generateQuotes`/`generateText`); item 3 → Task 4; item 4 → Task 2; item 5 → Task 5 (conditional render + typecheck).
