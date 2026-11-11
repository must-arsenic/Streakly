# Next steps for A habit tracker for

AXB AIOS writes this from version 1's checks.

## From the design advice (4 of 10)

- home@412-light (also week@412-* and settings@412-*): every one of these captures shows the welcome guide's card 1 instead of the route, so the Today list, the tab bar, the '+' button and the 48 px tick box never appear. That means Feel sentence 3 (the bold moment) and the whole Layout section can't be judged, and the score is capped. Hypothesis: the first-run redirect catches every route, even after the guide would be finished. Let the captures of /, /week and /settings run with the guide marked as finished.
- welcome@412-light: the screen is a stock onboarding template: a centred app-icon tile, a text card, pager dots and Skip/Next buttons. Take away the icon and it could belong to any app, so it fails the specificity test. It breaks Feel sentence 1 (the checklist stuck to the fridge door). Hypothesis: have each card show a real habit row (colour bar, name, streak line, and the 48 px box on the right filling solid on card 2), so the guide teaches the bold moment rather than describing it in prose.
- habits-new@412-light: the habit's colour shows up only as eight generic circles, and nothing shows what the choice will look like. That weakens Feel sentence 3 (the box 'fills solid in the habit's colour'). The swatches also wrap unevenly, 6 on the first row and 2 on the second. Hypothesis: add a live preview row (colour bar, name, filled tick box) above the swatches and put the swatches in an even 4×2 grid.
- habits-new@412-light and welcome@412-light: the main actions (Save/Cancel, Skip/Next) sit right-aligned in the middle of the screen, with about half the screen empty below them. This goes against Feel sentence 2 ('often one-handed') and Layout ('in thumb reach'). Hypothesis: pin the actions to the bottom edge above the safe area so the thumb lands on them the way it lands on the tick box.
- welcome@412-light (all captures): a grey gear button labelled 'Tools' floats in the top-right corner, overlapping the header area on every screen and in both themes. It isn't in the brief, and it clutters the 'calm list… nothing on it but…' chrome from Feel sentence 2. If it's a dev overlay, turn it off for the build being judged. If it's meant to be in the app, it duplicates the Settings tab.

## Judged only by the worker's own tests

- ac~streakly.habit-edit.keeps-ticks~1
- ac~streakly.tick-week.past-day~1
- ac~streakly.streak-current.missed~1
- ac~streakly.streak-current.with-today~1
- ac~streakly.week-view.grid~1
- ac~streakly.save-errors.delete-habit~1
- ac~streakly.first-run.once~1
- ac~streakly.no-out-of-range-ticks.refused~1
- ac~streakly.no-partial-saves.delete~1
