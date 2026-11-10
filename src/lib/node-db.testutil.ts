// A real SQLite database for unit tests (node:sqlite), shaped like the app's Db.
import { jest } from "@jest/globals";

import type { Db, Param } from "./db";

type Statement = { run(...p: Param[]): unknown; all(...p: Param[]): unknown[] };
type Sync = { exec(sql: string): void; prepare(sql: string): Statement };

export function nodeDb(): Db & { failWhen: (test: ((sql: string) => boolean) | null) => void } {
  const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (path: string) => Sync }>("node:sqlite");
  const raw = new DatabaseSync(":memory:");
  let fail: ((sql: string) => boolean) | null = null;
  const check = (sql: string) => {
    if (fail?.(sql)) throw new Error("disk I/O error");
  };
  return {
    failWhen: (test) => void (fail = test),
    exec: async (sql) => {
      check(sql);
      raw.exec(sql);
    },
    run: async (sql, ...params) => {
      check(sql);
      raw.prepare(sql).run(...params);
    },
    all: async <T,>(sql: string, ...params: Param[]) => raw.prepare(sql).all(...params) as T[],
    tx: async (task) => {
      raw.exec("BEGIN;");
      try {
        await task();
        raw.exec("COMMIT;");
      } catch (e) {
        raw.exec("ROLLBACK;");
        throw e;
      }
    },
  };
}
