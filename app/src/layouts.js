// Panel layouts for the cover. Every layout is a function of the cover size
// (width, height, gap in pixels) that returns its panels in pixels. A panel is
// a rectangle { x, y, w, h }, or a polygon { poly: [[x, y], ...] } for the
// diagonal split, with an optional `inset` flag for small panels that float
// above the panel beneath them. Panels are drawn in order, so insets come last.

export const LAYOUTS = {
  grid: { name: 'Classic Grid', panels: 4, build: layoutGrid },
  hero: { name: 'Hero + Strips', panels: 3, build: layoutHero },
  diagonal: { name: 'Diagonal Split', panels: 3, build: layoutDiagonal },
  trio: { name: 'Triple Strip', panels: 3, build: layoutTrio },
  poster: { name: 'Poster + Insets', panels: 3, build: layoutPoster },
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

/** Four equal panels in a 2 x 2 grid, the classic multi-panel poster look. */
export function layoutGrid(w, h, gap) {
  const pw = (w - gap * 3) / 2;
  const ph = (h - gap * 3) / 2;
  return [
    rect(gap, gap, pw, ph),
    rect(gap * 2 + pw, gap, pw, ph),
    rect(gap, gap * 2 + ph, pw, ph),
    rect(gap * 2 + pw, gap * 2 + ph, pw, ph),
  ];
}

/** One big hero panel across the top, two strips sharing the bottom row. */
export function layoutHero(w, h, gap) {
  const heroH = (h - gap * 3) * 0.6;
  const stripH = h - gap * 3 - heroH;
  const stripW = (w - gap * 3) / 2;
  return [
    rect(gap, gap, w - gap * 2, heroH),
    rect(gap, gap * 2 + heroH, stripW, stripH),
    rect(gap * 2 + stripW, gap * 2 + heroH, stripW, stripH),
  ];
}

/** Two big panels split by a slanted divider, plus a small inset panel. */
export function layoutDiagonal(w, h, gap) {
  const slant = w * 0.07;
  const topA = w * 0.56;
  const botA = topA - slant;
  const topB = topA + gap * 1.4;
  const botB = botA + gap * 1.4;
  const insetW = w * 0.3;
  const insetH = h * 0.26;
  return [
    { x: 0, y: 0, w: topB, h, poly: [[0, 0], [topA, 0], [botA, h], [0, h]] },
    { x: botA, y: 0, w: w - botA, h, poly: [[topB, 0], [w, 0], [w, h], [botB, h]] },
    { ...rect(w - gap - insetW, h - gap - insetH, insetW, insetH), inset: true },
  ];
}

/** Three full-height vertical strips, side by side. */
export function layoutTrio(w, h, gap) {
  const pw = (w - gap * 4) / 3;
  return [
    rect(gap, gap, pw, h - gap * 2),
    rect(gap * 2 + pw, gap, pw, h - gap * 2),
    rect(gap * 3 + pw * 2, gap, pw, h - gap * 2),
  ];
}

/** One photo full-bleed, with two small inset panels along the bottom. */
export function layoutPoster(w, h, gap) {
  const insetW = w * 0.27;
  const insetH = h * 0.22;
  return [
    rect(0, 0, w, h),
    { ...rect(gap * 2, h - gap * 2 - insetH, insetW, insetH), inset: true },
    { ...rect(w - gap * 2 - insetW, h - gap * 2 - insetH, insetW, insetH), inset: true },
  ];
}

/** Panels for a layout key at a cover size; falls back to the grid. */
export function panelsFor(layoutKey, w, h, gap) {
  const layout = LAYOUTS[layoutKey] ?? LAYOUTS.grid;
  return layout.build(w, h, gap);
}

/** True when the point (px, py) lies inside the panel, polygon-aware. */
export function panelContains(panel, px, py) {
  if (panel.poly) return pointInPolygon(panel.poly, px, py);
  return px >= panel.x && px <= panel.x + panel.w && py >= panel.y && py <= panel.y + panel.h;
}

function pointInPolygon(poly, px, py) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
