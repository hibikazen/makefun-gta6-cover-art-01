// Wires the editor: the photo library, layout and grade pickers, caption
// controls (text, gradient styles, tilt), per-panel crop (drag on the
// preview, or sliders), and one-click PNG export at all three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).

import { drawCover, exportCoverPNG, captionColors, CAPTION_STYLES, SIZES } from './cover.js';
import { LAYOUTS, panelsFor, panelContains } from './layouts.js';
import { GRADES } from './grades.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const SHOT = new URLSearchParams(location.search).get('shot');

const state = {
  sizeKey: 'wide',
  layoutKey: 'hero',
  gradeKey: 'sunset',
  photos: [],
  panels: [],
  caption: 'Sunset Heist',
  subcaption: 'Neon Coast Nights',
  captionSize: 1,
  captionColor: '#ffffff',
  captionStyle: 'sunset',
  captionTilt: true,
  captionPos: 'bottom',
  captionBand: true,
  halftone: false,
  posterize: false,
  grain: 0.5,
  vignette: true,
  gapFrac: 0.012,
};

let selectedPanel = 0;
let photoSeq = 0;
let currentPanels = [];
let renderQueued = false;

function defaultSlots(count) {
  const slots = [];
  for (let i = 0; i < count; i++) {
    const photo = state.photos[i % Math.max(1, state.photos.length)];
    slots.push({ photoId: photo ? photo.id : null, zoom: 1, panX: 0, panY: 0 });
  }
  return slots;
}

/** Keeps one crop slot per panel of the current layout, preserving crops. */
function syncSlots() {
  const count = (LAYOUTS[state.layoutKey] ?? LAYOUTS.grid).panels;
  const old = state.panels;
  state.panels = Array.from({ length: count }, (_, i) => old[i] ?? defaultSlots(count)[i]);
  selectedPanel = Math.min(selectedPanel, count - 1);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function addPhoto(img, name) {
  const photo = { id: `photo-${++photoSeq}`, name, img };
  state.photos.push(photo);
  return photo;
}

/** Sizes the preview canvas to the current post size at preview resolution. */
function sizePreviewCanvas() {
  if (SHOT === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return;
  }
  const size = SIZES[state.sizeKey] ?? SIZES.square;
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

/** Renders the cover into the preview canvas, plus the selection outline. */
function renderPreview() {
  renderQueued = false;
  sizePreviewCanvas();
  currentPanels = drawCover(canvas, state) ?? [];
  if (!SHOT) drawSelectionOutline();
  updatePanelControls();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderPreview);
}

function drawSelectionOutline() {
  const panel = currentPanels[selectedPanel];
  if (!panel) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  if (panel.poly) {
    ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
    for (let k = 1; k < panel.poly.length; k++) ctx.lineTo(panel.poly[k][0], panel.poly[k][1]);
    ctx.closePath();
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.stroke();
  ctx.restore();
}

function updatePanelControls() {
  const count = currentPanels.length;
  const hint = document.getElementById('panelHint');
  if (hint) hint.textContent = `Panel ${selectedPanel + 1} of ${count} — click the cover to pick a panel, drag to move the photo, scroll to zoom.`;
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  setSlider('zoom', slot.zoom);
  setSlider('panX', slot.panX);
  setSlider('panY', slot.panY);
  const zoomVal = document.getElementById('zoomVal');
  if (zoomVal) zoomVal.textContent = `${Math.round(slot.zoom * 100)}%`;
}

function setSlider(id, value) {
  const el = document.getElementById(id);
  if (el && document.activeElement !== el) el.value = value;
}

function selectPanel(index) {
  selectedPanel = index;
  renderPreview();
}

/** Assigns a photo to the selected panel, keeping its crop. */
function assignPhotoToSelected(photoId) {
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  slot.photoId = photoId;
  queueRender();
  renderPhotoList();
}

/** Fills every panel with the library's photos, round-robin. */
function fillAllPanels() {
  if (!state.photos.length) return;
  state.panels.forEach((slot, i) => {
    slot.photoId = state.photos[i % state.photos.length].id;
  });
  queueRender();
  renderPhotoList();
}

/** Shuffles the photo assignment and picks a random grade. */
function shuffleCover() {
  const keys = Object.keys(GRADES).filter((k) => k !== 'none');
  state.gradeKey = keys[Math.floor(Math.random() * keys.length)];
  fillAllPanels();
  renderGradeList();
  status.textContent = `Shuffled — grade: ${GRADES[state.gradeKey].name}.`;
}

// ---- Photo library ----

function renderPhotoList() {
  const list = document.getElementById('photoList');
  if (!list) return;
  list.innerHTML = '';
  const selectedId = state.panels[selectedPanel]?.photoId;
  for (const photo of state.photos) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `thumb${photo.id === selectedId ? ' selected' : ''}`;
    button.title = `${photo.name} — assign to panel ${selectedPanel + 1}`;
    button.setAttribute('aria-label', `Use ${photo.name} in panel ${selectedPanel + 1}`);
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    button.appendChild(img);
    button.addEventListener('click', () => assignPhotoToSelected(photo.id));
    list.appendChild(button);
  }
}

async function addUploadedPhotos(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
      added++;
    } catch {
      // A file that is not a readable image is skipped, the rest still load.
    }
  }
  if (!added) {
    status.textContent = 'No readable image in that drop.';
    return;
  }
  if (state.panels.every((s) => !s.photoId)) fillAllPanels();
  renderPhotoList();
  queueRender();
  status.textContent = `${added} photo${added > 1 ? 's' : ''} added — click one, then a panel.`;
}

