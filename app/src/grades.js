// Colour grades for Sunset Cover Studio.
//
// Each grade is a canvas filter string applied while a photo is drawn,
// plus an optional tint wash laid over the finished panels, a vignette
// strength and an optional halftone dot pass. The filter string is also
// valid CSS, so the editor's thumbnails preview the same look.

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    filter: 'saturate(1.42) contrast(1.08) sepia(0.24)',
    tint: { from: 'rgba(255,112,60,0.14)', to: 'rgba(255,40,120,0.20)', composite: 'overlay' },
    vignette: 0.35,
    dots: false,
  },
  vice: {
    name: 'Neon Vice',
    filter: 'saturate(1.6) contrast(1.12) hue-rotate(10deg)',
    tint: { from: 'rgba(255,45,149,0.20)', to: 'rgba(0,229,255,0.20)', composite: 'overlay' },
    vignette: 0.3,
    dots: false,
  },
  retro: {
    name: 'Retro Print',
    filter: 'saturate(0.68) contrast(0.96) brightness(1.07) sepia(0.38)',
    tint: { from: 'rgba(255,240,200,0.14)', to: 'rgba(120,80,40,0.12)', composite: 'soft-light' },
    vignette: 0.55,
    dots: false,
  },
  halftone: {
    name: 'Halftone Dot',
    filter: 'grayscale(0.35) contrast(1.3) brightness(1.03)',
    tint: { from: 'rgba(255,255,255,0.05)', to: 'rgba(0,0,0,0.10)', composite: 'source-over' },
    vignette: 0.25,
    dots: true,
  },
  noir: {
    name: 'Teal Noir',
    filter: 'saturate(0.95) contrast(1.17) brightness(0.9)',
    tint: { from: 'rgba(0,90,110,0.22)', to: 'rgba(0,20,40,0.26)', composite: 'multiply' },
    vignette: 0.5,
    dots: false,
  },
  golden: {
    name: 'Golden Hour',
    filter: 'saturate(1.35) sepia(0.32) brightness(1.06) contrast(1.05)',
    tint: { from: 'rgba(255,200,80,0.16)', to: 'rgba(255,140,40,0.14)', composite: 'soft-light' },
    vignette: 0.3,
    dots: false,
  },
  mono: {
    name: 'Mono Pop',
    filter: 'grayscale(1) contrast(1.22) brightness(1.04)',
    tint: { from: 'rgba(255,180,120,0.10)', to: 'rgba(20,20,30,0.16)', composite: 'overlay' },
    vignette: 0.4,
    dots: false,
  },
};

export const GRADE_ORDER = [
  'sunset',
  'vice',
  'retro',
  'halftone',
  'noir',
  'golden',
  'mono',
];
