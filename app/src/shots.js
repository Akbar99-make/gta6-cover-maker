// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, filling the viewport.
// Query params: layout=multi|single|split, photo1/photo2/photo3=boulevard|pier,
// title, sub, w, h (canvas pixels), ox1/oy1… per-panel framing offsets (-0.5..0.5).
// window.__shotReady is set once painted.

/** Reads a shot scene out of the page's query string. */
export function parseShot(query) {
  const pick = (key, fallback) => {
    const v = query.get(key);
    return v === 'boulevard' || v === 'pier' ? v : fallback;
  };
  const offset = (key) => {
    const v = Number(query.get(key));
    return Number.isFinite(v) ? Math.max(-0.5, Math.min(0.5, v)) : 0;
  };
  const layout = query.get('layout');
  return {
    mode: query.get('shot') === 'cover' ? 'cover' : 'editor',
    layout: layout === 'single' || layout === 'split' ? layout : 'multi',
    photos: [pick('photo1', 'pier'), pick('photo2', 'boulevard'), pick('photo3', 'pier')],
    offsets: [[offset('ox1'), offset('oy1')], [offset('ox2'), offset('oy2')], [offset('ox3'), offset('oy3')]],
    title: query.get('title') ?? 'Sunset Heist',
    sub: query.get('sub') ?? 'Vice City • One Last Score',
    w: Number(query.get('w')) || 0,
    h: Number(query.get('h')) || 0,
  };
}

/** Marks the scene painted (two frames, so the canvas is really on screen). */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
