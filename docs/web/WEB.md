# The web platform

1. [Run it](#run-it)
2. [What only the web has](#what-only-the-web-has)
3. [Put it online](#put-it-online)

The web site is the shared interface with the browser's own behaviour: links are copied to the clipboard, presets are
downloaded, and the picker's data is kept in the browser's `localStorage`.

## Run it

1. **Install the packages**, once: `npm ci`.
2. **Build and serve the site:** `npm run web`. It prints `http://127.0.0.1:8080/`; open that address. Set `PORT` to
   use another port.
3. **Stop it** with Ctrl+C.

The built site is the folder `dist/web/`. `MAINTAINER.md` says what the build puts in it.

## What only the web has

| What | Where |
| --- | --- |
| The entry file, which starts the shared interface with the browser's behaviour | `src/web/web.ts` |
| The picker's page, simple mode's page and the page that sends `/civexplorer` on to civexplorer.net | `src/web/pages/` |
| The style sheets of every platform | `src/web/styles/` |
| `CNAME` and `.well-known/discord`, copied into the site as they are | `src/web/site/` |

Simple mode (`/simple`) has no markup of its own: `simple.html` fetches the picker's page, marks it with
`data-simple`, adds `simple.css` after the line `<link rel="stylesheet" href="styles/phone.css">` and writes the
result. So that line must stay in `picker.html` exactly as it is, as the last style sheet.

## Put it online

The site is static: any host that serves the folder `dist/web/` will do. The host has to build first, as `dist/` is
not kept in the repository:

- Build command: `npm ci && node scripts/build.ts web`
- Folder to publish: `dist/web`

`dist/web/CNAME` names the domain for GitHub Pages; other hosts ignore it.
