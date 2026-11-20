// Panel geometry for the eight cover layouts.
//
// A layout is a function of one number — the gutter, as a fraction of the
// canvas — returning the panels as fractions of the canvas size:
// { x, y, w, h }, each between 0 and 1, measured from the top-left corner.
// Fractions keep every layout working at any export aspect (square, portrait
// or landscape). The icon grid is the picker's little diagram for the layout.

const GUTTER = 0.014;

function quad(g) {
  const half = (1 - g) / 2;
  return [
    { x: 0, y: 0, w: half, h: half },
    { x: half + g, y: 0, w: half, h: half },
    { x: 0, y: half + g, w: half, h: half },
    { x: half + g, y: half + g, w: half, h: half },
  ];
}

function heroLeft(g) {
  const side = 1 - 0.62 - g;
  const half = (1 - g) / 2;
  return [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62 + g, y: 0, w: side, h: half },
    { x: 0.62 + g, y: half + g, w: side, h: half },
  ];
}

function heroRight(g) {
  const side = 1 - 0.62 - g;
  const half = (1 - g) / 2;
  return [
    { x: 0, y: 0, w: side, h: half },
    { x: 0, y: half + g, w: side, h: half },
    { x: side + g, y: 0, w: 0.62, h: 1 },
  ];
}

function triptych(g) {
  const third = (1 - 2 * g) / 3;
  return [
    { x: 0, y: 0, w: third, h: 1 },
    { x: third + g, y: 0, w: third, h: 1 },
    { x: 2 * (third + g), y: 0, w: third, h: 1 },
  ];
}

function comicStrip(g) {
  const top = 0.09;
  const height = 0.72;
  const fourth = (1 - 3 * g) / 4;
  return [
    { x: 0, y: top, w: fourth, h: height },
    { x: fourth + g, y: top, w: fourth, h: height },
    { x: 2 * (fourth + g), y: top, w: fourth, h: height },
    { x: 3 * (fourth + g), y: top, w: fourth, h: height },
  ];
}

function centerStage(g) {
  const strip = 0.16;
  const middle = 1 - 2 * strip - 2 * g;
  return [
    { x: 0, y: 0, w: strip, h: 1 },
    { x: strip + g, y: 0, w: middle, h: 1 },
    { x: strip + middle + 2 * g, y: 0, w: strip, h: 1 },
  ];
}

function editorial(g) {
  const hero = 0.57;
  const third = (1 - 2 * g) / 3;
  const rowY = hero + g;
  const rowH = 1 - hero - g;
  return [
    { x: 0, y: 0, w: 1, h: hero },
    { x: 0, y: rowY, w: third, h: rowH },
    { x: third + g, y: rowY, w: third, h: rowH },
    { x: 2 * (third + g), y: rowY, w: third, h: rowH },
  ];
}

function splitDuo(g) {
  const half = (1 - g) / 2;
  return [
    { x: 0, y: 0, w: half, h: 1 },
    { x: half + g, y: 0, w: half, h: 1 },
  ];
}

export const LAYOUTS = [
  { id: 'grid', name: 'Classic Grid', panels: quad, icon: '1fr 1fr / 1fr 1fr' },
  { id: 'hero-left', name: 'Hero Left', panels: heroLeft, icon: '2fr 1fr / 1fr 1fr' },
  { id: 'hero-right', name: 'Hero Right', panels: heroRight, icon: '1fr 2fr / 1fr 1fr' },
  { id: 'triptych', name: 'Triptych', panels: triptych, icon: '1fr 1fr 1fr / 1fr' },
  { id: 'comic', name: 'Comic Strip', panels: comicStrip, icon: '1fr 1fr 1fr 1fr / 1fr' },
  { id: 'center', name: 'Center Stage', panels: centerStage, icon: '0.5fr 2fr 0.5fr / 1fr' },
  { id: 'editorial', name: 'Editorial', panels: editorial, icon: '1fr 1fr 1fr / 2fr 1fr' },
  { id: 'duo', name: 'Split Duo', panels: splitDuo, icon: '1fr 1fr / 1fr' },
];

export function layoutById(id) {
  return LAYOUTS.find((entry) => entry.id === id) ?? LAYOUTS[0];
}

export function panelRects(layoutId, gutter = GUTTER) {
  return layoutById(layoutId).panels(gutter);
}

export function panelCount(layoutId) {
  return panelRects(layoutId).length;
}
