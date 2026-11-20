// The eight multi-panel layouts. Every panel is a rectangle in fractions of
// the cover (x, y from the top-left corner, w and h from 0 to 1). `caption`
// is the zone the title and subtitle sit in, also in fractions, with the
// text alignment inside it.
export const LAYOUTS = [
  {
    id: 'grid',
    name: 'Classic Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    caption: { x: 0.04, y: 0.79, w: 0.92, align: 'center' },
  },
  {
    id: 'hero-left',
    name: 'Hero Left',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
    caption: { x: 0.03, y: 0.78, w: 0.56, align: 'left' },
  },
  {
    id: 'hero-right',
    name: 'Hero Right',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 0.5 },
      { x: 0, y: 0.5, w: 0.38, h: 0.5 },
      { x: 0.38, y: 0, w: 0.62, h: 1 },
    ],
    caption: { x: 0.41, y: 0.78, w: 0.56, align: 'left' },
  },
  {
    id: 'triptych',
    name: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
    caption: { x: 0.04, y: 0.79, w: 0.92, align: 'center' },
  },
  {
    id: 'comic',
    name: 'Comic Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.55 },
      { x: 0, y: 0.55, w: 1 / 3, h: 0.45 },
      { x: 1 / 3, y: 0.55, w: 1 / 3, h: 0.45 },
      { x: 2 / 3, y: 0.55, w: 1 / 3, h: 0.45 },
    ],
    caption: { x: 0.04, y: 0.36, w: 0.92, align: 'center' },
  },
  {
    id: 'center',
    name: 'Center Stage',
    panels: [
      { x: 0, y: 0, w: 0.16, h: 1 },
      { x: 0.16, y: 0.1, w: 0.68, h: 0.68 },
      { x: 0.84, y: 0, w: 0.16, h: 1 },
      { x: 0.16, y: 0.78, w: 0.68, h: 0.22 },
    ],
    caption: { x: 0.2, y: 0.58, w: 0.6, align: 'center' },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    ],
    caption: { x: 0.04, y: 0.43, w: 0.92, align: 'center' },
  },
  {
    id: 'duo',
    name: 'Split Duo',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    caption: { x: 0.04, y: 0.79, w: 0.92, align: 'center' },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
