# The desktop platform

1. [Run it](#run-it)
2. [Make the program to hand out](#make-the-program-to-hand-out)
3. [What only the desktop has](#what-only-the-desktop-has)
4. [The window](#the-window)
5. [Hotkeys that can be changed](#hotkeys-that-can-be-changed)

The desktop app is the shared interface inside an [Electron](https://www.electronjs.org/) window, with what the
first desktop picker had and the web lacks: hotkeys that can be given other keys, the civs' histories, the
sustainability app's button, and Esc to leave.

## Run it

1. **Install the packages**, once: `npm ci`.
2. **Build and start:** `npm run desktop`.

## Make the program to hand out

1. **Run** `npm run package`. It builds `dist/desktop/` and has electron-builder pack it into one portable `.exe`
   in the folder `release/`, which Git leaves out.
2. **Try the `.exe`** before handing it out: draw a civ, open History, save a preset.

The program is not signed, so Windows shows its "Windows protected your PC" notice the first time it runs.

## What only the desktop has

| What | Where |
| --- | --- |
| The main process: the window, the `frcp://app/` address the site is served from, links out, the save dialog | `src/desktop/main.ts` |
| What the page may ask of the main process: quit, and letting clicks through | `src/desktop/preload.ts`, `src/desktop/desktop-bridge.ts` |
| The entry file, which starts the shared interface as the desktop | `src/desktop/desktop.ts` |
| The hotkeys and their keys, without any page in it | `src/app/bindings/` |
| The desktop's menus, buttons, tooltips and About texts | `src/app/desktopui/` |
| The Customise Hotkeys dialog, and the desktop's part of Options | `src/app/dialogs/customisedialog.ts`, `src/app/dialogs/desktopoptions.ts` |
| Running a bound key, and at most ten draws a second from a held key | `src/app/input/desktopkeys.ts` |
| The History dialog and its texts' rules | `src/app/history/` |
| The desktop's styles, each under `:root[data-platform="desktop"]` | `src/web/styles/desktop.css`, `history.css` |
| The histories, one text file per civ | `assets/civs/<civ>/<civ>.txt` |

- **The desktop is switched on by `ctx.bindings !== null`**, which holds only for the desktop on the full page.
  `setUpDesktop()` in `desktoppage.ts` adds the desktop's parts before the page is wired.
- **What the desktop does not show is hidden, not removed**, where the shared interface still writes to it (the
  web's part of Options). Menu items the desktop lacks are removed.
- **Settings start differently on the desktop**, as the first desktop picker's did: a civ is drawn at start, legacy
  jingles and continuous freshness are off. A saved setting wins over these.
- **"Reset civ pool on startup"** in Options is the setting `resetOnStart`: the picker then starts from the default
  edition with every civ on and an empty draw log.
- **A civ without a history file** shows "History not found.".

## The window

The window has no frame and is see-through: only the parchment is drawn, and the page's own title row moves it.
It is wider than the parchment (932 by 637) so that the widest dialogs fit; the see-through margin lets clicks
through to whatever lies behind, which `desktop.ts` switches as the mouse moves. To change the size, change
`LARGEST_DIALOG` in `main.ts`.

The site is served from `frcp://app/`, not from a file address, because a page opened from a file may not fetch
`assets/data.json`. The saved settings and draw log belong to that address: renaming it loses them.

Links to `https:` pages and `aoe2de:` lobbies open outside the app; every other address is refused.

## Hotkeys that can be changed

`src/app/bindings/hotkey-table.ts` lists every hotkey: its ID, where it works (everywhere, or on one tab), its action
and its default key. `HotkeyBindings` in `hotkey-bindings.ts` holds the keys now in use.

- **The IDs are what is saved**, in the settings under `keyBindings`, and only for keys that differ from the default;
  `"None"` means the hotkey has no key. Renaming an ID loses its saved key, and its tooltip line in `desktoptips.ts`.
- **A key given to one hotkey is taken from every hotkey it would clash with**: one that works everywhere clashes
  with the same key on any tab.
- **Some keys cannot be hotkeys**: those the system keeps (such as Alt+F4 and F12), and keys without a name here
  (punctuation, a modifier alone). `keystroke.ts` decides which.
- **A tooltip's hotkey line must stay its last line**: `desktoptips.ts` replaces everything from "Hotkey:" on.
