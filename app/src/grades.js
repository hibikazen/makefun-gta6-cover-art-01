// The seven colour grades.
//
// A grade has three parts: a canvas filter string applied while each photo is
// drawn, a tint wash (a vertical gradient painted over the whole cover with a
// blend mode), and the print texture — halftone dots, film grain and a
// vignette — applied on top. `swatch` is the picker's preview gradient.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.07) sepia(0.22)',
    tint: ['#ff7a18', '#ff2e63'],
    blend: 'soft-light',
    tintAlpha: 0.55,
    halftone: false,
    grain: 0.05,
    vignette: 0.28,
    swatch: 'linear-gradient(135deg, #ffd166, #ff2e63)',
  },
  {
    id: 'neon',
    name: 'Neon Vice',
    filter: 'saturate(1.9) contrast(1.12) hue-rotate(-12deg)',
    tint: ['#ff2ea6', '#22d3ee'],
    blend: 'overlay',
    tintAlpha: 0.5,
    halftone: false,
    grain: 0.04,
    vignette: 0.32,
    swatch: 'linear-gradient(135deg, #ff2ea6, #22d3ee)',
  },
  {
    id: 'retro',
    name: 'Retro Print',
    filter: 'sepia(0.42) contrast(0.96) brightness(1.06) saturate(0.9)',
    tint: ['#f5d9a8', '#d9a05b'],
    blend: 'multiply',
    tintAlpha: 0.28,
    halftone: false,
    grain: 0.09,
    vignette: 0.38,
    swatch: 'linear-gradient(135deg, #f5d9a8, #b97a3c)',
  },
  {
    id: 'halftone',
    name: 'Halftone Pop',
    filter: 'grayscale(0.35) contrast(1.35) saturate(1.25)',
    tint: ['#ffd166', '#ff5e62'],
    blend: 'soft-light',
    tintAlpha: 0.3,
    halftone: true,
    grain: 0.03,
    vignette: 0.22,
    swatch: 'radial-gradient(circle at 30% 30%, #ffd166 25%, #ff5e62 80%)',
  },
  {
    id: 'noir',
    name: 'Teal Noir',
    filter: 'saturate(0.65) contrast(1.28) brightness(0.9)',
    tint: ['#0f766e', '#0b1220'],
    blend: 'overlay',
    tintAlpha: 0.55,
    halftone: false,
    grain: 0.06,
    vignette: 0.48,
    swatch: 'linear-gradient(135deg, #0f766e, #0b1220)',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'sepia(0.3) saturate(1.55) brightness(1.07) contrast(1.05)',
    tint: ['#ffb347', '#ff7a18'],
    blend: 'screen',
    tintAlpha: 0.38,
    halftone: false,
    grain: 0.04,
    vignette: 0.22,
    swatch: 'linear-gradient(135deg, #ffe08a, #ff7a18)',
  },
  {
    id: 'pop',
    name: 'Mono Pop',
    filter: 'grayscale(0.55) contrast(1.32) saturate(1.7)',
    tint: ['#ff4d6d', '#c9184a'],
    blend: 'color',
    tintAlpha: 0.35,
    halftone: false,
    grain: 0.05,
    vignette: 0.26,
    swatch: 'linear-gradient(135deg, #ff8fa3, #c9184a)',
  },
];

export function gradeById(id) {
  return GRADES.find((entry) => entry.id === id) ?? GRADES[0];
}
