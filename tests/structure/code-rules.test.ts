import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

const MAX_FUNCTION_LINES = 60;
const CODE = /\.(ts|html|css|sh)$/;
const OPENS_REGEX = /(^|[=(,:[!&|?{};]|return|typeof)\s*$/;
const CONTROL = /^\s*(\}\s*)?(if|for|while|switch|catch|else|try|do|finally)\b/;
const FUNCTION_START = /\bfunction\b|=>\s*\{$|^\s*(export\s+)?(async\s+)?(static\s+)?[#\w]+\s*\([^)]*\)[^{;]*\{$/;

interface Scan {
  code: string;
  comments: number[];
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

function skipQuoted(text: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < text.length && text[i] !== quote) {
    if (text[i] === "\\") i++;
    else if (quote === "`" && text[i] === "$" && text[i + 1] === "{") i = skipBraces(text, i + 1);
    else if (quote !== "`" && text[i] === "\n") return i;
    i++;
  }
  return i;
}

function skipBraces(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if ("'\"`".includes(text[i])) i = skipQuoted(text, i, text[i]);
    else if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return text.length;
}

function skipRegex(text: string, start: number): number {
  let inClass = false;
  for (let i = start + 1; i < text.length && text[i] !== "\n"; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === "[") inClass = true;
    else if (text[i] === "]") inClass = false;
    else if (text[i] === "/" && !inClass) return i;
  }
  return start;
}

function blank(text: string, from: number, to: number): string {
  return text.slice(from, to + 1).replace(/[^\n]/g, " ");
}

function scanScript(text: string): Scan {
  const comments: number[] = [];
  let code = "";
  for (let i = 0; i < text.length; i++) {
    const two = text.slice(i, i + 2);
    let end = -1;
    if ("'\"`".includes(text[i])) end = skipQuoted(text, i, text[i]);
    else if (two === "//" || two === "/*") comments.push(lineOf(text, i));
    else if (text[i] === "/" && OPENS_REGEX.test(code.slice(-40))) end = skipRegex(text, i);
    if (two === "//") end = text.indexOf("\n", i) < 0 ? text.length : text.indexOf("\n", i) - 1;
    if (two === "/*") end = text.indexOf("*/", i) < 0 ? text.length : text.indexOf("*/", i) + 1;
    if (end > i) {
      code += blank(text, i, end);
      i = end;
    } else code += text[i];
  }
  return { code, comments };
}

function longFunctions(code: string): string[] {
  const lines = code.split("\n");
  const open: { line: number; isFunction: boolean }[] = [];
  const found: string[] = [];
  lines.forEach((line, index) => {
    for (const ch of line) {
      if (ch === "{") open.push({ line: index, isFunction: FUNCTION_START.test(line) && !CONTROL.test(line) });
      if (ch !== "}") continue;
      const block = open.pop();
      const length = block ? index - block.line + 1 : 0;
      if (block?.isFunction && length > MAX_FUNCTION_LINES) found.push(`line ${block.line + 1}: ${length} lines`);
    }
  });
  return found;
}

function markupComments(text: string, file: string): number[] {
  const pattern = file.endsWith(".html") ? /<!--|\/\*|^\s*\/\//gm : file.endsWith(".css") ? /\/\*/g : /^\s*#(?!!)/gm;
  return [...text.matchAll(pattern)].map((m) => lineOf(text, m.index));
}

function codeFiles(): string[] {
  const args = ["ls-files", "--cached", "--others", "--exclude-standard"];
  const listed = execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return listed.split("\n").filter((f) => CODE.test(f) && f !== "");
}

function read(file: string): string {
  try {
    return readFileSync(path.join(ROOT, file), "utf8").replace(/\r/g, "");
  } catch {
    return "";
  }
}

function comments(file: string): string[] {
  const text = read(file);
  const lines = file.endsWith(".ts") ? scanScript(text).comments : markupComments(text, file);
  return lines.map((n) => `${file}: line ${n}`);
}

function tooLong(file: string): string[] {
  if (!file.endsWith(".ts")) return [];
  return longFunctions(scanScript(read(file)).code).map((found) => `${file}: ${found}`);
}

test("Test 99: the code has no comments (Rule 10)", () => {
  assert.deepEqual(codeFiles().flatMap(comments), []);
});

test("Test 100: no function is longer than 60 lines (Rule 11)", () => {
  assert.deepEqual(codeFiles().flatMap(tooLong), []);
});
