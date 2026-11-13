import { imageUrl } from "../assets.ts";
import { type Els, ctx } from "../context.ts";

type Props = Record<string, unknown>;
type Kid = Node | string;

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

export function find<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, props: Props = {}, ...kids: Kid[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "style") Object.assign(el.style, v);
    else if (k in el) (el as unknown as Props)[k] = v;
    else el.setAttribute(k, String(v));
  }
  el.append(...kids);
  return el;
}

export function setCell(el: HTMLElement, i: number, cols: number): void {
  el.style.setProperty("--x", String(i % cols));
  el.style.setProperty("--y", String(Math.floor(i / cols)));
}

export function atlasCell(className: string, i: number, cols: number): HTMLSpanElement {
  const el = h("span", { className });
  setCell(el, i, cols);
  return el;
}

export function iconName(cell: number): string {
  return "civ/" + (cell === ctx.randomCell ? "random" : ctx.logic.CIVS[cell].file);
}

export function setIcon(el: HTMLElement, cell: number): void {
  el.style.setProperty("--atlas", `url("${imageUrl(iconName(cell))}")`);
}

export function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

export function buildEls(): Els {
  return {
    client: $("client"),
    panel: $("panel"),
    tabs: [$("tab-0"), $("tab-1"), $("tab-2")],
    civIcon: $("civIcon"),
    civGhost: $("civGhost"),
    civName: $("civName"),
    counter: $("roundCounter"),
    drawnCount: $("drawnCount"),
    drawnLog: $("drawnLog"),
    remainingCount: $("remainingCount"),
    remainingLog: $("remainingLog"),
    showRemaining: $("showRemaining"),
    edIcon: $("editionIcon"),
    enabledCount: $("enabledCount"),
    autoToggle: $("autoToggle"),
    autoReset: $("autoReset"),
    editionButtons: [],
    tip: $("tip"),
  };
}
