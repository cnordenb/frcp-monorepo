import type { Page, Point } from "../../page/browser-page.ts";
import { sleep } from "../../page/chrome.ts";
import { active, centre, clickMenuTitle, drawnCount, happens, menuOpen } from "../simple-pages.ts";

interface Tip {
  shown: boolean;
  top: number;
  x: number;
  y: number;
}

interface OpenMenu {
  inside: boolean;
  reachable: boolean;
}

const TIP = `(() => {
  const t = document.getElementById("tip");
  const r = t.getBoundingClientRect();
  return { shown: !t.hidden, top: r.top, x: r.left + 10, y: r.top + r.height / 2 };
})()`;
const FOCUS_BEFORE_DRAW = `(() => {
  const n = document.getElementById("civName");
  n.tabIndex = -1;
  n.focus();
  n.removeAttribute("tabindex");
})()`;
const DRAW_DESCRIPTION = `document.getElementById(
  document.getElementById("drawBtn").getAttribute("aria-describedby")).textContent`;
const COUNTER = `document.getElementById("roundCounter").textContent`;
const PAGE_SCROLLS = `document.documentElement.scrollHeight > document.documentElement.clientHeight + 1`;
const PLACES = `[".tabstrip", "#panel", "#toast"].map((s) => {
  const r = document.querySelector(s).getBoundingClientRect();
  return s + " " + Math.round(r.top) + "+" + Math.round(r.height);
}).join(", ")`;
const PANEL_OVERFLOW = `(() => {
  const p = document.getElementById("panel");
  return p.scrollHeight > p.clientHeight && getComputedStyle(p).overflowY;
})()`;
const OPEN_MENU = `(() => {
  const l = document.querySelector("#menubar .menu-list:not([hidden])");
  const r = l.getBoundingClientRect();
  const c = document.getElementById("client").getBoundingClientRect();
  return {
    inside: r.top >= c.top - 1 && r.bottom <= c.bottom + 1 && r.left >= c.left - 1 && r.right <= c.right + 1,
    reachable: l.scrollHeight <= l.clientHeight + 1 || getComputedStyle(l).overflowY === "auto",
  };
})()`;
const WHOLE_PAGE_SCROLLS = `document.documentElement.scrollHeight > 1000
  && getComputedStyle(document.getElementById("panel")).overflowY === "visible"`;
const MENUS = ["File", "Lobbies", "Civs", "Game", "FRCP", "Help"];
const showTab = (tab: number): string => `document.getElementById("tab-${tab}").click()`;
const isVisible = (id: string): string => `wcag.visible(document.getElementById("${id}"))`;

export async function tooltips(page: Page): Promise<Record<string, unknown>> {
  const box = await page.eval<Point & { bottom: number }>(centre("#drawBtn"));
  const tip = (): Promise<Tip> => page.eval<Tip>(TIP);
  const shownAfter = async (...path: [number, number][]): Promise<boolean> => {
    for (const [x, y] of path) await page.move(x, y);
    return (await tip()).shown;
  };
  await page.move(box.x, box.y);
  const first = await tip();
  const pointerCanMoveOntoIt = await shownAfter([box.x, box.bottom - 1], [first.x, first.y]);
  await page.move(box.x, box.y);
  await page.key("Escape");
  const shownAfterEscape = (await tip()).shown;
  const shownWhileThePointerStays = await shownAfter([box.x + 3, box.y + 1]);
  const comesBackWhenThePointerReturns = await shownAfter([5, 5], [box.x, box.y]);
  await page.move(5, 5);
  await page.eval(FOCUS_BEFORE_DRAW);
  await page.key("Tab");
  return {
    hoverShowsIt: first.shown,
    itTouchesTheButton: Math.abs(first.top - box.bottom) < 1.5,
    pointerCanMoveOntoIt,
    shownAfterEscape,
    shownWhileThePointerStays,
    comesBackWhenThePointerReturns,
    tabFocusesDraw: /drawBtn/.test(await active(page)),
    focusShowsIt: (await tip()).shown,
    itDescribesDraw: /Draws a civ/.test(await page.eval<string>(DRAW_DESCRIPTION)),
  };
}

