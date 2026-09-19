# Lock In — UI/UX Style Guide for Typing Trainer

## Goal

Redesign the current visual style of **Lock In** so the app feels:

- calm
- modern
- soft
- focused
- desktop-first
- visually lightweight
- suitable for long typing sessions
- less like a generic SaaS dashboard
- less bright and less "mint-green productivity app"

The interface should support the core idea of the product: **focus on typing without visual noise**.

The visual direction should be closer to:

> warm neutral surfaces + graphite + dusty blue + muted functional colors

The main typing area should remain the visual center of the page.

---

# 1. Overall Design Direction

## Desired mood

The UI should feel like a quiet productivity tool rather than a dashboard.

Avoid:

- overly bright accent colors
- saturated green
- excessive cards
- heavy shadows
- very rounded "mobile-like" controls
- strong visual separation between every UI block
- overly high contrast secondary UI
- unnecessary decorative color

Prefer:

- warm off-white in light mode
- graphite / charcoal in dark mode
- dusty blue accent
- soft neutral borders
- restrained use of color
- typography-led hierarchy
- whitespace instead of boxes whenever possible

---

# 2. Recommended Color Palette

## Primary direction: Dusty Blue + Graphite

This is the preferred palette.

### Light Theme

```css
:root {
  --bg: #F7F7F5;
  --surface: #FFFFFF;
  --surface-secondary: #F0F1EF;

  --text-primary: #252827;
  --text-secondary: #858B8A;
  --text-muted: #B9BCB9;

  --border: #E2E3E0;

  --accent: #7896A3;
  --accent-hover: #6C8995;
  --accent-soft: #E2EAED;

  --success: #789787;
  --error: #C87E7C;

  --caret: #648D9D;
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --bg: #17191C;
  --surface: #1E2125;
  --surface-secondary: #25292E;

  --text-primary: #E7E9EA;
  --text-secondary: #969DA5;
  --text-muted: #626973;

  --border: #30353B;

  --accent: #8FAEB9;
  --accent-hover: #A0BCC5;
  --accent-soft: #29383E;

  --success: #8DAE9B;
  --error: #D58E8C;

  --caret: #A3C7D1;
}
```

---

# 3. Accent Usage

Do not flood controls with the accent color.

The accent should mainly be used for:

- current typing caret
- active segmented control
- current word / current symbol
- hover state
- progress indication
- selected navigation tab
- small interactive highlights

Avoid using the accent as a large filled block wherever possible.

## Active segmented control

### Light

```css
background: #E2EAED;
color: #476773;
```

### Dark

```css
background: #29383E;
color: #A8C7D0;
```

The active control should feel selected, not "button-like".

---

# 4. Functional Typing Colors

Typing state colors are more important than decorative colors.

Each character should visually belong to one of these states:

- already typed correctly
- currently active
- not typed yet
- typed incorrectly

## Light Theme

```css
--typed: #353938;
--pending: #B7BAB7;
--current: #648D9D;
--error: #C87E7C;
```

## Dark Theme

```css
--typed: #D8DBDD;
--pending: #59616B;
--current: #A3C7D1;
--error: #D58E8C;
```

## Recommendation

The not-yet-typed text should be muted, but still readable.

Do not make it so light that the text almost disappears.

The currently active character or word should clearly guide the eye.

Possible active state options:

- colored caret
- subtle underline
- slightly brighter current word
- soft background highlight

Prefer subtle implementation.

---

# 5. Color Should Be Functional

A useful design principle for Lock In:

## Idle state

The app should be mostly monochrome.

## During typing

Accent color becomes more visible through:

- caret
- current word
- progress
- active metric state

## Error

Use muted red.

## Finished session

Use muted green.

This makes color meaningful rather than decorative.

---

# 6. Alternative Palette Directions

If the primary dusty-blue direction does not fit, consider these.

## Option A — Muted Lavender

### Light

```text
Background:   #F7F6F8
Accent:       #908DA8
Accent Soft:  #E8E6EE
```

### Dark

```text
Background:   #19191D
Accent:       #A9A5C0
Accent Soft:  #302F3A
```

Mood:

- more premium
- slightly more design-oriented
- calm
- subtle Linear-like feeling

---

## Option B — Warm Stone + Clay

### Light

```text
Background:   #F8F6F2
Accent:       #AA8574
Accent Soft:  #EEE3DC
```

### Dark

```text
Background:   #1B1A19
Accent:       #C09A88
Accent Soft:  #3A302B
```

Mood:

- warm
- cozy
- more human
- evening typing / coffee aesthetic

---

# 7. Typography

Use two font families.

## UI Font

Preferred:

```text
Manrope
```

Recommended weights:

