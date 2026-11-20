// Vice Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: copies app/ and screenshots/ from beside this file
// into /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the kit's vendored buildDossier library, the
// same library the scorer rebuilds the dossier with. The program runs
// twice and must write the same bytes both times, so it copies files in a
// fixed order and never stamps a time into anything.
//
// Try it locally first:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps for this bounty (kit reference/gate.json): the
// dossier text is capped at 160 KiB, at most 4 screenshots of at most
// 256 KiB each, app/ at most 993 files and 48 MiB in all.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function fail(message) {
  throw new Error(`vice-cover-studio main.ts: ${message}`);
}

function checkEntryTree() {
  const appDir = join(repoRoot, 'app');
  if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir)
    .filter((name) => !name.startsWith('.'))
    .sort();
  if (shots.length < 3 || shots.length > 4) fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > 262144) fail(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
  }
  return shots;
}

checkEntryTree();

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, dossierOptions));
