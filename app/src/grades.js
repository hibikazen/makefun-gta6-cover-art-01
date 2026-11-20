// The seven colour grades. Each grade has a canvas filter string applied to
// every photo panel, plus an overlay drawn over the whole cover afterwards:
// a tinted gradient, a vignette, or a halftone dot pattern. `swatch` is the
// CSS background the grade picker shows for the grade.
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.35) contrast(1.08) sepia(0.22)',
    swatch: 'linear-gradient(135deg, #ff7a2f, #7a1459)',
    overlay: {
      kind: 'gradient',
      stops: [
        [0, 'rgba(255, 122, 47, 0.20)'],
        [0.55, 'rgba(255, 60, 90, 0.08)'],
        [1, 'rgba(90, 10, 80, 0.28)'],
      ],
    },
  },
  {
    id: 'vice',
    name: 'Vice Neon',
    filter: 'saturate(1.6) contrast(1.12) hue-rotate(-14deg)',
    swatch: 'linear-gradient(135deg, #ff2fb3, #22d3ee)',
    overlay: {
      kind: 'gradient',
      stops: [
        [0, 'rgba(255, 47, 179, 0.22)'],
        [1, 'rgba(34, 211, 238, 0.22)'],
      ],
    },
  },
  {
    id: 'retro',
    name: 'Retro Print',
    filter: 'sepia(0.55) contrast(1.06) saturate(0.9)',
    swatch: 'linear-gradient(135deg, #d9b380, #8a5a2b)',
    overlay: { kind: 'vignette', strength: 0.38, tint: 'rgba(120, 72, 20, 0.12)' },
  },
  {
    id: 'halftone',
    name: 'Halftone',
    filter: 'grayscale(0.92) contrast(1.28)',
    swatch: 'radial-gradient(circle at 30% 30%, #ffffff 2px, #111111 3px)',
    overlay: { kind: 'halftone', spacing: 9, radius: 2.1, alpha: 0.5 },
  },
  {
    id: 'teal',
    name: 'Teal Noir',
    filter: 'saturate(0.85) contrast(1.16) brightness(0.94)',
    swatch: 'linear-gradient(135deg, #0f766e, #0b1220)',
    overlay: {
      kind: 'gradient',
      stops: [
        [0, 'rgba(13, 148, 136, 0.10)'],
        [1, 'rgba(4, 20, 32, 0.34)'],
      ],
    },
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.25) sepia(0.3) brightness(1.05)',
    swatch: 'linear-gradient(135deg, #fbbf24, #b45309)',
    overlay: {
      kind: 'gradient',
      stops: [
        [0, 'rgba(251, 191, 36, 0.22)'],
        [1, 'rgba(120, 53, 15, 0.18)'],
      ],
    },
  },
  {
    id: 'mono',
    name: 'Mono Pop',
    filter: 'grayscale(1) contrast(1.3) brightness(1.02)',
    swatch: 'linear-gradient(135deg, #f8fafc, #0f172a)',
    overlay: {
      kind: 'gradient',
      stops: [
        [0, 'rgba(148, 163, 184, 0.10)'],
        [1, 'rgba(15, 23, 42, 0.22)'],
      ],
    },
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
