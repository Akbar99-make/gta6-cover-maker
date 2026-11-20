# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Akbar99-make/gta6-cover-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Akbar99-make/gta6-cover-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into GTA 6-style multi-panel cover art — offline, in your browser.

## What it does

Vice Cover Studio is an offline static web app. Pick a scene, set a caption, and export a striking cover in three post sizes. No account, no upload, no network needed.

- **4-panel collage** — Hero, Top, Mid, and Strip panels with white gutters, laid out for square, portrait, and wide covers.
- **4 procedural scenes, drawn in code** — Sunset Blvd, Neon Strip, Beach Palms, and Downtown. Every skyline, palm, neon sign, and sunset is painted by code; no photo assets are bundled.
- **4 colour grades** — Sunset, Neon, Noir, and Vice washes across the whole cover, plus a vignette.
- **3 caption styles** — White, Gold, and Neon, in big bold condensed lettering with a strong outline.
- **Per-panel control** — click a panel in the preview to select it, then change its scene, upload your own photo, and adjust zoom and pan.
- **Upload your own photo** — drop a photo into any panel and crop it with the zoom and pan sliders.
- **Editable title and subtitle** — type your own cover line and tagline.
- **Shuffle scenes** — one click re-rolls the scene of every panel.
- **PNG export** — 1080x1080 square, 1080x1350 portrait, and 1920x1080 wide.

No Rockstar assets or fonts are used. All art is original and drawn in code.

## How to run

Serve the `app/` folder with any static server and open it in a browser:

```sh
npx serve app
```

Or run the bundled server:

```sh
node serve.ts
```

Then open the printed address in your browser.

## Repository layout

- `app/` — the static web app (HTML, CSS, and the cover engine in `app/src/`).
- `app/src/scenes.js` — the four procedural scenes, drawn in code.
- `app/src/cover.js` — the cover renderer (panels, grades, lettering).
- `app/src/main.js` — the editor (panel picker, photo upload, zoom and pan, export).
- `app/src/shots.js` — screenshot mode for the four dossier shots.
- `main.ts` — the make.fun dossier entrypoint.
- `render-shots.mjs` — re-renders the screenshots in `screenshots/`.
- `screenshots/` — four screenshots of the cover and the editor.
- `serve.ts` — a tiny static server for local use.
- `vendor/` — the make.fun app helper (do not edit).

## Screenshots

The cover and the editor, as rendered by `render-shots.mjs`:

- `screenshots/1-cover.jpg` — square cover, "VICE CITY".
- `screenshots/2-editor.jpg` — the editor with the Hero panel selected.
- `screenshots/3-cover.jpg` — portrait cover, "NEON STRIP".
- `screenshots/4-editor.jpg` — the editor, portrait size selected.

## License

MIT. See `LICENSE`.

---

Built by an AI agent for [make.fun's "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01) ($250 in USDC). Try make.fun yourself: https://make.fun/r/9hsfr25m

## Tips for a great cover

- **Let the Hero panel carry the sunset.** Sunset Blvd with the Sunset grade and a Gold caption is the boldest combination; the big sun and the road pull the eye first.
- **Mix light and dark panels.** Put Neon Strip or Downtown next to Beach Palms so the collage has contrast instead of one flat mood.
- **Keep the title short.** One or two words in capitals ("VICE CITY", "NEON STRIP") read best at post size; the subtitle can carry the rest.
- **Try the grades last.** Pick your scenes and caption first, then cycle the four grades — the same cover can feel like a different game with each one.
- **Export all three sizes.** Square fits the feed, portrait fits stories, and wide fits a banner; the layout reflows for each.
