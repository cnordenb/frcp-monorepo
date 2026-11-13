import type { Page, PageOptions } from "../../page/browser-page.ts";
import { sleep } from "../../page/chrome.ts";
import type { FocusFound } from "../checks/page-checks.ts";
import { PHONE, ZOOMED_400, drawnCount, menuOpen, menuTitle, walk } from "../simple-pages.ts";

const FOCUSED = `(() => {
  const el = document.activeElement;
  return el.id || (el.querySelector("span")?.firstChild ?? el).textContent.trim();
})()`;
const FIRST_TITLE = `document.querySelector("#menubar .menu-title")`;
const HELP_OPEN = `document.getElementById("dlgHelp").open`;
const TAB_SHOWN = `document.getElementById("client").dataset.tab`;
const EXPANSIONS_BEFORE_CIVS = `!!(document.querySelector('[data-edition="DE"]')
  .compareDocumentPosition(document.getElementById("civGrid")) & Node.DOCUMENT_POSITION_FOLLOWING)`;
const TURN_CHAR_KEYS_OFF = `document.querySelector('[name="charKeys"]').click();
  document.querySelector("#optForm [type=submit]").click();
  document.activeElement.blur()`;
const SINGLE_KEY = /^([A-Z0-9?]|Space)$/;
const FEWEST_STOPS = 8;
const MOST_TAB_PRESSES = 150;
const SIZES: [name: string, opts: PageOptions][] = [
  ["1280 px", { width: 1280, height: 900 }],
  ["320 px", ZOOMED_400],
  ["a 375 x 667 phone", PHONE],
];

async function keys(page: Page, ...names: string[]): Promise<string> {
  for (const name of names) await page.key(name);
  return page.eval<string>(FOCUSED);
}

async function keysFromTheDrawCivTab(page: Page, ...names: string[]): Promise<string> {
  await page.key("Escape");
  await page.eval(`document.getElementById("tab-0").focus()`);
  return keys(page, ...names);
}

export async function menuKeys(page: Page): Promise<Record<string, unknown>> {
  await page.eval(`${FIRST_TITLE}.focus()`);
  return {
    enterOpensFileAtItsFirstItem: await keys(page, "Enter"),
    fileSaysItIsOpen: await page.eval(`${FIRST_TITLE}.getAttribute("aria-expanded")`),
    downMovesThroughTheItems: await keys(page, "ArrowDown", "ArrowDown"),
    endGoesToTheLastItem: await keys(page, "End"),
    homeGoesToTheFirstItem: await keys(page, "Home"),
    upFromTheFirstItemGoesToTheLast: await keys(page, "ArrowUp"),
    rightOpensTheNextMenu: await keys(page, "ArrowRight"),
    escapeGoesBackToTheTitle: await keys(page, "Escape"),
    menuOpenAfterEscape: await menuOpen(page),
    tabLeavesTheMenuForTheNextTitle: await keys(page, "ArrowDown", "Tab"),
    menuOpenAfterTab: await menuOpen(page),
    upOpensAMenuAtItsLastItem: await keys(page, "ArrowUp"),
    endOnTheTabsGoesToCivPool: await keysFromTheDrawCivTab(page, "End"),
    tabShownAfterEnd: await page.eval(TAB_SHOWN),
    homeOnTheTabsGoesToDrawCiv: await keys(page, "Home"),
  };
}

export async function focusOrder(page: Page): Promise<Record<string, unknown>> {
  await page.eval(`${menuTitle("Help")}.focus()`);
  const spaceOpensHelpAtItsFirstItem = await keys(page, " ");
  await page.key("Enter");
  const helpOpens = await page.eval(HELP_OPEN);
  const helpStartsAtItsHeading = await keys(page);
  await page.key("Escape");
  await sleep(30);
  const helpOpenAfterEscape = await page.eval(HELP_OPEN);
  const focusComesBackTo = await keys(page);
  await page.eval(`document.getElementById("drawBtn").focus()`);
  const hotkey3TakesFocusTo = await keys(page, "3");
  const expansionsComeBeforeCivs = await page.eval(EXPANSIONS_BEFORE_CIVS);
  return {
    spaceOpensHelpAtItsFirstItem,
    helpOpens,
    helpStartsAtItsHeading,
    helpOpenAfterEscape,
    focusComesBackTo,
    hotkey3TakesFocusTo,
    expansionsComeBeforeCivs,
  };
}

async function tabStops(page: Page, tab: number): Promise<FocusFound[]> {
  await page.eval(`document.getElementById("tab-${tab}").click(); document.activeElement.blur(); scrollTo(0, 0)`);
  const stops: FocusFound[] = [];
  for (let i = 0; i < MOST_TAB_PRESSES; i++) {
    await page.key("Tab");
    const stop = await page.eval<FocusFound | null>("wcag.focus()");
    if (!stop) continue;
    if (stop.el === stops[0]?.el) break;
    stops.push(stop);
  }
  return stops;
}

async function focusProblemsAt(size: string, opts: PageOptions): Promise<string[]> {
  return walk(opts, async (page) => {
    const problems: string[] = [];
    for (const tab of [0, 1, 2]) {
      const stops = await tabStops(page, tab);
      if (stops.length <= FEWEST_STOPS) problems.push(`tab ${tab} has only ${stops.length} Tab stops`);
      problems.push(...stops.flatMap((stop) => stop.problems));
    }
    return problems.map((problem) => `${size}: ${problem}`);
  });
}

export async function focusProblems(): Promise<string[]> {
  return (await Promise.all(SIZES.map(([size, opts]) => focusProblemsAt(size, opts)))).flat();
}

export async function charKeys(page: Page): Promise<Record<string, unknown>> {
  await page.eval(`document.activeElement.blur()`);
  const before = await drawnCount(page);
  await page.key(" ");
  const spaceDrawsWhileTheyAreOn = (await drawnCount(page)) !== before;
  await page.key("z", { ctrl: true });
  await page.eval(`document.querySelector('[data-act="options"]').click()`);
  const optionsShowsTheSwitch = await page.eval(`wcag.visible(document.querySelector('[name="charKeys"]'))`);
  await page.eval(TURN_CHAR_KEYS_OFF);
  for (const key of [" ", "2", "o"]) await page.key(key);
  const spaceDrawsWhenOff = (await drawnCount(page)) !== before;
  const tabShownAfter2 = await page.eval(TAB_SHOWN);
  const optionsOpenAfterO = await page.eval(`document.getElementById("dlgOptions").open`);
  await page.key("F2");
  const f2StillOpensHotkeys = await page.eval(`document.getElementById("dlgHotkeys").open`);
  const listed = await page.eval<string[]>(`[...document.querySelectorAll("#hkGrid kbd")].map((k) => k.textContent)`);
  await page.key("Escape");
  return {
    spaceDrawsWhileTheyAreOn,
    optionsShowsTheSwitch,
    spaceDrawsWhenOff,
    tabShownAfter2,
    optionsOpenAfterO,
    f2StillOpensHotkeys,
    singleKeysListedInHotkeys: listed.filter((key) => SINGLE_KEY.test(key)),
    copyLinkKeyShownInTheMenu: await page.eval(`document.querySelector('kbd[data-key="copyLink"]').textContent`),
  };
}
