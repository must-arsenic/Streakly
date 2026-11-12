# Versions of Streakly

AXB AIOS writes this file from its records; nobody edits it.

## Version 1 · feature 001 · built 2026-11-11

- Asked for: "Bring in git@github.com-work:must-arsenic/Streakly.git"
- Spec signed by izuulkh on 2026-11-11 at 17:22 UTC: 59 items, 43 checked in the browser
- Look: none
- Architecture signed by izuulkh on 2026-11-11: Parts, Pages, API, Data, Auth, Integrations, Look, Tests, Days, Streaks, Saving, Reorder
- Build 2026-11-11-streakly-mwce0i8t: 40:10 from the architecture signature, 1 round, 54 of 59 items met, hidden tests ready: 33 ran, 0 rejected on the bare template, 5 dropped by triage; refused: ac~streakly.tick.on~1: a flow has no steps; refused: ac~streakly.tick.off~1: a flow has no steps; refused: ac~streakly.week.fix-day~1: a flow has no steps; refused: ac~streakly.tick-window.too-old~1: a flow has no steps; refused: ac~streakly.tick-window.future~1: a flow has no steps; refused: ac~streakly.tick-window.edge~1: a flow has no steps; refused: ac~streakly.streaks.current-yesterday~1: a flow has no steps; refused: ac~streakly.streaks.best~1: a flow has no steps; refused: ac~streakly.habit-name.store-max~1: a flow has no steps; refused: ac~streakly.reorder.drag~1: a flow has no steps; refused: ac~streakly.reorder.store~1: a flow has no steps; refused: ac~streakly.theme.persist~1: a flow has no steps; refused: ac~streakly.save-error.tick~1: a flow has no steps; refused: ac~streakly.save-error.intended-state~1: a flow has no steps; refused: ac~streakly.save-error.original-day~1: a flow has no steps; refused: ac~streakly.failed-tick-kept.restart~1: a flow has no steps; refused: ac~streakly.failed-tick-kept.blocks~1: a flow has no steps; refused: ac~streakly.failed-tick-kept.unblocks~1: a flow has no steps; refused: ac~streakly.edit-states.gone~1: a flow has no steps; refused: ac~streakly.edit-states.error~1: `openLink` opens only the app's own deep links (exp://127.0.0.1:8081/--/…), not "exp://127.0.0.1:8081/--/__test/force?route=/habits/[id]&mode=error"; refused: ac~streakly.day-rollover.midnight~1: a flow has no steps; refused: ac~streakly.routes.unknown~1: a flow has no steps; refused: ac~streakly.no-old-ticks.store~1: a flow has no steps; refused: ac~streakly.no-lost-tick.quick-taps~1: a flow has no steps; refused: ac~streakly.no-partial-delete.ticks~1: a flow has no steps; refused: ac~streakly.no-partial-delete.fail~1: a flow has no steps, no design advice
- Commit: c2c086d5400c058d965174d44204bc3bbcac67fb
- Usage: worker $0.89, intake, look and architecture agents $1.91; Codex not counted
- Preview: http://127.0.0.1:62475

## Version 2 · feature 002 · built 2026-11-12

- Asked for: "Add a way to archive a habit instead of deleting it. An archived habit leaves Today and the week view but keeps its ticks and streaks, and Settings lists archived habits with a Restore button that brings each one back where it was."
- Spec signed by izuulkh on 2026-11-11 at 18:07 UTC: 82 items, 60 checked in the browser
- Look: unchanged
- Architecture signed by izuulkh on 2026-11-11: Parts, Pages, API, Data, Archive, Restore, Lists, Auth, Integrations, Look, Tests, Days, Streaks, Saving, Reorder
- Build 2026-11-11-streakly-2-mwcflydh: 868:46 from the architecture signature, 5 rounds, 81 of 82 items met, hidden tests ready: 50 ran, 2 rejected on the last version, 0 dropped by triage; kept from this build's earlier rounds, no design advice
- Commit: 288e5169ea0d328b1b4d7e170c477e3d56be11ac
- Usage: worker $9.93, intake, look and architecture agents $1.31; Codex not counted
- Preview: http://127.0.0.1:50644
