#!/usr/bin/env node
/**
 * fetch-dictionaries.mjs
 *
 * Downloads public word lists, normalises them, and writes
 *   src/data/words-en.json  (lowercase English words)
 *   src/data/words-ru.json  (lowercase Russian words)
 *
 * Sources:
 *   EN — https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt
 *        (first ~1500 entries, most-frequent English words from Google's Trillion Word Corpus)
 *   RU — https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt
 *        (frequency list "word count" built from the OpenSubtitles2018 corpus; first token per line)
 *
 * Licences are documented in src/data/README.md.
 *
 * Usage:
 *   node scripts/fetch-dictionaries.mjs
 *
 * Node 22+ is assumed (global `fetch`, `AbortSignal.timeout`).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'data');

/** Number of words to keep per language (task range: ~1000-2000). */
const TARGET_COUNT = 1500;

/**
 * A word is valid when it is a non-empty token made of Unicode letters of the
 * target language's alphabet only (no spaces, punctuation, digits, hyphens,
 * foreign letters…). The `u` flag enables Unicode-aware matching; the Russian
 * class keeps the letter "ё".
 */
const ALPHABETS = {
  en: /^[a-z]+$/u,
  ru: /^[а-яё]+$/u,
};

const SOURCES = {
  en: {
    url: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt',
    // One word per line already.
    parse: (text) => text.split(/\r?\n/).map((line) => line.trim()),
  },
  ru: {
    url: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt',
    // "word count" per line — keep the word token only.
    parse: (text) =>
      text.split(/\r?\n/).map((line) => line.trim().split(/\s+/)[0]),
  },
};

/**
 * Normalisation pipeline:
 * trim → lowercase → letters-of-language-only → drop empties → dedupe
 * (keep first occurrence) → cap.
 */
