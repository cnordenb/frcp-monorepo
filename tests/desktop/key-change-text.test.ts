import assert from "node:assert/strict";
import { test } from "node:test";
import { HotkeyBindings } from "../../src/app/bindings/hotkey-bindings.ts";
import { type NamedHotkey, keyChangeText } from "../../src/app/bindings/key-change-text.ts";

const ALL_IN_USE = { editions: ["DE", "HD", "AOK"], dlcSlots: 9 };

const KEYS_THAT_CAN = "Letters, digits, F1 to F11, the editing and arrow keys and the number pad can, also with Ctrl, "
  + "Alt or Shift.";

function namedBy(bindings: HotkeyBindings): (id: string) => NamedHotkey {
  return (id) => ({ text: id, scope: bindings.hotkeys.find((hotkey) => hotkey.id === id)?.scope ?? "global" });
}

test("Test 58: the Customise Hotkeys dialog words each outcome of a key press", () => {
  const bindings = new HotkeyBindings(ALL_IN_USE);
  const presses = [["Undo", "Backspace"], ["Undo", "F12"], ["Undo", ";"], ["ToggleCivName", "Q"], ["Exit", "Esc"]];
  const texts = presses.map(([id, key]) => {
    const change = bindings.choose(id, key);
    return change && keyChangeText(change, namedBy(bindings));
  });
  assert.deepEqual(texts, [
    { status: "Undo has no key now.", detail: "" },
    { status: "The system keeps F12 for itself.", detail: "" },
    { status: "That key can't be a hotkey.", detail: KEYS_THAT_CAN },
    {
      status: "The key for ToggleCivName is now Q.",
      detail: "Q was taken from DrawTabOpenOptions (Draw Civ tab), LogTabClearDrawnLog (Log tab) and "
        + "CivPoolTabEdition1 (Civ Pool tab).",
    },
    { status: "The key for Exit is now Esc.", detail: "" },
  ]);
});
