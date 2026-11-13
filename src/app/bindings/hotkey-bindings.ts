import { hotkeysOf, scopesOverlap } from "./hotkey-table.ts";
import type { Hotkey, HotkeyCatalog, HotkeyScope, TabScope } from "./hotkey-table.ts";
import { CLEARING_KEY, NO_KEY, checkKeystroke, parseKeyName } from "./keystroke.ts";

export type KeyChoice = "assigned" | "cleared" | "kept" | "unnamed";

export interface KeyChange {
  readonly choice: KeyChoice;
  readonly id: string;
  readonly key: string;
  readonly takenFrom: readonly string[];
}

export interface BoundHotkey extends Hotkey {
  readonly key: string;
}

export type SavedHotkeys = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class HotkeyBindings {
  readonly hotkeys: readonly Hotkey[];
  private readonly byId: ReadonlyMap<string, Hotkey>;
  private readonly keys = new Map<string, string>();

  constructor(catalog: HotkeyCatalog) {
    this.hotkeys = hotkeysOf(catalog);
    this.byId = new Map(this.hotkeys.map((hotkey) => [hotkey.id, hotkey]));
    this.restoreDefaults();
  }

  isUsed(id: string): boolean {
    return this.byId.get(id)?.used ?? false;
  }

  keyOf(id: string): string {
    return this.keys.get(id) ?? NO_KEY;
  }

  hotkeyFor(key: string, tab: TabScope): Hotkey | null {
    if (key === NO_KEY) return null;
    const held = this.hotkeys.filter((hotkey) => hotkey.used && this.keyOf(hotkey.id) === key);
    const global = held.find((hotkey) => hotkey.scope === "global");
    return global ?? held.findLast((hotkey) => hotkey.scope === tab) ?? null;
  }

  actionFor(key: string, tab: TabScope): string | null {
    return this.hotkeyFor(key, tab)?.action ?? null;
  }

  clashesWith(id: string, key: string): string[] {
    const hotkey = this.byId.get(id);
    if (hotkey === undefined || key === NO_KEY) return [];
    return this.hotkeys
      .filter((other) => other.id !== id && other.used && this.keyOf(other.id) === key)
      .filter((other) => scopesOverlap(hotkey.scope, other.scope))
      .map((other) => other.id);
  }

  assign(id: string, key: string): boolean {
    const name = parseKeyName(key);
    if (!this.isUsed(id) || name === null || checkKeystroke(name) !== "usable") return false;
    for (const clash of this.clashesWith(id, name)) this.clear(clash);
    this.keys.set(id, name);
    return true;
  }

  clear(id: string): void {
    if (this.byId.has(id)) this.keys.set(id, NO_KEY);
  }

  restoreDefaults(): void {
    for (const hotkey of this.hotkeys) this.keys.set(hotkey.id, hotkey.defaultKey);
  }

  choose(id: string, key: string): KeyChange | null {
    if (!this.isUsed(id)) return null;
    if (key === CLEARING_KEY) {
      this.clear(id);
      return { choice: "cleared", id, key, takenFrom: [] };
    }
    const use = checkKeystroke(key);
    if (use !== "usable") return { choice: use, id, key, takenFrom: [] };
    const takenFrom = this.clashesWith(id, key);
    this.assign(id, key);
    return { choice: "assigned", id, key: this.keyOf(id), takenFrom };
  }

  list(scope: HotkeyScope): BoundHotkey[] {
    return this.hotkeys
      .filter((hotkey) => hotkey.scope === scope && hotkey.used)
      .map((hotkey) => ({ ...hotkey, key: this.keyOf(hotkey.id) }));
  }

  serialise(): SavedHotkeys {
    const changed = this.hotkeys.filter((hotkey) => this.keyOf(hotkey.id) !== hotkey.defaultKey);
    return Object.fromEntries(changed.map((hotkey) => [hotkey.id, this.keyOf(hotkey.id)]));
  }

  load(saved: unknown): void {
    this.restoreDefaults();
    if (!isRecord(saved)) return;
    for (const hotkey of this.hotkeys) {
      const text = Object.hasOwn(saved, hotkey.id) ? saved[hotkey.id] : undefined;
      const name = typeof text === "string" ? parseKeyName(text) : null;
      if (name === NO_KEY) this.clear(hotkey.id);
      else if (name !== null) this.assign(hotkey.id, name);
    }
  }
}

export function parseHotkeys(catalog: HotkeyCatalog, saved: unknown): HotkeyBindings {
  const bindings = new HotkeyBindings(catalog);
  bindings.load(saved);
  return bindings;
}

export function savedHotkeysOf(value: unknown): SavedHotkeys {
  if (!isRecord(value)) return {};
  const named = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return Object.fromEntries(named);
}
