import assert from "node:assert/strict";
import { test } from "node:test";
import { KEY_LABELS, checkKeystroke, nameOfKeyPress, parseKeyName } from "../../src/app/bindings/keystroke.ts";

const MODIFIER_SETS = ["", "Ctrl+", "Alt+", "Shift+", "Ctrl+Alt+", "Ctrl+Shift+", "Alt+Shift+", "Ctrl+Alt+Shift+"];

function press(key: string, code: string, held: string = ""): Parameters<typeof nameOfKeyPress>[0] {
  return {
    key,
    code,
    ctrlKey: held.includes("Ctrl"),
    altKey: held.includes("Alt"),
    shiftKey: held.includes("Shift"),
    metaKey: held.includes("Meta"),
  };
}

test("Test 59: every usable keystroke is read back from its name", () => {
  const names = KEY_LABELS.flatMap((label) => MODIFIER_SETS.map((modifiers) => modifiers + label));
  const usable = names.filter((name) => checkKeystroke(name) === "usable");
  const unread = usable.filter((name) => parseKeyName(name.toLowerCase()) !== name);
  assert.deepEqual([usable.length, unread], [78 * 8 - 30, []]);
});

test("Test 60: text that names no keystroke is not read as one", () => {
  const texts = ["", "Ctrl+", "Ctrl", "Shift+Ctrl+S", "Ctrl+Ctrl+S", "S+Ctrl", "F13", "Ctrl+S ", "Spacebar", "Win+S"];
  assert.deepEqual(texts.filter((text) => parseKeyName(text) !== null), []);
});

test("Test 61: the system's keystrokes are kept, unnamed keys refused and the others usable", () => {
  const uses = ["F12", "Ctrl+F12", "Alt+Shift+Tab", "Ctrl+Esc", "Alt+F4", "Alt+Space", "Ctrl+Alt+Delete",
    "Ctrl+Shift+I", ";", "None", "Shift", "Q", "Ctrl+Tab", "Shift+Esc", "Ctrl+F4", "Backspace", "Ctrl+Delete"]
    .map(checkKeystroke);
  assert.deepEqual(uses, [
    "kept", "kept", "kept", "kept", "kept", "kept", "kept", "kept",
    "unnamed", "unnamed", "unnamed", "usable", "usable", "usable", "usable", "usable", "usable",
  ]);
});

test("Test 62: a key press is named by its held keys, in the order Ctrl, Alt, Shift, and its key", () => {
  const names = [
    press("s", "KeyS", "Shift Ctrl"), press("5", "Numpad5"), press("5", "Digit5"), press("%", "Digit5", "Shift"),
    press(" ", "Space"), press("Escape", "Escape"), press("PageDown", "PageDown", "Alt"), press("F11", "F11"),
    press("+", "NumpadAdd", "Alt"), press("Shift", "ShiftLeft", "Shift"), press(";", "Semicolon"),
    press("q", "KeyQ", "Meta"),
  ].map(nameOfKeyPress);
  assert.deepEqual(names, [
    "Ctrl+Shift+S", "Num 5", "5", "Shift+5", "Space", "Esc", "Alt+PgDn", "F11", "Alt+Num +", "", "", "",
  ]);
});
