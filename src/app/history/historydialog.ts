import type { Civ } from "../../core/logic.ts";
import { civIconUrl, siteRoot } from "../assets.ts";
import { ctx } from "../context.ts";
import { closeDialog, showDialog } from "../dialogs/dialogbox.ts";
import { currentCiv, drawnIds, isOn } from "../model/currentstate.ts";
import { hoverSound, jingle, sfx, stopSound } from "../sound/soundplayer.ts";
import { h } from "../view/domhelpers.ts";
import { buildLogBar, paintLogBar, scrollInstantly } from "../view/logbars.ts";
import { HISTORY_NOT_FOUND, addedText, firstMatch, historyUrl, readableText, yesNo } from "./historytext.ts";

interface HistoryParts {
  dialog: HTMLDialogElement;
  search: HTMLInputElement;
  select: HTMLSelectElement;
  icon: HTMLImageElement;
  added: HTMLElement;
  enabledLabel: HTMLElement;
  enabled: HTMLElement;
  drawnLabel: HTMLElement;
  drawn: HTMLElement;
  poolInfo: HTMLInputElement;
  playJingle: HTMLInputElement;
  jingleRow: HTMLElement;
  text: HTMLElement;
}

const ICON_SIZE = 52;

const texts = new Map<string, string>();
let parts: HistoryParts | null = null;
let shown: Civ | null = null;
let typedLength = 0;

function showText(p: HistoryParts, text: string): void {
  p.text.textContent = text;
  p.text.scrollTop = 0;
  paintLogBar(p.text);
}

async function fetchText(file: string): Promise<string | null> {
  try {
    const response = await fetch(historyUrl(siteRoot(), file));
    if (!response.ok) return null;
    return readableText(await response.text()) || null;
  } catch {
    return null;
  }
}

async function showHistory(p: HistoryParts, civ: Civ): Promise<void> {
  const cached = texts.get(civ.file);
  if (cached !== undefined) {
    showText(p, cached);
    return;
  }
  showText(p, "");
  const text = await fetchText(civ.file);
  if (text !== null) texts.set(civ.file, text);
  if (shown === civ) showText(p, text ?? HISTORY_NOT_FOUND);
}

function showPoolInfo(p: HistoryParts): void {
  const civ = p.poolInfo.checked ? shown : null;
  p.enabledLabel.textContent = civ ? "Enabled:" : "";
  p.enabled.textContent = civ ? yesNo(isOn(civ.id)) : "";
  p.drawnLabel.textContent = civ ? "Drawn:" : "";
  p.drawn.textContent = civ ? yesNo(drawnIds().includes(civ.id)) : "";
}

function showCiv(p: HistoryParts, civ: Civ): void {
  shown = civ;
  p.select.value = String(civ.id);
  p.icon.src = civIconUrl(civ.file);
  p.added.textContent = addedText(ctx.logic.DLCS[civ.dlc]);
  showPoolInfo(p);
  void showHistory(p, civ);
}

function chooseCiv(p: HistoryParts, civ: Civ): void {
  if (civ !== shown) {
    if (p.playJingle.checked) jingle(civ.id);
    else sfx("view");
  }
  showCiv(p, civ);
}

function onSearch(p: HistoryParts): void {
  const typed = p.search.value;
  const grew = typed.length > typedLength;
  typedLength = typed.length;
  if (!grew) return;
  const civs = ctx.logic.DISPLAY_ORDER;
  const at = firstMatch(civs.map((civ) => civ.name), typed);
  if (at >= 0) chooseCiv(p, civs[at]);
}

function clearSearch(p: HistoryParts): void {
  p.search.value = "";
  typedLength = 0;
}

function isOpen(select: HTMLSelectElement): boolean {
  try {
    return select.matches(":open");
  } catch {
    return false;
  }
}

function opensDropdown(e: KeyboardEvent): boolean {
  return e.key === " " || e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"));
}

function onDropdownOpening(p: HistoryParts): void {
  if (isOpen(p.select)) return;
  hoverSound();
  clearSearch(p);
}

function onJingleToggle(p: HistoryParts): void {
  if (p.playJingle.checked && shown) jingle(shown.id);
  else stopSound();
}