// ---- Pickers built from the data ----

function miniDiagram(layoutKey) {
  const wrap = document.createElement('span');
  wrap.className = 'mini';
  const panels = panelsFor(layoutKey, 32, 20, 1.5);
  for (const panel of panels) {
    const cell = document.createElement('i');
    cell.style.left = `${Math.round(panel.x)}px`;
    cell.style.top = `${Math.round(panel.y)}px`;
    cell.style.width = `${Math.max(2, Math.round(panel.w))}px`;
    cell.style.height = `${Math.max(2, Math.round(panel.h))}px`;
    if (panel.inset) cell.style.background = '#ffd23f';
    wrap.appendChild(cell);
  }
  return wrap;
}

function renderLayoutList() {
  const list = document.getElementById('layoutList');
  if (!list) return;
  list.innerHTML = '';
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pick${key === state.layoutKey ? ' selected' : ''}`;
    button.appendChild(miniDiagram(key));
    const label = document.createElement('span');
    label.textContent = layout.name;
    button.appendChild(label);
    button.addEventListener('click', () => {
      state.layoutKey = key;
      syncSlots();
      renderLayoutList();
      renderPhotoList();
      queueRender();
    });
    list.appendChild(button);
  }
}

function renderGradeList() {
  const list = document.getElementById('gradeList');
  if (!list) return;
  list.innerHTML = '';
  for (const [key, grade] of Object.entries(GRADES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pick${key === state.gradeKey ? ' selected' : ''}`;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = grade.stops
      ? `linear-gradient(90deg, ${grade.stops.map(([, c]) => c).join(', ')})`
      : 'linear-gradient(90deg, #888, #ccc)';
    button.appendChild(swatch);
    const label = document.createElement('span');
    label.textContent = grade.name;
    button.appendChild(label);
    button.addEventListener('click', () => {
      state.gradeKey = key;
      renderGradeList();
      queueRender();
    });
    list.appendChild(button);
  }
}

function renderColorList() {
  const list = document.getElementById('colorList');
  if (!list) return;
  list.innerHTML = '';
  for (const color of captionColors()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `dot${color === state.captionColor ? ' selected' : ''}`;
    button.style.background = color;
    button.setAttribute('aria-label', `Caption colour ${color}`);
    button.addEventListener('click', () => {
      state.captionColor = color;
      renderColorList();
      queueRender();
    });
    list.appendChild(button);
  }
}

