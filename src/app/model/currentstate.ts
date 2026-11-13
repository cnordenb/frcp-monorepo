import type { Civ, Round } from "../../core/logic.ts";
import { ctx } from "../context.ts";

export function isOn(id: number): boolean {
  return ctx.logic.isOn(ctx.state, id);
}

export function poolIds(): number[] {
  return ctx.logic.poolIds(ctx.state);
}

export function round(): Round {
  return ctx.logic.round(ctx.state);
}

export function drawnIds(): number[] {
  return ctx.logic.drawnIds(ctx.state);
}

export function drawnCount(): number {
  return ctx.logic.drawnCount(ctx.state);
}

export function remainingIds(): number[] {
  return ctx.logic.remainingIds(ctx.state);
}

export function currentCiv(): Civ | null {
  const r = round();
  return r.length ? ctx.logic.CIVS[r[r.length - 1][0]] : null;
}

export function currentId(): number | null {
  const civ = currentCiv();
  return civ ? civ.id : null;
}
