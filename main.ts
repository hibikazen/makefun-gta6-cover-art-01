// Sunset Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: copies this repository's app/ and screenshots/ into
// the output directory and writes dossier.json there with the vendored
// make.fun library, which is also the scorer's own copy — so the dossier
// the judge reads is byte for byte the one the gate rebuilds.
//
// In the grader the output directory is /output; anywhere else, set
// MAKEFUN_OUTPUT_DIR first:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIfPresent(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyIfPresent('app');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyIfPresent('screenshots');

// The scorer's caps, from the competition's reference data: the dossier
// text is capped at 160 KiB, screenshots at 4 files of 256 KiB, app/ at
// 993 files and 48 MiB with no path over 1000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
