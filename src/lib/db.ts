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
  /** Runs `task` in one transaction: every change in it is saved, or none is. */
  tx(task: () => Promise<void>): Promise<void>;
}

let opened: Promise<Db> | null = null;

export function open(): Promise<Db> {
  if (!opened) {
    opened = SQLite.openDatabaseAsync("app.db").then(async (raw) => {
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
  let queue: Promise<unknown> = Promise.resolve();
  let inTx = false;
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    if (inTx) return work();
    const next = queue.then(work, work);
    queue = next.catch(() => undefined);
    return next;
  };
  return {
    exec: (sql) => serial(() => raw.execAsync(sql)),
    run: (sql, ...params) => serial(async () => void (await raw.runAsync(sql, params))),
    all: <T,>(sql: string, ...params: Param[]) => serial(() => raw.getAllAsync<T>(sql, params)),
    tx: (task) =>
      serial(async () => {
        inTx = true;
        try {
          await raw.withTransactionAsync(task);
        } finally {
          inTx = false;
        }
      }),
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
];

export async function migrate(db: Db): Promise<void> {
  await db.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);");
  const rows = await db.all<{ version: number }>("SELECT version FROM schema_version LIMIT 1;");
  let version = rows[0]?.version ?? 0;
  if (rows.length === 0) await db.run("INSERT INTO schema_version (version) VALUES (0);");
  while (version < steps.length) {
    const step = steps[version];
    version += 1;
    await db.tx(async () => {
      await db.exec(step);
      await db.run("UPDATE schema_version SET version = ?;", version);
    });
  }
}

/** Every table emptied: add each new table here. */
export async function reset(): Promise<void> {
  const db = await open();
  await db.tx(async () => {
    await db.exec("DELETE FROM ticks; DELETE FROM habits; DELETE FROM kv;");
  });
}
