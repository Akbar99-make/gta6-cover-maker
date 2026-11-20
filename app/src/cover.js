// Vice Cover Studio — the cover renderer.
//
// drawCover(ctx, state, width, height) paints one finished cover: the
// photo (or the drawn demo portrait) cover-fitted into panels, the chosen
// procedural scene behind it, a sunset/neon colour grade, the bold title
// block, and the print finish (grain + vignette). Pure Canvas 2D, fully
// deterministic — the same state always paints the same pixels.

import { paintScene, getDemoPhoto, mulberry32, clamp, SCENES } from './scenes.js';

export const LAYOUTS = [
  { id: 'hero', name: 'Hero' },
  { id: 'panels', name: 'Panels' },
  { id: 'poster', name: 'Poster' },
];

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    shadow: 'rgba(255,46,136,0.30)',
    light: 'rgba(255,178,44,0.26)',
    tint: 'rgba(255,120,60,0.10)',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    shadow: 'rgba(185,103,255,0.34)',
    light: 'rgba(0,229,255,0.26)',
    tint: 'rgba(255,46,136,0.10)',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    shadow: 'rgba(180,90,20,0.22)',
    light: 'rgba(255,214,120,0.34)',
    tint: 'rgba(255,190,80,0.12)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    shadow: 'rgba(20,20,120,0.36)',
    light: 'rgba(126,240,224,0.20)',
    tint: 'rgba(40,60,200,0.12)',
  },
];

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];

export function defaultCoverState() {
  return {
    layout: 'hero',
    scene: 'beach',
    grade: 'sunset',
    title: 'VICE CITY',
    subtitle: 'Neon Shore',
    titleScale: 1,
    photoZoom: 1,
    photoPanX: 0,
    photoPanY: 0,
    photoSource: 'demo',
    panelPhoto: 'demo',
  };
}

// Draw an image (or canvas) cover-fitted into a rectangle, with a zoom
// factor and a pan offset expressed as fractions of the rect.
export function drawPhotoCoverFit(ctx, image, rect, zoom, panX, panY) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.max(rect.w / imageWidth, rect.h / imageHeight) * zoom;
  const drawnW = imageWidth * scale;
  const drawnH = imageHeight * scale;
  const dx = rect.x + (rect.w - drawnW) / 2 + panX * rect.w;
  const dy = rect.y + (rect.h - drawnH) / 2 + panY * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(image, dx, dy, drawnW, drawnH);
  ctx.restore();
}

// Paint a procedural scene cover-fitted into a rectangle. Scenes are
// painted at the rect's own aspect on a scratch canvas first, so their
// composition (sun, horizon, palms) never stretches.
const sceneScratch = typeof document !== 'undefined' ? document.createElement('canvas') : null;

export function drawSceneCoverFit(ctx, sceneId, rect) {
  const width = Math.max(2, Math.round(rect.w));
  const height = Math.max(2, Math.round(rect.h));
  sceneScratch.width = width;
  sceneScratch.height = height;
  const scratch = sceneScratch.getContext('2d');
  paintScene(scratch, sceneId, width, height);
  ctx.drawImage(sceneScratch, rect.x, rect.y, rect.w, rect.h);
}

// The colour grade: a warm light wash from the top, a cool/magenta shade
// at the bottom, a flat tint over everything, then a soft vignette.
export function applyGrade(ctx, width, height, gradeId) {
  const grade = GRADES.find((g) => g.id === gradeId) || GRADES[0];
  let wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, grade.light);
  wash.addColorStop(0.55, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.shadow);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, width, height);
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,4,24,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

