// Sunset Cover Studio — the editor.
//
// Owns the app state (photos, per-panel crop, layout, grade, caption),
// wires every control in index.html, and paints the live preview through
// the cover renderer. Photos are read on the user's machine and never
// uploaded; the app works with no network request.

import { LAYOUTS, layoutById, panelCount } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { drawCover, exportCoverPng, panelIndexAt, PREVIEW_SIZES } from './cover.js';
import { runShotScene } from './shots.js';

const state = {
  photos: [],
  panels: [],
  layout: 'grid',
  grade: 'sunset',
  size: 'square',
  title: 'Sunset Heist',
  subtitle: 'Leonida Nights',
  fill: 'solid',
  tilt: 0,
  selected: 0,
};

const canvas = document.getElementById('coverCanvas');
const statusLine = document.getElementById('statusLine');
const photoStrip = document.getElementById('photoStrip');
const layoutPicker = document.getElementById('layoutPicker');
const gradePicker = document.getElementById('gradePicker');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const tiltRange = document.getElementById('tiltRange');
const tiltValue = document.getElementById('tiltValue');
const panelLabel = document.getElementById('panelLabel');
const panelPhoto = document.getElementById('panelPhoto');
const zoomRange = document.getElementById('zoomRange');
const zoomValue = document.getElementById('zoomValue');

let renderQueued = false;
let fontsReady = false;

function renderState() {
  return {
    photos: state.photos.map((entry) => entry.img),
    panels: state.panels,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    fill: state.fill,
    tilt: state.tilt,
  };
}

function render() {
  drawCover(canvas, renderState());
}

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function setStatus(message) {
  statusLine.textContent = message;
}

function resizePanels() {
  const count = panelCount(state.layout);
  while (state.panels.length < count) {
    state.panels.push({ photo: 0, zoom: 1, dx: 0, dy: 0 });
  }
  state.panels.length = count;
  state.selected = Math.min(state.selected, count - 1);
}

function setLayout(id) {
  state.layout = layoutById(id).id;
  resizePanels();
  document.querySelectorAll('.layout-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.layout === state.layout);
  });
  updatePanelControls();
}

function setGrade(id) {
  state.grade = gradeById(id).id;
  document.querySelectorAll('.grade-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.grade === state.grade);
  });
}

function setPreviewSize(sizeId) {
  state.size = sizeId in PREVIEW_SIZES ? sizeId : 'square';
  const dims = PREVIEW_SIZES[state.size];
  canvas.width = dims.w;
  canvas.height = dims.h;
  canvas.style.aspectRatio = `${dims.w} / ${dims.h}`;
  document.querySelectorAll('.size-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.size === state.size);
  });
}

async function loadImageFromUrl(url, name) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return { img, name, url };
}

async function addPhoto(url, name) {
  const existing = state.photos.findIndex((entry) => entry.url === url);
  if (existing !== -1) return existing;
  const entry = await loadImageFromUrl(url, name);
  state.photos.push(entry);
  refreshPhotoStrip();
  refreshPanelPhotoOptions();
  return state.photos.length - 1;
}

async function loadSamplePhoto(name) {
  const index = await addPhoto(`samples/${name}.jpg`, name);
  state.panels.forEach((panel) => {
    if (panel.photo >= state.photos.length) panel.photo = index;
  });
  return index;
}

function refreshPhotoStrip() {
  photoStrip.replaceChildren();
  state.photos.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = entry.name;
    button.classList.toggle('is-active', state.panels[state.selected]?.photo === index);
    const thumb = document.createElement('img');
    thumb.src = entry.url;
    thumb.alt = entry.name;
    button.appendChild(thumb);
    button.addEventListener('click', () => {
      state.panels[state.selected].photo = index;
      refreshPhotoStrip();
      refreshPanelPhotoOptions();
      requestRender();
    });
    photoStrip.appendChild(button);
  });
}

function refreshPanelPhotoOptions() {
  panelPhoto.replaceChildren();
  state.photos.forEach((entry, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `Photo ${index + 1} — ${entry.name}`;
    panelPhoto.appendChild(option);
  });
  panelPhoto.value = String(state.panels[state.selected]?.photo ?? 0);
}

function updatePanelControls() {
  const count = panelCount(state.layout);
  panelLabel.textContent = `Panel ${state.selected + 1} of ${count}`;
  const panel = state.panels[state.selected];
  if (panel) {
    panelPhoto.value = String(panel.photo);
    zoomRange.value = String(Math.round(panel.zoom * 100));
    zoomValue.textContent = `${Math.round(panel.zoom * 100)}%`;
  }
  refreshPhotoStrip();
}

function selectPanel(index) {
  if (index < 0 || index >= state.panels.length) return;
  state.selected = index;
  updatePanelControls();
  requestRender();
}

function buildLayoutPicker() {
  LAYOUTS.forEach((layout) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'layout-btn';
    button.dataset.layout = layout.id;
    const icon = document.createElement('span');
    icon.className = 'layout-icon';
    const [columns, rows] = layout.icon.split(' / ');
    icon.style.gridTemplateColumns = columns;
    icon.style.gridTemplateRows = rows;
    const cells = panelCount(layout.id);
    for (let i = 0; i < cells; i += 1) icon.appendChild(document.createElement('i'));
    button.appendChild(icon);
    button.appendChild(document.createTextNode(layout.name));
    button.addEventListener('click', () => {
      setLayout(layout.id);
      requestRender();
    });
    layoutPicker.appendChild(button);
  });
}

