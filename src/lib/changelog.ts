export interface ChangelogChange {
  type: 'Added' | 'Changed' | 'Fixed';
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

/**
 * Changelog — источник данных для модалки в приложении.
 * Версия текущего релиза — первый элемент списка.
 */
export const CHANGELOG: ChangelogEntry[] = [
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
  {
    version: '0.3.0',
    date: '2026-09-20',
    changes: [
      {
        type: 'Added',
        items: [
          'Discord Rich Presence: the app shows as a Discord activity with the logo and the current mode/status.',
        ],
      },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-09-20',
    changes: [
      {
        type: 'Fixed',
        items: [
          'Practice/Profile toggle no longer resizes or animates on switch.',
          'Updated the desktop build icon (taskbar) and app/file name to "lock in".',
          'The GitHub button now opens the repository in the system browser.',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-09-20',
    changes: [
      {
        type: 'Added',
        items: [
          'Theme system: 5 palettes (Dusk, Cocoa, Mocha Sage, Mushroom, Espresso), each with light and dark modes.',
          'Interface font picker (5 fonts) and typing font picker (4 monospace fonts), all with Cyrillic support.',
          'Adjustable typing text size (20–38 px).',
          'Error display modes: noticeable, soft, and underline.',
          'Style panel with live preview and reset.',
          'GitHub link and version indicator with changelog modal.',
          'Favicon and desktop build icons.',
        ],
      },
      {
        type: 'Changed',
        items: [
          'Renamed the app to "lock the f..k in".',
          'Wider layout; the typing area grows with content instead of scrolling.',
          'Slightly scaled up all UI elements.',
        ],
      },
      {
        type: 'Fixed',
        items: [
          'Skipping a word (Tab) now marks the skipped characters.',
          'The caret blinks only after typing starts and respects reduced motion.',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-09-18',
    changes: [
      {
        type: 'Added',
        items: [
          'Core typing engine with per-character tracking, backspace, and word operations (Ctrl+Backspace, Tab).',
          'Live metrics: WPM, CPM, TPM, and accuracy.',
          'English and Russian dictionaries (public word lists) and sentence sets.',
          'Modes: echo, free, and timed (15/30/60/120/300 s).',
          'Session history (localStorage) and a Profile page with charts.',
          'Light and dark theme.',
        ],
      },
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;
