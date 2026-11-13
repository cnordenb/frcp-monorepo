import { type Catalog, inEdition } from "./catalog.ts";

export const LOG_CAP = 256;

export type Draw = [id: number, k: number, n: number];
export type Round = Draw[];

export interface PickerState {
  edition: string;
  off: Set<number>;
  log: Round[];
}

export interface SavedState {
  v: 1;
  edition: string;
  disabled: number[];
  log: Round[];
}

export function emptyState(cat: Catalog): PickerState {
  return { edition: cat.EDITIONS[0], off: new Set(), log: [[]] };
}

export function applyEdition(cat: Catalog, s: PickerState): void {
  for (const c of cat.CIVS) if (!inEdition(cat, c, s.edition)) s.off.add(c.id);
}

export function parseJson(raw: string | null): unknown {
  try {
    return JSON.parse(raw as string);
  } catch {
    return null;
  }
}

function parseRounds(log: unknown, isId: (x: unknown) => boolean): Round[] {
  const rounds: Round[] = [];
  for (const r of Array.isArray(log) ? log : []) {
    if (!Array.isArray(r)) continue;
    const draws = r.filter((e) => Array.isArray(e) && isId(e[0]) && Number.isInteger(e[1]) && Number.isInteger(e[2]));
    rounds.push(draws.map((e) => [e[0], e[1], e[2]]));
  }
  const kept = rounds.filter((r, i, all) => r.length > 0 || i === all.length - 1);
  if (!kept.length) kept.push([]);
  const seen = new Set<number>();
  kept[kept.length - 1] = kept[kept.length - 1].filter((e) => {
    if (seen.has(e[0])) return false;
    seen.add(e[0]);
    return true;
  });
  return kept;
}

export function parseState(cat: Catalog, raw: string | null): PickerState | null {
  const data = parseJson(raw) as { edition?: unknown; disabled?: unknown; log?: unknown } | null;
  if (!data || typeof data !== "object" || !cat.EDITIONS.includes(data.edition as string)) return null;
  const isId = (x: unknown): boolean => Number.isInteger(x) && (x as number) >= 0 && (x as number) < cat.CIVS.length;
  const disabled = Array.isArray(data.disabled) ? data.disabled.filter(isId) : [];
  const s: PickerState = { edition: data.edition as string, off: new Set(disabled), log: parseRounds(data.log, isId) };
  applyEdition(cat, s);
  return s;
}

export function serialiseState(s: PickerState): SavedState {
  return { v: 1, edition: s.edition, disabled: [...s.off].sort((a, b) => a - b), log: s.log };
}

export function hasContent(cat: Catalog, s: PickerState): boolean {
  return s.edition !== cat.EDITIONS[0] || s.off.size > 0 || s.log.some((r) => r.length > 0);
}

export function isOn(s: PickerState, id: number): boolean {
  return !s.off.has(id);
}

export function poolIds(cat: Catalog, s: PickerState): number[] {
  return cat.CIVS.filter((c) => isOn(s, c.id)).map((c) => c.id);
}

export function round(s: PickerState): Round {
  return s.log[s.log.length - 1];
}

export function drawnIds(s: PickerState): number[] {
  return round(s).map((e) => e[0]);
}

export function drawnCount(s: PickerState): number {
  return drawnIds(s).filter((id) => isOn(s, id)).length;
}

export function remainingIds(cat: Catalog, s: PickerState): number[] {
  const drawn = new Set(drawnIds(s));
  return poolIds(cat, s).filter((id) => !drawn.has(id));
}

export function closeRound(s: PickerState): void {
  if (round(s).length) s.log.push([]);
}

export function trimLog(s: PickerState): void {
  let total = s.log.reduce((n, r) => n + r.length, 0);
  while (total > LOG_CAP && s.log.length > 1) {
    const oldest = s.log[0];
    if (oldest.length) {
      oldest.shift();
      total--;
    }
    if (!oldest.length) s.log.shift();
  }
}
