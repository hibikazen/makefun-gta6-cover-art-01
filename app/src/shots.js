// Fixed scenes for screenshots. `?shot=editor` shows the page with a sample
// photo loaded; `?shot=cover` shows the cover alone, edge to edge. Query
// params pick the scene: size (square|portrait|wide), layout, grade, caption,
// sub, photo/photo2/photo3/photo4 (sample names), halftone, posterize, style
// (solid|sunset|neon), tilt (0|1) and capsize (a caption size multiplier).
// window.__shotReady is set once the cover is painted.

const SAMPLES = {
  pier: ['Pier', 'samples/pier.jpg'],
  boulevard: ['Boulevard', 'samples/boulevard.jpg'],
};

/**
 * Parses the `crops` param — `panel:panX,panY,zoom` entries separated by `;`,
 * e.g. `0:0,0.9,1.15;2:0,-0.7,1.3` — into per-panel crop overrides.
 */
function parseCrops(param) {
  const crops = [];
  if (!param) return crops;
  for (const entry of param.split(';')) {
    const [index, values] = entry.split(':');
    if (values === undefined) continue;
    const [panX, panY, zoom] = values.split(',').map(Number);
    crops[Number(index)] = {
      panX: Number.isFinite(panX) ? panX : 0,
      panY: Number.isFinite(panY) ? panY : 0,
      zoom: Number.isFinite(zoom) ? zoom : 1,
    };
  }
  return crops;
}

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = [];
  for (const key of ['photo', 'photo2', 'photo3', 'photo4']) {
    const name = query.get(key);
    if (name && SAMPLES[name]) photos.push(SAMPLES[name]);
  }
  if (!photos.length) photos.push(SAMPLES.pier, SAMPLES.boulevard);
  const assignments = photos.map((_, i) => i);
  await apply({
    sizeKey: query.get('size') ?? 'wide',
    layoutKey: query.get('layout') ?? 'hero',
    gradeKey: query.get('grade') ?? 'sunset',
    caption: query.get('caption') ?? 'Sunset Heist',
    subcaption: query.get('sub') ?? 'Neon Coast Nights',
    captionColor: query.get('color') ?? '#ffffff',
    captionStyle: query.get('style') ?? 'sunset',
    captionTilt: query.get('tilt') !== '0',
    captionSize: Number(query.get('capsize')) || 1,
    captionPos: query.get('pos') ?? 'bottom',
    halftone: query.get('halftone') === '1',
    posterize: query.get('posterize') === '1',
    photos,
    assignments,
    crops: parseCrops(query.get('crops')),
  });
  try {
    await document.fonts.ready;
  } catch {
    // The shot still goes ahead with whatever fonts loaded.
  }
  if (shot === 'editor') {
    // The preview is sticky, so scrolling the page reveals the caption and
    // grade controls below the fold while the cover stays in view.
    window.scrollTo(0, 360);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
