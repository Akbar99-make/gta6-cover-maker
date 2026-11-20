# Vice Cover Studio — Make GTA 6 Cover Art

A web app that turns your photo and a caption into GTA-style cover art, exported
as a PNG to share. Built for make.fun's "Make GTA 6 Cover Art" bounty.

## What it does

- **Four-panel cover collage** — a big Hero panel, two smaller panels and a wide
  Strip panel, with white gutters, in the style of a GTA poster.
- **Your photos, your way** — upload a photo for any panel, or use one of the
  four built-in illustrated scenes (Sunset Blvd, Neon Strip, Beach Palms,
  Downtown). Crop and position each panel with zoom and pan sliders, or click
  a panel on the cover to select it.
- **Bold caption lettering** — a huge condensed title with a thick outline in
  White, Gold or Neon, plus a subtitle and a neon rule.
- **Colour grades** — Sunset, Neon, Noir and Vice washes over the whole cover,
  with a vignette and palm silhouettes framing the caption.
- **Three post sizes** — Square 1080 × 1080, Portrait 1080 × 1350 and Wide
  1920 × 1080. One click exports the exact PNG the preview shows.

## Try it

```sh
node serve.ts
# open http://localhost:8080/app/index.html
```

Everything runs offline from static files under `app/` — no network requests,
no build step. All artwork is original: the scenes are painted by code, and no
Rockstar Games logo, artwork or font is used anywhere.

## Screenshots

Run the screenshot pass (headless Chrome + Pillow):

```sh
node render-shots.mjs
```

It serves the app, captures the four shots from `shots.json` and writes JPEGs
into `screenshots/` (first by name is the cover).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## License

MIT — see `LICENSE`.
