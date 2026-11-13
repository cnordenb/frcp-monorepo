requirement - a numbered statement in REQUIREMENTS.md of what the project must do, e.g. "Requirement 4"
rule - a numbered statement in RULES.md of how the project must be made and kept, e.g. "Rule 12"
chief developer - the person who alone writes the requirements, named in Rule 2
test - a check of the project, run on every push and listed by its number in TESTS.md, e.g. "Test 15"
log - the development log in docs/DEVLOG/: what changed in the project, why, and what is left
part - one file of the log, DEVLOG1.md, DEVLOG2.md and so on, each of at most 1000 lines
day - the entry of the log for one date, titled by it, e.g. "2026-11-02", never split between two parts
section - one change recorded under its day, titled by its time if it was the first written in that minute
decision - a choice made in a section and listed by subject in DECISIONS.md, with a link to that section
question - a numbered point for the chief developer at the end of a section, open until a later section answers it
picker - Fresh Random Civ Picker, the program this project makes
civ - a civilisation of the game Age of Empires II that the picker can pick, e.g. "Britons"
edition - a release of the game with its own civs and those of every older edition: AOK, HD or DE
DLC - an expansion of an edition that adds civs to it, e.g. "The Last Khans"
civ pool - the civs that are switched on, from which the picker picks
draw - one pick of a civ at random from the civ pool; also the civ picked
round - the draws made until every civ of the civ pool has been drawn once, or until a reset
reset - ending the round early, so that every civ of the civ pool can be drawn again
fresh - said of a civ not yet drawn in the round
continuous freshness - keeping the civs drawn last out of the first draws of the next round
draw log - the rounds and their draws, oldest first, that the picker shows and saves
jingle - the short tune of a civ, played when the civ is drawn
share link - an address ending in #p= and a code holding an edition, a civ pool and, if wanted, a round's draws
preset - a text file holding an edition, a civ pool and a round's draws, as the first desktop picker wrote them
hotkey - a key, alone or with Ctrl or Shift, that runs one action of the picker
platform - one of the three ways the picker runs: web, desktop or mobile
core - the code in src/core that holds the picker's rules, the same for every platform
shared interface - the code in src/app that shows the picker and takes its input, the same for every platform
shell - the code of one platform that starts the shared interface and gives it what only that platform has
site - the pages, styles, script and assets that the build puts in dist/ for one platform
simple mode - the picker without images or sounds, at /simple on the web, made to meet WCAG 2.2 at level AAA
atlas - one image holding many icons in a grid, so that a site loads one file in place of many
tab - one of the three views of the picker: Draw Civ, Log and Civ Pool
keystroke - a key together with the Ctrl, Alt and Shift held with it, named as in "Ctrl+S"
hotkey scope - where a hotkey works: on every tab, or on the Draw Civ, the Log or the Civ Pool tab only
launch link - the share link that started the mobile app, when another app opened it with one
