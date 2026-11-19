// Vice Cover Studio — cover painter.
// Draws a multi-panel GTA-style poster onto a canvas from a photo, a caption,
// a colour grade and a caption style. No network, no fonts to fetch: the
// lettering is the system font stack, painted bold with an outline and a glow.

export const COVER_GRADES = ['sunset', 'neon', 'noir'];
export const CAPTION_STYLES = ['white', 'gold', 'neon'];
export const COVER_LAYOUTS = ['hero', 'split', 'stack'];
export const EXPORT_SIZES = [
  { label: 'Square', width: 1080, height: 1080 },
  { label: 'Portrait', width: 1080, height: 1350 },
  { label: 'Wide', width: 1920, height: 1080 },
];

/** The gap, in pixels, left between panels so they read as separate frames. */
const PANEL_GAP = 8;

/** Panel rectangles for a layout, as fractions of the cover: [x, y, w, h]. */
export function panelRectsFor(layout, width, height) {
  if (layout === 'split') {
    return [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ];
  }
  if (layout === 'stack') {
    return [
      [0, 0, 0.55, 1],
      [0.55, 0, 0.45, 0.5],
      [0.55, 0.5, 0.45, 0.5],
    ];
  }
  // hero: one big panel on top, two small ones below it.
  return [
    [0, 0, 1, 0.6],
    [0, 0.6, 0.5, 0.4],
    [0.5, 0.6, 0.5, 0.4],
  ];
}

/** How many panels a layout has. */
export function panelCountFor(layout) {
  return panelRectsFor(layout, 1, 1).length;
}

/**
 * Draws one photo into a panel rectangle with a cover fit: the photo fills
 * the rectangle, cropped on the long side. crop.px / crop.py pan the photo
 * inside the panel (-1..1) and crop.zoom scales it (1..2).
 */
export function fitPhotoInPanel(ctx, photo, rect, crop) {
  const px = crop?.px ?? 0;
  const py = crop?.py ?? 0;
  const zoom = crop?.zoom ?? 1;
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const drawnW = photo.naturalWidth * scale;
  const drawnH = photo.naturalHeight * scale;
  const excessX = Math.max(0, (drawnW - rect.w) / 2);
  const excessY = Math.max(0, (drawnH - rect.h) / 2);
  const dx = rect.x - excessX + px * excessX;
  const dy = rect.y - excessY + py * excessY;
  ctx.drawImage(photo, dx, dy, drawnW, drawnH);
}

/** The canvas filter a grade applies while the photo is drawn. */
function photoFilterFor(grade) {
  if (grade === 'neon') return 'saturate(1.5) contrast(1.12)';
  if (grade === 'noir') return 'grayscale(1) contrast(1.18) brightness(0.88)';
  return 'saturate(1.35) contrast(1.05) brightness(1.02)';
}

