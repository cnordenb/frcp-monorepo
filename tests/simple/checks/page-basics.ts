export const SKIP = "script, style, option, .sr-only, [hidden]";

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TextBox {
  n: Text;
  el: Element;
  r: Box;
}

export function visible(el: Element | null): boolean {
  if (!(el instanceof Element) || !el.checkVisibility({ visibilityProperty: true })) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function describe(el: Element): string {
  const name = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "");
  const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
  return text ? `${name} "${text}"` : name;
}

export function shortText(node: Node, length: number): string {
  return (node.textContent ?? "").trim().slice(0, length);
}

export function rgba(colour: string): number[] | null {
  const m = /rgba?\(([^)]+)\)/.exec(colour);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}

export function luminance(colour: number[]): number {
  const linear = (v: number): number => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(colour[0]) + 0.7152 * linear(colour[1]) + 0.0722 * linear(colour[2]);
}

export function ratio(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function background(el: Element): number[] {
  const layers: number[][] = [];
  for (let e: Element | null = el; e; e = e.parentElement) {
    const c = rgba(getComputedStyle(e).backgroundColor);
    if (c && c[3] > 0) {
      layers.push(c);
      if (c[3] >= 1) break;
    }
  }
  let base = [255, 255, 255];
  for (const c of layers.reverse()) base = base.map((v, i) => v * (1 - c[3]) + c[i] * c[3]);
  return base;
}

export function clipOf(el: Element): Box {
  const c = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (/hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflowY)) {
      const r = e.getBoundingClientRect();
      c.left = Math.max(c.left, r.left);
      c.top = Math.max(c.top, r.top);
      c.right = Math.min(c.right, r.right);
      c.bottom = Math.min(c.bottom, r.bottom);
    }
  }
  return c;
}

export function textBoxes(root: Element): TextBox[] {
  const boxes: TextBox[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const el = n.parentElement;
    if (!el || !n.data.trim() || !visible(el) || el.closest(SKIP)) continue;
    const clip = clipOf(el);
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      const box = {
        left: Math.max(r.left, clip.left),
        top: Math.max(r.top, clip.top),
        right: Math.min(r.right, clip.right),
        bottom: Math.min(r.bottom, clip.bottom),
      };
      if (box.right - box.left > 1 && box.bottom - box.top > 1) boxes.push({ n, el, r: box });
    }
  }
  return boxes;
}

export function topLayer(): Element {
  return document.querySelector("dialog[open]") || document.body;
}

export const BASICS = [visible, describe, shortText, rgba, luminance, ratio, background, clipOf, textBoxes, topLayer];
