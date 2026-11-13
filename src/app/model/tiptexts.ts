const FULL_TIPS: Record<string, string> = {
  drawBtn: "Draws a fresh random civilisation\nHotkey: Space",
  resetBtn: "Resets the pool of drawn civs and renders all enabled civs available\nHotkey: Enter",
  clearLogBtn: "Clears the log of past rounds. The current round stays.\nHotkey: Q",
  showRemainingLabel: "Toggles the display of the remaining civs log\nHotkey: W",
  autoToggleLabel: "Toggles older civs as well as the automatic enabling of older civs when switching between "
    + "editions\nHotkey: R",
  autoResetLabel: "Automatically resets the pool of drawn civs when the civilisation pool is changed\nHotkey: T",
  enableAllBtn: "Enables all civilisations so that they are made available in the pool of civilisations for "
    + "drawing\nHotkey: Space",
  disableAllBtn: "Disables all civilisations so that they are removed from the pool of civilisations for "
    + "drawing\nHotkey: Enter",
  poolShareBtn: "Copies a share link with this civ pool",
};

const SIMPLE_TIPS: Record<string, string> = {
  drawBtn: "Draws a civ that hasn't come up yet this round\nHotkey: Space",
  resetBtn: "Ends this round and starts a new one\nHotkey: Enter",
  clearLogBtn: "Clears the past rounds from the log. This round stays.\nHotkey: Q",
  showRemainingLabel: "Shows or hides the list of civs left this round\nHotkey: W",
  autoToggleLabel: "Turns the older civs on or off. While it's on, picking an edition turns its older civs on."
    + "\nHotkey: R",
  autoResetLabel: "Starts a new round each time you change the civ pool\nHotkey: T",
  enableAllBtn: "Turns on every civ, so that all of them can be drawn\nHotkey: Space",
  disableAllBtn: "Turns off every civ\nHotkey: Enter",
  poolShareBtn: "Copies a link with this civ pool",
};

export function staticTips(simple: boolean): Record<string, string> {
  return simple ? { ...FULL_TIPS, ...SIMPLE_TIPS } : FULL_TIPS;
}
