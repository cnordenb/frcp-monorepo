import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { type BuildOptions, build } from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const at = (...parts: string[]): string => path.join(ROOT, ...parts);

const PAGES = [
  ["picker.html", "index.html"],
  ["simple.html", "simple/index.html"],
  ["civexplorer.html", "civexplorer/index.html"],
];

const SITES: Record<string, string> = {
  web: "src/web/web.ts",
  desktop: "src/desktop/desktop.ts",
  mobile: "src/mobile/mobile.ts",
};

const BUNDLE: BuildOptions = { bundle: true, target: "es2022", minify: true, logLevel: "warning" };
const shipped = (source: string): boolean => path.basename(source) !== "sources";

async function copyPages(out: string): Promise<void> {
  for (const [from, to] of PAGES) {
    await mkdir(path.dirname(path.join(out, to)), { recursive: true });
    await copyFile(at("src/web/pages", from), path.join(out, to));
  }
}

async function buildSite(name: string): Promise<void> {
  const out = at("dist", name);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await copyPages(out);
  await cp(at("src/web/styles"), path.join(out, "styles"), { recursive: true });
  await cp(at("assets"), path.join(out, "assets"), { recursive: true, filter: shipped });
  await copyFile(at("assets/favicon.ico"), path.join(out, "favicon.ico"));
  await build({ ...BUNDLE, entryPoints: [at(SITES[name])], format: "esm", outfile: path.join(out, "script.js") });
}

async function buildWebExtras(): Promise<void> {
  await cp(at("src/web/site"), at("dist/web"), { recursive: true });
}

async function buildDesktopShell(): Promise<void> {
  const node: BuildOptions = { ...BUNDLE, platform: "node", external: ["electron"], minify: false };
  const main = at("dist/desktop/main.js");
  const preload = at("dist/desktop/preload.cjs");
  await build({ ...node, entryPoints: [at("src/desktop/main.ts")], format: "esm", outfile: main });
  await build({ ...node, entryPoints: [at("src/desktop/preload.ts")], format: "cjs", outfile: preload });
}

const EXTRAS: Record<string, () => Promise<void>> = { web: buildWebExtras, desktop: buildDesktopShell };

async function run(names: string[]): Promise<void> {
  for (const name of names.length ? names : Object.keys(SITES)) {
    if (!SITES[name]) throw new Error(`Unknown platform "${name}": use ${Object.keys(SITES).join(", ")}`);
    await buildSite(name);
    await EXTRAS[name]?.();
    console.log(`built dist/${name}`);
  }
}

await run(process.argv.slice(2));
