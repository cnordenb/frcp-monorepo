# Decisions

- [Rules, and how they are read](#rules-and-how-they-are-read)
- [Requirements, and how they are read](#requirements-and-how-they-are-read)
- [Code and files](#code-and-files)
- [Tests](#tests)
- [Documents](#documents)

The decisions recorded in the development log in [DEVLOG/](DEVLOG/DEVLOG1.md), by subject (Rule 23). Each ends with the
day it was made, and the time where the log has one, as a link to its entry in the log. Where a later decision replaced
an earlier one, the earlier one is named after it, with its own link.

## Rules, and how they are read

- **Rule 5 holds for the whole repository.** The three platforms share 100 tests, not 100 each; the question is put
  to the chief developer.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Rule 14 is kept by how the assets are laid out**, a folder per civ, edition and DLC, not by exempting a folder.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Rule 15 names the pages.** There is no `index.html` in the code: the pages are `picker.html`, `simple.html` and
  `civexplorer.html`, and the build gives them their places. There is one `TESTS.md`, not one per platform.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Rule 25's one check is one assertion that runs once.** It may compare a whole observed value, or a list of
  faults with the empty list.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Rules 10 to 13 are not applied to files that are not written here**: `.github/FUNDING.yml` and
  `tests/simple/vendor/axe.min.js`; the question is put to the chief developer.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)

## Requirements, and how they are read

## Code and files

- **One core, one shared interface, three shells, all in TypeScript.** The rules are in `src/core/`, the interface
  in `src/app/`, and each platform has a shell in `src/web/`, `src/desktop/` or `src/mobile/`.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **A difference between platforms goes through the `Platform` interface or a check of its kind.** What only the
  desktop or the mobile app shows is built from TypeScript, and the web does not change for it.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **The desktop app is an Electron shell**, its site served from `frcp://app/`, in a frameless, see-through window
  of 932 by 637.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **The mobile app is a Capacitor shell.** The Android project in `android/` is generated and not kept;
  `src/mobile/android-project.ts` makes it the picker's.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Every platform keeps its settings, state and quicksave in the page's `localStorage`**, in the web's form. The
  desktop's changed hotkeys are saved with the settings, under `keyBindings`, by the hotkeys' IDs.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **The desktop's settings start as the C++ app's did**: a draw at start, no legacy jingles, no continuous
  freshness; a saved setting wins.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **One `data.json` and one set of assets for every platform**: the desktop app's data, the web app's images and
  sounds, the desktop app's history texts.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **No compile step.** Node.js runs the `.ts` files as they are, so the code uses only syntax that can be stripped;
  esbuild bundles each platform's site into `dist/`, which is not kept in the repository.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **One version for the three platforms, 2.0.0**; the question is put to the chief developer. The Android app's
  `versionCode` is 2, above the Kotlin app's 1, so that a phone takes it as that app's update.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
  [2026-11-16 20:58:24](DEVLOG/DEVLOG1.md#205824-the-android-app-built-from-the-command-line-without-android-studio)
- **The main folder holds 8 files.** `documentation/` became `docs/`, `CLAUDE.md` moved to `.claude/`, and
  `tsconfig.json` is in `src/`.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **`npm audit` must find no vulnerabilities.** Where the newest version of a package still asks for a vulnerable
  one, `overrides` in `package.json` names a mended version: `minimatch` 11 under `app-builder-lib`, and
  `global-agent` 4.
  [2026-11-13 10:02:50](DEVLOG/DEVLOG1.md#100250-no-known-vulnerabilities-in-the-packages)

## Tests

- **The tests run in Node's own test runner, in the order of their folders**: `core`, `desktop`, `mobile`, `page`,
  `simple`, `structure`, which is functional, then accessibility, then maintainability.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **The page tests open the built web site in a headless Chrome, Edge or Chromium**, and are skipped where there is
  none.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Rules 10 and 11 are checked by tests**, in `tests/structure/code-rules.test.ts`.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)

## Documents

- **`TESTS.md` is written by a script.** `scripts/tests-doc.ts` numbers the tests in the order they run, writes the
  number into each test's name, and takes each test's purpose from `tests/test-notes.json`.
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **Each platform has a guide of its own**, `docs/web/WEB.md`, `docs/desktop/DESKTOP.md` and
  `docs/mobile/MOBILE.md`; `MAINTAINER.md` covers what they share, and its first chapter is "Add a new civ".
  [2026-11-13 02:48:27](DEVLOG/DEVLOG1.md#024827-the-web-desktop-and-mobile-pickers-in-one-repository-in-typescript)
- **`MOBILE.md` builds the Android app from the command line**: the Android SDK, JDK 21, `ANDROID_HOME` and
  `JAVA_HOME`, then Gradle. Android Studio is named only as another way.
  [2026-11-16 20:58:24](DEVLOG/DEVLOG1.md#205824-the-android-app-built-from-the-command-line-without-android-studio)
