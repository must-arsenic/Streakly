## What it adds
On Edit habit, the person can archive a habit instead of deleting it. Archiving uses the habit as last saved and drops any name or colour changes that weren't saved. An archived habit leaves Today, Week and Today's summary, but its ticks stay stored and its best streak is kept. The days it spends archived count as missed days. After it is restored, any of those days that can still be ticked can be ticked as usual. Settings gets an "Archived habits" section. It lists each archived habit with its name, colour, "Best: <n>" and a "Restore" button, and Restore puts the habit back at the place it had in the list. To delete an archived habit, the person restores it first. "Delete all data" still removes everything. If a tick fails to save, any taps still waiting to save are refused and must be made again. The last card of the first-run guide shows only "Get started".

## Added to It must
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

## Added to It must never
### no-archived-ticks
`req~streakly.no-archived-ticks~1`
THE SYSTEM SHALL never store or remove a tick for an archived habit.

## Changed
### today
`req~streakly.today~2`
THE SYSTEM SHALL list every habit that isn't archived on Today in list order. Each row shows the habit's name, colour, tick box for today, "<n>-day streak" and "Best: <n>". Above the list are today's long date and "<ticked> of <total> ticked", which counts only habits that aren't archived.

### week
`req~streakly.week~2`
THE SYSTEM SHALL show on Week one row per habit that isn't archived, in list order, and 7 day columns, from 6 days ago to today, each headed by its short weekday and day number. Tapping a cell flips that habit's tick on that day.

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

## Added to Done when
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

## Changed parts
### What it is
Streakly is a private daily-habit tracker. One person adds the habits they want to keep and ticks each one off every day it's done. The app counts each habit's current and best streak. A Week view shows the last 7 days so a forgotten day can be fixed. A habit can be archived to put it aside without losing its history. Settings lists archived habits so each one can be restored.

It's a real phone app, used on the go at phone width (375 px and up). It also runs in a browser up to 1440 px, with content in one centred column. It works in light and dark themes, and a three-card guide shows on first run.

### Data and risk
Everything is stored on this phone only, in a local database, until the person deletes it. That includes:
- habits: name, colour, order, day added, whether archived, when archived and the place to restore to
- ticks: habit and day
- the theme choice
- whether the guide is finished
- at most one tick change that failed to save: its habit, its day and whether it was to tick or untick

That failed change is kept until one of these happens: it saves, a retry is refused because its day is no longer tickable, its habit is archived, or its habit or all data is deleted. Archived habits keep their ticks until they are restored and deleted, or all data is deleted. Nobody signs in, nothing is uploaded, nothing is shared and nothing updates live from elsewhere. Streaks are worked out from the ticks each time and never stored.

### Glossary
**Archived habit**: a habit put aside from Today and Week that keeps its ticks and can be restored to its old place from Settings. The days it spends archived count as missed unless they are ticked after it is restored, while still tickable. _Avoid_: hidden, paused, inactive.
