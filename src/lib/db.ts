// The app's data, kept on the phone with SQLite. `migrate` makes the tables, `reset` empties them
// (the test hooks' reset). Every query runs through one queue, so a transaction never interleaves
// with another query.
import * as SQLite from "expo-sqlite";

export type Param = string | number | null;

/** The small part of SQLite the app uses; tests give their own (node:sqlite). */
export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, ...params: Param[]): Promise<void>;
  all<T>(sql: string, ...params: Param[]): Promise<T[]>;
  /**
   * Runs `task` in one transaction: every change in it is saved, or none is. The task makes its
   * queries through the handle it is given (callers default it to the database itself, for a Db
   * that passes none); nothing else runs until it ends.
   */
  tx(task: (t?: Db) => Promise<void>): Promise<void>;
}

let opened: Promise<Db> | null = null;

export function open(): Promise<Db> {
  if (!opened) {
    opened = SQLite.openDatabaseAsync("app.db").then(async (raw) => {
      // Every committed change goes straight into app.db (no write-ahead log beside it).
      await raw.execAsync("PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL;");
      const db = expoDb(raw);
      await migrate(db);
      return db;
    });
    opened.catch(() => {
      opened = null;
    });
  }
  return opened;
}

/** For unit tests: use this database instead of the phone's. */
export function useDbForTests(db: Db | null): void {
  opened = db ? Promise.resolve(db) : null;
}

function expoDb(raw: SQLite.SQLiteDatabase): Db {
  return serialised(
    {
      exec: (sql) => raw.execAsync(sql),
      run: async (sql, ...params) => void (await raw.runAsync(sql, params)),
      all: <T,>(sql: string, ...params: Param[]) => raw.getAllAsync<T>(sql, params),
    },
    (task) => raw.withTransactionAsync(task),
  );
}

/**
 * One queue over a connection: each query, and each whole transaction, runs alone. Inside a
 * transaction the task's queries go straight to the connection, which the queue already holds.
 */
export function serialised(direct: Omit<Db, "tx">, transaction: (task: () => Promise<void>) => Promise<void>): Db {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T,>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work);
    queue = next.catch(() => undefined);
    return next;
  };
  const inside: Db = { ...direct, tx: (task) => task(inside) };
  return {
    exec: (sql) => serial(() => direct.exec(sql)),
    run: (sql, ...params) => serial(() => direct.run(sql, ...params)),
    all: <T,>(sql: string, ...params: Param[]) => serial(() => direct.all<T>(sql, ...params)),
    tx: (task) => serial(() => transaction(() => task(inside))),
  };
}

/** Schema steps, in order; append a step for every change and never edit one that shipped. */
const steps: string[] = [
  `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS habits (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     colour INTEGER NOT NULL,
     position INTEGER NOT NULL,
     created_on TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS ticks (
     habit_id INTEGER NOT NULL,
     date TEXT NOT NULL,
     PRIMARY KEY (habit_id, date)
   );
   CREATE INDEX IF NOT EXISTS ticks_by_habit ON ticks (habit_id);`,
  // archived habits: when (ms, null = not archived) and the 0-based place to restore to
  `ALTER TABLE habits ADD COLUMN archived_at INTEGER;
   ALTER TABLE habits ADD COLUMN restore_place INTEGER;`,
];

export async function migrate(db: Db): Promise<void> {
  await db.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);");
  const rows = await db.all<{ version: number }>("SELECT version FROM schema_version LIMIT 1;");
  let version = rows[0]?.version ?? 0;
  if (rows.length === 0) await db.run("INSERT INTO schema_version (version) VALUES (0);");
  while (version < steps.length) {
    const step = steps[version];
    version += 1;
    await db.tx(async (t = db) => {
      await t.exec(step);
      await t.run("UPDATE schema_version SET version = ?;", version);
    });
  }
}

/**
 * Every table emptied, as on a fresh install (the test hooks' reset): add each new table here. Ids
 * start again at 1, as they would on a fresh install.
 */
export async function reset(): Promise<void> {
  const db = await open();
  await db.tx((t = db) => t.exec("DELETE FROM ticks; DELETE FROM habits; DELETE FROM kv; DELETE FROM sqlite_sequence;"));
}
