// Vice Cover Studio — the editor: controls, live preview and PNG export.
// All state lives in one object; every control change repaints the preview
// canvas at once, so what you see is what the PNG will hold.

import { paintCover, panelCountFor, EXPORT_SIZES } from './cover.js';
import { shotPreset } from './shots.js';

const PREVIEW_LONG_SIDE = 560;

const studioState = {
  photo: null,
  photoName: 'boulevard.jpg',
  caption: 'SUNSET HEIST',
  layout: 'hero',
  grade: 'sunset',
  captionStyle: 'white',
  size: '1920x1080',
  crops: defaultCropsFor('hero'),
  activePanel: 0,
};

const $ = (id) => document.getElementById(id);
const previewCanvas = $('preview');

/** The default crop per panel for a layout: the hero panel favours the top
 * of the photo (faces) because it is wide and short; the rest stay centred. */
function defaultCropsFor(layout) {
  const centred = { px: 0, py: 0, zoom: 1 };
  if (layout === 'hero') {
    return [{ px: 0, py: 0.5, zoom: 1 }, { ...centred }, { ...centred }];
  }
  return [{ ...centred }, { ...centred }, { ...centred }];
}

/** When a bare cover shot is showing, its exact pixel size. */
let bareShot = null;

/** The export size for the current state key, as { width, height }. */
function currentExportSize() {
  const [width, height] = studioState.size.split('x').map(Number);
  return { width, height };
}

/** Paints the live preview from the current state. */
export function renderPreview() {
  if (bareShot) {
    // A bare cover shot fills the window exactly at the shot's pixel size.
    previewCanvas.width = bareShot.width;
    previewCanvas.height = bareShot.height;
    paintCover(previewCanvas, studioState);
    window.__coverReady = true;
    return;
  }
  const { width, height } = currentExportSize();
  const scale = PREVIEW_LONG_SIDE / Math.max(width, height);
  previewCanvas.width = Math.round(width * scale);
  previewCanvas.height = Math.round(height * scale);
  paintCover(previewCanvas, studioState);
  window.__coverReady = true;
}

/** Marks one button of a group pressed and the rest unpressed. */
function markPressed(group, value) {
  // dataset keys are camelCase: data-caption-style lives at dataset.captionStyle.
  const key = group.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  for (const button of document.querySelectorAll(`[data-${group}]`)) {
    const on = button.dataset[key] === value;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

/** Rebuilds the panel picker for the current layout's panel count. */
function refreshPanelPicker() {
  const picker = $('panelPicker');
  picker.innerHTML = '';
  const count = panelCountFor(studioState.layout);
  while (studioState.crops.length < count) studioState.crops.push({ px: 0, py: 0, zoom: 1 });
  if (studioState.activePanel >= count) studioState.activePanel = 0;
  for (let i = 0; i < count; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = `Panel ${i + 1}`;
    button.classList.toggle('active', i === studioState.activePanel);
    button.setAttribute('aria-pressed', i === studioState.activePanel ? 'true' : 'false');
    button.addEventListener('click', () => {
      studioState.activePanel = i;
      refreshPanelPicker();
      syncCropSliders();
    });
    picker.appendChild(button);
  }
}

/** Moves the crop sliders to the active panel's crop. */
function syncCropSliders() {
  const crop = studioState.crops[studioState.activePanel];
  $('panX').value = String(Math.round(crop.px * 100));
  $('panY').value = String(Math.round(crop.py * 100));
  $('zoom').value = String(Math.round(crop.zoom * 100));
  $('panXValue').textContent = $('panX').value;
  $('panYValue').textContent = $('panY').value;
  $('zoomValue').textContent = `${$('zoom').value}%`;
}

/** Loads a photo from a URL (a sample under app/ or an object URL). */
export function loadPhotoFromUrl(url, name) {
  window.__coverReady = false;
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`photo ${response.status}`);
      return response.blob();
    })
    .then((blob) => loadPhotoBlob(blob, name));
}

/** Loads a photo from a Blob (a sample fetch or an uploaded file). */
function loadPhotoBlob(blob, name) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      studioState.photo = image;
      studioState.photoName = name;
      $('photoName').textContent = name;
      renderPreview();
      resolve(image);
    };
    image.onerror = () => reject(new Error('photo did not load'));
    image.src = url;
  });
}

