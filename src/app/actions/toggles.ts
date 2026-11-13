import { ctx } from "../context.ts";
import { syncOptions } from "../dialogs/optionsdialog.ts";
import { currentId } from "../model/currentstate.ts";
import { type BoolSetting, saveSettings } from "../model/settingsstore.ts";
import { preload } from "../sound/loadahead.ts";
import { jingle, playUrl, sfx, uiUrl } from "../sound/soundplayer.ts";
import { render } from "../view/renderpage.ts";

const TAB_IMAGES = [
  [],
  ["ui/scrollbar_3slice", "ui/scrollbar_knob", "ui/button_pressed", "ui/button_pressed_9slice", "civ/civicon_atlas"],
  ["ui/button_pressed", "ui/button_pressed_9slice"],
];

export function toggleSetting(key: BoolSetting): void {
  sfx("button");
  ctx.settings[key] = !ctx.settings[key];
  saveSettings();
  render();
  syncOptions();
}

export function setJingles(on: boolean): void {
  ctx.settings.jingles = on;
  saveSettings();
  if (on) jingle(currentId());
  else playUrl(uiUrl("mute"));
  render();
  syncOptions();
}

export function setUiSounds(on: boolean): void {
  ctx.settings.uiSounds = on;
  saveSettings();
  if (on) sfx("button");
  else playUrl(uiUrl("mute"));
  syncOptions();
}

export function setTab(i: number): void {
  if (i === ctx.ui.tab) return;
  ctx.ui.tab = i;
  sfx("tab");
  preload(...TAB_IMAGES[i]);
  render();
  ctx.els.panel.scrollTop = 0;
  const focused = document.activeElement;
  if (ctx.simple && focused && focused !== document.body && !focused.checkVisibility()) ctx.els.tabs[i].focus();
}
