import { parseJson } from "../../core/logic.ts";
import { type SavedHotkeys, savedHotkeysOf } from "../bindings/hotkey-bindings.ts";
import { ctx } from "../context.ts";
import { render } from "../view/renderpage.ts";
import { clearStatus, toast } from "../view/tooltips.ts";
import { FRESH_MOST, type HotkeyMode, KEY_SETTINGS, KEY_STATE } from "./hotkeytables.ts";

export interface Settings {
  v: number;
  showName: boolean;
  showIcon: boolean;
  showCounter: boolean;
  tooltips: boolean;
  jingles: boolean;
  legacyJingles: boolean;
  uiSounds: boolean;
  drawOnLoad: boolean;
  newRoundOnVisit: boolean;
  fresh: boolean;
  freshN: number;
  showRemaining: boolean;
  autoReset: boolean;
  autoToggle: boolean;
  hotkeys: HotkeyMode;
  charKeys: boolean;
  resetOnStart?: boolean;
  keyBindings?: SavedHotkeys;
}

export type BoolSetting = { [K in keyof Settings]-?: Settings[K] extends boolean ? K : never }[keyof Settings];

type Loose = Record<string, unknown>;

let storageWarned = false;

function desktopDefaults(): Partial<Settings> {
  return { drawOnLoad: true, legacyJingles: false, fresh: false, resetOnStart: false, keyBindings: {} };
}

export function defaultSettings(): Settings {
  const desktop = ctx.platform.kind === "desktop";
  return {
    v: 1,
    showName: true, showIcon: true, showCounter: true, tooltips: true,
    jingles: true, legacyJingles: true, uiSounds: true,
    drawOnLoad: false, newRoundOnVisit: false,
    fresh: true, freshN: FRESH_MOST,
    showRemaining: true, autoReset: false, autoToggle: false,
    hotkeys: desktop ? "desktop" : "browser", charKeys: true,
    ...(desktop ? desktopDefaults() : {}),
  };
}

export function isBoolSetting(name: string): name is BoolSetting {
  return typeof (defaultSettings() as unknown as Loose)[name] === "boolean";
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function copySaved(from: Loose, to: Loose, keys: string[]): void {
  for (const k of keys) {
    if (k !== "v" && typeof from[k] === typeof to[k]) to[k] = from[k];
  }
}

export function parseSettings(raw: string | null): Settings {
  const defaults = defaultSettings();
  const s = { ...defaults };
  const data = parseJson(raw);
  if (!data || typeof data !== "object") return s;
  const from = data as Loose;
  copySaved(from, s as unknown as Loose, Object.keys(defaults));
  if (s.hotkeys !== "desktop" && s.hotkeys !== "browser") s.hotkeys = defaults.hotkeys;
  if (!Number.isInteger(s.freshN) || s.freshN < 1) s.freshN = 1;
  if (s.keyBindings !== undefined) s.keyBindings = savedHotkeysOf(from.keyBindings);
  return s;
}

export function saveState(): void {
  if (!storageSet(KEY_STATE, JSON.stringify(ctx.logic.serialiseState(ctx.state))) && !storageWarned) {
    storageWarned = true;
    toast("This browser isn't letting the page save");
  }
}

export function saveSettings(): void {
  storageSet(KEY_SETTINGS, JSON.stringify(ctx.settings));
}

export function commit(): void {
  ctx.ui.flash = null;
  if (ctx.simple) clearStatus();
  saveState();
  render();
}
