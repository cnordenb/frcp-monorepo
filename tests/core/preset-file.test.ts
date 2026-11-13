import assert from "node:assert/strict";
import { test } from "node:test";
import type { PickerState } from "../../src/core/logic.ts";
import {
  CIVS,
  EDITIONS,
  MOST,
  type NamedDraw,
  idOf,
  logic,
  makeState,
  namedLog,
  offNames,
  read,
} from "./core-fixture.ts";

const { presetText, parsePreset, applyPreset, drawCandidates, emptyState, inEdition } = logic;
const fixture = (name: string): string => read(`tests/fixtures/presets/${name}`);
const crlf = (lines: string[]): string => lines.map((line) => line + "\r\n").join("");
const pool = (s: PickerState) => ({ edition: s.edition, off: offNames(s), log: namedLog(s) });

function loaded(text: string): PickerState {
  const preset = parsePreset(text);
  if (!preset) throw new Error("the text isn't a preset");
  const s = emptyState();
  applyPreset(s, preset);
  return s;
}

function section(text: string, header: string): string[] {
  const lines = text.split("\r\n");
  const start = lines.indexOf(header) + 1;
  const length = lines.slice(start).findIndex((line) => !line || line.endsWith(":"));
  return start > 0 ? lines.slice(start, start + Math.max(length, 0)) : [];
}

test("Test 21: a preset the desktop app wrote mid-round loads its pool, edition and draws", () => {
  const text = fixture("desktop-log.txt");
  const draws = section(text, "DrawnCivs:").map((name, i): NamedDraw => [name, i + 1, CIVS.length]);
  assert.deepEqual(pool(loaded(text)), { edition: "DE", off: [], log: [draws] });
});

test("Test 22: a preset from an older desktop app loads, passing over civ names it no longer has", () => {
  const s = loaded(fixture("desktop-v1.3.2.txt"));
  assert.deepEqual(pool(s), { edition: "DE", off: ["Bulgarians", "Goths", "Persians", "Sicilians"], log: [[]] });
});

test("Test 23: a desktop preset loads and saves back byte for byte", () => {
  const text = fixture("round-start.txt");
  assert.equal(presetText(loaded(text), true), text);
});

test("Test 24: a preset's freshness history from before this round loads as an earlier round, without counts", () => {
  assert.deepEqual(pool(loaded(fixture("round-start.txt"))), {
    edition: "DE",
    off: ["Aztecs", "Wu"],
    log: [
      [["Huns", 0, 0], ["Franks", 0, 0], ["Teutons", 0, 0]],
      [["Celts", 1, CIVS.length - 2], ["Mongols", 2, CIVS.length - 2]],
    ],
  });
});

test("Test 25: a saved preset lists every civ in ID order, the round's draws that are on, and the edition", () => {
  const s = makeState({ edition: "HD", off: ["Celts"], log: [[["Huns", 1, 30], ["Celts", 2, 31], ["Franks", 2, 30]]] });
  const states = CIVS.map((c) => `${c.name} ${inEdition(c, "HD") && c.name !== "Celts" ? 1 : 0}`);
  const lines = ["CivStates:", ...states, "DrawnCivs:", "Huns", "Franks", "EditionState:", "HD"];
  assert.equal(presetText(s, false), crlf(lines));
});

test("Test 26: a saved preset's freshness history holds the newest civs that could sit out, oldest first", () => {
  const past = CIVS.map((c, i): NamedDraw => [c.name, i + 1, CIVS.length]);
  const s = makeState({ log: [past, [["Celts", 1, CIVS.length], ["Franks", 2, CIVS.length]]] });
  const half = Math.floor(CIVS.length / 2);
  const earlier = past.map(([name]) => name).filter((n) => n !== "Celts" && n !== "Franks").slice(-(half - 2));
  assert.deepEqual(section(presetText(s, true), "ContfreshCivArray:"), [...earlier, "Celts", "Franks"]);
});

test("Test 27: a preset is read from the default edition with all civs on, in any order, to a blank line", () => {
  const text = "EditionState:\nHD\nDrawnCivs:\nBritons\nWu\nCivStates:\nCelts 0\n\nDrawnCivs:\nFranks\n";
  const notInHd = CIVS.filter((c) => !inEdition(c, "HD") || c.name === "Celts").map((c) => c.name);
  assert.deepEqual(pool(loaded(text)), { edition: "HD", off: notInHd, log: [[["Britons", 1, 30]]] });
});

test("Test 28: a preset with an unknown edition keeps the default, and repeated or unknown draws are skipped", () => {
  const s = loaded("EditionState:\nXX\nDrawnCivs:\nCelts\nNonsense\nCelts\nFranks\n");
  const draws = [["Celts", 1, CIVS.length], ["Franks", 2, CIVS.length]];
  assert.deepEqual(pool(s), { edition: EDITIONS[0], off: [], log: [draws] });
});

test("Test 29: text with none of the sections isn't a preset", () => {
  const texts = ["", "\r\n", "hello\r\nworld\r\n", "Celts 1\r\nFranks 0\r\n", "\r\nCivStates:\r\nCelts 0\r\n"];
  assert.deepEqual(texts.filter((text) => parsePreset(text) !== null), []);
});

test("Test 30: after loading a preset, its earlier civs keep sitting out of the next draws", () => {
  const candidates = drawCandidates(loaded(fixture("round-start.txt")), { fresh: true, freshN: MOST });
  const earlier = ["Huns", "Franks", "Teutons", "Celts", "Mongols"];
  assert.deepEqual(earlier.filter((name) => candidates.includes(idOf(name))), []);
});
