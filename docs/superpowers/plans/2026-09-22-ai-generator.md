# AI Word-List Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Custom topic" word-list generator to the words mode: the user types a topic, a cloud LLM (bring-your-own-key) returns words, they are sanitized, cached locally, and fed into the existing typing engine.

**Architecture:** The LLM call happens in a thin Rust command (`reqwest`), reading the API key/base-url/model from a `tauri-plugin-store` file (`settings.json`) that Rust owns. JS talks to Rust through two small commands (`get_ai_settings` / `set_ai_settings`), so no npm store package is needed. Word sanitization (`sanitizeWordList`) and the generated-list cache (localStorage) are pure, unit-tested TypeScript. Async generation is isolated in one module (`src/lib/ai.ts`); the sync engine and metrics are untouched.

**Tech Stack:** Tauri 2 (Rust `reqwest`, `tauri-plugin-store`), React 18, TypeScript, Vite, Vitest (TDD).

**Spec:** `tasks/ai-generator-spec.md`

## Global Constraints

- Version bump `0.4.0 → 0.5.0` in exactly 4 files: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src/lib/changelog.ts` (plus `CHANGELOG.md`).
- **No new npm dependencies.** JS talks to Rust only via `invoke` from `@tauri-apps/api/core` (already a dependency).
- New Rust dependencies: `reqwest` (rustls, JSON) and `tauri-plugin-store` — compiled only by `pnpm tauri build`, which the **user** runs (the executor's sandbox cannot run cargo).
- API key, base URL, and model live in the Tauri store file `settings.json` (keys `aiBaseUrl`, `aiModel`, `aiApiKey`), owned by Rust.
- Generated custom lists are cached in `localStorage` under `ai.customLists` (key `${lang}:${topic}`) — localStorage, not the store, because the sync typing path must read it synchronously.
- Word sanitization: lowercase, single token, `[a-z]+` (EN) / `[а-яё]+` (RU), dedupe, cap 100.
- In the browser (`pnpm dev`, no Tauri), all AI features no-op cleanly (guard on `'__TAURI_INTERNALS__' in window`).
- Existing tests keep passing; every task ends green on `pnpm test` (targeted) and, where noted, `tsc --noEmit`.

## Review Focus

The five failure modes the spec implies but no task's tests would otherwise exercise:

1. Messy LLM output (prose, markdown, a JSON object, mixed-language, digits) must sanitize to clean single-token words — pinned by Task 1 tests.
2. An empty/missing API key must produce a clear, user-facing error (not a cryptic network failure) — pinned by Task 4 tests + Rust guard.
3. Custom words must actually feed the typing test, never silently fall back to the `general` list — pinned by Task 2 tests.
4. Generated lists must persist and be reused without re-calling the LLM — pinned by Task 4 cache-reuse test.
5. The whole feature must no-op in the browser (`pnpm dev`) — pinned by Task 4 `loadAiSettings`/`generateCustomWords` guards.

---

### Task 1: Word sanitization + custom-list cache

**Files:**
- Create: `src/lib/ai.ts`
- Test: `src/lib/ai.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 4–5):
  - `sanitizeWordList(raw: string, lang: Language): string[]`
  - `type CustomLists = Record<string, string[]>`
  - `customListKey(lang, topic): string`
  - `loadCustomLists(storage?): CustomLists`
  - `saveCustomLists(lists, storage?): void`
  - `getCustomList(lang, topic, storage?): string[] | null`
  - `setCustomList(lang, topic, words, storage?): void`

- [ ] **Step 1: Write the failing test**

