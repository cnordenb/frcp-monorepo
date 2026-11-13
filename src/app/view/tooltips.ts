import { ctx } from "../context.ts";
import { anyDialogOpen } from "../dialogs/dialogbox.ts";
import { $, h, setText } from "./domhelpers.ts";
import { currentMenu } from "./pagemenus.ts";

type TipSource = "mouse" | "focus";

interface TipState {
  target: HTMLElement | null;
  by: TipSource | null;
  dismissed: HTMLElement | null;
}

export const tipState: TipState = { target: null, by: null, dismissed: null };

const tipDescs = new Map<HTMLElement, HTMLElement>();
let toastTimer = 0;

export function tipText(el: HTMLElement): string {
  const text = el.dataset.tip || "";
  return ctx.simple && !ctx.settings.charKeys ? text.replace(/\nHotkey:.*$/s, "") : text;
}

export function hideTip(): void {
  ctx.els.tip.hidden = true;
  tipState.target = null;
  tipState.by = null;
}

function tipsAllowed(): boolean {
  return ctx.settings.tooltips && !currentMenu() && !anyDialogOpen();
}

function tipHolder(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>("[data-tip]") : null;
}

function placeAtPointer(e: PointerEvent): void {
  const { tip } = ctx.els;
  const w = tip.offsetWidth;
  const ht = tip.offsetHeight;
  let x = e.clientX + 10;
  let y = e.clientY + 20;
  if (x + w > innerWidth - 4) x = Math.max(4, innerWidth - w - 4);
  if (y + ht > innerHeight - 4) y = e.clientY - ht - 8;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

export function moveTip(e: PointerEvent): void {
  if (ctx.simple) {
    moveTipSimple(e);
    return;
  }
  const target = e.pointerType === "mouse" && tipsAllowed() ? tipHolder(e.target) : null;
  if (!target) {
    if (tipState.target) hideTip();
    return;
  }
  const { tip } = ctx.els;
  tipState.target = target;
  setText(tip, target.dataset.tip ?? "");
  tip.classList.toggle("ext", "tipExt" in target.dataset);
  tip.hidden = false;
  placeAtPointer(e);
}

function showTip(target: HTMLElement, by: TipSource | null): void {
  const { tip } = ctx.els;
  tipState.target = target;
  tipState.by = by;
  setText(tip, tipText(target));
  tip.hidden = false;
  const r = target.getBoundingClientRect();
  const w = tip.offsetWidth;
  const ht = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(r.left, innerWidth - w - 4)) + "px";
  tip.style.top = (r.bottom + ht <= innerHeight - 4 ? r.bottom : Math.max(4, r.top - ht)) + "px";
}

function moveTipSimple(e: PointerEvent): void {
  if (e.pointerType !== "mouse" || !(e.target instanceof Element) || ctx.els.tip.contains(e.target)) return;
  const target = tipsAllowed() ? tipHolder(e.target) : null;
  if (target !== tipState.dismissed) tipState.dismissed = null;
  if (target && target !== tipState.dismissed) {
    if (target !== tipState.target) showTip(target, "mouse");
  } else if (tipState.by === "mouse") {
    hideTip();
  }
}

function onFocusIn(e: FocusEvent): void {
  const focused = e.target instanceof Element && e.target.matches(":focus-visible") && tipsAllowed();
  const target = focused ? tipHolder(e.target) : null;
  if (target) showTip(target, "focus");
  else if (tipState.by === "focus") hideTip();
}

export function bindSimpleTips(): void {
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", () => {
    if (tipState.by === "focus") hideTip();
  });
  document.addEventListener("scroll", () => {
    if (tipState.target) showTip(tipState.target, tipState.by);
  }, { capture: true, passive: true });
  document.addEventListener("keydown", (e) => {
    if (tipState.target && (e.key === "Escape" || tipState.by === "mouse")) {
      tipState.dismissed = tipState.target;
      hideTip();
    }
  }, true);
}

export function describeTips(): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-tip]")) {
    const control = el.matches("label") ? el.querySelector("input") : el;
    if (!control) continue;
    let desc = tipDescs.get(el);
    if (!desc) {
      desc = h("span", { id: "tip-desc-" + tipDescs.size, hidden: true });
      document.body.append(desc);
      tipDescs.set(el, desc);
      control.setAttribute("aria-describedby", desc.id);
    }
    setText(desc, tipText(el).replace(/\n/g, ". "));
  }
}

export function toast(text: string): void {
  const t = $("toast");
  if (ctx.simple) {
    clearStatus();
    toastTimer = window.setTimeout(() => {
      t.textContent = text;
    }, 50);
    return;
  }
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), 2200);
}

export function clearStatus(): void {
  clearTimeout(toastTimer);
  $("toast").textContent = "";
}
