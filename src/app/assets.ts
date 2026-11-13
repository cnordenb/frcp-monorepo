const UI_GROUPS: Record<string, string[]> = {
  buttons: [
    "button", "button_pressed", "button_9slice", "button_pressed_9slice", "options_button", "techtree_button",
    "x_button",
  ],
  controls: ["checkbox", "dropdown_button", "off", "slider", "slider_knob", "scrollbar_3slice", "scrollbar_knob"],
  panels: ["background", "background_mobile", "log_9slice", "panel_9slice", "textfield_9slice", "title", "tabs"],
  icons: ["cursor", "cursor_pointing", "external", "share_icon", "share_button", "mobile_tabs"],
  desktop: ["history_button", "aoe2vils_button"],
};

let root: string | null = null;

export function siteRoot(): string {
  if (root === null) {
    const script = document.querySelector<HTMLScriptElement>('script[src*="script.js"]');
    root = new URL(".", script ? script.src : document.baseURI).href;
  }
  return root;
}

export function assetUrl(path: string): string {
  return siteRoot() + "assets/" + path;
}

export function dataUrl(): string {
  return assetUrl("data.json");
}

export function civIconUrl(file: string): string {
  return assetUrl(`civs/${file}/${file}.webp`);
}

export function jingleUrl(file: string, legacy: boolean): string {
  return assetUrl(`civs/${file}/${file}${legacy ? "_legacy" : ""}.webm`);
}

export function uiSoundUrl(name: string): string {
  return assetUrl(`ui/sounds/${name}.webm`);
}

export function uiImageUrl(name: string): string {
  const group = Object.keys(UI_GROUPS).find((g) => UI_GROUPS[g].includes(name));
  if (!group) throw new Error(`Unknown UI image: ${name}`);
  return assetUrl(`ui/${group}/${name}.webp`);
}

export function atlasUrl(name: string): string {
  return assetUrl(`atlases/${name}.webp`);
}

export function imageUrl(name: string): string {
  const [kind, file] = name.split("/");
  if (kind === "ui") return uiImageUrl(file);
  return file.endsWith("_atlas") ? atlasUrl(file) : civIconUrl(file);
}
