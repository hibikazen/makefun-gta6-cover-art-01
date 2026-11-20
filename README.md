[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Sunset Cover Studio

A GTA 6-style cover art maker, built for [make.fun's GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01). Turn your own photo and a caption into multi-panel cover art with a Vice City sunset or neon colour grade, and export it as a PNG to share.

## What it does

- **Eight real multi-panel layouts** — Classic Grid (2×2), Hero + Strips, Diagonal Split, Triple Strip, Poster + Insets, Comic Strip, Center Stage, and Editorial.
- **Any photo, any panel** — upload several photos (or drag them onto the cover), assign each to a panel, and crop it by dragging on the preview or with zoom and pan sliders. Two built-in samples mean it works instantly with no upload.
- **Caption editing** — main caption and sub-caption, size, six colours, three fill styles (Solid, Sunset Fade, Neon Glow), a poster tilt, top or bottom placement, and an optional dark band for legibility.
- **Sunset and neon grades** — seven gradient-map grades (Vice Sunset, Neon Nights, Miami Vice, Midnight, Golden Hour, Neon Vice, Retro Print) plus a halftone dot screen, posterize, film grain, vignette and adjustable panel gaps.
- **One-click export** — PNG at 1080×1080, 1080×1350 or 1920×1080.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app is plain static files under `app/` — no build step, no network request, and photos never leave your machine.

Or skip the install and try it live: https://hibikazen.github.io/makefun-gta6-cover-art-01/app/

## Originality

Everything here is original: no Rockstar Games logo, wordmark, official artwork or font. The lettering uses Anton and Oswald, both licensed under the SIL Open Font License and vendored under `app/fonts/` (see `app/fonts/OFL-NOTICE.txt`). The two sample photos under `app/samples/` were made with an image model for make.fun and are free to use.

## License

MIT — see [LICENSE](LICENSE).
