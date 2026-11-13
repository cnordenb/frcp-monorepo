import { ctx } from "../context.ts";
import { $, find, h } from "./domhelpers.ts";

const BUTTON_TEXTS: [id: string, text: string][] = [
  ["optionsBig", "Options"], ["techBtn", "Tech Tree"], ["shareBtn", "Copy Share Link"],
  ["poolShareBtn", "Copy Pool Link"],
];

function newTab(): HTMLElement[] {
  return [
    h("span", { className: "new-tab", "aria-hidden": "true" }, "↗"),
    h("span", { className: "sr-only" }, " (opens in a new tab)"),
  ];
}

function labelControls(): void {
  for (const [id, text] of BUTTON_TEXTS) {
    $(id).removeAttribute("aria-label");
    $(id).replaceChildren(text, ...(id === "techBtn" ? newTab() : []));
  }
  for (const a of document.querySelectorAll<HTMLAnchorElement>("a[target='_blank']")) {
    const text = a.querySelector(":scope > span") || a;
    if (a.hostname === "www.youtube.com") text.append(h("span", { className: "sr-only" }, " on YouTube"));
    text.append(...newTab());
  }
  find($("menu-civs"), "[data-act='techtree'] > span").append(...newTab());
  const remainingText = $("showRemainingLabel").lastChild;
  if (remainingText) remainingText.textContent = "Show remaining civs";
  $("enabledCount").setAttribute("aria-live", "polite");
  for (const id of ["drawnCount", "remainingCount"]) {
    $(id).setAttribute("role", "heading");
    $(id).setAttribute("aria-level", "2");
  }
  $("dlgMsg").setAttribute("aria-describedby", "msgText");
}

function nameCopyButtons(): void {
  for (const row of document.querySelectorAll(".share-row")) {
    const label = find(row, "label");
    const button = find(row, "[data-copy]");
    label.id = "label-" + button.dataset.copy;
    button.id = "copy-" + button.dataset.copy;
    button.setAttribute("aria-labelledby", `${button.id} ${label.id}`);
  }
}

function describeFields(): void {
  const lobbyHint = find(document, "#dlgLobby .hint");
  lobbyHint.id = "lobbyHint";
  lobbyHint.textContent = "A lobby code has 6 to 12 digits, such as 123456789. "
    + "Age of Empires II: Definitive Edition must already be running.";
  $("lobbyCode").removeAttribute("placeholder");
  $("lobbyCode").dataset.hint = "lobbyHint";
  $("lobbyErr").textContent = "That isn't a lobby code. Type 6 to 12 digits, such as 123456789, "
    + "or a link such as aoe2de://0/123456789.";
  $("openHint").textContent = `A share link has #p= in it, such as ${ctx.platform.linkBase}#p=1Cg4QBAgiAl8.`;
  $("openInput").dataset.hint = "openHint";
  $("openErr").textContent = "That isn't a Fresh Random Civ Picker link. Paste a whole share link, with #p= in it.";
  for (const input of [$("lobbyCode"), $("openInput")]) {
    input.setAttribute("aria-describedby", input.dataset.hint ?? "");
  }
}

export function setUpSimple(): void {
  find(document, ".site-title").setAttribute("role", "banner");
  labelControls();
  nameCopyButtons();
  describeFields();
}
