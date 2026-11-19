// Vice Cover Studio — the four screenshots the maker takes.
// Each shot names its file, its viewport, whether it shows a bare cover or
// the editor, and the cover preset it loads (photo, caption, layout, grade,
// caption style and export size). The render script walks this list; the
// editor reads ?shot=<id> to apply one preset on load.

export const COVER_SHOTS = [
  {
    id: 1,
    file: '1-cover.jpg',
    width: 1280,
    height: 720,
    kind: 'cover',
    photo: 'samples/boulevard.jpg',
    caption: 'SUNSET HEIST',
    layout: 'hero',
    grade: 'sunset',
    captionStyle: 'white',
    size: '1920x1080',
  },
  {
    id: 2,
    file: '2-editor.jpg',
    width: 1280,
    height: 1150,
    kind: 'editor',
    photo: 'samples/boulevard.jpg',
    caption: 'SUNSET HEIST',
    layout: 'hero',
    grade: 'sunset',
    captionStyle: 'white',
    size: '1080x1080',
  },
  {
    id: 3,
    file: '3-cover.jpg',
    width: 1024,
    height: 1280,
    kind: 'cover',
    photo: 'samples/pier.jpg',
    caption: 'NEON NIGHTS',
    layout: 'split',
    grade: 'neon',
    captionStyle: 'neon',
    size: '1080x1350',
  },
  {
    id: 4,
    file: '4-editor.jpg',
    width: 1280,
    height: 1150,
    kind: 'editor',
    photo: 'samples/pier.jpg',
    caption: 'NEON NIGHTS',
    layout: 'split',
    grade: 'noir',
    captionStyle: 'gold',
    size: '1080x1350',
  },
];

/** The shot with this id, or null. */
export function shotPreset(id) {
  const n = Number(id);
  return COVER_SHOTS.find((s) => s.id === n) ?? null;
}

/** A shot's export size as { width, height }. */
export function shotExportSize(shot) {
  const [width, height] = String(shot.size).split('x').map(Number);
  return { width, height };
}
