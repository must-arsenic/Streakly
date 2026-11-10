// A real SQLite database for unit tests (node:sqlite), behind the app's own queue.
import { jest } from "@jest/globals";

import { type Db, type Param, serialised } from "./db";

type Statement = { run(...p: Param[]): unknown; all(...p: Param[]): unknown[] };
type Sync = { exec(sql: string): void; prepare(sql: string): Statement };

export function nodeDb(): Db & { failWhen: (test: ((sql: string) => boolean) | null) => void } {
  const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (path: string) => Sync }>("node:sqlite");
  const raw = new DatabaseSync(":memory:");
  let fail: ((sql: string) => boolean) | null = null;
  const check = (sql: string) => {
    if (fail?.(sql)) throw new Error("disk I/O error");
  };
  // a tick between statements, as a real connection has
  const later = () => new Promise((r) => setTimeout(r, 0));
  const db = serialised(
    {
      exec: async (sql) => {
        await later();
        check(sql);
        raw.exec(sql);
      },
      run: async (sql, ...params) => {
        await later();
        check(sql);
        raw.prepare(sql).run(...params);
      },
      all: async <T,>(sql: string, ...params: Param[]) => {
        await later();
        return raw.prepare(sql).all(...params) as T[];
      },
    },
    async (task) => {
      raw.exec("BEGIN;");
      try {
        await task();
        raw.exec("COMMIT;");
      } catch (e) {
        raw.exec("ROLLBACK;");
        throw e;
      }
    },
  );
  return { ...db, failWhen: (test) => void (fail = test) };
}
