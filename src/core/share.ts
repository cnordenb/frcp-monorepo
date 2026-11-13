import { type Catalog, inEdition } from "./catalog.ts";
import { type PickerState, applyEdition, closeRound, drawnIds, isOn, poolIds, trimLog } from "./state.ts";

export const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const LINK_VERSION = "1";

const CODE = /^1([A-Za-z0-9_-])([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]+))?$/;

export interface ShareLink {
  edition: string;
  enabled: boolean[];
  draws: number[];
}

export function shareCode(cat: Catalog, s: PickerState, withDraws: boolean): string {
  let code = LINK_VERSION + B64[cat.EDITIONS.indexOf(s.edition)];
  for (let ch = 0; ch < Math.ceil(cat.CIVS.length / 6); ch++) {
    let v = 0;
    for (let b = 0; b < 6; b++) {
      const id = ch * 6 + b;
      if (id >= cat.CIVS.length || isOn(s, id)) v |= 1 << b;
    }
    code += B64[v];
  }
  const draws = drawnIds(s).filter((id) => isOn(s, id));
  if (withDraws && draws.length) code += "." + draws.map((id) => B64[id]).join("");
  return code;
}

function linkCode(text: unknown): string | null {
  let s = String(text).trim();
  const hash = s.indexOf("#");
  if (hash >= 0) s = s.slice(hash + 1);
  if (s.startsWith("p=")) s = s.slice(2);
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

function linkDraws(cat: Catalog, chars: string, enabled: boolean[]): number[] | null {
  const draws: number[] = [];
  for (const ch of chars) {
    const id = B64.indexOf(ch);
    if (id >= cat.CIVS.length || !enabled[id] || draws.includes(id)) return null;
    draws.push(id);
  }
  return draws;
}

export function parseShare(cat: Catalog, text: unknown): ShareLink | null {
  const code = linkCode(text);
  const m = code === null ? null : CODE.exec(code);
  if (!m) return null;
  const ed = B64.indexOf(m[1]);
  if (ed >= cat.EDITIONS.length) return null;
  const edition = cat.EDITIONS[ed];
  const bits = m[2];
  const enabled = cat.CIVS.map((c) => {
    if (!inEdition(cat, c, edition)) return false;
    const ch = Math.floor(c.id / 6);
    return ch >= bits.length || ((B64.indexOf(bits[ch]) >> (c.id % 6)) & 1) === 1;
  });
  const draws = linkDraws(cat, m[3] || "", enabled);
  return draws ? { edition, enabled, draws } : null;
}

export function applyLink(cat: Catalog, s: PickerState, link: ShareLink): void {
  s.edition = link.edition;
  s.off = new Set(cat.CIVS.filter((c) => !link.enabled[c.id]).map((c) => c.id));
  applyEdition(cat, s);
  closeRound(s);
  if (link.draws.length) {
    const n = poolIds(cat, s).length;
    s.log[s.log.length - 1] = link.draws.map((id, i) => [id, i + 1, n]);
  }
  trimLog(s);
}