Create `src/lib/ai.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  customListKey,
  getCustomList,
  loadCustomLists,
  sanitizeWordList,
  setCustomList,
} from './ai';
import type { StorageLike } from './ai';

function memStorage(init: Record<string, string> = {}): StorageLike {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('sanitizeWordList', () => {
  it('парсит JSON-массив и нормализует', () => {
    expect(sanitizeWordList('["Sail", "anchor", "sail"]', 'en')).toEqual(['sail', 'anchor']);
  });

  it('вынимает массив из JSON-объекта с полем words', () => {
    expect(sanitizeWordList('{"words": ["sail", "anchor"]}', 'en')).toEqual(['sail', 'anchor']);
  });

  it('извлекает слова из прозы и отбрасывает мусор', () => {
    expect(sanitizeWordList('Here are words: sail, anchor2, and -- boom!', 'en')).toEqual([
      'here', 'are', 'words', 'sail', 'anchor', 'and', 'boom',
    ]);
  });

  it('фильтрует по алфавиту языка', () => {
    expect(sanitizeWordList('sail 123 привет!', 'en')).toEqual(['sail']);
    expect(sanitizeWordList('sail 123 привет!', 'ru')).toEqual(['привет']);
  });

  it('дедуплицирует и ограничивает 100 словами', () => {
    const big = Array.from({ length: 150 }, (_, i) => `w${i}`).join(' ');
    const out = sanitizeWordList(big, 'en');
    expect(out.length).toBe(100);
    expect(new Set(out).size).toBe(100);
  });
});

describe('custom list cache', () => {
  it('round-trips через setCustomList/getCustomList', () => {
    const storage = memStorage();
    setCustomList('en', 'sailing', ['sail', 'anchor'], storage);
    expect(getCustomList('en', 'sailing', storage)).toEqual(['sail', 'anchor']);
  });

  it('ключ включает язык и тему', () => {
    expect(customListKey('ru', 'медицина')).toBe('ru:медицина');
  });

  it('loadCustomLists возвращает {} при битом JSON', () => {
    expect(loadCustomLists(memStorage({ 'ai.customLists': 'not-json' }))).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run src/lib/ai.test.ts`
Expected: FAIL — module `./ai` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/lib/ai.ts`:

```ts
import type { Language } from './dictionary';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const CACHE_KEY = 'ai.customLists';
const MAX_WORDS = 100;

const WORD_RE: Record<Language, RegExp> = {
  en: /[a-z]+/g,
  ru: /[а-яё]+/g,
};

/**
 * Превращает сырой ответ модели в чистый список слов: JSON-массив / объект
 * {"words": [...]} / просто текст. Нормализует: lowercase, одиночный токен,
 * алфавит языка, дедуп, cap 100.
 */
export function sanitizeWordList(raw: string, lang: Language): string[] {
  let text = raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.words)
          ? parsed.words
          : null;
      if (arr) text = arr.map((v) => (typeof v === 'string' ? v : '')).join(' ');
    } catch {
      // не JSON — обрабатываем как текст ниже
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.toLowerCase().matchAll(WORD_RE[lang])) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      out.push(m[0]);
    }
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

export type CustomLists = Record<string, string[]>;

export function customListKey(lang: Language, topic: string): string {
  return `${lang}:${topic}`;
}

export function loadCustomLists(storage: StorageLike = localStorage): CustomLists {
  try {
    const raw = storage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CustomLists) : {};
  } catch {
    return {};
  }
}

export function saveCustomLists(lists: CustomLists, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(lists));
  } catch {
    // ignore (private mode и т.п.)
  }
}

export function getCustomList(lang: Language, topic: string, storage: StorageLike = localStorage): string[] | null {
  return loadCustomLists(storage)[customListKey(lang, topic)] ?? null;
}

