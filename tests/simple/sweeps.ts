import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page, PageOptions } from "../page/browser-page.ts";
import { sleep } from "../page/chrome.ts";
import { PHONE, SMALL_PHONE, ZOOMED_400, clickMenuTitle, done, open } from "./simple-pages.ts";

type Check = "targets" | "contrast" | "reflow" | "overlaps" | "visualPresentation" | "newTabs";

interface Sweep {
  name: string;
  opts: PageOptions;
  checks: Check[];
  axe?: boolean;
  text?: boolean;
  spacing?: boolean;
  font?: string;
}

const AXE = readFileSync(path.join(import.meta.dirname, "vendor", "axe.min.js"), "utf8");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag2aaa", "wcag21a", "wcag21aa", "wcag22aa"];
const RUN_AXE = `axe.run(document, { runOnly: { type: "tag", values: ${JSON.stringify(AXE_TAGS)} } })
  .then((r) => r.violations.map((v) => v.id + ": " + v.nodes.map((n) => n.target.join(" ")).join(", ")))`;
const VISIBLE_TEXT = `[...document.querySelectorAll("p, li, dd, dt, label, legend, h1, h2, h3, button, a, .label")]
  .filter((e) => wcag.visible(e)).map((e) => e.innerText.trim())`;
const LOADED_FILES = `performance.getEntriesByType("resource").map((e) => e.name)`;
const MEDIA_FILE = /\.(webp|png|jpe?g|gif|svg|webm|mp3|ogg)(\?|$)/;

const UNTIL_DIALOG = `new Promise((ok, fail) => {
  const end = Date.now() + 3000;
  const late = () => fail(new Error("no dialog opened"));
  const t = () => (document.querySelector("dialog[open]") ? ok() : Date.now() > end ? late() : setTimeout(t, 20));
  t();
})`;
const SHARED_LINK_PREVIEW = `(async () => {
  document.querySelector('[data-act="share"]').click();
  const link = document.getElementById("shareRound").value;
  document.querySelector("dialog[open]").close();
  location.hash = link.split("#")[1];
  await ${UNTIL_DIALOG};
})()`;
const LOBBY_CODE_ERROR = `(() => {
  document.querySelector('[data-act="lobby"]').click();
  document.getElementById("lobbyCode").value = "abc";
  document.querySelector('#lobbyForm [value="join"]').click();
})()`;
const RESET = `(() => {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  document.getElementById("tab-0").click();
})()`;

const TABS = ["Draw Civ", "Log", "Civ Pool"];
const MENUS = ["File", "Lobbies", "Civs", "Game", "FRCP", "Help"];
const DIALOGS = ["options", "hotkeys", "about", "help", "lobby", "share", "openLink"];
const clickAction = (act: string): string => `document.querySelector('[data-act="${act}"]').click()`;
const STATES: [name: string, show: string][] = [
  ...TABS.map((tab, i): [string, string] => [`the ${tab} tab`, `document.getElementById("tab-${i}").click()`]),
  ...MENUS.map((menu): [string, string] => [`the ${menu} menu`, clickMenuTitle(menu)]),
  ...DIALOGS.map((act): [string, string] => [`the ${act} dialog`, clickAction(act)]),
  ["a message box", `location.hash = "#p=nonsense"; ${UNTIL_DIALOG}`],
  ["the shared link preview", SHARED_LINK_PREVIEW],
  ["a lobby code error", LOBBY_CODE_ERROR],
];

const DESKTOP = { width: 1280, height: 900 };
const ZOOMED_200 = { width: 640, height: 512 };
const NARROWEST_WIDE = { width: 720, height: 600 };
const WIDE_FONT = "Verdana, 'DejaVu Sans', sans-serif";
const ALL: Check[] = ["targets", "contrast", "reflow", "overlaps", "visualPresentation", "newTabs"];
const LAYOUT: Check[] = ["targets", "reflow", "overlaps"];
const spaced = (name: string, opts: PageOptions, font?: string): Sweep => ({
  name: `${name} with ${font ? "a wide font and " : ""}text spacing`,
  opts,
  checks: LAYOUT,
  spacing: true,
  font,
});
const SWEEPS: Sweep[] = [
  { name: "1280 px", opts: DESKTOP, axe: true, checks: ALL, text: true },
  { name: "1280 px, dark", opts: { ...DESKTOP, dark: true }, axe: true, checks: ["contrast"] },
  { name: "640 px", opts: ZOOMED_200, axe: true, checks: ["targets", "reflow", "overlaps", "visualPresentation"] },
  { name: "320 px", opts: ZOOMED_400, axe: true, checks: ["targets", "contrast", "reflow", "overlaps"] },
  { name: "375 x 667 phone", opts: PHONE, axe: true, checks: ALL.filter((check) => check !== "newTabs") },
  spaced("1280 px", DESKTOP),
  spaced("640 px", ZOOMED_200),
  spaced("320 px", ZOOMED_400),
  spaced("320 x 568 phone", SMALL_PHONE),
  spaced("720 px", NARROWEST_WIDE, WIDE_FONT),
  spaced("640 px", ZOOMED_200, WIDE_FONT),
  spaced("320 px", ZOOMED_400, WIDE_FONT),
  spaced("320 x 568 phone", SMALL_PHONE, WIDE_FONT),
];

export const found: Record<Check | "unopened" | "axe", string[]> = {
  unopened: [],
  axe: [],
  targets: [],
  contrast: [],
  reflow: [],
  overlaps: [],
  visualPresentation: [],
  newTabs: [],
};
export const seenText = new Set<string>();
const loaded = new Set<string>();

export const loadedMedia = (): string[] => [...loaded].filter((url) => MEDIA_FILE.test(url));

async function measure(page: Page, sweep: Sweep, where: string): Promise<void> {
  const at = (problem: string): string => `${where}: ${problem}`;
  if (sweep.spacing) await page.eval("wcag.textSpacing(true)");
  if (sweep.axe) found.axe.push(...(await page.eval<string[]>(RUN_AXE)).map(at));
  for (const check of sweep.checks) found[check].push(...(await page.eval<string[]>(`wcag.${check}()`)).map(at));
  if (sweep.text) for (const text of await page.eval<string[]>(VISIBLE_TEXT)) seenText.add(text);
  if (sweep.spacing) await page.eval("wcag.textSpacing(false)");
}

async function useFont(page: Page, font: string): Promise<void> {
  const rule = `[data-simple] { --ui: ${font}; }`;
  await page.eval(`document.head.append(Object.assign(document.createElement("style"), { textContent: "${rule}" }))`);
}

async function runSweep(sweep: Sweep): Promise<void> {
  const page = await open(sweep.opts);
  if (sweep.axe) await page.eval(AXE);
  if (sweep.font) await useFont(page, sweep.font);
  for (const [state, show] of STATES) {
    const where = `${sweep.name}, ${state}`;
    await page.eval(RESET);
    const failure = await page.eval(show).then(
      () => null,
      (error: Error) => error.message,
    );
    if (failure !== null) {
      found.unopened.push(`${where}: ${failure}`);
      continue;
    }
    await sleep(60);
    await measure(page, sweep, where);
  }
  if (sweep.text) for (const name of await page.eval<string[]>(LOADED_FILES)) loaded.add(name);
  await done(page);
}

export async function runSweeps(): Promise<void> {
  await Promise.all(SWEEPS.map(runSweep));
}
