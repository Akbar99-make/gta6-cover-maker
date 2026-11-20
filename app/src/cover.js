// cover.js — the cover composer for Vice Cover Studio.
// drawCover paints the whole poster: a four-panel GTA-style collage, a colour
// grade, palm silhouettes and the big bold caption. One renderer serves the
// live preview and the exported PNG, so what you see is what you share.

import { paintScene } from './scenes.js';

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  landscape: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon',
  noir: 'Noir',
  vice: 'Vice',
};

export const CAPTION_STYLES = {
  white: 'White',
  gold: 'Gold',
  neon: 'Neon',
};

export const PANEL_NAMES = ['Hero', 'Top', 'Mid', 'Strip'];

// Panel rectangles as fractions of the cover, per export size.
const LAYOUTS = {
  square: [
    [0, 0, 0.6, 0.62],
    [0.6, 0, 0.4, 0.31],
    [0.6, 0.31, 0.4, 0.31],
    [0, 0.62, 1, 0.38],
  ],
  portrait: [
    [0, 0, 1, 0.44],
    [0, 0.44, 0.5, 0.22],
    [0.5, 0.44, 0.5, 0.22],
    [0, 0.66, 1, 0.34],
  ],
  landscape: [
    [0, 0, 0.5, 0.68],
    [0.5, 0, 0.25, 0.68],
    [0.75, 0, 0.25, 0.68],
    [0, 0.68, 1, 0.32],
  ],
};

export function panelRects(size) {
  return LAYOUTS[size] || LAYOUTS.square;
}

// Cache of painted scene canvases, keyed by scene name.
const sceneCache = new Map();
function sceneImage(name) {
  if (!sceneCache.has(name)) {
    const c = document.createElement('canvas');
    c.width = 900;
    c.height = 900;
    paintScene(name, c);
    sceneCache.set(name, c);
  }
  return sceneCache.get(name);
}

function drawCoverFit(ctx, img, x, y, rw, rh, zoom, px, py) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  let dx = x + (rw - dw) / 2 + (px - 0.5) * (dw - rw);
  let dy = y + (rh - dh) / 2 + (py - 0.5) * (dh - rh);
  dx = Math.min(x, Math.max(x + rw - dw, dx));
  dy = Math.min(y, Math.max(y + rh - dh, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
}

function palmSilhouette(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = '#12081f';
  ctx.fillStyle = '#12081f';
  ctx.lineCap = 'round';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -60, 18, -110);
  ctx.stroke();
  ctx.lineWidth = 6;
  const cx = 18, cy = -110;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.14);
    const len = 48 + (i % 3) * 9;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, cy - 30, cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.55 - 8);
    ctx.stroke();
  }
  ctx.restore();
}

