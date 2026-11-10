import { afterEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addHabit, countTicks, deleteHabit, loadList, setTick } from "./store";
import { nodeDb } from "./node-db.testutil";

afterEach(() => useDbForTests(null));

test("the store works with a Db whose transactions pass no handle to the task", async () => {
  useDbForTests(nodeDb({ plain: true }));
  await migrate(await open());
  const id = await addHabit("Stretch", 2, "2026-11-10");
  await setTick(id, "2026-11-10", true, "2026-11-10");
  expect((await loadList()).ticks[id]).toEqual(["2026-11-10"]);
  await deleteHabit(id);
  expect(await countTicks(id)).toBe(0);
});
