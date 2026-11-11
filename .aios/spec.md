---
app: expo
---
# Streakly

## What it is
Streakly is a private daily-habit tracker. One person adds the habits they want to keep and ticks each one off every day it's done. The app counts each habit's current and best streak. A Week view shows the last 7 days so a forgotten day can be fixed. A habit can be archived to put it aside without losing its history. Settings lists archived habits so each one can be restored.

It's a real phone app, used on the go at phone width (375 px and up). It also runs in a browser up to 1440 px, with content in one centred column. It works in light and dark themes, and a three-card guide shows on first run.

## Glossary
**Habit**: something the person wants to do every day. It has a name of 1 to 40 characters, one of 8 colours and a place in the list. _Avoid_: task, goal.
**Tick**: a mark that a habit was done on a given calendar day. There is at most one per habit per day. _Avoid_: check-in, completion.
**Current streak**: how many days in a row the habit is ticked. The run ends today if today is ticked, otherwise yesterday. _Avoid_: run.
**Best streak**: the longest unbroken run of ticked days the habit has ever had. _Avoid_: record.
**Tickable day**: today or one of the 6 days before it, on the phone's local calendar. _Avoid_: editable window.
**Guide**: the three-card first-run walkthrough. _Avoid_: onboarding, tutorial.
**Archived habit**: a habit put aside from Today and Week that keeps its ticks and can be restored to its old place from Settings. The days it spends archived count as missed unless they are ticked after it is restored, while still tickable. _Avoid_: hidden, paused, inactive.

## Data and risk
Everything is stored on this phone only, in a local database, until the person deletes it. That includes:
- habits: name, colour, order, day added, whether archived, when archived and the place to restore to
- ticks: habit and day
- the theme choice
- whether the guide is finished
- at most one tick change that failed to save: its habit, its day and whether it was to tick or untick

That failed change is kept until one of these happens: it saves, a retry is refused because its day is no longer tickable, its habit is archived, or its habit or all data is deleted. Archived habits keep their ticks until they are restored and deleted, or all data is deleted. Nobody signs in, nothing is uploaded, nothing is shared and nothing updates live from elsewhere. Streaks are worked out from the ticks each time and never stored.

## It must
### guide
`req~streakly.guide~1`
WHILE the guide is not finished, THE SYSTEM SHALL show the guide's three cards in place of Today, Week and Settings. Each card has "Skip" and "Next", the last has "Get started", and finishing or skipping marks the guide finished.

### today
`req~streakly.today~2`
THE SYSTEM SHALL list every habit that isn't archived on Today in list order. Each row shows the habit's name, colour, tick box for today, "<n>-day streak" and "Best: <n>". Above the list are today's long date and "<ticked> of <total> ticked", which counts only habits that aren't archived.

### tick
`req~streakly.tick~1`
WHEN the person taps a habit's tick box on Today, THE SYSTEM SHALL flip that habit's tick for today, store it, and update the streaks and the summary.

### week
`req~streakly.week~2`
THE SYSTEM SHALL show on Week one row per habit that isn't archived, in list order, and 7 day columns, from 6 days ago to today, each headed by its short weekday and day number. Tapping a cell flips that habit's tick on that day.

### tick-window
`req~streakly.tick-window~1`
THE SYSTEM SHALL allow ticking and unticking only on tickable days, checked against the phone's date when the save runs.

### streaks
`req~streakly.streaks~1`
THE SYSTEM SHALL work out each habit's current streak and best streak from its stored ticks.

### add-habit
`req~streakly.add-habit~1`
WHEN the person saves a valid name and a colour on Add habit, THE SYSTEM SHALL store the habit at the end of the list and return to the screen they came from.

### habit-name
`req~streakly.habit-name~1`
THE SYSTEM SHALL trim the habit name and accept 1 to 40 characters. Typing stops at 40 and a "<n>/40" counter shows. An empty name shows "Give your habit a name" and nothing is saved.

### edit-habit
`req~streakly.edit-habit~1`
WHEN the person taps a habit's name on Today, THE SYSTEM SHALL open Edit habit filled with its name and colour. Saving stores the changes and keeps all the habit's ticks.