function gradeOverlay(ctx, w, h, grade) {
  if (grade === 'noir') {
    // A red accent wash keeps Noir from going flat.
    const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
    g.addColorStop(0, 'rgba(200,30,60,0)');
    g.addColorStop(1, 'rgba(200,30,60,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const washes = {
    sunset: [['rgba(255,120,60,0.16)', 'rgba(190,40,120,0.26)'], 'overlay'],
    neon: [['rgba(255,46,166,0.22)', 'rgba(0,229,255,0.22)'], 'overlay'],
    vice: [['rgba(0,220,200,0.18)', 'rgba(255,46,166,0.22)'], 'soft-light'],
  };
  const [stops, mode] = washes[grade] || washes.sunset;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, stops[0]);
  g.addColorStop(1, stops[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Warm sun glow, upper middle.
  ctx.save();
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.55);
  glow.addColorStop(0, 'rgba(255,190,110,0.14)');
  glow.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(10,4,20,0)');
  g.addColorStop(1, 'rgba(10,4,20,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `900 ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `900 ${px}px ${family}`;
  }
  return px;
}

const TITLE_FAMILY = '"Arial Black", "Archivo Black", Impact, "Franklin Gothic Heavy", sans-serif';

function drawCaption(ctx, w, h, state) {
  const bandH = h * 0.26;
  const bandY = h - bandH;
  // Dark gradient so the lettering always reads.
  const g = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  g.addColorStop(0, 'rgba(12,4,24,0)');
  g.addColorStop(0.45, 'rgba(12,4,24,0.62)');
  g.addColorStop(1, 'rgba(12,4,24,0.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // Palm silhouettes framing the caption band.
  const ps = w / 620;
  palmSilhouette(ctx, w * 0.02, h + 4, ps * 1.15, 0.12);
  palmSilhouette(ctx, w * 0.98, h + 4, ps * 1.15, -0.12);

  const title = (state.title || 'VICE CITY').toUpperCase();
  const sub = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const titlePx = fitFont(ctx, title, w * 0.92, h * 0.105, TITLE_FAMILY);
  const titleY = bandY + bandH * 0.52;
  const style = state.captionStyle || 'white';
  if (style === 'gold') {
    const gold = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY);
    gold.addColorStop(0, '#fff3a0');
    gold.addColorStop(0.55, '#ffd34d');
    gold.addColorStop(1, '#f08c1a');
    ctx.strokeStyle = '#3a1c00';
    ctx.lineWidth = titlePx * 0.17;
    ctx.strokeText(title, w / 2, titleY);
    ctx.fillStyle = gold;
    ctx.fillText(title, w / 2, titleY);
  } else if (style === 'neon') {
    ctx.save();
    ctx.shadowColor = '#ff2ea6';
    ctx.shadowBlur = titlePx * 0.35;
    ctx.strokeStyle = '#ff2ea6';
    ctx.lineWidth = titlePx * 0.2;
    ctx.strokeText(title, w / 2, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, w / 2, titleY);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = titlePx * 0.12;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(title, w / 2, titleY);
    ctx.restore();
  } else {
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineWidth = titlePx * 0.18;
    ctx.strokeText(title, w / 2, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, w / 2, titleY);
  }

  if (sub) {
    const subPx = Math.max(20, h * 0.032);
    ctx.font = `700 ${subPx}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = 'rgba(12,4,24,0.85)';
    ctx.lineWidth = subPx * 0.14;
    const subY = titleY + subPx * 1.7;
    ctx.strokeText(sub.toUpperCase(), w / 2, subY);
    ctx.fillText(sub.toUpperCase(), w / 2, subY);
    // Neon rule under the subtitle.
    const ruleW = Math.min(w * 0.4, ctx.measureText(sub.toUpperCase()).width);
    ctx.fillStyle = style === 'neon' ? '#00e5ff' : style === 'gold' ? '#ffd34d' : '#ff5e78';
    ctx.fillRect(w / 2 - ruleW / 2, subY + subPx * 0.55, ruleW, Math.max(3, h * 0.004));
  }
}

// Paint the cover described by `state` onto `canvas` (any pixel size).
// state: { size, grade, captionStyle, title, subtitle, panels: [{src, zoom, px, py}] }
// A panel src is a scene name string, or an HTMLImageElement (user upload).
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const w = size.w, h = size.h;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.size);
  const gutter = Math.max(4, Math.round(w * 0.006));
  const noir = state.grade === 'noir';
  state.panels.forEach((panel, i) => {
    const [fx, fy, fw, fh] = rects[i] || rects[0];
    const x = fx * w + (fx > 0 ? gutter / 2 : 0);
    const y = fy * h + (fy > 0 ? gutter / 2 : 0);
    const rw = fw * w - (fx > 0 ? gutter / 2 : 0) - (fx + fw < 1 ? gutter / 2 : 0);
    const rh = fh * h - (fy > 0 ? gutter / 2 : 0) - (fy + fh < 1 ? gutter / 2 : 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.clip();
    if (noir) ctx.filter = 'grayscale(1) contrast(1.22) brightness(1.04)';
    const img = typeof panel.src === 'string' ? sceneImage(panel.src) : panel.src;
    if (img && img.width) {
      drawCoverFit(ctx, img, x, y, rw, rh, panel.zoom || 1.15, panel.px ?? 0.5, panel.py ?? 0.5);
    }
    ctx.restore();
  });

  gradeOverlay(ctx, w, h, state.grade || 'sunset');
  vignette(ctx, w, h);
  drawCaption(ctx, w, h, state);
}

// Render the cover at an export size and hand back the canvas.
export function exportCoverCanvas(state, sizeKey) {
  const c = document.createElement('canvas');
  drawCover(c, { ...state, size: sizeKey });
  return c;
}
