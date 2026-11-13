import { type Box, SKIP, type TextBox, describe, shortText, textBoxes, topLayer, visible } from "./page-basics.ts";

export const BLOCKS = "p, dd, li, .hint";
export const TEXT_HOLDERS = "button, label, .label, a, legend, h1, h2, h3, dt, dd, li, p";

export function reflow(): string[] {
  const bad = new Set<string>();
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) bad.add(`the page is ${de.scrollWidth} px wide in ${de.clientWidth}`);
  for (const el of document.querySelectorAll("*")) {
    if (!visible(el)) continue;
    const scrolls = el.tagName === "DIALOG" || /auto|scroll/.test(getComputedStyle(el).overflowX);
    if (scrolls && el.scrollWidth > el.clientWidth + 1) bad.add(`${describe(el)} scrolls sideways`);
  }
  for (const b of textBoxes(document.body)) {
    if (b.r.right > innerWidth + 1 || b.r.left < -1) bad.add(`"${shortText(b.n, 25)}" is outside the viewport`);
  }
  return [...bad];
}

export function overlappingText(boxes: TextBox[]): string[] {
  const bad: string[] = [];
  const inMenu = (b: TextBox): boolean => !!b.el.closest(".menu-list");
  const hit = (a: Box, b: Box): boolean =>
    a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, b] = [boxes[i], boxes[j]];
      if (a.n !== b.n && inMenu(a) === inMenu(b) && hit(a.r, b.r)) {
        bad.push(`"${shortText(a.n, 20)}" overlaps "${shortText(b.n, 20)}"`);
      }
    }
  }
  return bad;
}

export function cutOffText(root: Element): string[] {
  const bad: string[] = [];
  for (const el of root.querySelectorAll("*")) {
    if (!visible(el) || el.closest(SKIP) || !shortText(el, 1)) continue;
    const cs = getComputedStyle(el);
    const cutsAcross = /hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const cutsDown = /hidden|clip/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (cutsAcross || cutsDown) bad.push(`${describe(el)} cuts its text off`);
  }
  return bad;
}

export function spilledText(root: Element): string[] {
  const bad: string[] = [];
  for (const el of root.querySelectorAll(TEXT_HOLDERS)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const spills = textBoxes(el).some((b) => b.r.right > r.right + 1.5 || b.r.left < r.left - 1.5);
    if (spills) bad.push(`text spills out of ${describe(el)}`);
  }
  return bad;
}

export function overlaps(): string[] {
  const root = topLayer();
  return [...new Set([...overlappingText(textBoxes(root)), ...cutOffText(root), ...spilledText(root)])];
}

export function longestLine(el: Element): number {
  const lines = new Map<number, number>();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (n.parentElement?.closest(SKIP)) continue;
    for (let i = 0; i < n.length; i++) {
      const range = document.createRange();
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      const r = range.getClientRects()[0];
      if (r && r.width >= 0.5) lines.set(Math.round(r.top / 4), (lines.get(Math.round(r.top / 4)) || 0) + 1);
    }
  }
  return Math.max(0, ...lines.values());
}

export function blockProblems(el: HTMLElement, max: number): string[] {
  const bad: string[] = [];
  const cs = getComputedStyle(el);
  const lineHeight = parseFloat(cs.lineHeight);
  if (!(lineHeight >= 1.5 * parseFloat(cs.fontSize) - 0.5)) {
    bad.push(`${describe(el)} has line height ${cs.lineHeight} for ${cs.fontSize} text`);
  }
  if (cs.textAlign === "justify") bad.push(`${describe(el)} is justified`);
  const next = el.nextElementSibling;
  if (el.tagName === "P" && next && next.tagName === "P" && visible(next) && el.closest("dialog")) {
    const gap = next.getBoundingClientRect().top - el.getBoundingClientRect().bottom;
    if (gap < 1.5 * lineHeight - 1) {
      bad.push(`${describe(el)} is ${Math.round(gap)} px from the next paragraph, under 1.5 lines`);
    }
  }
  if (shortText(el, max + 1).length <= max) return bad;
  const longest = longestLine(el);
  if (longest > max) bad.push(`${describe(el)} has a line of ${longest} characters`);
  return bad;
}

export function visualPresentation(max = 80): string[] {
  const bad: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(BLOCKS)) {
    if (!visible(el) || (el.innerText.match(/[.!?](\s|$)/g) || []).length < 2) continue;
    bad.push(...blockProblems(el, max));
  }
  return bad;
}

export const LAYOUT = [
  reflow,
  overlappingText,
  cutOffText,
  spilledText,
  overlaps,
  longestLine,
  blockProblems,
  visualPresentation,
];
