import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { skip } from "../page/chrome.ts";
import { hardToRead, unexplained } from "./reading-level.ts";
import { SMALL_PHONE, ZOOMED_400, pageErrors, startBrowser, stopBrowser, walk } from "./simple-pages.ts";
import { imagesStylesLoadInSimpleMode } from "./style-images.ts";
import { found, loadedMedia, runSweeps, seenText } from "./sweeps.ts";
import { charKeys, focusOrder, focusProblems, menuKeys } from "./walks/keyboard-walks.ts";
import { forcedColours, markup } from "./walks/markup-walks.ts";
import { fieldErrors, statusMessages, undoing } from "./walks/message-walks.ts";
import {
  clickOutsideMenu,
  phoneGestures,
  phoneScrollProblems,
  tooltips,
  zoomedScrollProblems,
} from "./walks/pointer-walks.ts";

const TALL_PHONE = { width: 375, height: 812, mobile: true };
const TIPS = `[...document.querySelectorAll("[data-tip]")].map((e) => e.dataset.tip.replace(/\\n/g, ". "))`;
const HINTS = `["lobbyErr", "openErr", "lobbyHint", "openHint"].map((id) => document.getElementById(id).textContent)`;
const HELP_TERMS = `[...document.querySelectorAll("#dlgHelp .terms")]
  .map((dl) => [...dl.querySelectorAll("dt")].map((dt) => dt.textContent))`;
const explainedMarkedAndFocused = (dialog: string): Record<string, unknown> => ({
  dialog,
  errorShows: true,
  fieldMarkedInvalid: "true",
  fieldDescribedByTheError: true,
  focusGoesToTheField: true,
  errorSaysWhatToType: true,
});

before(async () => {
  if (await startBrowser()) await runSweeps();
});

after(stopBrowser);

test("Test 75: axe-core finds no WCAG 2.2 A, AA or AAA violation at any size or in dark mode", { skip }, () => {
  assert.deepEqual(found.axe, []);
});

test("Test 76: 1.4.6 Contrast (Enhanced): all text is at least 7:1, in light and dark mode", { skip }, () => {
  assert.deepEqual(found.contrast, []);
});

test("Test 77: 2.5.5 Target Size (Enhanced): every control is at least 44 x 44 px at any size", { skip }, () => {
  assert.deepEqual(found.targets, []);
});

test("Test 78: 1.4.10 Reflow: nothing scrolls sideways or leaves the screen at up to 400 % zoom", { skip }, () => {
  assert.deepEqual(found.reflow, []);
});

test("Test 79: 1.4.12 Text Spacing: no text overlaps, spills out of its control or is cut off", { skip }, () => {
  assert.deepEqual(found.overlaps, []);
});

test("Test 80: 1.4.8 Visual Presentation: short lines, 1.5 line spacing, no justified text", { skip }, () => {
  assert.deepEqual(found.visualPresentation, []);
});

test("Test 81: 3.2.5 Change on Request: every link and button that opens a new tab says so", { skip }, () => {
  assert.deepEqual(found.newTabs, []);
});

test("Test 82: 1.1.1, 1.4.9 Images of Text: simple mode loads no images and no sounds", { skip }, () => {
  assert.deepEqual([...loadedMedia(), ...imagesStylesLoadInSimpleMode()], []);
});

test("Test 83: 3.1.5 Reading Level: every text, tooltip and message reads at grade 9 or below", { skip }, async () => {
  const texts = await walk({}, (page) => page.eval<string[]>(`[...${TIPS}, ...${HINTS}]`));
  assert.deepEqual(hardToRead([...seenText, ...texts]), []);
});

test("Test 84: 3.1.3, 3.1.4 Unusual Words: Help explains the picker's words and short forms", { skip }, async () => {
  const terms = await walk({}, (page) => page.eval<string[][]>(HELP_TERMS));
  assert.deepEqual(unexplained(seenText, terms), []);
});

test("Test 85: 2.1.1 Keyboard: the menus and tabs open, move and close from the keyboard", { skip }, async () => {
  assert.deepEqual(await walk({}, menuKeys), {
    enterOpensFileAtItsFirstItem: "Copy Share Link",
    fileSaysItIsOpen: "true",
    downMovesThroughTheItems: "Open Link ...",
    endGoesToTheLastItem: "Options ...",
    homeGoesToTheFirstItem: "Copy Share Link",
    upFromTheFirstItemGoesToTheLast: "Options ...",
    rightOpensTheNextMenu: "Join Lobby ...",
    escapeGoesBackToTheTitle: "Lobbies",
    menuOpenAfterEscape: false,
    tabLeavesTheMenuForTheNextTitle: "Civs",
    menuOpenAfterTab: false,
    upOpensAMenuAtItsLastItem: "Tech Tree ...",
    endOnTheTabsGoesToCivPool: "tab-2",
    tabShownAfterEnd: "2",
    homeOnTheTabsGoesToDrawCiv: "tab-0",
  });
});