- 400 for secondary text
- 500 for normal UI
- 600 for headings and primary actions

CSS:

```css
body {
  font-family: "Manrope", sans-serif;
}
```

Why:

- softer than Inter
- modern
- good spacing
- works well in restrained interfaces
- does not look overly corporate

---

## Typing Font

Preferred:

```text
JetBrains Mono
```

CSS:

```css
.typing-text {
  font-family: "JetBrains Mono", monospace;
  font-weight: 400;
}
```

Reasons:

- excellent symbol distinction
- good Cyrillic support
- comfortable for typing applications
- strong visual rhythm
- familiar to developers without looking like a terminal

---

# 8. Recommended Font Pair

Preferred combination:

```text
Manrope + JetBrains Mono
```

Other good combinations:

```text
Onest + JetBrains Mono
Inter + IBM Plex Mono
IBM Plex Sans + IBM Plex Mono
Manrope + IBM Plex Mono
Golos Text + JetBrains Mono
```

If Cyrillic quality becomes especially important, consider:

```text
Golos Text + JetBrains Mono
```

---

# 9. Typing Area Typography

Suggested baseline:

```css
.typing-text {
  font-size: 34px;
  line-height: 1.85;
  letter-spacing: 0.015em;
}
```

Important:

- keep generous line-height
- do not use excessive letter-spacing
- text should feel natural rather than terminal-like
- avoid overly large font weight
- prefer weight 400 or 450 if supported

Current visual spacing is close, but letter spacing can be reduced slightly.

---

# 10. Layout Recommendations

## Top navigation

Keep the header visually light.

Elements:

- Lock In logo/name
- Practice
- Profile
- New text
- theme toggle

Avoid giving the navigation too much visual weight.

The active nav item should use:

- accent-soft background
- subtle text emphasis

Not a strong filled button.

---

# 11. Settings Area

Current settings area feels too much like a large dashboard card.

Recommended approach:

Reduce visual weight.

Instead of one large card, use whitespace and grouping:

```text
MODE                LANGUAGE        TEXT
[ controls ]        [ controls ]    [ controls ]
```

Possible implementation:

- no outer card
- or extremely subtle background difference
- thin border only if necessary
- reduced padding

The settings panel should not compete visually with the typing area.

---

# 12. Typing Area

The typing area should remain the main card and the main visual object.

Recommended:

```css
.typing-container {
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface);
}
```

Avoid strong shadows.

If a shadow is used:

```css
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
```

For dark mode, an even weaker shadow is preferable.

---

# 13. Border Radius System

Use a restrained radius scale.

Recommended:

```text
Small controls:      8–10px
Buttons:             10px
Segmented controls:  12px
Cards:               14–16px
Typing area:         16px
```

Avoid excessive 20–24px rounded corners.

The product should feel like a desktop tool, not a mobile app.

---

# 14. Segmented Controls

Controls like:

```text
Echo | Free | 15s | 30s | 60s | 120s | 300s
```

should behave visually as segmented controls.

Recommendations:

- one shared soft container
- selected option gets accent-soft
- no heavy border around every item
- slight hover state
- medium font weight
- compact vertical padding

Example:

```css
.segmented {
  background: var(--surface-secondary);
  padding: 4px;
  border-radius: 12px;
}

.segmented button {
  border: 0;
  border-radius: 9px;
  background: transparent;
}

.segmented button.active {
  background: var(--accent-soft);
  color: var(--accent);
}
```

---

# 15. Metrics / Stats

Current metrics:

```text
WPM 0.0
CPM 0.0
Accuracy 100%
Time 0:00
```

can be improved.

Preferred hierarchy:

```text
42          211          97%         0:37
WPM         CPM          accuracy    time
```

Values should have more emphasis than labels.

Use mono font for values:

```css
.metric-value {
  font-family: "JetBrains Mono", monospace;
  font-weight: 500;
}
```

Labels:

```css
.metric-label {
  color: var(--text-secondary);
  font-size: 13px;
}
```

This will improve scanability.

---

# 16. Keyboard Hints

Current hints:

```text
Ctrl+Backspace delete word
Tab skip word
Backspace back
```

are useful but visually secondary.

Recommendations:

- keep them below the typing area
- reduce text contrast
- keep keycaps subtle
- avoid bright borders
- use mono font inside keycaps

Example:

```css
kbd {
  font-family: "JetBrains Mono", monospace;
  border: 1px solid var(--border);
  background: var(--surface-secondary);
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 12px;
}
```

---

# 17. Buttons

Buttons should be visually quiet.

## Primary action

Example: `New text`

Can be:

```css
background: var(--surface);
border: 1px solid var(--border);
color: var(--text-primary);
```

Hover:

