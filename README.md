# Sunset Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA 6-style
multi-panel cover art — the poster look with bold lettering and a Vice City
sunset or neon grade — exported as a PNG to share.

**Live demo:** https://hibikazen.github.io/makefun-gta6-cover-art-01/app/
**Competition:** https://make.fun/c/gta6-cover-art-01

## What it does

- **Any photo:** upload your own photos or use the built-in samples; every
  panel gets its own photo, crop, zoom and pan.
- **8 layouts:** Classic Grid, Hero Left, Hero Right, Triptych, Comic Strip,
  Center Stage, Editorial and Split Duo.
- **7 grades:** Vice Sunset, Neon Vice, Retro Print, Halftone Dot, Teal Noir,
  Golden Hour and Mono Pop.
- **Caption:** big Anton title plus an Oswald subtitle, in three fill styles
  — Solid, Sunset Fade and Neon Glow — with poster tilt and size controls.
- **One-click export:** PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.
- **Fully offline:** plain static files under `app/`, no build step, no
  network request; your photos never leave your machine.

## Run it locally

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `app/` — the web app (index.html, style.css, src/, fonts/, samples/)
- `screenshots/` — screenshots of the app and covers it exported
- `shots.json` — the four screenshot scenes (`?shot=` presets)
- `main.ts` — the entry program: copies `app/` + `screenshots/` and writes
  the dossier with the vendored make.fun library
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## Fonts and originality

Lettering uses Anton and Oswald, both under the SIL Open Font License and
vendored in `app/fonts/` (see `app/fonts/OFL-NOTICE.txt`). No Rockstar
Games logo, wordmark, official artwork or font is used anywhere. The sample
photos were made with an image model for make.fun and are free to use.

## License

MIT — see [LICENSE](LICENSE).
