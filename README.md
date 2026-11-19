# Vice Cover Studio

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Akbar99-make/gta6-cover-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Akbar99-make/gta6-cover-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover Studio turns a photo and a caption into GTA-style cover art: a
multi-panel poster with bold lettering and a sunset or neon grade, exported
as a PNG to share. It runs entirely offline in a desktop browser from its
own static files — photos are read on the machine, never uploaded.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## What it does

- **Any photo**: upload one from the machine, or start from a bundled
  sample. Each panel can hold the same photo or a different one.
- **Crop and position**: pick a panel, then pan it and zoom it with the
  sliders until the framing is right.
- **Panels**: three layouts — Hero (one big panel over two small ones),
  Split (two tall panels) and Stack (one tall panel beside two short ones).
- **Colour grades**: Sunset, Neon and Noir, each a strong wash over the
  photo with a vignette.
- **Caption styles**: White, Gold and Neon bold lettering across the
  bottom of the cover.
- **Fast export**: one click writes a PNG in 1080 x 1080, 1080 x 1350 or
  1920 x 1080.

## How it is built

- `app/index.html` — the editor page.
- `app/src/cover.js` — paints the multi-panel cover (panels, grades,
  caption band) onto a canvas.
- `app/src/main.js` — the editor: controls, live preview, PNG export.
- `app/src/shots.js` — the four screenshots the maker takes.
- `app/style.css` — the editor's dark neon styling.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json`.
- `serve.ts` — a tiny static server for trying the app locally.
- `render-shots.mjs` — re-takes the four screenshots with headless Chrome.
- `shots.json` — the screenshot list the render script walks.

Everything in the art is original: no Rockstar Games logo, artwork or
font. The lettering is the system font stack, painted bold.

## Entered in

[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) on
[make.fun](https://make.fun).

Optional: earn referral rewards, a second way to make money —
[sign up through this referral link](https://make.fun/r/9hsfr25m).
