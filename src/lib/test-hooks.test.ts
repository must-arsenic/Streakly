import { expect, jest, test } from "@jest/globals";

import { hooksOn } from "./test-hooks";

jest.mock("./db", () => ({ reset: jest.fn() }));

test("[utest->ac~app.hooks.off~1] the hooks do nothing unless switched on", () => {
  expect(hooksOn(undefined)).toBe(false);
  expect(hooksOn("0")).toBe(false);
  expect(hooksOn("1")).toBe(true);
});
