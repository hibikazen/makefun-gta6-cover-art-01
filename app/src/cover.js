// Cover rendering: draws the multi-panel poster onto any 2D canvas at any
// size, for the live preview and for PNG export. Panels are drawn with the
// grade's canvas filter, then the grade's overlay, then the caption.
import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';

export const FILLS = [
  { id: 'solid', label: 'Solid' },
  { id: 'sunset', label: 'Sunset Fade' },
  { id: 'neon', label: 'Neon Glow' },
];

// The gap between panels, in pixels at a 1080-wide cover; scaled with width.
const GUTTER = 6;

// Cached halftone dot tiles, keyed by their parameters.
const dotTiles = new Map();

function dotPattern(spacing, radius, alpha) {
  const key = `${spacing}/${radius}/${alpha}`;
  if (dotTiles.has(key)) return dotTiles.get(key);
  const tile = document.createElement('canvas');
  tile.width = spacing;
  tile.height = spacing;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  tctx.beginPath();
  tctx.arc(spacing / 2, spacing / 2, radius, 0, Math.PI * 2);
  tctx.fill();
  dotTiles.set(key, tile);
  return tile;
}

// Draw one photo into one panel rect, cover-fit, with the panel's zoom and
// pan. `filter` is the grade's canvas filter string.
function drawPhotoPanel(ctx, img, rect, transform, filter) {
  const { zoom, x, y } = transform;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + x * Math.max(0, dw - rect.w);
  const dy = rect.y + (rect.h - dh) / 2 + y * Math.max(0, dh - rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// The placeholder a panel shows before any photo is loaded.
function drawEmptyPanel(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#2a1f3d');
  grad.addColorStop(1, '#1a1226');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `${Math.max(14, rect.w * 0.05)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// The grade's overlay over the whole cover.
function drawGradeOverlay(ctx, width, height, grade) {
  const overlay = grade.overlay;
  if (overlay.kind === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    for (const [at, color] of overlay.stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (overlay.kind === 'vignette') {
    ctx.fillStyle = overlay.tint;
    ctx.fillRect(0, 0, width, height);
    const rad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.75,
    );
    rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rad.addColorStop(1, `rgba(0, 0, 0, ${overlay.strength})`);
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, width, height);
  } else if (overlay.kind === 'halftone') {
    const tile = dotPattern(overlay.spacing, overlay.radius, overlay.alpha);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, width, height);
  }
}

// Shrink the title until it fits the caption zone, then draw it and the
// subtitle with the chosen fill, tilted around the zone's centre.
function drawCaption(ctx, state, width, height, layout) {
  const zone = layout.caption;
  const zx = zone.x * width;
  const zw = zone.w * width;
  const zy = zone.y * height;
  const title = (state.title || '').toUpperCase();
  const subtitle = state.subtitle || '';

  // The lettering must fit the space from the zone down to the cover's edge:
  // on a wide cover the width-based title size would push the subtitle off
  // the canvas, so the available height caps both sizes. The poster tilt
  // drops one end of the lettering below the zone, so the tilt drop and a
  // small bottom margin come off the available height too.
  const tiltDrop = (zw / 2) * Math.sin((Math.abs(state.tilt) * Math.PI) / 180);
  const available = height - zy - tiltDrop - height * 0.015;
  const subSize = Math.max(12, Math.min(width * 0.032, available * 0.14));
  let titleSize = Math.min(width * 0.115, (available - subSize * 1.6) / 1.15);
  titleSize = Math.max(titleSize, width * 0.04);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  while (title && ctx.measureText(title).width > zw && titleSize > width * 0.04) {
    titleSize *= 0.94;
    ctx.font = `${titleSize}px Anton, sans-serif`;
  }
  const blockH = titleSize * 1.15 + subSize * 1.6;

  // A dark band behind the lettering keeps it readable over any photo.
  const band = ctx.createLinearGradient(0, zy - titleSize * 0.25, 0, zy + blockH);
  band.addColorStop(0, 'rgba(0, 0, 0, 0)');
  band.addColorStop(0.35, 'rgba(0, 0, 0, 0.42)');
  band.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = band;
  ctx.fillRect(0, zy - titleSize * 0.25, width, blockH + titleSize * 0.25);

  const cx = zone.align === 'left' ? zx + zw / 2 : zx + zw / 2;
  const cy = zy + blockH / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((state.tilt * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.textAlign = zone.align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';
  const tx = zone.align === 'left' ? zx : zx + zw / 2;

  if (title) {
    ctx.font = `${titleSize}px Anton, sans-serif`;
    const top = zy + titleSize;
    if (state.fill === 'sunset') {
      const grad = ctx.createLinearGradient(0, zy, 0, top);
      grad.addColorStop(0, '#ffe259');
      grad.addColorStop(0.55, '#ff7a2f');
      grad.addColorStop(1, '#ff2fb3');
      ctx.fillStyle = grad;
      ctx.lineWidth = titleSize * 0.05;
      ctx.strokeStyle = 'rgba(20, 8, 24, 0.85)';
      ctx.strokeText(title, tx, top);
      ctx.fillText(title, tx, top);
    } else if (state.fill === 'neon') {
      ctx.shadowColor = '#ff2fb3';
      ctx.shadowBlur = titleSize * 0.32;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, tx, top);
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = titleSize * 0.12;
      ctx.fillText(title, tx, top);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = titleSize * 0.06;
      ctx.strokeStyle = 'rgba(20, 8, 24, 0.9)';
      ctx.strokeText(title, tx, top);
      ctx.fillText(title, tx, top);
    }
  }

  if (subtitle) {
    ctx.font = `500 ${subSize}px Oswald, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = subSize * 0.3;
    try {
      ctx.letterSpacing = `${Math.max(2, subSize * 0.18)}px`;
    } catch {
      // letterSpacing is Chrome-only; other browsers just skip it.
    }
    ctx.fillText(subtitle, tx, zy + titleSize * 1.15 + subSize * 1.2);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Ignore.
    }
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// Pixel rects for a layout at a given cover size, with the gutter inset.
export function panelRects(layout, width, height) {
  const gap = (GUTTER * width) / 1080;
  return layout.panels.map((p) => ({
    x: p.x * width + gap / 2,
    y: p.y * height + gap / 2,
    w: p.w * width - gap,
    h: p.h * height - gap,
  }));
}

// Which panel (if any) a point in cover pixels falls in.
export function panelAt(layout, px, py, width, height) {
  const rects = panelRects(layout, width, height);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}

// Draw the whole cover. `options.highlight` draws a selection outline around
// one panel (preview only — exports never pass it).
export function drawCover(ctx, state, width, height, options = {}) {
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const rects = panelRects(layout, width, height);
  rects.forEach((rect, i) => {
    const photoIndex = state.panelPhotos[i] ?? -1;
    const photo = photoIndex >= 0 ? state.photos[photoIndex] : undefined;
    const transform = state.transforms[i] ?? { zoom: 1, x: 0, y: 0 };
    if (photo && photo.img.complete && photo.img.naturalWidth > 0) {
      drawPhotoPanel(ctx, photo.img, rect, transform, grade.filter);
    } else {
      drawEmptyPanel(ctx, rect, i);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, width / 540);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  drawGradeOverlay(ctx, width, height, grade);
  drawCaption(ctx, state, width, height, layout);

  if (options.highlight !== undefined && options.highlight >= 0 && rects[options.highlight]) {
    const r = rects[options.highlight];
    ctx.strokeStyle = '#ff7a2f';
    ctx.lineWidth = Math.max(3, width / 270);
    ctx.setLineDash([width / 54, width / 108]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
  }
}

// Render the cover at an export size onto a fresh canvas.
export function exportCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), state, width, height);
  return canvas;
}
