// The cover renderer: draws the multi-panel cover onto any canvas.
//
// State it reads:
//   photos   loaded images, in the order the editor holds them
//   panels   one entry per layout panel: { photo, zoom, dx, dy }
//            photo is an index into photos; zoom 1..3; dx/dy pan in [-1, 1]
//   layout   layout id from layouts.js
//   grade    grade id from grades.js
//   title, subtitle, fill ('solid' | 'sunset' | 'neon'), tilt (degrees)
//
// drawCover paints at the canvas's own size, so the live preview and the
// full-size export share one code path; exportCoverPng renders offscreen
// and hands back a PNG blob.

import { panelRects } from './layouts.js';
import { gradeById } from './grades.js';

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 × 1080' },
};

export const PREVIEW_SIZES = {
  square: { w: 900, h: 900 },
  portrait: { w: 864, h: 1080 },
  landscape: { w: 1280, h: 720 },
};

const GUTTER_FILL = '#f5efe4';
const SCRIM_TOP = 'rgba(8, 4, 16, 0)';
const SCRIM_BOTTOM = 'rgba(8, 4, 16, 0.8)';

let grainTile = null;

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);

  ctx.save();
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = GUTTER_FILL;
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout);
  rects.forEach((rect, index) => {
    const panel = state.panels[index] ?? { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = state.photos[panel.photo] ?? state.photos[0];
    const px = rect.x * w;
    const py = rect.y * h;
    const pw = rect.w * w;
    const ph = rect.h * h;
    if (img && img.naturalWidth > 0) {
      drawPhotoPanel(ctx, img, px, py, pw, ph, panel, grade.filter);
    } else {
      drawPlaceholderPanel(ctx, px, py, pw, ph, index);
    }
  });

  drawGradeWash(ctx, w, h, grade);
  if (grade.halftone) drawHalftoneDots(ctx, w, h);
  if (grade.grain > 0) drawFilmGrain(ctx, w, h, grade.grain);
  if (grade.vignette > 0) drawVignette(ctx, w, h, grade.vignette);
  drawCaptionBlock(ctx, w, h, state);
  ctx.restore();
}

export function exportCoverPng(state, sizeId) {
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function panelIndexAt(layoutId, w, h, px, py) {
  const rects = panelRects(layoutId);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px >= r.x * w && px < (r.x + r.w) * w && py >= r.y * h && py < (r.y + r.h) * h) {
      return i;
    }
  }
  return -1;
}

function drawPhotoPanel(ctx, img, x, y, w, h, panel, filter) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = x - (dw - w) * (0.5 + panel.dx * 0.5);
  const oy = y - (dh - h) * (0.5 + panel.dy * 0.5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(img, ox, oy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

function drawPlaceholderPanel(ctx, x, y, w, h, index) {
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, index % 2 === 0 ? '#2b1055' : '#0b1e3a');
  sky.addColorStop(0.55, '#c86dd7');
  sky.addColorStop(1, '#ff7a18');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const sunR = Math.min(w, h) * 0.16;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.42, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 32, 0.55)';
  ctx.fillRect(x, y + h * 0.68, w, h * 0.32);
}

function drawGradeWash(ctx, w, h, grade) {
  if (!grade.tint || grade.tint.length === 0) return;
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.tint[0]);
  wash.addColorStop(1, grade.tint[grade.tint.length - 1]);
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawHalftoneDots(ctx, w, h) {
  const gap = Math.max(6, Math.round(w / 200));
  const radius = gap * 0.3;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(20, 10, 30, 0.22)';
  ctx.beginPath();
  for (let yy = gap / 2; yy < h; yy += gap) {
    for (let xx = gap / 2; xx < w; xx += gap) {
      ctx.moveTo(xx + radius, yy);
      ctx.arc(xx, yy, radius, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();
}

function drawFilmGrain(ctx, w, h, amount) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 160;
    grainTile.height = 160;
    const tileCtx = grainTile.getContext('2d');
    const data = tileCtx.createImageData(160, 160);
    for (let i = 0; i < data.data.length; i += 4) {
      const shade = 110 + Math.floor(Math.random() * 90);
      data.data[i] = shade;
      data.data[i + 1] = shade;
      data.data[i + 2] = shade;
      data.data[i + 3] = 255;
    }
    tileCtx.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = amount;
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVignette(ctx, w, h, amount) {
  const edge = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  );
  edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edge.addColorStop(1, `rgba(5, 2, 12, ${amount})`);
  ctx.save();
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitTitleSize(ctx, title, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (size > startSize * 0.4 && ctx.measureText(title).width > maxWidth) {
    size = Math.floor(size * 0.94);
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

function drawCaptionBlock(ctx, w, h, state) {
  const title = (state.title ?? '').trim();
  const subtitle = (state.subtitle ?? '').trim();
  if (!title && !subtitle) return;

  const scrim = ctx.createLinearGradient(0, h * 0.55, 0, h);
  scrim.addColorStop(0, SCRIM_TOP);
  scrim.addColorStop(1, SCRIM_BOTTOM);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  ctx.save();
  ctx.translate(w / 2, h * 0.9);
  ctx.rotate((state.tilt ?? 0) * (Math.PI / 180));
  ctx.translate(-w / 2, -h * 0.9);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const subSize = Math.max(18, Math.round(w * 0.03));
  const titleBaseline = h * 0.915;
  const subBaseline = h * 0.962;

  if (title) {
    const size = fitTitleSize(ctx, title, w * 0.9, Math.round(w * 0.115));
    ctx.font = `${size}px Anton, sans-serif`;
    if (state.fill === 'sunset') {
      const textW = ctx.measureText(title).width;
      const fade = ctx.createLinearGradient(w / 2 - textW / 2, 0, w / 2 + textW / 2, 0);
      fade.addColorStop(0, '#ffd166');
      fade.addColorStop(0.5, '#ff5e62');
      fade.addColorStop(1, '#c86dd7');
      ctx.lineWidth = Math.max(2, size * 0.03);
      ctx.strokeStyle = 'rgba(10, 5, 18, 0.9)';
      ctx.strokeText(title, w / 2, titleBaseline);
      ctx.fillStyle = fade;
      ctx.fillText(title, w / 2, titleBaseline);
    } else if (state.fill === 'neon') {
      ctx.lineWidth = Math.max(2, size * 0.025);
      ctx.strokeStyle = 'rgba(10, 5, 18, 0.85)';
      ctx.strokeText(title, w / 2, titleBaseline);
      ctx.shadowColor = '#ff2ea6';
      ctx.shadowBlur = size * 0.22;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, w / 2, titleBaseline);
      ctx.fillText(title, w / 2, titleBaseline);
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = size * 0.08;
      ctx.fillText(title, w / 2, titleBaseline);
      ctx.shadowBlur = 0;
    } else {
      ctx.lineWidth = Math.max(2, size * 0.055);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10, 5, 18, 0.88)';
      ctx.strokeText(title, w / 2, titleBaseline);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, w / 2, titleBaseline);
    }
  }

  if (subtitle) {
    ctx.font = `600 ${subSize}px Oswald, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.34em';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = Math.max(4, subSize * 0.3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(subtitle.toUpperCase(), w / 2, subBaseline);
    ctx.shadowBlur = 0;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  ctx.restore();
}
