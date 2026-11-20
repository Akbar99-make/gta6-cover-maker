// shots.js — the four preset states the screenshot run uses, and the query
// string handling that lets a shot URL put the app in a chosen state.
// A shot URL looks like:
//   app/index.html?shot=cover&size=square&grade=sunset&title=VICE%20CITY
//     &subtitle=Sunset%20Heist&scenes=boulevard,neon,beach,skyline
// `shot=cover` hides the editor chrome and shows the cover full-bleed;
// `shot=editor` shows the whole editor with a photo loaded.

export const SHOT_PRESETS = {
  cover: {
    size: 'square',
    grade: 'sunset',
    captionStyle: 'gold',
    title: 'VICE CITY',
    subtitle: 'Sunset Heist',
    scenes: ['boulevard', 'neon', 'beach', 'skyline'],
    zooms: [1.08, 1.12, 1.08, 1.08],
  },
  editor: {
    size: 'square',
    grade: 'sunset',
    captionStyle: 'white',
    title: 'BOULEVARD QUEEN',
    subtitle: 'Vice City Nights',
    scenes: ['boulevard', 'neon', 'beach', 'skyline'],
    zooms: [1.08, 1.12, 1.08, 1.08],
  },
  portrait: {
    size: 'portrait',
    grade: 'neon',
    captionStyle: 'neon',
    title: 'NEON STRIP',
    subtitle: 'After Dark',
    scenes: ['neon', 'skyline', 'boulevard', 'beach'],
    zooms: [1.12, 1.08, 1.12, 1.08],
  },
  wide: {
    size: 'landscape',
    grade: 'vice',
    captionStyle: 'white',
    title: 'VICE CITY',
    subtitle: 'Golden Hour',
    scenes: ['skyline', 'boulevard', 'neon', 'beach'],
    zooms: [1.08, 1.12, 1.12, 1.08],
  },
};

export function defaultState() {
  return {
    size: 'square',
    grade: 'sunset',
    captionStyle: 'gold',
    title: 'VICE CITY',
    subtitle: 'Sunset Heist',
    panels: [
      { src: 'boulevard', zoom: 1.08, px: 0.5, py: 0.5 },
      { src: 'neon', zoom: 1.12, px: 0.5, py: 0.5 },
      { src: 'beach', zoom: 1.08, px: 0.5, py: 0.5 },
      { src: 'skyline', zoom: 1.08, px: 0.5, py: 0.5 },
    ],
    selectedPanel: 0,
  };
}

// Build a state from a preset plus any query overrides.
// `shot` is the display mode (cover = full-bleed cover, editor = full editor);
// `preset` picks the state preset (cover, editor, portrait, wide).
export function stateFromQuery(search) {
  const q = new URLSearchParams(search);
  const presetName = q.get('preset') || q.get('shot') || 'cover';
  const preset = SHOT_PRESETS[presetName] || SHOT_PRESETS.cover;
  const state = defaultState();
  state.size = q.get('size') || preset.size;
  state.grade = q.get('grade') || preset.grade;
  state.captionStyle = q.get('style') || preset.captionStyle;
  state.title = q.get('title') || preset.title;
  state.subtitle = q.get('subtitle') ?? preset.subtitle;
  const scenes = (q.get('scenes') || preset.scenes.join(',')).split(',');
  const zooms = preset.zooms || [1.08, 1.12, 1.08, 1.08];
  state.panels = scenes.slice(0, 4).map((name, i) => ({
    src: name.trim(),
    zoom: zooms[i] || 1.15,
    px: 0.5,
    py: 0.5,
  }));
  while (state.panels.length < 4) {
    state.panels.push({ src: 'boulevard', zoom: 1.15, px: 0.5, py: 0.5 });
  }
  return { state, shot: q.get('shot') || presetName };
}
