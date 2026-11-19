// Vice Cover Studio — screenshot renderer (Node 22+, standard library only).
// Serves app/ on a throwaway port, drives headless Chrome over the DevTools
// protocol, and captures the shots from shots.json into screenshots/ as
// JPEGs inside the gate's limits (each at most 256 KiB, long side at most
// 1280, short side at least 480).
//
//   node render-shots.mjs
//
// Chrome is taken from CHROME_BIN, else /opt/meta-chromium/chrome.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const shotsFile = join(repoRoot, 'shots.json');
const shotsDir = join(repoRoot, 'screenshots');
const CHROME_BIN = process.env.CHROME_BIN ?? `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const SERVER_PORT = 8901;
const DEBUG_PORT = 9222;
const MAX_SHOT_BYTES = 262144;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits until a URL answers, or throws. */
async function waitForHttp(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error(`never answered: ${url}`);
}

/** A small DevTools protocol client over one WebSocket. */
class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.waiting = new Map();
    this.loaded = new Set();
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== undefined && this.waiting.has(message.id)) {
        const { resolve, reject } = this.waiting.get(message.id);
        this.waiting.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
        return;
      }
      if (message.method === 'Page.loadEventFired' && message.sessionId) {
        this.loaded.add(message.sessionId);
      }
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  close() {
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

/** Captures one shot: navigates, waits for the app to report ready, shoots. */
async function captureShot(cdp, shot) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  try {
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    cdp.loaded.delete(sessionId);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}${shot.url}` }, sessionId);
    const deadline = Date.now() + 25000;
    for (;;) {
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: 'window.__coverReady === true',
        returnByValue: true,
      }, sessionId);
      if (result?.value === true) break;
      if (Date.now() > deadline) throw new Error(`shot ${shot.file}: app never reported ready`);
      await sleep(250);
    }
    await sleep(400);
    let quality = 82;
    for (;;) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality }, sessionId);
      const bytes = Buffer.from(data, 'base64');
      if (bytes.length <= MAX_SHOT_BYTES || quality <= 40) {
        const out = join(shotsDir, shot.file);
        writeFileSync(out, bytes);
        return { file: shot.file, bytes: bytes.length, quality };
      }
      quality -= 12;
    }
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

async function main() {
  const { shots } = JSON.parse(readFileSync(shotsFile, 'utf8'));
  mkdirSync(shotsDir, { recursive: true });

  const server = spawn('node', ['serve.ts', '--port', String(SERVER_PORT)], {
    cwd: repoRoot, stdio: 'ignore',
  });
  const chrome = spawn(CHROME_BIN, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--no-first-run',
    '--hide-scrollbars',
    '--user-data-dir=/tmp/vice-cover-shots-profile',
    '--window-size=1280,1150',
    'about:blank',
  ], { stdio: 'ignore' });

  const stopAll = () => {
    try { chrome.kill('SIGTERM'); } catch { /* gone */ }
    try { server.kill('SIGTERM'); } catch { /* gone */ }
  };

  try {
    await waitForHttp(`http://127.0.0.1:${SERVER_PORT}/`);
    const version = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
    const cdp = new CdpClient(version.webSocketDebuggerUrl);
    await cdp.connect();
    try {
      for (const shot of shots) {
        const done = await captureShot(cdp, shot);
        console.log(`${done.file}: ${done.bytes} bytes (quality ${done.quality})`);
        if (done.bytes > MAX_SHOT_BYTES) throw new Error(`${done.file} is over the 256 KiB cap`);
      }
    } finally {
      cdp.close();
    }
    console.log(`all ${shots.length} screenshots written to screenshots/`);
  } finally {
    stopAll();
  }
}

main().catch((error) => {
  console.error(`render-shots: ${error.message}`);
  process.exit(1);
});
