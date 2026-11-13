import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { GameData } from "../src/core/catalog.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const at = (...parts: string[]): string => path.join(ROOT, "assets", ...parts);
const CIV_COLS = 8;
const CIV_CELL = 104;
const CIV_ATLAS_CELL = 30;
const DLC_COLS = 6;
const DLC_CELL = 128;
const WEBP = { quality: 90, effort: 6 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

interface Grid {
  paths: string[];
  cols: number;
  cell: number;
  outCell: number;
  out: string;
}

async function cellImage(file: string, cell: number, outCell: number): Promise<Buffer> {
  const image = sharp(file).ensureAlpha();
  const { width, height } = await image.metadata();
  if (width !== cell || height !== cell) {
    throw new Error(`${path.basename(file)} is ${width}x${height}, expected ${cell}x${cell}`);
  }
  return (outCell === cell ? image : image.resize(outCell, outCell, { kernel: "lanczos3" })).png().toBuffer();
}

async function report(out: string, what: string, css: string): Promise<void> {
  const kb = Math.floor((await stat(out)).size / 1024);
  console.log(`${path.relative(ROOT, out)}: ${what}, ${kb} KB  ->  CSS: ${css}`);
}

async function buildGrid({ paths, cols, cell, outCell, out }: Grid): Promise<void> {
  const rows = Math.ceil(paths.length / cols);
  const cells = await Promise.all(paths.map((p) => cellImage(p, cell, outCell)));
  const placed = cells.map((input, i) => ({ input, left: (i % cols) * outCell, top: Math.floor(i / cols) * outCell }));
  const canvas = { width: cols * outCell, height: rows * outCell, channels: 4 as const, background: CLEAR };
  await sharp({ create: canvas }).composite(placed).webp(WEBP).toFile(out);
  await report(out, `${paths.length} icons, ${cols} cols x ${rows} rows`, `--cols: ${cols}; --rows: ${rows};`);
}

async function buildBanners(data: GameData): Promise<void> {
  const files = data.editions.map((ed) => at("editions", ed.icon, `${ed.banner}.webp`));
  const sizes = await Promise.all(files.map((f) => sharp(f).metadata()));
  const { width, height } = sizes[0];
  if (sizes.some((s) => s.width !== width || s.height !== height)) {
    throw new Error("all edition banners must be the same size");
  }
  const placed = files.map((input, i) => ({ input, left: 0, top: i * height }));
  const out = at("atlases", "edition_banners_atlas.webp");
  const canvas = { width, height: height * files.length, channels: 4 as const, background: CLEAR };
  await sharp({ create: canvas }).composite(placed).webp(WEBP).toFile(out);
  await report(out, `${files.length} banners`, `--rows: ${files.length};`);
}

function civPaths(data: GameData): string[] {
  const civs = [...data.civs].sort((a, b) => a.id - b.id);
  if (civs.some((c, i) => c.id !== i)) throw new Error("civ ids in data.json must run 0..n-1 with no gaps");
  const files = [...civs.map((c) => c.name.toLowerCase()), "random"];
  return files.map((file) => at("civs", file, `${file}.webp`));
}

function dlcPaths(data: GameData): string[] {
  const editions = data.editions.flatMap((ed) =>
    ["", "_hover", "_pressed"].map((suffix) => at("editions", ed.icon, `${ed.icon}${suffix}.webp`)),
  );
  const icons = Object.values(data.dlcs).flatMap((dlc) => (dlc.icon ? [dlc.icon] : []));
  return [...editions, ...icons.map((icon) => at("dlcs", icon, `${icon}.webp`))];
}

const data = JSON.parse(await readFile(at("data.json"), "utf8")) as GameData;
const civs = { paths: civPaths(data), cols: CIV_COLS, cell: CIV_CELL, outCell: CIV_ATLAS_CELL };
await buildGrid({ ...civs, out: at("atlases", "civicon_atlas.webp") });
const dlcs = { paths: dlcPaths(data), cols: DLC_COLS, cell: DLC_CELL, outCell: DLC_CELL };
await buildGrid({ ...dlcs, out: at("atlases", "dlc_atlas.webp") });
await buildBanners(data);
