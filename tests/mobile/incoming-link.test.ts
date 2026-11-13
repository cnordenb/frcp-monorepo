import assert from "node:assert/strict";
import { test } from "node:test";
import { type LinkSource, createLinkRoute, linkCode } from "../../src/mobile/incoming-link.ts";

type Arrival = [url: string, source: LinkSource];

const LINK = "https://frcp.net/#p=1AbC-_";
const CODE = "1AbC-_";

function started(before: Arrival[], after: Arrival[]): { launch: string | null; later: string[] } {
  const later: string[] = [];
  const links = createLinkRoute();
  for (const [url, source] of before) links.receive(url, source);
  const launch = links.takeHeld();
  links.listen((code) => later.push(code));
  for (const [url, source] of after) links.receive(url, source);
  return { launch, later };
}

test("Test 65: a share link's code is what follows #p= in its address", () => {
  assert.equal(linkCode(LINK), CODE);
});

test("Test 66: an address without a share link has no code, so the app opens as from the launcher", () => {
  assert.equal(linkCode("https://frcp.net/"), null);
});

test("Test 67: the launch link is what the app starts with, once, though Android reports it twice", () => {
  assert.deepEqual(started([[LINK, "open"], [LINK, "launch"]], []), { launch: CODE, later: [] });
});

test("Test 68: the launch link opened again while the app runs is delivered again", () => {
  assert.deepEqual(started([[LINK, "launch"]], [[LINK, "open"], [LINK, "open"]]), { launch: CODE, later: [CODE] });
});
