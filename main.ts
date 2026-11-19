// Vice Cover Studio — the program that hands the app in (Node 22, standard
// library only). It copies app/ and screenshots/ from beside this file into
// the output directory and writes output/dossier.json with the make.fun
// library, the summary the judge reads. Outside the grader, the environment
// variable MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The caps the scorer's gate.json hands buildDossier: the text cap shapes
// the dossier's bytes, the rest only refuse an entry the scorer would.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  const repoDir = fileURLToPath(new URL('.', import.meta.url));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
  const shotsOut = join(outputDir, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoDir, 'screenshots');
  if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });
  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`Vice Cover Studio handed in: dossier.json is ${dossier.length} bytes in ${outputDir}`);
}

handIn();
