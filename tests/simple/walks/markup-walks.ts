import type { Page } from "../../page/browser-page.ts";

const attributes = (ids: string[], ...names: string[]): string => `${JSON.stringify(ids)}.map((id) =>
  ${JSON.stringify(names)}.map((name) => document.getElementById(id).getAttribute(name)).join(":"))`;
const MARKUP = `({
  logRounds: [...document.querySelectorAll("#drawnLog > *")].map((r) => r.tagName + ">" + r.children[0].tagName),
  groups: ${attributes(["editionGroup", "civGrid"], "role", "aria-label")},
  expansions: ["role", "aria-label"]
    .map((name) => document.querySelector('[data-edition="DE"]').getAttribute(name)).join(":"),
  headings: ${attributes(["drawnCount", "remainingCount"], "role", "aria-level")},
  menuTitlesSayTheyOpenAMenu: [...document.querySelectorAll("#menubar .menu-title")].every((t) =>
    t.getAttribute("aria-haspopup") === "menu" && t.getAttribute("aria-expanded") === "false"),
  editionsPressed: [...document.querySelectorAll(".edition")].map((b) => b.getAttribute("aria-pressed")),
  dialogsWithoutATitle: [...document.querySelectorAll("dialog")]
    .filter((d) => !document.getElementById(d.getAttribute("aria-labelledby"))).map((d) => d.id),
  landmarks: [document.querySelector("[role=banner]")?.className, !!document.querySelector("main"),
    !!document.querySelector("nav")],
  lang: document.documentElement.lang,
  title: document.title,
})`;
const FORCED_COLOURS_LOOK = `({
  selectedEditionDot: getComputedStyle(document.querySelector('.edition[aria-pressed="true"] .ed-icon'))
    .backgroundImage.split("(")[0],
  focusRing: getComputedStyle(document.activeElement).outlineStyle + " "
    + getComputedStyle(document.activeElement).outlineWidth,
})`;

export const markup = (page: Page): Promise<unknown> => page.eval(MARKUP);

export async function forcedColours(page: Page): Promise<unknown> {
  await page.eval(`document.getElementById("tab-2").click(); document.getElementById("edHD").focus()`);
  await page.key("Tab");
  await page.key("Tab", { shift: true });
  return page.eval(FORCED_COLOURS_LOOK);
}