function transform(tokens, alphabet) {
  const seen = new Set();
  const out = [];
  for (const raw of tokens) {
    if (typeof raw !== 'string') continue;
    const word = raw.toLowerCase();
    if (!word) continue;
    if (!alphabet.test(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= TARGET_COUNT) break;
  }
  return out;
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * Offline fallback: curated common words (>= 300 per language) used only when
 * the network download fails, so the JSON files can always be regenerated.
 */
const FALLBACK = {
  en: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
    'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
    'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
    'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
    'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
    'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'was',
    'were', 'been', 'has', 'had', 'did', 'said', 'find', 'tell', 'ask', 'seem',
    'feel', 'try', 'leave', 'call', 'need', 'mean', 'keep', 'let', 'begin', 'talk',
    'turn', 'start', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold',
    'bring', 'happen', 'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
    'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak',
    'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember',
    'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build',
    'stay', 'fall', 'cut', 'reach', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require',
    'report', 'decide', 'pull', 'return', 'hope', 'thank', 'boy', 'girl', 'child', 'parent',
    'mother', 'father', 'son', 'daughter', 'brother', 'sister', 'wife', 'husband', 'friend', 'school',
    'teacher', 'student', 'book', 'word', 'sentence', 'question', 'answer', 'problem', 'solution', 'idea',
    'mind', 'heart', 'body', 'head', 'face', 'eye', 'hand', 'foot', 'arm', 'leg',
    'water', 'food', 'bread', 'milk', 'house', 'home', 'room', 'door', 'window', 'table',
    'chair', 'bed', 'street', 'road', 'car', 'bus', 'train', 'city', 'town', 'country',
    'world', 'life', 'death', 'war', 'peace', 'fire', 'air', 'earth', 'sun', 'moon',
    'star', 'sky', 'night', 'morning', 'evening', 'week', 'month', 'hour', 'minute', 'today',
    'tomorrow', 'yesterday', 'here', 'there', 'place', 'thing', 'something', 'nothing', 'everything', 'someone',
    'anyone', 'everyone', 'man', 'woman', 'person', 'name', 'number', 'money', 'market', 'business',
    'company', 'government', 'law', 'power', 'right', 'left', 'big', 'small', 'large', 'little',
    'long', 'short', 'high', 'low', 'fast', 'slow', 'old', 'young', 'great', 'happy',
    'sad', 'hot', 'cold', 'warm', 'cool', 'clean', 'dirty', 'easy', 'hard', 'simple',
    'difficult', 'strong', 'weak', 'full', 'empty', 'early', 'late', 'last', 'next', 'same',
    'different', 'important', 'possible', 'necessary', 'beautiful', 'white', 'black', 'red', 'green', 'blue',
  ],
  ru: [
    'и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а',
    'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из',
    'у', 'который', 'то', 'за', 'весь', 'год', 'от', 'так', 'о', 'для',
    'ты', 'же', 'все', 'тот', 'мочь', 'вы', 'человек', 'такой', 'сказать', 'только',
    'или', 'ещё', 'бы', 'себя', 'один', 'уже', 'до', 'время', 'если', 'сам',
    'когда', 'другой', 'вот', 'говорить', 'наш', 'мой', 'знать', 'стать', 'при', 'чтобы',
    'дело', 'жизнь', 'кто', 'первый', 'очень', 'два', 'день', 'новый', 'рука', 'даже',
    'во', 'со', 'раз', 'где', 'там', 'под', 'можно', 'ну', 'какой', 'потом',
    'надо', 'идти', 'сейчас', 'тоже', 'стоять', 'друг', 'дом', 'мир', 'здесь', 'хотеть',
    'дать', 'слово', 'большой', 'место', 'конец', 'лицо', 'работа', 'город', 'страна', 'вопрос',
    'случай', 'час', 'голова', 'сила', 'глаз', 'вода', 'свет', 'дорога', 'ночь', 'стол',
    'окно', 'дверь', 'мать', 'отец', 'сын', 'дочь', 'брат', 'сестра', 'ребёнок', 'народ',
    'часть', 'сторона', 'месяц', 'неделя', 'минута', 'число', 'земля', 'небо', 'лес', 'поле',
    'море', 'ветер', 'дождь', 'снег', 'хлеб', 'молоко', 'чай', 'огонь', 'камень', 'дерево',
    'трава', 'цветок', 'птица', 'рыба', 'собака', 'кошка', 'лошадь', 'корова', 'яйцо', 'соль',
    'сахар', 'масло', 'сыр', 'утро', 'вечер', 'зима', 'лето', 'весна', 'осень', 'солнце',
    'луна', 'звезда', 'путь', 'шаг', 'взгляд', 'мысль', 'чувство', 'звук', 'голос', 'улыбка',
    'смех', 'слёзы', 'радость', 'грусть', 'страх', 'любовь', 'надежда', 'вера', 'правда', 'ложь',
    'свобода', 'счастье', 'беда', 'помощь', 'воля', 'ум', 'душа', 'сердце', 'тело', 'кровь',
    'кость', 'кожа', 'волос', 'ухо', 'нос', 'рот', 'зуб', 'язык', 'шея', 'плечо',
    'спина', 'живот', 'нога', 'колено', 'палец', 'имя', 'фамилия', 'адрес', 'телефон', 'письмо',
    'книга', 'страница', 'строка', 'буква', 'цифра', 'знак', 'точка', 'запятая', 'бумага', 'ручка',
    'карандаш', 'стул', 'кровать', 'шкаф', 'пол', 'потолок', 'стена', 'кухня', 'комната', 'квартира',
    'улица', 'площадь', 'мост', 'река', 'озеро', 'гора', 'берег', 'остров', 'край', 'начало',
    'середина', 'правый', 'левый', 'север', 'юг', 'запад', 'восток', 'погода', 'холод', 'тепло',
    'жара', 'мороз', 'туман', 'облако', 'гром', 'молния', 'радуга', 'машина', 'поезд', 'самолёт',
    'корабль', 'велосипед', 'автобус', 'метро', 'вокзал', 'аэропорт', 'шоссе', 'тротуар', 'магазин', 'рынок',
    'деньги', 'цена', 'товар', 'покупка', 'продажа', 'завод', 'фабрика', 'школа', 'университет', 'урок',
    'класс', 'ученик', 'учитель', 'студент', 'подруга', 'семья', 'жена', 'муж', 'дедушка', 'бабушка',
    'внук', 'внучка', 'дядя', 'тётя', 'сосед', 'гость', 'хозяин', 'еда', 'напиток', 'фрукт',
    'овощ', 'яблоко', 'груша', 'слива', 'вишня', 'картофель', 'морковь', 'лук', 'мясо', 'курица',
    'суп', 'каша', 'тарелка', 'чашка', 'вилка', 'ложка', 'нож', 'цвет', 'красный', 'синий',
  ],
};

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  for (const lang of ['en', 'ru']) {
    let words;
    let usedFallback = false;

    try {
      const text = await download(SOURCES[lang].url);
      words = transform(SOURCES[lang].parse(text), ALPHABETS[lang]);
      if (words.length < 300) {
        throw new Error(`too few valid words after filtering (${words.length})`);
      }
    } catch (err) {
      console.warn(
        `[${lang}] download/normalisation failed: ${err.message} — using embedded fallback list`,
      );
      words = transform(FALLBACK[lang], ALPHABETS[lang]);
      usedFallback = true;
    }

    const file = join(DATA_DIR, `words-${lang}.json`);
    await writeFile(file, `${JSON.stringify(words, null, 2)}\n`, 'utf8');
    console.log(
      `[${lang}] wrote ${words.length} words to ${file}${usedFallback ? ' (fallback)' : ''}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
