import { HOTKEY_SCOPES, type HotkeyScope } from "../bindings/hotkey-table.ts";
import { SCOPE_TITLES } from "../bindings/key-change-text.ts";
import { ctx } from "../context.ts";
import { shownKeyOf } from "../desktopui/boundkeys.ts";
import { GLOBAL_KEYS, type KeyPair, activeKeys, hotkeyMode } from "../model/hotkeytables.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $, h } from "../view/domhelpers.ts";
import { showDialog } from "./dialogbox.ts";

type HotkeyRow = [keys: string[], text: string];

const MODE_CHAR_KEYS_ON = "Single-key hotkeys are on. You can turn them off in Options.";
const MODE_CHAR_KEYS_OFF = "Single-key hotkeys are off, so only these keys work. You can turn them back on in "
  + "Options.";
const MODE_DESKTOP = "Desktop hotkeys. Options can switch to browser-friendly hotkeys, which leave the browser's "
  + "own keys alone.";
const MODE_BROWSER = "Browser-friendly hotkeys. Options can switch to the desktop app's hotkeys.";

function dlcSlotText(i: number): string {
  const { DLCS, EDITIONS, EDITION_INFO } = ctx.logic;
  const dlcs = EDITIONS.map((ed) => EDITION_INFO[ed].dlcToggles[i]).filter(Boolean);
  return "Toggle " + dlcs.map((d) => DLCS[d].short).join(" / ");
}

export function actionText(act: string): string {
  return act.startsWith("dlc") ? dlcSlotText(Number(act.slice(3))) : ctx.actionText[act];
}

function rows(pairs: KeyPair[]): HotkeyRow[] {
  const byAction = new Map<string, string[]>();
  for (const [key, act] of activeKeys(pairs)) byAction.set(act, [...(byAction.get(act) || []), key]);
  return [...byAction].map(([act, keys]): HotkeyRow => [keys, actionText(act)]);
}

function rowItem([keys, text]: HotkeyRow): HTMLElement {
  const parts = keys.flatMap((k, i) => [i ? " / " : "", h("kbd", { className: "key" }, k)]);
  return h("li", {}, ...parts, " " + text);
}

function section(title: string, list: HotkeyRow[], className = ""): HTMLElement {
  return h("section", { className }, h("h3", {}, title), h("ul", {}, ...list.map(rowItem)));
}

function modeText(): string {
  if (ctx.simple) return ctx.settings.charKeys ? MODE_CHAR_KEYS_ON : MODE_CHAR_KEYS_OFF;
  return ctx.settings.hotkeys === "desktop" ? MODE_DESKTOP : MODE_BROWSER;
}

function boundRows(scope: HotkeyScope): HotkeyRow[] {
  const hotkeys = ctx.bindings ? ctx.bindings.list(scope) : [];
  return hotkeys.map((hotkey): HotkeyRow => [[shownKeyOf(hotkey.id)], actionText(hotkey.action)]);
}

function fixedRows(): HotkeyRow[][] {
  const global = rows(GLOBAL_KEYS[hotkeyMode()]);
  return [[...global, [["Esc"], "Close a dialog or menu"]], ...ctx.tabKeys.map(rows)];
}

function buildHotkeys(): void {
  const [global, draw, log, pool] = ctx.bindings ? HOTKEY_SCOPES.map(boundRows) : fixedRows();
  $("hkGrid").replaceChildren(
    section(SCOPE_TITLES.global, global, "global"),
    h("div", {}, section(SCOPE_TITLES.draw, draw), section(SCOPE_TITLES.log, log)),
    section(SCOPE_TITLES.pool, pool),
  );
  $("hkMode").textContent = modeText();
}

export function openHotkeys(): void {
  sfx("button");
  buildHotkeys();
  showDialog($("dlgHotkeys"));
}
