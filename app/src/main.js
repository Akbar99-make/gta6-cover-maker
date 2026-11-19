// Vice Cover Studio — editor wiring.
//
// State: three photo panels (each with its own image, zoom and pan), a layout,
// and a title + subtitle. The preview canvas redraws live on every change.
// Photos come from the machine (FileReader, never uploaded) or the two free
// sample photos under samples/. Export renders the same drawCover() onto an
// offscreen canvas at the exact post size and downloads the PNG.

import { blankPanel, drawCover, panelRects } from './cover.js';
import { markShotReady, parseShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const zoomLabel = document.getElementById('zoom-value');
const uploadInput = document.getElementById('upload');
const panelButtons = [...document.querySelectorAll('[data-panel]')];
const layoutButtons = [...document.querySelectorAll('[data-layout]')];
const gradeButtons = [...document.querySelectorAll('[data-grade]')];
const captionButtons = [...document.querySelectorAll('[data-caption]')];
const sizeButtons = [...document.querySelectorAll('[data-size]')];
const exportButtons = [...document.querySelectorAll('[data-export]')];

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const state = {
  layout: 'multi',
  title: 'Sunset Heist',
  subtitle: 'Vice City • One Last Score',
  grade: 'sunset',
  caption: 'classic',
  previewSize: 'square',
  selected: 0,
  panels: [null, null, null],
};

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function currentPanels() {
  return state.panels.map((p) => p || blankPanel(null));
}

function applyPreviewSize() {
  const { w, h } = SIZES[state.previewSize];
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w} / ${h}`;
}

function redraw() {
  applyPreviewSize();
  drawCover(canvas, {
    layout: state.layout,
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    caption: state.caption,
    panels: currentPanels(),
  });
  refreshPanelUI();
}

function refreshPanelUI() {
  const panel = state.panels[state.selected];
  zoomInput.value = panel ? String(Math.round(panel.zoom * 100)) : '100';
  zoomLabel.textContent = `${zoomInput.value}%`;
  panelButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === state.selected);
    btn.textContent = `Panel ${i + 1}${state.panels[i] ? ' ✓' : ''}`;
  });
  layoutButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.layout === state.layout));
  gradeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.grade === state.grade));
  captionButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.caption === state.caption));
  sizeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.size === state.previewSize));
}

function setStatus(text) {
  status.textContent = text;
}

async function setPanelPhoto(index, img) {
  state.panels[index] = blankPanel(img);
  state.selected = index;
  redraw();
}

async function loadSample(name, index) {
  const img = await loadImage(`samples/${name}.jpg`);
  await setPanelPhoto(index, img);
}

/** Renders the cover at an exact size and returns its PNG blob. */
export async function exportPng(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, {
    layout: state.layout,
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    caption: state.caption,
    panels: currentPanels(),
  });
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

// --- controls ---------------------------------------------------------------

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subtitle = subInput.value; redraw(); });

layoutButtons.forEach((btn) => btn.addEventListener('click', () => {
  state.layout = btn.dataset.layout;
  redraw();
}));

gradeButtons.forEach((btn) => btn.addEventListener('click', () => {
  state.grade = btn.dataset.grade;
  redraw();
}));

captionButtons.forEach((btn) => btn.addEventListener('click', () => {
  state.caption = btn.dataset.caption;
  redraw();
}));

sizeButtons.forEach((btn) => btn.addEventListener('click', () => {
  state.previewSize = btn.dataset.size;
  redraw();
}));

panelButtons.forEach((btn, i) => btn.addEventListener('click', () => {
  state.selected = i;
  refreshPanelUI();
}));

document.getElementById('sample-boulevard').addEventListener('click', async () => {
  try { await loadSample('boulevard', state.selected); setStatus('Boulevard photo loaded into the selected panel.'); }
  catch { setStatus('Could not load the boulevard sample.'); }
});
document.getElementById('sample-pier').addEventListener('click', async () => {
  try { await loadSample('pier', state.selected); setStatus('Pier photo loaded into the selected panel.'); }
  catch { setStatus('Could not load the pier sample.'); }
});
document.getElementById('upload-btn').addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;
  // FileReader: the photo is read on this machine and never uploaded anywhere.
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    const img = await loadImage(dataUrl);
    await setPanelPhoto(state.selected, img);
    setStatus(`Loaded “${file.name}” into the selected panel.`);
  } catch { setStatus('That file could not be read as an image.'); }
  uploadInput.value = '';
});
document.getElementById('fill-all').addEventListener('click', () => {
  const src = state.panels[state.selected];
  if (!src) { setStatus('Load a photo into the selected panel first.'); return; }
  state.panels = state.panels.map(() => blankPanel(src.img));
  redraw();
  setStatus('Same photo in every panel — drag each one to frame it differently.');
});
document.getElementById('reset-panel').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (panel) { panel.zoom = 1; panel.ox = 0; panel.oy = 0; }
  redraw();
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (panel) { panel.zoom = Number(zoomInput.value) / 100; redraw(); }
  else zoomLabel.textContent = `${zoomInput.value}%`;
});

// Drag on the preview to pan the photo inside the panel under the pointer.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = panelRects(canvas.width, canvas.height, state.layout);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit === -1) return;
  state.selected = hit;
  const panel = state.panels[hit];
  drag = { panel, startX: p.x, startY: p.y, ox: panel ? panel.ox : 0, oy: panel ? panel.oy : 0, rect: rects[hit] };
  canvas.setPointerCapture(e.pointerId);
  refreshPanelUI();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || !drag.panel) return;
  const p = canvasPoint(e);
  drag.panel.ox = drag.ox + (p.x - drag.startX) / drag.rect.w;
  drag.panel.oy = drag.oy + (p.y - drag.startY) / drag.rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

exportButtons.forEach((btn) => btn.addEventListener('click', async () => {
  const key = btn.dataset.export;
  setStatus(`Rendering ${SIZES[key].label}…`);
  const blob = await exportPng(key);
  if (!blob) { setStatus('Export failed — try again.'); return; }
  downloadBlob(blob, `vice-cover-${SIZES[key].w}x${SIZES[key].h}.png`);
  setStatus(`Saved vice-cover-${SIZES[key].w}x${SIZES[key].h}.png`);
}));

// Test hook: the page's state and exporter, used by the build's own checks.
window.__vice = { state, exportPng, redraw };

// --- start ------------------------------------------------------------------

async function boot() {
  const query = new URLSearchParams(location.search);
  if (query.has('shot')) {
    const shot = parseShot(query);
    document.body.classList.add(shot.mode === 'cover' ? 'shot-cover' : 'shot-editor');
    state.layout = shot.layout;
    state.title = shot.title;
    state.subtitle = shot.sub;
    state.grade = shot.grade;
    state.caption = shot.caption;
    titleInput.value = shot.title;
    subInput.value = shot.sub;
    state.previewSize = 'square';
    if (shot.w && shot.h) {
      canvas.width = shot.w;
      canvas.height = shot.h;
      canvas.style.aspectRatio = `${shot.w} / ${shot.h}`;
    }
    for (let i = 0; i < shot.photos.length; i += 1) {
      try {
        const panel = blankPanel(await loadImage(`samples/${shot.photos[i]}.jpg`));
        [panel.ox, panel.oy] = shot.offsets[i];
        state.panels[i] = panel;
      } catch { /* leave empty */ }
    }
    // In shot mode the preview canvas keeps the requested pixel size.
    canvas.width = shot.w || canvas.width;
    canvas.height = shot.h || canvas.height;
    drawCover(canvas, { layout: state.layout, title: state.title, subtitle: state.subtitle, grade: state.grade, caption: state.caption, panels: currentPanels() });
    refreshPanelUI();
    markShotReady();
    return;
  }
  // Normal use: start with the pier photo in the hero panel.
  try { state.panels[0] = blankPanel(await loadImage('samples/pier.jpg')); } catch { /* empty hero */ }
  try { state.panels[1] = blankPanel(await loadImage('samples/boulevard.jpg')); } catch { /* empty */ }
  redraw();
}

boot();
