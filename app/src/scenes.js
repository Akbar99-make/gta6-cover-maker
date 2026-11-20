// scenes.js — procedural "photos" for Vice Cover Studio.
// Every scene is drawn with plain Canvas 2D gradients and silhouettes, so the
// app ships no photo files at all: the pictures are original vector-poster art
// painted by this code, and they look like GTA-style illustrated panels.

export const SCENES = ['boulevard', 'neon', 'beach', 'skyline'];

export const SCENE_LABELS = {
  boulevard: 'Sunset Blvd',
  neon: 'Neon Strip',
  beach: 'Beach Palms',
  skyline: 'Downtown',
};

// Deterministic pseudo-random helper so a scene always paints the same way.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function glowSun(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.6);
  g.addColorStop(0, halo);
  g.addColorStop(0.45, halo.replace(/[\d.]+\)$/, '0.35)'));
  g.addColorStop(1, halo.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function palm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve.
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 14, -96);
  ctx.stroke();
  // Fronds: seven arcs fanning from the crown.
  ctx.lineWidth = 5;
  const cx = 14, cy = -96;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.14);
    const len = 42 + (i % 3) * 8;
    const ex = cx + Math.cos(a) * len;
    const ey = cy + Math.sin(a) * len * 0.55 - 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, cy - 26, ex, ey);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath(); ctx.arc(cx - 4, cy + 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy + 4, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function buildingRow(ctx, w, baseY, color, rand, minH, maxH, lit) {
  let x = -10;
  while (x < w + 10) {
    const bw = 34 + rand() * 66;
    const bh = minH + rand() * (maxH - minH);
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (lit) {
      for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 14) {
        for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
          if (rand() < 0.28) {
            ctx.fillStyle = rand() < 0.7 ? 'rgba(255,214,120,0.95)' : 'rgba(140,240,255,0.9)';
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
    }
    x += bw + 4 + rand() * 10;
  }
}

function neonSign(ctx, x, y, w, h, color, label) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const barH = Math.max(3, h * 0.14);
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + w * 0.12, y + h * (0.2 + i * 0.28), w * (0.55 + ((i * 37) % 20) / 100), barH);
  }
  ctx.restore();
  void label;
}

