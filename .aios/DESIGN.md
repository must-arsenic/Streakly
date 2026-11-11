# Streakly: design (as it is)

The app as it runs today, from its walk. AXB AIOS writes this file; a feature changes it.

## Screens

| Route | Purpose |
|---|---|
| `/` | Tools |
| `/habits/new` | Tools |
| `/habits/[id]` | Edit habit: "Name" with its "<n>/40" counter, the 8 colour choices and "Save". Below the form, an "Archive habit" button sits above the "Delete habit" button. "Archive habit" archives the habit as last saved at once, with no confirm prompt, and goes to Today. If that fails, the form stays with what was typed and shows "Couldn't save. Try again.". States: "Loading your habit…"; "Couldn't load your habit" with "Try again"; "This habit isn't here any more." with "Back to Today" for a missing or archived habit. |
| `/settings` | 1 of 3. Settings: the theme radios "System", "Light" and "Dark"; an "Archived habits" section, the most recently archived first, where each row shows the habit's colour dot, its name, "Best: <n>" and a "Restore" button, with no delete button; and "Delete all data". The section's states are "No archived habits", "Loading archived habits…", and "Couldn't load archived habits" with "Try again". A failed restore shows "Couldn't save your change" with "Try again", and the habit stays in the list. |
| `/today` | 1 of 3 |
| `/week` | 1 of 3 |
| `/welcome` | 1 of 3. The guide: cards 1 and 2 have "Skip" and "Next". The last card, "3 of 3", shows only "Get started", with no "Skip" or "Next". |

## Tokens as they are

- Colours: none
- Fonts: none
- Font sizes: none
