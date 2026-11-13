import type { Logic } from "../../core/logic.ts";
import { ctx } from "../context.ts";
import { globalKeyOf } from "../desktopui/boundkeys.ts";

export const DLC_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
export const EDITION_KEYS = ["Q", "W", "E"];
export const GRID_COLS = [10, 112, 214, 316, 418];
export const CIV_ATLAS_COLS = 8;
export const DLC_ATLAS_COLS = 6;

export const VERSION = "2.0.0";
export const PRESET_MAX_BYTES = 65536;
export const UNDO_CAP = 200;
export const KEY_SETTINGS = "frcp.settings";
export const KEY_STATE = "frcp.state";
export const KEY_QUICK = "frcp.quicksave";
export const FRESH_MOST = 1000;

export type HotkeyMode = "desktop" | "browser";
export type KeyPair = [key: string, action: string];

export const GLOBAL_KEYS: Record<HotkeyMode, KeyPair[]> = {
  desktop: [
    ["Tab", "cycleTab"], ["1", "tab0"], ["2", "tab1"], ["3", "tab2"],
    ["F1", "options"], ["F2", "hotkeys"], ["F3", "about"], ["F4", "techtree"],
    ["F5", "quicksave"], ["F9", "quickload"],
    ["Ctrl+S", "savePreset"], ["Ctrl+R", "loadPreset"], ["P", "copyLink"], ["U", "openLink"], ["Ctrl+F", "lobby"],
    ["Ctrl+Z", "undo"], ["Ctrl+X", "redo"],
    ["Z", "quizName"], ["X", "quizIcon"], ["C", "quizCounter"], ["V", "quizJingles"], ["B", "quizUi"],
  ],
  browser: [
    ["1", "tab0"], ["2", "tab1"], ["3", "tab2"],
    ["O", "options"], ["F2", "hotkeys"], ["?", "hotkeys"], ["I", "about"], ["F4", "techtree"],
    ["F8", "quicksave"], ["F9", "quickload"],
    ["P", "copyLink"], ["U", "openLink"], ["M", "lobby"],
    ["Ctrl+Z", "undo"], ["Ctrl+X", "redo"],
    ["Z", "quizName"], ["X", "quizIcon"], ["C", "quizCounter"], ["V", "quizJingles"], ["B", "quizUi"],
  ],
};

const SIMPLE_DROPPED = new Set(["quizJingles", "quizUi", "quizIcon"]);

const SIMPLE_ACTION_TEXT: Record<string, string> = {
  techtree: "Open Tech Tree in a new tab",
  undo: "Undo the last change",
  redo: "Redo the last undone change",
};

const DESKTOP_ACTION_TEXT: Record<string, string> = {
  undo: "Undraw", redo: "Redraw", clearLog: "Clear drawn log",
  quit: "Exit", sustainability: "Open Sustainability App", history: "Open History",
};

export function buildTabKeys(editions: string[]): KeyPair[][] {
  return [
    [["Space", "draw"], ["Enter", "reset"], ["Q", "options"], ["T", "techtree"]],
    [["Space", "draw"], ["Enter", "reset"], ["Q", "clearLog"], ["W", "toggleRemaining"]],
    [
      ["Space", "enableAll"], ["Enter", "disableAll"],
      ...editions.map((ed, i): KeyPair => [EDITION_KEYS[i], "ed" + ed]),
      ["R", "autoToggle"], ["T", "autoReset"],
      ...DLC_KEYS.map((k, i): KeyPair => [k, "dlc" + i]),
    ],
  ];
}

export function buildActionText(logic: Logic, simple: boolean, desktop = false): Record<string, string> {
  return {
    cycleTab: "Cycle tabs", tab0: "Go to Draw Civ tab", tab1: "Go to Log tab", tab2: "Go to Civ Pool tab",
    options: "Open Options", hotkeys: "Open Hotkeys", about: "Open About", techtree: "Open Tech Tree",
    quicksave: "Quicksave", quickload: "Quickload", savePreset: "Save preset", loadPreset: "Load preset",
    copyLink: "Copy share link", openLink: "Open a share link",
    lobby: "Join Lobby", undo: "Undo a draw or reset", redo: "Redo",
    quizName: "Toggle civ name", quizIcon: "Toggle civ icon", quizCounter: "Toggle round counter",
    quizJingles: "Toggle civ jingles", quizUi: "Toggle UI sounds",
    draw: "Draw civ", reset: "Reset drawn civs", clearLog: "Clear past rounds",
    toggleRemaining: "Toggle remaining log",
    enableAll: "Enable all civs", disableAll: "Disable all civs",
    ...Object.fromEntries(logic.EDITIONS.map((ed) => ["ed" + ed, logic.EDITION_INFO[ed].short])),
    autoToggle: "Auto-toggle older civs", autoReset: "Auto-reset on change",
    ...(simple ? SIMPLE_ACTION_TEXT : {}),
    ...(desktop ? DESKTOP_ACTION_TEXT : {}),
  };
}

export function hotkeyMode(): HotkeyMode {
  return ctx.simple ? "browser" : ctx.settings.hotkeys;
}

function isCharKey(name: string): boolean {
  return /^(Shift\+)?([A-Z0-9?]|Space)$/.test(name);
}

export function activeKeys(pairs: KeyPair[]): KeyPair[] {
  if (!ctx.simple) return pairs;
  return pairs.filter(([key, act]) => !SIMPLE_DROPPED.has(act) && (ctx.settings.charKeys || !isCharKey(key)));
}

export function keyLabel(action: string): string {
  if (ctx.bindings) return globalKeyOf(action);
  const pair = activeKeys(GLOBAL_KEYS[hotkeyMode()]).find(([, a]) => a === action);
  return pair ? pair[0] : "";
}

export function dlcCell(dlc: string): number {
  return 3 * ctx.logic.EDITIONS.length + ctx.dlcIcons.indexOf(dlc);
}
