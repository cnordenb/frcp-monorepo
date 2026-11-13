export const HOTKEY_SCOPES = ["global", "draw", "log", "pool"] as const;
export type HotkeyScope = (typeof HOTKEY_SCOPES)[number];
export type TabScope = Exclude<HotkeyScope, "global">;
export const TAB_SCOPES: readonly TabScope[] = ["draw", "log", "pool"];

export interface HotkeyCatalog {
  readonly editions: readonly string[];
  readonly dlcSlots: number;
}

export interface Hotkey {
  readonly id: string;
  readonly scope: HotkeyScope;
  readonly action: string;
  readonly defaultKey: string;
  readonly used: boolean;
}

type HotkeyRow = readonly [id: string, action: string, defaultKey: string];

const GLOBAL_ROWS: readonly HotkeyRow[] = [
  ["CycleTabs", "cycleTab", "Tab"],
  ["ShowDrawTab", "tab0", "1"],
  ["ShowLogTab", "tab1", "2"],
  ["ShowCivPoolTab", "tab2", "3"],
  ["OpenOptions", "options", "F1"],
  ["OpenHotkeys", "hotkeys", "F2"],
  ["OpenAbout", "about", "F3"],
  ["OpenTechTree", "techtree", "F4"],
  ["Quicksave", "quicksave", "F5"],
  ["Quickload", "quickload", "F9"],
  ["SavePreset", "savePreset", "Ctrl+S"],
  ["LoadPreset", "loadPreset", "Ctrl+R"],
  ["CopyShareLink", "copyLink", "P"],
  ["OpenShareLink", "openLink", "U"],
  ["JoinLobby", "lobby", "Ctrl+F"],
  ["Undo", "undo", "Ctrl+Z"],
  ["Redraw", "redo", "Ctrl+X"],
  ["OpenSustainabilityApp", "sustainability", "Ctrl+T"],
  ["ToggleCivName", "quizName", "Z"],
  ["ToggleCivIcon", "quizIcon", "X"],
  ["ToggleRoundCounter", "quizCounter", "C"],
  ["ToggleCivJingles", "quizJingles", "V"],
  ["ToggleUISounds", "quizUi", "B"],
  ["Exit", "quit", "Esc"],
];

const DRAW_ROWS: readonly HotkeyRow[] = [
  ["DrawTabDrawCiv", "draw", "Space"],
  ["DrawTabReset", "reset", "Enter"],
  ["DrawTabOpenOptions", "options", "Q"],
  ["DrawTabOpenSustainabilityApp", "sustainability", "R"],
  ["DrawTabOpenTechTree", "techtree", "T"],
  ["DrawTabOpenHistory", "history", "H"],
];

const LOG_ROWS: readonly HotkeyRow[] = [
  ["LogTabDrawCiv", "draw", "Space"],
  ["LogTabReset", "reset", "Enter"],
  ["LogTabClearDrawnLog", "clearLog", "Q"],
  ["LogTabToggleRemainingLog", "toggleRemaining", "W"],
];

const POOL_ALL_ROWS: readonly HotkeyRow[] = [
  ["CivPoolTabEnableAll", "enableAll", "Space"],
  ["CivPoolTabDisableAll", "disableAll", "Enter"],
];

const POOL_AUTO_ROWS: readonly HotkeyRow[] = [
  ["CivPoolTabAutoToggle", "autoToggle", "R"],
  ["CivPoolTabAutoReset", "autoReset", "T"],
];

const EDITION_KEYS = ["Q", "W", "E"];
const DLC_SLOT_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];

function alwaysUsed(scope: HotkeyScope, rows: readonly HotkeyRow[]): Hotkey[] {
  return rows.map(([id, action, defaultKey]) => ({ id, scope, action, defaultKey, used: true }));
}

function editionHotkeys(editions: readonly string[]): Hotkey[] {
  return EDITION_KEYS.map((defaultKey, place) => ({
    id: `CivPoolTabEdition${place + 1}`,
    scope: "pool",
    action: place < editions.length ? `ed${editions[place]}` : "",
    defaultKey,
    used: place < editions.length,
  }));
}

function dlcSlotHotkeys(dlcSlots: number): Hotkey[] {
  return DLC_SLOT_KEYS.map((defaultKey, slot) => ({
    id: `CivPoolTabDlc${slot + 1}`,
    scope: "pool",
    action: `dlc${slot}`,
    defaultKey,
    used: slot < dlcSlots,
  }));
}

export function hotkeysOf(catalog: HotkeyCatalog): readonly Hotkey[] {
  return [
    ...alwaysUsed("global", GLOBAL_ROWS),
    ...alwaysUsed("draw", DRAW_ROWS),
    ...alwaysUsed("log", LOG_ROWS),
    ...alwaysUsed("pool", POOL_ALL_ROWS),
    ...editionHotkeys(catalog.editions),
    ...alwaysUsed("pool", POOL_AUTO_ROWS),
    ...dlcSlotHotkeys(catalog.dlcSlots),
  ];
}

export function scopesOverlap(first: HotkeyScope, second: HotkeyScope): boolean {
  return first === second || first === "global" || second === "global";
}
