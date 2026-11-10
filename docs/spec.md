---
app: expo
---
# Streakly

## What it is
Streakly is a habit tracker for one person on their own phone. They add the daily habits they want to keep, like "Drink water", "Read for 20 minutes" or "Stretch". They tick each one off when they do it, see each habit's current and best streak, and look at a week view of the last 7 days. In the week view they can fix a day they forgot to log.

It's a real phone app (Expo) used at phone width, and its layout also works from 375 to 1440 px wide. There is no account, no sign-in, no sharing and no notifications. Everything is stored on the phone only, and it has light and dark themes.

## Glossary
**Habit**: something the person wants to do every day. It has a name (1 to 40 characters), one of 8 colours and a place in the list order. _Avoid_: goal, task, routine.
**Tick**: a record that a habit was done on a given calendar date. A habit has at most one tick per day, and a tick stays on the date it was recorded for even if the phone's time zone changes. _Avoid_: check-in, log, completion.
**Day**: a calendar day on the phone's clock. It runs from local midnight to local midnight. _Avoid_: period, cycle.
**Current streak**: the number of days in a row the habit was ticked. The run ends today if today is ticked, or yesterday if today isn't ticked yet. It is 0 when neither today nor yesterday is ticked. _Avoid_: chain, run.
**Best streak**: the longest unbroken run of ticked days the habit has ever had. _Avoid_: record, high score.
**Week view**: the grid on the Week screen. It has one row per habit and one column for each of the last 7 days, ending today. _Avoid_: calendar, history.
**First-run guide**: three short cards shown the first time the app opens. They explain adding a habit, ticking it, and the week view. _Avoid_: tutorial, onboarding.

## Data and risk
The app stores habits (name, colour, order, the day it was created), ticks (habit and calendar date) and the chosen theme. It keeps them on the phone only, until the person deletes a habit or deletes all data. Nobody signs in, nothing is uploaded, nothing is sent over the network and nothing updates live. The only pictures are the app's logo and icons, made by the images step. The app shows no people.

## It must
### habit-add
`req~streakly.habit-add~1`
THE SYSTEM SHALL let the person add a habit with a name of 1 to 40 characters and one of 8 colours from the Add habit screen. The new habit goes at the end of the list.

### habit-edit
`req~streakly.habit-edit~1`
THE SYSTEM SHALL let the person change a habit's name and colour on the Edit habit screen, which opens when they tap the habit's name. The habit's ticks are kept.

### habit-delete
`req~streakly.habit-delete~1`
WHEN the person taps "Delete habit" on the Edit habit screen, THE SYSTEM SHALL ask "Delete this habit and all its history?" with "Delete" and "Cancel". On "Delete", it removes the habit and all its ticks for good. On "Cancel", it closes the prompt and leaves the person on the Edit habit screen with the habit unchanged.

### habit-reorder
`req~streakly.habit-reorder~1`
THE SYSTEM SHALL let the person long-press a habit on the Today screen and drag it to a new place. It keeps that order on every screen and after the app restarts.

### tick-today
`req~streakly.tick-today~1`
THE SYSTEM SHALL let the person tick a habit for today with its tick box on the Today screen, and untick it by tapping again. A tick fills the box in the habit's colour.

### tick-week
`req~streakly.tick-week~1`
THE SYSTEM SHALL let the person tap any cell in the week view for the last 7 days (today and the 6 days before) to tick or untick that habit on that day.

### streak-current
`req~streakly.streak-current~1`
THE SYSTEM SHALL show each habit's current streak on the Today screen as "<n>-day streak". It counts back from today if today is ticked, otherwise from yesterday.

### streak-best
`req~streakly.streak-best~1`
THE SYSTEM SHALL show each habit's best streak on the Today screen as "Best: <n>". The best streak is the longest run of ticked days in that habit's history, recalculated when ticks change.

### week-view
`req~streakly.week-view~1`
THE SYSTEM SHALL show the Week screen as a grid. It has one row per habit, in list order, and 7 columns from 6 days ago to today. Each column is headed with a short weekday and day number, and ticked cells are filled in the habit's colour.

### day-refresh
`req~streakly.day-refresh~1`
WHEN local midnight passes while the app is open, or the app returns to the foreground, THE SYSTEM SHALL work out today again and refresh the Today screen's tick boxes, the Week screen's 7 columns and every streak without the person restarting the app.

