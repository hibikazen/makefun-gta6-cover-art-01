// Screenshot scenes for Sunset Cover Studio.
//
// Opening the app with ?shot=<name> applies a fixed preset (layout, grade,
// caption, size) and loads the built-in samples, so the screenshots are
// reproducible: the same scene always renders the same cover. The cover
// scenes also hide the editor chrome, so the shot is the cover alone.

export const SHOTS = {
  cover: {
    layout: 'heroLeft',
    grade: 'sunset',
    title: 'LEONIDA NIGHTS',
    subtitle: 'A Vice City Story',
    fill: 'sunset',
    tilt: -3,
    captionSize: 1,
    size: 'landscape',
    chrome: false,
  },
  editor: {
    layout: 'grid',
    grade: 'vice',
    title: 'NEON SHORE',
    subtitle: 'Downtown After Dark',
    fill: 'neon',
    tilt: -4,
    captionSize: 1,
    size: 'landscape',
    chrome: true,
  },
  square: {
    layout: 'centerStage',
    grade: 'golden',
    title: 'PIER PRESSURE',
    subtitle: 'Golden Hour Run',
    fill: 'solid',
    tilt: 2,
    captionSize: 1,
    size: 'square',
    chrome: false,
  },
  portrait: {
    layout: 'editorial',
    grade: 'retro',
    title: 'NIGHT SHIFT',
    subtitle: 'Ocean Drive, 2 AM',
    fill: 'sunset',
    tilt: -2,
    captionSize: 1,
    size: 'portrait',
    chrome: false,
  },
};

// The sample photos every scene loads, in order.
export const SHOT_SAMPLES = ['boulevard', 'pier'];

export function shotFromUrl() {
  const name = new URLSearchParams(window.location.search).get('shot');
  if (name && Object.hasOwn(SHOTS, name)) return { name, preset: SHOTS[name] };
  return null;
}