### delete-habit
`req~streakly.delete-habit~1`
WHEN the person confirms "Delete" on "Delete this habit and all its history?", THE SYSTEM SHALL remove the habit and all its ticks, of any age, together, clear its remembered failed tick change, and go to Today.

### reorder
`req~streakly.reorder~1`
WHEN the person long-presses a habit row for 500 ms on Today and drags it to a new place, THE SYSTEM SHALL store the new order. Today and Week then show it. A screen reader offers "Move up" and "Move down" actions on each row instead.

### theme
`req~streakly.theme~1`
THE SYSTEM SHALL offer the themes "System", "Light" and "Dark" in Settings, store the choice and apply it at once. "System" follows the phone's light or dark setting and is the default.

### delete-all
`req~streakly.delete-all~1`
WHEN the person confirms "Delete everything" on "Delete all habits and history? This can't be undone.", THE SYSTEM SHALL remove every habit and tick of any age, clear every remembered failed tick change, set the theme to System, mark the guide not finished and show the guide.

### save-error
`req~streakly.save-error~1`
IF a change can't be saved, THEN THE SYSTEM SHALL keep showing the saved state and show "Couldn't save your change" with "Try again". "Try again" saves exactly the same change: for a tick, the intended ticked or unticked state on the original day, never a flip of what is stored now.

### failed-tick-kept
`req~streakly.failed-tick-kept~2`
IF a tick can't be saved, THEN THE SYSTEM SHALL remember it, and Today shall offer it again with "Couldn't save your change" and "Try again", even after the app restarts. Any tick changes already waiting to save are refused and not stored, so the person makes them again once the failed change is resolved. Until it saves, its day is no longer tickable or its habit is archived, every other tick change is refused. A retry on a day no longer tickable is refused and the remembered change is cleared. Archiving the habit also clears it.

### list-states
`req~streakly.list-states~2`
THE SYSTEM SHALL show on Today and Week "Loading your habits…" while reading, "Couldn't load your habits" with "Try again" when the read fails, and "No habits yet" with "Add a habit" when there are no habits that aren't archived. The "Archived habits" section in Settings shows "Loading archived habits…" while reading and "Couldn't load archived habits" with "Try again" when the read fails.

### edit-states
`req~streakly.edit-states~2`
THE SYSTEM SHALL show on Edit habit "Loading your habit…" while reading and "Couldn't load your habit" with "Try again" when the read fails. For a habit that no longer exists or is archived, it shows "This habit isn't here any more." with "Back to Today".

### form-save-error
`req~streakly.form-save-error~2`
IF saving Add habit or Edit habit, or archiving from Edit habit, fails, THEN THE SYSTEM SHALL stay on the form with what was typed, leave the habit as it was stored and show "Couldn't save. Try again.".

### day-rollover
`req~streakly.day-rollover~1`
WHEN the phone's local date changes while the app is open or when it returns to the foreground, THE SYSTEM SHALL move Today and Week to the new date.

### routes
`req~streakly.routes~1`
THE SYSTEM SHALL send "/today" and any address it doesn't have to Today.

### archive
`req~streakly.archive~1`
WHEN the person taps "Archive habit" on Edit habit, THE SYSTEM SHALL mark the habit archived at once, with no confirm prompt, as it was last saved, dropping any name or colour changes that weren't saved. It also stores the habit's place among the habits that aren't archived, keeps all its ticks, clears its remembered failed tick change and goes to Today.

### archived-list
`req~streakly.archived-list~1`
THE SYSTEM SHALL show in Settings an "Archived habits" section that lists every archived habit, the most recently archived first. Each one shows its name, its colour, "Best: <n>" and a "Restore" button, with no way to delete it there. The section reads "No archived habits" when there are none.

### restore
`req~streakly.restore~1`
WHEN the person taps "Restore" on an archived habit, THE SYSTEM SHALL mark it not archived and put it back at its stored place among the habits that aren't archived, or at the end of the list if there are now fewer habits than that place. It keeps all its ticks, Today and Week show it again, and any day it spent archived that is still tickable can be ticked like any other day.

### guide-last-card
`req~streakly.guide-last-card~1`
THE SYSTEM SHALL show on the last card of the first-run guide only a "Get started" button, with no "Skip" or "Next" button.

