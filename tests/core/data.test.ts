import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { CIV_ATLAS_COLS, DLC_ATLAS_COLS, DLC_KEYS, EDITION_KEYS } from "../../src/app/model/hotkeytables.ts";
import { B64 } from "../../src/core/logic.ts";
import { CIVS, DATA, EDITIONS, ROOT, exists, logic, read, readJson } from "./core-fixture.ts";

const { EDITION_INFO, DLCS } = logic;
const yearOf = (ed: string): number => EDITION_INFO[ed].year;
const missing = (files: string[]): string[] => files.filter((f) => !exists(f));

interface Size {
  width: number;
  height: number;
}

function webpSize(rel: string): Size {
  const b = readFileSync(path.join(ROOT, rel));
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  throw new Error(`${rel} has an unknown WebP chunk ${chunk}`);
}

function styledAtlas(selector: string, atlas: string): Record<string, number> {
  const rule = new RegExp(`${selector.replace(/[.#]/g, "\\$&")} \\{[^}]*--cols: (\\d+); --rows: (\\d+);`);
  const [, cols, rows] = rule.exec(read("src/web/styles/parchment.css")) ?? [];
  return { cols: Number(cols), rows: Number(rows), ...webpSize(`assets/atlases/${atlas}.webp`) };
}

function neededAtlas(cols: number, cells: number, cell: Size): Record<string, number> {
  const rows = Math.ceil(cells / cols);
  return { cols, rows, width: cols * cell.width, height: rows * cell.height };
}

test("Test 1: civ IDs never change, and every civ has its ID frozen", () => {
  const frozen = readJson<string[]>("tests/fixtures/civ-ids.json");
  assert.deepEqual(Array.from(CIVS, (c) => c?.name), frozen);
});

test("Test 2: editions have unique IDs and years, as which civs an edition has goes by year", () => {
  const repeats = [...EDITIONS, ...EDITIONS.map(yearOf)].filter((x, i, all) => all.indexOf(x) !== i);
  assert.deepEqual(repeats, []);
});

test("Test 3: every DLC and edition the data names exists, and an edition's toggles and older DLCs are its", () => {
  const wrong = DATA.civs.filter((c) => !DATA.dlcs[c.dlc]).map((c) => `${c.name} names unknown DLC ${c.dlc}`);
  for (const [key, dlc] of Object.entries(DATA.dlcs)) {
    if (!EDITIONS.includes(dlc.edition)) wrong.push(`DLC ${key} names unknown edition ${dlc.edition}`);
  }
  for (const ed of DATA.editions) {
    for (const key of [...ed.dlcToggles, ...ed.olderDlcs]) {
      const of = DATA.dlcs[key]?.edition;
      if (!EDITIONS.includes(of)) wrong.push(`${ed.id} names unknown DLC ${key}`);
      else if (yearOf(of) > ed.year) wrong.push(`${ed.id} names ${key}, a DLC of the newer ${of}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test("Test 4: every civ has an icon and a jingle, and a legacy jingle where its edition has them", () => {
  const files = ["random", ...CIVS.map((c) => c.file)].flatMap((f) => [`${f}/${f}.webp`, `${f}/${f}.webm`]);
  const legacy = ["random", ...CIVS.filter((c) => c.legacy).map((c) => c.file)].map((f) => `${f}/${f}_legacy.webm`);
  assert.deepEqual(missing([...files, ...legacy].map((f) => `assets/civs/${f}`)), []);
});

test("Test 5: every edition has its icons and banner, and every DLC with an icon has its file", () => {
  const looks = (icon: string): string[] => ["", "_hover", "_pressed"].map((suffix) => `${icon}/${icon}${suffix}.webp`);
  const editions = DATA.editions.flatMap((ed) => [...looks(ed.icon), `${ed.icon}/${ed.banner}.webp`]);
  const dlcs = Object.values(DLCS).flatMap((d) => (d.icon ? [`assets/dlcs/${d.icon}/${d.icon}.webp`] : []));
  const atlases = ["civicon_atlas", "dlc_atlas", "edition_banners_atlas"].map((a) => `assets/atlases/${a}.webp`);
  assert.deepEqual(missing([...editions.map((f) => `assets/editions/${f}`), ...dlcs, ...atlases]), []);
});

test("Test 6: every DLC toggle and edition has a hotkey", () => {
  const mostToggles = Math.max(...DATA.editions.map((ed) => ed.dlcToggles.length));
  const enough = { dlcKeys: mostToggles <= DLC_KEYS.length, editionKeys: EDITIONS.length <= EDITION_KEYS.length };
  assert.deepEqual(enough, { dlcKeys: true, editionKeys: true });
});

test("Test 7: the atlases have the cells the data needs, in the grid the style sheet and the script give", () => {
  const [first] = DATA.editions;
  const dlcCells = 3 * EDITIONS.length + Object.values(DLCS).filter((d) => d.icon).length;
  const styled = {
    civs: styledAtlas(".civ-cell", "civicon_atlas"),
    dlcs: styledAtlas(".dlc-cell", "dlc_atlas"),
    banners: styledAtlas("#editionIcon", "edition_banners_atlas"),
  };
  assert.deepEqual(styled, {
    civs: neededAtlas(CIV_ATLAS_COLS, CIVS.length + 1, { width: 30, height: 30 }),
    dlcs: neededAtlas(DLC_ATLAS_COLS, dlcCells, { width: 128, height: 128 }),
    banners: neededAtlas(1, EDITIONS.length, webpSize(`assets/editions/${first.icon}/${first.banner}.webp`)),
  });
});

test("Test 8: civ names and edition IDs are single words, as preset files split their lines on spaces", () => {
  const words = [...CIVS.map((c) => c.name), ...EDITIONS];
  assert.deepEqual(words.filter((w) => !/^\S+$/.test(w) || w.endsWith(":")), []);
});

test("Test 9: a share link can name every civ (format 1 spends one character per draw)", () => {
  assert.ok(CIVS.length <= B64.length, `${CIVS.length} civs, but link format 1 can only name ${B64.length}`);
});
