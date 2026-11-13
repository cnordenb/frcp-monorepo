import assert from "node:assert/strict";
import { test } from "node:test";
import type { Round } from "../../src/core/logic.ts";
import { CIVS, EDITIONS, allBut, idOf, logic, makeState, namedLog } from "./core-fixture.ts";

const { emptyState, parseState, serialiseState, trimLog, recordDraw, closeRound } = logic;
const stored = (data: unknown): string => JSON.stringify(data);
const fullRound = (): Round => CIVS.map((c) => [c.id, c.id + 1, CIVS.length]);

test("Test 31: a new state is the default edition with every civ on and an empty round", () => {
  assert.deepEqual(emptyState(), { edition: EDITIONS[0], off: new Set(), log: [[]] });
});

test("Test 32: a saved state reads back as it was", () => {
  const s = makeState({ off: ["Aztecs", "Wu"], log: [[["Huns", 1, 54], ["Celts", 2, 54]], [["Franks", 1, 54]]] });
  assert.deepEqual(parseState(stored(serialiseState(s))), s);
});

test("Test 33: anything that isn't a saved state reads as nothing", () => {
  const raws = [null, "", "not json", "[]", "{}", "42", stored({ edition: "XX" }), stored({ edition: null })];
  assert.deepEqual(raws.filter((raw) => parseState(raw) !== null), []);
});

test("Test 34: a saved state keeps only the parts that make sense", () => {
  const s = parseState(stored({
    edition: "DE",
    disabled: [1, -1, 999, 2.5, "3", null],
    log: [
      [[10, 1, 56], [999, 2, 56], ["x", 3, 56], [11, "4", 56], [12, 5]],
      "not a round",
      [],
      [[13, 1, 56], [13, 2, 56], [14, 3, 56]],
    ],
  }));
  assert.deepEqual(s, { edition: "DE", off: new Set([1]), log: [[[10, 1, 56]], [[13, 1, 56], [14, 3, 56]]] });
});

test("Test 35: a saved state with no log gets an empty round", () => {
  const logs = [{ edition: "DE" }, { edition: "DE", log: [[], []] }].map((data) => parseState(stored(data))?.log);
  assert.deepEqual(logs, [[[]], [[]]]);
});

test("Test 36: a saved state of an older edition has the newer civs off", () => {
  const s = parseState(stored({ edition: "AOK", disabled: [] }));
  assert.deepEqual(s?.off, new Set(CIVS.filter((c) => !logic.inEdition(c, "AOK")).map((c) => c.id)));
});

test("Test 37: a draw is counted out of the pool, and the draw after a full round starts a new one", () => {
  const s = makeState({ edition: "AOK", off: allBut("Britons", "Celts") });
  for (const name of ["Celts", "Britons", "Britons"]) recordDraw(s, idOf(name));
  assert.deepEqual(namedLog(s), [[["Celts", 1, 2], ["Britons", 2, 2]], [["Britons", 1, 2]]]);
});

test("Test 38: closing a round adds one empty round, and never two", () => {
  const s = makeState({ log: [[["Celts", 1, 56]]] });
  closeRound(s);
  closeRound(s);
  assert.deepEqual(namedLog(s), [[["Celts", 1, 56]], []]);
});

test("Test 39: the log keeps its newest 256 draws, dropping the oldest first", () => {
  const s = emptyState();
  s.log = Array.from({ length: 6 }, fullRound);
  trimLog(s);
  const dropped = 6 * CIVS.length - 256;
  const whole = Array.from({ length: 5 - Math.floor(dropped / CIVS.length) }, fullRound);
  assert.deepEqual(s.log, [fullRound().slice(dropped % CIVS.length), ...whole]);
});

test("Test 40: the log never drops draws of the current round, however long", () => {
  const s = emptyState();
  s.log = [fullRound(), Array.from({ length: 300 }, (_, i) => [i % CIVS.length, i + 1, 300])];
  trimLog(s);
  assert.deepEqual(s.log.map((r) => r.length), [300]);
});