## It must never
### no-old-ticks
`req~streakly.no-old-ticks~1`
THE SYSTEM SHALL never store a tick, or remove one by unticking, on a day older than 6 days before today or on a day after today. Deleting a habit or all data removes ticks of any age.

### no-lost-tick
`req~streakly.no-lost-tick~1`
THE SYSTEM SHALL never show a tick as saved before it is stored, and never drop a tick change made while another is saving.

### no-partial-delete
`req~streakly.no-partial-delete~1`
THE SYSTEM SHALL never leave a habit's ticks behind when it deletes the habit, nor a habit without its ticks when that delete fails.

### no-archived-ticks
`req~streakly.no-archived-ticks~1`
THE SYSTEM SHALL never store or remove a tick for an archived habit.

## Done when
#### First run shows the guide
`ac~streakly.guide.first-run~1`
GIVEN a fresh install
WHEN the app opens at "/"
THEN the screen shows "1 of 3" and "Add the habits you want to keep" with buttons "Skip" and "Next"
Needs: holdout, e2e

#### Next walks to the last card
`ac~streakly.guide.next~1`
GIVEN the guide on card 1
WHEN the person taps "Next" twice
THEN the screen shows "3 of 3" and "See your week at a glance"
AND a "Get started" button shows in place of "Skip" and "Next"
Needs: holdout, e2e

#### Skip finishes the guide for good
`ac~streakly.guide.skip~1`
GIVEN the guide on card 1
WHEN the person taps "Skip" and then reopens the app at "/"
THEN Today shows with the heading "Today" and the guide doesn't show
Needs: holdout, e2e

#### Get started finishes the guide
`ac~streakly.guide.get-started~1`
GIVEN the guide on card 3
WHEN the person taps "Get started"
THEN Today shows with the heading "Today" and the tabs "Today", "Week" and "Settings"
Needs: holdout, e2e

#### Today shows date, rows and summary
`ac~streakly.today.rows~1`
GIVEN habits "Stretch" and "Read" in that order, with only "Stretch" ticked today
WHEN the person opens Today
THEN "Stretch" is listed above "Read", and today's long date (e.g. "Wednesday, 11 November") shows over "Today"
AND the summary reads "1 of 2 ticked"
Needs: holdout, e2e

#### Tick today
`ac~streakly.tick.on~1`
GIVEN habit "Stretch" with no ticks
WHEN the person taps the tick box for "Stretch" on Today
THEN the box is checked, the row reads "1-day streak" and "Best: 1"
AND a tick for "Stretch" on today's date is stored
Needs: holdout, e2e, utest

#### Untick today
`ac~streakly.tick.off~1`
GIVEN habit "Stretch" ticked today
WHEN the person taps its tick box
THEN the box is unchecked and no tick for "Stretch" on today's date is stored
Needs: holdout, e2e, utest

#### Week grid layout
`ac~streakly.week.grid~1`
GIVEN habits "Stretch" and "Read"
WHEN the person opens Week
THEN 7 column headers show, from 6 days ago to today, each a short weekday and day number
AND there is one row named "Stretch" and one named "Read", each with 7 cells
Needs: holdout, e2e

#### Fix a missed day on Week
`ac~streakly.week.fix-day~1`
GIVEN habit "Stretch" ticked today only
WHEN the person taps the "Stretch" cell for yesterday on Week
THEN that cell is checked and a tick for "Stretch" on yesterday's date is stored
AND Today shows "2-day streak" for "Stretch"
Needs: holdout, e2e

#### Day 7 back is refused
`ac~streakly.tick-window.too-old~1`
GIVEN habit "Stretch" and today's date
WHEN a tick is saved for "Stretch" on the day 7 days before today
THEN the save is refused with "Only today and the 6 days before can be ticked" and the stored tick count is unchanged
Needs: holdout, utest

#### Tomorrow is refused
`ac~streakly.tick-window.future~1`
GIVEN habit "Stretch" and today's date
WHEN a tick is saved for "Stretch" on tomorrow's date
THEN the save is refused and no tick on tomorrow is stored
Needs: holdout, utest

