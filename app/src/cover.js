// Renders the cover onto a canvas: sunset backdrop, graded photo panels,
// grain, vignette, frame and the bold caption. One function draws both the
// live preview and the exported PNG, at whatever size the canvas holds.

import { panelsFor } from './layouts.js';
import { GRADES, buildGradeLUT, applyGradeToPixels, applyHalftone } from './grades.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

const CAPTION_COLORS = ['#ffffff', '#ffd23f', '#ff5da2', '#59f7ff', '#7dff9a', '#1a0b2e'];

/** The caption colours the editor offers, in swatch order. */
export function captionColors() {
  return CAPTION_COLORS;
}

let noiseCanvas = null;

/** A tileable film-grain pattern, built once and reused for every render. */
function grainPattern(ctx) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 256;
    noiseCanvas.height = 256;
    const nctx = noiseCanvas.getContext('2d');
    const img = nctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }
  return ctx.createPattern(noiseCanvas, 'repeat');
}

/** The sunset backdrop the panel gaps show through. */
function drawSunsetBackdrop(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#150826');
  g.addColorStop(0.42, '#4a1d6b');
  g.addColorStop(0.72, '#c33a6e');
  g.addColorStop(1, '#ff7e3d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.55);
  sun.addColorStop(0, 'rgba(255, 190, 80, 0.5)');
  sun.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Renders one panel's photo into an offscreen canvas at the panel's pixel
 * size: cover-fit with the panel's zoom and pan, then the grade, posterize
 * and halftone. Returns null when the panel has no photo yet.
 */
function renderPanel(panel, slot, photos, gradeLut, gradeStrength, opts) {
  const img = slot && photos.get(slot.photoId);
  const pw = Math.max(1, Math.round(panel.w));
  const ph = Math.max(1, Math.round(panel.h));
  const off = document.createElement('canvas');
  off.width = pw;
  off.height = ph;
  const octx = off.getContext('2d');
  if (!img) {
    octx.fillStyle = '#241338';
    octx.fillRect(0, 0, pw, ph);
    octx.fillStyle = 'rgba(255,255,255,0.35)';
    octx.font = `${Math.round(ph * 0.09)}px Oswald, sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText('ADD A PHOTO', pw / 2, ph / 2);
    return off;
  }
  const zoom = slot.zoom ?? 1;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (pw - dw) / 2 + (slot.panX ?? 0) * Math.max(0, (dw - pw) / 2);
  const dy = (ph - dh) / 2 + (slot.panY ?? 0) * Math.max(0, (dh - ph) / 2);
  octx.drawImage(img, dx, dy, dw, dh);
  if (gradeLut || opts.posterize) {
    const imgData = octx.getImageData(0, 0, pw, ph);
    applyGradeToPixels(imgData.data, gradeLut, gradeStrength, opts.posterize ? 5 : 0);
    octx.putImageData(imgData, 0, 0);
    if (opts.halftone) applyHalftone(octx, imgData.data, pw, ph, Math.max(7, Math.round(pw / 110)));
  } else if (opts.halftone) {
    const imgData = octx.getImageData(0, 0, pw, ph);
    applyHalftone(octx, imgData.data, pw, ph, Math.max(7, Math.round(pw / 110)));
  }
  return off;
}

/** Wraps the caption into at most two lines that fit maxWidth at fontSize. */
function wrapCaption(ctx, text, maxWidth, fontSize) {
  ctx.font = `${fontSize}px Anton, sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the bold caption (and sub-caption) over the finished cover. */
function drawCaption(ctx, w, h, state) {
  const text = (state.caption ?? '').trim().toUpperCase();
  const sub = (state.subcaption ?? '').trim().toUpperCase();
  if (!text && !sub) return;
  const maxWidth = w * 0.9;
  let size = h * 0.085 * (state.captionSize ?? 1);
  let lines = [];
  if (text) {
    lines = wrapCaption(ctx, text, maxWidth, size);
    while (lines.length > 2 && size > 24) {
      size *= 0.92;
      lines = wrapCaption(ctx, text, maxWidth, size);
    }
  }
  const lineH = size * 1.04;
  const subSize = Math.round(size * 0.3);
  const blockH = lines.length * lineH + (sub ? subSize * 1.9 : 0);
  const pad = h * 0.045;
  const top = state.captionPos === 'top';
  const bandY = top ? pad * 0.5 : h - pad * 0.5 - blockH - size * 0.35;
  if (state.captionBand) {
    ctx.fillStyle = 'rgba(12, 3, 24, 0.55)';
    ctx.fillRect(0, bandY, w, blockH + size * 0.35);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const color = state.captionColor ?? '#ffffff';
  const firstBaseline = top ? bandY + size * 1.15 : h - pad - (lines.length - 1) * lineH;
  if (sub) {
    ctx.font = `600 ${subSize}px Oswald, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.35)}px`;
    } catch {
      // letterSpacing is Chrome-only; the caption still draws without it.
    }
    ctx.fillStyle = '#ffe9a8';
    // Clear of the main caption's outline and shadow on both sides.
    const subY = top
      ? firstBaseline + (lines.length - 1) * lineH + size * 0.22 + subSize * 0.72
      : firstBaseline - size * 0.94;
    ctx.fillText(sub, w / 2, subY);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // See above.
    }
  }
  if (!text) return;
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.045;
  lines.forEach((line, i) => {
    const y = firstBaseline + i * lineH;
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = color;
    ctx.fillText(line, w / 2, y);
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draws the whole cover onto `canvas` at the canvas's own size, from `state`:
 * backdrop, panels, grain, vignette, frame and caption. The same path draws
 * the live preview and the exported PNG.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const gap = Math.max(2, Math.round(w * (state.gapFrac ?? 0.012)));
  const grade = GRADES[state.gradeKey] ?? GRADES.sunset;
  const lut = buildGradeLUT(state.gradeKey);
  const panels = panelsFor(state.layoutKey, w, h, gap);
  const photos = new Map((state.photos ?? []).map((p) => [p.id, p.img]));

  drawSunsetBackdrop(ctx, w, h);
  panels.forEach((panel, i) => {
    const slot = (state.panels ?? [])[i];
    const off = renderPanel(panel, slot, photos, lut, grade.strength, state);
    if (!off) return;
    ctx.save();
    ctx.beginPath();
    if (panel.poly) {
      ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
      for (let k = 1; k < panel.poly.length; k++) ctx.lineTo(panel.poly[k][0], panel.poly[k][1]);
      ctx.closePath();
    } else {
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
    }
    ctx.clip();
    ctx.drawImage(off, panel.x, panel.y, panel.w, panel.h);
    ctx.restore();
    if (panel.inset) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    } else {
      ctx.strokeStyle = 'rgba(10, 2, 20, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(panel.x + 0.5, panel.y + 0.5, panel.w - 1, panel.h - 1);
    }
  });

  if ((state.grain ?? 0.5) > 0) {
    ctx.save();
    ctx.globalAlpha = 0.06 + (state.grain ?? 0.5) * 0.14;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(8, 2, 16, 0)');
    v.addColorStop(1, 'rgba(8, 2, 16, 0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  const inset = Math.max(6, w * 0.008);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  drawCaption(ctx, w, h, state);
  return panels;
}

/** Renders the cover at full export size and returns the canvas. */
export function renderCoverToCanvas(state) {
  const size = SIZES[state.sizeKey] ?? SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}

/** Renders the cover at full export size and returns it as a PNG blob. */
export function exportCoverPNG(state) {
  return new Promise((resolve) => {
    renderCoverToCanvas(state).toBlob(resolve, 'image/png');
  });
}
