import { TAB_SCOPES } from "../bindings/hotkey-table.ts";
import { nameOfKeyPress } from "../bindings/keystroke.ts";
import { ctx } from "../context.ts";

const MIN_DRAW_INTERVAL_MS = 100;
const CONTROL_KEYS = ["Space", "Enter"];

let lastDrawAt = -MIN_DRAW_INTERVAL_MS;

export function boundAction(e: KeyboardEvent): string | null {
  if (!ctx.bindings) return null;
  return ctx.bindings.actionFor(nameOfKeyPress(e), TAB_SCOPES[ctx.ui.tab]);
}

export function pressesControl(e: KeyboardEvent): boolean {
  return CONTROL_KEYS.includes(nameOfKeyPress(e));
}

export function withinDrawRate(lastAt: number, now: number): boolean {
  return now - lastAt >= MIN_DRAW_INTERVAL_MS;
}

export function mayRun(action: string, e: KeyboardEvent): boolean {
  if (action !== "draw") return !e.repeat;
  if (!withinDrawRate(lastDrawAt, e.timeStamp)) return false;
  lastDrawAt = e.timeStamp;
  return true;
}