#### Day 6 back is allowed
`ac~streakly.tick-window.edge~1`
GIVEN habit "Stretch" and today's date
WHEN a tick is saved for "Stretch" on the day 6 days before today
THEN a tick on that date is stored
Needs: holdout, utest

#### Current streak counts from yesterday when today is open
`ac~streakly.streaks.current-yesterday~1`
GIVEN ticks on the 3 days before today and none today
WHEN the current streak is worked out
THEN it is 3
Needs: holdout, utest

#### Current streak breaks on a gap
`ac~streakly.streaks.current-gap~1`
GIVEN ticks today and 2 days ago, none yesterday
WHEN the current streak is worked out
THEN it is 1
Needs: holdout, utest

#### Best streak is the longest run
`ac~streakly.streaks.best~1`
GIVEN ticks on 4 days in a row, a gap of one day, then 2 days in a row
WHEN the best streak is worked out
THEN it is 4
Needs: holdout, utest

#### No habits, no streak
`ac~streakly.streaks.zero~1`
GIVEN a habit with no ticks
WHEN Today shows it
THEN its row reads "0-day streak" and "Best: 0"
Needs: holdout, e2e

#### Add a habit
`ac~streakly.add-habit.save~1`
GIVEN Today with habit "Stretch"
WHEN the person taps "+", types "Read", picks "Teal" and taps "Save"
THEN Today lists "Read" below "Stretch"
AND a habit named "Read" with colour Teal is stored
Needs: holdout, e2e

#### Add from the empty state
`ac~streakly.add-habit.from-empty~1`
GIVEN no habits
WHEN the person taps "Add a habit" on Today
THEN the "Add habit" screen shows with a "Name" field and 8 colour choices, "Violet" selected
Needs: holdout, e2e

#### Cancel adds nothing
`ac~streakly.add-habit.cancel~1`
GIVEN the Add habit screen with "Read" typed
WHEN the person taps "Cancel"
THEN Today shows and no habit named "Read" is stored
Needs: holdout, e2e

#### Empty name is refused
`ac~streakly.habit-name.empty~1`
GIVEN the Add habit screen
WHEN the person types only spaces and taps "Save"
THEN "Give your habit a name" shows and no habit is stored
Needs: holdout, e2e

#### Name stops at 40 characters
`ac~streakly.habit-name.max~1`
GIVEN the Add habit screen
WHEN the person types 45 characters
THEN the field holds 40 characters and the counter reads "40/40"
Needs: holdout, e2e

#### Name is trimmed
`ac~streakly.habit-name.trim~1`
GIVEN a new habit named "  Read  "
WHEN it is saved
THEN the stored name is "Read"
Needs: holdout, utest

#### Over-long name is refused in storage
`ac~streakly.habit-name.store-max~1`
GIVEN a 41-character name
WHEN a habit is added with it
THEN the add is refused with "Keep the name to 40 characters" and no habit is stored
Needs: holdout, utest

#### Edit keeps the ticks
`ac~streakly.edit-habit.rename~1`
GIVEN habit "Stretch" ticked today and yesterday
WHEN the person taps "Stretch" on Today, changes the name to "Yoga" and taps "Save"
THEN Today lists "Yoga" with "2-day streak"
AND 2 ticks for that habit are still stored
Needs: holdout, e2e

#### Edit opens filled in
`ac~streakly.edit-habit.filled~1`
GIVEN habit "Stretch" with colour Green
WHEN the person taps "Stretch" on Today
THEN the "Edit habit" screen shows "Stretch" in "Name" and "Green" selected
Needs: holdout, e2e

#### Delete a habit
`ac~streakly.delete-habit.confirm~1`
GIVEN habit "Stretch" with 3 ticks
WHEN the person taps "Delete habit" on Edit habit, then "Delete" on "Delete this habit and all its history?"
THEN Today shows without "Stretch"
AND no habit "Stretch" and 0 ticks for it are stored
Needs: holdout, e2e

#### Cancel keeps the habit
`ac~streakly.delete-habit.cancel~1`
GIVEN the "Delete this habit and all its history?" prompt for "Stretch"
WHEN the person taps "Cancel"
THEN the prompt closes and "Stretch" is still stored
Needs: holdout, e2e

