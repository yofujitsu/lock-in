# Word lists (`words-en.json`, `words-ru.json`)

Public word lists used by the typing trainer. Each file is a flat JSON array of
lowercase, single-token words with no punctuation, spaces or digits.

| File          | Language | Words | Format constraints |
| ------------- | -------- | ----- | ------------------ |
| `words-en.json` | English | 1500 | `[a-z]+` only       |
| `words-ru.json` | Russian  | 1500 | `[а-яё]+` only      |

## Sources

### English — `google-10000-english`

- **File used:** `google-10000-english-no-swears.txt` (first 1500 entries)
- **Raw URL:** https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt
- **Repository:** https://github.com/first20hours/google-10000-english
- **Provenance:** the 10 000 most common English words in order of frequency,
  derived from n-gram frequency analysis of
  [Google's Trillion Word Corpus](https://books.google.com/ngrams/info) via
  Peter Norvig's [`count_1w.txt`](https://norvig.com/ngrams/count_1w.txt).
- **License:** the repository has **no explicit license** (GitHub reports
  "NOASSERTION"). The underlying data derives from Google's Trillion Word
  Corpus n-gram counts, which Google published for public use
  ("[All Our N-gram Are Belong To You](https://ai.googleblog.com/2006/08/all-our-n-gram-are-belong-to-you.html)").
  Treat the list as usable for this project, but with no formal license
  statement to rely on.

### Russian — `hermitdave/FrequencyWords`

- **File used:** `content/2018/ru/ru_50k.txt` (first 1500 valid entries)
- **Raw URL:** https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt
- **Repository:** https://github.com/hermitdave/FrequencyWords
- **Provenance:** frequency list (`word count` per line, most frequent first)
  generated from the [OpenSubtitles2018](http://opus.nlpl.eu/OpenSubtitles2018.php)
  corpus.
- **License:** **MIT** for the code, **CC BY-SA 4.0** for the content
  (stated in the repository [README](https://github.com/hermitdave/FrequencyWords#license)).
  The underlying corpus is OpenSubtitles2018.

## Transformation pipeline

Applied to both lists (see `scripts/fetch-dictionaries.mjs`):

1. Download the raw text.
2. Split into lines (Russian: take the first whitespace-separated token of each
   `word count` line).
3. Trim and lowercase.
4. Keep only entries made exclusively of the target alphabet's letters —
   `[a-z]` for English, `[а-яё]` for Russian (Unicode-aware; `ё` is preserved).
   This removes punctuation, digits, spaces, hyphens and foreign letters.
5. Drop empty strings.
6. Deduplicate, preserving first-occurrence (frequency) order.
7. Cap at 1500 words.

## Regenerating

```sh
node scripts/fetch-dictionaries.mjs
```

Requires Node 22+ (uses global `fetch` and `AbortSignal.timeout`). If a download
is unreachable, the script falls back to embedded curated lists (≈320 words per
language) so the JSON files can always be produced.