/** Loads a photo the user picked from their machine. */
function loadPhotoFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      studioState.photo = image;
      studioState.photoName = file.name;
      $('photoName').textContent = file.name;
      renderPreview();
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCoverPng() {
  const { width, height } = currentExportSize();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paintCover(canvas, studioState);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${studioState.size}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('downloadNote').textContent = `Saved vice-cover-${studioState.size}.png (${width} x ${height}).`;
  }, 'image/png');
}

/** Applies one of the screenshot presets, then loads its photo. */
function applyShot(shot) {
  studioState.caption = shot.caption;
  studioState.layout = shot.layout;
  studioState.grade = shot.grade;
  studioState.captionStyle = shot.captionStyle;
  studioState.size = shot.size;
  studioState.crops = defaultCropsFor(shot.layout);
  studioState.activePanel = 0;
  $('captionText').value = shot.caption;
  markPressed('layout', shot.layout);
  markPressed('grade', shot.grade);
  markPressed('caption-style', shot.captionStyle);
  markPressed('size', shot.size);
  refreshPanelPicker();
  syncCropSliders();
  return loadPhotoFromUrl(shot.photo, shot.photo.split('/').pop());
}

/** Wires every control in the editor to the state. */
function bindControls() {
  $('photoFile').addEventListener('change', (event) => {
    loadPhotoFromFile(event.target.files?.[0]);
  });
  $('sampleBoulevard').addEventListener('click', () => {
    loadPhotoFromUrl('samples/boulevard.jpg', 'boulevard.jpg').catch(() => {});
  });
  $('samplePier').addEventListener('click', () => {
    loadPhotoFromUrl('samples/pier.jpg', 'pier.jpg').catch(() => {});
  });
  $('captionText').addEventListener('input', (event) => {
    studioState.caption = event.target.value;
    renderPreview();
  });
  for (const button of document.querySelectorAll('[data-layout]')) {
    button.addEventListener('click', () => {
      studioState.layout = button.dataset.layout;
      studioState.crops = defaultCropsFor(studioState.layout);
      studioState.activePanel = 0;
      markPressed('layout', studioState.layout);
      refreshPanelPicker();
      syncCropSliders();
      renderPreview();
    });
  }
  for (const button of document.querySelectorAll('[data-grade]')) {
    button.addEventListener('click', () => {
      studioState.grade = button.dataset.grade;
      markPressed('grade', studioState.grade);
      renderPreview();
    });
  }
  for (const button of document.querySelectorAll('[data-caption-style]')) {
    button.addEventListener('click', () => {
      studioState.captionStyle = button.dataset.captionStyle;
      markPressed('caption-style', studioState.captionStyle);
      renderPreview();
    });
  }
  for (const button of document.querySelectorAll('[data-size]')) {
    button.addEventListener('click', () => {
      studioState.size = button.dataset.size;
      markPressed('size', studioState.size);
      renderPreview();
    });
  }
  const cropChanged = () => {
    const crop = studioState.crops[studioState.activePanel];
    crop.px = Number($('panX').value) / 100;
    crop.py = Number($('panY').value) / 100;
    crop.zoom = Number($('zoom').value) / 100;
    syncCropSliders();
    renderPreview();
  };
  $('panX').addEventListener('input', cropChanged);
  $('panY').addEventListener('input', cropChanged);
  $('zoom').addEventListener('input', cropChanged);
  $('exportPng').addEventListener('click', exportCoverPng);
}

/** Builds the export-size buttons from the sizes the painter knows. */
function buildSizeButtons() {
  const holder = $('sizeButtons');
  for (const size of EXPORT_SIZES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.size = `${size.width}x${size.height}`;
    button.textContent = `${size.label} ${size.width}x${size.height}`;
    holder.appendChild(button);
  }
}

function startEditor() {
  buildSizeButtons();
  bindControls();
  markPressed('layout', studioState.layout);
  markPressed('grade', studioState.grade);
  markPressed('caption-style', studioState.captionStyle);
  markPressed('size', studioState.size);
  refreshPanelPicker();
  syncCropSliders();
  const params = new URLSearchParams(window.location.search);
  const shot = shotPreset(params.get('shot'));
  const bare = params.get('bare') === '1';
  if (bare) document.body.classList.add('bare');
  if (bare && shot) bareShot = shot;
  const load = shot ? applyShot(shot) : loadPhotoFromUrl('samples/boulevard.jpg', 'boulevard.jpg');
  load.catch(() => renderPreview());
  // Never leave the render script waiting: if the photo stalls, the
  // preview still paints (with the fallback gradient) and reports ready.
  setTimeout(() => {
    if (!window.__coverReady) renderPreview();
  }, 5000);
}

startEditor();
