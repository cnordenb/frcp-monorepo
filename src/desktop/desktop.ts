import { browserPlatform } from "../app/browser.ts";
import type { Platform } from "../app/platform.ts";
import { start } from "../app/start.ts";
import { BRIDGE_NAME } from "./desktop-bridge.ts";
import type { DesktopBridge } from "./desktop-bridge.ts";

const WEB_SITE = "https://frcp.net/";

function bridgeOf(scope: object): DesktopBridge | undefined {
  return (scope as Record<string, DesktopBridge | undefined>)[BRIDGE_NAME];
}

const bridge = bridgeOf(window);

const desktopPlatform: Platform = {
  ...browserPlatform,
  kind: "desktop",
  linkBase: WEB_SITE,
  quit: () => bridge?.quit(),
};

function isAroundTheParchment(target: EventTarget | null): boolean {
  if (document.documentElement.hasAttribute("data-simple")) return false;
  return target === document.documentElement || target === document.body;
}

let passingClicks = false;

function passClicksAroundTheParchment(event: MouseEvent): void {
  const pass = isAroundTheParchment(event.target);
  if (pass === passingClicks) return;
  passingClicks = pass;
  bridge?.passClicksThrough(pass);
}

document.documentElement.dataset.platform = "desktop";
document.addEventListener("mousemove", passClicksAroundTheParchment);
void start(desktopPlatform);
