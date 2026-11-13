import { runAction } from "../actions/actionmap.ts";
import { uiImageUrl } from "../assets.ts";
import { $, h } from "../view/domhelpers.ts";

function cssUrl(name: string): string {
  return `url("${uiImageUrl(name)}")`;
}

function historyButton(): HTMLElement {
  const button = h("button", {
    type: "button", className: "imgbtn sprite desk", id: "historyBtn", dataset: { on: "0" }, "aria-label": "History",
  });
  button.style.setProperty("--atlas", cssUrl("history_button"));
  button.addEventListener("click", () => runAction("history"));
  return button;
}

function sustainabilityButton(): HTMLElement {
  const button = h("button", {
    type: "button", className: "imgbtn desk", id: "sustainBtn", dataset: { on: "0", tipExt: "" },
    "aria-label": "Sustainability app",
  }, h("span", { className: "sustain-icon" }));
  button.style.setProperty("--icon", cssUrl("aoe2vils_button"));
  button.addEventListener("click", () => runAction("sustainability"));
  return button;
}

export function addDesktopButtons(): void {
  $("optionsBig").after(historyButton());
  $("techBtn").after(sustainabilityButton());
}
