// Sunset Cover Studio — the editor app.
//
// State lives in one object; every control mutates it and calls render(),
// which redraws the preview canvas with the shared cover renderer. Photos
// are read on the user's own machine and never leave it.

import { LAYOUTS, LAYOUT_ORDER, panelAt } from './layouts.js';
import { GRADES, GRADE_ORDER } from './grades.js';
import { SIZES, renderCover, renderExport } from './cover.js';
import { SHOTS, SHOT_SAMPLES, shotFromUrl } from './shots.js';

const state = {
  photos: [],
  layout: 'heroLeft',
  grade: 'sunset',
  title: 'LEONIDA NIGHTS',
  subtitle: 'A Vice City Story',
  fill: 'sunset',
  tilt: -3,
  captionSize: 1,
  size: 'landscape',
  panels: [],
  selected: 0,
};

const preview = document.getElementById('preview');
const stage = document.getElementById('stage');
let renderQueued = false;

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function fitPreviewCanvas() {
  const size = SIZES[state.size];
  const aspect = size.width / size.height;
  // Cover screenshot scenes fill the whole viewport; the editor fits its box.
  const fullBleed = document.body.classList.contains('shot-cover');
  const box = fullBleed
    ? { width: window.innerWidth, height: window.innerHeight }
    : stage.getBoundingClientRect();
  const maxW = fullBleed ? box.width : Math.min(920, box.width - 32);
  const maxH = fullBleed ? box.height : 720;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  preview.width = Math.round(w);
  preview.height = Math.round(h);
  preview.style.width = `${preview.width}px`;
  preview.style.height = `${preview.height}px`;
}

function render() {
  fitPreviewCanvas();
  renderCover(preview, state, state.photos);
  updatePanelControls();
}

function initPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  const kept = state.panels;
  state.panels = Array.from({ length: count }, (_, i) => {
    const previous = kept[i];
    return {
      photo: previous?.photo ?? i % Math.max(1, state.photos.length),
      zoom: previous?.zoom ?? 1,
      ox: previous?.ox ?? 0,
      oy: previous?.oy ?? 0,
    };
  });
  state.selected = Math.min(state.selected, count - 1);
}

function loadImage(src, label) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, label });
    img.onerror = () => reject(new Error(`Could not load ${label}`));
    img.src = src;
  });
}

async function loadSample(name) {
  try {
    const photo = await loadImage(`samples/${name}.jpg`, name);
    state.photos.push(photo);
    initPanels();
    queueRender();
    refreshPhotoChips();
  } catch {
    // A missing sample never breaks the editor; the gradient fallback draws.
  }
}

function addUploads(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('image/'));
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    loadImage(url, file.name.replace(/\.[^.]+$/, '')).then((photo) => {
      state.photos.push(photo);
      initPanels();
      queueRender();
      refreshPhotoChips();
    });
  });
}

function refreshPhotoChips() {
  const tray = document.getElementById('photo-tray');
  tray.replaceChildren();
  state.photos.forEach((photo, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'photo-chip';
    chip.textContent = photo.label;
    chip.title = `Use "${photo.label}" in the selected panel`;
    chip.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      queueRender();
    });
    tray.appendChild(chip);
  });
  if (state.photos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No photos yet — add your own or use a sample.';
    tray.appendChild(empty);
  }
}

function buildPicker(containerId, entries, current, onPick) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  entries.forEach(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick';
    button.dataset.pick = id;
    button.textContent = label;
    if (id === current) button.classList.add('active');
    button.addEventListener('click', () => {
      container.querySelectorAll('.pick').forEach((el) => el.classList.remove('active'));
      button.classList.add('active');
      onPick(id);
    });
    container.appendChild(button);
  });
}

function updatePanelControls() {
  const count = LAYOUTS[state.layout].panels.length;
  const list = document.getElementById('panel-list');
  list.replaceChildren();
  for (let i = 0; i < count; i += 1) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `panel-row${i === state.selected ? ' active' : ''}`;
    const slot = state.panels[i];
    const label = state.photos[slot?.photo]?.label ?? '—';
    row.textContent = `Panel ${i + 1} · ${label}`;
    row.addEventListener('click', () => {
      state.selected = i;
      updatePanelControls();
      queueRender();
    });
    list.appendChild(row);
  }
  const slot = state.panels[state.selected];
  if (!slot) return;
  document.getElementById('zoom').value = slot.zoom;
  document.getElementById('pan-x').value = slot.ox;
  document.getElementById('pan-y').value = slot.oy;
  document.getElementById('zoom-val').textContent = `${slot.zoom.toFixed(2)}×`;
}

