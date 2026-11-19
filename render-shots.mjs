// Renders screenshots/ for Vice Cover Studio from shots.json.
// Serves app/ locally, screenshots each ?shot= scene with the headless
// Chromium shell, then converts the PNGs to JPEGs inside the gate's limits
// (long side <= 1280 px, short side >= 480 px, <= 256 KiB each).
// Usage: node render-shots.mjs   (writes screenshots/*.jpg)
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const chrome = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell');
const shots = JSON.parse(readFileSync(join(dir, 'shots.json'), 'utf8'));
const port = 8901;
const tmpDir = '/tmp/vice-shots';
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
mkdirSync(join(dir, 'screenshots'), { recursive: true });

const server = spawn('node', ['serve.ts', '--port', String(port)], { cwd: dir, stdio: 'ignore' });
async function waitForServer(tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('serve.ts did not come up');
}

try {
  await waitForServer();
  for (const shot of shots) {
    const png = join(tmpDir, shot.name.replace(/\.jpg$/, '.png'));
    execFileSync(chrome, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.w},${shot.h}`,
      '--virtual-time-budget=9000',
      `--screenshot=${png}`,
      `http://127.0.0.1:${port}/${shot.query}`,
    ], { stdio: 'inherit' });
    console.log('shot png:', png);
  }
} finally {
  server.kill();
}

// PNG -> JPEG (quality 82), verifying the gate's size limits.
const py = `
import sys
from PIL import Image
import os, json
shots = json.load(open(${JSON.stringify(join(dir, 'shots.json'))}))
for s in shots:
    src = os.path.join(${JSON.stringify(tmpDir)}, s['name'].replace('.jpg', '.png'))
    dst = os.path.join(${JSON.stringify(join(dir, 'screenshots'))}, s['name'])
    im = Image.open(src).convert('RGB')
    im.save(dst, 'JPEG', quality=82)
    size = os.path.getsize(dst)
    print(f"{s['name']}: {im.size[0]}x{im.size[1]} {size} bytes")
    assert max(im.size) <= 1280, 'long side too big'
    assert min(im.size) >= 480, 'short side too small'
    assert size <= 262144, 'over 256 KiB'
print('all screenshots within limits')
`;
execFileSync('python3', ['-c', py], { stdio: 'inherit' });
if (!shots.every((s) => existsSync(join(dir, 'screenshots', s.name)))) {
  throw new Error('a screenshot is missing');
}
console.log('done');
