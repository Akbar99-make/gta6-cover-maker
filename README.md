# Vice Cover Studio

Turn any photo into GTA-style cover art — a web app that runs offline in
desktop Chrome. Pick a photo, pick a scene, layout and colour grade, write
your caption, and export a share-ready PNG.

## What it does

- **Any photo** — upload your own photos (or use the built-in demo
  portrait, a flat illustration drawn in code). Drag the preview to move
  the photo, zoom it, and switch photos per panel from the strip.
- **Four procedural scenes** — Sunset Beach, Neon Street, Night Skyline and
  Desert Highway, all drawn on canvas. No photo files ship with the app.
- **Three layouts** — Hero (one big full-bleed photo), Panels (hero plus two
  scene panels) and Poster (a framed poster with a title band).
- **Four colour grades** — Vice Sunset, Neon Nights, Golden Hour and
  Midnight, plus film grain and a vignette on every cover.
- **Bold lettering** — a huge Anton title with a hard shadow and keyline,
  and a tilted Pacifico script subtitle.
- **Fast export** — one click writes a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything loads from
`app/` — no network request is made at runtime, and photos are read on
your own machine, never uploaded.

## Make the screenshots

```sh
node render-shots.mjs
```

It serves the app, loads each shot in headless Chromium and writes four
JPEGs into `screenshots/` (the first by name is the cover). The shots are
listed in `shots.json` and in `app/src/shots.js`.

## Hand in the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the kit's vendored library.

## Files

- `app/index.html`, `app/style.css` — the page and its studio chrome.
- `app/src/main.js` — the editor: controls, upload, drag-to-pan, export.
- `app/src/cover.js` — the cover renderer: layouts, grades, lettering.
- `app/src/scenes.js` — the procedural scenes and the demo portrait.
- `app/src/shots.js` — the four screenshot presets and shot URL params.
- `app/fonts/` — Anton and Pacifico (SIL Open Font License, see
  `app/fonts/OFL.txt`).
- `main.ts` — the entry program. `serve.ts` — the local server.
  `render-shots.mjs` — the screenshot maker.

## Originality

All art is original and drawn in code. No Rockstar Games logo, artwork,
character or font is used anywhere. The demo portrait is a flat
illustration of an invented person, not a photograph of a real person.

## License

MIT — see `LICENSE`.
