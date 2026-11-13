import type { SavedHotkeys } from "../bindings/hotkey-bindings.ts";
import { HOTKEY_SCOPES, type HotkeyScope } from "../bindings/hotkey-table.ts";
import {
  DEFAULTS_RESTORED, type KeyChangeText, NO_STATUS, type NamedHotkey, SCOPE_TITLES, keyChangeText, listeningText,
} from "../bindings/key-change-text.ts";
import { nameOfKeyPress } from "../bindings/keystroke.ts";
import { ctx } from "../context.ts";
import { saveBindings, shownKeyOf } from "../desktopui/boundkeys.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $, find, h } from "../view/domhelpers.ts";
import { render } from "../view/renderpage.ts";
import { closeDialog, showDialog } from "./dialogbox.ts";
import { actionText } from "./hotkeysdialog.ts";

const HINT = "Click a hotkey's key, then press the key you want for it; Backspace leaves it without one.";
const MOST_ROWS = 12;
const HELD_KEYS = ["Control", "Shift", "Alt", "AltGraph", "Meta"];
const REFUSED = ["kept", "unnamed"];

let scope: HotkeyScope = "global";
let listeningTo: string | null = null;
let before: SavedHotkeys = {};
let kept = false;

function namedHotkey(id: string): NamedHotkey {
  const hotkey = ctx.bindings?.hotkeys.find((one) => one.id === id);
  return hotkey ? { text: actionText(hotkey.action), scope: hotkey.scope } : { text: "", scope: "global" };
}

function showStatus(text: KeyChangeText): void {
  $("keyStatus").textContent = text.status;
  $("keyDetail").textContent = text.detail;
}

function keyButtons(): HTMLButtonElement[] {
  return [...$("keyRows").querySelectorAll<HTMLButtonElement>(".key-btn")];
}

function showKeys(): void {
  for (const button of keyButtons()) {
    button.textContent = shownKeyOf(button.dataset.hotkey ?? "");
    button.classList.toggle("listening", button.dataset.hotkey === listeningTo);
  }
}

function stopListening(): void {
  if (listeningTo === null) return;
  listeningTo = null;
  showKeys();
  showStatus(NO_STATUS);
}

function listenTo(id: string): void {
  sfx("button");
  listeningTo = id;
  showKeys();
  showStatus(listeningText(namedHotkey(id).text));
}

function rowsPerColumn(count: number): number {
  return count > MOST_ROWS ? Math.ceil(count / 2) : Math.max(count, 1);
}

function keyRow(id: string, text: string): HTMLElement {
  const button = h("button", { type: "button", className: "btn key-btn", dataset: { hotkey: id } });
  button.addEventListener("click", () => listenTo(id));
  button.addEventListener("blur", () => {
    if (listeningTo === id) stopListening();
  });
  return h("div", { className: "key-row" }, button, h("span", {}, text));
}

function showSection(): void {
  const hotkeys = ctx.bindings ? ctx.bindings.list(scope) : [];
  const rows = $("keyRows");
  rows.style.setProperty("--rows", String(rowsPerColumn(hotkeys.length)));
  rows.replaceChildren(...hotkeys.map((hotkey) => keyRow(hotkey.id, actionText(hotkey.action))));
  showKeys();
}

function chooseSection(chosen: HotkeyScope): void {
  sfx("view");
  stopListening();
  scope = chosen;
  showSection();
}

function onKeyDown(e: KeyboardEvent): void {
  const id = listeningTo;
  if (id === null || !ctx.bindings) return;
  e.preventDefault();
  e.stopPropagation();
  if (HELD_KEYS.includes(e.key)) return;
  const change = ctx.bindings.choose(id, nameOfKeyPress(e));
  if (!change) return;
  listeningTo = null;
  sfx(REFUSED.includes(change.choice) ? "error" : "button");
  showKeys();
  showStatus(keyChangeText(change, namedHotkey));
}

function restoreDefaults(): void {
  stopListening();
  sfx("button");
  ctx.bindings?.restoreDefaults();
  showKeys();
  showStatus(DEFAULTS_RESTORED);
}

function onClosed(): void {
  listeningTo = null;
  if (!kept) ctx.bindings?.load(before);
  saveBindings();
  render();
}

function sectionRadio(one: HotkeyScope): HTMLElement {
  const input = h("input", { type: "radio", name: "keySection", value: one });
  input.addEventListener("change", () => chooseSection(one));
  return h("label", { className: "row" }, input, SCOPE_TITLES[one]);
}

function buttons(): HTMLElement {
  const defaults = h("button", { type: "button", className: "btn" }, "Defaults");
  defaults.addEventListener("click", restoreDefaults);
  return h("div", { className: "dlg-buttons" },
    defaults, h("button", { type: "button", className: "btn", dataset: { close: "" } }, "Cancel"),
    h("button", { type: "submit", className: "btn", autofocus: true }, "OK"));
}

function body(): HTMLElement {
  return h("div", { className: "dlg-body customise" },
    h("p", { className: "hint" }, HINT),
    h("div", { className: "inline key-sections" }, ...HOTKEY_SCOPES.map(sectionRadio)),
    h("div", { className: "key-rows", id: "keyRows" }),
    h("p", { className: "key-status", id: "keyStatus", role: "status" }),
    h("p", { className: "key-status", id: "keyDetail" }));
}

export function buildCustomise(): HTMLDialogElement {
  const title = h("div", { className: "dlg-title" },
    h("h2", { id: "customiseTitle" }, "Customise Hotkeys"),
    h("button", { type: "button", className: "dlg-x", dataset: { close: "" }, "aria-label": "Close" }, "✕"));
  const form = h("form", {}, title, body(), buttons());
  const dialog = h("dialog", { className: "win", id: "dlgCustomise", "aria-labelledby": "customiseTitle" }, form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    kept = true;
    closeDialog(dialog);
  });
  dialog.addEventListener("keydown", onKeyDown, true);
  dialog.addEventListener("cancel", (e) => {
    if (listeningTo !== null) e.preventDefault();
  });
  dialog.addEventListener("close", onClosed);
  return dialog;
}

export function openCustomise(): void {
  if (!ctx.bindings) return;
  sfx("button");
  before = ctx.bindings.serialise();
  kept = false;
  scope = "global";
  listeningTo = null;
  find<HTMLInputElement>($("dlgCustomise"), 'input[name="keySection"][value="global"]').checked = true;
  showSection();
  showStatus(NO_STATUS);
  showDialog($("dlgCustomise"));
}
