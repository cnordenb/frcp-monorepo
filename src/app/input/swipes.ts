import type { Snapshot } from "../actions/drawing.ts";
import { draw, nextDraw, reroll, rerollCivs, reset, undo } from "../actions/drawing.ts";
import { ctx } from "../context.ts";
import { currentId, poolIds, round } from "../model/currentstate.ts";
import { find, setIcon } from "../view/domhelpers.ts";
import { currentMenu } from "../view/pagemenus.ts";

type SwipeKind = "draw" | "undo" | "reroll" | "reset";
type Axis = "x" | "y";

interface Swipe {
  id: number;
  x: number;
  y: number;
  axis: Axis | null;
  kind: SwipeKind | null;
  trail: [time: number, distance: number][];
  d: number;
  t: number;
  travel: number;
  moves: boolean;
  acted: boolean;
}

const SWIPE_MIN = 40;
const SWIPE_SLOP = 10;
const SWIPE_EDGE: Record<SwipeKind, [x: number, y: number]> = {
  draw: [-1, 0], undo: [-1, 0], reset: [0, -1], reroll: [0, 1],
};

let swipe: Swipe | null = null;
let glide = 0;
let ignoreClickUntil = 0;

function swipeKind(axis: Axis, d: number): SwipeKind {
  if (axis === "x") return d < 0 ? "draw" : "undo";
  return d < 0 ? "reroll" : "reset";
}

function iconCell(id: number | null): number {
  return id === null ? ctx.randomCell : id;
}

function act(kind: SwipeKind): void {
  if (kind === "draw") draw();
  else if (kind === "undo") undo();
  else if (kind === "reroll") reroll();
  else reset();
}

function swipeCell(kind: SwipeKind): number | null {
  if (kind === "draw") return poolIds().length && ctx.rng ? nextDraw() : null;
  if (kind === "reset") return round().length ? ctx.randomCell : null;
  if (kind === "reroll") {
    const others = rerollCivs();
    return others ? nextDraw(others) : null;
  }
  const snap = ctx.undoStacks.undo[ctx.undoStacks.undo.length - 1];
  if (!snap) return null;
  const { log } = JSON.parse(snap) as Snapshot;
  const r = log[log.length - 1];
  return iconCell(r.length ? r[r.length - 1][0] : null);
}

function rest(): void {
  const { civIcon, civGhost } = ctx.els;
  cancelAnimationFrame(glide);
  glide = 0;
  for (const el of [civIcon, civGhost]) {
    el.style.transform = "";
    el.style.opacity = "";
  }
  civGhost.hidden = true;
}

function travel(kind: SwipeKind): number {
  const icon = ctx.els.civIcon;
  if (kind === "reset") return Math.max(1, icon.offsetTop);
  if (kind === "reroll") return Math.max(1, ctx.els.panel.clientHeight - icon.offsetTop - icon.offsetHeight);
  return Math.max(1, icon.offsetLeft);
}

function aim(s: Swipe, kind: SwipeKind): void {
  if (kind === s.kind) return;
  rest();
  const cell = swipeCell(kind);
  const moves = cell !== null && !ctx.simple && ctx.settings.showIcon;
  Object.assign(s, { kind, moves, travel: travel(kind) });
  if (cell !== null && moves) setIcon(ctx.els.civGhost, cell);
}

function place(el: HTMLElement, kind: SwipeKind, k: number, opacity: number): void {
  const [ex, ey] = SWIPE_EDGE[kind];
  el.style.transform = k ? `translate(${ex * k}px, ${ey * k}px)` : "";
  el.style.opacity = String(opacity);
}

function paint(s: Swipe): void {
  if (!s.moves || !s.kind) return;
  const { civIcon, civGhost } = ctx.els;
  const p = s.t / s.travel;
  const [current, next] = s.acted ? [civGhost, civIcon] : [civIcon, civGhost];
  if (s.kind === "draw") {
    place(current, s.kind, s.t, 1 - p);
    if (s.acted) place(next, s.kind, 0, 1);
  } else {
    place(current, s.kind, 0, 1 - p);
    place(next, s.kind, s.travel - s.t, p);
  }
  civGhost.hidden = s.kind === "draw" && !s.acted;
}

function follow(s: Swipe, e: PointerEvent): void {
  if (!s.axis) return;
  s.d = s.axis === "x" ? e.clientX - s.x : e.clientY - s.y;
  s.trail.push([e.timeStamp, s.d]);
  while (s.trail.length > 2 && e.timeStamp - s.trail[0][0] > 100) s.trail.shift();
  aim(s, swipeKind(s.axis, s.d));
  s.t = Math.min(Math.abs(s.d), s.travel);
  paint(s);
}

function glideTo(s: Swipe, to: number): void {
  if (!s.moves) return;
  const [t0, d0] = s.trail[0];
  const [t1, d1] = s.trail[s.trail.length - 1];
  const speed = t1 > t0 ? Math.abs(d1 - d0) / (t1 - t0) : 0;
  const from = s.t;
  const ms = Math.min(350, Math.max(80, 2 * Math.abs(to - from) / Math.max(speed, 0.1)));
  const start = performance.now();
  const frame = (now: number): void => {
    const k = Math.min(1, Math.max(0, (now - start) / ms));
    s.t = from + (to - from) * (1 - (1 - k) ** 2);
    paint(s);
    if (k < 1) glide = requestAnimationFrame(frame);
    else rest();
  };
  glide = requestAnimationFrame(frame);
}

function onDown(e: PointerEvent): void {
  ignoreClickUntil = 0;
  rest();
  const swipeable = ctx.phone.matches && ctx.ui.tab === 0 && e.isPrimary && e.button === 0 && !currentMenu();
  swipe = swipeable
    ? {
      id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, kind: null, trail: [],
      d: 0, t: 0, travel: 1, moves: false, acted: false,
    }
    : null;
}

function onMove(e: PointerEvent): void {
  const s = swipe;
  if (!s || e.pointerId !== s.id) return;
  if (!s.axis) {
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_SLOP) return;
    s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
  }
  follow(s, e);
}

function onUp(e: PointerEvent): void {
  const s = swipe;
  if (!s || e.pointerId !== s.id) return;
  swipe = null;
  if (!s.axis) return;
  ignoreClickUntil = performance.now() + 500;
  follow(s, e);
  if (Math.abs(s.d) < SWIPE_MIN) {
    glideTo(s, 0);
    return;
  }
  const before = iconCell(currentId());
  if (s.kind) act(s.kind);
  if (!s.moves) return;
  s.acted = true;
  setIcon(ctx.els.civGhost, before);
  glideTo(s, s.travel);
}

function onCancel(e: PointerEvent): void {
  const s = swipe;
  if (!s || e.pointerId !== s.id) return;
  swipe = null;
  if (s.axis) glideTo(s, 0);
}

function onPanelClick(e: MouseEvent): void {
  if (performance.now() > ignoreClickUntil) return;
  ignoreClickUntil = 0;
  e.stopPropagation();
  e.preventDefault();
}

function onTouchMove(e: TouchEvent): void {
  const inCivGrid = e.target instanceof Element && e.target.closest("#civGrid");
  if (ctx.phone.matches && !inCivGrid) e.preventDefault();
}

export function bindSwipes(): void {
  ctx.els.panel.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);
  ctx.els.panel.addEventListener("click", onPanelClick, true);
  find(document, ".window").addEventListener("touchmove", onTouchMove, { passive: false });
}
