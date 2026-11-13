import { type GameData, MersenneTwister, type RandomSource, createLogic } from "../core/logic.ts";
import { buildActions } from "./actions/actionmap.ts";
import { closeRound, draw } from "./actions/drawing.ts";
import { clearHash, handleLinkCode, readHash } from "./actions/sharelinks.ts";
import { dataUrl } from "./assets.ts";
import { type Context, ctx } from "./context.ts";
import { buildBindings } from "./desktopui/boundkeys.ts";
import { setUpDesktop } from "./desktopui/desktoppage.ts";
import { bind } from "./input/wiring.ts";
import { setUpMobile } from "./mobileui/mobilepage.ts";
import { KEY_SETTINGS, KEY_STATE, VERSION, buildActionText, buildTabKeys } from "./model/hotkeytables.ts";
import { currentId } from "./model/currentstate.ts";
import { parseSettings, saveState, storageGet } from "./model/settingsstore.ts";
import type { Platform } from "./platform.ts";
import { preloadLanding } from "./sound/loadahead.ts";
import { jingle } from "./sound/soundplayer.ts";
import { $, buildEls } from "./view/domhelpers.ts";
import { buildLogBar, scrollInstantly } from "./view/logbars.ts";
import { buildPoolControls } from "./view/poolcontrols.ts";
import { render } from "./view/renderpage.ts";
import { setUpSimple } from "./view/simplemode.ts";

const PHONE_LAYOUT = "(max-width: 609px)";

function randomSource(): RandomSource | null {
  try {
    return new MersenneTwister();
  } catch {
    return null;
  }
}

function initContext(platform: Platform, data: GameData): void {
  const logic = createLogic(data);
  const simple = document.documentElement.hasAttribute("data-simple");
  const rng = randomSource();
  Object.assign(ctx, { platform, simple, logic } satisfies Pick<Context, "platform" | "simple" | "logic">);
  const settings = parseSettings(storageGet(KEY_SETTINGS));
  const desktop = platform.kind === "desktop" && !simple;
  const saved = desktop && settings.resetOnStart ? null : logic.parseState(storageGet(KEY_STATE));
  Object.assign(ctx, {
    settings,
    state: saved || logic.emptyState(),
    ui: { tab: 0, flash: null },
    undoStacks: { undo: [], redo: [] },
    rng,
    picker: logic.createPicker(rng),
    els: buildEls(),
    randomCell: logic.CIVS.length,
    dlcIcons: Object.keys(logic.DLCS).filter((d) => logic.DLCS[d].icon),
    tabKeys: buildTabKeys(logic.EDITIONS),
    bindings: desktop ? buildBindings(logic, settings.keyBindings) : null,
    actionText: buildActionText(logic, simple, desktop),
    actions: buildActions(),
    phone: matchMedia(platform.kind === "mobile" ? "all" : PHONE_LAYOUT),
  } satisfies Omit<Context, "platform" | "simple" | "logic">);
}

function buildPage(): void {
  $("aboutVersion").textContent = "v" + VERSION;
  buildPoolControls();
  if (!ctx.simple) {
    for (const log of [ctx.els.drawnLog, ctx.els.remainingLog]) {
      scrollInstantly(log);
      buildLogBar(log);
    }
  }
  if (ctx.simple) setUpSimple();
  if (ctx.bindings) setUpDesktop();
  if (ctx.platform.kind === "mobile" && !ctx.simple) setUpMobile();
  preloadLanding();
  ctx.phone.addEventListener("change", preloadLanding);
  bind();
}

function drawAtStart(): void {
  draw({ silent: true });
  if (ctx.bindings && currentId() !== null) jingle(currentId());
}

function hashCode(): string | null {
  const code = readHash();
  if (code !== null) clearHash();
  return code;
}

export async function start(platform: Platform): Promise<void> {
  document.documentElement.dataset.platform = platform.kind;
  const launching = platform.launchCode?.();
  const data = (await (await fetch(dataUrl())).json()) as GameData;
  const launched = launching ? await launching : null;
  initContext(platform, data);
  buildPage();
  if (ctx.settings.newRoundOnVisit) closeRound();
  const code = launched ?? hashCode();
  if (code !== null) handleLinkCode(code);
  else if (ctx.settings.drawOnLoad) drawAtStart();
  saveState();
  render();
}