#### Deleting a habit clears its failed tick
`ac~streakly.delete-habit.clears-failed~1`
GIVEN a remembered failed tick change on "Stretch"
WHEN "Stretch" is deleted
THEN no failed tick change is remembered
AND Today doesn't show "Couldn't save your change"
Needs: holdout, utest, e2e

#### Drag to reorder
`ac~streakly.reorder.drag~1`
GIVEN habits "Stretch", "Read" and "Walk" in that order
WHEN the person long-presses "Walk" for 500 ms and drags it above "Stretch"
THEN Today lists "Walk", "Stretch", "Read"
AND Week lists its rows in the same order after a restart
Needs: holdout, e2e

#### Long press doesn't open Edit
`ac~streakly.reorder.long-press~1`
GIVEN habit "Stretch" on Today
WHEN the person long-presses its name for 500 ms and lets go without moving
THEN Today still shows and the "Edit habit" screen doesn't open
Needs: holdout, e2e

#### Stored order
`ac~streakly.reorder.store~1`
GIVEN habits with ids 1, 2 and 3 in that order
WHEN the order 3, 1, 2 is saved
THEN the list loads as 3, 1, 2
Needs: holdout, utest

#### Pick a theme
`ac~streakly.theme.dark~1`
GIVEN the theme "System"
WHEN the person selects "Dark" in Settings
THEN the "Dark" radio is checked, the page uses the dark background and the stored theme is "dark"
Needs: holdout, e2e

#### Theme survives a restart
`ac~streakly.theme.persist~1`
GIVEN the theme "Light" chosen
WHEN the app restarts with the phone in dark mode
THEN the app shows the light theme and "Light" is checked
Needs: holdout, e2e

#### Delete all data
`ac~streakly.delete-all.confirm~1`
GIVEN 2 habits with ticks, one tick 30 days before today, and the theme "Dark"
WHEN the person taps "Delete all data", then "Delete everything"
THEN the guide shows "1 of 3"
AND 0 habits and 0 ticks are stored and the stored theme is "system"
Needs: holdout, e2e

#### Cancel delete all
`ac~streakly.delete-all.cancel~1`
GIVEN the prompt "Delete all habits and history? This can't be undone."
WHEN the person taps "Cancel"
THEN Settings shows and every habit is still stored
Needs: holdout, e2e

#### Delete all clears failed ticks
`ac~streakly.delete-all.clears-failed~1`
GIVEN a remembered failed tick change on "Stretch"
WHEN all data is deleted
THEN no failed tick change is remembered
Needs: holdout, utest

#### Failed tick shows the banner
`ac~streakly.save-error.tick~1`
GIVEN habit "Stretch" unticked and storage refusing writes
WHEN the person taps its tick box
THEN "Couldn't save your change" shows with "Try again" and the box stays unchecked
Needs: holdout, e2e

#### Try again saves the same tick
`ac~streakly.save-error.retry~1`
GIVEN a failed tick on "Stretch" for today and storage working again
WHEN the person taps "Try again"
THEN the banner goes, the box is checked and a tick for "Stretch" on today is stored
Needs: holdout, e2e

#### Retry sets the intended state, not a flip
`ac~streakly.save-error.intended-state~1`
GIVEN a remembered failed change that ticks "Stretch" on yesterday, and a tick for "Stretch" on yesterday already stored
WHEN "Try again" saves it
THEN exactly 1 tick for "Stretch" on yesterday's date is stored
Needs: holdout, utest

#### Retry uses the original day
`ac~streakly.save-error.original-day~1`
GIVEN a remembered failed change that unticks "Stretch" on 10 November, made before midnight, and the phone's date now 11 November with "Stretch" ticked on both days
WHEN the person taps "Try again"
THEN no tick for "Stretch" on 10 November is stored
AND the tick for "Stretch" on 11 November is still stored
Needs: holdout, utest

#### Failed theme change shows the banner
`ac~streakly.save-error.theme~1`
GIVEN Settings with "System" and storage refusing writes
WHEN the person selects "Dark"
THEN "Couldn't save your change" shows and "System" stays checked
Needs: holdout, e2e

