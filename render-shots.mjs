// Vice Cover Studio — screenshot maker (Node 22, standard library only).
//
// Serves app/ locally, loads each shot from SHOTS in headless Chromium,
// screenshots it, and converts the PNG to a JPEG inside the gate's limits
// (long side at most 1280, short side at least 480, at most 256 KiB).
// Every screenshot is drawn by the app itself in this session: a cover
// shot is the app's own cover drawn edge to edge, an editor shot is the
// app in the browser with the demo photo loaded. Nothing is edited or
// composited afterwards.
//
//   node render-shots.mjs
//
// The Chromium binary is the Playwright cache's headless shell; override
// it with CHROME_BIN. The server port can be overridden with SHOT_PORT.

import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOTS } from './app/src/shots.js';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const shotsDir = join(repoRoot, 'screenshots');
const port = Number(process.env.SHOT_PORT ?? 8123);
const chromeBin =
  process.env.CHROME_BIN ??
  join(
    process.env.HOME ?? '/root',
    '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell',
  );

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 64 * 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (error) reject(new Error(`${command} failed: ${stderr || error.message}`));
      else resolve(stdout);
    });
  });
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not answer at ${url}`);
}

// Convert a PNG screenshot to a JPEG inside the gate's limits, stepping
// the quality down until it fits 256 KiB. Prints the final dimensions.
async function pngToJpeg(pngPath, jpegPath) {
  const python = `
import sys
from PIL import Image
png_path, jpeg_path = sys.argv[1], sys.argv[2]
image = Image.open(png_path).convert('RGB')
for quality in (90, 84, 76, 68, 60, 52):
    image.save(jpeg_path, 'JPEG', quality=quality, optimize=True)
    import os
    size = os.path.getsize(jpeg_path)
    print(f"  jpeg quality={quality} size={size} bytes {image.width}x{image.height}")
    if size <= 262144:
        break
`;
  await run('python3', ['-c', python, pngPath, jpegPath]);
  const size = statSync(jpegPath).size;
  if (size > 262144) throw new Error(`${jpegPath} is ${size} bytes, still over 256 KiB`);
}

async function takeShot(shot, workDir) {
  const params = new URLSearchParams({ shot: shot.mode, ...shot.params });
  const url = `http://127.0.0.1:${port}/?${params.toString()}`;
  const pngPath = join(workDir, `${shot.name}.png`);
  const jpegPath = join(shotsDir, shot.name);
  console.log(`${shot.name} — ${shot.label}`);
  console.log(`  ${url}  (${shot.width}x${shot.height})`);
  await run(chromeBin, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${join(workDir, 'chrome-profile')}`,
    `--window-size=${shot.width},${shot.height}`,
    '--virtual-time-budget=12000',
    `--screenshot=${pngPath}`,
    url,
  ]);
  if (!existsSync(pngPath)) throw new Error(`no screenshot written for ${shot.name}`);
  await pngToJpeg(pngPath, jpegPath);
}

async function main() {
  // Start from a clean screenshots/ folder: stale shots from earlier
  // rounds must not survive beside the fresh ones (the gate allows 4).
  mkdirSync(shotsDir, { recursive: true });
  for (const name of readdirSync(shotsDir)) {
    if (/\.(png|jpe?g)$/i.test(name)) rmSync(join(shotsDir, name));
  }
  const workDir = join(tmpdir(), 'vice-cover-shots');
  mkdirSync(workDir, { recursive: true });

  const server = spawn('node', ['serve.ts'], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  try {
    await waitForServer(`http://127.0.0.1:${port}/`);
    for (const shot of SHOTS) {
      await takeShot(shot, workDir);
    }
  } finally {
    server.kill('SIGTERM');
  }

  console.log('\nScreenshots in screenshots/:');
  for (const name of readdirSync(shotsDir).sort()) {
    console.log(`  ${name} — ${statSync(join(shotsDir, name)).size} bytes`);
  }
  writeFileSync(join(workDir, 'shots-done.txt'), 'done\n');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
