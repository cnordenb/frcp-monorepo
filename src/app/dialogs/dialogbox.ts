import type { ShareLink } from "../../core/logic.ts";
import { shareUrl } from "../actions/sharelinks.ts";
import { ctx } from "../context.ts";
import { drawnIds, isOn } from "../model/currentstate.ts";
import { preload } from "../sound/loadahead.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $ } from "../view/domhelpers.ts";
import { closeMenus } from "../view/pagemenus.ts";
import { hideTip } from "../view/tooltips.ts";

let pendingLink: ShareLink | null = null;

export function anyDialogOpen(): boolean {
  return document.querySelector("dialog[open]") !== null;
}

export function showDialog(d: HTMLDialogElement): void {
  hideTip();
  closeMenus();
  preload("ui/button_pressed");
  if (!d.open) d.showModal();
}

export function closeDialog(d: HTMLDialogElement): void {
  sfx("button");
  d.close();
}

export function msgBox(title: string, text: string): void {
  $("msgTitle").textContent = title;
  $("msgText").textContent = text;
  showDialog($("dlgMsg"));
}

function openPlain(dialog: string): void {
  sfx("button");
  showDialog($(dialog));
}

export function openAbout(): void {
  openPlain("dlgAbout");
}

export function openHelp(): void {
  openPlain("dlgHelp");
}

export function showFieldError(input: HTMLElement, err: HTMLElement): void {
  err.hidden = false;
  if (!ctx.simple) return;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", [err.id, input.dataset.hint].filter(Boolean).join(" "));
  input.focus();
}

export function clearFieldError(input: HTMLElement, err: HTMLElement): void {
  err.hidden = true;
  if (!ctx.simple) return;
  input.removeAttribute("aria-invalid");
  if (input.dataset.hint) input.setAttribute("aria-describedby", input.dataset.hint);
  else input.removeAttribute("aria-describedby");
}

function openField(dialog: string, input: string, err: string): void {
  sfx("button");
  $<HTMLInputElement>(input).value = "";
  clearFieldError($(input), $(err));
  showDialog($(dialog));
}

export function openLobby(): void {
  openField("dlgLobby", "lobbyCode", "lobbyErr");
}

export function openShare(): void {
  $<HTMLInputElement>("sharePool").value = shareUrl(false);
  $<HTMLInputElement>("shareRound").value = shareUrl(true);
  $("shareStatus").textContent = "";
  const n = drawnIds().filter(isOn).length;
  $("shareNote").textContent = n
    ? `The second link also carries the ${n} civ${n === 1 ? "" : "s"} drawn this round, in order.`
    : "Nothing has been drawn this round, so both links are the same.";
  sfx("button");
  showDialog($("dlgShare"));
}

export function openLinkDialog(): void {
  openField("dlgOpen", "openInput", "openErr");
}

export function openPreview(link: ShareLink): void {
  const { CIVS, DISPLAY_ORDER, EDITION_INFO, editionTotal, inEdition } = ctx.logic;
  pendingLink = link;
  const enabled = CIVS.filter((c) => link.enabled[c.id]).length;
  const out = DISPLAY_ORDER.filter((c) => inEdition(c, link.edition) && !link.enabled[c.id]).map((c) => c.name);
  $("pvEdition").textContent = EDITION_INFO[link.edition].name;
  $("pvPool").textContent = `${enabled} of ${editionTotal(link.edition)} civs`
    + (out.length && out.length <= 12 ? `. Left out: ${out.join(", ")}` : "");
  $("pvRound").textContent = link.draws.length
    ? `${link.draws.length} drawn: ${link.draws.map((id) => CIVS[id].name).join(", ")}`
    : "Nothing drawn. Loading the link starts a new round.";
  showDialog($("dlgPreview"));
}

export function takePendingLink(): ShareLink | null {
  const link = pendingLink;
  pendingLink = null;
  return link;
}
