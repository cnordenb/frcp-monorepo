import { techTreeUrl } from "../actions/linksout.ts";
import { $, find, h } from "../view/domhelpers.ts";

const WEB_VERSION = "https://frcp.net/";
const SAVED_WHERE = "Custom civ pool, draw log and user settings are saved on this device only. Share links carry a "
  + "copy of the custom civ pool, and optionally of this round's draws.";
const SHARE_ROUND = "Share a link to this civ pool and this round's draws";
const SHARE_POOL = "Share a link to this civ pool";

function actionItem(text: string, act: string): HTMLElement {
  return h("button", { type: "button", role: "menuitem", dataset: { act } }, h("span", {}, text));
}

function techTreeItem(): HTMLElement {
  const item = h("a", {
    role: "menuitem", href: techTreeUrl(), target: "_blank", rel: "noopener", dataset: { act: "techtree" },
  }, h("span", {}, "Tech Tree ..."));
  item.addEventListener("click", (e) => e.preventDefault());
  return item;
}

function setUpMobileMenu(): void {
  const menu = $("menu-mobile");
  menu.prepend(actionItem("Open Link ...", "openLink"));
  find(menu, '[data-act="options"]').before(techTreeItem());
}

function showMobileAbout(): void {
  const [version, created, saved] = document.querySelectorAll<HTMLElement>("#dlgAbout .about > p");
  const kind = [...version.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  const [author, desktopApp] = created.querySelectorAll("a");
  if (kind) kind.textContent = ", Android version ";
  created.replaceChildren(
    "Created by Carl Nordenbrink, alias ", author, ". Also available on the web at ",
    h("a", { href: WEB_VERSION, target: "_blank", rel: "noopener" }, "frcp.net"), " and as a ", desktopApp, ".");
  saved.textContent = SAVED_WHERE;
}

export function setUpMobile(): void {
  setUpMobileMenu();
  showMobileAbout();
  find($("optForm"), 'fieldset:has(input[name="drawOnLoad"]) > legend').textContent = "When the app opens";
  $("shareBtn").setAttribute("aria-label", SHARE_ROUND);
  $("poolShareBtn").setAttribute("aria-label", SHARE_POOL);
}