#### Failed tick offered after restart
`ac~streakly.failed-tick-kept.restart~1`
GIVEN a tick on "Stretch" that failed to save before the app closed
WHEN the app opens on Today
THEN "Couldn't save your change" shows with "Try again"
AND tapping "Try again" stores the tick for "Stretch" on that day
Needs: holdout, e2e, utest

#### Other ticks wait for the failed one
`ac~streakly.failed-tick-kept.blocks~1`
GIVEN a remembered failed tick on "Stretch" for today and habit "Read" unticked
WHEN the person taps the tick box for "Read"
THEN the box for "Read" stays unchecked and no tick for "Read" is stored
AND "Couldn't save your change" still shows
Needs: holdout, e2e, utest

#### Expired failed tick is refused and cleared
`ac~streakly.failed-tick-kept.expired~1`
GIVEN a remembered failed change that ticks "Stretch" on a day that is now 7 days before today
WHEN the person taps "Try again"
THEN the save is refused, no tick for "Stretch" on that day is stored and no failed tick change is remembered
AND "Couldn't save your change" no longer shows
Needs: holdout, utest, e2e

#### Ticks open again once the failed one expires
`ac~streakly.failed-tick-kept.unblocks~1`
GIVEN a remembered failed change on "Stretch" for a day now 7 days before today, and habit "Read" unticked
WHEN a tick is saved for "Read" on today
THEN a tick for "Read" on today's date is stored
Needs: holdout, utest

#### Empty Today
`ac~streakly.list-states.empty-today~1`
GIVEN no habits
WHEN the person opens Today
THEN "No habits yet" and "Add the daily habits you want to keep, then tick them off here." show with "Add a habit"
Needs: holdout, e2e

#### Empty Week
`ac~streakly.list-states.empty-week~1`
GIVEN no habits
WHEN the person opens Week
THEN "No habits yet" and "Each habit you keep gets a row here, with a box for each of the last 7 days." show with "Add a habit"
Needs: holdout, e2e

#### Loading
`ac~streakly.list-states.loading~1`
GIVEN reading the habits hasn't finished
WHEN Today shows
THEN "Loading your habits…" shows
Needs: holdout, e2e

#### Load error and retry
`ac~streakly.list-states.error~1`
GIVEN reading the habits fails
WHEN Today shows
THEN "Couldn't load your habits" shows with "Try again"
AND tapping "Try again" once reading works lists the habits
Needs: holdout, e2e

#### Missing habit on Edit
`ac~streakly.edit-states.gone~1`
GIVEN no habit with id 999
WHEN the person opens "/habits/999"
THEN "This habit isn't here any more." shows with "Back to Today"
Needs: holdout, e2e

#### Edit load error
`ac~streakly.edit-states.error~1`
GIVEN reading the habit fails
WHEN the Edit habit screen opens
THEN "Couldn't load your habit" shows with "Try again"
Needs: holdout, e2e

#### Form save fails
`ac~streakly.form-save-error.add~1`
GIVEN the Add habit screen with "Read" typed and storage refusing writes
WHEN the person taps "Save"
THEN "Couldn't save. Try again." shows, the field still holds "Read" and no habit is stored
Needs: holdout, e2e

#### Midnight moves the day
`ac~streakly.day-rollover.midnight~1`
GIVEN Today open at 23:59 with "Stretch" ticked
WHEN the phone's clock passes local midnight
THEN within 10 s Today shows the new date, "0 of 1 ticked" and an unchecked box for "Stretch"
Needs: holdout, e2e

#### /today goes to Today
`ac~streakly.routes.today~1`
GIVEN the guide is finished
WHEN the person opens "/today"
THEN Today shows with the heading "Today"
Needs: holdout, e2e

#### Unknown address goes to Today
`ac~streakly.routes.unknown~1`
GIVEN the guide is finished
WHEN the person opens "/nowhere"
THEN Today shows with the heading "Today"
Needs: holdout, e2e

#### Stored ticks stay inside the window
`ac~streakly.no-old-ticks.store~1`
GIVEN habit "Stretch" and today's date
WHEN untick is asked for "Stretch" on a day 10 days before today
THEN it is refused and the stored ticks are unchanged
Needs: holdout, utest

#### Two quick taps both count
`ac~streakly.no-lost-tick.quick-taps~1`
GIVEN habit "Stretch" unticked
WHEN the person taps its tick box twice quickly
THEN after both saves the box is unchecked and no tick for today is stored
Needs: holdout, utest, e2e

