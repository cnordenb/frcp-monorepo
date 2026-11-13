import { BLOCKS, LAYOUT, TEXT_HOLDERS, overlaps, reflow, visualPresentation } from "./layout-checks.ts";
import { BASICS, SKIP, background, describe, ratio, rgba, shortText, textBoxes, visible } from "./page-basics.ts";

export interface FocusFound {
  el: string;
  problems: string[];
}

export const TARGETS = [
  "button",
  "a[href]",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "[role=tab]",
  "[tabindex]:not([tabindex='-1'])",
  "label",
].join(", ");
export const NEW_TAB_OPENERS = "a[target='_blank'], [data-act='techtree'], #techBtn";
export const SPACING = [
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }",
  "p { margin-bottom: 2em !important; }",
].join(" ");

export function big(el: Element, min: number): boolean {
  const r = el.getBoundingClientRect();
  return visible(el) && r.width >= min - 0.5 && r.height >= min - 0.5;
}

export function hasEquivalentTarget(el: Element, min: number): boolean {
  if (el instanceof HTMLLabelElement) return !el.control || (!el.contains(el.control) && big(el.control, min));
  if (el.tagName === "A" && el.closest("p, dd, li") && el.parentElement) {
    return shortText(el.parentElement, Infinity).length > shortText(el, Infinity).length + 5;
  }
  const labels = el.matches("input, select") ? (el as HTMLInputElement).labels : null;
  return !!labels && [...labels].some((l) => big(l, min));
}

export function targets(min = 44): string[] {
  const bad: string[] = [];
  for (const el of document.querySelectorAll(TARGETS)) {
    if (!visible(el) || el.closest("[inert]") || big(el, min) || hasEquivalentTarget(el, min)) continue;
    const r = el.getBoundingClientRect();
    bad.push(`${describe(el)} is ${Math.round(r.width)} x ${Math.round(r.height)}`);
  }
  return bad;
}

export function contrast(min = 7): string[] {
  const bad = new Set<string>();
  for (const { el } of textBoxes(document.body)) {
    if (el.closest(":disabled")) continue;
    const fg = rgba(getComputedStyle(el).color);
    if (!fg) continue;
    const bg = background(el);
    const ink = fg[3] < 1 ? fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])) : fg;
    const r = ratio(ink, bg);
    if (r < min) bad.add(`${describe(el)} is ${r.toFixed(2)}:1`);
  }
  return [...bad];
}

export function ringProblems(el: Element, ring: Element): string[] {
  const cs = getComputedStyle(ring);
  const color = rgba(cs.outlineColor);
  const behind = parseFloat(cs.outlineOffset) >= 0 ? background(ring.parentElement || ring) : background(ring);
  if (cs.outlineStyle === "none" || parseFloat(cs.outlineWidth) < 2) {
    return [`${describe(el)} has a ${cs.outlineStyle} ${cs.outlineWidth} focus ring`];
  }
  if (color && ratio(color, behind) >= 3) return [];
  return [`${describe(el)}'s focus ring is ${color ? ratio(color, behind).toFixed(2) : 0}:1`];
}

export function coverProblems(el: Element, label: Element | null): string[] {
  const r = el.getBoundingClientRect();
  const points = [
    [r.left + r.width / 2, r.top + r.height / 2],
    [r.left + 2, r.top + 2],
    [r.right - 2, r.top + 2],
    [r.left + 2, r.bottom - 2],
    [r.right - 2, r.bottom - 2],
  ];
  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    const top = document.elementFromPoint(x, y);
    if (top && top !== el && !el.contains(top) && !top.contains(el) && !(label && label.contains(top))) {
      return [`${describe(el)} is covered by ${describe(top)}`];
    }
  }
  return [];
}

export function focus(): FocusFound | null {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const label = el.matches("input[type=checkbox], input[type=radio]") ? el.closest("label") : null;
  const ring = label && getComputedStyle(label).outlineStyle !== "none" ? label : el;
  return { el: describe(el), problems: [...ringProblems(el, ring), ...coverProblems(el, label)] };
}

export function newTabs(): string[] {
  const bad: string[] = [];
  for (const el of document.querySelectorAll(NEW_TAB_OPENERS)) {
    const says = /\(opens in a new tab\)/.test(el.textContent ?? "") && el.querySelector(".new-tab");
    if (!says) bad.push(`${describe(el)} doesn't say it opens a new tab`);
  }
  return bad;
}

export function textSpacing(on: boolean): void {
  document.getElementById("wcag-spacing")?.remove();
  if (!on) return;
  const style = document.createElement("style");
  style.id = "wcag-spacing";
  style.textContent = SPACING;
  document.head.append(style);
}

const CONSTANTS = { SKIP, BLOCKS, TEXT_HOLDERS, TARGETS, NEW_TAB_OPENERS, SPACING };
const OWN = [big, hasEquivalentTarget, targets, contrast, ringProblems, coverProblems, focus, newTabs, textSpacing];
const LAYOUT_CHECKS = [reflow, overlaps, visualPresentation];
const OFFERED = [visible, describe, targets, contrast, ...LAYOUT_CHECKS, focus, newTabs, textSpacing];

const constants = Object.entries(CONSTANTS).map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`);
const functions = [...BASICS, ...LAYOUT, ...OWN].map(String);

const offer = `return { ${OFFERED.map((check) => check.name).join(", ")} };`;

export const CHECKS = ["window.wcag = (() => {", ...constants, ...functions, offer, "})()"].join("\n");
