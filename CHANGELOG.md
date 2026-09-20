# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-20

### Added

- Discord Rich Presence: the app shows as a Discord activity with the logo and the current mode/status.

## [0.2.1] - 2026-09-20

### Fixed

- Practice/Profile toggle no longer resizes or animates on switch.
- Updated the desktop build icon (taskbar) and app/file name to "lock in".
- The GitHub button now opens the repository in the system browser.

## [0.2.0] - 2026-09-20

### Added

- Theme system: 5 palettes (Dusk, Cocoa, Mocha Sage, Mushroom, Espresso), each with light and dark modes.
- Interface font picker (5 fonts) and typing font picker (4 monospace fonts), all with Cyrillic support.
- Adjustable typing text size (20–38 px).
- Error display modes: noticeable, soft, and underline.
- Style panel with live preview and reset.
- GitHub link and version indicator with changelog modal.
- Favicon and desktop build icons.

### Changed

- Renamed the app to "lock the f..k in".
- Wider layout; the typing area grows with content instead of scrolling.
- Slightly scaled up all UI elements.

### Fixed

- Skipping a word (Tab) now marks the skipped characters.
- The caret blinks only after typing starts and respects reduced motion.

## [0.1.0] - 2026-09-18

### Added

- Core typing engine with per-character tracking, backspace, and word operations (Ctrl+Backspace, Tab).
- Live metrics: WPM, CPM, TPM, and accuracy.
- English and Russian dictionaries (public word lists) and sentence sets.
- Modes: echo, free, and timed (15/30/60/120/300 s).
- Session history (localStorage) and a Profile page with charts.
- Light and dark theme.
