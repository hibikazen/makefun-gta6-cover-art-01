// Screenshot presets: the ?shot= URL parameters the maker uses to stage the
// screenshots (see shots.json). `shot=cover` shows the exported cover alone,
// full-viewport; `shot=editor` shows the editor with a photo loaded. The
// other parameters pick the photo, caption, layout, grade and caption fill.
import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';

export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot'),
    photo: q.get('photo'),
    caption: q.get('caption'),
    subtitle: q.get('subtitle'),
    layout: q.get('layout'),
    grade: q.get('grade'),
    fill: q.get('fill'),
  };
}

export function applyShotPreset(state, params) {
  if (params.layout && layoutById(params.layout).id === params.layout) {
    state.layoutId = params.layout;
  }
  if (params.grade && gradeById(params.grade).id === params.grade) {
    state.gradeId = params.grade;
  }
  if (params.fill === 'solid' || params.fill === 'sunset' || params.fill === 'neon') {
    state.fill = params.fill;
  }
  if (params.caption) state.title = params.caption;
  if (params.subtitle) state.subtitle = params.subtitle;
  const coverMode = params.shot === 'cover';
  if (coverMode) document.body.classList.add('shot-cover');
  return coverMode;
}