// 1 — Sunset boulevard: low sun, road in perspective, palms, skyline.
export function paintBoulevard(ctx, w, h) {
  const rand = rng(11);
  sky(ctx, w, h, [[0, '#2b1055'], [0.42, '#7597de'], [0.62, '#ff7e5f'], [0.8, '#feb47b'], [1, '#ffd194']]);
  glowSun(ctx, w * 0.5, h * 0.52, w * 0.085, '#fff3c4', 'rgba(255,166,88,0.9)');
  // Distant skyline.
  ctx.fillStyle = '#3a1c5e';
  buildingRow(ctx, w, h * 0.62, '#3a1c5e', rand, h * 0.06, h * 0.16, false);
  // Road in perspective.
  ctx.fillStyle = '#241533';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.62);
  ctx.lineTo(w * 0.58, h * 0.62);
  ctx.lineTo(w * 0.98, h);
  ctx.lineTo(w * 0.02, h);
  ctx.closePath();
  ctx.fill();
  // Lane dashes converging to the horizon.
  ctx.fillStyle = 'rgba(255,220,130,0.9)';
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const y = h * (0.64 + t * 0.34);
    const s = 4 + t * 26;
    ctx.fillRect(w * 0.5 - s / 2, y, s, 3 + t * 10);
  }
  // Sidewalk strips.
  ctx.fillStyle = '#4a2b63';
  ctx.beginPath(); ctx.moveTo(0, h * 0.62); ctx.lineTo(w * 0.42, h * 0.62); ctx.lineTo(w * 0.02, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w, h * 0.62); ctx.lineTo(w * 0.58, h * 0.62); ctx.lineTo(w * 0.98, h); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  // Palms left and right.
  palm(ctx, w * 0.07, h * 0.99, w / 620, 0.1, '#1c0b2e');
  palm(ctx, w * 0.2, h * 0.86, w / 780, -0.08, '#241238');
  palm(ctx, w * 0.93, h * 0.99, w / 620, -0.12, '#1c0b2e');
  palm(ctx, w * 0.8, h * 0.88, w / 820, 0.06, '#241238');
  // A low sports-car silhouette cruising down the road.
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.moveTo(w * 0.435, h * 0.845);
  ctx.lineTo(w * 0.45, h * 0.815);
  ctx.quadraticCurveTo(w * 0.475, h * 0.795, w * 0.505, h * 0.798);
  ctx.quadraticCurveTo(w * 0.53, h * 0.8, w * 0.555, h * 0.812);
  ctx.lineTo(w * 0.575, h * 0.83);
  ctx.lineTo(w * 0.57, h * 0.845);
  ctx.lineTo(w * 0.435, h * 0.845);
  ctx.closePath();
  ctx.fill();
  // Cabin glass.
  ctx.fillStyle = 'rgba(255,170,90,0.85)';
  ctx.beginPath();
  ctx.moveTo(w * 0.485, h * 0.808);
  ctx.quadraticCurveTo(w * 0.505, h * 0.8, w * 0.525, h * 0.81);
  ctx.lineTo(w * 0.52, h * 0.82);
  ctx.lineTo(w * 0.49, h * 0.82);
  ctx.closePath();
  ctx.fill();
  // Wheels with a warm rim-light.
  ctx.fillStyle = '#0a0512';
  ctx.beginPath(); ctx.arc(w * 0.462, h * 0.845, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.55, h * 0.845, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,190,90,0.95)';
  ctx.beginPath(); ctx.arc(w * 0.462, h * 0.845, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.55, h * 0.845, 1.8, 0, Math.PI * 2); ctx.fill();
}

// 2 — Neon strip at dusk: dark towers, glowing signs, wet street.
export function paintNeon(ctx, w, h) {
  const rand = rng(23);
  sky(ctx, w, h, [[0, '#0b0620'], [0.55, '#1d0f3e'], [1, '#3b115f']]);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(rand() * w, rand() * h * 0.3, 2, 2);
  }
  glowSun(ctx, w * 0.78, h * 0.2, w * 0.045, '#ffe9f6', 'rgba(255,80,180,0.55)');
  // Tower blocks with lit windows.
  buildingRow(ctx, w, h * 0.78, '#12082b', rand, h * 0.24, h * 0.55, true);
  buildingRow(ctx, w, h * 0.78, '#0a0518', rand, h * 0.12, h * 0.3, true);
  // Neon signs.
  neonSign(ctx, w * 0.08, h * 0.3, w * 0.16, h * 0.2, '#ff2ea6');
  neonSign(ctx, w * 0.62, h * 0.22, w * 0.13, h * 0.26, '#00e5ff');
  neonSign(ctx, w * 0.38, h * 0.42, w * 0.1, h * 0.12, '#ffe14d');
  neonSign(ctx, w * 0.82, h * 0.44, w * 0.11, h * 0.14, '#7C4DFF');
  // Wet street with reflections.
  const g = ctx.createLinearGradient(0, h * 0.78, 0, h);
  g.addColorStop(0, '#1a0b33');
  g.addColorStop(1, '#05030c');
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  for (const [x, color, len] of [[0.16, '#ff2ea6', 0.16], [0.68, '#00e5ff', 0.2], [0.43, '#ffe14d', 0.1], [0.87, '#7C4DFF', 0.12]]) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.fillRect(w * x, h * 0.8, w * 0.02, h * len);
    ctx.restore();
  }
  palm(ctx, w * 0.05, h * 0.99, w / 700, 0.08, '#05030c');
}