function exportPng(sizeId) {
  const canvas = renderExport(state, state.photos, sizeId);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sunset-cover-${sizeId}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

// Rebuild the pickers and reset every control's value from the current
// state. Called once at startup and again after a ?shot= preset lands, so
// the buttons always show the layout, grade and caption actually in use.
function syncControls() {
  buildPicker(
    'layout-picker',
    LAYOUT_ORDER.map((id) => [id, LAYOUTS[id].name]),
    state.layout,
    (id) => {
      state.layout = id;
      initPanels();
      queueRender();
    },
  );
  buildPicker(
    'grade-picker',
    GRADE_ORDER.map((id) => [id, GRADES[id].name]),
    state.grade,
    (id) => {
      state.grade = id;
      queueRender();
    },
  );
  buildPicker(
    'fill-picker',
    [
      ['solid', 'Solid'],
      ['sunset', 'Sunset Fade'],
      ['neon', 'Neon Glow'],
    ],
    state.fill,
    (id) => {
      state.fill = id;
      queueRender();
    },
  );
  buildPicker(
    'size-picker',
    Object.entries(SIZES).map(([id, size]) => [id, size.label]),
    state.size,
    (id) => {
      state.size = id;
      queueRender();
    },
  );
  document.getElementById('caption-title').value = state.title;
  document.getElementById('caption-subtitle').value = state.subtitle;
  document.getElementById('tilt').value = state.tilt;
  document.getElementById('tilt-val').textContent = `${state.tilt}°`;
  document.getElementById('caption-size').value = state.captionSize;
}

function wireControls() {
  document.getElementById('upload').addEventListener('change', (event) => {
    addUploads(event.target.files);
    event.target.value = '';
  });
  document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
  document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));

  buildPicker(
    'layout-picker',
    LAYOUT_ORDER.map((id) => [id, LAYOUTS[id].name]),
    state.layout,
    (id) => {
      state.layout = id;
      initPanels();
      queueRender();
    },
  );
  buildPicker(
    'grade-picker',
    GRADE_ORDER.map((id) => [id, GRADES[id].name]),
    state.grade,
    (id) => {
      state.grade = id;
      queueRender();
    },
  );
  buildPicker(
    'fill-picker',
    [
      ['solid', 'Solid'],
      ['sunset', 'Sunset Fade'],
      ['neon', 'Neon Glow'],
    ],
    state.fill,
    (id) => {
      state.fill = id;
      queueRender();
    },
  );
  buildPicker(
    'size-picker',
    Object.entries(SIZES).map(([id, size]) => [id, size.label]),
    state.size,
    (id) => {
      state.size = id;
      queueRender();
    },
  );

  const titleInput = document.getElementById('caption-title');
  const subtitleInput = document.getElementById('caption-subtitle');
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value;
    queueRender();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    queueRender();
  });

  const tilt = document.getElementById('tilt');
  const tiltVal = document.getElementById('tilt-val');
  tilt.value = state.tilt;
  tiltVal.textContent = `${state.tilt}°`;
  tilt.addEventListener('input', () => {
    state.tilt = Number(tilt.value);
    tiltVal.textContent = `${state.tilt}°`;
    queueRender();
  });

  const captionSize = document.getElementById('caption-size');
  captionSize.value = state.captionSize;
  captionSize.addEventListener('input', () => {
    state.captionSize = Number(captionSize.value);
    queueRender();
  });

  document.getElementById('zoom').addEventListener('input', (event) => {
    state.panels[state.selected].zoom = Number(event.target.value);
    document.getElementById('zoom-val').textContent = `${Number(event.target.value).toFixed(2)}×`;
    queueRender();
  });
  document.getElementById('pan-x').addEventListener('input', (event) => {
    state.panels[state.selected].ox = Number(event.target.value);
    queueRender();
  });
  document.getElementById('pan-y').addEventListener('input', (event) => {
    state.panels[state.selected].oy = Number(event.target.value);
    queueRender();
  });

  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', () => exportPng(button.dataset.export));
  });

  preview.addEventListener('click', (event) => {
    const box = preview.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * preview.width;
    const py = ((event.clientY - box.top) / box.height) * preview.height;
    const hit = panelAt(state.layout, px, py, preview.width, preview.height);
    if (hit >= 0) {
      state.selected = hit;
      updatePanelControls();
    }
  });

  window.addEventListener('resize', queueRender);
}

async function applyShotMode() {
  const shot = shotFromUrl();
  if (!shot) return false;
  Object.assign(state, shot.preset);
  if (!shot.preset.chrome) document.body.classList.add('shot-cover');
  initPanels();
  await Promise.all(SHOT_SAMPLES.map((name) => loadSample(name)));
  // Spread the samples across the panels so a scene shows both photos.
  state.panels.forEach((slot, i) => {
    slot.photo = i % Math.max(1, state.photos.length);
  });
  document.title = `Sunset Cover Studio — ${shot.name}`;
  return true;
}

async function boot() {
  wireControls();
  initPanels();
  const inShot = await applyShotMode();
  if (!inShot) {
    // First visit: load both samples so the editor opens with art, not grey.
    await Promise.all([loadSample('boulevard'), loadSample('pier')]);
  }
  syncControls();
  render();
  try {
    await document.fonts.ready;
  } catch {
    // Fonts still render with fallbacks; the cover never blocks on them.
  }
  render();
  window.__shotReady = true;
}

boot();
