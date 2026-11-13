# Development log, part 1

- [2026-11-13](#2026-11-13)

Part 1 of the development log. The decisions made in the log are listed in [DECISIONS.md](../DECISIONS.md).

## 2026-11-13

### 01:02:46: the project set up from the template

#### What changed

- **Purpose.** Fresh Random Civ Picker draws a random Age of Empires 2 civilisation without repeats.
- **Placeholders.** The project's name, its description, the GitHub owner, the repository's name, the chief developer
  and the AI model in the Acknowledgements were filled in wherever they stood: `README.md`, `AGENTS.md`, Rules 1 and 2
  in `RULES.md`, `TESTS.md`, the title of `MAINTAINER.md`, and the issue forms in `.github/ISSUE_TEMPLATE/`.
- **README.md.** The template's note at its top was deleted, with the two lines that marked it.
- **LICENSE.** Left as it was: it already carried this year, 2026, and a full name. See Question 1.
- **Checked.** `bash .github/scripts/check-rules.sh` passed and listed the placeholders left under `todo`.
- **Documents.** `README.md`, `AGENTS.md`, `RULES.md`, `TESTS.md`, `MAINTAINER.md`, `feature_request.md` and
  `config.yml` in `.github/ISSUE_TEMPLATE/`, and this log.

#### Not done

- `REQUIREMENTS.md` is still to be written by the chief developer (Rule 2).
- The placeholders left, to be filled in when the work makes them known: `STACK`, `TEST_COMMAND` and `LANGUAGE` when
  the first code is written; `MAINTENANCE_TASK`, `MAINTENANCE_TASK_ANCHOR`, `MAINTENANCE_STEPS` and `CODE_OVERVIEW`
  in `MAINTAINER.md` when the code has taken shape; `USAGE` in `README.md` when there is something to use; and
  `SECURITY_CONTACT` in `.github/SECURITY.md` before the first release.
- There is no code and no test yet. `TEST_COMMAND` in `.github/workflows/checks.yml` is empty, and `code_pattern` in
  `.github/scripts/check-rules.sh` covers only `.sh` and `.yml` files.

#### Questions

1. **The name in LICENSE.** `LICENSE` came from the template with this year and a full name. Git gives the chief
   developer only as an account name, which now stands in Rule 2 as both the name and the GitHub account. The full
   name was kept, as a licence needs its holder's name more than an account. Proposal: if the full name in `LICENSE`
   is the chief developer's, keep it there and put it in Rule 2 in place of the account name; if it is not, replace
   it in `LICENSE` with the chief developer's.

### 02:48:27: the web, desktop and mobile pickers in one repository, in TypeScript

#### What changed

- **Why.** The picker lived in three repositories, each with its own copy of the rules: the desktop app in C++, the
  web app in JavaScript and the Android app in Kotlin. They were ported into this one, all to TypeScript, so that the
  rules, the interface, the data and the assets exist once. The three older repositories were only read.
- **The core.** `src/core/` holds the picker's rules, ported from the web app's `logic.js`, which the other two
  were ported from: `catalog.ts`, `state.ts`, `draw.ts`, `share.ts`, `preset.ts`, `mersenne.ts`, and
  `logic.ts`, whose `createLogic(data)` gives them to the interface bound to one `data.json`.
- **The shared interface.** `src/app/` is the web app's `script.js`, 1914 lines in one function, as modules in
  folders by task: `model/`, `actions/`, `view/`, `dialogs/`, `input/`, `sound/`. Same element IDs, texts,
  storage keys, hotkeys, swipes and simple mode. `start(platform)` in `start.ts` starts it.
- **What differs between platforms** goes through the `Platform` interface in `src/app/platform.ts`: the kind,
  the address share links start with, sharing a link, saving a preset, opening an address, leaving, and a share link
  at start and while running. `browser.ts` holds the browser's way; the desktop and mobile shells replace parts.
- **The web.** `src/web/web.ts` is its shell. The pages are `src/web/pages/picker.html`, `simple.html` and
  `civexplorer.html` (Rule 15 allows one `index.html`; the build gives them their places), the style sheets
  `src/web/styles/`: the old `style.css`, 638 lines, as `parchment.css`, `tabs.css`, `dialogs.css` and
  `phone.css`, and `simple.css`. Comments were removed and long lines wrapped; the markup and rules are the same.
- **The desktop.** An Electron shell in `src/desktop/`: `main.ts` (a frameless, see-through window, the site
  served from `frcp://app/`, links out, the save dialog), `preload.ts`, `desktop-bridge.ts`, `desktop.ts`. What
  the C++ app had and the web lacked was added to the shared interface for the desktop only: hotkeys that can be
  given other keys (`src/app/bindings/`, a port of `HotkeyBindings`, and the Customise Hotkeys dialog), the
  History dialog (`src/app/history/`) with its button and hotkey H, the sustainability app's button, menu item and
  hotkeys R and Ctrl+T, Esc and File > Exit to leave, the C++ app's menus, tooltips that show the current keys, its
  Options groups and its defaults (draw at start on, legacy jingles and continuous freshness off), "Reset civ pool on
  startup" as the setting `resetOnStart`, at most ten draws a second from a held key, and its About texts.
  `npm run package` packs a portable `.exe` into `release/`.
- **The mobile app.** A Capacitor shell in `src/mobile/`: `mobile.ts` (the share sheet, presets saved to
  Documents, incoming frcp.net links, the back button), `incoming-link.ts`, `share-outcome.ts`, `back-button.ts`,
  `phone-layout.ts`, and `android-manifest.ts` with `android-project.ts`, which give the generated Android project
  the link filter, the portrait screen and the launcher icon. For the mobile app only, the shared interface gained
  the Kotlin app's menu (Open Link and Tech Tree), "Preset saved" or its error after saving, the letter `a` in a
  preset's name, a launch link before the draw at start, the phone layout at any width, its texts, and its Civ Pool
  tab that never scrolls. `capacitor.config.json` names the app `net.frcp.app`.
- **Data and assets.** `assets/data.json` is the desktop app's, which holds what the web's did and also the
  editions' `links` and the DLCs' `released` dates. Images and sounds are the web app's WebP and WebM files, laid
  out so that no folder passes 7 files (Rule 14): a folder per civ, edition and DLC, and the interface's images by
  kind. The civs' histories, 50 text files, were taken from the desktop app's build output, as its repository does
  not hold them, and the History and aoe2vils button pictures and the program icon from its `images/`.
- **The build.** `scripts/build.ts` makes one site per platform in `dist/` with esbuild; `serve.ts` serves one;
  `atlas.ts` is the web app's `atlas_builder.py` in TypeScript, with sharp in place of Pillow. Its atlases have the
  same grids as the old ones; the shipped atlases are still the old files.
- **Folders and files moved.** `documentation/` is now `docs/`, with a guide per platform in `docs/web/`,
  `docs/desktop/` and `docs/mobile/`. `CLAUDE.md` is now `.claude/CLAUDE.md` and `tsconfig.json` is in
  `src/`, so that the main folder holds 8 files (Rule 14). Every mention of the old paths was changed, also in
  `RULES.md`, the skills and `.claude/settings.json`, whose rule still keeps `REQUIREMENTS.md` from being edited.
- **Placeholders.** `STACK`, `TEST_COMMAND`, `LANGUAGE`, `USAGE`, `MAINTENANCE_TASK`,
  `MAINTENANCE_TASK_ANCHOR`, `MAINTENANCE_STEPS` and `CODE_OVERVIEW` were filled in. `checks.yml` installs
  Node.js 24, checks the types, builds and runs `npm test`; `code_pattern` in `check-rules.sh` now covers
  `.ts`, `.html` and `.css`. `.gitattributes` keeps the preset fixtures' line ends.
- **Tests.** 100, up from 0. Tests 1 to 48 check the core, 49 to 62 the desktop's bindings and the History search,
  63 to 72 the mobile shell, 73 and 74 the web site in a headless browser, 75 to 98 simple mode against WCAG 2.2 at
  level AAA in the same browser, 99 and 100 Rules 10 and 11. The three repositories had 360 tests (web 91, Android
  156, desktop 113); see "How the rules were read". Each test makes one check, so tests with several were given one
  comparison of the whole result or of a list of faults.
- **Checked.** `npx tsc -p src`: no errors. `npm test`: 100 passed, none skipped, with the browser tests run in
  Chrome. `bash .github/scripts/check-rules.sh` passed. Tests were shown to fail on purpose: the core's with nine
  changes to copies of the core (such as the log's cap at 255, the freshness switched off, the bit order of a link
  flipped), the page tests with five changes to copies of the site (a thinner focus ring, a Help word renamed, a
  status text changed, a hiding rule removed, a paler ink), Tests 99 and 100 with a file holding a comment and a
  64-line function; every breakage was undone. The page tests found a real fault: three desktop style rules loaded
  images in simple mode; they were scoped with `:not([data-simple])`. The desktop app was started with Electron and
  driven through its debugging port: the page loads from `frcp://app/`, Space draws, H opens a civ's history, a
  hotkey given another key works and is kept over a restart, Esc leaves, Ctrl+S brings the save dialog, and a screen
  capture shows only the parchment. The packed `.exe` was started and gave the same page. The mobile site was
  driven in Chrome at phone and tablet sizes with touch: the menu, the texts, a swipe, the launch link's order. For
  the Android project, `npx cap add android`, `android-project.ts` and `npx cap sync android` ran.
- **ub-mode's tools.** dryer found three pairs written twice, which were joined (`openPlain` and `openField` in
  `dialogbox.ts`, `parseJson` taken from the core); it now finds none at 0.8. mutator: the core 201 of 226 run
  mutants killed (88.9 %), the bindings 65 of 79 (82.3 %), the mobile shell's modules 12 of 28 (42.9 %); it showed
  `random` and `random53` of the Mersenne Twister to be unused, and they were deleted. crapper: `onKeyDown`
  (16 paths), `keyName` (15) and `parseSettings` (11) were split; no function now has more than 10 paths.
