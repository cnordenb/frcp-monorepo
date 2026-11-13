export const NO_KEY = "None";
export const CLEARING_KEY = "Backspace";

export type KeystrokeUse = "usable" | "unnamed" | "kept";

export interface KeyPress {
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
}

const MODIFIERS = ["Ctrl+", "Alt+", "Shift+"] as const;
type Modifier = (typeof MODIFIERS)[number];

interface SplitKey {
  readonly modifiers: readonly Modifier[];
  readonly label: string;
}

const DIGITS = "0123456789".split("");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const FUNCTION_KEYS = Array.from({ length: 12 }, (_, index) => `F${index + 1}`);
const OTHER_KEYS = [
  "Backspace", "Tab", "Enter", "Esc", "Space", "PgUp", "PgDn", "End", "Home", "Left", "Up", "Right", "Down",
  "Insert", "Delete", "Num *", "Num +", "Num -", "Num .", "Num /",
];

export const KEY_LABELS: readonly string[] = [
  ...DIGITS, ...LETTERS, ...DIGITS.map((digit) => `Num ${digit}`), ...FUNCTION_KEYS, ...OTHER_KEYS,
];

const LABEL_IN_LOWER_CASE = new Map(KEY_LABELS.map((label) => [label.toLowerCase(), label]));

const LABEL_OF_CODE = new Map([
  ["NumpadMultiply", "Num *"], ["NumpadAdd", "Num +"], ["NumpadSubtract", "Num -"], ["NumpadDecimal", "Num ."],
  ["NumpadDivide", "Num /"], ["Space", "Space"],
]);

const LABEL_OF_KEY = new Map([
  [" ", "Space"], ["Enter", "Enter"], ["Tab", "Tab"], ["Escape", "Esc"], ["Backspace", "Backspace"],
  ["PageUp", "PgUp"], ["PageDown", "PgDn"], ["End", "End"], ["Home", "Home"], ["ArrowLeft", "Left"],
  ["ArrowUp", "Up"], ["ArrowRight", "Right"], ["ArrowDown", "Down"], ["Insert", "Insert"], ["Delete", "Delete"],
]);

const KEPT_BY_THE_SYSTEM: readonly SplitKey[] = [
  { label: "Tab", modifiers: ["Alt+"] },
  { label: "Esc", modifiers: ["Alt+"] },
  { label: "Esc", modifiers: ["Ctrl+"] },
  { label: "F4", modifiers: ["Alt+"] },
  { label: "Space", modifiers: ["Alt+"] },
  { label: "Delete", modifiers: ["Ctrl+", "Alt+"] },
  { label: "F12", modifiers: [] },
  { label: "I", modifiers: ["Ctrl+", "Shift+"] },
];

function splitKeyName(text: string): SplitKey | null {
  let rest = text.toLowerCase();
  const modifiers: Modifier[] = [];
  for (const modifier of MODIFIERS) {
    if (!rest.startsWith(modifier.toLowerCase())) continue;
    modifiers.push(modifier);
    rest = rest.slice(modifier.length);
  }
  const label = LABEL_IN_LOWER_CASE.get(rest);
  return label === undefined ? null : { modifiers, label };
}

export function parseKeyName(text: string): string | null {
  if (text.toLowerCase() === NO_KEY.toLowerCase()) return NO_KEY;
  const split = splitKeyName(text);
  return split === null ? null : split.modifiers.join("") + split.label;
}

export function checkKeystroke(name: string): KeystrokeUse {
  const split = splitKeyName(name);
  if (split === null) return "unnamed";
  const holdsAll = (held: readonly Modifier[]): boolean => held.every((one) => split.modifiers.includes(one));
  const kept = KEPT_BY_THE_SYSTEM.some((keystroke) => keystroke.label === split.label && holdsAll(keystroke.modifiers));
  return kept ? "kept" : "usable";
}

function labelOfKeyPress(press: KeyPress): string {
  const coded = LABEL_OF_CODE.get(press.code);
  if (coded !== undefined) return coded;
  if (/^Numpad[0-9]$/.test(press.code) && /^[0-9]$/.test(press.key)) return `Num ${press.key}`;
  if (/^Digit[0-9]$/.test(press.code)) return press.code.slice(-1);
  if (/^F([1-9]|1[0-2])$/.test(press.key)) return press.key;
  if (/^[a-z]$/i.test(press.key)) return press.key.toUpperCase();
  if (/^Key[A-Z]$/.test(press.code)) return press.code.slice(3);
  return LABEL_OF_KEY.get(press.key) ?? "";
}

export function nameOfKeyPress(press: KeyPress): string {
  const label = labelOfKeyPress(press);
  if (label === "" || press.metaKey) return "";
  const held = [press.ctrlKey, press.altKey, press.shiftKey];
  return MODIFIERS.filter((_, index) => held[index]).join("") + label;
}
