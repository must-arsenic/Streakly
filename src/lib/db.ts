// The app's data, kept on the phone with SQLite. `migrate` makes the tables, `reset` empties them
// (the test hooks' reset).
import * as SQLite from "expo-sqlite";

let opened: SQLite.SQLiteDatabase | null = null;

export async function open(): Promise<SQLite.SQLiteDatabase> {
  if (!opened) {
    opened = await SQLite.openDatabaseAsync("app.db");
    await migrate(opened);
  }
  return opened;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
}

/** Every table emptied: add each new table here. */
export async function reset(): Promise<void> {
  const db = await open();
  await db.execAsync("DELETE FROM kv;");
}
