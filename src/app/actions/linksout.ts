import { ctx } from "../context.ts";
import { msgBox } from "../dialogs/dialogbox.ts";
import { currentCiv } from "../model/currentstate.ts";
import { sfx } from "../sound/soundplayer.ts";

export const SUSTAINABILITY_APP = "https://aoe2vils.net/";

export function techTreeUrl(): string {
  const c = currentCiv();
  return "https://aoe2techtree.net/" + (c ? "#" + c.techTree : "");
}

export function openTechTree(): void {
  sfx("button");
  ctx.platform.openUrl(techTreeUrl());
}

export function openSustainabilityApp(): void {
  sfx("button");
  ctx.platform.openUrl(SUSTAINABILITY_APP);
}

export function openEditionPage(): void {
  sfx("button");
  const info = ctx.logic.EDITION_INFO[ctx.state.edition];
  if (info.url) ctx.platform.openUrl(info.url);
  else msgBox(info.short, info.storeNote ?? "");
}

export function lobbyUrl(text: string, spectate: boolean): string | null {
  const m = /^(?:aoe2de:\/\/[01]\/)?(\d{6,12})$/i.exec(text.trim());
  return m ? `aoe2de://${spectate ? 1 : 0}/${m[1]}` : null;
}
