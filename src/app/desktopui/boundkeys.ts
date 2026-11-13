import type { Logic } from "../../core/logic.ts";
import { type HotkeyBindings, parseHotkeys } from "../bindings/hotkey-bindings.ts";
import type { Hotkey } from "../bindings/hotkey-table.ts";
import { NO_KEY } from "../bindings/keystroke.ts";
import { ctx } from "../context.ts";
import { saveSettings } from "../model/settingsstore.ts";

export const NO_KEY_SHOWN = "—";

export function buildBindings(logic: Logic, saved: unknown): HotkeyBindings {
  const { EDITIONS, EDITION_INFO } = logic;
  const dlcSlots = Math.max(0, ...EDITIONS.map((ed) => EDITION_INFO[ed].dlcToggles.length));
  return parseHotkeys({ editions: EDITIONS, dlcSlots }, saved);
}

export function saveBindings(): void {
  if (!ctx.bindings) return;
  ctx.settings.keyBindings = ctx.bindings.serialise();
  saveSettings();
}

export function keyOf(id: string): string {
  const key = ctx.bindings ? ctx.bindings.keyOf(id) : NO_KEY;
  return key === NO_KEY ? "" : key;
}

export function shownKeyOf(id: string): string {
  return keyOf(id) || NO_KEY_SHOWN;
}

function globalHotkeyOf(action: string): Hotkey | undefined {
  return ctx.bindings?.hotkeys.find((hotkey) => hotkey.scope === "global" && hotkey.action === action);
}

export function globalKeyOf(action: string): string {
  const hotkey = globalHotkeyOf(action);
  return hotkey ? keyOf(hotkey.id) : "";
}

export function hotkeyLine(id: string): string {
  const key = keyOf(id);
  return key ? "\nHotkey: " + key : "";
}

export function drawTabHotkeyLine(drawTabId: string, globalId: string | null): string {
  const tabKey = keyOf(drawTabId);
  const globalKey = globalId ? keyOf(globalId) : "";
  if (!tabKey) return globalId ? hotkeyLine(globalId) : "";
  return `\nHotkey: ${tabKey} (Draw tab only)` + (globalKey ? " / " + globalKey : "");
}
