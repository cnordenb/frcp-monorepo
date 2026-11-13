# The mobile platform

1. [Build the Android app](#build-the-android-app)
2. [What only the mobile app has](#what-only-the-mobile-app-has)
3. [Opening frcp.net links in the app](#opening-frcpnet-links-in-the-app)

The Android app is the shared interface in its phone layout inside a [Capacitor](https://capacitorjs.com/) shell: a
native Android project that shows the site of `dist/mobile/` in a web view. The native project is generated, not
kept in the repository.

## Build the Android app

You need Android Studio with an Android SDK and its JDK, and Node.js 24 or newer.

1. **Install the packages**, once: `npm ci`.
2. **Generate the Android project**, once: `npx cap add android`. It creates the folder `android/`, which Git leaves
   out. If you delete the folder, start again from this step.
3. **Make the project the picker's:** `node src/mobile/android-project.ts`. It adds the frcp.net link filter, locks
   the screen to portrait, installs the launcher icon from `assets/launcher/` and lets Gradle accept a path with
   letters such as `ö`. Running it again changes nothing more.
4. **Build the site and hand it to the project:** `npm run mobile`. Do this again after every change to the code.
5. **Set the version** in `android/app/build.gradle`: `versionCode` and `versionName`.
6. **Build the app:** `npx cap open android` opens Android Studio, where Build > Build APK(s) makes the app; or run
   `./gradlew assembleDebug` in `android/`, which writes `android/app/build/outputs/apk/debug/app-debug.apk`.

## What only the mobile app has

| What | Where |
| --- | --- |
| The entry file: the share sheet, saving presets, incoming links, the back button | `src/mobile/mobile.ts` |
| Reading the code out of an incoming `https://frcp.net/#p=...` link, and passing each link on once | `src/mobile/incoming-link.ts` |
| Telling a dismissed share sheet from a failed share | `src/mobile/share-outcome.ts` |
| Keeping the phone layout on a screen of any width | `src/mobile/phone-layout.ts` |
| The mobile app's own menu items, About texts and labels | `src/app/mobileui/mobilepage.ts` |
| The mobile app's own Civ Pool tab rules, under `:root[data-platform="mobile"]` | the end of `src/web/styles/phone.css` |
| What the back button does: closes an open dialog, else an open menu, else leaves the app | `src/mobile/back-button.ts` |
| The changes to the generated Android project, and the script that makes them | `src/mobile/android-manifest.ts`, `src/mobile/android-project.ts` |
| The app's ID, name and site folder | `capacitor.config.json` |

- **Share buttons** hand the link to Android's share sheet. If sharing is not possible, the link is copied instead.
- **Saving a preset** writes it to the phone's Documents folder, where Load Preset finds it again. Where that is not
  allowed (Android 8 to 10), the file is offered through the share sheet. `savePreset` answers true (saved: the app
  says "Preset saved"), false (failed: it says so in a message box) or null (the share sheet was dismissed: nothing
  is said). The file's name has the letter `a` after the version, where the web has `w` and the desktop `d`.
- **A link the app is started with** is reported twice by Android; the app passes it on once. `start` asks the shell
  for it (`launchCode`) before it builds the page, so that such a link comes before, and in place of, the draw at
  start. A link that arrives later reaches the page through `onLink`.
- **The phone layout on every screen.** The phone layout is the rules of `phone.css` under
  `@media (max-width: 609px)`. At start, `mobile.ts` rewrites the media rules of the loaded style sheets so that
  those hold at any width and the wide layout's never. So the width conditions in the style sheets must stay written
  plainly, as `(max-width: 609px)` and `(min-width: 610px)`; a test fails if `phone.css` words them otherwise.
  `start.ts` holds the other half: on mobile, `ctx.phone` always matches, so swipes work at any width.
- **The mobile parts of the page** find their places by `#menu-mobile [data-act="options"]`, `#dlgAbout .about > p`
  and `fieldset:has(input[name="drawOnLoad"]) > legend`. Keep those in `picker.html`.
- **The Civ Pool tab never scrolls on mobile**: its rows shrink to fit, with sizes in `cqh` units, which need
  Android's WebView 105 or newer.
- **The back button** finds what to close by `dialog[open] [data-close]` and `.menu.open .menu-title`. Keep those
  in the page when changing its dialogs and menus.
- **Leaving the app** moves it to the background, so coming back is not a new visit.

## Opening frcp.net links in the app

The Android project asks Android to send `https://frcp.net/` links to the app. Android does so by default only once
frcp.net vouches for the app, with a `/.well-known/assetlinks.json` that names the app's ID (`net.frcp.app`) and
the SHA-256 fingerprint of its signing certificate. Until then, a user can turn it on in the app's settings, under
Open by default.
