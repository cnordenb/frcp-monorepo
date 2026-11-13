import { nextDraw } from "../actions/drawing.ts";
import { imageUrl } from "../assets.ts";
import { ctx } from "../context.ts";
import { iconName } from "../view/domhelpers.ts";
import { audioFor, civJingleUrl } from "./soundplayer.ts";

const preloaded = new Set<string>();

export function preload(...names: string[]): void {
  for (const t of names) {
    if (ctx.simple || preloaded.has(t)) continue;
    preloaded.add(t);
    new Image().src = imageUrl(t);
  }
}

export function loadAhead(): void {
  const { settings } = ctx;
  if (ctx.simple || !(settings.jingles || settings.showIcon)) return;
  const id = nextDraw();
  if (settings.jingles) {
    audioFor(civJingleUrl(null));
    if (id !== null) audioFor(civJingleUrl(id));
  }
  if (settings.showIcon) preload(iconName(ctx.randomCell), ...(id === null ? [] : [iconName(id)]));
}

export function preloadLanding(): void {
  preload("ui/external", ctx.phone.matches ? "ui/button_pressed_9slice" : "ui/button_pressed");
}