function renderSizeList() {
  const list = document.getElementById('sizeList');
  if (!list) return;
  list.innerHTML = '';
  for (const [key, size] of Object.entries(SIZES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pick${key === state.sizeKey ? ' selected' : ''}`;
    button.textContent = size.label;
    button.addEventListener('click', () => {
      state.sizeKey = key;
      renderSizeList();
      queueRender();
    });
    list.appendChild(button);
  }
}

// ---- Preview interaction: click to select, drag to pan, scroll to zoom ----

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function panelAt(point) {
  for (let i = currentPanels.length - 1; i >= 0; i--) {
    if (panelContains(currentPanels[i], point.x, point.y)) return i;
  }
  return -1;
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const index = panelAt(point);
  if (index === -1) return;
  selectPanel(index);
  drag = { x: point.x, y: point.y, panel: currentPanels[index] };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  slot.panX = clamp(slot.panX + ((point.x - drag.x) / drag.panel.w) * 2, -1, 1);
  slot.panY = clamp(slot.panY + ((point.y - drag.y) / drag.panel.h) * 2, -1, 1);
  drag.x = point.x;
  drag.y = point.y;
  queueRender();
});

canvas.addEventListener('pointerup', () => {
  drag = null;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  slot.zoom = clamp(slot.zoom * Math.exp(-event.deltaY * 0.0012), 1, 3);
  queueRender();
}, { passive: false });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ---- Controls ----

function bindControls() {
  const caption = document.getElementById('caption');
  caption.addEventListener('input', () => {
    state.caption = caption.value;
    queueRender();
  });
  const subcaption = document.getElementById('subcaption');
  subcaption.addEventListener('input', () => {
    state.subcaption = subcaption.value;
    queueRender();
  });
  const captionSize = document.getElementById('captionSize');
  captionSize.addEventListener('input', () => {
    state.captionSize = Number(captionSize.value);
    document.getElementById('captionSizeVal').textContent = `${Math.round(state.captionSize * 100)}%`;
    queueRender();
  });
  document.getElementById('captionPosTop').addEventListener('click', () => setCaptionPos('top'));
  document.getElementById('captionPosBottom').addEventListener('click', () => setCaptionPos('bottom'));
  for (const key of Object.keys(CAPTION_STYLES)) {
    const button = document.getElementById(`captionStyle${key[0].toUpperCase()}${key.slice(1)}`);
    if (button) button.addEventListener('click', () => setCaptionStyle(key));
  }
  document.getElementById('captionTilt').addEventListener('change', (e) => {
    state.captionTilt = e.target.checked;
    queueRender();
  });
  document.getElementById('captionBand').addEventListener('change', (e) => {
    state.captionBand = e.target.checked;
    queueRender();
  });
  document.getElementById('halftone').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    queueRender();
  });
  document.getElementById('posterize').addEventListener('change', (e) => {
    state.posterize = e.target.checked;
    queueRender();
  });
  document.getElementById('vignette').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    queueRender();
  });
  const grain = document.getElementById('grain');
  grain.addEventListener('input', () => {
    state.grain = Number(grain.value);
    document.getElementById('grainVal').textContent = `${Math.round(state.grain * 100)}%`;
    queueRender();
  });
  const gap = document.getElementById('gap');
  gap.addEventListener('input', () => {
    state.gapFrac = Number(gap.value);
    document.getElementById('gapVal').textContent = `${Math.round(state.gapFrac * 1000) / 10}%`;
    queueRender();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.zoom = Number(e.target.value);
    queueRender();
  });
  document.getElementById('panX').addEventListener('input', (e) => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.panX = Number(e.target.value);
    queueRender();
  });
  document.getElementById('panY').addEventListener('input', (e) => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.panY = Number(e.target.value);
    queueRender();
  });
  document.getElementById('photoInput').addEventListener('change', (e) => {
    addUploadedPhotos(e.target.files);
    e.target.value = '';
  });
  document.getElementById('fillAll').addEventListener('click', fillAllPanels);
  document.getElementById('shuffle').addEventListener('click', shuffleCover);
  document.getElementById('export').addEventListener('click', exportCurrentCover);

  const wrap = document.getElementById('coverWrap');
  wrap.addEventListener('dragover', (e) => {
    e.preventDefault();
    wrap.classList.add('dropping');
  });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('dropping'));
  wrap.addEventListener('drop', (e) => {
    e.preventDefault();
    wrap.classList.remove('dropping');
    addUploadedPhotos(e.dataTransfer.files);
  });
}

function setCaptionPos(pos) {
  state.captionPos = pos;
  document.getElementById('captionPosTop').classList.toggle('selected', pos === 'top');
  document.getElementById('captionPosBottom').classList.toggle('selected', pos === 'bottom');
  queueRender();
}

/** Switches the caption fill style (solid, sunset gradient, neon glow). */
function setCaptionStyle(style) {
  state.captionStyle = style;
  for (const key of Object.keys(CAPTION_STYLES)) {
    const button = document.getElementById(`captionStyle${key[0].toUpperCase()}${key.slice(1)}`);
    if (button) button.classList.toggle('selected', key === style);
  }
  queueRender();
}

/** Exports the current cover at the chosen post size as a PNG download. */
async function exportCurrentCover() {
  const size = SIZES[state.sizeKey] ?? SIZES.square;
  status.textContent = 'Rendering your cover…';
  const blob = await exportCoverPNG(state);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sunset-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  status.textContent = `Saved sunset-cover-${size.w}x${size.h}.png — post it anywhere.`;
}

/** Applies a screenshot scene: samples, layout, grade, caption, then renders. */
async function applyShot(config) {
  if (config.sizeKey) state.sizeKey = config.sizeKey;
  if (config.layoutKey) state.layoutKey = config.layoutKey;
  if (config.gradeKey) state.gradeKey = config.gradeKey;
  if (config.caption !== undefined) state.caption = config.caption;
  if (config.subcaption !== undefined) state.subcaption = config.subcaption;
  if (config.captionColor) state.captionColor = config.captionColor;
  if (config.captionStyle) state.captionStyle = config.captionStyle;
  if (config.captionTilt !== undefined) state.captionTilt = config.captionTilt;
  if (config.captionSize) state.captionSize = config.captionSize;
  if (config.captionPos) state.captionPos = config.captionPos;
  if (config.halftone !== undefined) state.halftone = config.halftone;
  if (config.posterize !== undefined) state.posterize = config.posterize;
  if (config.photos) {
    state.photos = [];
    for (const [name, url] of config.photos) {
      addPhoto(await loadImage(url), name);
    }
  }
  syncSlots();
  if (config.assignments) {
    config.assignments.forEach((photoIndex, panelIndex) => {
      const photo = state.photos[photoIndex];
      if (photo && state.panels[panelIndex]) state.panels[panelIndex].photoId = photo.id;
    });
  }
  if (config.crops) {
    config.crops.forEach((crop, panelIndex) => {
      if (state.panels[panelIndex]) Object.assign(state.panels[panelIndex], crop);
    });
  }
  const caption = document.getElementById('caption');
  if (caption) caption.value = state.caption;
  const subcaption = document.getElementById('subcaption');
  if (subcaption) subcaption.value = state.subcaption;
  renderLayoutList();
  renderGradeList();
  renderColorList();
  renderSizeList();
  renderPhotoList();
  setCaptionPos(state.captionPos);
  setCaptionStyle(state.captionStyle);
  const tilt = document.getElementById('captionTilt');
  if (tilt) tilt.checked = state.captionTilt;
  renderPreview();
}

/** Loads the two built-in samples and starts the editor with them. */
async function start() {
  bindControls();
  renderLayoutList();
  renderGradeList();
  renderColorList();
  renderSizeList();
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('600 40px Oswald');
  } catch {
    // The cover still draws with fallback fonts if a font fails to load.
  }
  if (SHOT) {
    await runShot(SHOT, new URLSearchParams(location.search), applyShot);
    return;
  }
  try {
    addPhoto(await loadImage('samples/pier.jpg'), 'Pier');
    addPhoto(await loadImage('samples/boulevard.jpg'), 'Boulevard');
  } catch {
    status.textContent = 'Samples did not load — add your own photo to begin.';
  }
  syncSlots();
  fillAllPanels();
  renderPhotoList();
  renderPreview();
  document.fonts.ready.then(() => queueRender());
}

start();