```css
background: var(--surface-secondary);
```

Avoid using the accent on every primary button.

Reserve accent for truly important active states.

---

# 18. Theme Toggle

Keep it icon-based and visually secondary.

Recommended:

- square button
- 36–40px
- same neutral button styling
- no bright accent background

---

# 19. Spacing

Use a consistent spacing system.

Recommended base:

```text
4
8
12
16
24
32
48
64
```

Main layout recommendations:

```text
Header → settings:          24px
Settings → metrics:         24–32px
Metrics → typing area:      20–24px
Typing area padding:        32–40px
Typing area → shortcuts:    16px
```

The page should feel airy, but not oversized.

---

# 20. Visual Hierarchy

The hierarchy should roughly be:

```text
1. Current typing position
2. Typing text
3. WPM / performance
4. Mode controls
5. Navigation
6. Keyboard hints
```

The typing content must dominate the interface.

---

# 21. Light Mode Philosophy

Light mode should not use pure cold white everywhere.

Preferred:

```text
Page background: warm off-white
Cards: white
Secondary control background: light stone gray
Borders: warm neutral gray
```

This reduces eye strain.

Avoid:

```text
#FFFFFF background + #000000 text everywhere
```

---

# 22. Dark Mode Philosophy

Avoid pure black.

Do not use:

```text
#000000
```

Preferred:

```text
#17191C
#1E2125
#25292E
```

The dark theme should be graphite, not black.

This creates softer contrast during long sessions.

---

# 23. Motion

Keep animation restrained.

Recommended transitions:

```css
transition:
  background-color 120ms ease,
  color 120ms ease,
  border-color 120ms ease,
  opacity 120ms ease;
```

Typing-related interactions should feel immediate.

Do not animate typed characters heavily.

Avoid:

- bouncing
- scaling letters
- glowing effects
- distracting progress animations

---

# 24. Focus States

Keyboard navigation matters in a typing app.

Use visible but soft focus rings.

Example:

```css
:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  outline-offset: 2px;
}
```

Do not remove focus outlines without replacement.

---

# 25. Suggested CSS Token Structure

Recommended design-token setup:

```css
:root {
  --bg: #F7F7F5;

  --surface-1: #FFFFFF;
  --surface-2: #F0F1EF;

  --text-1: #252827;
  --text-2: #858B8A;
  --text-3: #B9BCB9;

  --border: #E2E3E0;

  --accent: #7896A3;
  --accent-hover: #6C8995;
  --accent-soft: #E2EAED;

  --success: #789787;
  --danger: #C87E7C;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

Dark:

```css
[data-theme="dark"] {
  --bg: #17191C;

  --surface-1: #1E2125;
  --surface-2: #25292E;

  --text-1: #E7E9EA;
  --text-2: #969DA5;
  --text-3: #626973;

  --border: #30353B;

  --accent: #8FAEB9;
  --accent-hover: #A0BCC5;
  --accent-soft: #29383E;

  --success: #8DAE9B;
  --danger: #D58E8C;
}
```

---

# 26. Suggested Component Priority for Redesign

Implement changes in this order:

1. Replace the current green palette with dusty blue.
2. Replace bright white / black backgrounds with warm off-white / graphite.
3. Add Manrope for UI.
4. Add JetBrains Mono for typing content and numeric metrics.
5. Improve text-state colors.
6. Reduce visual weight of the settings panel.
7. Rework segmented controls.
8. Reduce border radii.
9. Improve metrics hierarchy.
10. Reduce contrast of keyboard hints.
11. Add consistent hover/focus states.
12. Tune spacing and responsive layout.

---

# 27. Final Target Style

The final product should feel like:

```text
minimal
quiet
focused
soft
precise
premium without looking luxurious
developer-friendly
comfortable for long sessions
```

Avoid making it:

```text
flashy
gaming-like
neon
corporate SaaS
mobile-app-like
overly rounded
overly green
```

---

# 28. Short Agent Brief

Use this condensed instruction if needed:

> Redesign the Lock In typing trainer using a soft modern visual system. Replace the current mint-green accent with a desaturated dusty blue. Use a warm off-white light theme and graphite dark theme instead of pure white/black. Keep the interface minimal and desktop-oriented, with the typing area as the main visual focus. Reduce the visual weight of the settings card, use subtle segmented controls, restrained borders and 8–16px radii. Use Manrope for the UI and JetBrains Mono for typing text and numeric metrics. Use muted gray for untyped characters, strong neutral text for typed characters, dusty blue for the current character/caret, muted red for errors, and muted green for completion. Color should be functional rather than decorative. Avoid strong shadows, bright accents, excessive rounded corners, and generic SaaS-dashboard styling.
