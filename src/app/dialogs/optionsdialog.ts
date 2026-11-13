import { setJingles, setUiSounds } from "../actions/toggles.ts";
import { ctx } from "../context.ts";
import { currentCiv, currentId, poolIds } from "../model/currentstate.ts";
import { FRESH_MOST } from "../model/hotkeytables.ts";
import { type BoolSetting, isBoolSetting, saveSettings } from "../model/settingsstore.ts";
import { loadAhead } from "../sound/loadahead.ts";
import { hoverSound, jingle, sfx } from "../sound/soundplayer.ts";
import { $ } from "../view/domhelpers.ts";
import { render } from "../view/renderpage.ts";
import { START_LOG, changeStartLog, syncDesktopOptions } from "./desktopoptions.ts";
import { closeDialog, showDialog } from "./dialogbox.ts";

type Field = HTMLInputElement | HTMLSelectElement;

const CHECKBOXES: BoolSetting[] = [
  "showName", "showIcon", "showCounter", "tooltips", "jingles", "uiSounds", "drawOnLoad", "newRoundOnVisit", "fresh",
  "charKeys",
];

const HINT_SIMPLE = "Single-key hotkeys are letters, numbers, ? and Space on their own. Turn them off if you use "
  + "speech input, or if you press keys by mistake. Keys with Ctrl, and F1 to F12, still work.";
const HINT_DESKTOP = "The desktop app's keys. Tab, F1, F3, F5, Ctrl+S, Ctrl+R and Ctrl+F do picker things instead "
  + "of browser things.";
const HINT_BROWSER = "Leaves reload, find, save page, help and Tab to the browser.";

function optForm(): HTMLFormElement {
  return $<HTMLFormElement>("optForm");
}

function field<T extends Field = HTMLInputElement>(name: string): T {
  return optForm().elements.namedItem(name) as T;
}

function freshLimit(poolSize: number): number {
  return ctx.logic.freshLimit(poolSize, ctx.settings.freshN);
}

function modeHint(): string {
  if (ctx.simple) return HINT_SIMPLE;
  return ctx.settings.hotkeys === "desktop" ? HINT_DESKTOP : HINT_BROWSER;
}

export function syncOptions(): void {
  const { settings } = ctx;
  for (const k of CHECKBOXES) field(k).checked = settings[k];
  const jingleType = field<HTMLSelectElement>("jingleType");
  jingleType.value = settings.legacyJingles ? "legacy" : "de";
  jingleType.disabled = !settings.jingles;
  field<HTMLSelectElement>("hotkeys").value = settings.hotkeys;
  $("modeHint").textContent = modeHint();
  const n = poolIds().length;
  const slider = field("freshN");
  slider.max = String(ctx.logic.freshMax(n));
  slider.value = String(freshLimit(n));
  slider.disabled = !settings.fresh || n < 2;
  updateFreshLabel();
  paintSlider();
  if (ctx.bindings) syncDesktopOptions();
}

function updateFreshLabel(): void {
  const n = poolIds().length;
  const v = Number(field("freshN").value);
  const most = v === ctx.logic.freshMax(n) ? " (the most)" : "";
  $("freshLabel").textContent = n < 2 ? "Needs at least 2 civs in the pool"
    : `Exclude the last ${v} civ${v === 1 ? "" : "s"}${most}`;
}

function paintSlider(): void {
  const s = field("freshN");
  const span = Number(s.max) - Number(s.min);
  const fill = span > 0 ? (Number(s.value) - Number(s.min)) / span : 0;
  if (s.parentElement) s.parentElement.style.setProperty("--fill", String(fill));
}

export function openOptions(): void {
  sfx("button");
  syncOptions();
  showDialog($("dlgOptions"));
}

function changeJingleType(value: string): void {
  ctx.settings.legacyJingles = value === "legacy";
  saveSettings();
  const c = currentCiv();
  if (!c || c.legacy) jingle(currentId());
  else sfx("view");
  loadAhead();
}

function changeHotkeys(value: string): void {
  ctx.settings.hotkeys = value === "browser" ? "browser" : "desktop";
  saveSettings();
  sfx("view");
  render();
  syncOptions();
}

function onOptionChange(e: Event): void {
  const t = e.target as HTMLInputElement;
  if (t.name === "freshN") loadAhead();
  else if (t.name === "jingles") setJingles(t.checked);
  else if (t.name === "uiSounds") setUiSounds(t.checked);
  else if (t.name === "jingleType") changeJingleType(t.value);
  else if (t.name === "hotkeys") changeHotkeys(t.value);
  else if (t.name === START_LOG) changeStartLog(t.value);
  else if (isBoolSetting(t.name)) {
    sfx("button");
    ctx.settings[t.name] = t.checked;
    saveSettings();
    render();
    syncOptions();
  }
}

function onFreshInput(): void {
  const slider = field("freshN");
  ctx.settings.freshN = Number(slider.value) >= Number(slider.max) ? FRESH_MOST : Number(slider.value);
  saveSettings();
  updateFreshLabel();
  paintSlider();
}

export function bindOptions(): void {
  const form = optForm();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    closeDialog($("dlgOptions"));
  });
  form.addEventListener("change", onOptionChange);
  field("freshN").addEventListener("input", onFreshInput);
  for (const s of form.querySelectorAll("select")) s.addEventListener("mousedown", hoverSound);
}
