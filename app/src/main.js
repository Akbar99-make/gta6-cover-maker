// Vice Cover Studio — the editor.
//
// Wires the preview canvas to the control panel: photo upload and the
// built-in demo portrait, scene / layout / grade pickers, caption editing,
// drag-to-pan and zoom on the photo, and PNG export in the three post
// sizes. In ?shot= mode it draws one cover or one editor view full-bleed
// for the screenshot script, with no editor chrome around a cover shot.

import { drawCover, renderCoverCanvas, waitForCoverFonts, defaultCoverState, LAYOUTS, GRADES, EXPORT_SIZES } from './cover.js';
import { SCENES, getDemoPhoto } from './scenes.js';
import { readShotParams, shotExportSize } from './shots.js';

const state = defaultCoverState();
let uploadedPhotos = [];
let activePhotoIndex = -1;
let redrawQueued = false;

const stage = document.getElementById('stage');
const stageCtx = stage.getContext('2d');

function queueRedraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    drawCover(stageCtx, state, stage.width, stage.height);
  });
}

function currentPhoto() {
  if (activePhotoIndex >= 0 && uploadedPhotos[activePhotoIndex]) return uploadedPhotos[activePhotoIndex];
  return null;
}

function refreshPhotoState() {
  const photo = currentPhoto();
  if (photo) {
    state.photoImage = photo.image;
    state.photoSource = 'upload';
  } else {
    state.photoImage = null;
    state.photoSource = 'demo';
  }
}

function fitStageToSize(size) {
  // Keep the preview canvas at the export aspect, capped for the screen.
  const maxW = 980;
  const maxH = 620;
  const scale = Math.min(maxW / size.width, maxH / size.height, 1);
  stage.width = Math.round(size.width * scale);
  stage.height = Math.round(size.height * scale);
  stage.style.aspectRatio = `${size.width} / ${size.height}`;
}

let exportSize = EXPORT_SIZES[2];

function setExportSize(sizeId) {
  exportSize = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[2];
  fitStageToSize(exportSize);
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.classList.toggle('active', button.dataset.size === exportSize.id);
  });
  queueRedraw();
}

function buildPicker(containerId, items, currentId, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = item.name;
    button.dataset.value = item.id;
    if (item.id === currentId) button.classList.add('active');
    button.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
      button.classList.add('active');
      onPick(item.id);
    });
    container.appendChild(button);
  }
}

function buildPhotoStrip() {
  const strip = document.getElementById('photo-strip');
  strip.innerHTML = '';
  const demoThumb = document.createElement('button');
  demoThumb.type = 'button';
  demoThumb.className = 'thumb' + (activePhotoIndex === -1 ? ' active' : '');
  demoThumb.textContent = 'Demo photo';
  demoThumb.addEventListener('click', () => {
    activePhotoIndex = -1;
    refreshPhotoState();
    buildPhotoStrip();
    queueRedraw();
  });
  strip.appendChild(demoThumb);
  uploadedPhotos.forEach((photo, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb' + (index === activePhotoIndex ? ' active' : '');
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => {
      activePhotoIndex = index;
      refreshPhotoState();
      buildPhotoStrip();
      queueRedraw();
    });
    strip.appendChild(thumb);
  });
}

