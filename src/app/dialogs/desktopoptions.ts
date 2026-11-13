import { ctx } from "../context.ts";
import { saveSettings } from "../model/settingsstore.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $, find, h } from "../view/domhelpers.ts";

export const START_LOG = "startLog";
const KEEP = "keep";
const RESET = "reset";

function radioRow(value: string, text: string): HTMLElement {
  return h("label", { className: "row" }, h("input", { type: "radio", name: START_LOG, value }), text);
}

function customiseButton(): HTMLElement {
  return h("button", { type: "button", className: "btn", dataset: { act: "customise" } }, "Customise");
}

export function setUpDesktopOptions(): void {
  const form = $("optForm");
  const start = find(form, 'fieldset:has(input[name="drawOnLoad"])');
  const keys = find(form, 'fieldset:has(select[name="hotkeys"])');
  find(start, "legend").textContent = "When the program starts";
  find(start, 'label:has(input[name="newRoundOnVisit"])').hidden = true;
  find(start, ".hint").hidden = true;
  start.append(radioRow(KEEP, "Automatic civ pool logging"), radioRow(RESET, "Reset civ pool on startup"));
  find(keys, 'label:has(select[name="hotkeys"])').hidden = true;
  find(keys, '[data-act="hotkeys"]').after(customiseButton());
  $("modeHint").hidden = true;
}

export function syncDesktopOptions(): void {
  const chosen = ctx.settings.resetOnStart ? RESET : KEEP;
  for (const radio of $("optForm").querySelectorAll<HTMLInputElement>(`input[name="${START_LOG}"]`)) {
    radio.checked = radio.value === chosen;
  }
}

export function changeStartLog(value: string): void {
  sfx("button");
  ctx.settings.resetOnStart = value === RESET;
  saveSettings();
}
