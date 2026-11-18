[![GitHub last commit](https://img.shields.io/github/last-commit/cnordenb/Fresh-Random-Civ-Picker)](#)
[![language](https://img.shields.io/badge/language-TypeScript-FFFF00)](#)
[![license](https://img.shields.io/badge/license-MIT-007FFF)](LICENSE)
[![testing](https://img.shields.io/badge/testing-yes-C3FF00)](docs/TESTS.md)
[![maintainable](https://img.shields.io/badge/maintainable-yes-00FF72)](docs/MAINTAINER.md)

# NB: this mono-repo is no longer maintained due to abysmal startup times of TypeScript compared to C++. For desktop, see [C++ version](https://github.com/cnordenb/Fresh-Random-Civ-Picker_GUI). For web, see [JavaScript version](https://github.com/cnordenb/frcp.net). For mobile, see [Kotlin version](https://github.com/cnordenb/frcp_mobile).

# Fresh Random Civ Picker

## Description

Draw a random Age of Empires 2 civilisation without repeats.

The game's own random pick can give the same civ twice in a row. Fresh Random Civ Picker draws every civ of the civ
pool once before any civ comes up again, and with continuous freshness on it also keeps the civs drawn last out of
the first draws of the next round.

One code base in TypeScript runs on three platforms:

| Platform | What it is | Where its guide is |
| --- | --- | --- |
| Web | The site at [frcp.net](https://frcp.net/), with simple mode at [frcp.net/simple](https://frcp.net/simple) | [WEB.md](docs/web/WEB.md) |
| Desktop | An Electron app for Windows, with customisable hotkeys and the civs' histories | [DESKTOP.md](docs/desktop/DESKTOP.md) |
| Mobile | An Android app, built with Capacitor, with swipes and the share sheet | [MOBILE.md](docs/mobile/MOBILE.md) |

All three read and write the same share links (`https://frcp.net/#p=...`), the same preset files and the same saved
state.

## Usage

On the web, open [frcp.net](https://frcp.net/). To run any platform from this repository, install
[Node.js](https://nodejs.org/) 24 or newer, then in the project's folder:

```
npm ci             # once: installs the packages
npm run web        # builds the site and serves it at http://127.0.0.1:8080/
npm run desktop    # builds and starts the desktop app
npm run mobile     # builds the site for Android and hands it to Capacitor (see MOBILE.md for the first time)
npm test           # builds the web site and runs the tests
```

What the picker does:

- **Draw** a fresh random civ, with its icon and jingle. **Reset** to start a new round at any time.
- **Undo and redo** a draw or a reset, and **re-roll** a draw for another civ.
- **Log** tab: the civs drawn, round by round, and the civs left this round.
- **Civ Pool** tab: choose the edition, switch whole DLCs on and off, or pick civs one by one.
- **Share links**: copy a link to the civ pool, with or without the round's draws, and open one.
- **Presets**: save the civ pool and the round to a file and load it again; quicksave and quickload.
- **Options**: continuous freshness, icons, jingles (also the legacy ones), sounds, tooltips, drawing at start.
- **Links out**: the drawn civ's tech tree at [aoe2techtree.net](https://aoe2techtree.net/), joining or spectating
  an Age of Empires II: Definitive Edition lobby by its code, and the editions' store pages.
- **Hotkeys** for nearly everything; on the desktop each can be given another key.

## Contributing

Anyone is welcome to open an [issue](https://github.com/cnordenb/Fresh-Random-Civ-Picker/issues) to submit a bug report or suggest a new feature. Alternatively, you may fork or copy the repository and take it in any direction you wish.

If you wish to contribute work into this repository, please consult [CONTRIBUTING.md](.github/CONTRIBUTING.md) before any commits or pull requests.

## Maintaining

To keep Fresh Random Civ Picker working and up to date, see [MAINTAINER.md](docs/MAINTAINER.md).

## Acknowledgements

- hszemi, Anda, exterkamp, paulirish, lalitpatel, Jineapple, TriRem, pip and NkoDragaš at
  [Siege Engineers](https://siegeengineers.org/) for [aoe2techtree.net](https://aoe2techtree.net/), which the picker
  links to for the tech trees.
- [Survivalist](https://www.youtube.com/channel/UCmFJUeU8Oubp5Neldbq0JRA), whose villager calculator early versions
  linked to and which inspired [aoe2vils.net](https://aoe2vils.net/).
- [axe-core](https://github.com/dequelabs/axe-core) 4.10.2 by Deque Systems, kept in `tests/simple/vendor` under its
  own licence (MPL 2.0), which the accessibility tests use.
- Development of Fresh Random Civ Picker was accelerated with Claude Opus 5.5 and Claude Fable 5.2.

## Microsoft assets

Age of Empires II © Microsoft Corporation. Fresh Random Civ Picker was created under Microsoft's
"[Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules)" using assets from Age of Empires II: The
Age of Kings, Age of Empires II: HD Edition, and Age of Empires II: Definitive Edition, and it is not endorsed by or
affiliated with Microsoft.