function bindControls() {
  buildPicker('scene-picker', SCENES, state.scene, (id) => {
    state.scene = id;
    queueRedraw();
  });
  buildPicker('layout-picker', LAYOUTS, state.layout, (id) => {
    state.layout = id;
    queueRedraw();
  });
  buildPicker('grade-picker', GRADES, state.grade, (id) => {
    state.grade = id;
    queueRedraw();
  });

  const titleInput = document.getElementById('title-input');
  titleInput.value = state.title;
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value.toUpperCase().slice(0, 24) || 'VICE CITY';
    queueRedraw();
  });
  const subtitleInput = document.getElementById('subtitle-input');
  subtitleInput.value = state.subtitle;
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value.slice(0, 24) || 'Neon Shore';
    queueRedraw();
  });
  const titleSize = document.getElementById('title-size');
  titleSize.addEventListener('input', () => {
    state.titleScale = Number(titleSize.value);
    queueRedraw();
  });
  const zoom = document.getElementById('photo-zoom');
  zoom.addEventListener('input', () => {
    state.photoZoom = Number(zoom.value);
    queueRedraw();
  });

  document.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => setExportSize(button.dataset.size));
  });

  const upload = document.getElementById('photo-upload');
  upload.addEventListener('change', () => {
    for (const file of upload.files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        uploadedPhotos.push({ name: file.name, url, image });
        activePhotoIndex = uploadedPhotos.length - 1;
        refreshPhotoState();
        buildPhotoStrip();
        queueRedraw();
      };
      image.src = url;
    }
    upload.value = '';
  });

  document.getElementById('demo-photo').addEventListener('click', () => {
    activePhotoIndex = -1;
    refreshPhotoState();
    buildPhotoStrip();
    queueRedraw();
  });
  document.getElementById('shuffle-look').addEventListener('click', () => {
    const combos = [
      { layout: 'hero', scene: 'beach', grade: 'sunset' },
      { layout: 'panels', scene: 'neon', grade: 'neon' },
      { layout: 'poster', scene: 'skyline', grade: 'midnight' },
      { layout: 'hero', scene: 'desert', grade: 'golden' },
    ];
    const next = combos[(combos.findIndex((c) => c.layout === state.layout && c.scene === state.scene) + 1) % combos.length];
    state.layout = next.layout;
    state.scene = next.scene;
    state.grade = next.grade;
    bindControls();
    queueRedraw();
  });

  document.getElementById('export-png').addEventListener('click', exportCoverPng);

  // Drag on the preview to pan the photo inside its panel.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  stage.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const rect = stage.getBoundingClientRect();
    state.photoPanX += (event.clientX - lastX) / rect.width;
    state.photoPanY += (event.clientY - lastY) / rect.height;
    lastX = event.clientX;
    lastY = event.clientY;
    queueRedraw();
  });
  stage.addEventListener('pointerup', () => {
    dragging = false;
  });
  document.getElementById('reset-pan').addEventListener('click', () => {
    state.photoPanX = 0;
    state.photoPanY = 0;
    state.photoZoom = 1;
    document.getElementById('photo-zoom').value = '1';
    queueRedraw();
  });
}

function exportCoverPng() {
  const canvas = renderCoverCanvas(state, exportSize);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${exportSize.width}x${exportSize.height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    const note = document.getElementById('export-note');
    note.textContent = `Exported ${exportSize.width} × ${exportSize.height} PNG — check your downloads.`;
  }, 'image/png');
}

// Shot mode: the render script loads ?shot=cover or ?shot=editor and
// screenshots the page. A cover shot hides every control and draws the
// cover edge to edge; an editor shot shows the normal editor.
async function runShotMode(shot) {
  document.body.classList.add('shot-mode');
  if (shot.mode === 'cover') {
    document.getElementById('app').classList.add('cover-only');
    const size = shotExportSize(shot.size);
    const canvas = document.createElement('canvas');
    canvas.id = 'shot-canvas';
    canvas.width = size.width;
    canvas.height = size.height;
    document.getElementById('stage-wrap').appendChild(canvas);
    await waitForCoverFonts();
    Object.assign(state, shot.state);
    state.photoSource = 'demo';
    state.photoImage = null;
    getDemoPhoto();
    drawCover(canvas.getContext('2d'), state, size.width, size.height);
    document.title = 'vice-cover-shot-ready';
  } else {
    Object.assign(state, shot.state);
    bindControls();
    buildPhotoStrip();
    setExportSize('wide');
    await waitForCoverFonts();
    queueRedraw();
    document.title = 'vice-cover-shot-ready';
  }
}

function startEditor() {
  bindControls();
  buildPhotoStrip();
  setExportSize('wide');
  waitForCoverFonts().then(queueRedraw);
  queueRedraw();
}

const shot = readShotParams(window.location.search);
if (shot) {
  runShotMode(shot);
} else {
  startEditor();
}
