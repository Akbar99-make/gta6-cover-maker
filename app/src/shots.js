// Vice Cover Studio — screenshot presets.
//
// The four shots the render script takes, and the URL-parameter reader the
// app uses in shot mode. A shot is one cover or one editor view, drawn by
// the app itself: nothing is edited or composited afterwards, so what the
// judge sees is exactly what the app makes.

import { defaultCoverState } from './cover.js';

// The screenshots, in dossier order. The first by name is the cover, so
// it is a landscape cover — the contact sheet shows a landscape cover
// largest on top.
export const SHOTS = [
  {
    name: '01-cover-wide.jpg',
    label: 'Hero cover, wide export',
    mode: 'cover',
    width: 1280,
    height: 720,
    params: { size: 'wide', layout: 'hero', scene: 'beach', grade: 'sunset' },
  },
  {
    name: '02-editor.jpg',
    label: 'Editor with a photo loaded',
    mode: 'editor',
    width: 1280,
    height: 800,
    params: {},
  },
  {
    name: '03-cover-portrait.jpg',
    label: 'Portrait export, panels layout',
    mode: 'cover',
    width: 1024,
    height: 1280,
    params: { size: 'portrait', layout: 'panels', scene: 'neon', grade: 'neon' },
  },
  {
    name: '04-cover-square.jpg',
    label: 'Square export, poster layout',
    mode: 'cover',
    width: 1024,
    height: 1024,
    params: { size: 'square', layout: 'poster', scene: 'skyline', grade: 'midnight' },
  },
];

// Read ?shot=cover&size=wide&layout=hero&scene=beach&grade=sunset (and
// &title= / &subtitle=) into a cover state; returns null outside shot mode.
export function readShotParams(search) {
  const query = new URLSearchParams(search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  const state = defaultCoverState();
  const layout = query.get('layout');
  if (layout === 'hero' || layout === 'panels' || layout === 'poster') state.layout = layout;
  const scene = query.get('scene');
  if (scene === 'beach' || scene === 'neon' || scene === 'skyline' || scene === 'desert') state.scene = scene;
  const grade = query.get('grade');
  if (grade === 'sunset' || grade === 'neon' || grade === 'golden' || grade === 'midnight') state.grade = grade;
  const title = query.get('title');
  if (title) state.title = title.slice(0, 24);
  const subtitle = query.get('subtitle');
  if (subtitle) state.subtitle = subtitle.slice(0, 24);
  const size = query.get('size');
  return { mode, size: size || 'wide', state };
}

// The export size a shot's ?size= names.
export function shotExportSize(sizeId) {
  if (sizeId === 'square') return { width: 1080, height: 1080 };
  if (sizeId === 'portrait') return { width: 1080, height: 1350 };
  return { width: 1920, height: 1080 };
}