#### Delete takes ticks with it
`ac~streakly.no-partial-delete.ticks~1`
GIVEN habit "Stretch" with 3 ticks, one of them 30 days before today
WHEN the habit is deleted
THEN 0 ticks with its id are stored
Needs: holdout, utest

#### Failed delete keeps everything
`ac~streakly.no-partial-delete.fail~1`
GIVEN habit "Stretch" with 3 ticks and storage failing partway through the delete
WHEN the habit is deleted
THEN the habit and its 3 ticks are still stored
Needs: holdout, utest

#### Edit habit offers Archive
`ac~streakly.archive.button~1`
GIVEN habit "Stretch"
WHEN the person opens Edit habit for "Stretch"
THEN an "Archive habit" button shows above the "Delete habit" button
Needs: holdout, e2e

#### Archive hides the habit at once
`ac~streakly.archive.hides~1`
GIVEN habits "Stretch" and "Read", with "Stretch" ticked today and yesterday
WHEN the person taps "Archive habit" on Edit habit for "Stretch"
THEN Today shows with no confirm prompt and doesn't list "Stretch"
AND Week has no row named "Stretch"
AND "Stretch" is still stored, marked archived, with its 2 ticks
Needs: holdout, e2e

#### Archive drops unsaved edits
`ac~streakly.archive.unsaved-edits~1`
GIVEN habit "Stretch" stored in Teal, and Edit habit for "Stretch" with the name changed to "Yoga" and another colour picked, not saved
WHEN the person taps "Archive habit"
THEN the archived habit is stored with the name "Stretch" and the colour Teal
AND no habit named "Yoga" is stored
Needs: holdout, e2e

#### Summary leaves archived habits out
`ac~streakly.archive.summary~1`
GIVEN habits "Stretch" and "Read", with "Stretch" archived and "Read" ticked today
WHEN the person opens Today
THEN the summary reads "1 of 1 ticked"
Needs: holdout, e2e

#### Archiving clears its failed tick
`ac~streakly.archive.clears-failed~1`
GIVEN a remembered failed tick change on "Stretch" and habit "Read" unticked
WHEN "Stretch" is archived and the person taps the tick box for "Read"
THEN no failed tick change is remembered and "Couldn't save your change" doesn't show
AND a tick for "Read" on today's date is stored
Needs: holdout, utest, e2e

#### Archived habits listed in Settings
`ac~streakly.archived-list.shows~1`
GIVEN habit "Stretch" in Teal, with a best streak of 4, archived
WHEN the person opens Settings
THEN the "Archived habits" section shows "Stretch" in Teal, "Best: 4" and a "Restore" button
AND no delete button shows for "Stretch" there
Needs: holdout, e2e

#### Newest archived shows first
`ac~streakly.archived-list.order~1`
GIVEN habit "Stretch" archived and then habit "Read" archived
WHEN the archived habits are listed
THEN "Read" comes before "Stretch"
Needs: holdout, utest

#### No archived habits
`ac~streakly.archived-list.empty~1`
GIVEN no archived habits
WHEN the person opens Settings
THEN the "Archived habits" section reads "No archived habits"
Needs: holdout, e2e

#### Restore puts it back in its place
`ac~streakly.restore.place~1`
GIVEN habits "Stretch", "Read" and "Walk" in that order, with "Read" archived
WHEN the person taps "Restore" for "Read" in Settings
THEN Today lists "Stretch", "Read", "Walk"
AND "Read" no longer shows under "Archived habits"
Needs: holdout, e2e

#### Restore with fewer habits goes to the end
`ac~streakly.restore.place-fewer~1`
GIVEN habits "Stretch", "Read" and "Walk" in that order, then "Walk" archived, then "Stretch" deleted
WHEN "Walk" is restored
THEN the list loads as "Read", "Walk"
Needs: holdout, utest

#### Archived days break the current streak
`ac~streakly.restore.streak~1`
GIVEN habit "Stretch" with ticks on 7, 6 and 5 days before today and none since, archived 5 days before today
WHEN the person restores "Stretch" and opens Today
THEN its row reads "0-day streak" and "Best: 3"
Needs: holdout, e2e

