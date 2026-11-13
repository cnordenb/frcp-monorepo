import type { Civ } from "../../core/logic.ts";
import { dlcIds } from "../actions/civpool.ts";
import { ctx } from "../context.ts";
import { showBoundKeys } from "../desktopui/desktoptips.ts";
import { currentCiv, drawnCount, isOn, poolIds, remainingIds } from "../model/currentstate.ts";
import { CIV_ATLAS_COLS, keyLabel } from "../model/hotkeytables.ts";
import { loadAhead } from "../sound/loadahead.ts";
import { $, atlasCell, h, setCell, setIcon, setText } from "./domhelpers.ts";
import { logBars, paintLogBar } from "./logbars.ts";
import { civBoxes, dlcBoxes } from "./poolcontrols.ts";
import { describeTips, tipState, tipText } from "./tooltips.ts";

type LogRow = [id: number, text: string];

const logKeys = new Map<HTMLElement, string>();

function drawnRows(): LogRow[][] {
  const { CIVS } = ctx.logic;
  const rounds: LogRow[][] = [];
  for (let r = ctx.state.log.length - 1; r >= 0; r--) {
    const entries = ctx.state.log[r];
    if (!entries.length) continue;
    const rows = entries.map(([id, k, n]): LogRow => [id, k ? `${CIVS[id].name} (${k}/${n})` : CIVS[id].name]);
    rounds.push(rows.reverse());
  }
  return rounds;
}

function logRow([id, text]: LogRow): HTMLElement {
  const icon = ctx.simple ? "" : atlasCell("log-icon sprite civ-cell", id, CIV_ATLAS_COLS);
  return h(ctx.simple ? "li" : "div", { className: "log-row" }, icon, text);
}

function fillLog(log: HTMLElement, rounds: LogRow[][]): void {
  const key = JSON.stringify(rounds);
  if (logKeys.get(log) === key) return;
  logKeys.set(log, key);
  const tag = ctx.simple ? "ul" : "div";
  log.replaceChildren(...rounds.map((rows) => h(tag, { className: "log-round" }, ...rows.map(logRow))));
}

function renderTabs(): void {
  const { els, ui } = ctx;
  els.client.dataset.tab = String(ui.tab);
  els.tabs.forEach((t, i) => {
    t.setAttribute("aria-selected", String(i === ui.tab));
    t.tabIndex = i === ui.tab ? 0 : -1;
  });
  els.panel.setAttribute("aria-labelledby", "tab-" + ui.tab);
}

function renderDrawTab(cur: Civ | null, drawn: number, n: number): void {
  const { els, settings, ui } = ctx;
  els.civIcon.hidden = !settings.showIcon;
  setIcon(els.civIcon, cur ? cur.id : ctx.randomCell);
  els.civIcon.setAttribute("aria-label", cur ? `${cur.name}: play the jingle` : "Random: play the jingle");
  if (ctx.simple && !ui.flash && !cur) {
    if (!els.civName.querySelector(".sr-only")) {
      els.civName.replaceChildren(
        h("span", { "aria-hidden": "true" }, "?"), h("span", { className: "sr-only" }, "No civ drawn yet"));
    }
  } else {
    setText(els.civName, ui.flash || (cur ? cur.name : "?"));
  }
  els.civName.hidden = !settings.showName;
  setText(els.counter, ctx.simple ? `Drawn: ${drawn}/${n}` : `${drawn}/${n}`);
  els.counter.hidden = !settings.showCounter;
}

function renderLogTab(drawn: number, n: number): void {
  const { els, settings } = ctx;
  const left = remainingIds();
  setText(els.drawnCount, `Drawn: ${drawn}/${n}`);
  setText(els.remainingCount, `Remaining: ${left.length}/${n}`);
  fillLog(els.drawnLog, drawnRows());
  const leftSet = new Set(left);
  const rows = ctx.logic.DISPLAY_ORDER.filter((c) => leftSet.has(c.id)).map((c): LogRow => [c.id, c.name]);
  fillLog(els.remainingLog, [rows]);
  els.showRemaining.checked = settings.showRemaining;
  els.remainingLog.hidden = !settings.showRemaining;
  for (const log of logBars.keys()) paintLogBar(log);
}

function renderPoolTab(n: number): void {
  const { els, settings } = ctx;
  const { CIVS, EDITIONS, EDITION_INFO, editionTotal, inEdition } = ctx.logic;
  const ed = ctx.state.edition;
  const info = EDITION_INFO[ed];
  for (const b of els.editionButtons) b.setAttribute("aria-pressed", String(b.dataset.pick === ed));
  setCell(els.edIcon, EDITIONS.indexOf(ed), 1);
  const label = info.url ? `${info.series}: ${info.name} on Steam` : `About ${info.name}`;
  els.edIcon.setAttribute("aria-label", label);
  setText(els.enabledCount, `Enabled: ${n}/${editionTotal(ed)}`);
  els.autoToggle.checked = settings.autoToggle;
  els.autoReset.checked = settings.autoReset;
  for (const c of CIVS) {
    civBoxes[c.id].label.hidden = !inEdition(c, ed);
    civBoxes[c.id].input.checked = isOn(c.id);
  }
  for (const g of els.panel.querySelectorAll<HTMLElement>("div[data-edition]")) g.hidden = g.dataset.edition !== ed;
  for (const dlc of info.dlcToggles) dlcBoxes[dlc].checked = dlcIds(dlc).some(isOn);
}

function renderTips(cur: Civ | null): void {
  const civ = cur ? " for the " + cur.name : "";
  const copyKey = keyLabel("copyLink");
  $("optionsBig").dataset.tip = `Opens options\nHotkey: Q / ${keyLabel("options")}`;
  $("techBtn").dataset.tip = `Opens the tech tree${civ}\nHotkey: T (Draw tab only) / ${keyLabel("techtree")}`;
  $("shareBtn").dataset.tip = ctx.simple
    ? `Copies a link with this civ pool and this round's draws\nHotkey: ${copyKey}`
    : `Copies a share link with the currently selected civ pool and this round's draws\nHotkey: ${copyKey}`;
  for (const k of document.querySelectorAll<HTMLElement>("kbd[data-key]")) setText(k, keyLabel(k.dataset.key ?? ""));
  if (ctx.bindings) showBoundKeys(cur);
  if (tipState.target) setText(ctx.els.tip, tipText(tipState.target));
  if (ctx.simple) describeTips();
}

export function render(): void {
  const n = poolIds().length;
  const drawn = drawnCount();
  const cur = currentCiv();
  renderTabs();
  renderDrawTab(cur, drawn, n);
  renderLogTab(drawn, n);
  renderPoolTab(n);
  renderTips(cur);
  loadAhead();
}
