import assert from "node:assert/strict";
import { test } from "node:test";
import { B64, type PickerState, type ShareLink } from "../../src/core/logic.ts";
import { CIVS, EDITIONS, idOf, logic, makeState, namedLog, readJson } from "./core-fixture.ts";

interface EarlierLink {
  note: string;
  link: string;
  edition: string;
  off: string[];
  draws: string[];
}

const { shareCode, parseShare, applyLink, inEdition } = logic;
const ADDRESS = "https://frcp.net/#p=";
const EARLIER = readJson<EarlierLink[]>("tests/fixtures/share-links.json");
const codeOf = (link: string): string => link.slice(link.indexOf("#p=") + 1).replace(/^p=/, "");
const bitfieldLength = Math.ceil(CIVS.length / 6);

function asWritten(f: EarlierLink): boolean {
  const bits = codeOf(f.link).slice(2).split(".")[0];
  const isSet = (id: number): boolean => ((B64.indexOf(bits[Math.floor(id / 6)]) >> (id % 6)) & 1) === 1;
  return bits.length === bitfieldLength && CIVS.every((c) => inEdition(c, f.edition) || !isSet(c.id));
}

function samplePool(ed: string): PickerState {
  const off = CIVS.filter((c) => !inEdition(c, ed) || c.id % 3 === 1).map((c) => c.id);
  const draws = CIVS.filter((c) => !off.includes(c.id)).reverse().slice(0, 3);
  return { edition: ed, off: new Set(off), log: [draws.map((c, i) => [c.id, i + 1, CIVS.length])] };
}

const expected = (s: PickerState): ShareLink => ({
  edition: s.edition,
  enabled: CIVS.map((c) => !s.off.has(c.id)),
  draws: s.log[s.log.length - 1].map((e) => e[0]),
});

function opened(text: string): ShareLink {
  const link = parseShare(text);
  if (!link) throw new Error(`${text} doesn't open`);
  return link;
}

test("Test 41: share links written by earlier versions open as they did", () => {
  const then = EARLIER.map((f) => ({
    edition: f.edition,
    enabled: CIVS.map((c) => inEdition(c, f.edition) && !f.off.includes(c.name)),
    draws: f.draws.map(idOf),
  }));
  assert.deepEqual(EARLIER.map((f) => parseShare(f.link)), then);
});

test("Test 42: a pool and its draws are written as earlier versions wrote them", () => {
  const whole = EARLIER.filter(asWritten);
  const written = whole.map((f) => {
    const s = makeState({ edition: f.edition, off: f.off, log: [f.draws.map((name, i) => [name, i + 1, 0])] });
    return shareCode(s, true);
  });
  assert.deepEqual(written, whole.map((f) => codeOf(f.link)));
});

test("Test 43: a link opens as what it was written from, for every edition", () => {
  const pools = EDITIONS.map(samplePool);
  assert.deepEqual(pools.map((s) => parseShare(ADDRESS + shareCode(s, true))), pools.map(expected));
});

test("Test 44: a link opens with or without its address", () => {
  const s = samplePool(EDITIONS[0]);
  const code = shareCode(s, true);
  const texts = [
    code, "p=" + code, "#p=" + code, "  \t" + ADDRESS + code + " \n",
    "https://example.org/index.html?x=1#p=" + code, "%31" + code.slice(1),
  ];
  assert.deepEqual(texts.map(parseShare), texts.map(() => expected(s)));
});

test("Test 45: text that isn't a link opens as nothing", () => {
  const ed = B64[0];
  const noEdition = B64[EDITIONS.length];
  const noCiv = B64[CIVS.length];
  const texts = [
    "", "   ", "hello", ADDRESS, ADDRESS + "1", ADDRESS + "1" + ed, ADDRESS + "2" + ed + "_",
    ADDRESS + "1" + ed + "_.", ADDRESS + "1" + ed + "_..A", ADDRESS + "1" + ed + "_!",
    ADDRESS + "1" + ed + "_.A.B", ADDRESS + "1" + noEdition + "_",
    ADDRESS + "1" + ed + "_." + noCiv,
    ADDRESS + "1" + ed + "_.AA", ADDRESS + "1" + ed + "A.A", ADDRESS + "%", ADDRESS + "%3",
    ADDRESS + "%G1" + ed + "_", ADDRESS + "1" + ed + "_%C3%A4", ADDRESS + "1" + ed + "_ä",
    ADDRESS + "1" + ed + "_ A",
  ];
  assert.deepEqual(texts.filter((text) => parseShare(text) !== null), []);
});

test("Test 46: a link leaves out the draws of civs that are off, and the draws altogether when asked", () => {
  const s = makeState({ off: ["Wu"], log: [[["Celts", 1, 55], ["Wu", 2, 56], ["Franks", 3, 55]]] });
  const draws = [true, false].map((withDraws) => opened(shareCode(s, withDraws)).draws);
  assert.deepEqual(draws, [[idOf("Celts"), idOf("Franks")], []]);
});

test("Test 47: opening a link replaces the pool and starts a round of its draws, keeping past rounds", () => {
  const s = makeState({ log: [[["Huns", 1, 56]], [["Celts", 1, 56], ["Franks", 2, 56]]] });
  applyLink(s, opened("1B__________.KF"));
  assert.deepEqual({ edition: s.edition, off: s.off, log: namedLog(s) }, {
    edition: "HD",
    off: new Set(CIVS.filter((c) => !inEdition(c, "HD")).map((c) => c.id)),
    log: [[["Huns", 1, 56]], [["Celts", 1, 56], ["Franks", 2, 56]], [["Celts", 1, 31], ["Britons", 2, 31]]],
  });
});

test("Test 48: opening a link without draws starts an empty round", () => {
  const s = makeState({ log: [[["Celts", 1, 56]]] });
  applyLink(s, opened("1A__________"));
  assert.deepEqual(namedLog(s), [[["Celts", 1, 56]], []]);
});
