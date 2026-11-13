import { ctx } from "../context.ts";
import { isOn } from "../model/currentstate.ts";
import { commit, saveSettings } from "../model/settingsstore.ts";
import { sfx } from "../sound/soundplayer.ts";
import { render } from "../view/renderpage.ts";
import { clearHistory, closeRound, pushUndo, snapshot } from "./drawing.ts";

function poolKey(): string {
  return ctx.state.edition + "|" + [...ctx.state.off].sort((a, b) => a - b).join(",");
}

function changePool(mutate: () => void): void {
  const before = poolKey();
  const snap = snapshot();
  mutate();
  ctx.logic.applyEdition(ctx.state);
  if (poolKey() === before) {
    render();
    return;
  }
  if (ctx.simple) pushUndo(snap);
  else clearHistory();
  if (ctx.settings.autoReset) closeRound();
  commit();
}

function setOn(ids: number[], on: boolean): void {
  for (const id of ids) {
    if (on) ctx.state.off.delete(id);
    else ctx.state.off.add(id);
  }
}

export function dlcIds(dlc: string): number[] {
  const { CIVS, inEdition } = ctx.logic;
  return CIVS.filter((c) => c.dlc === dlc && inEdition(c, ctx.state.edition)).map((c) => c.id);
}

function olderIds(ed: string): number[] {
  const { CIVS, EDITION_INFO } = ctx.logic;
  return CIVS.filter((c) => EDITION_INFO[ed].olderDlcs.includes(c.dlc)).map((c) => c.id);
}

export function toggleCiv(id: number): void {
  sfx("click");
  changePool(() => setOn([id], !isOn(id)));
}

export function toggleDlc(dlc: string): void {
  const ids = dlcIds(dlc);
  const on = !ids.some(isOn);
  sfx("button");
  changePool(() => setOn(ids, on));
}

export function toggleDlcSlot(i: number): void {
  const dlc = ctx.logic.EDITION_INFO[ctx.state.edition].dlcToggles[i];
  if (dlc) toggleDlc(dlc);
}

export function enableAll(): void {
  const { CIVS, inEdition } = ctx.logic;
  sfx("button");
  changePool(() => setOn(CIVS.filter((c) => inEdition(c, ctx.state.edition)).map((c) => c.id), true));
}

export function disableAll(): void {
  sfx("button");
  changePool(() => setOn(ctx.logic.CIVS.map((c) => c.id), false));
}

export function setEdition(ed: string): void {
  sfx("view");
  if (ed === ctx.state.edition) {
    render();
    return;
  }
  changePool(() => {
    ctx.state.edition = ed;
    ctx.logic.applyEdition(ctx.state);
    if (ctx.settings.autoToggle) setOn(olderIds(ed), true);
  });
}

export function toggleAutoToggle(): void {
  ctx.settings.autoToggle = !ctx.settings.autoToggle;
  saveSettings();
  sfx("button");
  changePool(() => setOn(olderIds(ctx.state.edition), ctx.settings.autoToggle));
}

export function toggleAutoReset(): void {
  ctx.settings.autoReset = !ctx.settings.autoReset;
  saveSettings();
  sfx("button");
  render();
}