/** Paints a grade's colour wash over one panel rectangle. */
export function applyGradeWash(ctx, grade, rect) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (grade === 'sunset') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255,166,66,0.20)');
    wash.addColorStop(0.55, 'rgba(255,94,98,0.10)');
    wash.addColorStop(1, 'rgba(120,20,80,0.30)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    const glow = ctx.createRadialGradient(x + w * 0.78, y + h * 0.16, 0, x + w * 0.78, y + h * 0.16, w * 0.55);
    glow.addColorStop(0, 'rgba(255,200,120,0.32)');
    glow.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
  } else if (grade === 'neon') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(0,229,255,0.22)');
    wash.addColorStop(1, 'rgba(255,0,128,0.28)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    const glow = ctx.createRadialGradient(x + w * 0.85, y + h * 0.85, 0, x + w * 0.85, y + h * 0.85, w * 0.5);
    glow.addColorStop(0, 'rgba(255,0,160,0.30)');
    glow.addColorStop(1, 'rgba(255,0,160,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
  } else {
    const light = ctx.createLinearGradient(x, y, x, y + h);
    light.addColorStop(0, 'rgba(255,255,255,0.10)');
    light.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = light;
    ctx.fillRect(x, y, w, h);
  }
  // A vignette on every grade: the edges fall off, the middle stays bright.
  const shade = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** The fill, stroke and glow a caption style paints with. */
export function captionPaintFor(ctx, style, width, height) {
  if (style === 'gold') {
    const gold = ctx.createLinearGradient(0, height * 0.72, 0, height);
    gold.addColorStop(0, '#fff2b0');
    gold.addColorStop(0.5, '#ffd34d');
    gold.addColorStop(1, '#e89b0c');
    return { fill: gold, stroke: '#3a2200', shadow: '#000000', blur: Math.round(width * 0.012) };
  }
  if (style === 'neon') {
    return { fill: '#8ef6ff', stroke: '#12002e', shadow: '#ff2fb3', blur: Math.round(width * 0.022) };
  }
  return { fill: '#ffffff', stroke: '#111111', shadow: '#000000', blur: Math.round(width * 0.012) };
}

/** Splits a caption into lines that fit maxWidth at the given font. */
function wrapCaption(ctx, caption, maxWidth) {
  const words = String(caption || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['VICE COVER STUDIO'];
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(trial).width <= maxWidth || line === '') {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines.slice(0, 2);
}

/** Paints the bold caption band across the bottom of the cover. */
export function drawCaptionBand(ctx, caption, style, width, height) {
  const band = ctx.createLinearGradient(0, height * 0.68, 0, height);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = band;
  ctx.fillRect(0, height * 0.68, width, height * 0.32);

  const paint = captionPaintFor(ctx, style, width, height);
  let px = Math.round(width * 0.085);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (size) => {
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = '1px'; } catch { /* older canvas: no letter spacing */ }
  };
  setFont(px);
  let lines = wrapCaption(ctx, caption, width * 0.92);
  while (lines.some((l) => ctx.measureText(l).width > width * 0.92) && px > 18) {
    px = Math.round(px * 0.92);
    setFont(px);
    lines = wrapCaption(ctx, caption, width * 0.92);
  }
  const lineHeight = Math.round(px * 1.08);
  const blockH = lines.length * lineHeight;
  let baseline = height - Math.round(height * 0.045) - (blockH - lineHeight);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  for (const line of lines) {
    ctx.save();
    ctx.shadowColor = paint.shadow;
    ctx.shadowBlur = paint.blur;
    ctx.shadowOffsetY = Math.round(px * 0.06);
    ctx.strokeStyle = paint.stroke;
    ctx.lineWidth = Math.max(2, Math.round(px * 0.09));
    ctx.strokeText(line, width / 2, baseline);
    ctx.fillStyle = paint.fill;
    ctx.fillText(line, width / 2, baseline);
    ctx.restore();
    baseline += lineHeight;
  }
}

/**
 * Paints a whole cover onto a canvas: panels with the photo, the grade wash
 * on each panel, then the caption band. spec: { photo, caption, grade,
 * captionStyle, layout, crops }. Returns the canvas.
 */
export function paintCover(canvas, spec) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const layout = COVER_LAYOUTS.includes(spec.layout) ? spec.layout : 'hero';
  const grade = COVER_GRADES.includes(spec.grade) ? spec.grade : 'sunset';
  const captionStyle = CAPTION_STYLES.includes(spec.captionStyle) ? spec.captionStyle : 'white';
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, width, height);
  const rects = panelRectsFor(layout, width, height).map(([fx, fy, fw, fh]) => ({
    x: Math.round(fx * width + PANEL_GAP / 2),
    y: Math.round(fy * height + PANEL_GAP / 2),
    w: Math.round(fw * width - PANEL_GAP),
    h: Math.round(fh * height - PANEL_GAP),
  }));
  rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (spec.photo) {
      ctx.filter = photoFilterFor(grade);
      fitPhotoInPanel(ctx, spec.photo, rect, spec.crops?.[i]);
      ctx.filter = 'none';
    } else {
      const fallback = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      fallback.addColorStop(0, '#3b2a5e');
      fallback.addColorStop(1, '#120e1e');
      ctx.fillStyle = fallback;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    applyGradeWash(ctx, grade, rect);
  });
  drawCaptionBand(ctx, spec.caption, captionStyle, width, height);
  ctx.restore();
  return canvas;
}
