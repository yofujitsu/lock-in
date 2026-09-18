# Typing Trainer

Кросс-платформенный тренажёр слепой печати (аналог [Monkeytype](https://monkeytype.com)).
Стек: **Tauri 2 + React 18 + TypeScript + Vite**, тесты на **Vitest**.

## Возможности

- Посимвольное отслеживание ввода: верный символ продвигает каретку, ошибка помечается и ждёт исправления, `Backspace` возвращает назад.
- Метрики в реальном времени: **WPM**, **CPM / speed**, **TPM**, **accuracy**.
- Словари **EN** (google-10000-english, 1500 слов) и **RU** (OpenSubtitles2018 frequency list, 1500 слов) + предложения-панграммы.
- Режимы:
  - **Эхо** — свободная печать без цели (ввод просто отображается).
  - **Свободный** — набор целевого текста без таймера.
  - **Таймер** — 15 / 30 / 60 / 120 / 300 секунд.
- Наборы: **слова** или **предложения**.
- Горячие клавиши: `Ctrl+Backspace` — стереть слово, `Tab` — пропустить слово.
- История сессий (localStorage).
- Светлая / тёмная тема с переключателем.

## Стек

- **Фронтенд**: React 18, TypeScript, Vite, CSS-переменные (темизация).
- **Десктоп**: Tauri 2 (Rust — тонкая обвязка окна и упаковки).
- **Тесты**: Vitest.

## Структура

```
src/
  components/     # TypingArea, TypingTest, EchoMode, Results
  hooks/          # useTypingSession
  lib/            # чистое ядро + тесты: engine, metrics, session, dictionary,
                  # history, echo, wordops, text, format
  data/           # словари words-en.json / words-ru.json + README
src-tauri/        # обвязка Tauri 2 (Rust)
scripts/          # fetch-dictionaries.mjs, generate-icon.mjs
```

## Запуск

### Требования

- Node.js ≥ 18 и [pnpm](https://pnpm.io).
- Для десктопа: [Rust](https://rustup.rs) и на Windows — **MSVC C++ Build Tools** (`link.exe`).

### Разработка

```bash
pnpm install
pnpm dev        # фронтенд (Vite)
pnpm test       # юнит-тесты
pnpm typecheck  # проверка типов
pnpm build      # сборка фронтенда
```

### Десктоп (Tauri)

```bash
pnpm tauri dev     # запуск в dev-режиме
pnpm tauri build   # релизная сборка
```

> На Windows Rust-сборка требует MSVC C++ Build Tools:
> `winget install Microsoft.VisualStudio.2022.BuildTools` (компонент «Desktop development with C++»).
> Альтернатива — GNU-тулчейн: `rustup toolchain install stable-x86_64-pc-windows-gnu` (+ mingw-w64).

## Метрики

| Метрика | Формула |
|---|---|
| WPM | (верные символы / 5) / минуты — 1 слово = 5 символов |
| CPM / speed | верные символы / минуты |
| TPM | все нажатия (верные + ошибочные) / минуты |
| Accuracy | верные / (верные + ошибочные), доля 0..1 |

Таймер стартует с первого печатного символа (стандарт Monkeytype).

## Словари

- **EN**: [google-10000-english](https://github.com/first20hours/google-10000-english) — топ-1500.
- **RU**: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles2018) — топ-1500.

Списки лежат в `src/data/*.json`. Перегенерация: `node scripts/fetch-dictionaries.mjs`.
Источники и лицензии — в `src/data/README.md`.

## Ключевые решения

- Ввод по `e.key` (фактический символ), а не `e.code` — раскладка EN/RU не важна.
- Ядро чистое (без DOM) и покрыто тестами — логика отделена от UI.
- Тема через CSS-переменные (`:root` / `[data-theme='dark']`) с переключателем.

## Лицензия

[MIT](LICENSE)