test("Test 86: 2.4.3 Focus Order: focus comes back from a dialog, and follows a tab hotkey", { skip }, async () => {
  assert.deepEqual(await walk({}, focusOrder), {
    spaceOpensHelpAtItsFirstItem: "Help ...",
    helpOpens: true,
    helpStartsAtItsHeading: "helpTitle",
    helpOpenAfterEscape: false,
    focusComesBackTo: "Help",
    hotkey3TakesFocusTo: "tab-2",
    expansionsComeBeforeCivs: true,
  });
});

test("Test 87: 2.4.7, 2.4.11-13 Focus: every Tab stop has a clear, uncovered focus ring", { skip }, async () => {
  assert.deepEqual(await focusProblems(), []);
});

test("Test 88: 2.1.4 Character Key Shortcuts: single-key hotkeys can be turned off", { skip }, async () => {
  assert.deepEqual(await walk({}, charKeys), {
    spaceDrawsWhileTheyAreOn: true,
    optionsShowsTheSwitch: true,
    spaceDrawsWhenOff: false,
    tabShownAfter2: "0",
    optionsOpenAfterO: false,
    f2StillOpensHotkeys: true,
    singleKeysListedInHotkeys: [],
    copyLinkKeyShownInTheMenu: "",
  });
});

test("Test 89: 1.4.13 Content on Hover or Focus: tooltips can be dismissed and hovered", { skip }, async () => {
  assert.deepEqual(await walk({}, tooltips), {
    hoverShowsIt: true,
    itTouchesTheButton: true,
    pointerCanMoveOntoIt: true,
    shownAfterEscape: false,
    shownWhileThePointerStays: false,
    comesBackWhenThePointerReturns: true,
    tabFocusesDraw: true,
    focusShowsIt: true,
    itDescribesDraw: true,
  });
});

test("Test 90: 2.5.1 Pointer Gestures: phones draw with buttons, and a swipe does nothing", { skip }, async () => {
  assert.deepEqual(await walk(TALL_PHONE, phoneGestures), {
    swipeDraws: false,
    drawButtonShows: true,
    resetButtonShows: true,
    tapOnDrawDraws: true,
  });
});

test("Test 91: 2.5.2 Pointer Cancellation: a click outside an open menu only closes it", { skip }, async () => {
  assert.deepEqual(await walk({}, clickOutsideMenu), {
    menuOpens: true,
    menuOpenAfterClickOutside: false,
    clickOutsideDraws: false,
    nextClickDraws: true,
  });
});

test("Test 92: 1.4.10 Reflow: on a phone only the tab's panel scrolls, and menus move nothing", { skip }, async () => {
  const onPhone = await walk(SMALL_PHONE, phoneScrollProblems);
  assert.deepEqual([...onPhone, ...(await walk(ZOOMED_400, zoomedScrollProblems))], []);
});

test("Test 93: 3.3.6 Error Prevention: Clear Log, Disable All and Quickload can be undone", { skip }, async () => {
  assert.deepEqual(await walk({}, undoing), {
    roundsAfterClearLog: 1,
    roundsAfterUndo: 2,
    disableAllEmptiesThePool: true,
    undoTurnsTheCivsBackOn: true,
    undoTakesTheQuickloadBack: true,
  });
});

test("Test 94: 4.1.3 Status Messages, 2.2.1: results are announced and stay on screen", { skip }, async () => {
  assert.deepEqual(await walk({}, statusMessages), {
    toastRole: "status",
    liveRegions: ["polite", "polite"],
    logClearedIsAnnounced: true,
    stillThereAfter3Seconds: true,
    undoneReplacesIt: true,
    shareStatusRole: "status",
    shareSaysWhetherItCopied: true,
  });
});

test("Test 95: 3.3.1, 3.3.3 Errors: a bad lobby code or link is explained, marked and focused", { skip }, async () => {
  assert.deepEqual(await walk({}, fieldErrors), ["lobby", "openLink"].map(explainedMarkedAndFocused));
});

test("Test 96: 1.3.1, 4.1.2: lists, groups, headings, states and landmarks are marked up", { skip }, async () => {
  assert.deepEqual(await walk({}, markup), {
    logRounds: ["UL>LI", "UL>LI"],
    groups: ["group:Edition", "group:Civs"],
    expansions: "group:Expansions",
    headings: ["heading:2", "heading:2"],
    menuTitlesSayTheyOpenAMenu: true,
    editionsPressed: ["true", "false", "false"],
    dialogsWithoutATitle: [],
    landmarks: ["site-title desk", true, true],
    lang: "en",
    title: "Fresh Random Civ Picker (simple)",
  });
});

test("Test 97: forced colours: the selected edition and the focus ring still show", { skip }, async () => {
  assert.deepEqual(await walk({ forcedColors: true }, forcedColours), {
    selectedEditionDot: "radial-gradient",
    focusRing: "solid 3px",
  });
});

test("Test 98: every sweep reaches every tab, menu and dialog, and no page throws an error", { skip }, () => {
  assert.deepEqual([...found.unopened, ...pageErrors], []);
});