export function setCustomList(lang: Language, topic: string, words: string[], storage: StorageLike = localStorage): void {
  const lists = loadCustomLists(storage);
  lists[customListKey(lang, topic)] = words;
  saveCustomLists(lists, storage);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run src/lib/ai.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts src/lib/ai.test.ts
git commit -m "feat(ai): add word sanitization and custom-list cache"
```

---

### Task 2: `customList` support in generators

**Files:**
- Modify: `src/lib/dictionary.ts`
- Test: `src/lib/dictionary.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `generateWords(lang, count, rng?, topic?, source?, customList?)` and `generateText(lang, contentType, seconds, wordTopic?, rng?, source?, customList?)` accept an optional `customList?: string[]` used in the `words` branch.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/dictionary.test.ts` inside `describe('generateWords')` and `describe('generateText')`:

```ts
  it('customList переопределяет слова темы', () => {
    expect(generateWords('en', 3, zeroRng, 'general', undefined, ['alpha', 'beta'])).toBe('alpha alpha alpha');
  });
```

```ts
  it('words с customList берёт слова из списка, а не из темы', () => {
    expect(generateText('en', 'words', null, 'general', zeroRng, undefined, ['x', 'y']).text).toBe('x x x');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run src/lib/dictionary.test.ts`
Expected: FAIL — `customList` is ignored (result uses `general` words).

- [ ] **Step 3: Write the implementation**

In `src/lib/dictionary.ts`, change `generateWords` to accept and use `customList`:

```ts
export function generateWords(
  lang: Language,
  count: number,
  rng: Rng = Math.random,
  topic: WordTopic = 'general',
  source: TextSource = STATIC_SOURCE,
  customList?: string[],
): string {
  const words = customList ?? source.words(lang, topic);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(words, rng));
  return out.join(' ');
}
```

Change `generateText`'s signature and the words branch:

```ts
export function generateText(
  lang: Language,
  contentType: ContentType,
  seconds: number | null,
  wordTopic: WordTopic = 'general',
  rng: Rng = Math.random,
  source: TextSource = STATIC_SOURCE,
  customList?: string[],
): GeneratedText {
  switch (contentType) {
    // ... sentences/quotes/passages unchanged ...
    default: {
      const count = seconds === null ? 80 : Math.max(80, Math.min(seconds * 2, 400));
      return { text: generateWords(lang, count, rng, wordTopic, source, customList) };
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run src/lib/dictionary.test.ts && node node_modules/typescript/bin/tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dictionary.ts src/lib/dictionary.test.ts
git commit -m "feat(dictionary): accept a custom word list in generators"
```

---

### Task 3: Rust command + store plugin + reqwest

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces three Tauri commands consumed by Task 4:
  - `get_ai_settings() -> { baseUrl: string, model: string, apiKey: string }`
  - `set_ai_settings(settings: { baseUrl, model, apiKey }) -> ()`
  - `generate_word_list(lang: string, topic: string) -> string` (raw model content)

- [ ] **Step 1: Add dependencies**

In `src-tauri/Cargo.toml`, under `[dependencies]`:

```toml
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
tauri-plugin-store = "2"
```

- [ ] **Step 2: Implement commands and register the plugin**

In `src-tauri/src/lib.rs`, add `use tauri_plugin_store::StoreExt;` at the top (after the existing `use` lines), then add before `run()`:

```rust
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiSettings {
    base_url: String,
    model: String,
    api_key: String,
}

const DEFAULT_BASE_URL: &str = "https://api.openai.com/v1";
const DEFAULT_MODEL: &str = "gpt-4o-mini";

fn ai_settings(app: &tauri::AppHandle) -> Result<AiSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let base_url = store
        .get("aiBaseUrl")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_BASE_URL)
        .to_string();
    let model = store
        .get("aiModel")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_MODEL)
        .to_string();
    let api_key = store
        .get("aiApiKey")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    Ok(AiSettings { base_url, model, api_key })
}

#[tauri::command]
fn get_ai_settings(app: tauri::AppHandle) -> Result<AiSettings, String> {
    ai_settings(&app)
}

#[tauri::command]
fn set_ai_settings(app: tauri::AppHandle, settings: AiSettings) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store
        .set("aiBaseUrl", serde_json::json!(settings.base_url))
        .map_err(|e| e.to_string())?;
    store
        .set("aiModel", serde_json::json!(settings.model))
        .map_err(|e| e.to_string())?;
    store
        .set("aiApiKey", serde_json::json!(settings.api_key))
        .map_err(|e| e.to_string())?;
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
async fn generate_word_list(app: tauri::AppHandle, lang: String, topic: String) -> Result<String, String> {
    let settings = ai_settings(&app)?;
    if settings.api_key.trim().is_empty() {
        return Err("API key is not set. Add it in Style settings.".to_string());
    }

    let prompt = format!(
        "Generate a list of 80 single words about \"{topic}\" in the {lang} language. \
         Return ONLY a JSON array of strings. No prose, no markdown, no punctuation, no spaces."
    );

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", settings.base_url.trim_end_matches('/'));
    let resp = client
        .post(&url)
        .bearer_auth(&settings.api_key)
        .json(&serde_json::json!({
            "model": settings.model,
            "messages": [
                { "role": "system", "content": "You return only a JSON array of lowercase single words." },
                { "role": "user", "content": prompt }
            ],
            "temperature": 0.7
        }))
        .send()
        .await
        .map_err(|e| format!("network error: {e}"))?;

    let status = resp.status();
    let body: serde_json::Value = resp.json().await.map_err(|e| format!("bad response: {e}"))?;
    if !status.is_success() {
        return Err(format!("API error {status}: {body}"));
    }

    let content = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "unexpected response shape".to_string())?
        .to_string();
    Ok(content)
}
```

In `run()`, register the store plugin and the three commands:

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(PresenceSender(Mutex::new(tx)))
        .invoke_handler(tauri::generate_handler![
            set_presence,
            get_ai_settings,
            set_ai_settings,
            generate_word_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
```

- [ ] **Step 3: Verify (user runs this)**

Run: `pnpm tauri build`
Expected: compiles. If `StoreExt` is not implemented for `AppHandle` (it is in the stable v2 release), switch the commands to take `app: tauri::App` and call `app.handle()`. If the TLS backend fails, replace `rustls-tls` with `native-tls` in `Cargo.toml` and rebuild.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "feat(tauri): add AI settings store and word-list generation command"
```

---

### Task 4: AI settings + `generateCustomWords` wrapper

**Files:**
- Modify: `src/lib/ai.ts`
- Test: `src/lib/ai.test.ts`

**Interfaces:**
- Consumes: `sanitizeWordList`/cache (Task 1), Tauri commands (Task 3).
- Produces (consumed by Task 5):
  - `interface AiSettings { baseUrl: string; model: string; apiKey: string }`
  - `const DEFAULT_AI_SETTINGS: AiSettings`
  - `loadAiSettings(invokeFn?): Promise<AiSettings>`
  - `saveAiSettings(settings, invokeFn?): Promise<void>`
  - `generateCustomWords(lang, topic, deps?): Promise<string[]>` where `deps = { invokeFn?, storage?, force? }`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/ai.test.ts` (add `AiSettings`/`generateCustomWords`/`loadAiSettings`/`saveAiSettings` to the import):

```ts
const fakeInvoke = (impl: (cmd: string, args: unknown) => unknown) =>
  ((cmd: string, args: unknown) => Promise.resolve(impl(cmd, args))) as never;

describe('loadAiSettings / saveAiSettings', () => {
  it('loadAiSettings вызывает get_ai_settings и возвращает настройки', async () => {
    const invokeFn = fakeInvoke(() => ({ baseUrl: 'http://x/v1', model: 'm', apiKey: 'k' }));
    await expect(loadAiSettings(invokeFn)).resolves.toEqual({ baseUrl: 'http://x/v1', model: 'm', apiKey: 'k' });
  });

  it('saveAiSettings вызывает set_ai_settings', async () => {
    const calls: unknown[] = [];
    const invokeFn = fakeInvoke((cmd, args) => void calls.push([cmd, args]));
    await saveAiSettings({ baseUrl: 'b', model: 'm', apiKey: 'k' }, invokeFn);
    expect(calls[0][0]).toBe('set_ai_settings');
  });
});

describe('generateCustomWords', () => {
  it('бросает понятную ошибку при пустом ключе', async () => {
    const invokeFn = fakeInvoke(() => '["sail"]');
    await expect(
      generateCustomWords('en', 'sailing', {
        invokeFn,
        loadSettings: async () => ({ baseUrl: '', model: '', apiKey: '' }),
      }),
    ).rejects.toThrow(/API key/i);
  });

  it('санитизирует ответ и возвращает слова', async () => {
    const invokeFn = fakeInvoke(() => '["Sail", "anchor2", "sail"]');
    const words = await generateCustomWords('en', 'sailing', {
      invokeFn,
      loadSettings: async () => ({ baseUrl: '', model: '', apiKey: 'k' }),
    });
    expect(words).toEqual(['sail', 'anchor']);
  });

  it('переиспользует кеш и не зовёт модель повторно', async () => {
    const storage = memStorage({ 'ai.customLists': JSON.stringify({ 'en:sailing': ['sail'] }) });
    let called = false;
    const invokeFn = fakeInvoke(() => (called = true));
    const words = await generateCustomWords('en', 'sailing', {
      invokeFn,
      storage,
      loadSettings: async () => ({ baseUrl: '', model: '', apiKey: 'k' }),
    });
    expect(words).toEqual(['sail']);
    expect(called).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run src/lib/ai.test.ts`
Expected: FAIL — `loadAiSettings` etc. are not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/ai.ts` (add `import { invoke } from '@tauri-apps/api/core';` at the top):

```ts
import { invoke } from '@tauri-apps/api/core';

export interface AiSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
};

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadAiSettings(
  invokeFn: typeof invoke = invoke,
): Promise<AiSettings> {
  if (!isTauri()) return { ...DEFAULT_AI_SETTINGS };
  return invokeFn<AiSettings>('get_ai_settings');
}

