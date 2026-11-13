import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { OPEN_DIALOG_CLOSER, OPEN_MENU_TITLE, pressBack } from "../../src/mobile/back-button.ts";
import { phoneMediaFor } from "../../src/mobile/phone-layout.ts";
import { isShareDismissal } from "../../src/mobile/share-outcome.ts";

const SHARE_ERRORS = ["Share canceled", "Unsupported url"];
const PHONE_SHEET = path.resolve(import.meta.dirname, "..", "..", "src", "web", "styles", "phone.css");

function backPressed(showing: string[]): string[] {
  const done: string[] = [];
  const page = {
    querySelector: (selector: string) => (showing.includes(selector) ? { click: () => done.push(selector) } : null),
  };
  pressBack(page, () => done.push("leave"));
  return done;
}

function mediaOfPhoneSheet(): string[] {
  return [...readFileSync(PHONE_SHEET, "utf8").matchAll(/@media ([^{]+?)\s*\{/g)].map((found) => found[1]);
}

test("Test 69: a share sheet that the user dismisses is told from a share that failed", () => {
  assert.deepEqual(SHARE_ERRORS.map((said) => isShareDismissal(new Error(said))), [true, false]);
});

test("Test 70: on mobile the phone layout's rules hold at any width, and the wide layout's at none", () => {
  assert.deepEqual(mediaOfPhoneSheet().map(phoneMediaFor), ["not all", "all", "(hover: none)"]);
});

test("Test 71: the back button closes an open dialog and nothing else", () => {
  assert.deepEqual(backPressed([OPEN_DIALOG_CLOSER, OPEN_MENU_TITLE]), [OPEN_DIALOG_CLOSER]);
});

test("Test 72: the back button leaves the app when no dialog or menu is open", () => {
  assert.deepEqual(backPressed([]), ["leave"]);
});
