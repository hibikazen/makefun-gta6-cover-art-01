// Sunset and neon colour grades. Each grade is a gradient map: the photo's
// luminance picks a colour from a multi-stop gradient, blended back over the
// original so the photo keeps its identity. The map is baked into a 256-entry
// lookup table once per grade, so applying it is one pass over the pixels.

export const GRADES = {
  none: { name: 'Original', strength: 0, stops: null },
  sunset: {
    name: 'Vice Sunset',
    strength: 0.72,
    stops: [
      [0.0, '#160a2e'],
      [0.25, '#7b2d8b'],
      [0.55, '#ff6b35'],
      [0.8, '#ffd23f'],
      [1.0, '#fff3b0'],
    ],
  },
  neon: {
    name: 'Neon Nights',
    strength: 0.75,
    stops: [
      [0.0, '#050214'],
      [0.28, '#2d1b69'],
      [0.55, '#ff2e88'],
      [0.8, '#00e5ff'],
      [1.0, '#ffffff'],
    ],
  },
  vice: {
    name: 'Miami Vice',
    strength: 0.7,
    stops: [
      [0.0, '#062a2a'],
      [0.3, '#0e7490'],
      [0.58, '#ec4899'],
      [0.82, '#fbbf24'],
      [1.0, '#fff7ed'],
    ],
  },
  midnight: {
    name: 'Midnight',
    strength: 0.68,
    stops: [
      [0.0, '#020617'],
      [0.3, '#1e3a8a'],
      [0.6, '#6366f1'],
      [0.85, '#a5b4fc'],
      [1.0, '#e0e7ff'],
    ],
  },
  gold: {
    name: 'Golden Hour',
    strength: 0.7,
    stops: [
      [0.0, '#1a1207'],
      [0.3, '#78350f'],
      [0.6, '#d97706'],
      [0.85, '#fbbf24'],
      [1.0, '#fef3c7'],
    ],
  },
};

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Builds the 256-entry RGB lookup table for a grade (null for Original). */
export function buildGradeLUT(gradeKey) {
  const grade = GRADES[gradeKey] ?? GRADES.none;
  if (!grade.stops) return null;
  const lut = new Uint8ClampedArray(256 * 3);
  const stops = grade.stops.map(([t, hex]) => [t, hexToRgb(hex)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}

/**
 * Grades raw pixels in place: optional posterize first (quantize each channel
 * to `levels` steps), then the gradient map blended by the grade's strength.
 */
export function applyGradeToPixels(data, lut, strength, posterizeLevels) {
  const quantize = posterizeLevels > 1;
  const step = quantize ? 255 / (posterizeLevels - 1) : 0;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (quantize) {
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
    }
    if (lut && strength > 0) {
      const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const li = luma * 3;
      r = r + (lut[li] - r) * strength;
      g = g + (lut[li + 1] - g) * strength;
      b = b + (lut[li + 2] - b) * strength;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/**
 * Draws a halftone dot screen over a panel: one dot per cell, sized by the
 * local luminance sampled from the panel's pixels, in deep ink.
 */
export function applyHalftone(ctx, data, w, h, cell) {
  const ink = 'rgba(12, 4, 24, 0.5)';
  ctx.fillStyle = ink;
  const maxR = cell * 0.62;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const cx = Math.min(w - 1, x + (cell >> 1));
      const cy = Math.min(h - 1, y + (cell >> 1));
      const i = (cy * w + cx) * 4;
      const luma = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      const radius = maxR * (1 - luma);
      if (radius < 0.6) continue;
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