export async function saveAiSettings(
  settings: AiSettings,
  invokeFn: typeof invoke = invoke,
): Promise<void> {
  if (!isTauri()) return;
  await invokeFn('set_ai_settings', { settings });
}

export interface GenerateCustomWordsDeps {
  invokeFn?: typeof invoke;
  loadSettings?: () => Promise<AiSettings>;
  storage?: StorageLike;
  force?: boolean;
}

export async function generateCustomWords(
  lang: Language,
  topic: string,
  deps: GenerateCustomWordsDeps = {},
): Promise<string[]> {
  const invokeFn = deps.invokeFn ?? invoke;
  const loadSettings = deps.loadSettings ?? (() => loadAiSettings(invokeFn));
  const storage = deps.storage ?? localStorage;

  if (!deps.force) {
    const cached = getCustomList(lang, topic, storage);
    if (cached && cached.length > 0) return cached;
  }

  const settings = await loadSettings();
  if (!settings.apiKey.trim()) {
    throw new Error('Set your API key in the AI settings first.');
  }

  const raw = await invokeFn<string>('generate_word_list', { lang, topic });
  const words = sanitizeWordList(raw, lang);
  if (words.length === 0) throw new Error('The model returned no usable words.');
  setCustomList(lang, topic, words, storage);
  return words;
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `node node_modules/vitest/vitest.mjs run src/lib/ai.test.ts && node node_modules/typescript/bin/tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts src/lib/ai.test.ts
git commit -m "feat(ai): add settings load/save and generateCustomWords wrapper"
```

---

### Task 5: UI wiring

**Files:**
- Create: `src/hooks/useAiSettings.ts`
- Create: `src/hooks/useAiWords.ts`
- Modify: `src/components/StylePanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `loadAiSettings`/`saveAiSettings`/`DEFAULT_AI_SETTINGS`/`generateCustomWords` (Task 4), `generateText`/`STATIC_SOURCE` (Task 2/3 prior).

- [ ] **Step 1: `useAiSettings` hook**

Create `src/hooks/useAiSettings.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_AI_SETTINGS, loadAiSettings, saveAiSettings, type AiSettings } from '../lib/ai';

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    loadAiSettings().then(setSettings).catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<AiSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      void saveAiSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
```

- [ ] **Step 2: `useAiWords` hook**

Create `src/hooks/useAiWords.ts`:

```ts
import { useCallback, useState } from 'react';
import { generateCustomWords } from '../lib/ai';
import type { Language } from '../lib/dictionary';

