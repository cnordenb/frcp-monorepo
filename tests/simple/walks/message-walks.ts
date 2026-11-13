import type { Page } from "../../page/browser-page.ts";
import { sleep } from "../../page/chrome.ts";
import { active, drawnCount, happens } from "../simple-pages.ts";

interface Field {
  shown: boolean;
  invalid: string | null;
  describedBy: string | null;
  text: string;
}

const ROUNDS = `document.querySelectorAll("#drawnLog .log-round").length`;
const ENABLED = `document.getElementById("enabledCount").textContent`;
const TOAST = `document.getElementById("toast").textContent`;
const CLEAR_LOG = `document.getElementById("tab-1").click(); document.getElementById("clearLogBtn").click()`;
const DISABLE_ALL = `document.getElementById("tab-2").click(); document.getElementById("disableAllBtn").click()`;
const LIVE_REGIONS = `["civName", "enabledCount"].map((id) => document.getElementById(id).getAttribute("aria-live"))`;
const COPY_POOL_LINK = `document.querySelector('[data-act="share"]').click();
  document.querySelector('[data-copy="sharePool"]').click()`;
const SHARE_STATUS = `document.getElementById("shareStatus")`;
const FIELDS: [act: string, input: string, error: string][] = [
  ["lobby", "lobbyCode", "lobbyErr"],
  ["openLink", "openInput", "openErr"],
];
const field = (input: string, error: string): string => `(() => {
  const i = document.getElementById("${input}");
  const e = document.getElementById("${error}");
  return {
    shown: !e.hidden,
    invalid: i.getAttribute("aria-invalid"),
    describedBy: i.getAttribute("aria-describedby"),
    text: e.textContent,
  };
})()`;
const openDialog = (act: string): string => `document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  document.querySelector('[data-act="${act}"]').click()`;

async function undo(page: Page): Promise<void> {
  await page.eval("document.activeElement.blur()");
  await page.key("z", { ctrl: true });
}

export async function undoing(page: Page): Promise<Record<string, unknown>> {
  const enabledAtStart = await page.eval<string>(ENABLED);
  await page.eval(CLEAR_LOG);
  const roundsAfterClearLog = await page.eval(ROUNDS);
  await undo(page);
  const roundsAfterUndo = await page.eval(ROUNDS);
  await page.eval(DISABLE_ALL);
  const disableAllEmptiesThePool = /^Enabled: 0\//.test(await page.eval<string>(ENABLED));
  await undo(page);
  const undoTurnsTheCivsBackOn = (await page.eval(ENABLED)) === enabledAtStart;
  await page.eval(`document.getElementById("tab-0").click()`);
  await page.key("F8");
  await page.eval("document.activeElement.blur()");
  await page.key(" ");
  const afterDraw = await drawnCount(page);
  await page.key("F9");
  await undo(page);
  return {
    roundsAfterClearLog,
    roundsAfterUndo,
    disableAllEmptiesThePool,
    undoTurnsTheCivsBackOn,
    undoTakesTheQuickloadBack: (await drawnCount(page)) === afterDraw,
  };
}

export async function statusMessages(page: Page): Promise<Record<string, unknown>> {
  const toastRole = await page.eval(`document.getElementById("toast").getAttribute("role")`);
  const liveRegions = await page.eval(LIVE_REGIONS);
  await page.eval(CLEAR_LOG);
  const logClearedIsAnnounced = await happens(page, `/Log cleared/.test(${TOAST})`);
  await sleep(3000);
  const stillThereAfter3Seconds = /Log cleared/.test(await page.eval<string>(TOAST));
  await undo(page);
  const undoneReplacesIt = await happens(page, `${TOAST} === "Undone"`);
  await page.eval(COPY_POOL_LINK);
  return {
    toastRole,
    liveRegions,
    logClearedIsAnnounced,
    stillThereAfter3Seconds,
    undoneReplacesIt,
    shareStatusRole: await page.eval(`${SHARE_STATUS}.getAttribute("role")`),
    shareSaysWhetherItCopied: await happens(page, `/Copied|Couldn't copy/.test(${SHARE_STATUS}.textContent)`),
  };
}

export async function fieldErrors(page: Page): Promise<Record<string, unknown>[]> {
  const seen: Record<string, unknown>[] = [];
  for (const [act, input, error] of FIELDS) {
    await page.eval(openDialog(act));
    for (const text of "abc") await page.send("Input.insertText", { text });
    await page.key("Enter");
    const found = await page.eval<Field>(field(input, error));
    seen.push({
      dialog: act,
      errorShows: found.shown,
      fieldMarkedInvalid: found.invalid,
      fieldDescribedByTheError: (found.describedBy ?? "").includes(error),
      focusGoesToTheField: (await active(page)).includes(input),
      errorSaysWhatToType: /such as|with #p=/.test(found.text),
    });
  }
  return seen;
}
