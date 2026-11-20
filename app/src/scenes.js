// Vice Cover Studio — procedural scene painters.
//
// Every backdrop and the demo "photo" are drawn here with plain Canvas 2D
// calls, so the app needs no image files at all and every render is
// deterministic: the same seed always paints the same sky, palms and city.
// Scenes are painted into a rectangle; the cover engine cover-fits them
// into panels, and the demo portrait is cached on one offscreen canvas.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// A vertical gradient from an array of [stop, color] pairs.
export function skyGradient(ctx, width, height, stops) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const [stop, color] of stops) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// A glowing sun disc: soft halo, bright core, and a flat banded bottom
// half in the classic outrun style.
export function drawSun(ctx, x, y, radius, core, halo) {
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.4);
  glow.addColorStop(0, halo);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius * 2.4, y - radius * 2.4, radius * 4.8, radius * 4.8);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createLinearGradient(0, y - radius, 0, y + radius);
  body.addColorStop(0, '#ffe259');
  body.addColorStop(0.55, '#ff9a3d');
  body.addColorStop(1, core);
  ctx.fillStyle = body;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.fillStyle = 'rgba(20,8,40,0.28)';
  let bandY = y + radius * 0.12;
  let bandH = radius * 0.07;
  while (bandY < y + radius) {
    ctx.fillRect(x - radius, bandY, radius * 2, bandH);
    bandY += bandH * 2.4;
    bandH *= 1.25;
  }
  ctx.restore();
}