// 3 — Beach palms: turquoise sea, sun shimmer, sand, umbrella.
export function paintBeach(ctx, w, h) {
  const rand = rng(37);
  sky(ctx, w, h, [[0, '#7dd8f0'], [0.45, '#aee9f5'], [0.6, '#ffd9a0'], [1, '#ff9d76']]);
  glowSun(ctx, w * 0.68, h * 0.34, w * 0.075, '#fff8d0', 'rgba(255,200,110,0.85)');
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.52, 0, h * 0.74);
  sea.addColorStop(0, '#2ec4d8');
  sea.addColorStop(1, '#0e7d9e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.52, w, h * 0.22);
  // Sun shimmer on the water.
  ctx.fillStyle = 'rgba(255,240,180,0.75)';
  for (let i = 0; i < 14; i++) {
    const y = h * (0.53 + i * 0.014);
    const ww = w * (0.05 + rand() * 0.16);
    ctx.fillRect(w * 0.68 - ww / 2 + (rand() - 0.5) * w * 0.05, y, ww, 2.5);
  }
  // Sand.
  const sand = ctx.createLinearGradient(0, h * 0.74, 0, h);
  sand.addColorStop(0, '#f7d9a0');
  sand.addColorStop(1, '#e8b878');
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.74, w, h * 0.26);
  // Umbrella.
  ctx.save();
  ctx.translate(w * 0.72, h * 0.82);
  ctx.strokeStyle = '#7a3b2e';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 0.1); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#ff5e78' : '#fff3e0';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.1);
    ctx.arc(0, -h * 0.1, w * 0.085, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  palm(ctx, w * 0.12, h * 0.98, w / 560, 0.12, '#17301f');
  palm(ctx, w * 0.3, h * 0.9, w / 760, -0.06, '#1d3a24');
  // Distant boat.
  ctx.fillStyle = '#12303e';
  ctx.fillRect(w * 0.16, h * 0.565, w * 0.09, h * 0.014);
  ctx.fillRect(w * 0.19, h * 0.535, 3.5, h * 0.032);
}

// 4 — Downtown golden hour: tall towers, lit windows, low sun.
export function paintSkyline(ctx, w, h) {
  const rand = rng(51);
  sky(ctx, w, h, [[0, '#3d1e5e'], [0.5, '#c94b7c'], [0.75, '#ff9e5e'], [1, '#ffc46b']]);
  glowSun(ctx, w * 0.5, h * 0.58, w * 0.09, '#fff0b0', 'rgba(255,170,80,0.9)');
  // Clouds.
  ctx.fillStyle = 'rgba(255,190,160,0.5)';
  for (const [x, y, s] of [[0.16, 0.16, 1], [0.72, 0.1, 1.3], [0.42, 0.26, 0.8]]) {
    ctx.beginPath();
    ctx.ellipse(w * x, h * y, w * 0.09 * s, h * 0.022 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Towers.
  buildingRow(ctx, w, h, '#241031', rand, h * 0.34, h * 0.72, true);
  buildingRow(ctx, w, h, '#160a20', rand, h * 0.2, h * 0.5, true);
  // Birds.
  ctx.strokeStyle = '#1c0b2e';
  ctx.lineWidth = 2.5;
  for (const [x, y, s] of [[0.2, 0.2, 1], [0.3, 0.16, 0.8], [0.66, 0.24, 1.1]]) {
    ctx.beginPath();
    ctx.moveTo(w * x - 8 * s, h * y);
    ctx.quadraticCurveTo(w * x, h * y - 7 * s, w * x + 8 * s, h * y);
    ctx.stroke();
  }
  palm(ctx, w * 0.94, h * 1.0, w / 640, -0.1, '#12081f');
}

export const PAINTERS = { boulevard: paintBoulevard, neon: paintNeon, beach: paintBeach, skyline: paintSkyline };

// Paint a named scene onto any canvas (used for panels and thumbnails).
export function paintScene(name, canvas) {
  const ctx = canvas.getContext('2d');
  const painter = PAINTERS[name] || PAINTERS.boulevard;
  painter(ctx, canvas.width, canvas.height);
}

// Render a scene to a fresh offscreen canvas at the given size.
export function sceneCanvas(name, size = 900) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  paintScene(name, c);
  return c;
}
