import type { Logic, Picker, PickerState, RandomSource } from "../core/logic.ts";
import type { HotkeyBindings } from "./bindings/hotkey-bindings.ts";
import type { KeyPair } from "./model/hotkeytables.ts";
import type { Settings } from "./model/settingsstore.ts";
import type { Platform } from "./platform.ts";

export interface Els {
  client: HTMLElement;
  panel: HTMLElement;
  tabs: HTMLElement[];
  civIcon: HTMLElement;
  civGhost: HTMLElement;
  civName: HTMLElement;
  counter: HTMLElement;
  drawnCount: HTMLElement;
  drawnLog: HTMLElement;
  remainingCount: HTMLElement;
  remainingLog: HTMLElement;
  showRemaining: HTMLInputElement;
  edIcon: HTMLElement;
  enabledCount: HTMLElement;
  autoToggle: HTMLInputElement;
  autoReset: HTMLInputElement;
  editionButtons: HTMLButtonElement[];
  tip: HTMLElement;
}

export interface UiState {
  tab: number;
  flash: string | null;
}

export interface UndoStacks {
  undo: string[];
  redo: string[];
}

export type Actions = Record<string, () => unknown>;

export interface Context {
  platform: Platform;
  simple: boolean;
  logic: Logic;
  settings: Settings;
  state: PickerState;
  ui: UiState;
  undoStacks: UndoStacks;
  rng: RandomSource | null;
  picker: Picker;
  els: Els;
  randomCell: number;
  dlcIcons: string[];
  tabKeys: KeyPair[][];
  bindings: HotkeyBindings | null;
  actionText: Record<string, string>;
  actions: Actions;
  phone: MediaQueryList;
}

export const ctx = {} as Context;