### tick-dates
`req~streakly.tick-dates~1`
THE SYSTEM SHALL store each tick with the calendar date it was recorded for, and keep it on that date when the phone's time zone changes.

### local-storage
`req~streakly.local-storage~1`
THE SYSTEM SHALL save habits, ticks, order and theme on the phone as soon as they change, and show them again after the app is closed and reopened.

### save-errors
`req~streakly.save-errors~1`
IF saving a tick, a new order, the theme, a habit deletion or a delete-all fails, THEN THE SYSTEM SHALL keep the previously saved state, show it again on screen, and show "Couldn't save your change" with a "Try again" button that retries the same change.

### theme
`req~streakly.theme~1`
THE SYSTEM SHALL let the person pick "System", "Light" or "Dark" in Settings and apply the choice to every screen at once. "System" is the default and follows the phone's setting.

### delete-all
`req~streakly.delete-all~1`
WHEN the person taps "Delete all data" in Settings, THE SYSTEM SHALL ask "Delete all habits and history? This can't be undone." with "Delete everything" and "Cancel". On "Delete everything", it removes every habit and tick, resets the theme to "System" and shows the first-run guide.

### first-run
`req~streakly.first-run~1`
WHEN the app opens with the first-run guide not yet finished, THE SYSTEM SHALL show the three guide cards with "Next" and "Skip", and "Get started" on the last card. It doesn't show the guide again after it is finished or skipped.

### states
`req~streakly.states~1`
THE SYSTEM SHALL show the Today and Week screens in these states:
- **Loading:** "Loading your habits…" while stored data is read.
- **Empty:** "No habits yet" with an "Add a habit" button when there are none.
- **Error:** "Couldn't load your habits" with a "Try again" button when stored data can't be read.

### form-states
`req~streakly.form-states~1`
THE SYSTEM SHALL handle the Add/Edit habit form like this:
- **Empty name:** show "Give your habit a name" under the name field when the trimmed name is empty, and not save.
- **Long name:** stop the name field taking more than 40 characters.
- **While saving:** disable "Save".
- **Failed save:** show "Couldn't save. Try again." and keep what was typed.

### layout
`req~streakly.layout~1`
THE SYSTEM SHALL lay out every screen without horizontal scrolling or cut-off controls at any width from 375 to 1440 px, in both light and dark themes.

## It must never
### no-network
`req~streakly.no-network~1`
THE SYSTEM SHALL never ask for an account or sign-in, and never send habit, tick or settings data off the phone.

### no-notifications
`req~streakly.no-notifications~1`
THE SYSTEM SHALL never ask for notification permission and never schedule or send a notification.

### no-out-of-range-ticks
`req~streakly.no-out-of-range-ticks~1`
THE SYSTEM SHALL never let the person tick a day after today or more than 6 days before today.

### no-partial-saves
`req~streakly.no-partial-saves~1`
THE SYSTEM SHALL never leave a half-done change in storage when a save fails: a failed deletion or delete-all removes nothing, and a failed reorder keeps the old order.

## Done when
#### Adding a habit puts it at the end of Today
`ac~streakly.habit-add.saves~1`
GIVEN the Today screen lists "Drink water"
WHEN the person adds a habit named "Stretch" with the third colour and taps "Save"
THEN the Today screen lists "Drink water" then "Stretch"
AND "Stretch" shows "0-day streak" and "Best: 0"
Needs: holdout, e2e

#### Empty name is refused
`ac~streakly.form-states.empty-name~1`
GIVEN the Add habit screen is open
WHEN the person types three spaces as the name and taps "Save"
THEN "Give your habit a name" shows under the name field
AND no habit is stored
Needs: holdout, e2e

#### Name stops at 40 characters
`ac~streakly.form-states.max-length~1`
GIVEN the Add habit screen is open
WHEN the person types 45 characters into the name field
THEN the field holds exactly the first 40 characters
Needs: holdout, e2e

#### Save failure keeps the form
`ac~streakly.form-states.save-error~1`
GIVEN storage fails on write
WHEN the person taps "Save" on the Add habit screen with the name "Read"
THEN "Couldn't save. Try again." shows
AND the name field still holds "Read"
Needs: holdout, e2e

#### Eight colours to pick from
`ac~streakly.habit-add.colours~1`
GIVEN the Add habit screen is open
WHEN the person looks at the colour choices
THEN exactly 8 colour swatches show, and the first is selected by default
Needs: holdout, e2e

