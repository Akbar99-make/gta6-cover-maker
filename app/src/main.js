// main.js — Vice Cover Studio editor wiring.
// State, live preview, panel picking, uploads, grades, caption styles and PNG
// export. The preview canvas and the exported PNG are painted by the same
// drawCover, so the export is exactly what the preview shows.

import { drawCover, exportCoverCanvas, SIZES, GRADES, CAPTION_STYLES, PANEL_NAMES, panelRects } from './cover.js';
import { SCENES, SCENE_LABELS, paintScene } from './scenes.js';
import { defaultState, stateFromQuery } from './shots.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');

let state;
if (shotMode) {
  ({ state } = stateFromQuery(location.search));
} else {
  state = defaultState();
}

const preview = $('preview');
const statusEl = $('status');

function showStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function render() {
  drawCover(preview, state);
  drawSelection();
  syncControls();
}

// Outline the selected panel on the preview only (exports use a fresh canvas).
function drawSelection() {
  if (shotMode === 'cover') return;
  const rects = panelRects(state.size);
  const [fx, fy, fw, fh] = rects[state.selectedPanel] || rects[0];
  const ctx = preview.getContext('2d');
  const x = fx * preview.width, y = fy * preview.height;
  const w = fw * preview.width, h = fh * preview.height;
  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = Math.max(3, preview.width * 0.004);
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.setLineDash([]);
  ctx.fillStyle = '#00e5ff';
  ctx.font = `700 ${Math.max(16, preview.width * 0.016)}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(PANEL_NAMES[state.selectedPanel] || '', x + 12, y + 10);
  ctx.restore();
}

function syncControls() {
  const panel = state.panels[state.selectedPanel];
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === state.captionStyle));
  document.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', Number(b.dataset.panel) === state.selectedPanel));
  document.querySelectorAll('[data-scene]').forEach((b) => b.classList.toggle('active', b.dataset.scene === panel.src));
  if ($('titleInput')) $('titleInput').value = state.title;
  if ($('subtitleInput')) $('subtitleInput').value = state.subtitle;
  if ($('zoomRange')) $('zoomRange').value = panel.zoom;
  if ($('panXRange')) $('panXRange').value = panel.px;
  if ($('panYRange')) $('panYRange').value = panel.py;
  if ($('zoomVal')) $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  if ($('panelLabel')) $('panelLabel').textContent = `Panel ${state.selectedPanel + 1} · ${PANEL_NAMES[state.selectedPanel]}`;
}

function buildSceneButtons() {
  const wrap = $('scenePicker');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const name of SCENES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scene-btn';
    btn.dataset.scene = name;
    const thumb = document.createElement('canvas');
    thumb.width = 120;
    thumb.height = 120;
    paintScene(name, thumb);
    btn.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = SCENE_LABELS[name];
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.panels[state.selectedPanel].src = name;
      render();
    });
    wrap.appendChild(btn);
  }
}

function buildPanelButtons() {
  const wrap = $('panelPicker');
  if (!wrap) return;
  wrap.innerHTML = '';
  PANEL_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-btn';
    btn.dataset.panel = String(i);
    btn.textContent = `${i + 1} · ${name}`;
    btn.addEventListener('click', () => {
      state.selectedPanel = i;
      render();
    });
    wrap.appendChild(btn);
  });
}

function pickPanelAt(clientX, clientY) {
  const r = preview.getBoundingClientRect();
  const x = (clientX - r.left) / r.width;
  const y = (clientY - r.top) / r.height;
  const rects = panelRects(state.size);
  for (let i = 0; i < rects.length; i++) {
    const [fx, fy, fw, fh] = rects[i];
    if (x >= fx && x < fx + fw && y >= fy && y < fy + fh) {
      state.selectedPanel = i;
      render();
      return;
    }
  }
}

function wire() {
  buildSceneButtons();
  buildPanelButtons();

  document.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => { state.size = b.dataset.size; render(); }));
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.addEventListener('click', () => { state.grade = b.dataset.grade; render(); }));
  document.querySelectorAll('[data-style]').forEach((b) =>
    b.addEventListener('click', () => { state.captionStyle = b.dataset.style; render(); }));

  if ($('titleInput')) $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  if ($('subtitleInput')) $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  if ($('zoomRange')) $('zoomRange').addEventListener('input', (e) => { state.panels[state.selectedPanel].zoom = Number(e.target.value); render(); });
  if ($('panXRange')) $('panXRange').addEventListener('input', (e) => { state.panels[state.selectedPanel].px = Number(e.target.value); render(); });
  if ($('panYRange')) $('panYRange').addEventListener('input', (e) => { state.panels[state.selectedPanel].py = Number(e.target.value); render(); });

  if (preview) preview.addEventListener('click', (e) => pickPanelAt(e.clientX, e.clientY));

  const fileInput = $('photoFile');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          state.panels[state.selectedPanel].src = img;
          state.panels[state.selectedPanel].zoom = 1.1;
          state.panels[state.selectedPanel].px = 0.5;
          state.panels[state.selectedPanel].py = 0.5;
          render();
          showStatus(`Photo loaded into Panel ${state.selectedPanel + 1}.`);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const exportBtn = $('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const size = SIZES[state.size];
      const canvas = exportCoverCanvas(state, state.size);
      showStatus(`Exporting ${size.label}…`);
      canvas.toBlob((blob) => {
        if (!blob) { showStatus('Export failed — try again.'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vice-cover-${state.size}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showStatus(`Exported ${size.label} PNG — check your downloads.`);
      }, 'image/png');
    });
  }

  const shuffleBtn = $('shuffleBtn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const order = [...SCENES].sort(() => Math.random() - 0.5);
      state.panels.forEach((p, i) => { p.src = order[i % order.length]; });
      render();
      showStatus('Scenes shuffled — pick a panel to fine-tune it.');
    });
  }
}

function fitPreview() {
  if (shotMode === 'cover') {
    document.body.classList.add('shot-cover');
    preview.style.width = '100vw';
    preview.style.height = '100vh';
    preview.style.objectFit = 'contain';
  }
}

wire();
fitPreview();
render();
if (!shotMode) showStatus('Pick a panel, choose a scene or upload your photo, then export.');
