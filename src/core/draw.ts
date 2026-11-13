import type { Catalog } from "./catalog.ts";
import type { RandomSource } from "./mersenne.ts";
import { type PickerState, closeRound, drawnCount, poolIds, remainingIds, round, trimLog } from "./state.ts";

export interface FreshSettings {
  fresh: boolean;
  freshN: number;
}

export interface Picker {
  next(from: number[]): number | null;
}

export function freshMax(poolSize: number): number {
  return Math.max(1, Math.floor(poolSize / 2));
}

export function freshLimit(poolSize: number, freshN: number): number {
  return Math.min(freshN, freshMax(poolSize));
}

export function recentCivs(s: PickerState, n: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (let r = s.log.length - 1; r >= 0 && out.length < n; r--) {
    const entries = s.log[r];
    for (let i = entries.length - 1; i >= 0 && out.length < n; i--) {
      const id = entries[i][0];
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export function drawCandidates(cat: Catalog, s: PickerState, { fresh, freshN }: FreshSettings): number[] {
  const pool = poolIds(cat, s);
  const remaining = remainingIds(cat, s);
  const left = remaining.length ? remaining : pool;
  if (!fresh || pool.length < 2) return left;
  const recent = recentCivs(s, freshLimit(pool.length, freshN));
  for (let n = recent.length; n > 0; n--) {
    const skip = new Set(recent.slice(0, n));
    const freshIds = left.filter((id) => !skip.has(id));
    if (freshIds.length) return freshIds;
  }
  return left;
}

export function createPicker(rng: RandomSource | null): Picker {
  let ahead: { from: number[]; id: number | null } = { from: [], id: null };
  function next(from: number[]): number | null {
    if (!from.length || !rng) {
      ahead = { from, id: null };
      return null;
    }
    const before = new Set(ahead.from);
    const joined = from.filter((id) => !before.has(id));
    const dropped = from.length - joined.length < ahead.from.length;
    const pick = (ids: number[]): number => ids[rng.int(0, ids.length - 1)];
    let id = ahead.id;
    if (id === null || (joined.length && dropped)) id = pick(from);
    else if (joined.length && rng.int(0, from.length - 1) >= ahead.from.length) id = pick(joined);
    else if (!joined.length && !from.includes(id)) id = pick(from);
    ahead = { from, id };
    return id;
  }
  return { next };
}

export function recordDraw(cat: Catalog, s: PickerState, id: number): void {
  if (!remainingIds(cat, s).length) closeRound(s);
  round(s).push([id, drawnCount(s) + 1, poolIds(cat, s).length]);
  trimLog(s);
}
