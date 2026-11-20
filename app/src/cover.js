// Cover renderer for Sunset Cover Studio: draws panels, grades and the
// caption onto any canvas. The editor preview and the PNG export run the
// same code, so what you see is exactly what you share.

import { LAYOUTS, panelRect } from './layouts.js';
import { GRADES } from './grades.js';

export const SIZES = {
  square: { label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  landscape: { label: 'Landscape 1920 × 1080', width: 1920, height: 1080 },
};

// Draw one photo into a panel rect, cover-fit, with the panel's zoom and
// pan. Offsets run -0.5..0.5 and never uncover the panel's edges.
function drawPhotoCover(ctx, img, rect, panel) {
  const zoom = panel?.zoom ?? 1;
  const ox = panel?.ox ?? 0;
  const oy = panel?.oy ?? 0;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * Math.max(0, dw - rect.w);
  const dy = rect.y + (rect.h - dh) / 2 + oy * Math.max(0, dh - rect.h);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawTintWash(ctx, width, height, grade) {
  if (!grade.tint) return;
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, grade.tint.from);
  wash.addColorStop(1, grade.tint.to);
  ctx.save();
  ctx.globalCompositeOperation = grade.tint.composite;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawHalftoneDots(ctx, width, height) {
  const spacing = Math.max(7, Math.round(width / 170));
  const radius = spacing * 0.3;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let row = 0, y = spacing / 2; y < height; y += spacing, row += 1) {
    const offset = row % 2 === 0 ? 0 : spacing / 2;
    for (let x = spacing / 2 + offset; x < width; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, width, height, strength) {
  if (!strength) return;
  const cx = width / 2;
  const cy = height / 2;
  const inner = Math.min(width, height) * 0.42;
  const outer = Math.max(width, height) * 0.75;
  const shade = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, `rgba(0, 0, 0, ${(0.4 * strength).toFixed(3)})`);
  ctx.save();
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawCaptionScrim(ctx, width, cy, titlePx) {
  const bandH = titlePx * 2.4;
  const top = cy - bandH * 0.62;
  const scrim = ctx.createLinearGradient(0, top, 0, top + bandH);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(0.5, 'rgba(0, 0, 0, 0.42)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.fillStyle = scrim;
  ctx.fillRect(0, Math.max(0, top), width, bandH);
  ctx.restore();
}

function titleFill(ctx, title, cx, cy, titlePx, fill) {
  ctx.save();
  ctx.font = `${titlePx}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (fill === 'neon') {
    ctx.lineWidth = Math.max(2, titlePx * 0.02);
    ctx.strokeStyle = 'rgba(8, 18, 38, 0.9)';
    ctx.strokeText(title, cx, cy);
    ctx.shadowColor = '#00d5ff';
    ctx.shadowBlur = titlePx * 0.38;
    ctx.fillStyle = '#f2fbff';
    ctx.fillText(title, cx, cy);
    ctx.fillText(title, cx, cy);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = titlePx * 0.2;
    ctx.fillText(title, cx, cy);
  } else if (fill === 'sunset') {
    const fade = ctx.createLinearGradient(0, cy - titlePx * 0.55, 0, cy + titlePx * 0.55);
    fade.addColorStop(0, '#ffe259');
    fade.addColorStop(0.5, '#ff7e5f');
    fade.addColorStop(1, '#ff2975');
    ctx.lineWidth = Math.max(2, titlePx * 0.07);
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, cx, cy);
    ctx.fillStyle = fade;
    ctx.fillText(title, cx, cy);
  } else {
    ctx.lineWidth = Math.max(2, titlePx * 0.09);
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, cx, cy);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = titlePx * 0.12;
    ctx.shadowOffsetY = titlePx * 0.03;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, cy);
  }
  ctx.restore();
}

function drawCaption(ctx, width, height, layoutId, state) {
  const layout = LAYOUTS[layoutId];
  const zone = layout.caption;
  const maxWidth = zone.width * width;
  let titlePx = width * 0.115 * (state.captionSize ?? 1);
  ctx.save();
  ctx.font = `${titlePx}px Anton, 'Arial Black', sans-serif`;
  const measured = ctx.measureText(state.title || ' ').width;
  if (measured > maxWidth && measured > 0) titlePx *= maxWidth / measured;
  ctx.restore();

  // Keep the whole caption block — title plus subtitle — inside the frame,
  // whatever the layout's zone and the title size say.
  const subPx = Math.max(10, titlePx * 0.3);
  const cx = zone.x * width;
  let cy = zone.y * height;
  if (state.subtitle) {
    const blockBottom = cy + titlePx * 0.72 + subPx;
    const limit = height * 0.975;
    if (blockBottom > limit) cy -= blockBottom - limit;
  }

  drawCaptionScrim(ctx, width, cy, titlePx);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((state.tilt ?? 0) * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  titleFill(ctx, state.title || '', cx, cy, titlePx, state.fill || 'sunset');
  if (state.subtitle) {
    ctx.save();
    ctx.font = `500 ${subPx}px Oswald, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try {
      ctx.letterSpacing = `${Math.max(2, subPx * 0.22)}px`;
    } catch {
      // letterSpacing is Chrome-only; the subtitle still draws without it.
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(state.subtitle.toUpperCase(), cx, cy + titlePx * 0.72);
    ctx.restore();
  }
  ctx.restore();
}

// Render the whole cover onto a canvas that is already sized.
export function renderCover(canvas, state, photos) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gutter = Math.max(2, Math.round(width * 0.008));

  ctx.save();
  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, width, height);

  layout.panels.forEach((panel, i) => {
    const rect = panelRect(state.layout, i, width, height, gutter);
    const slot = state.panels?.[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = photos[slot.photo % Math.max(1, photos.length)];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo?.img) {
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, photo.img, rect, slot);
      ctx.filter = 'none';
    } else {
      const fallback = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      fallback.addColorStop(0, '#2b1055');
      fallback.addColorStop(0.55, '#7597de');
      fallback.addColorStop(1, '#ff7e5f');
      ctx.fillStyle = fallback;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });

  drawTintWash(ctx, width, height, grade);
  if (grade.dots) drawHalftoneDots(ctx, width, height);
  drawVignette(ctx, width, height, grade.vignette);
  drawCaption(ctx, width, height, state.layout, state);

  // Thin white poster frame.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, width * 0.005);
  ctx.strokeRect(
    width * 0.012,
    height * 0.012,
    width * 0.976,
    height * 0.976,
  );
  ctx.restore();
}

// Build an export canvas at the exact post size and draw the cover on it.
export function renderExport(state, photos, sizeId) {
  const size = SIZES[sizeId] ?? SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas, state, photos);
  return canvas;
}
