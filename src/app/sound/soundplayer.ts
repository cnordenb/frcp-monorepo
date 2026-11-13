import { jingleUrl, uiSoundUrl } from "../assets.ts";
import { ctx } from "../context.ts";

const UI_SOUNDS = {
  button: "button_sound",
  tab: "parchment_sound",
  click: "click_sound",
  hover: "hover_sound",
  error: "error_sound",
  view: "view_sound",
  mute: "mute",
} as const;

export type UiSound = keyof typeof UI_SOUNDS;

const audioCache = new Map<string, HTMLAudioElement>();
let playing: HTMLAudioElement | null = null;
let hoverAudio: HTMLAudioElement | null = null;
let handCursor = false;
let warmed = false;

export function audioFor(url: string): HTMLAudioElement {
  let a = audioCache.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = "auto";
    audioCache.set(url, a);
  }
  return a;
}

function rewind(a: HTMLAudioElement, onlyWhenMoved: boolean): void {
  try {
    if (!onlyWhenMoved || a.currentTime) a.currentTime = 0;
  } catch {
    return;
  }
}

function startPlaying(a: HTMLAudioElement): void {
  const p = a.play();
  if (p) p.catch(() => {});
}

export function stopSound(): void {
  if (hoverAudio) hoverAudio.pause();
  if (!playing) return;
  playing.pause();
  rewind(playing, false);
  playing = null;
}

export function playUrl(url: string): void {
  if (ctx.simple) return;
  stopSound();
  const a = audioFor(url);
  playing = a;
  rewind(a, true);
  startPlaying(a);
}

export function uiUrl(name: UiSound): string {
  return uiSoundUrl(UI_SOUNDS[name]);
}

export function sfx(name: UiSound): void {
  if (ctx.settings.uiSounds) playUrl(uiUrl(name));
}

function hoverChannel(): HTMLAudioElement {
  if (!hoverAudio) {
    hoverAudio = new Audio(uiUrl("hover"));
    hoverAudio.preload = "auto";
  }
  return hoverAudio;
}

export function hoverSound(): void {
  if (ctx.simple) return;
  if (!ctx.settings.uiSounds) return;
  const a = hoverChannel();
  rewind(a, false);
  startPlaying(a);
}

export function onPointerOver(e: PointerEvent): void {
  const hand = e.pointerType === "mouse" && e.target instanceof Element
    && getComputedStyle(e.target).cursor.endsWith("pointer");
  if (hand && !handCursor) hoverSound();
  handCursor = hand;
}

export function resetHandCursor(): void {
  handCursor = false;
}

export function civJingleUrl(id: number | null): string {
  const legacy = ctx.settings.legacyJingles;
  if (id == null) return jingleUrl("random", legacy);
  const c = ctx.logic.CIVS[id];
  return jingleUrl(c.file, legacy && c.legacy);
}

export function jingle(id: number | null): void {
  if (ctx.settings.jingles) playUrl(civJingleUrl(id));
}

export function warmUp(): void {
  if (warmed) return;
  warmed = true;
  if (ctx.simple) return;
  for (const name of Object.keys(UI_SOUNDS) as UiSound[]) audioFor(uiUrl(name));
  hoverChannel();
}
