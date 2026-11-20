// Screenshot scenes, driven by URL parameters.
//
//   ?shot=cover   the cover alone, edge to edge, at the scene's pixel size
//   ?shot=editor  the full editor with a sample photo loaded
//
// Extra parameters: photo (a sample name), caption (the title words),
// layout, grade, size (square | portrait | landscape). The scene sets
// window.__shotReady once the cover is painted, so a screenshot script
// knows when to capture.

const SHOT_PIXELS = {
  landscape: [1280, 720],
  square: [1024, 1024],
  portrait: [1024, 1280],
};

export async function runShotScene(query, api) {
  const shot = query.get('shot') ?? 'editor';
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size') ?? 'landscape';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const pixels = SHOT_PIXELS[size] ?? SHOT_PIXELS.landscape;
    api.setCanvasPixels(pixels[0], pixels[1]);
  }
  if (layout) api.setLayout(layout);
  if (grade) api.setGrade(grade);
  api.setSize(size);
  api.setCaption(caption);
  await api.loadSample(photo);
  await document.fonts.ready;
  api.render();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.__shotReady = true;
}