#### Editing keeps ticks
`ac~streakly.habit-edit.keeps-ticks~1`
GIVEN "Read" is ticked for today and shows "1-day streak"
WHEN the person taps "Read", renames it to "Read 20 min" and taps "Save"
THEN Today lists "Read 20 min" with its tick box filled and "1-day streak"
Needs: holdout, e2e

#### Deleting asks first
`ac~streakly.habit-delete.confirm~1`
GIVEN the Edit habit screen for "Stretch" is open
WHEN the person taps "Delete habit"
THEN "Delete this habit and all its history?" shows with "Delete" and "Cancel"
Needs: holdout, e2e

#### Cancel keeps the habit
`ac~streakly.habit-delete.cancel~1`
GIVEN the delete prompt for "Stretch" shows on the Edit habit screen
WHEN the person taps "Cancel"
THEN the prompt closes and the Edit habit screen for "Stretch" still shows, with its name and colour unchanged
AND "Stretch" and all its ticks are still stored
Needs: holdout, e2e

#### Delete removes habit and ticks
`ac~streakly.habit-delete.removes~1`
GIVEN "Stretch" has 5 stored ticks
WHEN the person confirms "Delete"
THEN "Stretch" is gone from Today and Week
AND 0 ticks for that habit remain in storage
Needs: holdout, utest, e2e

#### Drag to reorder sticks
`ac~streakly.habit-reorder.persists~1`
GIVEN Today lists "Water", "Read", "Stretch" in that order
WHEN the person long-presses "Stretch", drags it to the top, then closes and reopens the app
THEN Today lists "Stretch", "Water", "Read"
AND the Week rows show in the same order
Needs: holdout, e2e

#### Ticking today
`ac~streakly.tick-today.tick~1`
GIVEN "Water" is not ticked today and was not ticked yesterday
WHEN the person taps its tick box
THEN the box is filled in the habit's colour
AND "Water" shows "1-day streak"
Needs: holdout, e2e

#### Unticking today
`ac~streakly.tick-today.untick~1`
GIVEN "Water" is ticked today and was not ticked yesterday
WHEN the person taps its tick box again
THEN the box is empty
AND "Water" shows "0-day streak"
Needs: holdout, e2e

#### Fixing a forgotten day in Week
`ac~streakly.tick-week.past-day~1`
GIVEN "Read" is ticked today and 2 days ago, but not yesterday
WHEN the person taps yesterday's cell for "Read" on the Week screen
THEN that cell is filled in the habit's colour
AND Today shows "3-day streak" for "Read"
Needs: holdout, e2e

#### Unticking a past day in Week
`ac~streakly.tick-week.untick~1`
GIVEN "Read" is ticked on 3 days ago
WHEN the person taps that cell on the Week screen
THEN the cell is empty and no tick for that day is stored
Needs: holdout, e2e

#### Streak survives an unticked today
`ac~streakly.streak-current.today-open~1`
GIVEN a habit is ticked on each of the 4 days before today and not today
WHEN the current streak is calculated
THEN it is 4
Needs: holdout, utest

#### Streak breaks after a missed day
`ac~streakly.streak-current.missed~1`
GIVEN a habit is ticked on 2 and 3 days ago, and not yesterday or today
WHEN the current streak is calculated
THEN it is 0
Needs: holdout, utest

#### Streak counts today when ticked
`ac~streakly.streak-current.with-today~1`
GIVEN a habit is ticked today and on each of the 2 days before
WHEN the current streak is calculated
THEN it is 3
Needs: holdout, utest

#### Streak label on Today
`ac~streakly.streak-current.label~1`
GIVEN "Water" has a current streak of 5
WHEN the Today screen shows
THEN the "Water" row shows "5-day streak"
Needs: holdout, e2e

#### Best streak is the longest run
`ac~streakly.streak-best.longest~1`
GIVEN a habit has runs of ticks lasting 3 days, then 7 days, then 2 days ending today
WHEN the best streak is calculated
THEN it is 7
AND the current streak is 2
Needs: holdout, utest

#### Best streak label on Today
`ac~streakly.streak-best.label~1`
GIVEN "Water" has a best streak of 7
WHEN the Today screen shows
THEN the "Water" row shows "Best: 7"
Needs: holdout, e2e

#### Day boundary is local midnight
`ac~streakly.streak-current.midnight~1`
GIVEN the phone clock is 23:59 local time and a habit is ticked today
WHEN the clock passes 00:00 and the current streak is calculated
THEN the new day has no tick for the habit and the streak still counts the earlier tick (1)
Needs: holdout, utest

