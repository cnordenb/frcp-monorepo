import type { KeyChange } from "./hotkey-bindings.ts";
import type { HotkeyScope } from "./hotkey-table.ts";

export interface KeyChangeText {
  readonly status: string;
  readonly detail: string;
}

export interface NamedHotkey {
  readonly text: string;
  readonly scope: HotkeyScope;
}

export const SCOPE_TITLES: Record<HotkeyScope, string> = {
  global: "Global", draw: "Draw Civ tab", log: "Log tab", pool: "Civ Pool tab",
};

export const SCOPE_PLACES: Record<HotkeyScope, string> = {
  global: "every tab", draw: "Draw Civ tab", log: "Log tab", pool: "Civ Pool tab",
};

export const DEFAULTS_RESTORED: KeyChangeText = { status: "Every hotkey has its default key again.", detail: "" };
export const NO_STATUS: KeyChangeText = { status: "", detail: "" };

const UNNAMED_KEY_HELP = "Letters, digits, F1 to F11, the editing and arrow keys and the number pad can, also with "
  + "Ctrl, Alt or Shift.";

export function listeningText(text: string): KeyChangeText {
  return { status: `Press the new key for ${text}, or Backspace for no key.`, detail: "" };
}

function listed(parts: string[]): string {
  if (parts.length < 2) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function takenText(change: KeyChange, hotkeyOf: (id: string) => NamedHotkey): string {
  if (!change.takenFrom.length) return "";
  const losers = change.takenFrom.map(hotkeyOf).map((loser) => `${loser.text} (${SCOPE_PLACES[loser.scope]})`);
  return `${change.key} was taken from ${listed(losers)}.`;
}

export function keyChangeText(change: KeyChange, hotkeyOf: (id: string) => NamedHotkey): KeyChangeText {
  const { text } = hotkeyOf(change.id);
  if (change.choice === "cleared") return { status: `${text} has no key now.`, detail: "" };
  if (change.choice === "kept") return { status: `The system keeps ${change.key} for itself.`, detail: "" };
  if (change.choice === "unnamed") return { status: "That key can't be a hotkey.", detail: UNNAMED_KEY_HELP };
  return { status: `The key for ${text} is now ${change.key}.`, detail: takenText(change, hotkeyOf) };
}
