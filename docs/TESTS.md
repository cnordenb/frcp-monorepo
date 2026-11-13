# Tests

This project strives to have sensible testing. The goal is not to have 100% test coverage but to have tests which _sufficiently_ ensure the functional completeness, functional correctness, maintainability, and accessibility of Fresh Random Civ Picker. For more guidelines on software quality and accessibility, see [ISO/IEC 25010:2011](https://cdn.standards.iteh.ai/samples/35733/2ca18b477b7845a5b8cae39d6de0c098/ISO-IEC-25010-2011.pdf), [ISO/IEC 25010:2023](https://cdn.standards.iteh.ai/samples/78176/13ff8ea97048443f99318920757df124/ISO-IEC-25010-2023.pdf) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

This document lists each test, its purpose, and in which test file it resides. This document is an effort to mitigate redundant tests and ensure test quality. It is intended as an aid in the trouble-shooting of potential false positives.

Test descriptions must remain brief and parameters (eg. Purpose) may not exceed 120 characters. Tests are ordered in order of their execution.

The test report names each test by its number here, such as "Test 15 failed": a test's number is its place in the order
the tests run. So when a test is added, removed or moved, renumber this document to match.

There may be at most 100 tests (Rule 5).

<!--
Each test has an entry of this form, after the table of contents, in the order the tests run:

## Test N

### File residence:
`path/to/test_file`, lines 24-26

### Purpose:
Verify that ... (Req. 3, 4).

### Assertion expectation:
What must hold for the test to pass.
-->

## Table of contents per category

Functional completeness & correctness tests:
- [Test 1](#test-1): civ IDs never change, and every civ has its ID frozen
- [Test 2](#test-2): editions have unique IDs and years, as which civs an edition has goes by year
- [Test 3](#test-3): every DLC and edition the data names exists, and an edition's toggles and older DLCs are its
- [Test 4](#test-4): every civ has an icon and a jingle, and a legacy jingle where its edition has them
- [Test 5](#test-5): every edition has its icons and banner, and every DLC with an icon has its file
- [Test 6](#test-6): every DLC toggle and edition has a hotkey
- [Test 7](#test-7): the atlases have the cells the data needs, in the grid the style sheet and the script give
- [Test 8](#test-8): civ names and edition IDs are single words, as preset files split their lines on spaces
- [Test 9](#test-9): a share link can name every civ (format 1 spends one character per draw)
- [Test 10](#test-10): the Mersenne Twister gives the reference outputs of mt19937ar.c
- [Test 11](#test-11): every civ in the pool comes up once a round, before any repeats
- [Test 12](#test-12): continuous freshness keeps the newest civs out of the next round's first draws
- [Test 13](#test-13): without continuous freshness, a round can start with the civ the last one ended on
- [Test 14](#test-14): an empty pool has nothing to draw
- [Test 15](#test-15): without a random source there's no pick
- [Test 16](#test-16): the next draw is an even pick from the civs it can be
- [Test 17](#test-17): the next draw stays an even pick when civs join
- [Test 18](#test-18): the next draw stays an even pick when civs drop out
- [Test 19](#test-19): the next draw stays an even pick when civs join and others drop out
- [Test 20](#test-20): the next draw stays put while it can, so its jingle only loads once
- [Test 21](#test-21): a preset the desktop app wrote mid-round loads its pool, edition and draws
- [Test 22](#test-22): a preset from an older desktop app loads, passing over civ names it no longer has
- [Test 23](#test-23): a desktop preset loads and saves back byte for byte
- [Test 24](#test-24): a preset's freshness history from before this round loads as an earlier round, without counts
- [Test 25](#test-25): a saved preset lists every civ in ID order, the round's draws that are on, and the edition
- [Test 26](#test-26): a saved preset's freshness history holds the newest civs that could sit out, oldest first
- [Test 27](#test-27): a preset is read from the default edition with all civs on, in any order, to a blank line
- [Test 28](#test-28): a preset with an unknown edition keeps the default, and repeated or unknown draws are skipped
- [Test 29](#test-29): text with none of the sections isn't a preset
- [Test 30](#test-30): after loading a preset, its earlier civs keep sitting out of the next draws
- [Test 31](#test-31): a new state is the default edition with every civ on and an empty round
- [Test 32](#test-32): a saved state reads back as it was
- [Test 33](#test-33): anything that isn't a saved state reads as nothing
- [Test 34](#test-34): a saved state keeps only the parts that make sense
- [Test 35](#test-35): a saved state with no log gets an empty round
- [Test 36](#test-36): a saved state of an older edition has the newer civs off
- [Test 37](#test-37): a draw is counted out of the pool, and the draw after a full round starts a new one
- [Test 38](#test-38): closing a round adds one empty round, and never two
- [Test 39](#test-39): the log keeps its newest 256 draws, dropping the oldest first
- [Test 40](#test-40): the log never drops draws of the current round, however long
- [Test 41](#test-41): share links written by earlier versions open as they did
- [Test 42](#test-42): a pool and its draws are written as earlier versions wrote them
- [Test 43](#test-43): a link opens as what it was written from, for every edition
- [Test 44](#test-44): a link opens with or without its address
- [Test 45](#test-45): text that isn't a link opens as nothing
- [Test 46](#test-46): a link leaves out the draws of civs that are off, and the draws altogether when asked
- [Test 47](#test-47): opening a link replaces the pool and starts a round of its draws, keeping past rounds
- [Test 48](#test-48): opening a link without draws starts an empty round
- [Test 49](#test-49): the history search picks the first civ whose name starts with the typed text
- [Test 50](#test-50): every hotkey starts with the key the desktop app always had
- [Test 51](#test-51): no two default keys clash
- [Test 52](#test-52): a keystroke runs its tab's action, and a global one the same action on every tab
- [Test 53](#test-53): the hotkeys of editions and DLC slots that the data lacks do nothing
- [Test 54](#test-54): a global keystroke clashes with each tab's hotkey that has it
- [Test 55](#test-55): assigning a keystroke takes it from the hotkeys it clashes with
- [Test 56](#test-56): a keystroke that cannot be a hotkey is refused
- [Test 57](#test-57): saved hotkeys are read back, and junk among them leaves the default keys
- [Test 58](#test-58): the Customise Hotkeys dialog words each outcome of a key press
- [Test 59](#test-59): every usable keystroke is read back from its name
- [Test 60](#test-60): text that names no keystroke is not read as one
- [Test 61](#test-61): the system's keystrokes are kept, unnamed keys refused and the others usable
- [Test 62](#test-62): a key press is named by its held keys, in the order Ctrl, Alt, Shift, and its key
- [Test 63](#test-63): the generated manifest gains the frcp.net link filter and the portrait screen
- [Test 64](#test-64): patching the manifest a second time changes nothing more
- [Test 65](#test-65): a share link's code is what follows #p= in its address
- [Test 66](#test-66): an address without a share link has no code, so the app opens as from the launcher
- [Test 67](#test-67): the launch link is what the app starts with, once, though Android reports it twice
- [Test 68](#test-68): the launch link opened again while the app runs is delivered again
- [Test 69](#test-69): a share sheet that the user dismisses is told from a share that failed
- [Test 70](#test-70): on mobile the phone layout's rules hold at any width, and the wide layout's at none
- [Test 71](#test-71): the back button closes an open dialog and nothing else
- [Test 72](#test-72): the back button leaves the app when no dialog or menu is open
- [Test 73](#test-73): phone swipes draw, undo, re-roll and reset, and the icons follow the finger
- [Test 74](#test-74): simple mode's extra elements are hidden on the full page

Accessibility tests:
- [Test 75](#test-75): axe-core finds no WCAG 2.2 A, AA or AAA violation at any size or in dark mode
- [Test 76](#test-76): 1.4.6 Contrast (Enhanced): all text is at least 7:1, in light and dark mode
- [Test 77](#test-77): 2.5.5 Target Size (Enhanced): every control is at least 44 x 44 px at any size
- [Test 78](#test-78): 1.4.10 Reflow: nothing scrolls sideways or leaves the screen at up to 400 % zoom
- [Test 79](#test-79): 1.4.12 Text Spacing: no text overlaps, spills out of its control or is cut off
- [Test 80](#test-80): 1.4.8 Visual Presentation: short lines, 1.5 line spacing, no justified text
- [Test 81](#test-81): 3.2.5 Change on Request: every link and button that opens a new tab says so
- [Test 82](#test-82): 1.1.1, 1.4.9 Images of Text: simple mode loads no images and no sounds
- [Test 83](#test-83): 3.1.5 Reading Level: every text, tooltip and message reads at grade 9 or below
- [Test 84](#test-84): 3.1.3, 3.1.4 Unusual Words: Help explains the picker's words and short forms
- [Test 85](#test-85): 2.1.1 Keyboard: the menus and tabs open, move and close from the keyboard
- [Test 86](#test-86): 2.4.3 Focus Order: focus comes back from a dialog, and follows a tab hotkey
- [Test 87](#test-87): 2.4.7, 2.4.11-13 Focus: every Tab stop has a clear, uncovered focus ring
- [Test 88](#test-88): 2.1.4 Character Key Shortcuts: single-key hotkeys can be turned off
- [Test 89](#test-89): 1.4.13 Content on Hover or Focus: tooltips can be dismissed and hovered
- [Test 90](#test-90): 2.5.1 Pointer Gestures: phones draw with buttons, and a swipe does nothing
- [Test 91](#test-91): 2.5.2 Pointer Cancellation: a click outside an open menu only closes it
- [Test 92](#test-92): 1.4.10 Reflow: on a phone only the tab's panel scrolls, and menus move nothing
- [Test 93](#test-93): 3.3.6 Error Prevention: Clear Log, Disable All and Quickload can be undone
- [Test 94](#test-94): 4.1.3 Status Messages, 2.2.1: results are announced and stay on screen
- [Test 95](#test-95): 3.3.1, 3.3.3 Errors: a bad lobby code or link is explained, marked and focused
- [Test 96](#test-96): 1.3.1, 4.1.2: lists, groups, headings, states and landmarks are marked up
- [Test 97](#test-97): forced colours: the selected edition and the focus ring still show
- [Test 98](#test-98): every sweep reaches every tab, menu and dialog, and no page throws an error

Maintainability tests:
- [Test 99](#test-99): the code has no comments (Rule 10)
- [Test 100](#test-100): no function is longer than 60 lines (Rule 11)

## Test 1

### File residence:
`tests/core/data.test.ts`, lines 41-44

### Purpose:
Prevent a civ's ID from changing, as share links and saved states name civs by ID.

### Assertion expectation:
The civ names in ID order equal the list in `tests/fixtures/civ-ids.json`.

## Test 2

### File residence:
`tests/core/data.test.ts`, lines 46-49

### Purpose:
Verify that no two editions share an ID or a year, as an edition's civs are found by its year.

### Assertion expectation:
No edition ID or year comes up twice in the data; a failure lists the repeats.

## Test 3

### File residence:
`tests/core/data.test.ts`, lines 51-64

### Purpose:
Verify that the data names only DLCs and editions that exist, and gives an edition no DLC of a newer edition.

### Assertion expectation:
No civ, DLC or edition in `assets/data.json` names an unknown or newer one; a failure lists each wrong name.

## Test 4

### File residence:
`tests/core/data.test.ts`, lines 66-70

### Purpose:
Verify that every civ, and the random icon, has its icon and jingle files, so that no draw shows or plays nothing.

### Assertion expectation:
Each civ and `random` has a .webp and .webm in `assets/civs/`, legacy civs a _legacy.webm; a failure lists the missing.

## Test 5

### File residence:
`tests/core/data.test.ts`, lines 72-78

### Purpose:
Verify that the icons and banners of the editions, the DLC icons and the three atlases are all in `assets/`.

### Assertion expectation:
Each edition has its icon, hover, pressed and banner .webp, each DLC icon its file; a failure lists missing files.

## Test 6

### File residence:
`tests/core/data.test.ts`, lines 80-84

### Purpose:
Verify that the hotkey tables have a key for every edition and for every DLC toggle of the fullest edition.

### Assertion expectation:
The most DLC toggles of any edition is at most the count of DLC keys, and the editions at most the edition keys.

## Test 7

### File residence:
`tests/core/data.test.ts`, lines 86-99

### Purpose:
Verify that each atlas holds the cells the data needs, in the grid that the style sheet and the script use.

### Assertion expectation:
The civ (30 px cells), DLC (128 px cells) and banner atlases have the columns, rows and pixel size the data gives.

## Test 8

### File residence:
`tests/core/data.test.ts`, lines 101-104

### Purpose:
Prevent a civ name or edition ID that a preset cannot hold, as a preset's lines are split on spaces.

### Assertion expectation:
No civ name or edition ID has a space or ends in a colon; a failure lists those that do.

## Test 9

### File residence:
`tests/core/data.test.ts`, lines 106-108

### Purpose:
Prevent more civs than a share link can name, as a share link gives each draw one of 64 characters.

### Assertion expectation:
The count of civs is at most 64; a failure gives both counts.

## Test 10

### File residence:
`tests/core/drawing.test.ts`, lines 11-15

### Purpose:
Verify that the Mersenne Twister, the source of every draw, gives the numbers of its reference code mt19937ar.c.

### Assertion expectation:
The first output for seed 5489 is 3499211612, and the first five for the array seed equal the reference's.

## Test 11

### File residence:
`tests/core/drawing.test.ts`, lines 17-32

### Purpose:
Verify that a round draws every civ of the civ pool once before any civ is drawn again.

### Assertion expectation:
For 5 civ pools and 3 freshness settings, each of 12 rounds is the whole civ pool; a failure lists broken rounds.

## Test 12

### File residence:
`tests/core/drawing.test.ts`, lines 34-48

### Purpose:
Verify that continuous freshness keeps the civs drawn last out of the first draws of the next round.

### Assertion expectation:
In 30 rounds of 4 set-ups, no first draw of a round is a civ still sitting out; a failure lists the repeats.

## Test 13

### File residence:
`tests/core/drawing.test.ts`, lines 50-53

### Purpose:
Verify that with continuous freshness off, a civ may be drawn twice in a row across two rounds.

### Assertion expectation:
In 400 seeded draws from a civ pool of Britons and Celts, some draw equals the draw before it.

## Test 14

### File residence:
`tests/core/drawing.test.ts`, lines 55-58

### Purpose:
Verify that an empty civ pool gives no draw.

### Assertion expectation:
With every civ off, the next draw is null.

## Test 15

### File residence:
`tests/core/drawing.test.ts`, lines 60-62

### Purpose:
Verify that no civ is picked when the platform gives no random source.

### Assertion expectation:
With null as the random source, the next draw among the civs 1, 2 and 3 is null.

## Test 16

### File residence:
`tests/core/drawing.test.ts`, lines 64-68

### Purpose:
Verify that the next draw is as likely to be any one of the civs it can be.

### Assertion expectation:
24000 seeded picks among 12 civs pass a chi-square test of evenness; a failure gives each civ's count.

## Test 17

### File residence:
`tests/core/drawing.test.ts`, lines 70-78

### Purpose:
Verify that the next draw stays an even pick when civs are added after it was picked.

### Assertion expectation:
30000 picks among 15 civs, each made after a pick among the first 10, pass the chi-square test of evenness.

## Test 18

### File residence:
`tests/core/drawing.test.ts`, lines 80-88

### Purpose:
Verify that the next draw stays an even pick when civs are taken away after it was picked.

### Assertion expectation:
20000 picks among 10 civs, each made after a pick among 15, pass the chi-square test of evenness.

## Test 19

### File residence:
`tests/core/drawing.test.ts`, lines 90-98

### Purpose:
Verify that the next draw stays an even pick when some civs are added and others taken away after it was picked.

### Assertion expectation:
20000 picks among civs 5 to 14, each made after a pick among civs 0 to 9, pass the chi-square test of evenness.

## Test 20

### File residence:
`tests/core/drawing.test.ts`, lines 100-111

### Purpose:
Verify that the next draw does not change while it still can be drawn, so that its jingle is loaded only once.

### Assertion expectation:
In 200 tries with 20 civs, the pick stays when the civs are reordered or others drop out; a failure lists the moves.

## Test 21

### File residence:
`tests/core/preset-file.test.ts`, lines 37-41

### Purpose:
Verify that a preset the first desktop picker wrote in the middle of a round loads with its civ pool and draws.

### Assertion expectation:
`desktop-log.txt` loads as edition DE with no civ off and one round holding its 36 drawn civs in order.

## Test 22

### File residence:
`tests/core/preset-file.test.ts`, lines 43-46

### Purpose:
Verify that a preset of an older desktop picker loads, and that a civ name the picker no longer has is passed over.

### Assertion expectation:
`desktop-v1.3.2.txt` loads as edition DE with Bulgarians, Goths, Persians and Sicilians off and an empty round.

## Test 23

### File residence:
`tests/core/preset-file.test.ts`, lines 48-51

### Purpose:
Verify that the picker writes a preset exactly as the first desktop picker wrote it.

### Assertion expectation:
Loading `round-start.txt` and saving it with continuous freshness on gives the same text, byte for byte.

## Test 24

### File residence:
`tests/core/preset-file.test.ts`, lines 53-62

### Purpose:
Verify that a preset's civs drawn before its round load as an earlier round, so that they still count as drawn last.

### Assertion expectation:
`round-start.txt` loads as a round of Huns, Franks, Teutons with counts 0, then Celts, Mongols; Aztecs and Wu off.

## Test 25

### File residence:
`tests/core/preset-file.test.ts`, lines 64-69

### Purpose:
Verify that a saved preset lists every civ in ID order as on or off, the round's draws that are on, and the edition.

### Assertion expectation:
An HD state with Celts off and draws Huns, Celts, Franks saves as all civ states, draws Huns and Franks, then HD.

## Test 26

### File residence:
`tests/core/preset-file.test.ts`, lines 71-77

### Purpose:
Verify that a saved preset holds the civs drawn last, oldest first, as many as continuous freshness can keep out.

### Assertion expectation:
After a full round and draws Celts and Franks, ContfreshCivArray lists half the civ pool's count, ending Celts, Franks.

## Test 27

### File residence:
`tests/core/preset-file.test.ts`, lines 79-83

### Purpose:
Verify that a preset's sections are read in any order, on top of the defaults, and only up to the first blank line.

### Assertion expectation:
A text with HD, draws Britons and Wu, Celts off, then a blank line loads as HD without Celts and one draw, Britons.

## Test 28

### File residence:
`tests/core/preset-file.test.ts`, lines 85-89

### Purpose:
Verify that a preset's unknown edition, unknown civs and repeated draws are passed over and the rest is loaded.

### Assertion expectation:
Edition XX and draws Celts, Nonsense, Celts, Franks load as the default edition with the draws Celts and Franks.

## Test 29

### File residence:
`tests/core/preset-file.test.ts`, lines 91-94

### Purpose:
Verify that a text without a preset's section headings is not taken for a preset.

### Assertion expectation:
None of 5 texts, such as an empty one or one whose heading comes after a blank line, parses; a failure lists them.

## Test 30

### File residence:
`tests/core/preset-file.test.ts`, lines 96-100

### Purpose:
Verify that continuous freshness holds across a loaded preset: its civs drawn last are not the next draws.

### Assertion expectation:
After loading `round-start.txt`, none of Huns, Franks, Teutons, Celts and Mongols can be the next draw.

## Test 31

### File residence:
`tests/core/saved-state.test.ts`, lines 10-12

### Purpose:
Verify that the picker starts with the default edition, every civ on and an empty round.

### Assertion expectation:
A new state has the first edition of the data, no civ off and a draw log of one empty round.

## Test 32

### File residence:
`tests/core/saved-state.test.ts`, lines 14-17

### Purpose:
Verify that a saved state loads as the state it was saved from.

### Assertion expectation:
A state with Aztecs and Wu off and rounds of 2 draws and 1 draw equals itself after saving and reading.

## Test 33

### File residence:
`tests/core/saved-state.test.ts`, lines 19-22

### Purpose:
Verify that text that is not a saved state is refused, so that the picker starts afresh.

### Assertion expectation:
None of 8 values, such as null, `not json`, `{}` and an unknown edition, reads as a state; a failure lists them.

## Test 34

### File residence:
`tests/core/saved-state.test.ts`, lines 24-36

### Purpose:
Verify that a damaged saved state loads with its sound parts, and without what cannot be right.

### Assertion expectation:
Only civ 1 stays off; unknown civs, wrong types, repeats and empty rounds go, leaving rounds of 1 and 2 draws.

## Test 35

### File residence:
`tests/core/saved-state.test.ts`, lines 38-41

### Purpose:
Verify that a saved state without draws loads with one empty round to draw into.

### Assertion expectation:
A state with no draw log, and one with two empty rounds, both load with a draw log of one empty round.

## Test 36

### File residence:
`tests/core/saved-state.test.ts`, lines 43-46

### Purpose:
Verify that a saved state of an older edition loads with the civs of newer editions off.

### Assertion expectation:
A saved AOK state with no civ off loads with exactly the civs that are not in AOK off.

## Test 37

### File residence:
`tests/core/saved-state.test.ts`, lines 48-52

### Purpose:
Verify that each draw is numbered within its round against the civ pool's size, and that a full round ends.

### Assertion expectation:
With a civ pool of 2, the draws Celts, Britons, Britons log as 1/2 and 2/2, then 1/2 in a new round.

## Test 38

### File residence:
`tests/core/saved-state.test.ts`, lines 54-59

### Purpose:
Verify that a reset ends the round once, and that a second reset adds no further empty round.

### Assertion expectation:
After closing the round twice, a draw log of one draw has that round and one empty round.

## Test 39

### File residence:
`tests/core/saved-state.test.ts`, lines 61-68

### Purpose:
Verify that the draw log is cut to its newest 256 draws, losing the oldest draws first.

### Assertion expectation:
Six full rounds are cut to 256 draws: the oldest rounds go, one is cut at its start, the newest stay whole.

## Test 40

### File residence:
`tests/core/saved-state.test.ts`, lines 70-75

### Purpose:
Verify that the draw log keeps the whole current round, even when it is longer than 256 draws.

### Assertion expectation:
A full round followed by a round of 300 draws is cut to the round of 300 draws alone.

## Test 41

### File residence:
`tests/core/share-link.test.ts`, lines 44-51

### Purpose:
Prevent a change to share links that makes links already handed out open as something else.

### Assertion expectation:
The 6 links in `tests/fixtures/share-links.json` each open with the edition, civs on and draws noted there.

## Test 42

### File residence:
`tests/core/share-link.test.ts`, lines 53-60

### Purpose:
Verify that a civ pool and its draws are written as the same share link as earlier versions wrote.

### Assertion expectation:
The 4 fixture links with a full-length code are written again, character for character, from their civ pools.

## Test 43

### File residence:
`tests/core/share-link.test.ts`, lines 62-65

### Purpose:
Verify that a share link opens as the edition, civ pool and draws it was written from.

### Assertion expectation:
For each edition, a civ pool with every third civ off and 3 draws is the same after writing and opening.

## Test 44

### File residence:
`tests/core/share-link.test.ts`, lines 67-75

### Purpose:
Verify that a share link opens whether given whole, as its code alone, with spaces around it or percent-encoded.

### Assertion expectation:
6 forms of one link, such as the bare code, `#p=` and code, and another site's address, all open the same.

## Test 45

### File residence:
`tests/core/share-link.test.ts`, lines 77-91

### Purpose:
Verify that text that is not a share link is refused instead of opening as a wrong civ pool.

### Assertion expectation:
None of 21 texts, such as an unknown format, edition or civ and bad characters, opens; a failure lists them.

## Test 46

### File residence:
`tests/core/share-link.test.ts`, lines 93-97

### Purpose:
Verify that a share link holds no draw of a civ that is off, and no draws at all when written without them.

### Assertion expectation:
With Wu off and draws Celts, Wu, Franks, the link holds Celts and Franks with draws, and none without.

## Test 47

### File residence:
`tests/core/share-link.test.ts`, lines 99-107

### Purpose:
Verify that opening a share link replaces the edition and civ pool and starts a round of its draws, keeping past rounds.

### Assertion expectation:
Opening `1B__________.KF` gives HD, the DE civs off and a third round of Celts 1/31 and Britons 2/31.

## Test 48

### File residence:
`tests/core/share-link.test.ts`, lines 109-113

### Purpose:
Verify that opening a share link without draws ends the round and starts an empty one.

### Assertion expectation:
Opening `1A__________` on a draw log of one draw leaves that round and adds one empty round.

## Test 49

### File residence:
`tests/desktop/history.test.ts`, lines 5-9

### Purpose:
Verify that the history search finds the first civ whose name starts with the typed text, whatever its case.

### Assertion expectation:
Among Britons, Burmese, Franks, Goths: b, BU, fr, Franks, franksx, oth, g give places 0, 1, 2, 2, -1, -1, 3.

## Test 50

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 22-25

### Purpose:
Verify that every hotkey starts with the key it had in the first desktop picker.

### Assertion expectation:
The 50 hotkeys, in the table's order, have the 50 default keys listed in the test, from Tab to L.

## Test 51

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 27-29

### Purpose:
Verify that no default key runs two actions on the same tab.

### Assertion expectation:
No hotkey's default key clashes with another hotkey's; a failure lists the IDs of those that clash.

## Test 52

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 31-42

### Purpose:
Verify that a key runs the action of the tab that is open, and a global key the same action on every tab.

### Assertion expectation:
Q gives options, clearLog, edDE on the three tabs; F1 gives options on all; Shift+Q and None give nothing.

## Test 53

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 44-48

### Purpose:
Verify that the hotkey of an edition or DLC toggle that the data does not have runs no action.

### Assertion expectation:
With 2 editions and 3 DLC toggles, on the Civ Pool tab W and D run edHD and dlc2, E and F run nothing.

## Test 54

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 50-55

### Purpose:
Verify that a key given to a global hotkey clashes with the hotkey of every tab that has that key.

### Assertion expectation:
Q for ToggleCivName clashes with DrawTabOpenOptions, LogTabClearDrawnLog and CivPoolTabEdition1.

## Test 55

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 57-63

### Purpose:
Verify that giving a hotkey a key takes that key from the hotkeys it clashes with, so no key runs two actions.

### Assertion expectation:
After Q is given to ToggleCivName, the changed hotkeys are it with Q and the three that had Q with None.

## Test 56

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 65-69

### Purpose:
Verify that a key the system keeps, or that has no name, cannot be made a hotkey.

### Assertion expectation:
None, F12, Alt+Tab, ;, Shift and Win+Q are all 6 refused for Undo, which keeps Ctrl+Z.

## Test 57

### File residence:
`tests/desktop/hotkey-bindings.test.ts`, lines 71-77

### Purpose:
Verify that saved hotkeys load, and that a saved key or hotkey that makes no sense leaves the default key.

### Assertion expectation:
Of 7 saved entries only DrawTabDrawCiv: d and Exit: none are taken, as D and None; the rest stay default.

## Test 58

### File residence:
`tests/desktop/key-change-text.test.ts`, lines 15-33

### Purpose:
Verify that the Customise Hotkeys dialog says in plain words what each key press did or why it was refused.

### Assertion expectation:
5 presses give the texts for a key removed, kept by the system, not usable, taken from 3 hotkeys, and set.

## Test 59

### File residence:
`tests/desktop/keystroke.test.ts`, lines 18-23

### Purpose:
Verify that every key that can be a hotkey is read back from its saved name, in any letter case.

### Assertion expectation:
594 of the 78 key names with 8 sets of held keys are usable, and each reads back from its lower-case name.

## Test 60

### File residence:
`tests/desktop/keystroke.test.ts`, lines 25-28

### Purpose:
Verify that text which is not a key name is not read as a key.

### Assertion expectation:
None of 10 texts, such as Ctrl+, Shift+Ctrl+S, F13 and Win+S, reads as a key; a failure lists them.

## Test 61

### File residence:
`tests/desktop/keystroke.test.ts`, lines 30-38

### Purpose:
Verify that keys are sorted into those the system keeps, those without a name, and those a hotkey can use.

### Assertion expectation:
Of 17 keys, 8 such as F12 and Alt+F4 are kept, ;, None and Shift unnamed, and 6 such as Ctrl+Tab usable.

## Test 62

### File residence:
`tests/desktop/keystroke.test.ts`, lines 40-50

### Purpose:
Verify that a key press gets one name however it is pressed: held keys in the order Ctrl, Alt, Shift, then the key.

### Assertion expectation:
12 presses give names such as Ctrl+Shift+S, Num 5 and Alt+PgDn; Shift alone, ; and a Meta press give none.

## Test 63

### File residence:
`tests/mobile/android-manifest.test.ts`, lines 56-59

### Purpose:
Verify that the generated Android project gets what the first Android app declared.

### Assertion expectation:
The patched sample manifest holds the frcp.net link filter and the portrait setting; a failure lists what is missing.

## Test 64

### File residence:
`tests/mobile/android-manifest.test.ts`, lines 61-64

### Purpose:
Prevent the Android project's manifest from gaining the same parts twice when the script is run again.

### Assertion expectation:
Patching the patched sample manifest gives the same text.

## Test 65

### File residence:
`tests/mobile/incoming-link.test.ts`, lines 20-22

### Purpose:
Verify that the mobile shell takes the code out of a share link that another app sends.

### Assertion expectation:
linkCode of https://frcp.net/#p= and a code is that code.

## Test 66

### File residence:
`tests/mobile/incoming-link.test.ts`, lines 24-26

### Purpose:
Verify that a plain frcp.net address starts the app without a share link.

### Assertion expectation:
linkCode of https://frcp.net/ is null.

## Test 67

### File residence:
`tests/mobile/incoming-link.test.ts`, lines 28-30

### Purpose:
Prevent the share link the app is started with from being offered twice, as Android reports it twice.

### Assertion expectation:
A link reported as opened and as the launch link gives that launch code and no later link.

## Test 68

### File residence:
`tests/mobile/incoming-link.test.ts`, lines 32-34

### Purpose:
Verify that opening the launch link again in the running app is passed on, after its first twin report is dropped.

### Assertion expectation:
After the launch, two more reports of the same link give one later link.

## Test 69

### File residence:
`tests/mobile/mobile-shell.test.ts`, lines 25-27

### Purpose:
Verify that dismissing Android's share sheet is not treated as a failed share.

### Assertion expectation:
isShareDismissal is true for Capacitor's "Share canceled" error and false for another error.

## Test 70

### File residence:
`tests/mobile/mobile-shell.test.ts`, lines 29-31

### Purpose:
Enforce that the mobile app keeps the phone layout on wide screens, by rewriting phone.css's media rules.

### Assertion expectation:
The three media texts of phone.css become "not all", "all" and "(hover: none)".

## Test 71

### File residence:
`tests/mobile/mobile-shell.test.ts`, lines 33-35

### Purpose:
Verify that Android's back button closes an open dialog before an open menu, as in the first Android app.

### Assertion expectation:
With a dialog and a menu open, only the dialog's close button is clicked.

## Test 72

### File residence:
`tests/mobile/mobile-shell.test.ts`, lines 37-39

### Purpose:
Verify that Android's back button leaves the app when nothing is open.

### Assertion expectation:
With nothing open, the only thing done is leaving the app.

## Test 73

### File residence:
`tests/page/full-page.test.ts`, lines 65-107

### Purpose:
Verify that on a phone the swipes draw, undo, re-roll and reset, and that the icons follow the finger.

### Assertion expectation:
From 3 draws: left gives 4, right undoes, up changes the civ, down gives 0, right undoes; icons move; no page error.

## Test 74

### File residence:
`tests/page/full-page.test.ts`, lines 109-114

### Purpose:
Verify that the elements made for simple mode do not show on the full page.

### Assertion expectation:
The full page has elements of class `simple`, and none is displayed; a failure lists those showing.

## Test 75

### File residence:
`tests/simple/wcag.test.ts`, lines 39-41

### Purpose:
Verify that simple mode has no fault that axe-core can find against WCAG 2.2 at levels A, AA and AAA.

### Assertion expectation:
axe-core reports nothing in 19 states at 5 sizes, one of them dark; a failure lists the state, rule and element.

## Test 76

### File residence:
`tests/simple/wcag.test.ts`, lines 43-45

### Purpose:
Verify that all text in simple mode has a contrast of at least 7:1 (WCAG 1.4.6).

### Assertion expectation:
No text is under 7:1 against its background, light or dark, at 1280 px, 320 px or on a phone; a failure lists it.

## Test 77

### File residence:
`tests/simple/wcag.test.ts`, lines 47-49

### Purpose:
Verify that every control in simple mode is big enough to hit (WCAG 2.5.5).

### Assertion expectation:
Every control, or its label, is at least 44 x 44 px at every size, also with text spacing; a failure lists the small.

## Test 78

### File residence:
`tests/simple/wcag.test.ts`, lines 51-53

### Purpose:
Verify that simple mode needs no sideways scrolling at up to 400 % zoom (WCAG 1.4.10).

### Assertion expectation:
Down to 320 px wide, no page or box scrolls sideways and no text leaves the screen; a failure lists what does.

## Test 79

### File residence:
`tests/simple/wcag.test.ts`, lines 55-57

### Purpose:
Verify that no text is lost when the user sets wider text spacing or a wide font (WCAG 1.4.12).

### Assertion expectation:
No text overlaps other text, spills out of its control or is cut off at any size; a failure lists each.

## Test 80

### File residence:
`tests/simple/wcag.test.ts`, lines 59-61

### Purpose:
Verify that blocks of text in simple mode are easy to read (WCAG 1.4.8).

### Assertion expectation:
Each block of 2 sentences or more has lines of at most 80 characters, 1.5 line height and is not justified.

## Test 81

### File residence:
`tests/simple/wcag.test.ts`, lines 63-65

### Purpose:
Verify that nothing opens a new tab without telling the user first (WCAG 3.2.5).

### Assertion expectation:
Every link with target _blank and the Tech Tree item and button say (opens in a new tab); a failure lists the others.

## Test 82

### File residence:
`tests/simple/wcag.test.ts`, lines 67-69

### Purpose:
Verify that simple mode loads no image and no sound (WCAG 1.1.1, 1.4.9).

### Assertion expectation:
The 1280 px sweep loads no image or sound file, and no style sheet gives simple mode an image; a failure lists them.

## Test 83

### File residence:
`tests/simple/wcag.test.ts`, lines 71-74

### Purpose:
Verify that the texts of simple mode can be read with lower secondary education (WCAG 3.1.5).

### Assertion expectation:
Over 40 texts of 8 words or more are found, none above Flesch-Kincaid grade 9; a failure lists the hard ones.

## Test 84

### File residence:
`tests/simple/wcag.test.ts`, lines 76-79

### Purpose:
Verify that Help explains the picker's own words and its short forms (WCAG 3.1.3, 3.1.4).

### Assertion expectation:
Help's lists define 18 words, such as Civ pool, and every short form seen on the pages; a failure lists the gaps.

## Test 85

### File residence:
`tests/simple/wcag.test.ts`, lines 81-99

### Purpose:
Verify that the menus and tabs of simple mode work from the keyboard alone (WCAG 2.1.1).

### Assertion expectation:
Enter, the arrows, Home, End, Escape and Tab open, move in and leave the menus and tabs, in 15 steps as listed.

## Test 86

### File residence:
`tests/simple/wcag.test.ts`, lines 101-111

### Purpose:
Verify that focus moves where the user expects (WCAG 2.4.3).

### Assertion expectation:
Help opens at its heading, Escape returns focus to the Help menu, and hotkey 3 moves focus to the Civ Pool tab.

## Test 87

### File residence:
`tests/simple/wcag.test.ts`, lines 113-115

### Purpose:
Verify that the focused control always shows and is never hidden (WCAG 2.4.7, 2.4.11 to 2.4.13).

### Assertion expectation:
At 3 sizes each tab has over 8 Tab stops, each with a ring of 2 px and 3:1 or more and nothing covering it.

## Test 88

### File residence:
`tests/simple/wcag.test.ts`, lines 117-128

### Purpose:
Verify that the single-key hotkeys can be turned off (WCAG 2.1.4).

### Assertion expectation:
With them off, Space, 2 and O do nothing, F2 still opens the hotkeys, and no single key is listed there.

## Test 89

### File residence:
`tests/simple/wcag.test.ts`, lines 130-142

### Purpose:
Verify that a tooltip can be dismissed, hovered and reached by keyboard (WCAG 1.4.13).

### Assertion expectation:
The Draw tooltip shows on hover and focus, stays under the pointer, and goes on Escape until the pointer returns.

## Test 90

### File residence:
`tests/simple/wcag.test.ts`, lines 144-151

### Purpose:
Verify that simple mode needs no swipe on a phone (WCAG 2.5.1).

### Assertion expectation:
On a 375 x 812 phone a swipe draws nothing, the Draw and Reset buttons show, and a tap on Draw draws.

## Test 91

### File residence:
`tests/simple/wcag.test.ts`, lines 153-160

### Purpose:
Verify that a click meant to close a menu does nothing else (WCAG 2.5.2).

### Assertion expectation:
With a menu open, a click on Draw closes the menu and draws nothing; the next click on Draw draws.

## Test 92

### File residence:
`tests/simple/wcag.test.ts`, lines 162-165

### Purpose:
Verify that a small phone scrolls one way only, and that the whole page scrolls at 400 % zoom (WCAG 1.4.10).

### Assertion expectation:
At 320 x 568 only the panel scrolls, tabs open at their top, menus fit and move nothing; a failure lists the faults.

## Test 93

### File residence:
`tests/simple/wcag.test.ts`, lines 167-175

### Purpose:
Verify that the actions that lose the user's work can be undone (WCAG 3.3.6).

### Assertion expectation:
Ctrl+Z brings back the 2 rounds after Clear Log, the civs after Disable All, and the draw a quickload took.

## Test 94

### File residence:
`tests/simple/wcag.test.ts`, lines 177-187

### Purpose:
Verify that results are told to screen readers and are not taken away by a timer (WCAG 4.1.3, 2.2.1).

### Assertion expectation:
The toast has role status, says Log cleared and still shows after 3 seconds; Undone replaces it; copying reports.

## Test 95

### File residence:
`tests/simple/wcag.test.ts`, lines 189-191

### Purpose:
Verify that a wrong entry is pointed out and the user told how to mend it (WCAG 3.3.1, 3.3.3).

### Assertion expectation:
Entering abc as lobby code and as link shows an error that the field is tied to, marks it invalid and focuses it.

## Test 96

### File residence:
`tests/simple/wcag.test.ts`, lines 193-206

### Purpose:
Verify that what the layout shows is also in the markup, for screen readers (WCAG 1.3.1, 4.1.2).

### Assertion expectation:
Rounds are lists, edition, DLCs and civs named groups, counts headings; editions say if pressed; lang is en.

## Test 97

### File residence:
`tests/simple/wcag.test.ts`, lines 208-213

### Purpose:
Verify that simple mode still works when the system forces its own colours.

### Assertion expectation:
With forced colours, the selected edition's dot is a radial gradient and the focus ring is solid, 3 px.

## Test 98

### File residence:
`tests/simple/wcag.test.ts`, lines 215-217

### Purpose:
Prevent the sweeps from passing because a tab, menu or dialog never opened, or a page threw an error.

### Assertion expectation:
All 19 states open in all 13 sweeps and no page of any test logs an error; a failure lists each.

## Test 99

### File residence:
`tests/structure/code-rules.test.ts`, lines 125-127

### Purpose:
Enforce that the code has no comments (Rule 10).

### Assertion expectation:
No .ts, .html, .css or .sh file that git lists has a comment; a failure lists each file and line.

## Test 100

### File residence:
`tests/structure/code-rules.test.ts`, lines 129-131

### Purpose:
Enforce that no function is longer than 60 lines (Rule 11).

### Assertion expectation:
No function in a .ts file that git lists is over 60 lines; a failure lists the file, line and length.
