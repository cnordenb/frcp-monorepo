import type { Preset } from "../../core/logic.ts";
import { ctx } from "../context.ts";
import { msgBox } from "../dialogs/dialogbox.ts";
import { currentId } from "../model/currentstate.ts";
import { KEY_QUICK, PRESET_MAX_BYTES, VERSION } from "../model/hotkeytables.ts";
import { commit, storageGet, storageSet } from "../model/settingsstore.ts";
import type { PlatformKind } from "../platform.ts";
import { jingle, sfx } from "../sound/soundplayer.ts";
import { $ } from "../view/domhelpers.ts";
import { toast } from "../view/tooltips.ts";
import { beforeReplace } from "./drawing.ts";

const PLATFORM_LETTER: Record<PlatformKind, string> = { web: "w", desktop: "d", mobile: "a" };

function loadedSound(): void {
  if (ctx.settings.jingles) jingle(currentId());
  else sfx("button");
}

export function quicksave(): void {
  sfx("button");
  const saved = storageSet(KEY_QUICK, JSON.stringify(ctx.logic.serialiseState(ctx.state)));
  toast(saved ? "Quicksaved" : "Couldn't quicksave");
}

export function quickload(): void {
  const saved = ctx.logic.parseState(storageGet(KEY_QUICK));
  if (!saved) {
    sfx("error");
    toast("Nothing quicksaved yet");
    return;
  }
  beforeReplace();
  ctx.state = saved;
  commit();
  loadedSound();
  toast("Quickloaded");
}

export function presetFileName(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  const time = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `FRCP Preset v${VERSION}${PLATFORM_LETTER[ctx.platform.kind]} @${day} ${time}.txt`;
}

function tellHowSavingWent(saved: boolean | null): void {
  if (saved) {
    toast("Preset saved");
  } else if (saved === false) {
    sfx("error");
    msgBox("Preset not saved", "The preset couldn't be written to that file.");
  }
}

export function savePreset(): void {
  sfx("button");
  const saving = ctx.platform.savePreset(presetFileName(), ctx.logic.presetText(ctx.state, ctx.settings.fresh));
  if (ctx.platform.kind === "mobile") void saving.then(tellHowSavingWent);
}

export function loadPreset(): void {
  sfx("button");
  const input = $<HTMLInputElement>("presetFile");
  input.value = "";
  input.click();
}

async function readPreset(file: File): Promise<Preset | null> {
  try {
    return file.size <= PRESET_MAX_BYTES ? ctx.logic.parsePreset(await file.text()) : null;
  } catch {
    return null;
  }
}

export async function loadPresetFile(file: File): Promise<void> {
  const preset = await readPreset(file);
  if (!preset) {
    sfx("error");
    msgBox("Preset not recognised", `${file.name} isn't a Fresh Random Civ Picker preset, so nothing has changed.`);
    return;
  }
  beforeReplace();
  ctx.logic.applyPreset(ctx.state, preset);
  commit();
  loadedSound();
  toast("Preset loaded");
}
