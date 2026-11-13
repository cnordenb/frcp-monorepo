import { type Civ, type GameData, createCatalog, editionTotal, inEdition } from "./catalog.ts";
import { type FreshSettings, createPicker, drawCandidates } from "./draw.ts";
import { freshLimit, freshMax, recentCivs, recordDraw } from "./draw.ts";
import { type Preset, applyPreset, parsePreset, presetText } from "./preset.ts";
import { type ShareLink, applyLink, parseShare, shareCode } from "./share.ts";
import * as st from "./state.ts";

export { MersenneTwister, type RandomSource } from "./mersenne.ts";
export { B64, LINK_VERSION, type ShareLink } from "./share.ts";
export { LOG_CAP, parseJson, type Draw, type PickerState, type Round, type SavedState } from "./state.ts";
export type { Civ, DlcData, EditionData, GameData } from "./catalog.ts";
export type { FreshSettings, Picker } from "./draw.ts";
export type { Preset } from "./preset.ts";

type S = st.PickerState;

export function createLogic(data: GameData) {
  const cat = createCatalog(data);
  return {
    ...cat,
    inEdition: (civ: Civ, edition: string) => inEdition(cat, civ, edition),
    editionTotal: (edition: string) => editionTotal(cat, edition),
    emptyState: () => st.emptyState(cat),
    applyEdition: (s: S) => st.applyEdition(cat, s),
    parseState: (raw: string | null) => st.parseState(cat, raw),
    serialiseState: st.serialiseState,
    hasContent: (s: S) => st.hasContent(cat, s),
    isOn: st.isOn,
    poolIds: (s: S) => st.poolIds(cat, s),
    round: st.round,
    drawnIds: st.drawnIds,
    drawnCount: st.drawnCount,
    remainingIds: (s: S) => st.remainingIds(cat, s),
    closeRound: st.closeRound,
    trimLog: st.trimLog,
    freshMax,
    freshLimit,
    recentCivs,
    drawCandidates: (s: S, settings: FreshSettings) => drawCandidates(cat, s, settings),
    createPicker,
    recordDraw: (s: S, id: number) => recordDraw(cat, s, id),
    shareCode: (s: S, withDraws: boolean) => shareCode(cat, s, withDraws),
    parseShare: (text: unknown) => parseShare(cat, text),
    applyLink: (s: S, link: ShareLink) => applyLink(cat, s, link),
    presetText: (s: S, fresh: boolean) => presetText(cat, s, fresh),
    parsePreset: (text: string) => parsePreset(cat, text),
    applyPreset: (s: S, preset: Preset) => applyPreset(cat, s, preset),
  };
}

export type Logic = ReturnType<typeof createLogic>;