- **Documents.** `MAINTAINER.md`: rewritten, its first chapter "Add a new civ". `TESTS.md`: the 100 tests, now
  written by `scripts/tests-doc.ts` from the tests and `tests/test-notes.json`. `TERMINOLOGY.md`: 26 terms.
  `README.md`, `AGENTS.md`, `WEB.md`, `DESKTOP.md`, `MOBILE.md`, `DECISIONS.md`.

#### How the rules were read

- **Rule 5 and "all tests shall still work".** The three repositories had 360 tests, and Rule 5 allows 100. The 100
  were kept for the whole repository, not for each platform. One core means the web's logic tests, the Kotlin
  ports of them and the C++ share link and data tests check the same code, so they are one set now. Left out:
  the Kotlin view model's tests and the C++ geometry tests, whose code has no counterpart (the layout is CSS, the
  view model is the shared interface, checked through the page), and tests merged into others. See Question 1.
- **Rule 15 and a TESTS.md per platform.** Two files may not share a name, and `check-rules.sh` reads one
  `docs/TESTS.md`. So there is one `TESTS.md`, whose tests are grouped by platform through their folders, and the
  platform folders in `docs/` hold `WEB.md`, `DESKTOP.md` and `MOBILE.md`.
- **Rule 14 and the assets.** The web app had 58 files in one folder. Rather than exempt a folder, which is the
  chief developer's choice, the assets were laid out to fit.