// Deterministic film grain: seeded dots, same on every render.
export function applyGrain(ctx, width, height, seed) {
  const random = mulberry32(seed);
  const dots = Math.floor((width * height) / 900);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const x = random() * width;
    const y = random() * height;
    const light = random() < 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

// Bold GTA-style title block: a script subtitle in Pacifico over a huge
// Anton title with a hard offset shadow and a thin white outline.
export function drawTitleBlock(ctx, state, width, height, area) {
  // Sized to the title area, not the whole cover: a title that fills the
  // frame hides the photo, so it takes about an eighth of the width.
  const titleSize = Math.min(area.w * 0.11, area.h * 0.36) * state.titleScale;
  const subtitleSize = titleSize * 0.36;
  const titleX = area.x + area.w * 0.04;
  const titleBaseline = area.y + area.h - area.h * 0.16;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  // Subtitle, tilted, in hot pink script.
  ctx.translate(titleX + area.w * 0.02, titleBaseline - titleSize * 1.02);
  ctx.rotate(-0.045);
  ctx.font = `${subtitleSize}px Pacifico, cursive`;
  ctx.fillStyle = '#ff2e88';
  ctx.shadowColor = 'rgba(255,46,136,0.9)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.fillText(state.subtitle, 0, 0);
  ctx.restore();
  // Title: layered shadow, then white face with a dark keyline.
  ctx.save();
  ctx.translate(titleX, titleBaseline);
  ctx.rotate(-0.012);
  ctx.font = `${titleSize}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const letterSpacing = titleSize * 0.02;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;
  ctx.fillStyle = '#12041f';
  ctx.fillText(state.title, titleSize * 0.045, titleSize * 0.05);
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(state.title, titleSize * 0.02, titleSize * 0.022);
  ctx.lineWidth = Math.max(2, titleSize * 0.02);
  ctx.strokeStyle = 'rgba(18,4,31,0.9)';
  ctx.strokeText(state.title, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.title, 0, 0);
  // A thin underline bar under the title.
  ctx.fillStyle = '#ffe259';
  ctx.fillRect(0, titleSize * 0.16, area.w * 0.34, Math.max(3, titleSize * 0.045));
  ctx.restore();
}

// A small corner badge, like a poster credit line.
export function drawCornerBadge(ctx, width, height) {
  const pad = width * 0.022;
  const fontSize = Math.max(13, width * 0.011);
  ctx.save();
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 6;
  ctx.fillText('LEONIDA  •  EST. 2026', width - pad, pad);
  ctx.restore();
}

function drawPanelGap(ctx, width, height, gap) {
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, width, height);
  void gap;
}

// Layout geometry: where the photo, the scene panels and the title sit.
export function layoutPanels(state, width, height) {
  const gap = Math.max(6, Math.round(width * 0.008));
  if (state.layout === 'panels') {
    const heroH = Math.round(height * 0.66);
    const stripY = heroH + gap;
    const stripH = height - stripY;
    const stripW = Math.round((width - gap) / 2);
    return {
      hero: { x: 0, y: 0, w: width, h: heroH },
      small: [
        { x: 0, y: stripY, w: stripW, h: stripH },
        { x: stripW + gap, y: stripY, w: width - stripW - gap, h: stripH },
      ],
      titleArea: { x: 0, y: 0, w: width, h: heroH },
      gap,
    };
  }
  if (state.layout === 'poster') {
    const frame = Math.max(10, Math.round(width * 0.028));
    const photoH = Math.round(height * 0.68);
    return {
      hero: { x: frame, y: frame, w: width - frame * 2, h: photoH },
      small: [],
      titleArea: { x: frame, y: frame + photoH, w: width - frame * 2, h: height - frame - photoH },
      frame,
      gap,
    };
  }
  return {
    hero: { x: 0, y: 0, w: width, h: height },
    small: [],
    titleArea: { x: 0, y: 0, w: width, h: height },
    gap,
  };
}

// The whole cover, painted onto ctx at (0, 0, width, height).
export function drawCover(ctx, state, width, height) {
  const photo = state.photoSource === 'demo' ? getDemoPhoto() : state.photoImage;
  const panels = layoutPanels(state, width, height);
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, width, height);

  if (state.layout === 'poster') {
    // White poster frame with a dark band for the title block.
    ctx.fillStyle = '#f6f1e7';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#12041f';
    ctx.fillRect(panels.frame, panels.frame + panels.hero.h, panels.hero.w, panels.titleArea.h);
  }

  // Hero photo.
  if (photo) {
    drawPhotoCoverFit(ctx, photo, panels.hero, state.photoZoom, state.photoPanX, state.photoPanY);
  } else {
    drawSceneCoverFit(ctx, state.scene, panels.hero);
  }

  // Small panels: the chosen scene first, then the next scene in the
  // list, so the strip shows two different places instead of a repeat.
  const sceneIndex = Math.max(0, SCENES.findIndex((s) => s.id === state.scene));
  const secondScene = SCENES[(sceneIndex + 1) % SCENES.length].id;
  panels.small.forEach((small, index) => {
    drawSceneCoverFit(ctx, index === 0 ? state.scene : secondScene, small);
  });

  // Grade over the whole cover, then the title and badge.
  applyGrade(ctx, width, height, state.grade);
  void grade;

  // A thin white keyline around the hero photo in panels layout.
  if (state.layout === 'panels') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, width * 0.003);
    ctx.strokeRect(panels.hero.x + 1, panels.hero.y + 1, panels.hero.w - 2, panels.hero.h - 2);
    for (const small of panels.small) {
      ctx.strokeRect(small.x + 1, small.y + 1, small.w - 2, small.h - 2);
    }
  }

  drawTitleBlock(ctx, state, width, height, panels.titleArea);
  drawCornerBadge(ctx, width, height);
  applyGrain(ctx, width, height, 20261120);
  ctx.restore();
}

// Render a finished cover to a fresh canvas at an export size.
export function renderCoverCanvas(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  drawCover(canvas.getContext('2d'), state, size.width, size.height);
  return canvas;
}

// Make sure Anton + Pacifico are loaded before a shot or an export draws.
export function waitForCoverFonts() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
}
