import { SUSTAINABILITY_APP } from "../actions/linksout.ts";
import { ctx } from "../context.ts";
import { $, find, h } from "../view/domhelpers.ts";

const STATS = "https://aoestats.io/";
const REPOSITORY = "https://github.com/cnordenb/Fresh-Random-Civ-Picker";
const WEB_VERSION = "https://frcp.net/";
const DISCORD = "https://discord.gg/rcFqrBdVUN";
const UPDATES = "https://github.com/cnordenb/Fresh-Random-Civ-Picker/releases";

function actionItem(text: string, act: string): HTMLElement {
  return h("button", { type: "button", role: "menuitem", dataset: { act } },
    h("span", {}, text), h("kbd", { dataset: { key: act } }));
}

function linkItem(text: string, href: string, key = ""): HTMLElement {
  const shortcut = key ? h("kbd", { dataset: { key } }) : h("kbd");
  return h("a", { role: "menuitem", href, target: "_blank", rel: "noopener" }, h("span", {}, text), shortcut);
}

function renameItem(menu: HTMLElement, act: string, text: string): void {
  find(menu, `[data-act="${act}"] > span`).textContent = text;
}

function gameLinks(): HTMLElement[] {
  const { EDITIONS, EDITION_INFO } = ctx.logic;
  const links = EDITIONS.flatMap((ed) => EDITION_INFO[ed].links ?? []);
  return links.map((link) => linkItem(link.text + " ...", link.url));
}

export function setUpDesktopMenus(): void {
  const civs = $("menu-civs");
  $("menu-file").append(h("hr"), actionItem("Exit", "quit"));
  renameItem(civs, "undo", "Undraw");
  renameItem(civs, "redo", "Redraw");
  civs.append(linkItem("Stats ...", STATS));
  $("menu-game").replaceChildren(
    ...gameLinks(), linkItem("Sustainability App ...", SUSTAINABILITY_APP, "sustainability"));
  $("menu-frcp").replaceChildren(
    linkItem("GitHub Repository ...", REPOSITORY), linkItem("Web Version ...", WEB_VERSION),
    linkItem("Discord Server ...", DISCORD));
  find($("menu-help"), '[data-act="about"]').before(linkItem("Check for Updates ...", UPDATES));
}
