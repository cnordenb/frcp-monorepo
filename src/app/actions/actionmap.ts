import { type Actions, ctx } from "../context.ts";
import { openAbout, openHelp, openLinkDialog, openLobby, openShare } from "../dialogs/dialogbox.ts";
import { openHotkeys } from "../dialogs/hotkeysdialog.ts";
import { openOptions } from "../dialogs/optionsdialog.ts";
import { DLC_KEYS } from "../model/hotkeytables.ts";
import {
  disableAll, enableAll, setEdition, toggleAutoReset, toggleAutoToggle, toggleDlcSlot,
} from "./civpool.ts";
import { clearLog, draw, redo, reset, undo } from "./drawing.ts";
import { openTechTree } from "./linksout.ts";
import { loadPreset, quickload, quicksave, savePreset } from "./savefiles.ts";
import { copyShareLink } from "./sharelinks.ts";
import { setJingles, setTab, setUiSounds, toggleSetting } from "./toggles.ts";

export function buildActions(): Actions {
  const actions: Actions = {
    cycleTab: () => setTab((ctx.ui.tab + 1) % 3),
    tab0: () => setTab(0), tab1: () => setTab(1), tab2: () => setTab(2),
    options: openOptions, hotkeys: openHotkeys, about: openAbout, help: openHelp, techtree: openTechTree,
    quicksave, quickload, savePreset, loadPreset,
    copyLink: () => copyShareLink(), share: openShare, openLink: openLinkDialog, lobby: openLobby,
    undo, redo,
    quizName: () => toggleSetting("showName"),
    quizIcon: () => toggleSetting("showIcon"),
    quizCounter: () => toggleSetting("showCounter"),
    quizJingles: () => setJingles(!ctx.settings.jingles),
    quizUi: () => setUiSounds(!ctx.settings.uiSounds),
    draw: () => draw(), reset, clearLog, toggleRemaining: () => toggleSetting("showRemaining"),
    enableAll, disableAll,
    autoToggle: toggleAutoToggle, autoReset: toggleAutoReset,
  };
  ctx.logic.EDITIONS.forEach((ed) => {
    actions["ed" + ed] = () => setEdition(ed);
  });
  DLC_KEYS.forEach((_, i) => {
    actions["dlc" + i] = () => toggleDlcSlot(i);
  });
  return actions;
}

export function runAction(name: string): void {
  const action = ctx.actions[name];
  if (action) action();
}
