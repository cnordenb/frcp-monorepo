import type { Catalog } from "./catalog.ts";
import { freshMax, recentCivs } from "./draw.ts";
import { type PickerState, applyEdition, drawnIds, isOn, poolIds } from "./state.ts";

type Section = "states" | "draws" | "edition" | "history";

const SECTIONS = new Map<string, Section>([
  ["CivStates:", "states"],
  ["DrawnCivs:", "draws"],
  ["EditionState:", "edition"],
  ["ContfreshCivArray:", "history"],
]);

export interface Preset {
  edition: string;
  off: Set<number>;
  draws: number[];
  history: number[];
}

export function presetText(cat: Catalog, s: PickerState, fresh: boolean): string {
  const names = (ids: number[]): string[] => ids.map((id) => cat.CIVS[id].name);
  const lines = [
    "CivStates:",
    ...cat.CIVS.map((c) => `${c.name} ${isOn(s, c.id) ? 1 : 0}`),
    "DrawnCivs:",
    ...names(drawnIds(s).filter((id) => isOn(s, id))),
    "EditionState:",
    s.edition,
  ];
  if (fresh) {
    const history = recentCivs(s, freshMax(poolIds(cat, s).length)).reverse();
    lines.push("ContfreshCivArray:", ...names(history));
  }
  return lines.map((line) => line + "\r\n").join("");
}

function readLine(cat: Catalog, preset: Preset, ids: Map<string, number>, section: Section | null, line: string): void {
  const id = ids.get(line);
  if (section === "states") {
    const [name, on] = line.split(/\s+/);
    const civ = ids.get(name);
    if (civ !== undefined && parseInt(on, 10) === 0) preset.off.add(civ);
  } else if (section === "draws" && id !== undefined) preset.draws.push(id);
  else if (section === "history" && id !== undefined) preset.history.push(id);
  else if (section === "edition" && cat.EDITIONS.includes(line)) preset.edition = line;
}

export function parsePreset(cat: Catalog, text: string): Preset | null {
  const preset: Preset = { edition: cat.EDITIONS[0], off: new Set(), draws: [], history: [] };
  const ids = new Map(cat.CIVS.map((c) => [c.name, c.id]));
  let section: Section | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) break;
    const heading = SECTIONS.get(line);
    if (heading) section = heading;
    else readLine(cat, preset, ids, section, line);
  }
  return section ? preset : null;
}

export function applyPreset(cat: Catalog, s: PickerState, preset: Preset): void {
  s.edition = preset.edition;
  s.off = new Set(preset.off);
  applyEdition(cat, s);
  const n = poolIds(cat, s).length;
  const draws = preset.draws.filter((id, i) => isOn(s, id) && preset.draws.indexOf(id) === i);
  const earlier = preset.history.filter((id, i) => !draws.includes(id) && preset.history.lastIndexOf(id) === i);
  s.log = [draws.map((id, i) => [id, i + 1, n])];
  if (earlier.length) s.log.unshift(earlier.map((id) => [id, 0, 0]));
}
