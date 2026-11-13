export interface AddedSource {
  name: string;
  released?: string;
}

export const HISTORY_NOT_FOUND = "History not found.";

export function firstMatch(names: readonly string[], typed: string): number {
  const start = typed.toLowerCase();
  return names.findIndex((name) => name.toLowerCase().startsWith(start));
}

export function addedText(dlc: AddedSource): string {
  return dlc.released ? `${dlc.released} (${dlc.name})` : dlc.name;
}

export function historyUrl(root: string, file: string): string {
  return `${root}assets/civs/${file}/${file}.txt`;
}

export function yesNo(flag: boolean): string {
  return flag ? "Yes" : "No";
}

export function readableText(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").trim();
}
