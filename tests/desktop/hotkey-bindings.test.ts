import assert from "node:assert/strict";
import { test } from "node:test";
import { HotkeyBindings, parseHotkeys } from "../../src/app/bindings/hotkey-bindings.ts";
import { TAB_SCOPES } from "../../src/app/bindings/hotkey-table.ts";

const ALL_IN_USE = { editions: ["DE", "HD", "AOK"], dlcSlots: 9 };

const DEFAULT_KEYS = [
  "Tab", "1", "2", "3", "F1", "F2", "F3", "F4", "F5", "F9", "Ctrl+S", "Ctrl+R", "P", "U",
  "Ctrl+F", "Ctrl+Z", "Ctrl+X", "Ctrl+T", "Z", "X", "C", "V", "B", "Esc",
  "Space", "Enter", "Q", "R", "T", "H",
  "Space", "Enter", "Q", "W",
  "Space", "Enter", "Q", "W", "E", "R", "T", "A", "S", "D", "F", "G", "H", "J", "K", "L",
];

function clashingHotkeys(bindings: HotkeyBindings): string[] {
  return bindings.hotkeys
    .filter((hotkey) => bindings.clashesWith(hotkey.id, bindings.keyOf(hotkey.id)).length > 0)
    .map((hotkey) => hotkey.id);
}

test("Test 50: every hotkey starts with the key the desktop app always had", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  assert.deepEqual(bindings.hotkeys.map((hotkey) => bindings.keyOf(hotkey.id)), DEFAULT_KEYS);
});

test("Test 51: no two default keys clash", () => {
  assert.deepEqual(clashingHotkeys(new HotkeyBindings(ALL_IN_USE)), []);
});

test("Test 52: a keystroke runs its tab's action, and a global one the same action on every tab", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  const actions = ["Q", "Space", "F1", "Shift+Q", "None"].map((key) =>
    TAB_SCOPES.map((tab) => bindings.actionFor(key, tab)));
  assert.deepEqual(actions, [
    ["options", "clearLog", "edDE"],
    ["draw", "draw", "enableAll"],
    ["options", "options", "options"],
    [null, null, null],
    [null, null, null],
  ]);
});

test("Test 53: the hotkeys of editions and DLC slots that the data lacks do nothing", () => {
  const bindings = new HotkeyBindings({ editions: ["DE", "HD"], dlcSlots: 3 });
  const actions = ["W", "E", "D", "F"].map((key) => bindings.actionFor(key, "pool"));
  assert.deepEqual(actions, ["edHD", null, "dlc2", null]);
});

test("Test 54: a global keystroke clashes with each tab's hotkey that has it", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  assert.deepEqual(bindings.clashesWith("ToggleCivName", "Q"), [
    "DrawTabOpenOptions", "LogTabClearDrawnLog", "CivPoolTabEdition1",
  ]);
});

test("Test 55: assigning a keystroke takes it from the hotkeys it clashes with", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  bindings.assign("ToggleCivName", "Q");
  assert.deepEqual(bindings.serialise(), {
    ToggleCivName: "Q", DrawTabOpenOptions: "None", LogTabClearDrawnLog: "None", CivPoolTabEdition1: "None",
  });
});

test("Test 56: a keystroke that cannot be a hotkey is refused", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  const refused = ["None", "F12", "Alt+Tab", ";", "Shift", "Win+Q"].filter((key) => !bindings.assign("Undo", key));
  assert.deepEqual([refused.length, bindings.keyOf("Undo")], [6, "Ctrl+Z"]);
});

test("Test 57: saved hotkeys are read back, and junk among them leaves the default keys", () => {
  const saved = {
    DrawTabDrawCiv: "d", Exit: "none", OpenOptions: "F12", Undo: 7, Quicksave: "Spacebar", Nonsense: "Q",
    CivPoolTabEdition3: null,
  };
  assert.deepEqual(parseHotkeys(ALL_IN_USE, saved).serialise(), { DrawTabDrawCiv: "D", Exit: "None" });
});
