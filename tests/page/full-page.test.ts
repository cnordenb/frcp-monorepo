import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { type Page, openPage } from "./browser-page.ts";
import { type Browser, CHROME, type Site, launch, serveSite, skip, sleep } from "./chrome.ts";

interface Shown {
  civ: string;
  count: string;
}

interface Midway {
  moved: boolean;
  ghost: boolean;
}

const THREE_DRAWS = { v: 1, edition: "DE", disabled: [], log: [[[1, 1, 54], [5, 2, 54], [10, 3, 54]]] };
const PHONE = { width: 375, height: 812, mobile: true, storage: { "frcp.state": THREE_DRAWS } };
const PANEL_MIDDLE = `(() => {
  const r = document.getElementById("panel").getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
})()`;
const ICONS = `({
  moved: !!document.getElementById("civIcon").style.transform,
  ghost: !document.getElementById("civGhost").hidden,
})`;
const SETTLED = `document.getElementById("civGhost").hidden && !document.getElementById("civIcon").style.transform`;
const SHOWN = `({
  civ: document.getElementById("civName").textContent,
  count: document.getElementById("roundCounter").textContent,
})`;
const SIMPLE_EXTRAS = `(() => {
  const extras = [...document.querySelectorAll(".simple")];
  const showing = extras.filter((e) => getComputedStyle(e).display !== "none");
  return { present: extras.length > 0, showing: showing.map((e) => e.id || e.textContent.trim().slice(0, 30)) };
})()`;

let browser: Browser;
let site: Site;

before(async () => {
  if (!CHROME) return;
  site = await serveSite();
  browser = await launch(CHROME);
});

after(async () => {
  await browser?.close();
  site?.close();
});

async function swipe(page: Page, [dx, dy]: [number, number]): Promise<Midway> {
  const [x, y] = await page.eval<[number, number]>(PANEL_MIDDLE);
  await page.touch("touchStart", [{ x, y }]);
  for (let i = 1; i <= 8; i++) await page.touch("touchMove", [{ x: x + 20 * i * dx, y: y + 20 * i * dy }]);
  const midway = await page.eval<Midway>(ICONS);
  await page.touch("touchEnd", []);
  await page.waitFor(SETTLED, "the icons to settle");
  await sleep(50);
  return midway;
}

const drawn = (shown: Shown): string => shown.count.split("/")[0];
const same = (a: Shown, b: Shown): boolean => a.civ === b.civ && a.count === b.count;

test("Test 73: phone swipes draw, undo, re-roll and reset, and the icons follow the finger", { skip }, async () => {
  const page = await openPage(browser, site.base, PHONE);
  const start = await page.eval<Shown>(SHOWN);
  const left = await swipe(page, [-1, 0]);
  const afterLeft = await page.eval<Shown>(SHOWN);
  const right = await swipe(page, [1, 0]);
  const afterRight = await page.eval<Shown>(SHOWN);
  const up = await swipe(page, [0, -1]);
  const afterUp = await page.eval<Shown>(SHOWN);
  const down = await swipe(page, [0, 1]);
  const afterDown = await page.eval<Shown>(SHOWN);
  const rightAgain = await swipe(page, [1, 0]);
  const afterRightAgain = await page.eval<Shown>(SHOWN);
  await page.close();
  const seen = {
    drawnAtStart: drawn(start),
    leftMovesTheIcon: left.moved,
    drawnAfterLeft: drawn(afterLeft),
    rightBringsTheUndoneCivIn: right.ghost,
    rightUndoesTheDraw: same(afterRight, start),
    upBringsTheNewCivIn: up.ghost,
    upRerolls: afterUp.civ !== start.civ && afterUp.count === start.count,
    downBringsTheRandomIconIn: down.ghost,
    drawnAfterDown: drawn(afterDown),
    rightAgainBringsTheCivIn: rightAgain.ghost,
    rightAgainUndoesTheReset: same(afterRightAgain, afterUp),
    errors: page.errors,
  };
  assert.deepEqual(seen, {
    drawnAtStart: "3",
    leftMovesTheIcon: true,
    drawnAfterLeft: "4",
    rightBringsTheUndoneCivIn: true,
    rightUndoesTheDraw: true,
    upBringsTheNewCivIn: true,
    upRerolls: true,
    downBringsTheRandomIconIn: true,
    drawnAfterDown: "0",
    rightAgainBringsTheCivIn: true,
    rightAgainUndoesTheReset: true,
    errors: [],
  });
});

test("Test 74: simple mode's extra elements are hidden on the full page", { skip }, async () => {
  const page = await openPage(browser, site.base);
  const extras = await page.eval(SIMPLE_EXTRAS);
  await page.close();
  assert.deepEqual(extras, { present: true, showing: [] });
});
