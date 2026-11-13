export interface LinkData {
  text: string;
  url: string;
}

export interface ToggleLayout {
  left: number;
  top: number;
  step: number;
  size: number;
  gap: number;
}

export interface EditionData {
  id: string;
  name: string;
  short: string;
  year: number;
  series: string;
  icon: string;
  banner: string;
  url: string | null;
  storeNote?: string;
  legacyJingles?: boolean;
  dlcToggles: string[];
  dlcToggleLayout: ToggleLayout;
  olderDlcs: string[];
  links?: LinkData[];
}

export interface DlcData {
  name: string;
  short?: string;
  edition: string;
  icon?: string;
  released?: string;
}

export interface CivData {
  id: number;
  name: string;
  dlc: string;
  techTree?: string;
}

export interface GameData {
  editions: EditionData[];
  dlcs: Record<string, DlcData>;
  civs: CivData[];
}

export interface Civ {
  id: number;
  name: string;
  dlc: string;
  edition: string;
  legacy: boolean;
  file: string;
  techTree: string;
}

export interface Catalog {
  EDITIONS: string[];
  EDITION_INFO: Record<string, EditionData>;
  DLCS: Record<string, DlcData>;
  CIVS: Civ[];
  DISPLAY_ORDER: Civ[];
}

export function createCatalog(data: GameData): Catalog {
  const EDITION_INFO = Object.fromEntries(data.editions.map((e) => [e.id, e]));
  const CIVS: Civ[] = [];
  for (const { id, name, dlc, techTree } of data.civs) {
    const edition = data.dlcs[dlc].edition;
    const legacy = EDITION_INFO[edition].legacyJingles === true;
    CIVS[id] = { id, name, dlc, edition, legacy, file: name.toLowerCase(), techTree: techTree || name };
  }
  const DISPLAY_ORDER = [...CIVS].sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { EDITIONS: data.editions.map((e) => e.id), EDITION_INFO, DLCS: data.dlcs, CIVS, DISPLAY_ORDER };
}

export function inEdition(cat: Catalog, civ: Civ, edition: string): boolean {
  return cat.EDITION_INFO[civ.edition].year <= cat.EDITION_INFO[edition].year;
}

export function editionTotal(cat: Catalog, edition: string): number {
  return cat.CIVS.filter((c) => inEdition(cat, c, edition)).length;
}
