import { toggleCiv, toggleDlc } from "../actions/civpool.ts";
import { ctx } from "../context.ts";
import {
  CIV_ATLAS_COLS, DLC_ATLAS_COLS, DLC_KEYS, EDITION_KEYS, GRID_COLS, dlcCell,
} from "../model/hotkeytables.ts";
import { $, atlasCell, h } from "./domhelpers.ts";

export interface CivBox {
  label: HTMLLabelElement;
  input: HTMLInputElement;
}

export const civBoxes: CivBox[] = [];
export const dlcBoxes: Record<string, HTMLInputElement> = {};

function dlcTip(dlc: string, slot: number): string {
  const { CIVS, DLCS } = ctx.logic;
  const names = CIVS.filter((c) => c.dlc === dlc).map((c) => c.name);
  const key = DLC_KEYS[slot];
  if (ctx.simple) return `Turns the civs of ${DLCS[dlc].name} on or off: ${names.join(", ")}\nHotkey: ${key}`;
  const plural = names.length === 1 ? "" : "s";
  return `Toggles ${DLCS[dlc].name} civilisation${plural}\n(${names.join(", ")})\nHotkey: ${key}`;
}

function chkIcon(className: string, i: number, cols: number, size: number): HTMLElement | string {
  if (ctx.simple) return "";
  return h("span", { className: "chk-icon", style: { width: size + "px", height: size + "px" } },
    atlasCell("chk-face sprite " + className, i, cols),
    h("span", { className: "chk-off" }));
}

function buildEditionButtons(): void {
  const { EDITIONS, EDITION_INFO } = ctx.logic;
  EDITIONS.forEach((ed, i) => {
    const info = EDITION_INFO[ed];
    const tip = `Selects the ${info.short} (${info.year}) civilisation pool\nHotkey: ${EDITION_KEYS[i]}`;
    const button = h("button", {
      type: "button", className: "imgbtn edition", id: "ed" + ed, "aria-pressed": "false",
      dataset: { pick: ed, tip },
    }, atlasCell("ed-icon sprite dlc-cell", 3 * i, DLC_ATLAS_COLS), `${info.short} (${info.year})`);
    if (!ctx.simple) Object.assign(button.style, { left: "10px", top: 36 + 30 * i + "px" });
    $("editionGroup").append(button);
    ctx.els.editionButtons.push(button);
  });
}

function buildCivBoxes(): void {
  ctx.logic.DISPLAY_ORDER.forEach((c, i) => {
    const input = h("input", { type: "checkbox" });
    input.addEventListener("change", () => toggleCiv(c.id));
    const label = h("label", { className: "chk icon-chk civ" },
      input, chkIcon("civ-cell", c.id, CIV_ATLAS_COLS, 18), h("span", { className: "chk-name" }, c.name));
    if (!ctx.simple) {
      Object.assign(label.style, { left: GRID_COLS[i % 5] + "px", top: 210 + 20 * Math.floor(i / 5) + "px" });
    }
    $("civGrid").append(label);
    civBoxes[c.id] = { label, input };
  });
}

function buildDlcBox(ed: string, dlc: string, i: number): HTMLLabelElement {
  const { EDITION_INFO, DLCS } = ctx.logic;
  const layout = EDITION_INFO[ed].dlcToggleLayout;
  const input = h("input", { type: "checkbox" });
  input.addEventListener("change", () => toggleDlc(dlc));
  const label = h("label", { className: "chk icon-chk", dataset: { tip: dlcTip(dlc, i), dlc } },
    input, chkIcon("dlc-cell", dlcCell(dlc), DLC_ATLAS_COLS, layout.size),
    h("span", { className: "chk-name" }, DLCS[dlc].name));
  if (!ctx.simple) {
    Object.assign(label.style, {
      left: layout.left + "px", top: layout.top + layout.step * i + "px",
      height: layout.size + "px", gap: layout.gap + "px",
    });
  }
  dlcBoxes[dlc] = input;
  return label;
}

function buildDlcGroups(): void {
  const { EDITIONS, EDITION_INFO } = ctx.logic;
  for (const ed of EDITIONS) {
    const group = h("div", { dataset: { on: "2", edition: ed } });
    EDITION_INFO[ed].dlcToggles.forEach((dlc, i) => group.append(buildDlcBox(ed, dlc, i)));
    if (ctx.simple) {
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Expansions");
      $("civGrid").before(group);
    } else {
      ctx.els.panel.append(group);
    }
  }
}

export function buildPoolControls(): void {
  buildEditionButtons();
  buildCivBoxes();
  buildDlcGroups();
  if (ctx.simple) {
    $("civGrid").setAttribute("role", "group");
    $("civGrid").setAttribute("aria-label", "Civs");
  }
}