export function useAiWords() {
  const [customTopic, setCustomTopic] = useState('');
  const [customList, setCustomList] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (lang: Language, topic: string, force = false) => {
    setBusy(true);
    setError(null);
    try {
      setCustomList(await generateCustomWords(lang, topic, { force }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return { customTopic, setCustomTopic, customList, generate, busy, error };
}
```

- [ ] **Step 3: AI settings section in `StylePanel.tsx`**

Add `AiSettings` import and two props, then a new section before the reset button:

```ts
import { type AiSettings } from '../lib/ai';

interface Props {
  // ... existing props ...
  aiSettings: AiSettings;
  onUpdateAi: (patch: Partial<AiSettings>) => void;
}
```

```tsx
      <section className="style-section">
        <div className="style-label">AI word generator (optional)</div>
        <label className="style-label" htmlFor="ai-base">API base URL</label>
        <input id="ai-base" className="style-text" type="text" value={aiSettings.baseUrl} onChange={(e) => onUpdateAi({ baseUrl: e.target.value })} />
        <label className="style-label" htmlFor="ai-model">Model</label>
        <input id="ai-model" className="style-text" type="text" value={aiSettings.model} onChange={(e) => onUpdateAi({ model: e.target.value })} />
        <label className="style-label" htmlFor="ai-key">API key</label>
        <input id="ai-key" className="style-text" type="password" value={aiSettings.apiKey} onChange={(e) => onUpdateAi({ apiKey: e.target.value })} placeholder="sk-..." />
        <div className="style-hint">Stored locally; sent only to the base URL above.</div>
      </section>
```

- [ ] **Step 4: Wire into `App.tsx`**

Import additions:

```ts
import { STATIC_SOURCE, generateText, wordTopicLabel, WORD_TOPICS, type ContentType, type Language, type WordTopic } from './lib/dictionary';
import { useAiSettings } from './hooks/useAiSettings';
import { useAiWords } from './hooks/useAiWords';
```

Add hooks inside `App()`:

```ts
  const aiSettings = useAiSettings();
  const ai = useAiWords();
  const [customMode, setCustomMode] = useState(false);
```

Compute the active custom list and the text:

```ts
  const activeCustomList = customMode ? (ai.customList ?? undefined) : undefined;
  const text = useMemo(
    () =>
      generateText(
        language,
        contentType,
        mode === 'timed' ? seconds : null,
        wordTopic,
        Math.random,
        STATIC_SOURCE,
        activeCustomList,
      ),
    [language, contentType, seconds, mode, nonce, wordTopic, activeCustomList],
  );
```

Replace the Topic segment with a version that adds a **Custom** button and, when active, an input + Generate/Regenerate row:

```tsx
                {contentType === 'words' && (
                  <>
                    <div className="group">
                      <div className="group-label">Topic</div>
                      <div className="seg">
                        {WORD_TOPICS.map((t) => (
                          <button
                            key={t}
                            className={!customMode && wordTopic === t ? 'active' : ''}
                            onClick={select(() => {
                              setCustomMode(false);
                              setWordTopic(t);
                            })}
                          >
                            {wordTopicLabel(t)}
                          </button>
                        ))}
                        <button
                          className={customMode ? 'active' : ''}
                          onClick={select(() => setCustomMode(true))}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                    {customMode && (
                      <div className="group">
                        <div className="group-label">Custom topic</div>
                        <div className="ai-row">
                          <input
                            className="ai-input"
                            type="text"
                            placeholder="e.g. sailing"
                            value={ai.customTopic}
                            onChange={(e) => ai.setCustomTopic(e.target.value)}
                          />
                          <button
                            className="ai-btn"
                            disabled={ai.busy || !ai.customTopic.trim()}
                            onClick={() => ai.generate(language, ai.customTopic.trim())}
                          >
                            {ai.busy ? '…' : 'Generate'}
                          </button>
                          {ai.customList && (
                            <button className="ai-btn" onClick={() => ai.generate(language, ai.customTopic.trim(), true)}>
                              Regenerate
                            </button>
                          )}
                        </div>
                        {ai.error && <p className="ai-error">{ai.error}</p>}
                      </div>
                    )}
                  </>
                )}
```

Pass the AI settings into the StylePanel render:

```tsx
              <StylePanel
                ref={stylePanelRef}
                style={style}
                onUpdate={update}
                onSelectPalette={selectPalette}
                onReset={reset}
                aiSettings={aiSettings.settings}
                onUpdateAi={aiSettings.update}
              />
```

- [ ] **Step 5: Styles**

In `src/index.css`, after the `.attribution` rule:

```css
.style-text {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 9px;
  margin: 2px 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--typed);
  font-size: 14px;
}

.ai-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.ai-input {
  flex: 1;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--typed);
  font-size: 14px;
}

.ai-btn {
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--card);
  color: var(--typed);
  cursor: pointer;
}

.ai-error {
  color: var(--err);
  font-size: 13px;
  margin: 6px 0 0;
}
```

- [ ] **Step 6: Verify**

Run: `node node_modules/typescript/bin/tsc --noEmit && node node_modules/vitest/vitest.mjs run && node node_modules/vite/bin/vite.js build`
Expected: all PASS; `dist/` builds. Manually (in `pnpm dev`): Custom topic button appears only under Words; Generate with no key shows the error; the Style panel shows the AI fields.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useAiSettings.ts src/hooks/useAiWords.ts src/components/StylePanel.tsx src/App.tsx src/index.css
git commit -m "feat(ui): add custom-topic generation and AI settings"
```

---

### Task 6: Version bump and changelog

**Files:**
- Modify: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src/lib/changelog.ts`, `CHANGELOG.md`

- [ ] **Step 1: Bump version**

Set `"version"` to `"0.5.0"` in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.

- [ ] **Step 2: Add the changelog entry**

In `src/lib/changelog.ts`, insert a new first entry:

```ts
  {
    version: '0.5.0',
    date: '2026-09-22',
    changes: [
      {
        type: 'Added',
        items: [
          'AI word-list generator: type a custom topic and generate words with your own LLM API key.',
        ],
      },
    ],
  },
```

In `CHANGELOG.md`, insert before `## [0.4.0]`:

```markdown
## [0.5.0] - 2026-09-22

### Added

- AI word-list generator: type a custom topic and generate words with your own LLM API key.
```

- [ ] **Step 3: Verify**

Run: `node node_modules/typescript/bin/tsc --noEmit && node node_modules/vitest/vitest.mjs run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src/lib/changelog.ts CHANGELOG.md
git commit -m "chore(release): bump to 0.5.0"
```

---

## Self-review notes

- Spec coverage: §3 (async locked in one command + cache, sync engine unchanged) → Task 2–5; §4 (store `settings.json`) → Task 3; §5 (OpenAI-compatible endpoint) → Task 3; §6 (sanitize) → Task 1; §7 (cache + regenerate) → Task 1 + Task 4; §8 (UI) → Task 5; §9 (Rust transport) → Task 3; §11 (version) → Task 6; §12 (out of scope) → satisfied (only word lists, no local-model UX, one endpoint format).
- Placeholder scan: no TBD/TODO; all code steps contain full code.
- Type consistency: `AiSettings`/`GenerateCustomWordsDeps`/`generateCustomWords`/`loadAiSettings` signatures are identical across Tasks 4–5; `customList` param matches Tasks 2 and 5.
- Review Focus: item 1 → Task 1; item 2 → Task 4 + Task 3 Rust guard; item 3 → Task 2; item 4 → Task 4 cache-reuse test; item 5 → Task 4 `isTauri()` guards.
