import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { patchManifest, patchStyles } from "./android-manifest.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");
const ANDROID = join(ROOT, "android");
const MAIN = join(ANDROID, "app", "src", "main");
const RES = join(MAIN, "res");
const ICON = join(ROOT, "assets", "launcher", "frcp_icon.png");
const MONOCHROME_ICON = join(ROOT, "assets", "launcher", "frcp_icon_monochrome.png");
const XML_HEAD = '<?xml version="1.0" encoding="utf-8"?>';
const ANDROID_NAMESPACE = 'xmlns:android="http://schemas.android.com/apk/res/android"';
const PATH_CHECK_OVERRIDE = "android.overridePathCheck=true";

function inset(drawable: string): string {
  const lines = [XML_HEAD, `<inset ${ANDROID_NAMESPACE}`, `    android:drawable="@drawable/${drawable}"`];
  return [...lines, '    android:inset="17.5%" />', ""].join("\n");
}

function adaptiveIcon(withMonochrome: boolean): string {
  const layers = [
    '    <background android:drawable="@color/ic_launcher_background" />',
    '    <foreground android:drawable="@drawable/frcp_launcher_foreground" />',
  ];
  if (withMonochrome) layers.push('    <monochrome android:drawable="@drawable/frcp_launcher_monochrome" />');
  return [XML_HEAD, `<adaptive-icon ${ANDROID_NAMESPACE}>`, ...layers, "</adaptive-icon>", ""].join("\n");
}

function blackLauncherBackground(): string {
  const colour = '    <color name="ic_launcher_background">#000000</color>';
  return [XML_HEAD, "<resources>", colour, "</resources>", ""].join("\n");
}

function report(file: string, changed: boolean): void {
  console.log(`${changed ? "changed  " : "unchanged"} ${relative(ROOT, file)}`);
}

function put(file: string, content: string | Buffer): void {
  const before = existsSync(file) ? readFileSync(file) : null;
  const changed = before === null || !before.equals(Buffer.from(content));
  if (changed) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  report(file, changed);
}

function rewrite(file: string, patch: (text: string) => string): void {
  if (!existsSync(file)) throw new Error(`${relative(ROOT, file)} is missing: was the Android project generated?`);
  put(file, patch(readFileSync(file, "utf8")));
}

function withPathCheckOverride(properties: string): string {
  if (properties.includes(PATH_CHECK_OVERRIDE)) return properties;
  return [properties.trimEnd(), PATH_CHECK_OVERRIDE, ""].join("\n");
}

function launcherIcons(): void {
  if (!existsSync(ICON)) {
    console.log(`skipped   launcher icon: ${relative(ROOT, ICON)} is missing, so Capacitor's icon stays`);
    return;
  }
  const withMonochrome = existsSync(MONOCHROME_ICON);
  put(join(RES, "drawable-nodpi", "frcp_icon.png"), readFileSync(ICON));
  put(join(RES, "drawable", "frcp_launcher_foreground.xml"), inset("frcp_icon"));
  if (withMonochrome) {
    put(join(RES, "drawable-nodpi", "frcp_icon_monochrome.png"), readFileSync(MONOCHROME_ICON));
    put(join(RES, "drawable", "frcp_launcher_monochrome.xml"), inset("frcp_icon_monochrome"));
  }
  put(join(RES, "mipmap-anydpi-v26", "ic_launcher.xml"), adaptiveIcon(withMonochrome));
  put(join(RES, "mipmap-anydpi-v26", "ic_launcher_round.xml"), adaptiveIcon(withMonochrome));
  put(join(RES, "values", "ic_launcher_background.xml"), blackLauncherBackground());
}

function main(): void {
  if (!existsSync(ANDROID)) {
    throw new Error("android/ does not exist: run `npx cap add android` first, then this script again");
  }
  rewrite(join(MAIN, "AndroidManifest.xml"), patchManifest);
  rewrite(join(RES, "values", "styles.xml"), patchStyles);
  rewrite(join(ANDROID, "gradle.properties"), withPathCheckOverride);
  launcherIcons();
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