function buildGradePicker() {
  GRADES.forEach((grade) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-btn';
    button.dataset.grade = grade.id;
    const swatch = document.createElement('span');
    swatch.className = 'grade-swatch';
    swatch.style.background = grade.swatch;
    button.appendChild(swatch);
    button.appendChild(document.createTextNode(grade.name));
    button.addEventListener('click', () => {
      setGrade(grade.id);
      requestRender();
    });
    gradePicker.appendChild(button);
  });
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

function wireCanvasGestures() {
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelIndexAt(state.layout, canvas.width, canvas.height, point.x, point.y);
    if (hit === -1) return;
    selectPanel(hit);
    drag = { x: event.clientX, y: event.clientY, panel: state.panels[hit] };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const box = canvas.getBoundingClientRect();
    drag.panel.dx = clamp(drag.panel.dx + ((event.clientX - drag.x) / box.width) * 2, -1, 1);
    drag.panel.dy = clamp(drag.panel.dy + ((event.clientY - drag.y) / box.height) * 2, -1, 1);
    drag.x = event.clientX;
    drag.y = event.clientY;
    requestRender();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = clamp(panel.zoom * Math.exp(-event.deltaY * 0.0012), 1, 3);
    zoomRange.value = String(Math.round(panel.zoom * 100));
    zoomValue.textContent = `${Math.round(panel.zoom * 100)}%`;
    requestRender();
  }, { passive: false });
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

function wireControls() {
  document.getElementById('photoInput').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    for (const file of files) {
      const index = await addPhoto(URL.createObjectURL(file), file.name);
      state.panels[state.selected].photo = index;
    }
    refreshPhotoStrip();
    refreshPanelPhotoOptions();
    setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} added.`);
    requestRender();
    event.target.value = '';
  });

  document.querySelectorAll('[data-sample]').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = await loadSamplePhoto(button.dataset.sample);
      state.panels[state.selected].photo = index;
      refreshPhotoStrip();
      refreshPanelPhotoOptions();
      requestRender();
    });
  });

  document.querySelectorAll('.size-btn').forEach((button) => {
    button.addEventListener('click', () => {
      setPreviewSize(button.dataset.size);
      requestRender();
    });
  });

  titleInput.addEventListener('input', () => {
    state.title = titleInput.value;
    requestRender();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    requestRender();
  });
  document.querySelectorAll('input[name="fillStyle"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.fill = radio.value;
      requestRender();
    });
  });
  tiltRange.addEventListener('input', () => {
    state.tilt = Number(tiltRange.value);
    tiltValue.textContent = `${state.tilt}°`;
    requestRender();
  });

  panelPhoto.addEventListener('change', () => {
    state.panels[state.selected].photo = Number(panelPhoto.value);
    refreshPhotoStrip();
    requestRender();
  });
  zoomRange.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(zoomRange.value) / 100;
    zoomValue.textContent = `${zoomRange.value}%`;
    requestRender();
  });
  document.getElementById('resetPanel').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1;
    panel.dx = 0;
    panel.dy = 0;
    updatePanelControls();
    requestRender();
  });
  document.getElementById('fillAllPanels').addEventListener('click', () => {
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((panel) => { panel.photo = photo; });
    requestRender();
  });

  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', async () => {
      const sizeId = button.dataset.export;
      setStatus('Exporting…');
      try {
        const blob = await exportCoverPng(renderState(), sizeId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sunset-cover-${sizeId}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setStatus(`Exported sunset-cover-${sizeId}.png — share it.`);
      } catch (error) {
        setStatus('Export failed — please try again.');
      }
    });
  });
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('600 32px Oswald'),
      document.fonts.ready,
    ]);
  } catch {
    await document.fonts.ready.catch(() => {});
  }
  fontsReady = true;
}

async function init() {
  buildLayoutPicker();
  buildGradePicker();
  wireControls();
  wireCanvasGestures();
  resizePanels();
  setLayout(state.layout);
  setGrade(state.grade);
  setPreviewSize(state.size);
  updatePanelControls();
  await ensureFonts();
  await loadSamplePhoto('pier');
  await loadSamplePhoto('boulevard');
  state.panels.forEach((panel, index) => {
    panel.photo = index % state.photos.length;
  });
  updatePanelControls();
  render();

  const query = new URLSearchParams(window.location.search);
  if (query.has('shot')) {
    await runShotScene(query, {
      loadSample: (name) => loadSamplePhoto(name),
      setCaption: (title) => {
        state.title = title;
        titleInput.value = title;
      },
      setLayout: (id) => setLayout(id),
      setGrade: (id) => setGrade(id),
      setSize: (id) => { state.size = id; },
      setCanvasPixels: (w, h) => {
        canvas.width = w;
        canvas.height = h;
        canvas.style.aspectRatio = `${w} / ${h}`;
      },
      render: () => render(),
    });
    render();
  }
}

init();