export async function phoneGestures(page: Page): Promise<Record<string, unknown>> {
  const before = await drawnCount(page);
  const panel = await page.eval<Point>(centre("#panel"));
  await page.touch("touchStart", [{ x: panel.x + 80, y: panel.y }]);
  for (let i = 1; i <= 8; i++) await page.touch("touchMove", [{ x: panel.x + 80 - 20 * i, y: panel.y }]);
  await page.touch("touchEnd", []);
  await sleep(300);
  const swipeDraws = (await drawnCount(page)) !== before;
  const draw = await page.eval<Point>(centre("#drawBtn"));
  await page.touch("touchStart", [{ x: draw.x, y: draw.y }]);
  await page.touch("touchEnd", []);
  return {
    swipeDraws,
    drawButtonShows: await page.eval(isVisible("drawBtn")),
    resetButtonShows: await page.eval(isVisible("resetBtn")),
    tapOnDrawDraws: await happens(page, `${COUNTER} !== ${JSON.stringify(before)}`),
  };
}

export async function clickOutsideMenu(page: Page): Promise<Record<string, unknown>> {
  const click = async (selector: string): Promise<void> => {
    const at = await page.eval<Point>(centre(selector));
    await page.click(at.x, at.y);
  };
  await click("#menubar .menu-title");
  const menuOpens = await menuOpen(page);
  const before = await drawnCount(page);
  await click("#drawBtn");
  const menuOpenAfterClickOutside = await menuOpen(page);
  const clickOutsideDraws = (await drawnCount(page)) !== before;
  await click("#drawBtn");
  const nextClickDraws = (await drawnCount(page)) !== before;
  return { menuOpens, menuOpenAfterClickOutside, clickOutsideDraws, nextClickDraws };
}

async function menuProblems(page: Page, name: string, places: string): Promise<string[]> {
  await page.eval(clickMenuTitle(name));
  const menu = await page.eval<OpenMenu>(OPEN_MENU);
  const problems = [
    ...(menu.inside ? [] : ["the menu leaves the window or covers the menu bar"]),
    ...(menu.reachable ? [] : ["the menu is taller than the window and doesn't scroll"]),
    ...((await page.eval(PLACES)) === places ? [] : ["opening the menu moves the page"]),
    ...((await page.eval(PAGE_SCROLLS)) ? ["the page scrolls with the menu open"] : []),
  ];
  await page.key("Escape");
  return problems.map((problem) => `${name}: ${problem}`);
}

export async function phoneScrollProblems(page: Page): Promise<string[]> {
  const problems: string[] = [];
  for (const tab of [0, 1, 2]) {
    await page.eval(showTab(tab));
    if (await page.eval(PAGE_SCROLLS)) problems.push(`tab ${tab}: the page scrolls`);
  }
  if ((await page.eval(PANEL_OVERFLOW)) !== "auto") problems.push("the Civ Pool tab's panel doesn't scroll");
  await page.eval(`document.getElementById("panel").scrollTop = 500; ${showTab(1)}`);
  const scrolled = await page.eval(`document.getElementById("panel").scrollTop`);
  if (scrolled !== 0) problems.push("a tab doesn't open at its top");
  await page.eval(showTab(0));
  const places = await page.eval<string>(PLACES);
  for (const name of MENUS) problems.push(...(await menuProblems(page, name, places)));
  return problems;
}

export async function zoomedScrollProblems(page: Page): Promise<string[]> {
  await page.eval(showTab(2));
  return (await page.eval(WHOLE_PAGE_SCROLLS)) ? [] : ["at 400 % zoom the page doesn't scroll as a whole"];
}
