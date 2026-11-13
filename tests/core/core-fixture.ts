import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type FreshSettings,
  type GameData,
  MersenneTwister,
  type PickerState,
  type RandomSource,
  createLogic,
} from "../../src/core/logic.ts";

export type NamedDraw = [name: string, k: number, n: number];

export interface StateSketch {
  edition?: string;
  off?: string[];
  log?: NamedDraw[][];
}

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const read = (rel: string): string => readFileSync(path.join(ROOT, rel), "utf8");
export const readJson = <T>(rel: string): T => JSON.parse(read(rel)) as T;
export const exists = (rel: string): boolean => existsSync(path.join(ROOT, rel));

export const DATA = readJson<GameData>("assets/data.json");
export const logic = createLogic(DATA);
export const { CIVS, EDITIONS } = logic;
export const MOST = 1000;

export function idOf(name: string): number {
  const civ = CIVS.find((c) => c.name === name);
  if (!civ) throw new Error(`No civ named ${name}`);
  return civ.id;
}

export const namesOf = (ids: Iterable<number>): string[] => [...ids].map((id) => CIVS[id].name);
export const allBut = (...names: string[]): string[] => CIVS.map((c) => c.name).filter((n) => !names.includes(n));
export const range = (from: number, to: number): number[] => Array.from({ length: to - from }, (_, i) => from + i);

export function makeState({ edition = EDITIONS[0], off = [], log = [[]] }: StateSketch = {}): PickerState {
  const s: PickerState = {
    edition,
    off: new Set(off.map(idOf)),
    log: log.map((r) => r.map(([name, k, n]) => [idOf(name), k, n])),
  };
  logic.applyEdition(s);
  return s;
}

export const namedLog = (s: PickerState): NamedDraw[][] =>
  s.log.map((r) => r.map(([id, k, n]) => [CIVS[id].name, k, n]));
export const offNames = (s: PickerState): string[] => namesOf([...s.off].sort((a, b) => a - b));

export const seeded = (seed = 20261016): MersenneTwister => new MersenneTwister(seed);

export function play(s: PickerState, settings: FreshSettings, rng: RandomSource, n: number): number[] {
  const picker = logic.createPicker(rng);
  const draws: number[] = [];
  for (let i = 0; i < n; i++) {
    const id = picker.next(logic.drawCandidates(s, settings));
    if (id === null) throw new Error(`nothing to draw at draw ${i + 1}`);
    logic.recordDraw(s, id);
    draws.push(id);
  }
  return draws;
}

export function countPicks(ids: number[], trials: number, pick: () => number | null): Map<number | null, number> {
  const counts = new Map<number | null, number>(ids.map((id) => [id, 0]));
  for (let i = 0; i < trials; i++) {
    const id = pick();
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function chiSquare(values: number[]): number {
  const expected = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - expected) ** 2 / expected, 0);
}

function chiSquareLimit(df: number): number {
  const z = 3.09;
  return df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3;
}

export function unevenPicks(counts: Map<number | null, number>): string | null {
  const df = counts.size - 1;
  const chi = chiSquare([...counts.values()]);
  if (chi < chiSquareLimit(df)) return null;
  const seen = [...counts].map(([id, n]) => `${id}: ${n}`).join(", ");
  return `uneven picks (chi-square ${chi.toFixed(1)} for ${df} degrees of freedom): ${seen}`;
}
