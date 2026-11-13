import { type Page, type PageOptions, openPage } from "../page/browser-page.ts";
import { type Browser, CHROME, type Site, launch, serveSite } from "../page/chrome.ts";
import { CHECKS } from "./checks/page-checks.ts";

export const TWO_ROUNDS = {
  v: 1,
  edition: "DE",
  disabled: [3, 7],
  log: [[[1, 1, 54], [5, 2, 54]], [[10, 1, 54], [20, 2, 54], [30, 3, 54]]],
};
export const PHONE = { width: 375, height: 667, mobile: true };
export const SMALL_PHONE = { width: 320, height: 568, mobile: true };
export const ZOOMED_400 = { width: 320, height: 256, mobile: true };

export const pageErrors: string[] = [];

let browser: Browser | null = null;
let site: Site | null = null;

export async function startBrowser(): Promise<boolean> {
  if (!CHROME) return false;
  site = await serveSite();
  browser = await launch(CHROME);
  return true;
}

export async function stopBrowser(): Promise<void> {
  await browser?.close();
  site?.close();
}

export async function open(opts: PageOptions = {}): Promise<Page> {
  if (!browser || !site) throw new Error("the browser has not started");
  const page = await openPage(browser, site.base, { url: "/simple/", storage: { "frcp.state": TWO_ROUNDS }, ...opts });
  await page.eval(CHECKS);
  return page;
}

export async function done(page: Page): Promise<void> {
  pageErrors.push(...page.errors);
  await page.close();
}

export async function walk<T>(opts: PageOptions, steps: (page: Page) => Promise<T>): Promise<T> {
  const page = await open(opts);
  try {
    return await steps(page);
  } finally {
    await done(page);
  }
}

export const active = (page: Page): Promise<string> => page.eval("wcag.describe(document.activeElement)");
export const drawnCount = (page: Page): Promise<string> =>
  page.eval(`document.getElementById("roundCounter").textContent`);
export const menuOpen = (page: Page): Promise<boolean> =>
  page.eval(`document.querySelectorAll("#menubar .menu-list:not([hidden])").length > 0`);
export const happens = (page: Page, expression: string): Promise<boolean> =>
  page.waitFor(expression).then(
    () => true,
    () => false,
  );
export const centre = (selector: string): string => `(() => {
  const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, bottom: r.bottom };
})()`;
export const menuTitle = (name: string): string =>
  `[...document.querySelectorAll("#menubar .menu-title")].find((t) => t.textContent === ${JSON.stringify(name)})`;
export const clickMenuTitle = (name: string): string => `${menuTitle(name)}.click()`;
