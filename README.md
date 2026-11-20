# Sunset Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hibikazen/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA 6-style
multi-panel cover art, exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun).

Live demo: https://hibikazen.github.io/makefun-gta6-cover-art-01/app/

## What it does

- **Any photo**: load your own photos from your machine (or start from the two
  built-in samples), crop and reposition each one per panel, and fill several
  panels with one photo or several.
- **8 multi-panel layouts**: Classic Grid, Hero Left, Hero Right, Triptych,
  Comic Strip, Center Stage, Editorial and Split Duo.
- **7 colour grades**: Sunset, Vice Neon, Retro Print, Halftone, Teal Noir,
  Golden Hour and Mono Pop.
- **Bold caption lettering**: a big Anton display title with an Oswald
  subtitle, three fill styles (Solid, Sunset Fade, Neon Glow) and a poster
  tilt control.
- **One-click export**: PNG at 1080 x 1080, 1080 x 1350 or 1920 x 1080.

## Run it

No build step, no network. Serve `app/` with any static server and open
`index.html` in a desktop browser:

```sh
node serve.ts
# then open http://localhost:8080
```

Everything the app loads — scripts, styles, fonts and sample photos — is a
file under `app/`. Your photos never leave your machine.

## Fonts

The display and caption fonts are Anton and Oswald, both under the SIL Open
Font License, vendored under `app/fonts/` (subset to the Latin glyphs the app
needs). See `app/fonts/OFL-NOTICE.txt`.

## License

MIT. See [LICENSE](LICENSE).
