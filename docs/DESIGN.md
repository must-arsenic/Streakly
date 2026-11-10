# A habit tracker for: design

## Feel
Streakly is the checklist stuck to the fridge door: a short list of things you'll do today, with a box to tick next to each one. People open it for a few seconds, often one-handed, so the screen is a calm list of full-width rows with nothing on it but the name, the streak and a big box. The bold moment is the tick itself: a 48 px box on the right, where the thumb lands, that fills solid in the habit's colour.

## Tokens
These values replace the ones in src/styles/tokens.css: the `:root` values in its `:root` block, and the `:root[data-theme="dark"]` values in both of its dark blocks, `:root[data-theme="dark"]` and the one inside `@media (prefers-color-scheme: dark)`. Nothing else there changes.

```css
:root {
  --color-bg: oklch(0.975 0.006 280);
  --color-surface: oklch(1 0 0);
  --color-surface-muted: oklch(0.955 0.01 280);
  --color-border: oklch(0.91 0.01 280);
  --color-border-strong: oklch(0.85 0.014 280);
  --color-control-border: oklch(0.6 0.02 280);
  --color-text: oklch(0.22 0.02 280);
  --color-text-muted: oklch(0.5 0.02 280);
  --color-accent: oklch(0.5 0.19 275);
  --color-accent-hover: oklch(0.44 0.18 275);
  --color-accent-text: oklch(1 0 0);
  --color-accent-soft: oklch(0.95 0.03 275);
  --color-accent-line: oklch(0.85 0.07 275);
  --radius-control: 10px;
  --radius-surface: 16px;
}
:root[data-theme="dark"] {
  --color-bg: oklch(0.17 0.015 280);
  --color-surface: oklch(0.21 0.017 280);
  --color-surface-muted: oklch(0.25 0.019 280);
  --color-border: oklch(0.3 0.02 280);
  --color-border-strong: oklch(0.37 0.022 280);
  --color-control-border: oklch(0.56 0.022 280);
  --color-text: oklch(0.95 0.006 280);
  --color-text-muted: oklch(0.73 0.018 280);
  --color-accent: oklch(0.74 0.13 275);
  --color-accent-hover: oklch(0.8 0.11 275);
  --color-accent-text: oklch(0.18 0.04 275);
  --color-accent-soft: oklch(0.29 0.06 275);
  --color-accent-line: oklch(0.43 0.09 275);
}
```

## Screens

| Route | Purpose | States | Labels | Who |
|---|---|---|---|---|
| `/` | Today: tick each habit for today, see its current and best streak, long-press and drag to reorder, open Add habit with "+" and Edit habit by tapping a name | loading ("Loading your habits…"), empty ("No habits yet"), error ("Couldn't load your habits"), save error ("Couldn't save your change"), first run (guide shows first) | "Today", "Week", "Settings", "+", "Add a habit", "Try again", a tick box per habit, each habit's name | anyone |
| `/week` | Week view: one row per habit in list order, 7 columns from 6 days ago to today headed with short weekday and day number; tap a cell to tick or untick that day | loading ("Loading your habits…"), empty ("No habits yet"), error ("Couldn't load your habits"), save error ("Couldn't save your change") | "Today", "Week", "Settings", "Add a habit", "Try again", a cell per habit per day | anyone |
| `/settings` | Pick the theme and delete all data | in use, delete-all prompt, save error ("Couldn't save your change") | "System", "Light", "Dark", "Delete all data", "Delete everything", "Cancel", "Try again" | anyone |
| `/habits/new` | Add habit: a name of 1 to 40 characters and one of 8 colours, the first preselected; the habit goes to the end of the list | empty name ("Give your habit a name"), long name (stops at 40), saving ("Save" disabled), failed save ("Couldn't save. Try again.") | "Name", 8 colour swatches, "Save", "Cancel" | anyone |
| `/habits/[id]` | Edit habit: change name and colour and keep the ticks, or delete the habit and all its ticks | empty name, long name, saving, failed save ("Couldn't save. Try again."), delete prompt ("Delete this habit and all its history?"), save error ("Couldn't save your change") | "Name", 8 colour swatches, "Save", "Delete habit", "Delete", "Cancel", "Try again" | anyone |
| `/welcome` | First-run guide: three cards (adding a habit, ticking it, the week view), shown until finished or skipped | card 1, card 2, card 3 | "Next", "Skip", "Get started" | anyone |

## Layout
At 375 × 812 it's one column: a big "Today" title with the date, then a stacked list of habit cards, each with a colour bar, name and streak line on the left and a large tick box on the right edge. A round "+" button floats just above the bottom tab bar (Today, Week, Settings) on the right, in thumb reach. At wider sizes the list stays one column, capped at the content width and centred.

The look to match: docs/design/chosen.html (the dark theme is data-theme="dark").
