# Streakly progress

## State: all items done, every test passes (15 jest, 43 playwright)

## How it's built
- Data: SQLite via src/lib/db.ts (habits, ticks, kv). Store: src/lib/store.ts, one tx per change, writePoint() fault after first change.
- Faults (src/lib/faults.ts) set by seeds writes-fail / writes-work / load-fails-once / reads-work; kept in sessionStorage on web.
- Hooks callable in-page: globalThis.__streaklyHooks.act(action, params) (hooks builds only).
- Reads through src/lib/use-data.ts -> testable(route,...). Route keys normalised by routeKey().
- Screens: (tabs)/index (Today), (tabs)/week, (tabs)/settings, habits/new, habits/[id], welcome. Tab screens render null when unfocused (no duplicate text in DOM).
- Today's date: src/lib/use-today.ts (midnight timeout, 5s poll, AppState/visibilitychange).
- Reorder: src/components/reorder-list.tsx (PanResponder, 500 ms hold, a11y Move up/down).
- app.json: expo-router asyncRoutes false (no lazy chunks offline); custom header back button (no png fetch).

## Learned
- Jest sandbox ignores TZ changes: the time-zone utest runs days.ts in child node processes (node 26 strips types).
- No @types/node: e2e files must not import node: modules (typecheck covers e2e).
- e2e: build with EXPO_PUBLIC_AIOS_TEST_HOOKS=1 pnpm export:web, then pnpm e2e.
- Guide must wait for the reloaded settings before leaving, or Today redirects back.