- **Rule 25.** "One check" was read as one assertion that runs once; it may compare a whole observed value, or a
  list of faults with the empty list.
- **Rules 10 to 13 and files that are not the project's code.** `.github/FUNDING.yml` keeps GitHub's comments,
  and `tests/simple/vendor/axe.min.js` is another project's file, kept byte for byte; neither is checked. See
  Question 8.

#### Not done

- **No Android app was built.** No Android SDK is installed, so nothing ran on a phone or in an emulator: the share
  sheet, saving to Documents, links from other apps, the back button and the phone layout's rewrite in Android's
  WebView are unproven. `MOBILE.md` has the steps.
- **Mobile, known gaps.** The Kotlin app's saved state and settings are not carried over on an update. A preset is
  saved to Documents without asking where. The civ icons are the web's 104 px WebP files, not the Kotlin app's PNGs.
  "No app here can open that" is not shown. TalkBack's own actions for the swipes are missing.
- **Desktop, not tried by hand.** No sound was heard, no link was really opened outside the app, no preset was saved
  through to a file, and the window was not looked at on a real screen, only through the debugging port.
- **Desktop, known gaps.** Settings, the draw log and the quicksave are kept in the app's own storage, not in
  `settings.ini`, `log.txt` and `saves/` beside the program, so those of the C++ app are not read (its presets
  still load through Load Preset). Six civs have no history text: Danes, Mapuche, Muisca, Saxons, Tupi, Varangians.
  The simple page opens in the desktop app but no menu leads to it.
- **Tests not ported.** Of the 360, those named under "How the rules were read". `hasContent`, the range checks of
  `MersenneTwister.int` and `patchStyles` have no test. The test "a pool and its draws are written as earlier
  versions wrote them" would compare nothing once there are more than 60 civs, as it picks the fixture links by
  their length.
- **crapper's goal of 10.** The shared interface runs in a browser, where Node's coverage cannot see it, so crapper
  counts it as untested: 5 functions score 110 and none of the page's code is under 10. Their tests are the page
  tests. mutator's 55 surviving mutants were left, as the 100 places are taken.
- **GitHub.** The workflow `checks.yml` was not run. The site's host still has to build before it publishes.
- **Not carried over:** the web app's `.assetsignore`, the desktop app's `convert_web_assets.py`, `ISSUES.md`
  and its notes on its own code, the README's pictures, and the Paint.NET sources but two.
- **Left in the folder, outside Git:** `android/`, `release/` with the packed program, `dist/`, `target/` and
  `.metrics/`.
- Placeholder left: `SECURITY_CONTACT`.

#### Questions

