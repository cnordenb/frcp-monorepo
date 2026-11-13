import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { DATA } from "../core/core-fixture.ts";

const APP = path.resolve(import.meta.dirname, "..", "..", "src", "app");
const MESSAGE = /(?:toast|say\w*|msgBox)\((?:"[^"]*", )?"([^"]+)"/g;
const SHORT_FORM = /\b(?:[A-Z][a-z]*[A-Z0-9][A-Za-z0-9]*|Ctrl|Esc)\b/g;
const HARDEST_GRADE = 9;
const FEWEST_WORDS = 8;
const FEWEST_BLOCKS = 40;
const FEWEST_SHORT_FORMS = 3;
const OTHER_NAMES = [
  "Age of Empires II: The Age of Kings",
  "Age of Empires II: Definitive Edition",
  "Age of Empires II: HD Edition",
  "Age of Empires II",
  "Fresh Random Civ Picker",
  "Microsoft Corporation",
  "Microsoft's",
  "Microsoft",
  "Game Content Usage Rules",
  "Definitive Edition",
  "HD Edition",
  "Age of Kings",
  "Carl Nordenbrink",
  "Hjörleif",
  "GitHub",
  "YouTube",
  "Voobly",
  "Steam",
  "Xbox",
];
const NAMES = [
  ...DATA.civs.map((c) => c.name),
  ...Object.values(DATA.dlcs).flatMap((d) => [d.name, d.short ?? ""]),
  ...OTHER_NAMES,
]
  .filter((name) => name !== "")
  .sort((a, b) => b.length - a.length);
const EXPLAINED_WORDS = [
  "Civ",
  "Civ pool",
  "Draw",
  "Round",
  "Reset",
  "Log",
  "Edition",
  "Expansion",
  "Continuous freshness",
  "Share link",
  "Preset",
  "Quicksave and quickload",
  "Tech tree",
  "Lobby",
  "Hotkey",
  "Single-key hotkey",
  "Auto-toggle older civs",
  "Auto-reset upon change",
];

const withoutNames = (text: string): string => NAMES.reduce((t, name) => t.split(name).join("Name"), text);

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w ? 1 : 0;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function grade(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?:](\s|$)/g) || []).length);
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  const perWord = words.reduce((n, w) => n + syllables(w), 0) / words.length;
  return 0.39 * (words.length / sentences) + 11.8 * perWord - 15.59;
}

function appMessages(): string[] {
  const files = readdirSync(APP, { recursive: true, encoding: "utf8" }).filter((file) => file.endsWith(".ts"));
  const code = files.map((file) => readFileSync(path.join(APP, file), "utf8")).join("\n");
  return [...code.matchAll(MESSAGE)].map((m) => m[1]);
}

export function hardToRead(texts: Iterable<string>): string[] {
  const blocks = [...texts, ...appMessages()].filter((t) => t.split(/\s+/).length >= FEWEST_WORDS);
  const hard = blocks.map((t): [number, string] => [grade(withoutNames(t)), t]).filter(([g]) => g > HARDEST_GRADE);
  return [
    ...(blocks.length > FEWEST_BLOCKS ? [] : [`only ${blocks.length} blocks of text found`]),
    ...hard.map(([g, t]) => `grade ${g.toFixed(1)}: ${t}`),
  ];
}

function shortFormsUsed(texts: Iterable<string>): Set<string> {
  const used = new Set<string>();
  for (const text of texts) {
    for (const [token] of withoutNames(text).matchAll(SHORT_FORM)) {
      if (/^[IVX]+$|^OK$/.test(token)) continue;
      used.add(/^F\d+$/.test(token) ? "F1 to F12" : token);
    }
  }
  return used;
}

export function unexplained(texts: Iterable<string>, [words, shortForms]: string[][]): string[] {
  const defined = new Set(shortForms.flatMap((dt) => dt.split(", ")));
  const used = shortFormsUsed(texts);
  return [
    ...EXPLAINED_WORDS.filter((w) => !words.includes(w)).map((w) => `Help doesn't explain "${w}"`),
    ...(used.size > FEWEST_SHORT_FORMS ? [] : [`only the short forms ${[...used].join(", ")} found`]),
    ...[...used].filter((s) => !defined.has(s)).map((s) => `Help doesn't explain the short form ${s}`),
  ];
}
