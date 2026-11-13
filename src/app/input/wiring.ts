import {
  disableAll, enableAll, setEdition, toggleAutoReset, toggleAutoToggle,
} from "../actions/civpool.ts";
import { clearHistory, clearLog, draw, reset } from "../actions/drawing.ts";
import { openEditionPage, openTechTree } from "../actions/linksout.ts";
import { loadPresetFile } from "../actions/savefiles.ts";
import { copyShareLink, handleLinkCode } from "../actions/sharelinks.ts";
import { setTab, toggleSetting } from "../actions/toggles.ts";
import { ctx } from "../context.ts";
import { openOptions, syncOptions } from "../dialogs/optionsdialog.ts";
import { currentId } from "../model/currentstate.ts";
import { KEY_SETTINGS, KEY_STATE } from "../model/hotkeytables.ts";
import { parseSettings, storageGet } from "../model/settingsstore.ts";
import { staticTips } from "../model/tiptexts.ts";
import { jingle, onPointerOver, resetHandCursor, warmUp } from "../sound/soundplayer.ts";
import { $ } from "../view/domhelpers.ts";
import { logBars, paintLogBar } from "../view/logbars.ts";
import { bindMenuKeys, fitMenu } from "../view/pagemenus.ts";
import { render } from "../view/renderpage.ts";
import { bindSimpleTips, hideTip, moveTip, tipState } from "../view/tooltips.ts";
import { bindClicks, bindMenus } from "./clickwiring.ts";
import { bindDialogs } from "./formwiring.ts";
import { onKeyDown, onKeyUp } from "./keyboard.ts";
import { bindSwipes } from "./swipes.ts";

function bindTabs(): void {
  ctx.els.tabs.forEach((t, i) => {
    t.addEventListener("click", () => setTab(i));
    t.addEventListener("keydown", (e) => {
      const moves: Record<string, number | undefined> = {
        ArrowRight: (i + 1) % 3, ArrowLeft: (i + 2) % 3, ...(ctx.simple ? { Home: 0, End: 2 } : {}),
      };
      const next = moves[e.key];
      if (next === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      setTab(next);
      ctx.els.tabs[next].focus();
    });
  });
}

function bindButtons(): void {
  const { els } = ctx;
  const presetFile = $<HTMLInputElement>("presetFile");
  $("closeBtn").addEventListener("click", () => ctx.platform.quit());
  $("optionsBig").addEventListener("click", openOptions);
  $("civIcon").addEventListener("click", () => jingle(currentId()));
  $("drawBtn").addEventListener("click", () => draw());
  $("resetBtn").addEventListener("click", reset);
  $("techBtn").addEventListener("click", openTechTree);
  $("shareBtn").addEventListener("click", () => copyShareLink(true));
  $("poolShareBtn").addEventListener("click", () => copyShareLink(false));
  $("clearLogBtn").addEventListener("click", clearLog);
  presetFile.addEventListener("change", () => {
    const file = presetFile.files ? presetFile.files[0] : undefined;
    if (file) void loadPresetFile(file);
  });
  els.showRemaining.addEventListener("change", () => toggleSetting("showRemaining"));
  for (const b of els.editionButtons) b.addEventListener("click", () => setEdition(b.dataset.pick ?? ""));
  $("editionIcon").addEventListener("click", openEditionPage);
  els.autoToggle.addEventListener("change", toggleAutoToggle);
  els.autoReset.addEventListener("change", toggleAutoReset);
  $("enableAllBtn").addEventListener("click", enableAll);
  $("disableAllBtn").addEventListener("click", disableAll);
  for (const [id, tip] of Object.entries(staticTips(ctx.simple))) $(id).dataset.tip = tip;
}

function onStorage(e: StorageEvent): void {
  if (e.key === KEY_STATE || e.key === null) {
    ctx.state = ctx.logic.parseState(storageGet(KEY_STATE)) || ctx.logic.emptyState();
    clearHistory();
  }
  if (e.key === KEY_SETTINGS || e.key === null) ctx.settings = parseSettings(storageGet(KEY_SETTINGS));
  render();
  syncOptions();
}

function bindPage(): void {
  window.addEventListener("resize", () => {
    for (const log of logBars.keys()) paintLogBar(log);
    fitMenu();
  });
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointermove", moveTip);
  document.addEventListener("pointerover", onPointerOver);
  document.documentElement.addEventListener("mouseleave", resetHandCursor);
  document.documentElement.addEventListener("mouseleave", () => {
    if (!ctx.simple || tipState.by === "mouse") hideTip();
  });
  document.addEventListener("pointerdown", warmUp, { capture: true, once: true });
  document.addEventListener("keydown", warmUp, { capture: true, once: true });
  ctx.platform.onLink(handleLinkCode);
  window.addEventListener("storage", onStorage);
}

export function bind(): void {
  bindTabs();
  bindButtons();
  bindMenus();
  bindClicks();
  bindDialogs();
  if (ctx.simple) {
    bindMenuKeys();
    bindSimpleTips();
  } else {
    bindSwipes();
  }
  bindPage();
}