// One palm tree: a leaning trunk and seven drooping fronds.
export function drawPalm(ctx, x, y, size, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.06, -size * 0.55, size * 0.16, -size * 0.95);
  ctx.stroke();
  const topX = size * 0.16;
  const topY = -size * 0.95;
  ctx.lineWidth = Math.max(2, size * 0.03);
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * 0.92 + (i / 6) * Math.PI * 0.84;
    const len = size * (0.52 - Math.abs(i - 3) * 0.045);
    const endX = topX + Math.cos(angle) * len;
    const endY = topY + Math.sin(angle) * len * 0.62 + size * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.55,
      topY + Math.sin(angle) * len * 0.4 - size * 0.08,
      endX,
      endY,
    );
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(topX - size * 0.05, topY + size * 0.02, size * 0.045, 0, Math.PI * 2);
  ctx.arc(topX + size * 0.06, topY + size * 0.05, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A row of flat-roofed buildings with a few lit windows.
export function drawSkyline(ctx, width, baseY, height, color, seed, litRatio) {
  const random = mulberry32(seed);
  let x = -width * 0.02;
  ctx.fillStyle = color;
  while (x < width * 1.02) {
    const bw = width * (0.05 + random() * 0.09);
    const bh = height * (0.25 + random() * 0.75);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (random() < 0.4) {
      ctx.fillRect(x + bw * 0.2, baseY - bh - height * 0.06, bw * 0.24, height * 0.06);
    }
    if (random() < 0.35) {
      ctx.fillRect(x + bw * 0.62, baseY - bh - height * 0.1, bw * 0.05, height * 0.1);
    }
    const cols = Math.max(2, Math.floor(bw / (width * 0.02)));
    const rows = Math.max(2, Math.floor(bh / (height * 0.09)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (random() < litRatio) {
          ctx.fillStyle = random() < 0.7 ? '#ffd166' : '#7ef0e0';
          ctx.fillRect(
            x + bw * 0.12 + c * (bw * 0.76 / cols),
            baseY - bh + height * 0.06 + r * (bh * 0.82 / rows),
            Math.max(2, width * 0.008),
            Math.max(2, height * 0.028),
          );
          ctx.fillStyle = color;
        }
      }
    }
    x += bw + width * 0.008;
  }
}

export function drawStars(ctx, width, height, count, seed) {
  const random = mulberry32(seed);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height * 0.55;
    const r = 0.6 + random() * 1.6;
    ctx.globalAlpha = 0.35 + random() * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Shimmering horizontal streaks under a low sun on water.
export function drawSunGlitter(ctx, width, topY, bottomY, sunX, seed) {
  const random = mulberry32(seed);
  for (let i = 0; i < 46; i++) {
    const y = topY + random() * (bottomY - topY);
    const spread = (y - topY) / (bottomY - topY);
    const half = width * 0.02 + spread * width * 0.16;
    const w = half * (0.25 + random() * 0.75);
    ctx.fillStyle = `rgba(255, ${170 + Math.floor(random() * 60)}, 90, ${0.12 + random() * 0.3})`;
    ctx.fillRect(sunX - w / 2 + (random() - 0.5) * half, y, w, Math.max(1.5, (bottomY - topY) * 0.012));
  }
}

// ---------------------------------------------------------------------------
// The four backdrops. Each paints into (0, 0, width, height) and is written
// so any width/height works: the cover engine cover-fits them into panels.
// ---------------------------------------------------------------------------

export function paintSunsetBeach(ctx, width, height) {
  skyGradient(ctx, width, height, [
    [0, '#2b1055'],
    [0.35, '#7597de'],
    [0.55, '#ff7e5f'],
    [0.72, '#feb47b'],
    [1, '#ffcf8a'],
  ]);
  drawSun(ctx, width * 0.5, height * 0.52, height * 0.17, '#ff5e62', 'rgba(255,120,80,0.55)');
  const horizon = height * 0.62;
  const sea = ctx.createLinearGradient(0, horizon, 0, height * 0.82);
  sea.addColorStop(0, '#ff9a5c');
  sea.addColorStop(0.5, '#c94b7c');
  sea.addColorStop(1, '#3d1e5e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, width, height * 0.2);
  drawSunGlitter(ctx, width, horizon + 2, height * 0.8, width * 0.5, 77);
  const sand = ctx.createLinearGradient(0, height * 0.82, 0, height);
  sand.addColorStop(0, '#f7c873');
  sand.addColorStop(1, '#c98a4b');
  ctx.fillStyle = sand;
  ctx.fillRect(0, height * 0.82, width, height * 0.18);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, height * 0.006);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.82);
  ctx.quadraticCurveTo(width * 0.5, height * 0.795, width, height * 0.82);
  ctx.stroke();
  drawPalm(ctx, width * 0.06, height * 0.86, height * 0.42, -0.1, '#1d0b2e');
  drawPalm(ctx, width * 0.94, height * 0.88, height * 0.46, 0.12, '#1d0b2e');
  drawPalm(ctx, width * 0.84, height * 0.84, height * 0.26, 0.06, '#2a1145');
}

export function paintNeonStreet(ctx, width, height) {
  skyGradient(ctx, width, height, [
    [0, '#0b0620'],
    [0.5, '#1c0b33'],
    [1, '#3d0f4d'],
  ]);
  drawStars(ctx, width, height, 40, 31);
  ctx.fillStyle = '#120826';
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
  drawSkyline(ctx, width, height * 0.62, height * 0.5, '#0a0518', 41, 0.28);
  // Neon signs: glowing bars and dots along the street front.
  const signs = ['#ff2e88', '#00e5ff', '#ffe259', '#ff6b35', '#b967ff'];
  const random = mulberry32(55);
  for (let i = 0; i < 9; i++) {
    const x = width * (0.03 + i * 0.105);
    const y = height * (0.6 + random() * 0.08);
    const color = signs[i % signs.length];
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = height * 0.03;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * 0.055, height * 0.012);
    ctx.fillRect(x, y + height * 0.03, width * 0.03, height * 0.012);
    ctx.restore();
  }
  // Wet pavement: vertical neon reflections.
  for (let i = 0; i < 26; i++) {
    const x = random() * width;
    const color = signs[Math.floor(random() * signs.length)];
    const grad = ctx.createLinearGradient(0, height * 0.78, 0, height);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.16 + random() * 0.25;
    ctx.fillStyle = grad;
    ctx.fillRect(x, height * 0.78, width * 0.006, height * 0.2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0d0518';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width * 0.42, height * 0.78);
  ctx.lineTo(width * 0.58, height * 0.78);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,226,89,0.85)';
  ctx.lineWidth = Math.max(2, height * 0.006);
  ctx.setLineDash([height * 0.03, height * 0.025]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.8);
  ctx.lineTo(width * 0.5, height);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPalm(ctx, width * 0.08, height * 0.8, height * 0.3, -0.08, '#05020e');
  drawPalm(ctx, width * 0.93, height * 0.82, height * 0.32, 0.1, '#05020e');
}

export function paintNightSkyline(ctx, width, height) {
  skyGradient(ctx, width, height, [
    [0, '#04041a'],
    [0.5, '#101b4d'],
    [0.72, '#3b2a6e'],
    [1, '#7a3b8f'],
  ]);
  drawStars(ctx, width, height, 90, 97);
  const moonX = width * 0.78;
  const moonY = height * 0.2;
  const halo = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, height * 0.16);
  halo.addColorStop(0, 'rgba(230,240,255,0.9)');
  halo.addColorStop(1, 'rgba(230,240,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(moonX - height * 0.16, moonY - height * 0.16, height * 0.32, height * 0.32);
  ctx.fillStyle = '#eef2ff';
  ctx.beginPath();
  ctx.arc(moonX, moonY, height * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(160,170,210,0.5)';
  ctx.beginPath();
  ctx.arc(moonX - height * 0.018, moonY - height * 0.012, height * 0.011, 0, Math.PI * 2);
  ctx.arc(moonX + height * 0.02, moonY + height * 0.018, height * 0.008, 0, Math.PI * 2);
  ctx.fill();
  drawSkyline(ctx, width, height * 0.66, height * 0.52, '#070716', 103, 0.34);
  drawSkyline(ctx, width, height * 0.78, height * 0.34, '#0b0b24', 107, 0.22);
  const water = ctx.createLinearGradient(0, height * 0.78, 0, height);
  water.addColorStop(0, '#1b2a5e');
  water.addColorStop(1, '#060614');
  ctx.fillStyle = water;
  ctx.fillRect(0, height * 0.78, width, height * 0.22);
  const random = mulberry32(113);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,209,102,${0.1 + random() * 0.25})`;
    ctx.fillRect(random() * width, height * 0.8 + random() * height * 0.16, width * 0.02, 2);
  }
  drawPalm(ctx, width * 0.05, height * 0.82, height * 0.28, -0.07, '#03030c');
}

export function paintDesertHighway(ctx, width, height) {
  skyGradient(ctx, width, height, [
    [0, '#1a0b2e'],
    [0.4, '#7e2a5e'],
    [0.62, '#e2603f'],
    [0.78, '#f7a24b'],
    [1, '#ffd98a'],
  ]);
  drawSun(ctx, width * 0.5, height * 0.6, height * 0.14, '#ff7b54', 'rgba(255,140,70,0.5)');
  // Flat-topped mesas on the horizon.
  ctx.fillStyle = '#4a1e46';
  const mesas = [
    [0.0, 0.1, 0.62, 0.1],
    [0.16, 0.2, 0.58, 0.13],
    [0.62, 0.14, 0.6, 0.09],
    [0.8, 0.22, 0.56, 0.12],
  ];
  for (const [mx, mw, my, mh] of mesas) {
    ctx.fillRect(width * mx, height * my, width * mw, height * mh);
  }
  const ground = ctx.createLinearGradient(0, height * 0.66, 0, height);
  ground.addColorStop(0, '#8a4a3a');
  ground.addColorStop(1, '#2e1226');
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.66, width, height * 0.34);
  // The highway, vanishing to the sun.
  ctx.fillStyle = '#1c1020';
  ctx.beginPath();
  ctx.moveTo(width * 0.34, height);
  ctx.lineTo(width * 0.47, height * 0.68);
  ctx.lineTo(width * 0.53, height * 0.68);
  ctx.lineTo(width * 0.66, height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, height * 0.008);
  ctx.setLineDash([height * 0.035, height * 0.03]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.7);
  ctx.lineTo(width * 0.5, height);
  ctx.stroke();
  ctx.setLineDash([]);
  // Cacti silhouettes.
  ctx.fillStyle = '#220e2a';
  drawCactus(ctx, width * 0.12, height * 0.86, height * 0.2);
  drawCactus(ctx, width * 0.86, height * 0.9, height * 0.24);
  drawCactus(ctx, width * 0.76, height * 0.78, height * 0.12);
}

export function drawCactus(ctx, x, y, size) {
  ctx.fillRect(x - size * 0.05, y - size, size * 0.1, size);
  ctx.fillRect(x - size * 0.22, y - size * 0.62, size * 0.09, size * 0.3);
  ctx.fillRect(x - size * 0.22, y - size * 0.62, size * 0.27, size * 0.09);
  ctx.fillRect(x + size * 0.13, y - size * 0.75, size * 0.09, size * 0.34);
  ctx.fillRect(x + size * 0.13, y - size * 0.75, size * 0.27, size * 0.09);
  ctx.beginPath();
  ctx.arc(x, y - size, size * 0.05, Math.PI, 0);
  ctx.fill();
}

export const SCENES = [
  { id: 'beach', name: 'Sunset Beach', paint: paintSunsetBeach },
  { id: 'neon', name: 'Neon Street', paint: paintNeonStreet },
  { id: 'skyline', name: 'Night Skyline', paint: paintNightSkyline },
  { id: 'desert', name: 'Desert Highway', paint: paintDesertHighway },
];

export function paintScene(ctx, sceneId, width, height) {
  const scene = SCENES.find((s) => s.id === sceneId) || SCENES[0];
  scene.paint(ctx, width, height);
}

// ---------------------------------------------------------------------------
// The demo "photo": a flat-illustration portrait — a confident woman with
// big sunglasses and gold hoops, leaning on a vintage red convertible on a
// palm-lined beach boulevard at golden hour. Drawn, not photographed, so
// the app ships no photo files and the demo is identical on every machine.
// ---------------------------------------------------------------------------

let demoPhotoCache = null;

export function getDemoPhoto() {
  if (demoPhotoCache) return demoPhotoCache;
  // Landscape on purpose: the hero photo is cover-fitted into wide,
  // square and portrait panels, and a landscape portrait keeps the woman
  // and the car inside every crop. The subject sits right of centre and
  // in the upper two thirds, so no crop cuts her off.
  const width = 1200;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paintDemoPortrait(ctx, width, height);
  demoPhotoCache = canvas;
  return canvas;
}

export function paintDemoPortrait(ctx, width, height) {
  skyGradient(ctx, width, height, [
    [0, '#3b1d5e'],
    [0.4, '#c94b7c'],
    [0.62, '#ff7e5f'],
    [1, '#ffc46b'],
  ]);
  drawSun(ctx, width * 0.3, height * 0.32, height * 0.16, '#ff5e62', 'rgba(255,140,80,0.5)');
  // Distant boulevard buildings, low and out of the subject's way.
  ctx.fillStyle = '#57204e';
  ctx.fillRect(0, height * 0.48, width * 0.12, height * 0.16);
  ctx.fillRect(width * 0.9, height * 0.46, width * 0.1, height * 0.18);
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(width * 0.02 + i * width * 0.035, height * 0.51 + (i % 2) * height * 0.04, width * 0.018, height * 0.025);
    ctx.fillRect(width * 0.92 + i * width * 0.03, height * 0.49 + (i % 2) * height * 0.04, width * 0.016, height * 0.025);
  }
  // Sea strip and road.
  const sea = ctx.createLinearGradient(0, height * 0.6, 0, height * 0.68);
  sea.addColorStop(0, '#ff9a5c');
  sea.addColorStop(1, '#7e2a5e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, height * 0.6, width, height * 0.08);
  ctx.fillStyle = '#2e1a33';
  ctx.fillRect(0, height * 0.68, width, height * 0.32);
  ctx.strokeStyle = 'rgba(255,226,89,0.9)';
  ctx.lineWidth = Math.max(3, height * 0.008);
  ctx.setLineDash([height * 0.045, height * 0.035]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.7);
  ctx.lineTo(width * 0.5, height);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPalm(ctx, width * 0.05, height * 0.74, height * 0.36, -0.09, '#1d0b2e');
  drawPalm(ctx, width * 0.97, height * 0.76, height * 0.32, 0.1, '#1d0b2e');
  drawConvertible(ctx, width * 0.26, height * 0.74, width * 0.66, height * 0.2);
  drawPortraitWoman(ctx, width * 0.68, height * 0.68, height * 0.3);
}

function drawConvertible(ctx, x, y, width, height) {
  // Vintage red convertible, side view, parked on the boulevard.
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#a4133c';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(0, height * 0.42);
  ctx.quadraticCurveTo(width * 0.02, height * 0.3, width * 0.1, height * 0.28);
  ctx.lineTo(width * 0.34, height * 0.26);
  ctx.quadraticCurveTo(width * 0.42, height * 0.26, width * 0.46, height * 0.34);
  ctx.lineTo(width * 0.62, height * 0.34);
  ctx.quadraticCurveTo(width * 0.78, height * 0.36, width * 0.92, height * 0.44);
  ctx.lineTo(width, height * 0.5);
  ctx.lineTo(width, height * 0.72);
  ctx.closePath();
  ctx.fill();
  // Windshield and cabin.
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(width * 0.36, height * 0.28);
  ctx.lineTo(width * 0.44, height * 0.36);
  ctx.lineTo(width * 0.6, height * 0.36);
  ctx.lineTo(width * 0.58, height * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5c0a24';
  ctx.fillRect(width * 0.12, height * 0.3, width * 0.2, height * 0.14);
  // Chrome bumper and trim.
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, height * 0.68, width, height * 0.05);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(width * 0.06, height * 0.5, width * 0.05, height * 0.06);
  // Wheels.
  for (const wx of [width * 0.2, width * 0.8]) {
    ctx.fillStyle = '#14090f';
    ctx.beginPath();
    ctx.arc(wx, height * 0.74, height * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.arc(wx, height * 0.74, height * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPortraitWoman(ctx, x, y, size) {
  // Flat-illustration portrait: head, dark wavy hair, big sunglasses,
  // gold hoop earrings, white linen shirt over a black tee.
  ctx.save();
  ctx.translate(x, y);
  // Shoulders / shirt.
  ctx.fillStyle = '#f4ede1';
  ctx.beginPath();
  ctx.moveTo(-size * 0.34, size * 0.42);
  ctx.quadraticCurveTo(-size * 0.36, size * 0.05, -size * 0.16, -size * 0.02);
  ctx.lineTo(size * 0.16, -size * 0.02);
  ctx.quadraticCurveTo(size * 0.36, size * 0.05, size * 0.34, size * 0.42);
  ctx.closePath();
  ctx.fill();
  // Black tee V.
  ctx.fillStyle = '#17121a';
  ctx.beginPath();
  ctx.moveTo(-size * 0.09, -size * 0.02);
  ctx.lineTo(size * 0.09, -size * 0.02);
  ctx.lineTo(0, size * 0.16);
  ctx.closePath();
  ctx.fill();
  // Neck and head.
  ctx.fillStyle = '#c98a5e';
  ctx.fillRect(-size * 0.05, -size * 0.1, size * 0.1, size * 0.1);
  ctx.beginPath();
  ctx.arc(0, -size * 0.24, size * 0.17, 0, Math.PI * 2);
  ctx.fill();
  // Hair: dark waves framing the face.
  ctx.fillStyle = '#241019';
  ctx.beginPath();
  ctx.arc(0, -size * 0.28, size * 0.185, Math.PI * 0.95, Math.PI * 2.05);
  ctx.quadraticCurveTo(size * 0.2, -size * 0.08, size * 0.15, size * 0.02);
  ctx.lineTo(size * 0.1, -size * 0.14);
  ctx.quadraticCurveTo(size * 0.05, -size * 0.3, 0, -size * 0.3);
  ctx.quadraticCurveTo(-size * 0.05, -size * 0.3, -size * 0.1, -size * 0.14);
  ctx.lineTo(-size * 0.15, size * 0.02);
  ctx.quadraticCurveTo(-size * 0.2, -size * 0.08, -size * 0.185, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  // Big sunglasses.
  ctx.fillStyle = '#0d0a12';
  ctx.beginPath();
  ctx.ellipse(-size * 0.075, -size * 0.24, size * 0.062, size * 0.05, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.075, -size * 0.24, size * 0.062, size * 0.05, 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-size * 0.02, -size * 0.255, size * 0.04, size * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1.5, size * 0.008);
  ctx.beginPath();
  ctx.moveTo(-size * 0.11, -size * 0.26);
  ctx.lineTo(-size * 0.05, -size * 0.235);
  ctx.moveTo(size * 0.11, -size * 0.26);
  ctx.lineTo(size * 0.05, -size * 0.235);
  ctx.stroke();
  // Gold hoop earrings.
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.beginPath();
  ctx.arc(-size * 0.165, -size * 0.16, size * 0.035, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.165, -size * 0.16, size * 0.035, 0, Math.PI * 2);
  ctx.stroke();
  // Smile.
  ctx.strokeStyle = '#7a3b2e';
  ctx.lineWidth = Math.max(2, size * 0.01);
  ctx.beginPath();
  ctx.arc(0, -size * 0.15, size * 0.045, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Warm rim light on the sun side.
  ctx.strokeStyle = 'rgba(255,190,90,0.9)';
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.beginPath();
  ctx.arc(size * 0.02, -size * 0.24, size * 0.172, -Math.PI * 0.45, Math.PI * 0.28);
  ctx.stroke();
  ctx.restore();
}
