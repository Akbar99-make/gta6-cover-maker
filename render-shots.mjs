// render-shots.mjs — take the entry's screenshots with headless Chrome.
// Reads shots.json, serves the app, screenshots each shot URL at its window
// size, then converts to JPEG inside the bounty limits (long side at most
// 1280, short side at least 480, at most 256 KiB) with Python/Pillow.
//
// Usage: node render-shots.mjs
//   CHROME_BIN=/path/to/chrome  (default: the Playwright-bundled Chromium)
//   PORT=8123                   (default: 8123)

import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const outDir = join(here, 'screenshots');
mkdirSync(outDir, { recursive: true });
const tmpDir = join(here, '.shots-tmp');
mkdirSync(tmpDir, { recursive: true });

const CHROME = process.env.CHROME_BIN
  || join(process.env.HOME || '', '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const PORT = process.env.PORT || '8123';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))));
  });
}

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const r = await fetch(url);
        if (r.ok) return resolve();
      } catch { /* not up yet */ }
      if (--tries <= 0) return reject(new Error('server did not come up'));
      setTimeout(tick, 250);
    };
    tick();
  });
}

// Convert + resize each raw PNG to a JPEG inside the bounty limits.
const CONVERT_PY = `
import sys, os
from PIL import Image
for png in sys.argv[1:]:
    im = Image.open(png).convert('RGB')
    w, h = im.size
    scale = min(1.0, 1280 / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    w, h = im.size
    if min(w, h) < 480:
        s = 480 / min(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    name = os.path.splitext(os.path.basename(png))[0] + '.jpg'
    out = os.path.join(os.environ['OUT_DIR'], name)
    q = 90
    while q >= 55:
        im.save(out, 'JPEG', quality=q, optimize=True)
        if os.path.getsize(out) <= 262144:
            break
        q -= 6
    print(out, im.size, os.path.getsize(out), 'bytes, quality', q)
`;

async function main() {
  const server = spawn('node', ['serve.ts'], {
    cwd: here,
    env: { ...process.env, PORT },
    stdio: 'pipe',
  });
  try {
    await waitForServer(`http://localhost:${PORT}/app/index.html`);
    for (const shot of shots) {
      const raw = join(tmpDir, shot.name.replace(/\.jpg$/i, '.png'));
      const url = `http://localhost:${PORT}/app/index.html${shot.query}`;
      await run(CHROME, [
        '--headless=new', '--disable-gpu', '--no-sandbox',
        '--hide-scrollbars', '--force-device-scale-factor=1',
        `--window-size=${shot.w},${shot.h}`,
        '--virtual-time-budget=9000',
        `--screenshot=${raw}`,
        url,
      ]);
      console.log('shot', shot.name, '->', raw);
    }
  } finally {
    server.kill();
  }

  const raws = readdirSync(tmpDir).filter((f) => f.endsWith('.png')).map((f) => join(tmpDir, f));
  await new Promise((resolve, reject) => {
    execFile('python3', ['-c', CONVERT_PY, ...raws], {
      env: { ...process.env, OUT_DIR: outDir },
    }, (err, stdout, stderr) => {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
      err ? reject(err) : resolve();
    });
  });
  console.log('done — screenshots in', outDir);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