function bindHistory(p: HistoryParts): void {
  p.dialog.addEventListener("cancel", () => sfx("button"));
  p.select.addEventListener("change", () => chooseCiv(p, ctx.logic.CIVS[Number(p.select.value)]));
  p.select.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && e.target === p.select) onDropdownOpening(p);
  });
  p.select.addEventListener("keydown", (e) => {
    if (opensDropdown(e)) onDropdownOpening(p);
  });
  p.search.addEventListener("input", () => onSearch(p));
  p.poolInfo.addEventListener("change", () => {
    sfx("button");
    showPoolInfo(p);
  });
  p.playJingle.addEventListener("change", () => onJingleToggle(p));
  if (ctx.simple) return;
  scrollInstantly(p.text);
  buildLogBar(p.text);
  new ResizeObserver(() => paintLogBar(p.text)).observe(p.text);
}

function buildParts(): HistoryParts {
  const options = ctx.logic.DISPLAY_ORDER.map((civ) => h("option", { value: String(civ.id) }, civ.name));
  const playJingle = h("input", { type: "checkbox", id: "historyJingle" });
  return {
    dialog: h("dialog", { className: "win", id: "dlgHistory", "aria-labelledby": "historyTitle" }),
    search: h("input", { type: "text", id: "historySearch", autocomplete: "off", spellcheck: false }),
    select: h("select", { id: "historySelect" }, ...options),
    icon: h("img", { id: "historyIcon", className: "his-icon", alt: "", width: ICON_SIZE, height: ICON_SIZE }),
    added: h("dd", { id: "historyAdded" }),
    enabledLabel: h("dt"),
    enabled: h("dd", { id: "historyEnabled" }),
    drawnLabel: h("dt"),
    drawn: h("dd", { id: "historyDrawn" }),
    poolInfo: h("input", { type: "checkbox", id: "historyPoolInfo" }),
    playJingle,
    jingleRow: h("label", { className: "row" }, playJingle, "Play jingle"),
    text: h("div", {
      className: "log", id: "historyText", tabIndex: 0, role: "textbox",
      "aria-readonly": "true", "aria-multiline": "true", "aria-label": "History text",
    }),
  };
}

function titleBar(): HTMLElement {
  return h("div", { className: "dlg-title" },
    h("h2", { id: "historyTitle" }, "History"),
    h("button", { type: "button", className: "dlg-x", dataset: { close: "" }, "aria-label": "Close" }, "✕"));
}

function bodyOf(p: HistoryParts): HTMLElement {
  const fields = h("div", { className: "his-fields" },
    h("label", { htmlFor: "historySearch" }, "Search civ:"), p.search,
    h("label", { htmlFor: "historySelect" }, "Select civ:"), p.select);
  const facts = h("dl", { className: "facts" },
    h("dt", {}, "Added:"), p.added, p.enabledLabel, p.enabled, p.drawnLabel, p.drawn);
  const checks = h("div", { className: "his-checks" },
    h("label", { className: "row" }, p.poolInfo, "Show pool info"), p.jingleRow);
  return h("div", { className: "dlg-body" },
    h("div", { className: "his-top" }, fields, p.icon, facts),
    checks,
    h("div", { className: "his-text-frame" }, p.text));
}

function dialogParent(): HTMLElement {
  const other = document.querySelector("dialog.win");
  return other?.parentElement ?? document.body;
}

function buildHistory(): HistoryParts {
  const p = buildParts();
  const ok = h("button", { type: "submit", className: "btn", autofocus: true }, "OK");
  const form = h("form", {}, titleBar(), bodyOf(p), h("div", { className: "dlg-buttons" }, ok));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    closeDialog(p.dialog);
  });
  p.dialog.append(form);
  dialogParent().append(p.dialog);
  bindHistory(p);
  return p;
}

export function openHistory(): void {
  parts ??= buildHistory();
  const p = parts;
  sfx("button");
  p.poolInfo.checked = true;
  p.playJingle.checked = false;
  p.jingleRow.hidden = !ctx.settings.jingles;
  clearSearch(p);
  showCiv(p, currentCiv() ?? ctx.logic.DISPLAY_ORDER[0]);
  showDialog(p.dialog);
  if (!ctx.phone.matches) p.search.focus();
  paintLogBar(p.text);
}