1. **100 tests for three platforms.** Should Rule 5's 100 hold for the repository, as now, or for each platform?
   Proposal: for the repository, as one core is tested once; if more are wanted, the Kotlin view model's tests are
   the first worth porting, against the shared interface in a browser.
2. **The version.** The web app was 1.0.2, the desktop app 1.4.2 and the Android app 1.0.0. All are now 2.0.0, in
   `package.json` and `VERSION` in `hotkeytables.ts`, and a preset's name carries it. Proposal: one version, 2.0.0.
3. **Publishing frcp.net.** The site is now built into `dist/web`. Which host serves it, and can it run
   `npm ci && node scripts/build.ts web`? Proposal: set that as the host's build command and `dist/web` as its
   folder.
4. **The desktop window.** It is 932 by 637 and see-through, so that dialogs wider than the parchment fit, with
   clicks let through around the parchment. The other way is a window of 610 by 637 with narrower dialogs. Which?
5. **The desktop's saved data.** Should the settings and the draw log of the C++ app be read once from
   `settings.ini` and `log.txt`? Proposal: no, as the new program is not started from the old one's folder.
6. **The Android app's update.** Should the saved state of the Kotlin app be carried over? It needs one more
   Capacitor package (`@capacitor/preferences`), and the same signing key. Proposal: yes, before the first release.
7. **Histories.** Is it right to keep the 50 history texts in `assets/`, and are texts wanted for the six civs
   without one?
8. **What counts as the project's code.** May `.github/FUNDING.yml` keep its comments, and
   `tests/simple/vendor/axe.min.js` its long lines? Proposal: yes, as neither is written here.
9. **CLAUDE.md in .claude/.** It was moved there to keep the main folder at 8 files, with `package.json`,
   `package-lock.json` and `capacitor.config.json` new in it. Is that acceptable?
10. **The security contact.** Which address should `.github/SECURITY.md` name?
11. **The older repositories.** The mobile menu's GitHub item still opens `frcp_html`, as the Kotlin app's did, and
    the desktop's opens this repository. Should all point here, and the three older repositories be archived?
12. **The name in LICENSE**, Question 1 of 01:02:46, is still open.

### 10:02:50: no known vulnerabilities in the packages

#### What changed

- **Why.** `npm ci` ended with "6 moderate severity vulnerabilities" and four warnings of deprecated packages.
- **What was found.** All six were one fault, GHSA-g3hv-75wg-m249 in `minimatch` 7.0.0 to 11.0.0, counted once for
  each package above it. `minimatch` 10.2.6 was asked for by `app-builder-lib` and 9.0.9 by `@electron/universal`,
  both parts of `electron-builder` 26.18.1, which is newer than the 26.18.0 that npm calls the latest. Every package
  named in `package.json` was already at its newest version, so no update could mend it.
- **Overrides.** `package.json` has a new `overrides`: `minimatch` `^11.0.8` for `app-builder-lib` and all under it,
  but `^3.1.5` kept for `glob` 7 and `dir-compare` there, which call `minimatch` in the old way and would break
  with 11. `global-agent` is `^4.1.7`, which no longer uses the deprecated `boolean`. `package-lock.json` was
  written again by `npm install`; 363 packages became 352.
- **Checked.** `npm ci` and `npm audit` both end with "found 0 vulnerabilities". `npm outdated` lists only
  `electron-builder`, whose installed version is the newer one. All 100 tests passed. `npm run package` built
  `release/Fresh Random Civ Picker 2.0.0.exe`, which uses the overridden `minimatch` to choose its files.
  `check-rules.sh` passed.
- **Documents.** `MAINTAINER.md`: a new section, "Packages and their versions", with the steps to check and update
  and what each override is for. `DECISIONS.md`.

#### Not done

- `npm ci` still warns of three deprecated packages: `glob` 7.2.3 and `inflight` 1.0.6, asked for by
  `@electron/asar` 3.4.1, and `rimraf` 2.6.3, asked for by `temp` under `electron-winstaller`. `app-builder-lib`
  asks for exactly that `@electron/asar`, which calls `glob` in a way its newer versions do not have, and `temp` has
  no newer version. `npm audit` reports no fault in the versions installed.
- The built program was not started by hand, and the override of `global-agent` was not tried: it is used only when
  Electron is downloaded through a proxy.
- No test was added; no requirement or rule speaks of the packages' versions.

#### Questions

1. **The deprecated packages.** The three warnings left can only go when `electron-builder` stops asking for the
   packages, or when another packer is used. Should the desktop program be packed by something else, such as
   `@electron/packager`, or are the warnings accepted until `electron-builder` 27 is released? Proposal: accept
   them, and try 27 when it leaves alpha.
2. **A check on every push.** Should `checks.yml` run `npm audit` and fail on a vulnerability? It would catch new
   faults early, but would also fail a push that changed nothing when a new fault is published. Proposal: yes.
