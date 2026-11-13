import { runAction } from "../actions/actionmap.ts";
import { ctx } from "../context.ts";
import { anyDialogOpen } from "../dialogs/dialogbox.ts";
import { GLOBAL_KEYS, activeKeys, hotkeyMode } from "../model/hotkeytables.ts";
import { boundAction, mayRun, pressesControl } from "./desktopkeys.ts";
import { closeMenus, currentMenu } from "../view/pagemenus.ts";
import { hideTip } from "../view/tooltips.ts";

const NOT_TYPED_IN = ["checkbox", "radio", "range", "button", "submit", "reset"];
const NAMED_KEYS = ["Enter", "Tab", "Escape"];

let swallowKeyup: string | null = null;

function namedKey(e: KeyboardEvent): string | null {
  if (/^(Digit|Numpad)[0-9]$/.test(e.code)) return e.code.slice(-1);
  if (e.key === " " || e.code === "Space") return "Space";
  if (NAMED_KEYS.includes(e.key) || /^F\d\d?$/.test(e.key)) return e.key;
  return null;
}

function letterKey(e: KeyboardEvent): string | null {
  if (/^[a-z]$/i.test(e.key)) return e.key.toUpperCase();
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3);
  return null;
}

function keyName(e: KeyboardEvent): string | null {
  const named = namedKey(e);
  if (!named && e.key === "?") return e.ctrlKey ? null : "?";
  const k = named ?? letterKey(e);
  if (!k) return null;
  return (e.ctrlKey ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + k;
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  if ((el instanceof HTMLElement && el.isContentEditable) || el.tagName === "SELECT") return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  return el instanceof HTMLInputElement && !NOT_TYPED_IN.includes(el.type);
}

function isControl(el: EventTarget | null): boolean {
  return el instanceof Element && el.closest("button, a[href], input, select, textarea, [role='tab']") !== null;
}

function menuTakesKey(e: KeyboardEvent): boolean {
  const menu = currentMenu();
  if (!menu) return false;
  if (ctx.simple && e.target instanceof Node && menu.contains(e.target)) return true;
  closeMenus();
  if (e.key !== "Escape") return false;
  e.preventDefault();
  return true;
}

function hotkeyAction(name: string): string | null {
  const tabPair = activeKeys(ctx.tabKeys[ctx.ui.tab]).find(([k]) => k === name);
  const pair = tabPair || activeKeys(GLOBAL_KEYS[hotkeyMode()]).find(([k]) => k === name);
  return pair ? pair[1] : null;
}

function onDesktopKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape" && !ctx.els.tip.hidden) {
    hideTip();
    return;
  }
  if (isTyping(e.target)) return;
  const action = boundAction(e);
  if (!action) return;
  e.preventDefault();
  if (pressesControl(e)) swallowKeyup = e.code;
  if (!mayRun(action, e)) return;
  hideTip();
  runAction(action);
}

function fixedHotkey(e: KeyboardEvent): { action: string; presses: boolean } | null {
  if (e.altKey || e.metaKey || isTyping(e.target)) return null;
  const name = keyName(e);
  const action = name ? hotkeyAction(name) : null;
  if (!action) return null;
  const presses = name === "Space" || name === "Enter";
  if (hotkeyMode() === "browser" && presses && isControl(e.target)) return null;
  return { action, presses };
}

function onFixedKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    hideTip();
    return;
  }
  const hotkey = fixedHotkey(e);
  if (!hotkey) return;
  e.preventDefault();
  if (hotkey.presses) swallowKeyup = e.code;
  if (e.repeat) return;
  hideTip();
  runAction(hotkey.action);
}

export function onKeyDown(e: KeyboardEvent): void {
  if (anyDialogOpen() || menuTakesKey(e)) return;
  if (ctx.bindings) onDesktopKeyDown(e);
  else onFixedKeyDown(e);
}

export function onKeyUp(e: KeyboardEvent): void {
  if (swallowKeyup && e.code === swallowKeyup) {
    e.preventDefault();
    swallowKeyup = null;
  }
}
