import type { Round } from "../../core/logic.ts";
import { ctx } from "../context.ts";
import { currentId, drawnCount, poolIds, round } from "../model/currentstate.ts";
import { UNDO_CAP } from "../model/hotkeytables.ts";
import { commit } from "../model/settingsstore.ts";
import { jingle, sfx } from "../sound/soundplayer.ts";
import { render } from "../view/renderpage.ts";
import { toast } from "../view/tooltips.ts";

export interface Snapshot {
  edition: string;
  off: number[];
  log: Round[];
}

export function drawCandidates(): number[] {
  return ctx.logic.drawCandidates(ctx.state, ctx.settings);
}

export function nextDraw(from: number[] = drawCandidates()): number | null {
  return ctx.picker.next(from);
}

export function closeRound(): void {
  ctx.logic.closeRound(ctx.state);
}

function revealSound(id: number | null): void {
  if (ctx.settings.jingles) jingle(id);
  else sfx("button");
}

export function draw({ silent = false } = {}): void {
  const pool = poolIds();
  if (!pool.length || !ctx.rng) {
    if (!silent) sfx("error");
    ctx.ui.flash = ctx.rng ? "Empty pool!" : "No random source";
    render();
    return;
  }
  const id = nextDraw();
  if (id === null) return;
  recordUndo();
  ctx.logic.recordDraw(ctx.state, id);
  commit();
  if (silent) return;
  revealSound(id);
}

export function reset(): void {
  if (!round().length) return;
  recordUndo();
  closeRound();
  commit();
  if (ctx.settings.jingles && ctx.ui.tab !== 2) jingle(null);
  else sfx("button");
}

export function rerollCivs(): number[] | null {
  const entries = round();
  const current = entries[entries.length - 1];
  if (!current || !ctx.rng) return null;
  entries.pop();
  const others = drawCandidates().filter((id) => id !== current[0]);
  entries.push(current);
  return others.length ? others : null;
}

export function reroll(): void {
  const others = rerollCivs();
  if (!others) {
    sfx("error");
    return;
  }
  ctx.undoStacks.redo.length = 0;
  const entries = round();
  entries.pop();
  const id = nextDraw(others) as number;
  entries.push([id, drawnCount() + 1, poolIds().length]);
  commit();
  revealSound(id);
}

export function snapshot(): string {
  const { edition, off, log } = ctx.state;
  const snap: Snapshot = { edition, off: [...off], log };
  return JSON.stringify(snap);
}

function restore(snap: string): void {
  const s = JSON.parse(snap) as Snapshot;
  ctx.state.edition = s.edition;
  ctx.state.off = new Set(s.off);
  ctx.state.log = s.log;
}

export function pushUndo(snap: string): void {
  const { undo, redo } = ctx.undoStacks;
  undo.push(snap);
  if (undo.length > UNDO_CAP) undo.shift();
  redo.length = 0;
}

export function recordUndo(): void {
  pushUndo(snapshot());
}

export function clearHistory(): void {
  ctx.undoStacks.undo.length = 0;
  ctx.undoStacks.redo.length = 0;
}

export function beforeReplace(): void {
  if (ctx.simple) recordUndo();
  else clearHistory();
}

function step(from: string[], to: string[]): void {
  const undoing = from === ctx.undoStacks.undo;
  const snap = from.pop();
  if (snap === undefined) {
    sfx("error");
    if (ctx.simple) toast(undoing ? "Nothing to undo" : "Nothing to redo");
    return;
  }
  to.push(snapshot());
  restore(snap);
  commit();
  if (ctx.simple) toast(undoing ? "Undone" : "Redone");
  revealSound(currentId());
}

export function undo(): void {
  step(ctx.undoStacks.undo, ctx.undoStacks.redo);
}

export function redo(): void {
  step(ctx.undoStacks.redo, ctx.undoStacks.undo);
}

export function clearLog(): void {
  sfx("button");
  if (ctx.simple && ctx.state.log.length < 2) {
    toast("There are no past rounds to clear");
    return;
  }
  beforeReplace();
  ctx.state.log = [round()];
  commit();
  if (ctx.simple) toast("Log cleared. Undo brings it back.");
}
