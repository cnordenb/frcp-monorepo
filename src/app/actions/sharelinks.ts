import type { ShareLink } from "../../core/logic.ts";
import { ctx } from "../context.ts";
import { msgBox, openPreview, openShare } from "../dialogs/dialogbox.ts";
import { drawnIds, isOn } from "../model/currentstate.ts";
import { commit } from "../model/settingsstore.ts";
import { sfx } from "../sound/soundplayer.ts";
import { h } from "../view/domhelpers.ts";
import { toast } from "../view/tooltips.ts";
import { beforeReplace } from "./drawing.ts";

const SHARE_TITLE = "Fresh Random Civ Picker";

export function shareUrl(withDraws: boolean): string {
  return ctx.platform.linkBase + "#p=" + ctx.logic.shareCode(ctx.state, withDraws);
}

export function applyLink(link: ShareLink): void {
  beforeReplace();
  ctx.logic.applyLink(ctx.state, link);
  commit();
}

export function offerLink(link: ShareLink): void {
  if (!ctx.logic.hasContent(ctx.state)) {
    applyLink(link);
    toast("Loaded the shared link");
    return;
  }
  openPreview(link);
}

export function readHash(): string | null {
  const hash = location.hash;
  return hash.startsWith("#p=") ? hash.slice(3) : null;
}

export function clearHash(): void {
  history.replaceState(null, "", location.pathname + location.search);
}

export function handleLinkCode(code: string): void {
  const link = ctx.logic.parseShare(code);
  if (!link) {
    sfx("error");
    msgBox("Link not recognised", "This link isn't a valid Fresh Random Civ Picker link, so nothing has changed.");
    return;
  }
  offerLink(link);
}

function copyThroughTextarea(text: string): boolean {
  const ta = h("textarea", { value: text, readOnly: true, style: { position: "fixed", opacity: "0" } });
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyThroughTextarea(text);
  }
}

export async function copyShareLink(withDraws = true): Promise<void> {
  sfx("button");
  const n = withDraws ? drawnIds().filter(isOn).length : 0;
  const url = shareUrl(withDraws);
  if (await ctx.platform.shareLink(url, SHARE_TITLE)) return;
  const copied = n ? `Link copied: civ pool + ${n} drawn civ${n === 1 ? "" : "s"}` : "Link copied: civ pool";
  if (await copyText(url)) toast(copied);
  else openShare();
}
