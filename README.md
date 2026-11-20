# Sunset Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA 6-style
multi-panel cover art, exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) competition on
make.fun.

**Live demo:** https://hibikazen.github.io/makefun-gta6-cover-art-01/app/

## What it does

- **Any photo:** drop in your own photos (or use the two built-in samples),
  fill several panels with one photo or several, and crop, pan and zoom each
  panel — drag on the canvas, scroll to zoom, or use the sliders.
- **8 multi-panel layouts:** Classic Grid, Hero Left, Hero Right, Triptych,
  Comic Strip, Center Stage, Editorial and Split Duo.
- **7 colour grades:** Vice Sunset, Neon Vice, Retro Print, Halftone Pop,
  Teal Noir, Golden Hour and Mono Pop — each with its own tint wash, grain
  and vignette.
- **Bold caption lettering:** a big Anton display title plus an Oswald
  subtitle, with three fill styles (Solid, Sunset Fade, Neon Glow) and a
  poster tilt control.
- **One-click export:** PNG in the common post sizes — 1080 × 1080 (square),
  1080 × 1350 (portrait) and 1920 × 1080 (landscape).
- **Fully offline:** static files only, no build step, no network requests.
  Your photos never leave your machine.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static file
server and open `app/index.html`.

## Layout

- `app/` — the web app (index.html, style.css, src/*.js, fonts, samples)
- `screenshots/` — screenshots of the app and covers it exported
- `shots.json` — the four screenshot scenes (`?shot=` URLs)
- `main.ts` — the entry program: copies `app/` + `screenshots/` to the
  output directory and writes `dossier.json`
- `serve.ts` — a tiny static server for local previews

## Fonts and photos

The display fonts (Anton and Oswald) are licensed under the SIL Open Font
License 1.1 — see `app/fonts/OFL-NOTICE.txt`. The two sample photos were
made with an image model for make.fun and are free to use. No Rockstar Games
logo, artwork or font is used anywhere.

## License

MIT — see [LICENSE](LICENSE).