#### Today refreshes at midnight
`ac~streakly.day-refresh.midnight~1`
GIVEN the Today screen is open at 23:59 local time with "Water" ticked today and not the day before
WHEN the clock passes 00:00 with the app still open
THEN the "Water" tick box is empty and the row shows "1-day streak"
AND the Week screen's last column is headed with the new day's short weekday and day number
Needs: holdout, e2e

#### Today refreshes on return to the foreground
`ac~streakly.day-refresh.foreground~1`
GIVEN "Water" was ticked today and the app was sent to the background
WHEN the app is brought back to the foreground the next day
THEN the "Water" tick box is empty and the row shows "1-day streak"
AND the Week screen's last column is headed with the new day's short weekday and day number
Needs: holdout, e2e

#### Ticks keep their date across time zones
`ac~streakly.tick-dates.time-zone~1`
GIVEN "Read" has a tick stored for 2026-11-09 while the phone is set to UTC+1
WHEN the phone's time zone changes to UTC-8
THEN the stored tick's date is still 2026-11-09
AND the Week screen shows that tick in the 2026-11-09 column
Needs: holdout, utest, e2e

#### Week grid shape
`ac~streakly.week-view.grid~1`
GIVEN there are 3 habits
WHEN the person opens the Week screen
THEN it shows 3 rows and 7 day columns
AND the last column is headed with today's short weekday and day number
Needs: holdout, e2e

#### Data survives a restart
`ac~streakly.local-storage.restart~1`
GIVEN "Water" exists with today ticked and the theme set to "Dark"
WHEN the app is closed and reopened
THEN Today lists "Water" with its tick box filled
AND the dark theme is applied
Needs: holdout, e2e

#### Failed tick keeps the old state
`ac~streakly.save-errors.tick~1`
GIVEN "Water" is not ticked today and storage fails on write
WHEN the person taps its tick box
THEN the box is empty and "Couldn't save your change" shows with a "Try again" button
AND no tick for "Water" today is stored
Needs: holdout, e2e

#### Failed reorder keeps the old order
`ac~streakly.save-errors.reorder~1`
GIVEN Today lists "Water", "Read", "Stretch" and storage fails on write
WHEN the person drags "Stretch" to the top
THEN Today lists "Water", "Read", "Stretch" and "Couldn't save your change" shows with a "Try again" button
AND the stored order is "Water", "Read", "Stretch"
Needs: holdout, e2e

#### Failed theme change keeps the old theme
`ac~streakly.save-errors.theme~1`
GIVEN the theme is "Light" and storage fails on write
WHEN the person picks "Dark" in Settings
THEN the light colours stay, "Light" stays selected and "Couldn't save your change" shows with a "Try again" button
AND the stored theme is "light"
Needs: holdout, e2e

#### Failed habit deletion keeps the habit
`ac~streakly.save-errors.delete-habit~1`
GIVEN "Stretch" has 5 stored ticks and storage fails on write
WHEN the person confirms "Delete" for "Stretch"
THEN "Couldn't save your change" shows with a "Try again" button
AND "Stretch" and its 5 ticks are still stored and listed on Today
Needs: holdout, utest, e2e

#### Failed delete-all keeps everything
`ac~streakly.save-errors.delete-all~1`
GIVEN there are 3 habits with ticks, the theme is "Dark" and storage fails on write
WHEN the person confirms "Delete everything"
THEN "Couldn't save your change" shows with a "Try again" button and no guide card shows
AND 3 habits, all their ticks and the theme "dark" are still stored
Needs: holdout, utest, e2e

#### Try again saves the change
`ac~streakly.save-errors.retry~1`
GIVEN a tick for "Water" today failed to save and "Couldn't save your change" shows
WHEN storage works again and the person taps "Try again"
THEN the "Water" tick box is filled and the error message is gone
AND a tick for "Water" today is stored
Needs: holdout, e2e

#### Theme choice applies
`ac~streakly.theme.switch~1`
GIVEN the theme is "System" and the phone is in light mode
WHEN the person picks "Dark" in Settings
THEN every screen uses the dark colours
AND the stored theme is "dark"
Needs: holdout, e2e

#### Delete all asks first
`ac~streakly.delete-all.confirm~1`
GIVEN the Settings screen is open
WHEN the person taps "Delete all data"
THEN "Delete all habits and history? This can't be undone." shows with "Delete everything" and "Cancel"
Needs: holdout, e2e

