// Sunset Cover Studio — the editor. Wires the controls in index.html to the
// cover renderer: photos, layouts, grades, caption, per-panel crop, export.
import { drawCover, exportCover, panelAt, FILLS } from './cover.js';
import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { applyShotPreset, readShotParams } from './shots.js';

const state = {
  photos: [],
  panelPhotos: [],
  transforms: [],
  layoutId: 'grid',
  gradeId: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'LEONIDA · VICE CITY',
  fill: 'sunset',
  tilt: -4,
  selectedPanel: 0,
};

const aspect = { w: 1080, h: 1080 };
let coverMode = false;

const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photoInput');
const photoStrip = document.getElementById('photoStrip');
const layoutPicker = document.getElementById('layoutPicker');
const gradePicker = document.getElementById('gradePicker');
const fillPicker = document.getElementById('fillPicker');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const tiltRange = document.getElementById('tiltRange');
const tiltValue = document.getElementById('tiltValue');
const panelLabel = document.getElementById('panelLabel');
const zoomRange = document.getElementById('zoomRange');
const panXRange = document.getElementById('panXRange');
const panYRange = document.getElementById('panYRange');

function panelCount() {
  return layoutById(state.layoutId).panels.length;
}

function ensureTransforms() {
  while (state.transforms.length < panelCount()) {
    state.transforms.push({ zoom: 1, x: 0, y: 0 });
  }
  while (state.panelPhotos.length < panelCount()) {
    state.panelPhotos.push(-1);
  }
}

// Fill any unassigned panel with the next photo, round-robin.
function autoAssignPanels() {
  if (state.photos.length === 0) return;
  ensureTransforms();
  for (let i = 0; i < panelCount(); i += 1) {
    if (state.panelPhotos[i] === -1) state.panelPhotos[i] = i % state.photos.length;
  }
}

function redraw() {
  ensureTransforms();
  if (coverMode) {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    drawCover(ctx, state, canvas.width, canvas.height);
  } else {
    if (canvas.width !== aspect.w || canvas.height !== aspect.h) {
      canvas.width = aspect.w;
      canvas.height = aspect.h;
    }
    drawCover(ctx, state, canvas.width, canvas.height, { highlight: state.selectedPanel });
  }
}

function buildLayoutPicker() {
  layoutPicker.replaceChildren();
  for (const layout of LAYOUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = layout.name;
    button.dataset.layout = layout.id;
    const mini = document.createElement('span');
    mini.className = 'mini';
    for (const p of layout.panels) {
      const cell = document.createElement('i');
      cell.style.left = `${p.x * 100}%`;
      cell.style.top = `${p.y * 100}%`;
      cell.style.width = `${p.w * 100}%`;
      cell.style.height = `${p.h * 100}%`;
      mini.appendChild(cell);
    }
    const label = document.createElement('small');
    label.textContent = layout.name;
    button.append(mini, label);
    button.addEventListener('click', () => {
      state.layoutId = layout.id;
      state.selectedPanel = 0;
      syncPickers();
      syncPanelControls();
      redraw();
    });
    layoutPicker.appendChild(button);
  }
}

function buildGradePicker() {
  gradePicker.replaceChildren();
  for (const grade of GRADES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = grade.name;
    button.dataset.grade = grade.id;
    button.style.background = grade.swatch;
    button.setAttribute('aria-label', grade.name);
    button.addEventListener('click', () => {
      state.gradeId = grade.id;
      syncPickers();
      redraw();
    });
    gradePicker.appendChild(button);
  }
}

function buildFillPicker() {
  fillPicker.replaceChildren();
  for (const fill of FILLS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = fill.label;
    button.dataset.fill = fill.id;
    button.addEventListener('click', () => {
      state.fill = fill.id;
      syncPickers();
      redraw();
    });
    fillPicker.appendChild(button);
  }
}

function syncPickers() {
  for (const b of layoutPicker.querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.layout === state.layoutId);
  }
  for (const b of gradePicker.querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.grade === state.gradeId);
  }
  for (const b of fillPicker.querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.fill === state.fill);
  }
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  tiltRange.value = String(state.tilt);
  tiltValue.textContent = `${state.tilt}°`;
}

function syncPanelControls() {
  ensureTransforms();
  const t = state.transforms[state.selectedPanel] ?? { zoom: 1, x: 0, y: 0 };
  panelLabel.textContent = String(state.selectedPanel + 1);
  zoomRange.value = String(t.zoom);
  panXRange.value = String(t.x);
  panYRange.value = String(t.y);
  for (const b of photoStrip.querySelectorAll('button')) {
    const index = Number(b.dataset.photo);
    b.classList.toggle('active', state.panelPhotos[state.selectedPanel] === index);
  }
}

function rebuildPhotoStrip() {
  photoStrip.replaceChildren();
  state.photos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = photo.name;
    button.dataset.photo = String(index);
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    button.appendChild(thumb);
    button.addEventListener('click', () => {
      ensureTransforms();
      state.panelPhotos[state.selectedPanel] = index;
      syncPanelControls();
      redraw();
    });
    photoStrip.appendChild(button);
  });
  syncPanelControls();
}

function addPhoto(name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      state.photos.push({ name, img });
      autoAssignPanels();
      rebuildPhotoStrip();
      redraw();
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function loadSample(name) {
  return addPhoto(name, `samples/${name}.jpg`);
}

photoInput.addEventListener('change', async () => {
  for (const file of photoInput.files ?? []) {
    await addPhoto(file.name, URL.createObjectURL(file));
  }
  photoInput.value = '';
});

document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(layoutById(state.layoutId), px, py, canvas.width, canvas.height);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncPanelControls();
    redraw();
  }
});

titleInput.addEventListener('input', () => {
  state.title = titleInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});
tiltRange.addEventListener('input', () => {
  state.tilt = Number(tiltRange.value);
  tiltValue.textContent = `${state.tilt}°`;
  redraw();
});
zoomRange.addEventListener('input', () => {
  ensureTransforms();
  state.transforms[state.selectedPanel].zoom = Number(zoomRange.value);
  redraw();
});
panXRange.addEventListener('input', () => {
  ensureTransforms();
  state.transforms[state.selectedPanel].x = Number(panXRange.value);
  redraw();
});
panYRange.addEventListener('input', () => {
  ensureTransforms();
  state.transforms[state.selectedPanel].y = Number(panYRange.value);
  redraw();
});

for (const button of document.querySelectorAll('[data-export]')) {
  button.addEventListener('click', () => {
    const w = Number(button.dataset.w);
    const h = Number(button.dataset.h);
    aspect.w = w;
    aspect.h = h;
    redraw();
    exportCover(state, w, h).toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sunset-cover-${w}x${h}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }, 'image/png');
  });
}

window.addEventListener('resize', () => {
  if (coverMode) redraw();
});

// The caption fonts load after the first paint; redraw once they arrive so
// the preview and the exports use Anton and Oswald, not the fallback.
if (document.fonts?.ready) {
  document.fonts.ready.then(() => redraw());
}

// A handle for the functional test; harmless in the shipped app.
window.__sunsetStudio = { state, aspect, redraw };

buildLayoutPicker();
buildGradePicker();
buildFillPicker();

const params = readShotParams();
coverMode = applyShotPreset(state, params);
syncPickers();
syncPanelControls();
ensureTransforms();
redraw();

// The app opens with both sample photos loaded; a ?photo= shot preset puts
// the named sample first so panel 0 shows it.
const first = params.photo === 'pier' ? 'pier' : 'boulevard';
const second = first === 'pier' ? 'boulevard' : 'pier';
loadSample(first).then(() => loadSample(second));
