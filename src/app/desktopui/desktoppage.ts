import { openSustainabilityApp } from "../actions/linksout.ts";
import { type Actions, ctx } from "../context.ts";
import { buildCustomise, openCustomise } from "../dialogs/customisedialog.ts";
import { setUpDesktopOptions } from "../dialogs/desktopoptions.ts";
import { openHistory } from "../history/historydialog.ts";
import { find, h } from "../view/domhelpers.ts";
import { addDesktopButtons } from "./desktopbuttons.ts";
import { setUpDesktopMenus } from "./desktopmenus.ts";

const AUTHOR = "https://linktr.ee/hjoerleif";
const WEB_VERSION = "https://frcp.net/";
const SAVED_WHERE = "Custom civ pool, draw log and user settings are saved on this computer.";

function desktopActions(): Actions {
  return {
    quit: () => ctx.platform.quit(),
    sustainability: openSustainabilityApp,
    history: openHistory,
    customise: openCustomise,
  };
}

function outsideLink(text: string, href: string): HTMLElement {
  return h("a", { href, target: "_blank", rel: "noopener" }, text);
}

function showDesktopAbout(): void {
  const [version, created, saved] = document.querySelectorAll<HTMLElement>("#dlgAbout .about > p");
  const kind = [...version.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (kind) kind.textContent = ", desktop version ";
  created.replaceChildren(
    "Created by Carl Nordenbrink, alias ", outsideLink("Hjörleif", AUTHOR), ". Also available as a ",
    outsideLink("web version", WEB_VERSION), ".");
  saved.textContent = SAVED_WHERE;
}

export function setUpDesktop(): void {
  Object.assign(ctx.actions, desktopActions());
  setUpDesktopMenus();
  addDesktopButtons();
  setUpDesktopOptions();
  document.body.append(buildCustomise());
  showDesktopAbout();
  find(document, "#dlgHotkeys #hkMode").hidden = true;
}
