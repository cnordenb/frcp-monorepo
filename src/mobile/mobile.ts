import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { browserPlatform } from "../app/browser.ts";
import type { Platform } from "../app/platform.ts";
import { start } from "../app/start.ts";
import { pressBack } from "./back-button.ts";
import { createLinkRoute } from "./incoming-link.ts";
import { phoneMediaFor } from "./phone-layout.ts";
import { isShareDismissal } from "./share-outcome.ts";

const SITE = "https://frcp.net/";

const links = createLinkRoute();

function ignore(): void {}

async function shareLink(url: string, title: string): Promise<boolean> {
  try {
    if (!(await Share.canShare()).value) return false;
    await Share.share({ url, dialogTitle: title });
    return true;
  } catch (error) {
    return isShareDismissal(error);
  }
}

async function writeToDocuments(path: string, data: string): Promise<boolean> {
  try {
    await Filesystem.writeFile({ path, data, directory: Directory.Documents, encoding: Encoding.UTF8 });
    return true;
  } catch {
    return false;
  }
}

async function offerThroughShareSheet(path: string, data: string): Promise<boolean | null> {
  try {
    const file = await Filesystem.writeFile({ path, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ files: [file.uri], dialogTitle: path });
    return true;
  } catch (error) {
    return isShareDismissal(error) ? null : false;
  }
}

async function savePreset(name: string, text: string): Promise<boolean | null> {
  return (await writeToDocuments(name, text)) || offerThroughShareSheet(name, text);
}

async function launchCode(): Promise<string | null> {
  App.addListener("appUrlOpen", (event) => links.receive(event.url, "open")).catch(ignore);
  const launch = await App.getLaunchUrl().catch(() => undefined);
  if (launch?.url) links.receive(launch.url, "launch");
  return links.takeHeld();
}

function onLink(handler: (code: string) => void): void {
  links.listen(handler);
  setTimeout(() => {
    const heldSinceLaunch = links.takeHeld();
    if (heldSinceLaunch !== null) handler(heldSinceLaunch);
  });
}

function leaveApp(): void {
  App.minimizeApp().catch(ignore);
}

function openUrl(url: string): void {
  window.open(url, "_blank", "noopener");
}

function rulesOf(sheet: CSSStyleSheet): CSSRule[] {
  try {
    return [...sheet.cssRules];
  } catch {
    return [];
  }
}

function keepPhoneLayout(): void {
  for (const sheet of document.styleSheets) {
    for (const rule of rulesOf(sheet)) {
      if (rule instanceof CSSMediaRule) rule.media.mediaText = phoneMediaFor(rule.media.mediaText);
    }
  }
}

function wireBackButton(): void {
  const page = { querySelector: (selector: string) => document.querySelector<HTMLElement>(selector) };
  App.addListener("backButton", () => pressBack(page, leaveApp)).catch(ignore);
}

const mobilePlatform: Platform = {
  ...browserPlatform,
  kind: "mobile",
  linkBase: SITE,
  shareLink,
  savePreset,
  onLink,
  launchCode,
  quit: leaveApp,
  openUrl,
};

keepPhoneLayout();
wireBackButton();
start(mobilePlatform);
