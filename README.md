# lock in

A calm, cross-platform typing trainer — an app with a focus on typing without visual noise.

> **Current version:** 0.5.0 · [Changelog](CHANGELOG.md) · [GitHub](https://github.com/yofujitsu/lock-in)

## Screenshots

| | |
|---|---|
| ![Main page — light theme](public/screenshots/main_page_light_theme.png) | ![Main page — dark theme](public/screenshots/main_page_dark_theme.png) |
| ![Live typing with errors](public/screenshots/main_page_live_typing_with_errors.png) | ![Session results](public/screenshots/main_page_session_results.png) |
| ![Theme customization](public/screenshots/theme_customization.png) | ![Profile page](public/screenshots/profile_page.png) |

![Echo mode](public/screenshots/endless_echo_mode.png)

## Features

- **Per-character tracking** — correct characters advance the caret, mistakes are marked and wait to be fixed, `Backspace` goes back.
- **Live metrics** — WPM, CPM/TPM, accuracy, and speed.
- **Dictionaries** — English and Russian word lists (with thematic topics: general, programming, tech), plus punctuation-rich sentences, quotes, and short passages.
- **AI word-list generator** — type any topic and generate a custom word list with your own LLM API key (any OpenAI-compatible endpoint: OpenAI, DeepSeek, Groq, …).
- **Modes** — echo (free typing), free, and timed (15 / 30 / 60 / 120 / 300 s).
- **Shortcuts** — `Ctrl+Backspace` deletes the word, `Tab` skips it.
- **Session history** — stored locally, with a Profile page and charts.
- **Theming** — 5 palettes × light/dark, UI and typing fonts, adjustable text size, error display modes, all in a style panel.
- **Light / dark theme** with system-preference support.
- **Discord Rich Presence** — shows the app as a Discord activity with the logo and the current mode/status.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, CSS custom properties (design tokens).
- **Desktop:** Tauri 2 (Rust shell for the window, Discord presence, and the AI generation call).
- **Tests:** Vitest.

## Project structure

```
src/
  components/     # TypingArea, TypingTest, EchoMode, Results, Profile, StylePanel, ChangelogModal, charts/
  hooks/          # useTypingSession, useStyle, useAiSettings, useAiWords
  lib/            # pure core + tests: engine, metrics, session, dictionary, history,
                  # echo, wordops, text, format, stats, style, changelog, ai, keys
  data/           # word lists and thematic texts (words/sentences/quotes/passages/topics)
src-tauri/        # Tauri 2 shell (Discord presence, AI generation command)
scripts/          # fetch-dictionaries.mjs, generate-icon.mjs
```

## Getting started

### Prerequisites

- Node.js ≥ 18 and [pnpm](https://pnpm.io).
- For the desktop build: [Rust](https://rustup.rs), and on Windows the **MSVC C++ Build Tools** (`link.exe`).

### Development

```bash
pnpm install
pnpm dev        # frontend (Vite)
pnpm test       # unit tests
pnpm typecheck  # type check
pnpm build      # frontend build
```

### Desktop

```bash
pnpm tauri dev     # run in dev mode
pnpm tauri build   # production build (NSIS .exe installer on Windows)
```

On Windows the Rust build requires MSVC C++ Build Tools:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

## Metrics

| Metric | Formula |
|---|---|
| WPM | (correct characters / 5) / minutes — 1 word = 5 characters |
| CPM / speed | correct characters / minutes |
| TPM | all keystrokes (correct + wrong) / minutes |
| Accuracy | correct / (correct + wrong), 0..1 |

The timer starts on the first keystroke (the Monkeytype convention).

## Dictionaries

- **Word lists** — EN: [google-10000-english](https://github.com/first20hours/google-10000-english) (top 1500); RU: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) / OpenSubtitles2018 (top 1500). Thematic topics (programming, tech) are hand-curated.
- **Sentences, quotes, passages** — curated public-domain and original prose with real punctuation, for EN and RU.

Word lists and thematic texts live in `src/data/*.json`; word lists regenerate with `node scripts/fetch-dictionaries.mjs`. See `src/data/README.md` for sources and licenses.

## AI word generator

The **Words** mode has a **Custom** topic option: type a topic, hit **Generate**, and the app asks a cloud LLM (bring-your-own-key) for a list of words, sanitizes them, caches them locally, and feeds them into the test.

Configure it in the style panel (**AI word generator** section):

- **API base URL** — any OpenAI-compatible endpoint, e.g. `https://api.deepseek.com` or `https://api.openai.com/v1`.
- **Model** — e.g. `deepseek-chat` or `gpt-4o-mini`.
- **API key** — your own key, stored locally in the app config and sent only to the base URL above.

On the desktop build the request goes through Rust (`reqwest`); in the browser dev preview it uses a direct `fetch` (subject to the provider's CORS policy).

## Theming

The whole UI is driven by design tokens (`--bg`, `--card`, `--line`, `--typed`, `--accent`, `--err`, fonts, and text size). Now 5 palettes are bundled — **Dusk**, **Cocoa**, **Mocha Sage**, **Mushroom**, and **Espresso** — each with light and dark themes. And planning adding more. The style panel also lets you pick UI/typing fonts, adjust the typing text size, and switch error styles.

## Releasing

Releases are built automatically by GitHub Actions (`.github/workflows/release.yml`) when a `v*` tag is pushed.

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src/lib/changelog.ts`.
2. Add a new entry to `CHANGELOG.md` (Keep a Changelog).
3. Commit, then tag and push:

   ```bash
   git add -A && git commit -m "chore: release v0.5.0"
   git tag v0.5.0 && git push --tags
   ```

4. GitHub Actions builds installers for Windows/macOS/Linux and creates a **draft release** — review it and hit **Publish**.

To build manually instead: `pnpm tauri build` (the installer lands in `src-tauri/target/release/bundle/`).

## License

[MIT](LICENSE)
