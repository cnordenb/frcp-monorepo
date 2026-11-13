import type { Civ } from "../../core/logic.ts";
import { ctx } from "../context.ts";
import { $ } from "../view/domhelpers.ts";
import { drawTabHotkeyLine, hotkeyLine } from "./boundkeys.ts";

const HISTORY_TIP = "Opens the game's History info";
const SUSTAINABILITY_TIP = "Opens aoe2vils.net to calculate villagers required for sustainable production";
const LOG_TAB = 1;

const TIP_HOTKEYS: [id: string, hotkey: string][] = [
  ["clearLogBtn", "LogTabClearDrawnLog"], ["showRemainingLabel", "LogTabToggleRemainingLog"],
  ["autoToggleLabel", "CivPoolTabAutoToggle"], ["autoResetLabel", "CivPoolTabAutoReset"],
  ["enableAllBtn", "CivPoolTabEnableAll"], ["disableAllBtn", "CivPoolTabDisableAll"],
  ["shareBtn", "CopyShareLink"],
];

function setTip(el: HTMLElement, line: string, text = el.dataset.tip ?? ""): void {
  const tip = text.replace(/\nHotkey:.*$/s, "") + line;
  if (el.dataset.tip !== tip) el.dataset.tip = tip;
}

function showPoolKeys(): void {
  ctx.els.editionButtons.forEach((button, place) => setTip(button, hotkeyLine(`CivPoolTabEdition${place + 1}`)));
  for (const group of ctx.els.panel.querySelectorAll("div[data-edition]")) {
    const toggles = group.querySelectorAll<HTMLElement>("label[data-dlc]");
    toggles.forEach((toggle, slot) => setTip(toggle, hotkeyLine(`CivPoolTabDlc${slot + 1}`)));
  }
}

export function showBoundKeys(cur: Civ | null): void {
  const onLog = ctx.ui.tab === LOG_TAB;
  const civ = cur ? " for the " + cur.name : "";
  for (const [id, hotkey] of TIP_HOTKEYS) setTip($(id), hotkeyLine(hotkey));
  setTip($("drawBtn"), hotkeyLine(onLog ? "LogTabDrawCiv" : "DrawTabDrawCiv"));
  setTip($("resetBtn"), hotkeyLine(onLog ? "LogTabReset" : "DrawTabReset"));
  setTip($("optionsBig"), drawTabHotkeyLine("DrawTabOpenOptions", "OpenOptions"));
  setTip($("techBtn"), drawTabHotkeyLine("DrawTabOpenTechTree", "OpenTechTree"));
  setTip($("sustainBtn"), drawTabHotkeyLine("DrawTabOpenSustainabilityApp", "OpenSustainabilityApp"),
    SUSTAINABILITY_TIP);
  setTip($("historyBtn"), drawTabHotkeyLine("DrawTabOpenHistory", null), HISTORY_TIP + civ);
  showPoolKeys();
}
