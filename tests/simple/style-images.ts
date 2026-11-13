import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const STYLES = path.resolve(import.meta.dirname, "..", "..", "src", "web", "styles");
const SIMPLE_SHEET = "simple.css";
const FULL_PAGE_ONLY = /:not\(\[data-simple\]\)/;

function cssRules(css: string): [selector: string, body: string][] {
  const rules: [string, string][] = [];
  let i = 0;
  const walk = (end: number): void => {
    while (i < end) {
      const open = css.indexOf("{", i);
      if (open < 0 || open >= end) return;
      const head = css.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      for (; depth && j < end; j++) depth += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0;
      if (head.startsWith("@")) {
        i = open + 1;
        walk(j - 1);
      } else rules.push([head, css.slice(open + 1, j - 1)]);
      i = j;
    }
  };
  walk(css.length);
  return rules;
}

const loadsImage = (body: string): boolean => body.split(";").some((d) => /url\(/.test(d) && !/^\s*--/.test(d));

function unscopedImages(sheet: string): string[] {
  const css = readFileSync(path.join(STYLES, sheet), "utf8");
  if (sheet === SIMPLE_SHEET) return /url\(/.test(css) ? [`${sheet} loads an image`] : [];
  const withImages = cssRules(css).filter(([, body]) => loadsImage(body));
  const selectors = withImages.flatMap(([selector]) => selector.split(/,(?![^(]*\))/));
  const unscoped = selectors.filter((selector) => !FULL_PAGE_ONLY.test(selector));
  return unscoped.map((selector) => `${sheet} loads an image in simple mode for ${selector.trim()}`);
}

export function imagesStylesLoadInSimpleMode(): string[] {
  return readdirSync(STYLES).filter((file) => file.endsWith(".css")).flatMap(unscopedImages);
}
