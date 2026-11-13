import assert from "node:assert/strict";
import { test } from "node:test";
import { firstMatch } from "../../src/app/history/historytext.ts";

test("Test 49: the history search picks the first civ whose name starts with the typed text", () => {
  const names = ["Britons", "Burmese", "Franks", "Goths"];
  const typed = ["b", "BU", "fr", "Franks", "franksx", "oth", "g"];
  assert.deepEqual(typed.map((text) => firstMatch(names, text)), [0, 1, 2, 2, -1, -1, 3]);
});
