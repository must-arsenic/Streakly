# Streakly progress

## Contract (done)
- contract/seeds.json + seeds in src/lib/test-hooks.ts. Fault seeds: writes-fail, writes-work, load-fails-once, reads-work.
- Data: SQLite via src/lib/db.ts (habits, ticks, kv). Store: src/lib/store.ts, one tx per change, writePoint() fault after first change.
- Reads through src/lib/use-data.ts -> testable(route,...). Route keys normalised by routeKey().
- Unit tests: use node:sqlite adapter (works in jest) via useDbForTests.
- e2e: build with EXPO_PUBLIC_AIOS_TEST_HOOKS=1 pnpm export:web, then pnpm e2e (port 3000 by serve.mjs).

## Items (todo)
streaks/days utests, store utests, screens: tabs (Today, Week, Settings), habits/new, habits/[id], welcome; theme; reorder; day refresh; e2e for all.
