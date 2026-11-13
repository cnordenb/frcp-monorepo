import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOC = path.join(ROOT, "docs", "TESTS.md");
const NOTES = path.join(ROOT, "tests", "test-notes.json");
const TEST_LINE = /^test\("(?:Test \d+: )?((?:[^"\\]|\\.)*)"/;
const CONTENTS = "## Table of contents per category";
const MAX_FIELD = 120;
const CATEGORIES = [
  ["functional", "Functional completeness & correctness tests:"],
  ["accessibility", "Accessibility tests:"],
  ["maintainability", "Maintainability tests:"],
];

interface Note {
  category: string;
  purpose: string;
  expects: string;
}

interface Found {
  number: number;
  name: string;
  file: string;
  first: number;
  last: number;
}

function testFiles(): string[] {
  const all = readdirSync(path.join(ROOT, "tests"), { recursive: true, encoding: "utf8" });
  return all.map((f) => `tests/${f.replaceAll("\\", "/")}`).filter((f) => f.endsWith(".test.ts")).sort();
}

function numberFile(file: string, start: number): Found[] {
  const full = path.join(ROOT, file);
  const text = readFileSync(full, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(eol);
  const found: Found[] = [];
  lines.forEach((line, i) => {
    const match = TEST_LINE.exec(line);
    if (!match) return;
    const number = start + found.length;
    const end = lines.findIndex((l, at) => at >= i && l.startsWith("});"));
    lines[i] = line.replace(TEST_LINE, `test("Test ${number}: ${match[1]}"`);
    found.push({ number, name: match[1], file, first: i + 1, last: (end < 0 ? i : end) + 1 });
  });
  if (lines.join(eol) !== text) writeFileSync(full, lines.join(eol));
  return found;
}

function entry(test: Found, note: Note): string {
  return [
    `## Test ${test.number}`,
    "",
    "### File residence:",
    `\`${test.file}\`, lines ${test.first}-${test.last}`,
    "",
    "### Purpose:",
    note.purpose,
    "",
    "### Assertion expectation:",
    note.expects,
    "",
  ].join("\n");
}

function contents(tests: Found[], notes: Record<string, Note>): string {
  const groups = CATEGORIES.map(([category, title]) => {
    const mine = tests.filter((t) => notes[t.name].category === category);
    return [title, ...mine.map((t) => `- [Test ${t.number}](#test-${t.number}): ${t.name}`), ""].join("\n");
  });
  return [CONTENTS, "", ...groups].join("\n");
}

function faults(tests: Found[], notes: Record<string, Note>): string[] {
  const known = new Set(CATEGORIES.map(([category]) => category));
  const missing = tests.filter((t) => !notes[t.name]).map((t) => `no note in tests/test-notes.json for "${t.name}"`);
  const unused = Object.keys(notes).filter((name) => !tests.some((t) => t.name === name));
  const bad = Object.entries(notes).flatMap(([name, n]) => [
    ...(known.has(n.category) ? [] : [`"${name}" has the unknown category "${n.category}"`]),
    ...(n.purpose.length > MAX_FIELD ? [`the purpose of "${name}" is over ${MAX_FIELD} characters`] : []),
    ...(n.expects.length > MAX_FIELD ? [`the expectation of "${name}" is over ${MAX_FIELD} characters`] : []),
  ]);
  return [...missing, ...unused.map((name) => `the note "${name}" matches no test`), ...bad];
}

const tests: Found[] = [];
for (const file of testFiles()) tests.push(...numberFile(file, tests.length + 1));
const notes = JSON.parse(readFileSync(NOTES, "utf8")) as Record<string, Note>;
const wrong = faults(tests, notes);
if (wrong.length) {
  console.error(wrong.join("\n"));
  process.exit(1);
}
const old = readFileSync(DOC, "utf8");
const eol = old.includes("\r\n") ? "\r\n" : "\n";
const head = old.replaceAll("\r\n", "\n").split(CONTENTS)[0];
const body = [contents(tests, notes), ...tests.map((t) => entry(t, notes[t.name]))].join("\n");
writeFileSync(DOC, (head + body).replaceAll("\n", eol));
console.log(`docs/TESTS.md lists ${tests.length} tests`);
