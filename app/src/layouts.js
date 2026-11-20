// Panel layouts for Sunset Cover Studio.
//
// Every layout is a set of panels expressed as fractions of the cover
// (x, y, width, height, each 0..1) plus the zone where the caption sits.
// The renderer turns fractions into pixels, so one layout works at every
// export size: square, portrait and landscape alike.

export const LAYOUTS = {
  grid: {
    name: 'Classic Grid',
    blurb: 'Four equal panels, the poster-grid look.',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    caption: { x: 0.5, y: 0.82, width: 0.92, align: 'center' },
  },
  heroLeft: {
    name: 'Hero Left',
    blurb: 'One big hero panel, two stacked beside it.',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
    caption: { x: 0.31, y: 0.83, width: 0.56, align: 'center' },
  },
  heroRight: {
    name: 'Hero Right',
    blurb: 'Hero panel on the right, stack on the left.',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 0.5 },
      { x: 0, y: 0.5, w: 0.38, h: 0.5 },
      { x: 0.38, y: 0, w: 0.62, h: 1 },
    ],
    caption: { x: 0.69, y: 0.83, width: 0.56, align: 'center' },
  },
  triptych: {
    name: 'Triptych',
    blurb: 'Three tall columns side by side.',
    panels: [
      { x: 0, y: 0, w: 0.3333, h: 1 },
      { x: 0.3333, y: 0, w: 0.3334, h: 1 },
      { x: 0.6667, y: 0, w: 0.3333, h: 1 },
    ],
    caption: { x: 0.5, y: 0.83, width: 0.9, align: 'center' },
  },
  comic: {
    name: 'Comic Strip',
    blurb: 'A horizontal band of four frames.',
    panels: [
      { x: 0, y: 0.12, w: 0.25, h: 0.76 },
      { x: 0.25, y: 0.12, w: 0.25, h: 0.76 },
      { x: 0.5, y: 0.12, w: 0.25, h: 0.76 },
      { x: 0.75, y: 0.12, w: 0.25, h: 0.76 },
    ],
    caption: { x: 0.5, y: 0.9, width: 0.92, align: 'center' },
  },
  centerStage: {
    name: 'Center Stage',
    blurb: 'A large centre panel flanked by two strips.',
    panels: [
      { x: 0, y: 0, w: 0.2, h: 1 },
      { x: 0.2, y: 0.06, w: 0.6, h: 0.88 },
      { x: 0.8, y: 0, w: 0.2, h: 1 },
    ],
    caption: { x: 0.5, y: 0.85, width: 0.56, align: 'center' },
  },
  editorial: {
    name: 'Editorial',
    blurb: 'Magazine cover: one wide hero, two below.',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
    ],
    caption: { x: 0.5, y: 0.12, width: 0.9, align: 'center' },
  },
  duo: {
    name: 'Split Duo',
    blurb: 'Two halves, one face-off.',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    caption: { x: 0.5, y: 0.83, width: 0.9, align: 'center' },
  },
};

export const LAYOUT_ORDER = [
  'grid',
  'heroLeft',
  'heroRight',
  'triptych',
  'comic',
  'centerStage',
  'editorial',
  'duo',
];

// Pixel rectangle for one panel, pulled in by half the gutter on each side
// so neighbouring panels share one clean gap.
export function panelRect(layoutId, index, width, height, gutter) {
  const panel = LAYOUTS[layoutId].panels[index];
  const half = gutter / 2;
  return {
    x: Math.round(panel.x * width + half),
    y: Math.round(panel.y * height + half),
    w: Math.round(panel.w * width - gutter),
    h: Math.round(panel.h * height - gutter),
  };
}

// Which panel, if any, contains the point (px, py) in cover pixels.
export function panelAt(layoutId, px, py, width, height) {
  const panels = LAYOUTS[layoutId].panels;
  for (let i = panels.length - 1; i >= 0; i -= 1) {
    const p = panels[i];
    if (
      px >= p.x * width &&
      px < (p.x + p.w) * width &&
      py >= p.y * height &&
      py < (p.y + p.h) * height
    ) {
      return i;
    }
  }
  return -1;
}