#### Archived days can be ticked after restore
`ac~streakly.restore.tick-archived-days~1`
GIVEN habit "Stretch" archived 3 days before today and restored today
WHEN the person taps the Week cell for "Stretch" on 2 days before today
THEN a tick for "Stretch" on that date is stored
AND the cell shows ticked
Needs: holdout, e2e

#### Restore keeps the ticks
`ac~streakly.restore.keeps-ticks~1`
GIVEN archived habit "Stretch" with 3 stored ticks
WHEN "Stretch" is restored
THEN 3 ticks for "Stretch" are still stored
Needs: holdout, utest

#### Failed restore shows the banner
`ac~streakly.save-error.restore~1`
GIVEN archived habit "Stretch" and storage refusing writes
WHEN the person taps "Restore" for "Stretch" in Settings
THEN "Couldn't save your change" shows with "Try again"
AND "Stretch" still shows under "Archived habits" and stays archived in storage
Needs: holdout, e2e

#### Failed archive stays on the form
`ac~streakly.form-save-error.archive~1`
GIVEN Edit habit for "Stretch" and storage refusing writes
WHEN the person taps "Archive habit"
THEN "Couldn't save. Try again." shows on Edit habit and "Stretch" is stored not archived
Needs: holdout, e2e

#### Waiting taps refused after a failed tick
`ac~streakly.failed-tick-kept.waiting-refused~1`
GIVEN habits "Stretch" and "Read" unticked today, and a tick for "Stretch" saving while a tick for "Read" waits to save
WHEN the save for "Stretch" fails
THEN no tick for "Read" on today's date is stored
AND the tick box for "Read" shows unticked
Needs: holdout, utest, e2e

#### Every habit archived
`ac~streakly.list-states.all-archived~1`
GIVEN habit "Stretch" only, archived
WHEN the person opens Today
THEN "No habits yet" shows with "Add a habit"
Needs: holdout, e2e

#### Archived list load error
`ac~streakly.list-states.archived-error~1`
GIVEN reading the archived habits fails
WHEN the person opens Settings
THEN "Couldn't load archived habits" shows with "Try again"
Needs: holdout, e2e

#### Archived habit's address
`ac~streakly.edit-states.archived~1`
GIVEN habit "Stretch" with id 5, archived
WHEN the person opens "/habits/5"
THEN "This habit isn't here any more." shows with "Back to Today"
Needs: holdout, e2e

#### Delete all removes archived habits
`ac~streakly.delete-all.archived~1`
GIVEN archived habit "Stretch" with 3 ticks and habit "Read"
WHEN all data is deleted
THEN 0 habits and 0 ticks are stored
Needs: holdout, utest

#### Archived habit can't be ticked
`ac~streakly.no-archived-ticks.store~1`
GIVEN archived habit "Stretch" with no tick today
WHEN a tick is saved for "Stretch" on today
THEN the save is refused and no tick for "Stretch" on today's date is stored
Needs: holdout, utest

#### Archived habit can't be unticked
`ac~streakly.no-archived-ticks.untick~1`
GIVEN archived habit "Stretch" ticked yesterday
WHEN an untick is saved for "Stretch" on yesterday
THEN the save is refused and the tick for "Stretch" on yesterday is still stored
Needs: holdout, utest

#### Last guide card shows only Get started
`ac~streakly.guide-last-card.buttons~1`
GIVEN the first-run guide
WHEN the person reaches its last card
THEN a "Get started" button shows
AND no "Skip" or "Next" button shows
Needs: holdout, e2e

## Decided by AXB AIOS
- The app kind is a real phone app (Expo), as the repo is built. It also exports to the web.
- The browser tab title showing "Tools" is a known bug and has no item here.
- Habits have no schedule (every habit is daily) and no reminders, as the code has none.
- Duplicate habit names are allowed, as the code allows them.
- A tick can land on a tickable day before the habit was added, as the code allows.
- Colours are fixed to Violet, Green, Amber, Red, Teal, Pink, Blue and Grey, with Violet the default for a new habit.
- Day boundaries follow the phone's local midnight.
- The test hooks and anything AXB AIOS adds to run the app have no items.
