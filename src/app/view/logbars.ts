import { h } from "./domhelpers.ts";

interface LogBar {
  bar: HTMLElement;
  track: HTMLElement;
  knob: HTMLElement;
}

type HeldStep = (y: number) => boolean;

export const logBars = new Map<HTMLElement, LogBar>();

function lineHeight(log: HTMLElement): number {
  return parseFloat(getComputedStyle(log).lineHeight) || 16;
}

function pageHeight(log: HTMLElement): number {
  return Math.max(lineHeight(log), log.clientHeight - lineHeight(log));
}

function whileHeld(el: HTMLElement, step: HeldStep): void {
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || (e.target instanceof Element && e.target.closest(".sb-knob"))) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    let y = e.clientY;
    let timer = 0;
    const repeat = (delay: number): void => {
      timer = window.setTimeout(() => {
        if (step(y) !== false) repeat(50);
      }, delay);
    };
    const move = (ev: PointerEvent): void => {
      y = ev.clientY;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("lostpointercapture", () => {
      clearTimeout(timer);
      el.removeEventListener("pointermove", move);
    }, { once: true });
    if (step(y) !== false) repeat(350);
  });
}

function scrollLog(log: HTMLElement, dy: number): boolean {
  const before = log.scrollTop;
  log.scrollTop += dy;
  return log.scrollTop !== before;
}

function canScroll(log: HTMLElement): boolean {
  return log.scrollHeight > log.clientHeight;
}

function wheelLog(log: HTMLElement, e: WheelEvent): void {
  if (e.ctrlKey || !canScroll(log)) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? lineHeight(log) : e.deltaMode === 2 ? log.clientHeight : 1;
  scrollLog(log, e.deltaY * unit);
}

function keyScroll(log: HTMLElement, e: KeyboardEvent): void {
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || !canScroll(log)) return;
  const line = lineHeight(log);
  const page = Math.max(line, log.clientHeight - line);
  const moves: Record<string, number | undefined> = {
    ArrowUp: -line, ArrowDown: line, PageUp: -page, PageDown: page, Home: -log.scrollHeight, End: log.scrollHeight,
  };
  const dy = moves[e.key];
  if (dy === undefined) return;
  e.preventDefault();
  scrollLog(log, dy);
}

function dragScroll(el: HTMLElement, log: HTMLElement, e: PointerEvent, ratio: number): void {
  el.setPointerCapture(e.pointerId);
  const y0 = e.clientY;
  const top0 = log.scrollTop;
  const move = (ev: PointerEvent): void => {
    log.scrollTop = top0 + (ev.clientY - y0) * ratio;
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("lostpointercapture", () => el.removeEventListener("pointermove", move), { once: true });
}

export function scrollInstantly(log: HTMLElement): void {
  log.addEventListener("wheel", (e) => wheelLog(log, e), { passive: false });
  log.addEventListener("keydown", (e) => keyScroll(log, e));
  log.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || !canScroll(log)) return;
    dragScroll(log, log, e, -1);
  });
}

function bindTrack(log: HTMLElement, track: HTMLElement, knob: HTMLElement): void {
  let dir = 0;
  whileHeld(track, (y) => {
    const k = knob.getBoundingClientRect();
    if (!dir) dir = y < k.top ? -1 : 1;
    if (dir < 0 ? y >= k.top : y < k.bottom) {
      dir = 0;
      return false;
    }
    if (scrollLog(log, dir * pageHeight(log))) return true;
    dir = 0;
    return false;
  });
  track.addEventListener("lostpointercapture", () => {
    dir = 0;
  });
}

function bindKnob(log: HTMLElement, track: HTMLElement, knob: HTMLElement): void {
  knob.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const ratio = (log.scrollHeight - log.clientHeight) / (track.clientHeight - knob.offsetHeight);
    dragScroll(knob, log, e, ratio);
  });
}

export function buildLogBar(log: HTMLElement): void {
  const knob = h("div", { className: "sb-knob" });
  const track = h("div", { className: "sb-track" }, knob);
  const up = h("div", { className: "sb-btn sb-up" });
  const down = h("div", { className: "sb-btn sb-down" });
  const bar = h("div", { className: "sb", hidden: true, "aria-hidden": "true", dataset: { on: "1" } }, up, track, down);
  log.after(bar);
  logBars.set(log, { bar, track, knob });
  whileHeld(up, () => scrollLog(log, -lineHeight(log)));
  whileHeld(down, () => scrollLog(log, lineHeight(log)));
  bindTrack(log, track, knob);
  bindKnob(log, track, knob);
  bar.addEventListener("wheel", (e) => wheelLog(log, e), { passive: false });
  log.addEventListener("scroll", () => paintLogBar(log));
}

export function paintLogBar(log: HTMLElement): void {
  const parts = logBars.get(log);
  if (!parts) return;
  const { bar, track, knob } = parts;
  log.classList.toggle("has-bar", log.scrollHeight > log.clientHeight);
  const max = log.scrollHeight - log.clientHeight;
  bar.hidden = max <= 0;
  if (bar.hidden) return;
  bar.style.left = log.offsetLeft + log.offsetWidth - log.clientLeft - bar.offsetWidth + "px";
  bar.style.top = log.offsetTop + log.clientTop + "px";
  bar.style.height = log.clientHeight + "px";
  knob.style.top = Math.round(Math.min(1, log.scrollTop / max) * (track.clientHeight - knob.offsetHeight)) + "px";
}