#### Delete all wipes everything
`ac~streakly.delete-all.wipes~1`
GIVEN there are 3 habits with ticks and the theme is "Dark"
WHEN the person confirms "Delete everything"
THEN 0 habits and 0 ticks are stored, the theme is "System"
AND the first-run guide shows
Needs: holdout, utest, e2e

#### First run shows the guide
`ac~streakly.first-run.shows~1`
GIVEN the app has never been opened
WHEN the person opens it
THEN the first of 3 guide cards shows with "Next" and "Skip"
Needs: holdout, e2e

#### Guide doesn't come back
`ac~streakly.first-run.once~1`
GIVEN the person tapped "Get started" on the last guide card
WHEN the app is closed and reopened
THEN the Today screen shows and no guide card shows
Needs: holdout, e2e

#### Empty Today
`ac~streakly.states.empty~1`
GIVEN there are no habits
WHEN the person opens the Today screen
THEN "No habits yet" and an "Add a habit" button show
Needs: holdout, e2e

#### Empty Week
`ac~streakly.states.empty-week~1`
GIVEN there are no habits
WHEN the person opens the Week screen
THEN "No habits yet" and an "Add a habit" button show
Needs: holdout, e2e

#### Loading state
`ac~streakly.states.loading~1`
GIVEN reading stored data hasn't finished
WHEN the Today screen shows
THEN "Loading your habits…" shows
Needs: holdout, e2e

#### Load error
`ac~streakly.states.error~1`
GIVEN stored data can't be read
WHEN the Today screen opens
THEN "Couldn't load your habits" and a "Try again" button show
Needs: holdout, e2e

#### Retry after an error
`ac~streakly.states.retry~1`
GIVEN the load error shows and storage now reads fine with 2 habits
WHEN the person taps "Try again"
THEN Today lists the 2 habits
Needs: holdout, e2e

#### Fits narrow and wide
`ac~streakly.layout.widths~1`
GIVEN 8 habits, each named with 40 characters
WHEN the Today, Week, Add habit and Settings screens show at 375 px and at 1440 px wide in light and dark themes
THEN no screen scrolls horizontally and every button is fully visible
Needs: holdout, e2e

#### No future or old ticks
`ac~streakly.no-out-of-range-ticks.refused~1`
GIVEN today is a given date
WHEN a tick is saved for tomorrow, or for 7 days before today
THEN the save is refused and no tick is stored
Needs: holdout, utest

#### No half-done deletion
`ac~streakly.no-partial-saves.delete~1`
GIVEN "Stretch" has 5 stored ticks and storage fails partway through deleting it
WHEN the deletion is attempted
THEN "Stretch" and all 5 of its ticks are still stored
Needs: holdout, utest

#### No network calls
`ac~streakly.no-network.offline~1`
GIVEN the phone is offline
WHEN the person adds a habit, ticks it and changes the theme
THEN every action works and 0 network requests are made
Needs: holdout, e2e

#### No notification permission
`ac~streakly.no-notifications.none~1`
GIVEN a fresh install
WHEN the person goes through the guide, adds a habit and ticks it
THEN no notification permission prompt shows and 0 notifications are scheduled
Needs: holdout, e2e

## Decided by AXB AIOS
- A day runs from local midnight to local midnight on the phone's clock.
- Only today and the 6 days before can be ticked. Future days and older days can't.
- Past days in the week view can be ticked even if they fall before the habit was created.
- Edit habit opens when you tap a habit's name. Add habit opens from a "+" button on Today.
- Navigation is a bottom tab bar with Today, Week and Settings.
- Habit names don't have to be unique, and leading and trailing spaces are trimmed.
- There's no limit on the number of habits.
- The theme defaults to "System". Deleting all data resets it and shows the first-run guide again.
- Streak labels read "<n>-day streak" and "Best: <n>".
- The first-run guide is 3 cards (add, tick, week) with "Next", "Skip" and "Get started".
- The first of the 8 colours is preselected for a new habit.
- The only made pictures are the app logo and icons, within the 12-picture limit. There are no people in the app.
- A failed save of a tick, order, theme or deletion shows "Couldn't save your change" with a "Try again" button on the screen where it happened.
- "Today" always follows the phone's current time zone. Ticks are stored as calendar dates, so a time zone change never moves them.
